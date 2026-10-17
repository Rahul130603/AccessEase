import { panelDictionaries } from './panelDictionaries.js';

// Popular visitor languages, including Tamil and Hindi; flags are visual hints,
// while native language names remain the accessible labels.
export const PANEL_LANGUAGES = [
  ['en','English','us'], ['ta','தமிழ்','in'], ['hi','हिन्दी','in'],
  ['es','Español','es'], ['fr','Français','fr'], ['de','Deutsch','de'],
  ['pt','Português','br'], ['ar','العربية','eg'], ['zh','中文','cn'],
  ['ja','日本語','jp'], ['ko','한국어','kr'], ['ru','Русский','ru'],
  ['it','Italiano','it'], ['nl','Nederlands','nl'], ['tr','Türkçe','tr'],
  ['id','Bahasa Indonesia','id'], ['vi','Tiếng Việt','vn'],
  ['bn','বাংলা','bd'], ['te','తెలుగు','in'], ['mr','मराठी','in'],
];
const languageKey = 'accessease.panel.language.v1';
const normalize = text => text.replace(/\s+/g,' ').trim().toLowerCase();
const lookups = Object.fromEntries(Object.entries(panelDictionaries).map(([code,entries]) => [code,
  Object.fromEntries(Object.entries(entries).map(([key,value]) => [normalize(key),value]))]));

export function translatePanelText(text, code) {
  if (code === 'en' || !lookups[code]) return text;
  const dictionary = lookups[code], key = normalize(text);
  let translated = dictionary[key];
  if (!translated) {
    const aliases={'comfortable reading':'comfortable','reduced motion':'reduce motion','enhanced contrast':'high contrast mode','save current preferences as':'profile name','reset visual adjustments':'reset visual settings','normal / default':'normal','apply visual adjustments':'brightness, contrast and saturation','custom values':'custom','grayscale':'grayscale mode','high distinction / monochrome':'grayscale mode'};
    if(aliases[key])translated=dictionary[aliases[key]];
    const count = key.match(/^(\d+) (settings|active)$/);
    const speed = text.trim().match(/^([\d.]+×\s*·\s*)(.+)$/);
    const options = key.match(/^(.*) options$/);
    const review = key.match(/^(\d+) items to review\.$/);
    const palette = key.match(/^(protanopia|deuteranopia|tritanopia) support$/);
    if (translated) { /* alias above */ }
    else if (count) translated = `${count[1]} ${dictionary[count[2]]}`;
    else if (speed) translated = speed[1] + translatePanelText(speed[2],code);
    else if (options && dictionary[options[1]]) translated = `${dictionary[options[1]]} — ${dictionary.options}`;
    else if(review)translated=dictionary['{count} items to review.']?.replace('{count}',review[1]);
    else if(palette)translated=`${text.trim().split(' ')[0]} — ${dictionary['color blindness support']}`;
    else if (key.startsWith('↺')) translated = `↺ ${dictionary['reset all settings']}`;
    else if (key === 'search accessibility settings…') translated = dictionary['search accessibility settings'] + '…';
    else if (key === 'close accessibility settings') translated = dictionary.close;
    else if (key === 'accessibility settings') translated = dictionary.settings;
    else if (key === 'export') translated = dictionary['export preferences'];
    else if (key === 'import') translated = dictionary['import preferences'];
    else if (key === 'reset') translated = dictionary['reset all settings'];
  }
  if (!translated) return text;
  return text.match(/^\s*/)[0] + translated + text.match(/\s*$/)[0];
}

