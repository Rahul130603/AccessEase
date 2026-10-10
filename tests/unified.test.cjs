const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const project=path.join(__dirname,'..');

test('caption parser uses supplied text and strips cue markup',async()=>{
  const {parseVtt}=await import('../integration/helpers.js');
  assert.deepEqual(parseVtt('WEBVTT\n\n1\n00:00.000 --> 00:02.000\n<v Alice>Hello &amp; welcome.</v>\n\n00:02.000 --> 00:04.000\nSecond line.'),['Hello & welcome.','Second line.']);
});
test('summary only extracts source sentences and deduplicates paragraphs',async()=>{
  const {summarize}=await import('../integration/helpers.js');
  const text='Accessible learning makes useful information easier for everyone to read. Clear headings help people move through a page with confidence.';
  const result=summarize([text,text]);
  assert.ok(result.length>0&&result.length<=5);
  assert.equal(result.length,new Set(result).size);
  result.forEach(sentence=>assert.ok(text.includes(sentence)));
});
test('preference import rejects unrelated files and wrong versions',async()=>{
  const {validateImport}=await import('../integration/helpers.js');
  assert.throws(()=>validateImport({version:1,settings:{}}));
  assert.throws(()=>validateImport({kind:'other',version:2,settings:{}}));
  assert.deepEqual(validateImport({kind:'accessease-preferences',version:2,settings:{visual:{fontScale:1.5}}}),{visual:{fontScale:1.5}});
});
test('all four modules share one launcher, reset and sanitized import',async()=>{
  const errors=[];
  const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM('<!doctype html><html lang="en"><head><style>h1{font-size:40px}p{font-size:20px}</style></head><body><main id="main-content"><h1>Sample learning page</h1><p>A complete example paragraph with useful information for every curious reader.</p><a href="#main-content">Read more</a></main></body></html>',{url:'http://localhost:1434/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window;
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.scrollBy=()=>{};w.scrollTo=()=>{};
  Object.defineProperty(w.document,'currentScript',{value:{src:'http://localhost:1434/widget.js'}});
  try{
    w.eval(fs.readFileSync(path.join(project,'dist/widget.js'),'utf8'));
    w.eval(fs.readFileSync(path.join(project,'dist/team-features.js'),'utf8'));
    for(let i=0;i<30&&!w.AccessEaseTeam;i++)await new Promise(resolve=>setTimeout(resolve,20));
    assert.ok(w.AccessEaseTeam,'combined feature API initialized');
    const root=w.AccessEase.root;
    assert.equal(w.document.querySelectorAll('#accessease-widget').length,1);
    assert.equal(root.querySelectorAll('.launcher').length,1);
    assert.equal(root.querySelectorAll('.team-card').length,32);
    assert.equal(root.querySelector('.total').textContent,'45 settings');
    assert.equal(w.document.querySelector('#a11y-floating-btn'),null);
    assert.equal(root.querySelector('[data-team-card="fontScale"] summary').getAttribute('aria-label'),'Text Size options');
    w.AccessEase.open();
    const modal=w.document.createElement('dialog');modal.setAttribute('open','');root.append(modal);
    modal.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,composed:true}));
    assert.equal(root.querySelector('.panel').hidden,false,'confirmation owns Escape');
    modal.remove();
    w.AccessEaseTeam.setSettings({base:{align:'right',voice:true,rate:99},visual:{fontScale:1.5,theme:'dark'},tools:{progress:true},assist:{visual:{enabled:true,brightness:125}}});
    await new Promise(resolve=>setTimeout(resolve,80));
    assert.equal(w.AccessEase.getSettings().voice,false);
    assert.equal(w.AccessEase.getSettings().rate,1);
    assert.equal(w.AccessEaseTeam.getSettings().visual.fontScale,1.5);
    assert.equal(w.AccessEaseTeam.getSettings().assist.visual.brightness,125);
    assert.equal(w.getComputedStyle(w.document.querySelector('h1')).fontSize,'60px');
    assert.ok(root.querySelector('.count').textContent!=='0 active');
    w.AccessEase.reset();
    await new Promise(resolve=>setTimeout(resolve,80));
    assert.equal(w.AccessEaseTeam.getSettings().visual.theme,'default');
    assert.equal(w.AccessEaseTeam.getSettings().tools.progress,false);
    assert.equal(w.AccessEase.getSettings().align,'original');
    assert.equal(w.AccessEaseTeam.getSettings().assist.visual.enabled,false);
    assert.equal(w.getComputedStyle(w.document.querySelector('h1')).fontSize,'40px');
    assert.deepEqual(errors,[]);
  }finally{w.close();}
});
