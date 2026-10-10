import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createContentEngine } from '../visual-accessibility-widget/src/engine/contentEngine.js';
import { createReadingEngine } from '../visual-accessibility-widget/src/engine/readingEngine.js';
import { DEFAULT_SETTINGS, SPACING_PRESETS, normalizeSettings } from '../visual-accessibility-widget/src/engine/preferenceStore.js';
import { COLOR_MODES } from '../visual-accessibility-widget/src/colorVision/colorModes.js';
import { SettingsProvider, useA11ySettings } from '../AssistAccess/src/accessibility/core/SettingsContext.jsx';
import { ConfirmProvider } from '../AssistAccess/src/accessibility/core/confirm/ConfirmContext.jsx';
import { AuditProvider } from '../AssistAccess/src/accessibility/core/audit/AuditContext.jsx';
import { AltTextProvider } from '../AssistAccess/src/accessibility/features/altText/AltTextContext.jsx';
import RouteAnnouncer from '../AssistAccess/src/accessibility/features/announcements/RouteAnnouncer.jsx';
import { normalizeConfig } from '../AssistAccess/src/accessibility/config.js';
import { createStrings } from '../AssistAccess/src/accessibility/strings.js';
import { setToolbarHost } from '../AssistAccess/src/accessibility/core/dom/domPatches.js';
import { createDefaultSettings, snapshotSettingsPatch } from '../AssistAccess/src/accessibility/core/settingsSchema.js';
import { a11yFeatures } from '../AssistAccess/src/accessibility/features/registry.js';
import { getStylesText } from '../AssistAccess/src/accessibility/ui/styles/index.js';
import { FORM_STYLES, CONFIRM_STYLES } from '../AssistAccess/src/accessibility/patterns/appStyles.js';
import { summarize, parseVtt, validateImport } from './helpers.js';
import css from './team.css?inline';

const base = window.AccessEase;
const storageKey = 'accessease.team.preferences.v2';
const toolsDefault = Object.freeze({ audioTranscripts:false, summary:false, progress:false, distraction:false, steps:false, notifications:false });
const defaultNavin = createDefaultSettings();
let visual = { ...DEFAULT_SETTINGS }, tools = { ...toolsDefault }, navin = null, visualEngine, readingEngine, ui;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  visual = normalizeSettings(saved.visual);
  for (const key of Object.keys(tools)) if (typeof saved.tools?.[key] === 'boolean') tools[key] = saved.tools[key];
} catch { /* Keep defaults when storage is unavailable or invalid. */ }

