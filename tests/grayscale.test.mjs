import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {DEFAULT_SETTINGS} from '../visual-accessibility-widget/src/engine/preferenceStore.js';
const source=readFileSync(new URL('../visual-accessibility-widget/src/engine/contentEngine.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
const grayUrl=new URL('../visual-accessibility-widget/src/engine/grayscale.js',import.meta.url).href;
const {createContentEngine}=await import('data:text/javascript;base64,'+Buffer.from(`import {applyGrayscale} from '${grayUrl}';\n${source}`).toString('base64'));

test('grayscale leaves floating and sticky header containing blocks intact and restores originals',()=>{
  const dom=new JSDOM(`<body><div id="header-root"><header style="position:relative;z-index:999;height:0px"><nav style="position:absolute;height:112px;background:rgb(180,90,0)"><a style="color:white">Menu</a><div style="position:fixed">Sticky control</div></nav></header></div><main style="filter:brightness(.9)"><img src="photo.jpg"></main><section id="nested"><div data-uaw-ignore style="color:blue">Ignore</div><p>Content</p></section><div id="widget" data-uaw-ignore style="color:blue"></div></body>`,{pretendToBeVisual:true});
  const previous={};
  for(const key of ['window','document','HTMLElement','MutationObserver','getComputedStyle']) {
    previous[key]=globalThis[key];globalThis[key]=key==='getComputedStyle'?dom.window.getComputedStyle.bind(dom.window):dom.window[key];
  }
  const doc=dom.window.document;
  dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return {width:500,height:this.matches('#header-root,header')?0:80,top:0,bottom:80};};
  const elements=[...doc.querySelectorAll('body *')];
  const snapshot=()=>elements.map(el=>['position','height','z-index','background-color','filter','color'].map(property=>[el.style.getPropertyValue(property),el.style.getPropertyPriority(property)]));
  const original=snapshot();
  const engine=createContentEngine({host:doc.getElementById('widget')});
  try {
    for(let i=0;i<2;i++) {
      engine.apply({...DEFAULT_SETTINGS,grayscale:true});
      assert.equal(doc.querySelector('#header-root').style.filter,'');
      assert.equal(doc.querySelector('header').style.filter,'');
      assert.equal(doc.querySelector('nav').style.filter,'','fixed descendants retain their viewport containing block');
      assert.equal(doc.querySelector('nav').style.position,'absolute');
      const rgb=doc.querySelector('nav').style.backgroundColor.match(/\d+/g).map(Number);
      assert.equal(rgb[0],rgb[1]);assert.equal(rgb[1],rgb[2]);
      assert.equal(doc.querySelector('main').style.filter,'brightness(.9) grayscale(1)');
      assert.equal(doc.querySelector('#nested').style.filter,'','ignored descendants stay outside filters');
      assert.equal(doc.querySelector('#nested [data-uaw-ignore]').style.filter,'');
      assert.equal(doc.querySelector('#widget').style.color,'blue');
    }
    engine.apply({...DEFAULT_SETTINGS,grayscale:false});
    assert.deepEqual(snapshot(),original);
  } finally {
    engine.destroy();dom.window.close();
    for(const [key,value] of Object.entries(previous)) {if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
  }
});
