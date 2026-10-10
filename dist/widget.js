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
  const host = document.createElement('div'); host.id = 'accessease-widget'; document.body.prepend(host);
  const root = host.attachShadow({mode:'open'});
  const badgeURL = new URL('accessibility-badge.png', document.currentScript.src).href;
  const symbol = `<img src="${badgeURL}" alt="" aria-hidden="true" class="badge">`;
  root.innerHTML = `<style>
  :host{all:initial;font-family:Inter,Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.5;--blue:#2563eb;--muted:#64748b;--border:#e2e8f0;--bg:#f1f5f9;--white:#fff;--navy:#092644}*{box-sizing:border-box}button,select{font:inherit}button{cursor:pointer}button:focus-visible,select:focus-visible{outline:3px solid var(--blue);outline-offset:3px}[hidden]{display:none!important}.launcher{position:fixed;right:25px;bottom:25px;width:65px;height:65px;border-radius:99px;border:0;background:var(--blue);color:var(--white);box-shadow:0 4px 12px rgba(40,116,178,.25);display:grid;place-items:center;z-index:2147483647;transition:transform .2s}.launcher:hover{transform:translateY(-3px);background:var(--navy)}svg{width:30px;height:30px}.hint{position:fixed;bottom:45px;right:105px;background:var(--white);padding:10px 15px;border:1px solid var(--border);border-radius:9px;box-shadow:0 4px 12px rgba(9,38,68,.2);font-size:12px;z-index:2147483646}.panel{position:fixed;right:25px;bottom:105px;width:400px;max-width:calc(100vw - 30px);max-height:calc(100dvh - 130px);background:var(--white);border:1px solid var(--border);border-radius:20px;box-shadow:0 8px 20px rgba(0,0,0,.18);z-index:2147483647;display:flex;flex-direction:column;overflow:hidden;animation:appear .2s ease-out}.top{padding:20px 25px;background:var(--navy);color:var(--white);display:flex;align-items:center;gap:15px}.top .logo{width:40px;height:40px;background:var(--blue);border-radius:9px;display:grid;place-items:center}.top h2{font-size:20px;line-height:1.2;margin:0 0 5px}.top p{font-size:11px;margin:0;color:#bfdbfe}.close{margin-left:auto;background:transparent;border:1px solid #64748b;color:var(--white);width:30px;height:30px;border-radius:9px;font-size:20px}.intro{padding:15px 25px 0;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--muted)}.count{color:var(--blue);background:#eff6ff;border-radius:99px;padding:5px 10px;font-weight:600}.body{overflow:auto;padding:0 20px 15px;overscroll-behavior:contain}.category{font-size:10px;letter-spacing:1.5px;color:var(--muted);margin:20px 5px 10px;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tile{border:1px solid var(--border);border-radius:9px;background:var(--white);padding:15px 10px;text-align:left;min-height:100px;position:relative;color:#0f172a}.tile:hover{background:var(--bg)}.tile[aria-pressed=true]{border-color:var(--blue);background:#eff6ff}.tile .icon{display:block;color:var(--blue);font-size:21px;line-height:1;margin-bottom:10px}.tile strong{display:block;font-size:12px;line-height:1.4;padding-right:10px;font-weight:600}.tile small{display:block;color:var(--muted);font-size:10px;margin-top:5px;line-height:1.4}.tile[aria-pressed=true]:after{content:'✓';position:absolute;top:10px;right:10px;color:var(--blue);font-weight:700}.select-row{border:1px solid var(--border);border-radius:9px;padding:10px 15px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:10px}.select-row label{font-size:12px;font-weight:600}.select-row small{display:block;font-size:10px;color:var(--muted);font-weight:400}.select-row select{max-width:140px;background:var(--bg);color:#0f172a;border:1px solid var(--border);border-radius:5px;padding:5px;font-size:12px}.footer{border-top:1px solid var(--border);padding:15px 20px}.status{font-size:11px;color:var(--muted);margin:0 0 10px;line-height:1.5;min-height:17px}.reset{width:100%;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:#0f172a;padding:10px;font-size:12px;font-weight:600}.footnote{font-size:9px;color:var(--muted);text-align:center;margin:10px 0 0}.skip{position:fixed;left:15px;top:15px;transform:translateY(-150%);background:var(--blue);color:var(--white);border:0;padding:15px 20px;border-radius:9px;z-index:2147483647}.skip:focus{transform:none}@keyframes appear{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@media(max-width:500px){.launcher{right:15px;bottom:15px;width:60px;height:60px}.panel{right:15px;bottom:90px;max-height:calc(100dvh - 110px)}.hint{display:none}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  .badge{display:block;width:100%;height:100%;object-fit:contain}.launcher,.launcher:hover{background:transparent;padding:0}.top .logo{background:transparent}.panel{height:calc(100dvh - 130px)}.top,.intro,.footer{flex-shrink:0}.body{flex:1 1 auto;min-height:0}@media(max-width:500px){.panel{height:calc(100dvh - 110px)}}
  .panel{width:740px;height:auto;max-height:calc(100dvh - 130px);border-radius:20px}.top{padding:20px 25px;gap:15px}.top .logo{width:45px;height:45px;flex-shrink:0}.top h2{font-size:22px;margin-bottom:5px}.top p{font-size:12px}.close{width:40px;height:40px;flex-shrink:0;display:grid;place-items:center;font-size:24px}.intro{padding:20px 25px 15px;gap:15px;flex-wrap:wrap;font-size:14px;color:#0f172a}.intro-title{font-weight:600}.intro-summary{display:flex;align-items:center;gap:10px}.total{font-size:12px;color:var(--muted)}.count{font-size:12px}.body{padding:0 25px 20px;scrollbar-width:thin}.grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.tile{display:grid;align-content:start;gap:5px;min-height:90px;padding:15px;border-radius:10px;transition:border-color .15s,background .15s}.tile:hover{border-color:var(--blue);background:var(--bg)}.tile .icon{margin:0;font-size:20px;line-height:1;display:flex;align-items:center;height:20px}.icon svg{width:20px;height:20px;flex-shrink:0}.tile strong{padding:0;font-size:13px;line-height:1.3}.tile small{font-size:11px;line-height:1.4;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tile[aria-pressed=true]:after{width:20px;height:20px;display:grid;place-items:center;border-radius:99px;background:var(--blue);color:var(--white);font-size:12px;top:10px;right:10px}.tile[data-setting=captions]{grid-column:1/-1;min-height:65px;grid-template-columns:30px 1fr;align-content:center;column-gap:10px}.tile[data-setting=captions] .icon{grid-row:1/3;align-self:center}.tile[data-setting=captions] strong,.tile[data-setting=captions] small{grid-column:2}.tile[data-setting=captions]:after{top:20px;right:15px}.select-row{display:block;min-height:90px;margin:0;padding:15px;border-radius:10px}.select-row label{font-size:13px;line-height:1.3}.select-row .icon{display:flex;height:20px;color:var(--blue);margin-bottom:5px}.select-row small{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.select-row select{display:block;margin-top:10px;max-width:none;width:100%;min-height:35px;padding:5px 10px;border-radius:5px;font-size:12px}.select-row[data-active=true]{border-color:var(--blue);background:#eff6ff}.footer{padding:15px 25px;background:var(--bg)}.footer-actions{display:flex;align-items:center;justify-content:space-between;gap:20px}.status{margin:0;font-size:12px;min-height:0;max-height:60px;overflow:auto;flex:1}.reset{width:auto;min-width:145px;min-height:40px;background:var(--white);white-space:nowrap;font-size:12px;padding:10px 15px}.reset:hover{border-color:var(--blue);color:var(--blue)}.footnote{text-align:left;font-size:10px;margin-top:10px}
  @media(min-width:801px) and (max-height:850px){.top{padding:15px 25px}.intro{padding-top:15px;padding-bottom:10px}.body{padding-bottom:15px}.tile,.select-row{padding:10px 15px;min-height:80px}.tile[data-setting=captions]{min-height:55px}.tile[data-setting=captions]:after{top:15px}.footer{padding:10px 25px}.select-row select{margin-top:5px}}
  @media(min-width:801px) and (max-height:700px){.tile small{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.tile{min-height:65px}.tile[data-setting=captions]{min-height:50px}.tile[data-setting=captions] .icon{grid-row:1}.top .logo{width:35px;height:35px}.top p,.footnote{display:none}}
  @media(max-width:800px){.panel{width:540px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.tile[data-setting=captions]{grid-column:1/-1}.top,.intro,.footer{padding-left:20px;padding-right:20px}.body{padding-left:20px;padding-right:20px}.footer-actions{align-items:flex-start;gap:10px}.status{font-size:11px}.reset{min-width:120px;font-size:11px}.tile strong{font-size:12px}}
  @media(max-width:500px){.panel{height:auto;max-height:calc(100dvh - 110px)}.top{padding:15px 20px}.top h2{font-size:20px}.top p{font-size:11px}.intro{padding-top:15px;padding-bottom:10px;font-size:13px}.tile,.select-row{padding:10px;min-height:90px}.tile small{font-size:10px}.intro-summary{gap:5px}.total{font-size:11px}.count{font-size:11px}.footer{padding:10px 20px}.footnote{font-size:9px}.select-row label{font-size:12px}}
  .panel{--panel-side:min(650px,calc(100vw - 50px),calc(100dvh - 130px));width:var(--panel-side);height:calc(100dvh - 120px);max-height:calc(100dvh - 120px);container-type:inline-size}.tile,.select-row{min-width:0}
  @media(max-width:500px){.panel{--panel-side:min(650px,calc(100vw - 30px),calc(100dvh - 110px));width:var(--panel-side);height:calc(100dvh - 105px);max-height:calc(100dvh - 105px)}}
  @container(max-width:540px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.top,.intro,.footer{padding-left:20px;padding-right:20px}.body{padding-left:20px;padding-right:20px}.tile,.select-row{padding:10px}.tile strong,.select-row label{font-size:12px}.footer-actions{gap:10px}.status{min-width:0;font-size:11px}.reset{min-width:120px;font-size:11px}}
  @container(max-width:400px){.top{gap:10px;padding-top:15px;padding-bottom:15px}.top .logo{width:35px;height:35px}.top h2{font-size:20px;margin:0}.top p{display:none}.intro{gap:5px;padding-top:10px;padding-bottom:10px;font-size:12px}.tile small{font-size:10px}.footer{padding-top:10px;padding-bottom:10px}.footnote{font-size:9px}}
  </style><button class="skip" hidden>Skip to main content</button><div class="hint">Make this page yours <span aria-hidden="true">↘</span></div><button class="launcher" aria-label="Open accessibility settings" aria-expanded="false" aria-controls="ae-panel">${symbol}</button>
  <section class="panel" id="ae-panel" aria-label="Accessibility settings" hidden><div class="top"><div class="logo">${symbol}</div><div><h2>AccessEase</h2><p>Your page. Your pace. Your preferences.</p></div><button class="close" aria-label="Close accessibility settings">×</button></div><div class="intro"><span class="intro-title">Choose what works for you</span><span class="intro-summary"><span class="total">13 settings</span><span class="count">0 active</span></span></div><div class="body"><div class="grid">
  ${tile('speech','speech','Text-to-Speech','Drag to highlight the text you want to hear')}${tile('simple','simple','Simplified Text Mode','Use available plain-language text')}
  <div class="select-row"><label for="rate"><span class="icon" aria-hidden="true">${settingIcon('rate')}</span>Adjustable Reading Speed<small>Speed of the voice reader</small></label><select id="rate"><option value="0.75">0.75× · Slower</option><option value="1">1× · Normal</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2× · Faster</option></select></div>
  <div class="select-row"><label for="align"><span class="icon" aria-hidden="true">${settingIcon('align')}</span>Text Alignment<small>Adjust all page text</small></label><select id="align"><option value="original">Original</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></div>
  ${tile('highlight','highlight','Paragraph Highlighting','Highlight a paragraph on hover')}${tile('keyboard','keyboard','Keyboard Navigation','Move through text and controls')}
  ${tile('focus','focus','Visible Keyboard Focus','Make the focused control stand out')}${tile('skip','skip','Skip to Main Content','Add a skip link · Press Tab')}${tile('targets','targets','Large Click Targets','Give buttons and links more space')}
  ${tile('voice','voice','Voice Commands','Speak commands · Microphone needed')}${tile('switches','switches','Switch Device Support','Space: next · Enter: select')}${tile('sticky','sticky','Sticky Keys Compatibility','Sequential Ctrl, Alt, A shortcut')}
  ${tile('captions','captions','Closed Captions','Show available video subtitle tracks')}
  </div></div><div class="footer"><div class="footer-actions"><p class="status" role="status" aria-live="polite">Your preferences are saved in this browser.</p><button class="reset">↺ &nbsp; Reset all settings</button></div><p class="footnote">Ctrl + Alt + A to open · Escape to close</p></div></section>`;
  function settingIcon(name){
    const paths={speech:'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',simple:'<path d="m3 19 6-14 6 14M5 14h8M17 10h4M19 10v9"/>',rate:'<path d="M4 18a9 9 0 1 1 16 0M12 13l4-5"/><circle cx="12" cy="13" r="1"/>',align:'<path d="M3 5h18M3 10h12M3 15h18M3 20h12"/>',highlight:'<path d="m14 4 6 6-8 8H6v-6l8-8ZM3 21h18"/>',keyboard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h1m3 0h1m3 0h1m3 0h1M6 13h1m3 0h1m3 0h1m3 0h1M7 16h10"/>',focus:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>',skip:'<path d="M5 3v12a3 3 0 0 0 3 3h11m-4-4 4 4-4 4"/>',targets:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>',voice:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',switches:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',sticky:'<path d="M9 7V5a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V7Z"/>',captions:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M10 9a3 3 0 1 0 0 6M18 9a3 3 0 1 0 0 6"/>'};
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.focus}</svg>`;
  }
  function tile(id,icon,label,description){return `<button class="tile" data-setting="${id}" aria-pressed="false" title="${description}"><span class="icon" aria-hidden="true">${settingIcon(icon)}</span><strong>${label}</strong><small>${description}</small></button>`;}
  const style = document.createElement('style'); style.id='accessease-page-styles';document.head.append(style);
  const focusStyle=document.createElement('style');root.append(focusStyle);
  const targetStyle=document.createElement('style');root.append(targetStyle);
  const launcher=root.querySelector('.launcher'), panel=root.querySelector('.panel');
  let recognition=null, scanned=null, scanIndex=-1, readingIndex=0, sentences=[], speechGeneration=0, selectedReadingText='';
  const originals=new Map(); const simpleNodes=new Map(); const simplePlaceholders=new Map(); const readingTabIndexes=new Map(); const latched=new Set();
  const simpleWording=window.AccessEaseSimpleText||{};
  function applySimpleText(){
    document.querySelectorAll('[data-simple]').forEach(el=>{
      if(!originals.has(el))originals.set(el,{html:el.innerHTML,text:el.textContent});
      const original=originals.get(el);
      if(state.simple){if(el.textContent!==el.dataset.simple)el.textContent=el.dataset.simple;}
      else if(el.textContent!==original.text)el.innerHTML=original.html;
    });
    document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el=>{
      if(!simplePlaceholders.has(el))simplePlaceholders.set(el,el.getAttribute('placeholder'));
      const original=simplePlaceholders.get(el);
      const desired=state.simple?(simpleWording[original]||original):original;
      if(el.getAttribute('placeholder')!==desired)el.setAttribute('placeholder',desired);
    });
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const parent=node.parentElement;
      if(!parent||parent.closest('script,style,noscript,[data-simple],#accessease-widget,[contenteditable="true"]'))continue;
      const original=simpleNodes.has(node)?simpleNodes.get(node):node.nodeValue;
      const plain=simpleWording[original.trim()];
      if(typeof plain!=='string')continue;
      if(!simpleNodes.has(node))simpleNodes.set(node,original);
      const desired=state.simple?original.replace(original.trim(),plain):original;
      if(node.nodeValue!==desired)node.nodeValue=desired;
    }
  }
  function main(){return document.querySelector('main,[role="main"]')||document.body;}
  function persist(){try{localStorage.setItem(key,JSON.stringify({...state,speech:false,voice:false,switches:false}));}catch{}}
  function status(message){root.querySelector('.status').textContent=message;}
  function openPanel(open){panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));launcher.setAttribute('aria-label',open?'Close accessibility settings':'Open accessibility settings');root.querySelector('.hint').hidden=true;if(open){root.querySelector('.body').scrollTop=0;root.querySelector('.close').focus({preventScroll:true});}else launcher.focus({preventScroll:true});}
  launcher.addEventListener('click',()=>openPanel(panel.hidden));root.querySelector('.close').addEventListener('click',()=>openPanel(false));
  function goMain(){openPanel(false);const el=main();if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','-1');el.focus({preventScroll:true});el.scrollIntoView({behavior:'instant',block:'start'});}
  root.querySelector('.skip').addEventListener('click',goMain);
  function controls(){return [...document.querySelectorAll('a[href],button,input,select,textarea,summary,video[controls],audio[controls],[tabindex]'),...root.querySelectorAll('button,select')].filter(el=>el!==host && !el.disabled && el.tabIndex>=0 && !el.closest('[hidden],[inert],[aria-hidden="true"],svg,picture,img,.course-art,[role="img"]') && el.getClientRects().length && getComputedStyle(el).visibility!=='hidden');}
  function focused(){return root.activeElement||document.activeElement;}
  function move(direction){const items=controls();if(!items.length)return;const current=items.indexOf(focused());const index=current<0?(direction>0?0:items.length-1):(current+direction+items.length)%items.length;items[index].focus();}
  function updateCaptions(){let tracks=0;document.querySelectorAll('video').forEach(v=>{for(const track of v.textTracks){if(['captions','subtitles'].includes(track.kind)){track.mode=state.captions?'showing':'disabled';tracks++;}}});return tracks;}
  function apply(){
    focusStyle.textContent=state.focus?'button:focus-visible,select:focus-visible{outline:4px solid #2563eb!important;outline-offset:5px!important;box-shadow:0 0 0 8px #bfdbfe!important}':'';
    targetStyle.textContent=state.targets?'button,select{min-height:45px!important;min-width:45px!important}':'';
    if(state.keyboard||state.focus){
      const targets=new Set();
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let textNode;
      while((textNode=walker.nextNode())){
        if(!/[\p{L}\p{N}]/u.test(textNode.textContent))continue;
        const parent=textNode.parentElement;
        if(!parent||parent.closest('#accessease-widget,script,style,noscript,svg,picture,img,.course-art,[role="img"],[aria-hidden="true"],[hidden],[inert],a[href],button,input,select,textarea,summary,video,audio,[contenteditable="true"],[role="button"],[role="link"]'))continue;
        const block=parent.closest('h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,caption,th,td,dt,dd,label,legend,pre');
        targets.add(block||parent);
      }
      document.querySelectorAll('video[controls],audio[controls],[role="button"],[role="link"]').forEach(el=>{
        if(!el.closest('[hidden],[inert],[aria-hidden="true"],#accessease-widget,.course-art,[role="img"]'))targets.add(el);
      });
      targets.forEach(el=>{
        if(!readingTabIndexes.has(el))readingTabIndexes.set(el,el.getAttribute('tabindex'));
        el.setAttribute('tabindex','0');el.setAttribute('data-ae-reading-target','');
      });
    }else{
      readingTabIndexes.forEach((previous,el)=>{if(previous===null)el.removeAttribute('tabindex');else el.setAttribute('tabindex',previous);el.removeAttribute('data-ae-reading-target');});
      readingTabIndexes.clear();
    }
    document.querySelectorAll('[data-ae-text-flex]').forEach(el=>el.removeAttribute('data-ae-text-flex'));
    if(state.align!=='original')document.querySelectorAll('a,button,label,span,div,p').forEach(el=>{
      if(el===host||el.closest('#accessease-widget'))return;
      const hasText=[...el.childNodes].some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
      if(!hasText)return;
      const css=getComputedStyle(el);
      if(['flex','inline-flex'].includes(css.display)&&['row','row-reverse'].includes(css.flexDirection))el.setAttribute('data-ae-text-flex','');
    });
    const flexAlignment=state.align==='center'?'center':state.align==='right'?'flex-end':'flex-start';
    style.textContent=`${state.align!=='original'?`body,body *{text-align:${state.align}!important}body [data-ae-text-flex]{justify-content:${flexAlignment}!important}`:''}
    ${state.focus?'body :focus-visible,body [data-ae-reading-target]:focus-visible{outline:4px solid #2563eb!important;outline-offset:5px!important;box-shadow:0 0 0 8px #bfdbfe!important}':''}
    ${state.targets?'body a,body button,body input,body select{min-height:45px!important;min-width:45px!important}body a{display:inline-flex!important;align-items:center!important}':''}
    ${state.highlight?'body p:hover,body p:focus-within{background:#bfdbfe!important;color:#0f172a!important;outline:2px solid #2563eb!important;outline-offset:5px!important;border-radius:5px}':''}
    ${state.keyboard?'[data-ae-reading-target]:focus{outline:3px solid #2563eb!important;outline-offset:5px!important;border-radius:5px}':''}
    [data-ae-scanned]{outline:4px solid #2563eb!important;outline-offset:5px!important}`;
    applySimpleText();
    root.querySelector('.skip').hidden=!state.skip;
    root.querySelectorAll('[data-setting]').forEach(el=>el.setAttribute('aria-pressed',String(state[el.dataset.setting])));
    root.querySelector('#rate').value=String(state.rate);root.querySelector('#align').value=state.align;
    root.querySelector('#rate').closest('.select-row').dataset.active=String(state.rate!==1);
    root.querySelector('#align').closest('.select-row').dataset.active=String(state.align!=='original');
    const count=Object.entries(state).filter(([k,v])=>k==='rate'?v!==1:k==='align'?v!=='original':v===true).length;
    root.querySelector('.count').textContent=`${count} active`;
    updateCaptions();persist();
  }
  function stopSpeech(){speechGeneration++;if('speechSynthesis'in window)window.speechSynthesis.cancel();state.speech=false;}
  function speakNext(generation){
    if(!state.speech||generation!==speechGeneration)return;
    if(readingIndex>=sentences.length){sentences=[];readingIndex=0;status('Finished reading the selected text. Highlight another passage to read it.');return;}
    const utterance=new SpeechSynthesisUtterance(sentences[readingIndex]);utterance.rate=state.rate;utterance.lang=document.documentElement.lang||'en';
    utterance.onend=()=>{if(generation===speechGeneration){readingIndex++;speakNext(generation);}};
    utterance.onerror=()=>{if(generation===speechGeneration){stopSpeech();apply();status('Voice reading could not start. Check your browser audio settings.');}};
    window.speechSynthesis.speak(utterance);
  }
  function startSpeech(){if(!('speechSynthesis'in window)){state.speech=false;status('Voice reading is unavailable in this browser.');return;}stopSpeech();state.speech=true;readingIndex=0;sentences=selectedReadingText?[selectedReadingText]:[];if(!sentences.length){status('Text-to-Speech is on. Drag to highlight the text you want to hear.');return;}status(`Reading selected text: “${selectedReadingText.slice(0,100)}${selectedReadingText.length>100?'…':''}”`);speakNext(speechGeneration);}
  function captureSelection(){const selection=window.getSelection();if(selection&&!selection.isCollapsed&&main().contains(selection.anchorNode)&&main().contains(selection.focusNode)){selectedReadingText=selection.toString().trim();return true;}return false;}
  document.addEventListener('selectionchange',captureSelection);
  document.addEventListener('pointerup',event=>{
    const target=event.composedPath()[0];if(event.composedPath().includes(host)||!main().contains(target))return;
    if(!captureSelection()){selectedReadingText='';return;}
    if(state.speech&&selectedReadingText){startSpeech();apply();}
  });
  document.addEventListener('keyup',event=>{if(event.key==='Shift'&&state.speech&&captureSelection()){startSpeech();apply();}});
  let voiceRestartTimer=null, voiceStartFailures=0;
  function normalizeVoiceText(text){return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').trim().replace(/\s+/g,' ');}
  function voiceControlName(el){
    const labelledBy=el.getAttribute('aria-labelledby');
    const label=labelledBy?labelledBy.split(/\s+/).map(id=>el.getRootNode().getElementById(id)?.textContent||'').join(' '):'';
    return el.getAttribute('aria-label')||label||el.querySelector('strong')?.textContent||
      (el.labels?[...el.labels].map(label=>label.textContent).join(' '):'')||el.textContent||el.getAttribute('title')||el.getAttribute('value')||'';
  }
  function clickableControls(){return controls().filter(el=>el.matches('a[href],button,input,select,textarea,summary,[role="button"],[role="link"]'));}
  function clickNamedVoiceControl(name){
    let target=normalizeVoiceText(name), ordinal=null;
    const position=target.match(/^(first|second|third|last)\s+(.+)$/);
    if(position){ordinal=position[1];target=position[2];}
    const candidates=clickableControls();
    let matches=candidates.filter(el=>normalizeVoiceText(voiceControlName(el))===target);
    // Allow “click the Start learning button” while preserving names containing “button”.
    if(!matches.length){target=target.replace(/^the\s+/,'').replace(/\s+(button|link)$/,'');matches=candidates.filter(el=>normalizeVoiceText(voiceControlName(el))===target);}
    if(ordinal){const index=ordinal==='last'?matches.length-1:{first:0,second:1,third:2}[ordinal];matches=matches[index]?[matches[index]]:[];}
    if(!matches.length){status(`No available button or link named “${name}”. Say “click” followed by the name shown on the page.`);return null;}
    if(matches.length>1){status(`Found ${matches.length} items named “${name}”. Say “click first ${target}” or “click second ${target}”.`);return null;}
    const el=matches[0], label=voiceControlName(el).trim();
    el.focus();el.click();return label;
  }
  function stopVoice(){
    state.voice=false;clearTimeout(voiceRestartTimer);voiceRestartTimer=null;
    const session=recognition;recognition=null;
    if(session){session.onstart=session.onresult=session.onerror=session.onend=null;try{session.abort();}catch{}}
  }
  function runVoiceCommand(transcript){
    const text=normalizeVoiceText(transcript).replace(/^please\s+|\s+please$/g,'');
    let action='';
    if(['scroll down','down'].includes(text)){window.scrollBy({top:450,behavior:'auto'});action='Scrolled down';}
    else if(['scroll up','up'].includes(text)){window.scrollBy({top:-450,behavior:'auto'});action='Scrolled up';}
    else if(['next','next item','next control'].includes(text)){move(1);action='Moved to the next item';}
    else if(['previous','previous item','previous control','back'].includes(text)){move(-1);action='Moved to the previous item';}
    else if(/^(click|select|activate)\s+/.test(text)){const label=clickNamedVoiceControl(text.replace(/^(click|select|activate)\s+(?:on\s+)?/,''));if(label===null)return;action=`Activated “${label}”`;}
    else if(['click','select','activate'].includes(text)){const el=focused();if(!clickableControls().includes(el)){status('Say “click” followed by a button or link name, for example “click Keyboard Navigation”.');return;}el.click();action='Activated the focused item';}
    else if(['read selected text','read selection','read page'].includes(text)){captureSelection();if(!selectedReadingText){status('Highlight the text first, then say “read selected text”.');return;}startSpeech();apply();action='Reading selected text';}
    else if(text==='stop reading'){stopSpeech();apply();action='Stopped reading';}
    else if(text==='close settings'){openPanel(false);action='Closed settings';}
    else if(text==='open settings'){openPanel(true);action='Opened settings';}
    else if(text==='reset settings'){reset();return;}
    else if(['stop listening','voice off'].includes(text)){stopVoice();apply();status('Voice Commands disabled.');return;}
    else{status(`Heard “${transcript.trim()}”, but no matching command. Say “scroll down”, “next”, “click”, or “open settings”.`);return;}
    // Clicking Voice Commands or Reset can disable the session; keep that status intact.
    if(state.voice)status(`Heard “${transcript.trim()}”. ${action}. Listening for your next command.`);
  }
  function queueVoiceRestart(){
    if(!state.voice)return;
    clearTimeout(voiceRestartTimer);
    voiceRestartTimer=setTimeout(()=>{voiceRestartTimer=null;if(state.voice)startVoice(true);},700);
  }
  function startVoice(restarting=false){
    const API=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!API){state.voice=false;status('Voice commands are unavailable here. Try Chrome or Edge.');return;}
    if(recognition)return;
    if(!restarting){voiceStartFailures=0;status('Waiting for the microphone. Allow microphone access when your browser asks.');}
    const session=new API();recognition=session;
    session.continuous=true;session.interimResults=false;session.lang='en-US';
    session.onstart=()=>{if(recognition!==session||!state.voice)return;voiceStartFailures=0;status('Microphone ready. Listening: say “scroll down”, “next”, “click”, or “open settings”.');};
    session.onresult=e=>{
      if(recognition!==session||!state.voice)return;
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal)runVoiceCommand(e.results[i][0].transcript);
        if(!state.voice)break;
      }
    };
    session.onerror=e=>{
      if(recognition!==session||!state.voice)return;
      if(e.error==='no-speech'){status('No speech heard yet. Still listening; say “scroll down”.');return;}
      const messages={
        'not-allowed':'Microphone access was denied. Allow the microphone in your browser site settings, then turn Voice Commands on again.',
        'service-not-allowed':'Your browser blocked speech recognition. Check browser permissions or try Chrome or Edge.',
        'audio-capture':'No working microphone was found. Check your microphone connection and browser input device.',
        'network':'The browser speech recognition service could not connect. Check your internet connection, then turn Voice Commands on again.',
        'language-not-supported':'English speech recognition is unavailable in this browser.'
      };
      stopVoice();apply();status(messages[e.error]||`Voice input stopped (${e.error}). Turn Voice Commands on again to retry.`);
    };
    session.onend=()=>{if(recognition!==session)return;recognition=null;if(state.voice){status('Reconnecting the microphone to keep listening…');queueVoiceRestart();}};
    try{session.start();}catch{
      recognition=null;session.onstart=session.onresult=session.onerror=session.onend=null;
      if(++voiceStartFailures<3){status('Retrying microphone input…');queueVoiceRestart();}
      else{stopVoice();apply();status('Microphone input could not start. Check browser microphone access, then turn Voice Commands on again.');}
    }
  }
  function clearScan(){if(scanned)scanned.removeAttribute('data-ae-scanned');scanned=null;scanIndex=-1;}
  function scan(){const items=controls();if(!items.length)return;if(scanned)scanned.removeAttribute('data-ae-scanned');scanIndex=(scanIndex+1)%items.length;scanned=items[scanIndex];scanned.setAttribute('data-ae-scanned','');scanned.focus();}
  function reset(){stopSpeech();stopVoice();clearScan();latched.clear();selectedReadingText='';sentences=[];Object.assign(state,defaults);apply();status('All settings have been reset.');}
  root.querySelector('.reset').addEventListener('click',reset);
  root.querySelectorAll('[data-setting]').forEach(el=>el.addEventListener('click',()=>{
    const id=el.dataset.setting;state[id]=!state[id];status(`${el.querySelector('strong').textContent} ${state[id]?'enabled':'disabled'}.`);
    if(id==='speech'){if(state.speech)startSpeech();else stopSpeech();}
    if(id==='voice'){if(state.voice)startVoice();else stopVoice();}
    if(id==='switches'){clearScan();if(state.switches)status('Connect a switch that sends Space or Enter. Space moves to the next control; Enter activates it. Typing fields keep normal keyboard input.');}
    if(id==='sticky'){latched.clear();if(state.sticky)status('Press and release Ctrl, then Alt, then A to open or close the panel. This shortcut also works in input fields.');}
    if(id==='simple'&&state.simple)status('Simple wording is on for headings, paragraphs, links, buttons, and labels.');
    if(id==='keyboard'&&state.keyboard)status('Navigate all page text and controls with arrow keys or Tab. Images are skipped. Use Tab to leave text fields, dropdowns, or video controls.');
    if(id==='captions'&&state.captions)status(updateCaptions()?'Available video captions enabled. Play the free lesson to see them.':'No caption tracks found. This website needs subtitle tracks for captions.');
    apply();
  }));
  root.querySelector('#rate').addEventListener('change',e=>{state.rate=Number(e.target.value);if(state.speech){speechGeneration++;window.speechSynthesis.cancel();speakNext(speechGeneration);}apply();status(`Voice reading speed: ${state.rate}×.`);});
  root.querySelector('#align').addEventListener('change',e=>{state.align=e.target.value;apply();status(`All page text alignment: ${state.align}.`);});
  let stickyAltCaptured=false;
  document.addEventListener('keydown',e=>{
    const target=e.composedPath()[0];const typing=target.closest?.('input,textarea,select,video,audio,[contenteditable="true"]');
    const shortcutA=e.code==='KeyA'||e.key.toLowerCase()==='a';
    if(e.key==='Escape'&&!panel.hidden){e.preventDefault();latched.clear();openPanel(false);return;}
    if(e.ctrlKey&&e.altKey&&shortcutA){e.preventDefault();latched.clear();if(!e.repeat)openPanel(panel.hidden);return;}
    if(state.sticky){
      if(e.key==='Control'){latched.add('Control');return;}
      if(e.key==='Alt'){
        latched.add('Alt');
        // A standalone Alt normally hands focus to the browser menu on Windows.
        // Capture it only while forming this shortcut, including its key release.
        if(latched.has('Control')||e.ctrlKey){e.preventDefault();stickyAltCaptured=true;}
        return;
      }
      if(e.key==='Shift')return;
      if(shortcutA&&latched.has('Control')&&latched.has('Alt')){e.preventDefault();latched.clear();if(!e.repeat){openPanel(panel.hidden);status('Sticky Keys shortcut activated. Press Ctrl, then Alt, then A to toggle settings again.');}return;}
      latched.clear();
    }
    if(state.switches&&!typing){if(e.code==='Space'){e.preventDefault();scan();return;}if(e.key==='Enter'&&scanned){e.preventDefault();scanned.click();return;}}
    if(state.keyboard&&!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();move(['ArrowDown','ArrowRight'].includes(e.key)?1:-1);}}
  },true);
  document.addEventListener('keyup',e=>{if(e.key==='Alt'&&stickyAltCaptured){e.preventDefault();stickyAltCaptured=false;}},true);
  window.addEventListener('blur',()=>{latched.clear();stickyAltCaptured=false;});
  document.addEventListener('loadedmetadata',updateCaptions,true);
  const observer=new MutationObserver(records=>{if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1 && node!==host))){apply();}});observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pagehide',()=>{stopSpeech();stopVoice();});
  apply();
})();