const visualCards = [
  ['fontScale','Text Size','Aa'], ['contrast','High Contrast Mode','◐'], ['dark','Dark Mode','☾'],
  ['light','Light Mode','☀'], ['grayscale','Grayscale Mode','◒'], ['colorVisionMode','Color Blindness Support','◉'],
  ['spacingPreset','Text Spacing','↔'], ['magnifier','Text Magnifier','⌕'], ['highlightLinks','Highlight Links','↗'],
  ['dyslexiaFont','Dyslexia-Friendly Font','Aa'], ['readingGuide','Reading Guide','━'], ['readingMask','Reading Mask','▰'],
];
const toolCards = [
  ['audioTranscripts','Audio Transcripts','≡'], ['summary','Content Summary','☷'], ['progress','Reading Progress','◴'],
  ['distraction','Distraction-Free Mode','◈'], ['steps','Step-by-Step Guide','↳'], ['notifications','Visual Notifications','♧'],
];
const navinFeatures = a11yFeatures.filter(feature => !['reset','preferences','profiles'].includes(feature.id));

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({visual,tools})); } catch { /* Session-only preferences. */ }
}
function changedVisual(id) {
  return ['contrast','dark','light'].includes(id) ? visual.theme === id : JSON.stringify(visual[id]) !== JSON.stringify(DEFAULT_SETTINGS[id]);
}
function navinActiveCount() {
  return navinFeatures.filter(feature=>navinAdjusted(feature.id)).length;
}
function navinAdjusted(id) {
  if(!navin)return false;
  const s=navin.settings, d=defaultNavin;
  if(id==='visuals')return JSON.stringify(s.visual)!==JSON.stringify(d.visual);
  if(id==='flashing')return JSON.stringify(s.motion)!==JSON.stringify(d.motion);
  if(id==='screen-reader')return s.reader.auditEnabled!==d.reader.auditEnabled||s.reader.highlightOnJump!==d.reader.highlightOnJump;
  if(id==='announcements')return s.reader.announceVerbosity!==d.reader.announceVerbosity||s.reader.announceRouteChanges!==d.reader.announceRouteChanges||s.ui.announceOnChange!==d.ui.announceOnChange;
  if(id==='password')return s.forms.passwordToggle!==d.forms.passwordToggle;
  if(id==='error-messages')return s.forms.announceErrors!==d.forms.announceErrors;
  return false;
}
function snapshot() {
  return {base:base.getSettings(),visual:{...visual},tools:{...tools},assist:navin ? snapshotSettingsPatch(navin.settings) : {}};
}
function changeVisual(patch, message='Visual settings updated.') {
  visual=normalizeSettings({...visual,...patch});
  visualEngine.apply(visual); readingEngine.apply(visual); persist(); ui?.(); base.refresh(); base.status(message);
}
function changeTool(key, value) {
  tools={...tools,[key]:value}; persist(); ui?.(); base.refresh();
  base.status(`${toolCards.find(card=>card[0]===key)?.[1]||key} ${value?'enabled':'disabled'}.`);
}
function resetTeam() {
  changeVisual({...DEFAULT_SETTINGS},'All visual settings reset.');
  tools={...toolsDefault}; persist(); ui?.();
  navin?.actions.resetScope('all');
}
function restoreSnapshot(settings) {
  // Each module validates its own values. Imported data cannot start voice input.
  base.setSettings(settings.base||{});
  visual=normalizeSettings(settings.visual);
  tools={...toolsDefault};
  for(const key of Object.keys(tools)) if(typeof settings.tools?.[key]==='boolean')tools[key]=settings.tools[key];
  navin?.actions.applyProfile({id:'custom',label:'Imported preferences',patch:settings.assist||{}});
  changeVisual(visual,'Preferences applied.');
}

function Card({id,title,symbol='◈',active=false,children}) {
  return <details className={`team-card${active?' active':''}`} data-team-card={id}>
    <summary aria-label={`${title} options`}><span className="team-icon" aria-hidden="true">{symbol}</span><span>{title}</span><small>{active?'Adjusted':'Options'}</small></summary>
    <div className="team-options">{children}</div>
  </details>;
}
function Toggle({label,value,onChange}) {
  return <div className="team-row"><span style={{flex:1}}>{label}</span><button type="button" aria-label={label} aria-pressed={value} onClick={()=>onChange(!value)}>{value?'On':'Off'}</button></div>;
}
function Range({id,label,value,min,max,step=1,onChange,suffix=''}) {
  return <div className="team-row"><label htmlFor={`team-${id}`}>{label}</label><input id={`team-${id}`} type="range" min={min} max={max} step={step} value={value} onChange={event=>onChange(Number(event.target.value))}/><output htmlFor={`team-${id}`}>{value}{suffix}</output></div>;
}
function VisualOptions({id}) {
  if(id==='fontScale')return <><p>Resize all page text. The settings panel keeps its own size.</p><div className="team-row"><button aria-label="Decrease Text Size" disabled={visual.fontScale<=.5} onClick={()=>changeVisual({fontScale:visual.fontScale-.1})}>−</button><button aria-label="Reset Text Size" onClick={()=>changeVisual({fontScale:1})}>{Math.round(visual.fontScale*100)}%</button><button aria-label="Increase Text Size" disabled={visual.fontScale>=2} onClick={()=>changeVisual({fontScale:visual.fontScale+.1})}>+</button></div></>;
  if(['contrast','dark','light'].includes(id))return <Toggle label={visualCards.find(card=>card[0]===id)[1]} value={visual.theme===id} onChange={on=>changeVisual({theme:on?id:'default'})}/>;
  if(id==='colorVisionMode')return <div className="team-row"><label htmlFor="team-color-mode">Color palette</label><select id="team-color-mode" value={visual.colorVisionMode} onChange={event=>changeVisual({colorVisionMode:event.target.value})}>{COLOR_MODES.map(mode=><option key={mode.id} value={mode.id}>{mode.name}</option>)}</select><p>Applies accessible palette variables to supported content. Images and video keep their original colors.</p></div>;
  if(id==='spacingPreset')return <><div className="team-row"><label htmlFor="team-spacing">Spacing preset</label><select id="team-spacing" value={visual.spacingPreset} onChange={event=>changeVisual({spacingPreset:event.target.value,...(SPACING_PRESETS[event.target.value]||{}),customSpacingOverrides:[]})}>{['default','comfortable','wide','custom'].map(preset=><option key={preset}>{preset}</option>)}</select></div>{visual.spacingPreset==='custom'&&[['letterSpacing','Letter spacing',0,.2,.01,'em'],['wordSpacing','Word spacing',0,.4,.01,'em'],['lineHeight','Line height',1.2,2.5,.1,'×'],['paragraphSpacing','Paragraph gap',0,3,.1,'em']].map(([key,label,min,max,step,suffix])=><Range key={key} id={key} label={label} value={visual[key]} min={min} max={max} step={step} suffix={suffix} onChange={value=>changeVisual({[key]:value,customSpacingOverrides:[...new Set([...visual.customSpacingOverrides,key])]})}/>)}</>;
  return <><Toggle label={visualCards.find(card=>card[0]===id)[1]} value={visual[id]} onChange={value=>changeVisual({[id]:value})}/>
    {id==='magnifier'&&<div className="team-row"><label htmlFor="team-zoom">Magnification</label><select id="team-zoom" value={visual.zoomLevel} onChange={event=>changeVisual({zoomLevel:Number(event.target.value)})}>{[1.5,2,3].map(value=><option key={value} value={value}>{value}×</option>)}</select><p>Move the pointer over text or focus a text control to enlarge it.</p></div>}
    {id==='readingGuide'&&<Range id="guideHeight" label="Guide height" value={visual.guideHeight} min={2} max={24} step={2} suffix="px" onChange={value=>changeVisual({guideHeight:value})}/>}
    {id==='readingMask'&&<Range id="maskHeight" label="Reading band height" value={visual.maskHeight} min={60} max={540} step={10} suffix="px" onChange={value=>changeVisual({maskHeight:value})}/>}
    {id==='dyslexiaFont'&&<p>Uses the bundled OpenDyslexic font, including its bold and italic variants.</p>}
  </>;
}

