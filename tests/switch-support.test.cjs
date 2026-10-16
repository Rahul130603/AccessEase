const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const widget=fs.readFileSync(path.join(__dirname,'../dist/widget.js'),'utf8');
const preferenceKey='accessease.preferences.v1';
function setup(saved){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM('<body><header><a id="link" href="#main" tabindex="-1">Services</a><div id="custom" role="button">Open menu</div><a hidden href="#hidden">Hidden</a><button disabled>Disabled</button><button aria-disabled="true">Unavailable</button><fieldset disabled><button>Disabled by fieldset</button></fieldset></header><main id="main"><h1 tabindex="0">Heading</h1><button id="next">Next</button><a id="last" href="#last">Last link</a></main></body>',{url:'https://example.com/page',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window,doc=w.document;
  if(saved)w.localStorage.setItem(preferenceKey,saved);
  w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[{width:100,height:30}];};
  w.HTMLElement.prototype.scrollIntoView=function(){};
  Object.defineProperty(doc,'currentScript',{value:{src:'https://example.com/widget.js'}});
  w.eval(widget);
  const key=(name)=>{const event=new w.KeyboardEvent('keydown',{key:name,code:name===' '?'Space':name,bubbles:true,composed:true,cancelable:true});(doc.activeElement||doc.body).dispatchEvent(event);return event;};
  return {w,doc,errors,key,close:()=>w.close()};
}
test('switch scan includes skipped links and custom buttons, preserves order after DOM changes, and restores tabindex',()=>{
  const t=setup();
  try{
    t.w.AccessEase.setSettings({switches:false}); // Imports do not enable scanning.
    t.w.AccessEase.root.querySelector('[data-setting="switches"]').click();
    t.w.AccessEase.close();
    t.key(' ');assert.equal(t.doc.querySelector('[data-ae-scanned]').id,'link');
    t.key(' ');assert.equal(t.doc.querySelector('[data-ae-scanned]').id,'custom');
    assert.equal(t.doc.activeElement.id,'custom');
    let clicks=0;t.doc.querySelector('#custom').addEventListener('click',()=>clicks++);
    t.key('Enter');assert.equal(clicks,1);
    const inserted=t.doc.createElement('button');inserted.id='inserted';inserted.textContent='Inserted before current';
    t.doc.querySelector('header').prepend(inserted);
    t.key(' ');assert.equal(t.doc.querySelector('[data-ae-scanned]').id,'next','DOM insertion does not repeat or skip the next control');
    assert.equal(t.doc.querySelector('#custom').hasAttribute('tabindex'),false);
    t.key(' ');assert.equal(t.doc.querySelector('[data-ae-scanned]').id,'last');
    t.doc.querySelector('#last').hidden=true;
    t.key('Enter');assert.equal(t.doc.querySelector('[data-ae-scanned]'),null,'hidden stale targets cannot be activated');
    assert.equal(t.doc.querySelector('#link').getAttribute('tabindex'),'-1');
    assert.deepEqual(t.errors,[]);
  }finally{t.close();}
});
test('Switch Device Support remains on across pages, and stays off after user disables it',()=>{
  const first=setup();let second,third;
  try{
    first.w.AccessEase.root.querySelector('[data-setting="switches"]').click();
    const saved=first.w.localStorage.getItem(preferenceKey);
    assert.equal(JSON.parse(saved).switches,true);
    first.w.dispatchEvent(new first.w.PageTransitionEvent('pagehide'));
    second=setup(saved);
    assert.equal(second.w.AccessEase.getSettings().switches,true);
    second.w.AccessEase.close();second.key(' ');
    assert.equal(second.doc.querySelector('[data-ae-scanned]').id,'link');
    second.w.AccessEase.root.querySelector('[data-setting="switches"]').click();
    const disabled=second.w.localStorage.getItem(preferenceKey);
    third=setup(disabled);assert.equal(third.w.AccessEase.getSettings().switches,false);
    first.w.localStorage.setItem(preferenceKey,disabled);
    first.w.dispatchEvent(new first.w.PageTransitionEvent('pageshow',{persisted:true}));
    assert.equal(first.w.AccessEase.getSettings().switches,false,'Back restores the latest OFF choice');
    assert.equal(third.key(' ').defaultPrevented,false);
  }finally{first.close();second?.close();third?.close();}
});

test('switch activation opens a dropdown once without also running the host Enter handler',()=>{
  const t=setup();
  try{
    const trigger=t.doc.querySelector('#link');trigger.setAttribute('aria-expanded','false');
    const menu=t.doc.createElement('div');menu.hidden=true;
    menu.innerHTML='<a id="submenu-link" href="#audit">Accessibility Audit</a>';
    trigger.after(menu);
    let activations=0,navigations=0;
    trigger.addEventListener('click',event=>{
      event.preventDefault();activations++;
      if(!menu.hidden)navigations++;
      menu.hidden=false;trigger.setAttribute('aria-expanded','true');
    });
    trigger.addEventListener('keydown',event=>{if(event.key==='Enter'||event.code==='Space')trigger.click();});
    t.w.AccessEase.root.querySelector('[data-setting="switches"]').click();t.w.AccessEase.close();
    t.key(' ');assert.equal(t.doc.querySelector('[data-ae-scanned]'),trigger);
    t.key('Enter');
    assert.equal(activations,1);assert.equal(navigations,0);
    assert.equal(menu.hidden,false);
    t.key(' ');
    assert.equal(t.doc.querySelector('[data-ae-scanned]').id,'submenu-link','next switch step enters the opened dropdown');
    assert.equal(activations,1,'Space scanning does not toggle the old dropdown again');
  }finally{t.close();}
});
