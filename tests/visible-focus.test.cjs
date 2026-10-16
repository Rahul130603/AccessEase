const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../dist/widget.js'),'utf8');

test('visible focus includes overflowing text and restores skipped header controls without layout changes',()=>{
  const dom=new JSDOM(`<body><header><nav><a id="header-link" href="#main" tabindex="-1">Services</a><button id="disabled" disabled tabindex="-1">Unavailable</button><div hidden><a id="hidden" href="#" tabindex="-1">Hidden submenu</a></div><div role="menu"><a id="roving" role="menuitem" href="#" tabindex="-1">Menu item</a></div></nav></header><main id="main"><h1 style="width:300px">A long heading that overflows its box</h1><p>Body text</p><div role="button" id="custom">Custom action</div></main></body>`,{url:'http://localhost:1434/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,doc=w.document;
  Object.defineProperty(doc,'currentScript',{value:{src:'http://localhost:1434/widget.js'}});
  doc.hasFocus=()=>true;
  w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[this.getBoundingClientRect()];};
  w.HTMLElement.prototype.getBoundingClientRect=()=>({left:20,top:100,right:320,bottom:200,width:300,height:100});
  w.Range.prototype.getClientRects=()=>[{left:20,top:110,right:420,bottom:190,width:400,height:80}];
  try{
    w.eval(source);
    const heading=doc.querySelector('h1'),before=heading.style.cssText;
    w.AccessEase.setSettings({focus:true});
    assert.equal(doc.querySelector('#header-link').tabIndex,0);
    assert.equal(doc.querySelector('#disabled').tabIndex,-1);
    assert.equal(doc.querySelector('#hidden').tabIndex,-1);
    assert.equal(doc.querySelector('#roving').tabIndex,-1);
    heading.focus();
    const ring=doc.querySelector('[data-ae-focus-ring]');
    assert.ok(ring);
    assert.equal(ring.style.left,'14px');
    assert.equal(ring.style.width,'412px','ring includes the full text beyond the 300px heading box');
    assert.equal(ring.style.pointerEvents,'none');
    assert.equal(ring.getAttribute('aria-hidden'),'true');
    assert.equal(ring.tabIndex,-1);
    assert.equal(heading.style.cssText,before,'focus does not resize text or change page alignment');
    doc.querySelector('#header-link').focus();
    assert.equal(doc.activeElement.id,'header-link');
    assert.equal(ring.hidden,false);
    w.dispatchEvent(new w.Event('blur'));
    assert.equal(ring.style.display,'none','important display is cleared when the window loses focus');
    w.AccessEase.setSettings({focus:false});
    assert.equal(doc.querySelector('[data-ae-focus-ring]'),null);
    assert.equal(doc.querySelector('#header-link').getAttribute('tabindex'),'-1');
    assert.equal(heading.hasAttribute('tabindex'),false);
    assert.equal(heading.style.cssText,before);
  }finally{w.close();}
});