function ReadingOverlays() {
  // Retain the existing Praveen reading engine's DOM contract inside the shared shadow root.
  return <><div className="guide" hidden/><div className="mask mask-top" hidden/><div className="mask mask-bottom" hidden/>
    <section className="magnifier" aria-label="Magnified text" hidden><p className="magnifier-text"/></section>
    <button className="overlay-close" hidden>Dismiss reading mask</button>
    {['left','right'].map(side=><div key={side} className={`reading-size-controls reading-size-${side}`} hidden>{[['guideHeight','readingGuide'],['maskHeight','readingMask']].map(([key,feature])=><button key={key} data-reading-key={key} data-reading-feature={feature} data-reading-step={side==='left'?-1:1} aria-label={`${side==='left'?'Decrease':'Increase'} ${feature==='readingGuide'?'reading guide':'reading mask'} size`} onClick={()=>changeVisual({[key]:visual[key]+(side==='left'?-1:1)*(key==='guideHeight'?2:10)})}>{side==='left'?'−':'+'}</button>)}</div>)}
    <div hidden><input data-setting="maskHeight" readOnly/><output data-output="maskHeight"/></div>
  </>;
}

function Tools({refresh}) {
  const [transcripts,setTranscripts]=useState([]), [summary,setSummary]=useState([]), [step,setStep]=useState(0), [headings,setHeadings]=useState([]), [notice,setNotice]=useState(''), [progress,setProgress]=useState(0), [timeState,setTimeState]=useState('');
  const timer=useRef();
  useEffect(()=>{
    if(!tools.audioTranscripts){setTranscripts([]);return;}
    const controller=new AbortController();
    setTranscripts([{title:'Loading transcripts…',lines:[]}]);
    async function load() {
      const result=await Promise.all([...document.querySelectorAll('video,audio')].map(async(media,index)=>{
        const title=media.getAttribute('aria-label')||`Media ${index+1}`;
        const tracks=[...media.querySelectorAll('track')].filter(track=>['captions','subtitles'].includes(track.kind));
        const existing=media.getAttribute('data-transcript');
        if(existing)return {title,lines:[existing]};
        if(!tracks.length)return {title,lines:['No transcript or caption track supplied for this media.']};
        try {
          const response=await fetch(tracks[0].src,{signal:controller.signal});
          if(!response.ok)throw new Error('Track unavailable');
          return {title,lines:parseVtt(await response.text())};
        }catch(error){return {title,lines:[error.name==='AbortError'?'Cancelled.':'Caption track could not load. Check its URL and CORS permissions.']};}
      }));
      if(!controller.signal.aborted)setTranscripts(result.length?result:[{title:'No audio or video on this page.',lines:[]}]);
    }
    load(); return ()=>controller.abort();
  },[tools.audioTranscripts,refresh]);
  useEffect(()=>{
    if(tools.summary) setSummary(summarize([...document.querySelectorAll('main p,main blockquote,[role=main] p')].filter(el=>!el.closest('[hidden],[aria-hidden=true],[data-a11ytb-injected]')&&el.getClientRects().length).map(el=>el.innerText)));
  },[tools.summary,refresh]);
  useEffect(()=>{
    if(!tools.progress){setProgress(0);return;}
    let frame;
    const measure=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>setProgress(Math.round(Math.min(100,Math.max(0,window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight)*100)))));};
    measure();window.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',measure);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',measure);window.removeEventListener('resize',measure);};
  },[tools.progress]);
  useEffect(()=>{
    if(!tools.distraction)return;
    const style=document.createElement('style');style.dataset.a11ytbInjected='';
    style.textContent='[data-ae-distraction],[data-ad],.advertisement,.ad-banner,.cookie-banner,aside:not([data-a11ytb-injected]){display:none!important}';
    document.head.append(style);return()=>style.remove();
  },[tools.distraction]);
  useEffect(()=>{
    if(!tools.steps){setHeadings([]);return;}
    setHeadings([...document.querySelectorAll('main h1,main h2,main h3,[role=main] h2')].filter(el=>el.getClientRects().length&&!el.closest('[hidden],[aria-hidden=true]')));setStep(0);
  },[tools.steps,refresh]);
  useEffect(()=>{
    if(!tools.notifications){setNotice('');return;}
    function show(text){if(!text)return;setNotice(text.slice(0,220));clearTimeout(timer.current);timer.current=setTimeout(()=>setNotice(''),5000);}
    const invalid=event=>show(event.target.validationMessage||'Check the highlighted field.');
    const observer=new MutationObserver(records=>{
      const node=records.map(record=>record.target.nodeType===1?record.target:record.target.parentElement).find(el=>el?.closest('[role=status],[role=alert],[aria-live=polite],[aria-live=assertive]'));
      if(node&&!node.closest('#accessease-widget,[data-a11ytb-injected]'))show(node.closest('[role=status],[role=alert],[aria-live]')?.textContent.trim());
    });
    observer.observe(document.body,{childList:true,characterData:true,subtree:true});document.addEventListener('invalid',invalid,true);
    return ()=>{observer.disconnect();document.removeEventListener('invalid',invalid,true);clearTimeout(timer.current);};
  },[tools.notifications]);
  function goTo(index){const next=Math.max(0,Math.min(index,headings.length-1));setStep(next);const target=headings[next];if(!target)return;const previous=target.getAttribute('tabindex');target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:'auto'});target.addEventListener('blur',()=>{previous===null?target.removeAttribute('tabindex'):target.setAttribute('tabindex',previous);},{once:true});}
  async function extendTime(){
    const callback=window.AccessEaseConfig?.extendSession;
    if(typeof callback!=='function'){setTimeState('This website has not connected a session-extension service. No timeout has been changed.');return;}
    setTimeState('Requesting 10 more minutes…');
    try{const result=await callback({minutes:10});setTimeState(result===true||result?.extended===true?'The website confirmed a 10-minute extension.':'The website did not confirm an extension.');}catch{setTimeState('The extension request failed. Please try again.');}
  }
  return <>
    {toolCards.map(([id,title,symbol])=><Card key={id} id={id} title={title} symbol={symbol} active={tools[id]}><Toggle label={title} value={tools[id]} onChange={value=>changeTool(id,value)}/>
      {id==='audioTranscripts'&&<><p>Reads supplied caption tracks or host-provided transcripts. Does not transcribe missing audio.</p>{transcripts.map((item,index)=><section key={index}><h4>{item.title}</h4>{item.lines.map((line,i)=><p key={i}>{line}</p>)}</section>)}</>}
      {id==='summary'&&<><p>Extracts up to five sentences from this page.</p>{tools.summary&&(summary.length?<ul>{summary.map((line,i)=><li key={i}>{line}</li>)}</ul>:<p>Not enough paragraph text to summarize.</p>)}</>}
      {id==='progress'&&<p>Shows how far you have scrolled through this page.</p>}
      {id==='distraction'&&<p>Hides marked ads, sidebars and cookie banners. Main content stays available.</p>}
      {id==='steps'&&<><p>Follow this page's headings in order. This does not complete form steps for you.</p>{tools.steps&&<ol>{headings.map((heading,i)=><li key={i}><button onClick={()=>goTo(i)}>{heading.textContent}</button></li>)}</ol>}</>}
      {id==='notifications'&&<p>Shows a visible, non-flashing message for form errors and page status updates.</p>}
    </Card>)}
    <Card id="timeLimits" title="Extend Session Time" symbol="◷"><p>Requires this website to provide a session-extension service.</p><button onClick={extendTime}>Request 10 more minutes</button><p role="status">{timeState}</p></Card>
    {tools.progress&&<><div className="team-progress" style={{width:`${progress}%`}}/><div className="team-progress-label">{progress}% read</div></>}
    {tools.steps&&headings.length>0&&<div className="team-step"><button disabled={step===0} aria-label="Previous guide step" onClick={()=>goTo(step-1)}>←</button><span>{step+1}/{headings.length} · {headings[step]?.textContent}</span><button disabled={step===headings.length-1} aria-label="Next guide step" onClick={()=>goTo(step+1)}>→</button></div>}
    {notice&&<div className="team-toast">{notice}</div>}
  </>;
}