export function flagImage(country) {
  const bands = (colors,vertical=false) => colors.map((color,i)=>`<rect fill="${color}" x="${vertical?i*30/colors.length:0}" y="${vertical?0:i*20/colors.length}" width="${vertical?30/colors.length:30}" height="${vertical?20:20/colors.length}"/>`).join('');
  const flags = {
    in: bands(['#ff9933','#fff','#138808'])+'<circle cx="15" cy="10" r="2.5" fill="none" stroke="#000080" stroke-width=".6"/><path d="M12.5 10h5M15 7.5v5M13.2 8.2l3.6 3.6m-3.6 0 3.6-3.6" stroke="#000080" stroke-width=".4"/>',
    us: bands(Array.from({length:13},(_,i)=>i%2?'#fff':'#b22234'))+'<rect width="13" height="11" fill="#3c3b6e"/>'+Array.from({length:20},(_,i)=>`<circle cx="${1.5+(i%5)*2.5}" cy="${1.5+Math.floor(i/5)*2.5}" r=".5" fill="#fff"/>`).join(''),
    fr: bands(['#002395','#fff','#ed2939'],true), de: bands(['#000','#d00','#ffce00']),
    it: bands(['#009246','#fff','#ce2b37'],true), nl: bands(['#ae1c28','#fff','#21468b']),
    ru: bands(['#fff','#0039a6','#d52b1e']), id: bands(['#ce1126','#fff']),
    es: '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/><path d="M8 8h4v5H8z" fill="#aa151b"/>',
    br: '<rect width="30" height="20" fill="#009739"/><path d="M15 2 28 10 15 18 2 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="5" fill="#002776"/><path d="M10 9q5-1 10 3" fill="none" stroke="#fff"/>',
    eg: bands(['#ce1126','#fff','#000'])+'<path d="m13 8 2 1 2-1v4l-2 1-2-1z" fill="#c09300"/>',
    cn: '<rect width="30" height="20" fill="#de2910"/><path d="m6 3 1 3h3L7.5 8l1 3L6 9l-2.5 2 1-3L2 6h3z" fill="#ffde00"/><g fill="#ffde00"><circle cx="12" cy="3" r=".8"/><circle cx="14" cy="6" r=".8"/><circle cx="14" cy="9" r=".8"/><circle cx="12" cy="12" r=".8"/></g>',
    jp: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>',
    kr: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5" fill="#cd2e3a"/><path d="M10 10a5 5 0 0 0 10 0q-2.5 4-5 0t-5 0" fill="#0047a0"/><path d="m5 3 4 3m-5-1 4 3m13-5-4 3m5-1-4 3M5 15l4 3m-5-1 4 3m13-5-4 3m5-1-4 3" stroke="#000" stroke-width=".8"/>',
    tr: '<rect width="30" height="20" fill="#e30a17"/><circle cx="12" cy="10" r="6" fill="#fff"/><circle cx="14" cy="10" r="5" fill="#e30a17"/><path d="m20 7 1 2h2l-1.5 1.5.5 2-2-1-2 1 .5-2L17 9h2z" fill="#fff"/>',
    vn: '<rect width="30" height="20" fill="#da251d"/><path d="m15 3 2 5h5l-4 3 2 6-5-4-5 4 2-6-4-3h5z" fill="#ff0"/>',
    bd: '<rect width="30" height="20" fill="#006a4e"/><circle cx="13" cy="10" r="6" fill="#f42a41"/>',
  };
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20">${flags[country]}</svg>`);
}

