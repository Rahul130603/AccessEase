import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createSudhinFeatures} from '../integration/sudhinFeatures.js';
const widget=readFileSync(new URL('../dist/widget.js',import.meta.url),'utf8');

test('Simplified Navigation outlines overflowing text without resizing it and preserves authored tabindex',()=>{
  const dom=new JSDOM('<body><main><h1 tabindex="0" style="width:300px;outline-style:dotted!important">Empowering content with TrueAccessibility</h1><h2>Next section</h2></main></body>',{url:'http://localhost:1434/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,doc=w.document,previous={};let features;
  for(const key of ['window','document','Element','MutationObserver','requestAnimationFrame','cancelAnimationFrame']){
    previous[key]=globalThis[key];globalThis[key]=w[key];
  }
  const frames=new Map();let id=0;
  w.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};
  w.cancelAnimationFrame=frame=>frames.delete(frame);
  globalThis.requestAnimationFrame=w.requestAnimationFrame;globalThis.cancelAnimationFrame=w.cancelAnimationFrame;
  Object.defineProperty(doc,'currentScript',{value:{src:'http://localhost:1434/widget.js'}});
  doc.hasFocus=()=>true;
  w.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[this.getBoundingClientRect()];};
  w.HTMLElement.prototype.getBoundingClientRect=()=>({left:20,top:100,right:320,bottom:200,width:300,height:100});
  w.Range.prototype.getClientRects=()=>[{left:20,top:110,right:480,bottom:190,width:460,height:80}];
  try{
    w.eval(widget);
    features=createSudhinFeatures({host:w.AccessEase.host,root:w.AccessEase.root});
    features.apply({simplifiedNav:true,liveCaptions:false});
    const heading=doc.querySelector('h1');heading.focus();
    const ring=doc.querySelector('[data-ae-focus-ring]');
    assert.ok(ring);assert.equal(ring.hidden,false);
    assert.equal(ring.style.width,'472px','ring includes the entire overflowing word');
    assert.equal(ring.style.borderWidth,'3px');assert.equal(ring.style.boxShadow,'none');
    assert.equal(heading.style.width,'300px');assert.equal(heading.style.outlineStyle,'none');
    assert.equal(w.AccessEase.getSettings().focus,false);
    assert.equal(w.AccessEase.getSettings().skip,false);
    assert.equal(doc.querySelector('h2').getAttribute('tabindex'),'0');
    features.destroy();features=null;
    for(const [frame,callback] of [...frames]){frames.delete(frame);callback();}
    assert.equal(heading.getAttribute('tabindex'),'0','authored tabindex survives OFF');
    assert.equal(doc.querySelector('h2').hasAttribute('tabindex'),false);
    assert.equal(doc.querySelector('main').hasAttribute('tabindex'),false);
    assert.equal(heading.classList.contains('sudhin-tab-stop'),false);
    assert.equal(ring.hidden,true);assert.equal(ring.style.display,'none');
    assert.equal(heading.style.outlineStyle,'dotted');
    assert.equal(heading.style.getPropertyPriority('outline-style'),'important');
  }finally{
    features?.destroy();w.close();
    for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
  }
});