function Preferences() {
  const [message,setMessage]=useState(''), [profileName,setProfileName]=useState(''), [profiles,setProfiles]=useState(()=>{
    try{const value=JSON.parse(localStorage.getItem('accessease.team.profiles.v2')||'[]');return Array.isArray(value)?value.slice(0,10).filter(item=>typeof item.name==='string'&&item.settings):[];}catch{return [];}
  });
  function exportSettings(){const link=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify({kind:'accessease-preferences',version:2,settings:snapshot()},null,2)],{type:'application/json'}));link.href=url;link.download='accessease-preferences.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Preferences exported. No page input values are included.');}
  async function importSettings(event){const file=event.target.files?.[0];if(!file)return;try{if(file.size>100000)throw new Error('Preferences file must be smaller than 100 KB.');restoreSnapshot(validateImport(JSON.parse(await file.text())));setMessage('Preferences imported for all features.');}catch(error){setMessage(error.message);}event.target.value='';}
  function builtIn(id){base.reset();if(id==='reading'){changeVisual({...SPACING_PRESETS.comfortable,spacingPreset:'comfortable',dyslexiaFont:true});base.setSettings({focus:true});}if(id==='lowMotion'){navin.actions.applyProfile({id:'reducedMotion',label:'Reduced motion',patch:{motion:{reduceMotion:'on',pauseAnimations:true,pauseAutoMedia:true}}});}if(id==='contrast'){changeVisual({theme:'contrast'});base.setSettings({focus:true,targets:true});}}
  function saveProfile(){const name=profileName.trim().slice(0,50);if(!name)return;const next=[...profiles.filter(profile=>profile.name!==name),{name,settings:snapshot()}].slice(-10);setProfiles(next);try{localStorage.setItem('accessease.team.profiles.v2',JSON.stringify(next));setMessage('Profile saved.');}catch{setMessage('Profile is available for this visit; browser storage is unavailable.');}setProfileName('');}
  return <><Card id="preferences" title="Saved Preferences" symbol="⇄"><p>Export or import preferences for all four modules together. Microphone and speech playback require a new user action.</p><div className="team-row"><button onClick={exportSettings}>Export preferences</button><label htmlFor="team-import">Import preferences</label><input id="team-import" type="file" accept=".json,application/json" onChange={importSettings}/></div><p role="status">{message}</p></Card>
    <Card id="profiles" title="Accessibility Profiles" symbol="◉"><div className="team-row">{[['default','Default'],['reading','Comfortable reading'],['lowMotion','Reduced motion'],['contrast','Enhanced contrast']].map(([id,label])=><button key={id} onClick={()=>builtIn(id)}>{label}</button>)}</div><div className="team-row"><label htmlFor="team-profile-name">Save current preferences as</label><input id="team-profile-name" maxLength={50} value={profileName} onChange={event=>setProfileName(event.target.value)}/><button disabled={!profileName.trim()} onClick={saveProfile}>Save profile</button></div>{profiles.map(profile=><button style={{margin:5}} key={profile.name} onClick={()=>restoreSnapshot(profile.settings)}>{profile.name}</button>)}</Card></>;
}