export function installPanelLanguage(base, {onChange=()=>{}}={}) {
  const panel=base.root.querySelector('.panel'), doc=panel.ownerDocument, view=doc.defaultView;
  let language='en';
  try { const saved=view.localStorage.getItem(languageKey); if(PANEL_LANGUAGES.some(([code])=>code===saved))language=saved; } catch {}
  const originals=new WeakMap(), attributes=new WeakMap();
  const row=doc.createElement('div'); row.className='panel-language'; row.dataset.panelLanguage='';
  const label=doc.createElement('span');label.id='panel-language-label';label.textContent='Language';
  const button=doc.createElement('button');button.type='button';button.className='panel-language-toggle';
  button.setAttribute('aria-labelledby',label.id+' panel-language-value');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','panel-language-list');
  const selected=doc.createElement('span');selected.id='panel-language-value';
  const list=doc.createElement('div');list.id='panel-language-list';list.className='panel-language-list';list.setAttribute('role','listbox');list.setAttribute('aria-labelledby',label.id);list.hidden=true;
  function image(country){const img=doc.createElement('img');img.src=flagImage(country);img.alt='';img.width=30;img.height=20;return img;}
  const selectedFlag=image('us');button.append(selectedFlag,selected);row.append(label,button,list);
  panel.querySelector('.top').after(row);
  function close(){list.hidden=true;button.setAttribute('aria-expanded','false');}
  function source(node){const value=node.data, saved=originals.get(node);return saved&&value===saved.translated?saved.original:value;}
  function refresh(){
    observer.disconnect();
    panel.lang=language;
    const current=PANEL_LANGUAGES.find(([code])=>code===language);selected.textContent=current[1];selectedFlag.src=flagImage(current[2]);
    list.querySelectorAll('[role=option]').forEach(option=>option.setAttribute('aria-selected',String(option.dataset.language===language)));
    onChange();
    const walker=doc.createTreeWalker(panel,view.NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('[data-panel-language],style,script,textarea,[data-panel-original-content],.consumer-results li strong'))continue;
      const original=source(node), translated=translatePanelText(original,language);
      // Options without explicit values must keep their original setting values.
      if(node.parentElement?.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.value=node.parentElement.textContent;
      originals.set(node,{original,translated});if(node.data!==translated)node.data=translated;
    }
    for(const element of panel.querySelectorAll('[aria-label],[placeholder],[title]')){
      if(element.closest('[data-panel-language],[data-panel-original-content]'))continue;
      const saved=attributes.get(element)||{};
      for(const name of ['aria-label','placeholder','title']){
        if(!element.hasAttribute(name))continue;
        const value=element.getAttribute(name), record=saved[name];
        const original=record&&value===record.translated?record.original:value;
        const translated=translatePanelText(original,language);saved[name]={original,translated};
        if(value!==translated)element.setAttribute(name,translated);
      }
      attributes.set(element,saved);
    }
    label.textContent=translatePanelText('Language',language);
    observer.observe(panel,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});
  }
  function setLanguage(code){
    if(!PANEL_LANGUAGES.some(([id])=>id===code))return;
    language=code;try{view.localStorage.setItem(languageKey,code);}catch{}
    close();refresh();
  }
  for(const [code,name,country] of PANEL_LANGUAGES){
    const option=doc.createElement('button');option.type='button';option.setAttribute('role','option');option.dataset.language=code;option.lang=code;option.tabIndex=-1;
    option.append(image(country),doc.createTextNode(name));option.addEventListener('click',()=>{setLanguage(code);button.focus();});list.append(option);
  }
  function open(){list.hidden=false;button.setAttribute('aria-expanded','true');list.querySelector(`[data-language="${language}"]`).focus();}
  button.addEventListener('click',()=>list.hidden?open():close());
  button.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open();}});
  row.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!list.hidden){event.preventDefault();event.stopPropagation();close();button.focus();return;}
    if(list.hidden)return;
    const options=[...list.children],index=options.indexOf(doc.activeElement?.shadowRoot?.activeElement||base.root.activeElement);
    let next=index;
    if(event.key==='ArrowDown')next=(index+1)%options.length;
    else if(event.key==='ArrowUp')next=(index+options.length-1)%options.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=options.length-1;
    else return;
    event.preventDefault();event.stopPropagation();options[next].focus();
  });
  const outside=event=>{if(!event.composedPath().includes(row))close();};
  base.root.addEventListener('pointerdown',outside);
  // During native pointer focus changes activeElement can temporarily be body.
  // relatedTarget is the destination, so moving between options must not hide
  // the menu before the browser dispatches the option's click.
  row.addEventListener('focusout',event=>{if(event.relatedTarget&&!row.contains(event.relatedTarget))close();});
  const observer=new view.MutationObserver(refresh);
  const api={setLanguage,get language(){return language;},refresh,
    searchText(element){if(!element)return '';const walker=doc.createTreeWalker(element,view.NodeFilter.SHOW_TEXT);let node,text='';while((node=walker.nextNode())){const original=source(node);text+=' '+original+' '+translatePanelText(original,language);}return text;},
    destroy(){observer.disconnect();base.root.removeEventListener('pointerdown',outside);language='en';refresh();observer.disconnect();row.remove();delete base.panelLanguage;},
  };
  base.panelLanguage=api;refresh();return api;
}
