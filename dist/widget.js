(() => {
  'use strict';
  if (document.getElementById('accessease-widget')) return;
  const key = 'accessease.preferences.v1';
  const defaults = {speech:false,rate:1,align:'original',simple:false,highlight:false,keyboard:false,focus:false,skip:false,targets:false,voice:false,switches:false,sticky:false,captions:false};
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch {}
  const state = {...defaults};
  for (const name of Object.keys(defaults)) if (typeof saved[name] === typeof defaults[name]) state[name] = saved[name];
  if (![.75,1,1.25,1.5,2].includes(state.rate)) state.rate = 1;
  if (!['original','left','center','right','justify'].includes(state.align)) state.align = 'original';
  state.speech = state.voice = state.switches = false;
  const host = document.createElement('div'); host.id = 'accessease-widget'; document.body.append(host);
  const root = host.attachShadow({mode:'open'});
  const symbol = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="6" r="3" fill="currentColor"/><path d="M6 12l10 3 10-3M16 15v7m0-1-6 9m6-9 6 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
  root.innerHTML = `<style>
  :host{all:initial;font-family:Inter,Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.5;--blue:#2563eb;--muted:#64748b;--border:#e2e8f0;--bg:#f1f5f9;--white:#fff;--navy:#092644}*{box-sizing:border-box}button,select{font:inherit}button{cursor:pointer}button:focus-visible,select:focus-visible{outline:3px solid var(--blue);outline-offset:3px}[hidden]{display:none!important}.launcher{position:fixed;right:25px;bottom:25px;width:65px;height:65px;border-radius:99px;border:0;background:var(--blue);color:var(--white);box-shadow:0 4px 12px rgba(40,116,178,.25);display:grid;place-items:center;z-index:2147483647;transition:transform .2s}.launcher:hover{transform:translateY(-3px);background:var(--navy)}svg{width:30px;height:30px}.hint{position:fixed;bottom:45px;right:105px;background:var(--white);padding:10px 15px;border:1px solid var(--border);border-radius:9px;box-shadow:0 4px 12px rgba(9,38,68,.2);font-size:12px;z-index:2147483646}.panel{position:fixed;right:25px;bottom:105px;width:400px;max-width:calc(100vw - 30px);max-height:calc(100dvh - 130px);background:var(--white);border:1px solid var(--border);border-radius:20px;box-shadow:0 8px 20px rgba(0,0,0,.18);z-index:2147483647;display:flex;flex-direction:column;overflow:hidden;animation:appear .2s ease-out}.top{padding:20px 25px;background:var(--navy);color:var(--white);display:flex;align-items:center;gap:15px}.top .logo{width:40px;height:40px;background:var(--blue);border-radius:9px;display:grid;place-items:center}.top h2{font-size:20px;line-height:1.2;margin:0 0 5px}.top p{font-size:11px;margin:0;color:#bfdbfe}.close{margin-left:auto;background:transparent;border:1px solid #64748b;color:var(--white);width:30px;height:30px;border-radius:9px;font-size:20px}.intro{padding:15px 25px 0;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--muted)}.count{color:var(--blue);background:#eff6ff;border-radius:99px;padding:5px 10px;font-weight:600}.body{overflow:auto;padding:0 20px 15px;overscroll-behavior:contain}.category{font-size:10px;letter-spacing:1.5px;color:var(--muted);margin:20px 5px 10px;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tile{border:1px solid var(--border);border-radius:9px;background:var(--white);padding:15px 10px;text-align:left;min-height:100px;position:relative;color:#0f172a}.tile:hover{background:var(--bg)}.tile[aria-pressed=true]{border-color:var(--blue);background:#eff6ff}.tile .icon{display:block;color:var(--blue);font-size:21px;line-height:1;margin-bottom:10px}.tile strong{display:block;font-size:12px;line-height:1.4;padding-right:10px;font-weight:600}.tile small{display:block;color:var(--muted);font-size:10px;margin-top:5px;line-height:1.4}.tile[aria-pressed=true]:after{content:'✓';position:absolute;top:10px;right:10px;color:var(--blue);font-weight:700}.select-row{border:1px solid var(--border);border-radius:9px;padding:10px 15px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:10px}.select-row label{font-size:12px;font-weight:600}.select-row small{display:block;font-size:10px;color:var(--muted);font-weight:400}.select-row select{max-width:140px;background:var(--bg);color:#0f172a;border:1px solid var(--border);border-radius:5px;padding:5px;font-size:12px}.footer{border-top:1px solid var(--border);padding:15px 20px}.status{font-size:11px;color:var(--muted);margin:0 0 10px;line-height:1.5;min-height:17px}.reset{width:100%;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:#0f172a;padding:10px;font-size:12px;font-weight:600}.footnote{font-size:9px;color:var(--muted);text-align:center;margin:10px 0 0}.skip{position:fixed;left:15px;top:15px;transform:translateY(-150%);background:var(--blue);color:var(--white);border:0;padding:15px 20px;border-radius:9px;z-index:2147483647}.skip:focus{transform:none}@keyframes appear{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@media(max-width:500px){.launcher{right:15px;bottom:15px;width:60px;height:60px}.panel{right:15px;bottom:90px;max-height:calc(100dvh - 110px)}.hint{display:none}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  </style><button class="skip" hidden>Skip to main content</button><div class="hint">Make this page yours <span aria-hidden="true">↘</span></div><button class="launcher" aria-label="Open accessibility settings" aria-expanded="false" aria-controls="ae-panel">${symbol}</button>
  <section class="panel" id="ae-panel" aria-label="Accessibility settings" hidden><div class="top"><div class="logo">${symbol}</div><div><h2>AccessEase</h2><p>Your page. Your pace. Your preferences.</p></div><button class="close" aria-label="Close accessibility settings">×</button></div><div class="intro"><span>Choose what works for you</span><span class="count">0 active</span></div><div class="body">
  <h3 class="category">READING & TEXT</h3><div class="grid">${tile('speech','▷','Text-to-Speech','Read page content aloud')}${tile('simple','Aa','Simplified Text Mode','Use available plain-language text')}${tile('highlight','▤','Paragraph Highlighting','Highlight a paragraph on hover')}</div>
  <div class="select-row"><label for="rate">Adjustable Reading Speed<small>Speed of the voice reader</small></label><select id="rate"><option value="0.75">0.75× · Slower</option><option value="1">1× · Normal</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2× · Faster</option></select></div>
  <div class="select-row"><label for="align">Text Alignment<small>Adjust paragraph alignment</small></label><select id="align"><option value="original">Original</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></div>
  <h3 class="category">KEYBOARD & MOTOR</h3><div class="grid">${tile('keyboard','⇥','Keyboard Navigation','Use arrow keys between controls')}${tile('focus','◎','Visible Keyboard Focus','Make the focused control stand out')}${tile('skip','↳','Skip to Main Content','Add a skip link · Press Tab')}${tile('targets','⊕','Large Click Targets','Give buttons and links more space')}${tile('voice','♩','Voice Commands','Speak commands · Microphone needed')}${tile('switches','⇆','Switch Device Support','Space: next · Enter: select')}${tile('sticky','⌘','Sticky Keys Compatibility','Sequential Ctrl, Alt, A shortcut')}</div>
  <h3 class="category">HEARING</h3><div class="grid">${tile('captions','CC','Closed Captions','Show available video subtitle tracks')}</div>
  </div><div class="footer"><p class="status" role="status" aria-live="polite">Preferences are saved in this browser.</p><button class="reset">↺ &nbsp; Reset all settings</button><p class="footnote">13 settings · Ctrl + Alt + A to open · Escape to close</p></div></section>`;
  function tile(id,icon,label,description){return `<button class="tile" data-setting="${id}" aria-pressed="false"><span class="icon" aria-hidden="true">${icon}</span><strong>${label}</strong><small>${description}</small></button>`;}
  const style = document.createElement('style'); style.id='accessease-page-styles';document.head.append(style);
  const launcher=root.querySelector('.launcher'), panel=root.querySelector('.panel');
  let recognition=null, scanned=null, scanIndex=-1, readingIndex=0, sentences=[], speechGeneration=0;
  const originals=new Map(); const latched=new Set();
  function main(){return document.querySelector('main,[role="main"]')||document.body;}
  function persist(){try{localStorage.setItem(key,JSON.stringify({...state,speech:false,voice:false,switches:false}));}catch{}}
  function status(message){root.querySelector('.status').textContent=message;}
  function openPanel(open){panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));launcher.setAttribute('aria-label',open?'Close accessibility settings':'Open accessibility settings');root.querySelector('.hint').hidden=true;if(open)root.querySelector('.close').focus();else launcher.focus();}
  launcher.addEventListener('click',()=>openPanel(panel.hidden));root.querySelector('.close').addEventListener('click',()=>openPanel(false));
  function goMain(){openPanel(false);const el=main();if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','-1');el.focus();el.scrollIntoView({behavior:'auto'});}
  root.querySelector('.skip').addEventListener('click',goMain);
  function controls(){return [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]'),...root.querySelectorAll('button,select')].filter(el=>el!==host && !el.disabled && el.tabIndex>=0 && !el.closest('[hidden]') && el.getClientRects().length && getComputedStyle(el).visibility!=='hidden');}
  function focused(){return root.activeElement||document.activeElement;}
  function move(direction){const items=controls();if(!items.length)return;const current=items.indexOf(focused());items[(current+direction+items.length)%items.length].focus();}
  function updateCaptions(){let tracks=0;document.querySelectorAll('video').forEach(v=>{for(const track of v.textTracks){if(['captions','subtitles'].includes(track.kind)){track.mode=state.captions?'showing':'disabled';tracks++;}}});return tracks;}
  function apply(){
    style.textContent=`${state.align!=='original'?`body p,body li,body blockquote{text-align:${state.align}!important}`:''}
    ${state.focus?'body :focus-visible{outline:4px solid #2563eb!important;outline-offset:5px!important;box-shadow:0 0 0 8px #bfdbfe!important}':''}
    ${state.targets?'body a,body button,body input,body select{min-height:45px!important;min-width:45px!important}body a{display:inline-flex!important;align-items:center!important;padding:5px!important}':''}
    ${state.highlight?'body p:hover,body p:focus-within{background:#bfdbfe!important;color:#0f172a!important;outline:2px solid #2563eb!important;outline-offset:5px!important;border-radius:5px}':''}
    [data-ae-scanned]{outline:4px solid #2563eb!important;outline-offset:5px!important}`;
    document.querySelectorAll('[data-simple]').forEach(el=>{if(!originals.has(el))originals.set(el,el.textContent);const desired=state.simple?el.dataset.simple:originals.get(el);if(el.textContent!==desired)el.textContent=desired;});
    root.querySelector('.skip').hidden=!state.skip;
    root.querySelectorAll('[data-setting]').forEach(el=>el.setAttribute('aria-pressed',String(state[el.dataset.setting])));
    root.querySelector('#rate').value=String(state.rate);root.querySelector('#align').value=state.align;
    const count=Object.entries(state).filter(([k,v])=>k==='rate'?v!==1:k==='align'?v!=='original':v===true).length;
    root.querySelector('.count').textContent=`${count} active`;
    updateCaptions();persist();
  }
  function stopSpeech(){speechGeneration++;if('speechSynthesis'in window)window.speechSynthesis.cancel();state.speech=false;}
  function speakNext(generation){
    if(!state.speech||generation!==speechGeneration)return;
    if(readingIndex>=sentences.length){stopSpeech();apply();status('Finished reading the page.');return;}
    const utterance=new SpeechSynthesisUtterance(sentences[readingIndex]);utterance.rate=state.rate;utterance.lang=document.documentElement.lang||'en';
    utterance.onend=()=>{if(generation===speechGeneration){readingIndex++;speakNext(generation);}};
    utterance.onerror=()=>{if(generation===speechGeneration){stopSpeech();apply();status('Voice reading could not start. Check your browser audio settings.');}};
    window.speechSynthesis.speak(utterance);
  }
  function startSpeech(){if(!('speechSynthesis'in window)){state.speech=false;status('Voice reading is unavailable in this browser.');return;}stopSpeech();state.speech=true;readingIndex=0;sentences=[...main().querySelectorAll('h1,h2,h3,p,li')].filter(el=>el.getClientRects().length).map(el=>el.textContent.trim()).filter(Boolean);status('Reading the page. Click Text-to-Speech again to stop.');speakNext(speechGeneration);}
  function stopVoice(){if(recognition){recognition.onend=null;recognition.stop();recognition=null;}state.voice=false;}
  function startVoice(){const API=window.SpeechRecognition||window.webkitSpeechRecognition;if(!API){state.voice=false;status('Voice commands are unavailable here. Try Chrome or Edge.');return;}recognition=new API();recognition.continuous=true;recognition.lang='en-US';recognition.onresult=e=>{const text=e.results[e.results.length-1][0].transcript.trim().toLowerCase();if(text.includes('scroll down'))window.scrollBy({top:450,behavior:'auto'});else if(text.includes('scroll up'))window.scrollBy({top:-450,behavior:'auto'});else if(text.includes('next'))move(1);else if(text.includes('previous'))move(-1);else if(text.includes('click')||text.includes('select'))focused()?.click();else if(text.includes('read page')){startSpeech();apply();}else if(text.includes('stop reading')){stopSpeech();apply();}else if(text.includes('close settings'))openPanel(false);else if(text.includes('open settings'))openPanel(true);else if(text.includes('reset settings'))reset();status(`Heard: “${text}”. Say next, previous, scroll down, scroll up, click, or read page.`);};recognition.onerror=e=>{stopVoice();apply();status(e.error==='not-allowed'?'Microphone permission was denied. Enable it in browser settings to use voice commands.':`Voice input stopped (${e.error}). You can turn it on again.`);};recognition.onend=()=>{recognition=null;state.voice=false;apply();status('Voice session ended. Click Voice Commands to start again.');};try{recognition.start();status('Allow the microphone, then say “scroll down”, “next”, “click”, or “read page”.');}catch{stopVoice();status('Could not start microphone input. Try again.');}}
  function clearScan(){if(scanned)scanned.removeAttribute('data-ae-scanned');scanned=null;scanIndex=-1;}
  function scan(){const items=controls();if(!items.length)return;if(scanned)scanned.removeAttribute('data-ae-scanned');scanIndex=(scanIndex+1)%items.length;scanned=items[scanIndex];scanned.setAttribute('data-ae-scanned','');scanned.focus();}
  function reset(){stopSpeech();stopVoice();clearScan();latched.clear();Object.assign(state,defaults);apply();status('All settings have been reset.');}
  root.querySelector('.reset').addEventListener('click',reset);
  root.querySelectorAll('[data-setting]').forEach(el=>el.addEventListener('click',()=>{
    const id=el.dataset.setting;state[id]=!state[id];status(`${el.querySelector('strong').textContent} ${state[id]?'enabled':'disabled'}.`);
    if(id==='speech'){if(state.speech)startSpeech();else stopSpeech();}
    if(id==='voice'){if(state.voice)startVoice();else stopVoice();}
    if(id==='switches'){clearScan();if(state.switches)status('Connect a switch that sends Space or Enter. Space moves to the next control; Enter activates it. Typing fields keep normal keyboard input.');}
    if(id==='sticky'){latched.clear();if(state.sticky)status('Press Ctrl, then Alt, then A to open the panel. This applies to the widget shortcut; system Sticky Keys remain managed by your device.');}
    if(id==='simple'&&state.simple)status(`Plain-language text applied to ${document.querySelectorAll('[data-simple]').length} supported sections. Other websites can provide data-simple text.`);
    if(id==='keyboard'&&state.keyboard)status('Tab works as usual. Arrow keys now move between links and controls, outside typing fields.');
    if(id==='captions'&&state.captions)status(updateCaptions()?'Available video captions enabled. Play the free lesson to see them.':'No caption tracks found. This website needs subtitle tracks for captions.');
    apply();
  }));
  root.querySelector('#rate').addEventListener('change',e=>{state.rate=Number(e.target.value);if(state.speech){speechGeneration++;window.speechSynthesis.cancel();speakNext(speechGeneration);}apply();status(`Voice reading speed: ${state.rate}×.`);});
  root.querySelector('#align').addEventListener('change',e=>{state.align=e.target.value;apply();status(`Paragraph alignment: ${state.align}.`);});
  document.addEventListener('keydown',e=>{
    const target=e.composedPath()[0];const typing=target.matches?.('input,textarea,select,[contenteditable="true"]');
    if(e.key==='Escape'&&!panel.hidden){e.preventDefault();openPanel(false);return;}
    if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='a'){e.preventDefault();openPanel(panel.hidden);return;}
    if(state.sticky&&!typing){if(['Control','Alt','Shift'].includes(e.key)){latched.add(e.key);return;}if(e.key.toLowerCase()==='a'&&latched.has('Control')&&latched.has('Alt')){e.preventDefault();latched.clear();openPanel(panel.hidden);return;}latched.clear();}
    if(state.switches&&!typing){if(e.code==='Space'){e.preventDefault();scan();return;}if(e.key==='Enter'&&scanned){e.preventDefault();scanned.click();return;}}
    if(state.keyboard&&!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();move(['ArrowDown','ArrowRight'].includes(e.key)?1:-1);}}
  },true);
  document.addEventListener('loadedmetadata',updateCaptions,true);
  const observer=new MutationObserver(records=>{if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1 && node!==host))){apply();}});observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pagehide',()=>{stopSpeech();stopVoice();});
  apply();
})();