function UnifiedControls() {
  const context=useA11ySettings();navin=context;
  const [revision,setRevision]=useState(0), [refresh,setRefresh]=useState(0);
  ui=()=>setRevision(value=>value+1);
  useEffect(()=>{
    visualEngine=createContentEngine({root:document.body,host:base.host});
    readingEngine=createReadingEngine({shadow:base.root,root:document.body,update:changeVisual});
    visualEngine.apply(visual);readingEngine.apply(visual);
    base.registerExtension({activeCount:()=>visualCards.filter(([id])=>changedVisual(id)).length+Object.values(tools).filter(Boolean).length+navinActiveCount(),reset:resetTeam});
    window.AccessEaseTeam={getSettings:snapshot,setSettings:restoreSnapshot,reset:()=>base.reset(),refresh:()=>setRefresh(value=>value+1)};
    base.host.dataset.teamReady='true';
    base.host.dispatchEvent(new CustomEvent('accessease:ready'));
    const listen=()=>setRevision(value=>value+1);
    base.host.addEventListener('accessease:change',listen);
    return()=>{base.host.removeEventListener('accessease:change',listen);readingEngine.destroy();visualEngine.destroy();};
  },[]);
  useEffect(()=>{base.refresh();},[context.settings]);
  return <><RouteAnnouncer/>{visualCards.map(([id,title,symbol])=><Card key={id} id={id} title={title} symbol={symbol} active={changedVisual(id)}><VisualOptions id={id}/></Card>)}
    <Tools refresh={refresh}/>
    {navinFeatures.map(({id,title,Panel})=><Card key={id} id={id} title={title} active={navinAdjusted(id)}><Panel/></Card>)}
    <Preferences/><ReadingOverlays/>
  </>;
}

if(base&&!base.host.dataset.teamReady){
  // Full-viewport click-through host also keeps fixed controls stable under page filters.
  Object.assign(base.host.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'2147483647'});
  setToolbarHost(base.host);
  const style=document.createElement('style');style.textContent=getStylesText()+FORM_STYLES+CONFIRM_STYLES+css;base.root.append(style);
  const mount=document.createElement('div');mount.className='team-mount';base.root.querySelector('.grid').append(mount);
  const search=document.createElement('div');search.className='team-search';search.innerHTML='<label for="team-search">Search accessibility settings</label><input id="team-search" type="search" placeholder="Search settings…" autocomplete="off">';
  base.root.querySelector('.intro').after(search);
  const empty=document.createElement('p');empty.className='team-empty';empty.hidden=true;empty.textContent='No matching settings. Try another word.';base.root.querySelector('.body').append(empty);
  const filter=()=>{const query=search.querySelector('input').value.trim().toLowerCase();const cards=[...base.root.querySelectorAll('.grid>.tile,.grid>.select-row,.team-card')];let matches=0;cards.forEach(card=>{const label=card.querySelector('strong,label,summary')?.textContent||'';card.hidden=!label.toLowerCase().includes(query);if(!card.hidden)matches++;});empty.hidden=matches!==0;};
  search.querySelector('input').addEventListener('input',filter);
  const total=13+visualCards.length+toolCards.length+1+navinFeatures.length+2;
  base.root.querySelector('.total').textContent=`${total} settings`;
  base.root.querySelector('.top p').textContent='One panel. Your preferences. Every page.';
  const config=normalizeConfig({...window.AccessEaseConfig?.assist,storageKeyPrefix:'accessease.team.assist.v2'});
  const strings=createStrings(config.strings);
  createRoot(mount).render(<SettingsProvider config={config} strings={strings}><ConfirmProvider><AuditProvider><AltTextProvider><UnifiedControls/></AltTextProvider></AuditProvider></ConfirmProvider></SettingsProvider>);
}
