import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {DEFAULT_SETTINGS} from '../visual-accessibility-widget/src/engine/preferenceStore.js';
// The browser build resolves font assets. This test exercises the actual
// content engine and its restoration journal without loading unrelated fonts.
const source=readFileSync(new URL('../visual-accessibility-widget/src/engine/contentEngine.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
const reflowUrl=new URL('../visual-accessibility-widget/src/engine/textReflow.js',import.meta.url).href;
const {createContentEngine}=await import('data:text/javascript;base64,'+Buffer.from(`import {reflowText} from '${reflowUrl}';\n${source}`).toString('base64'));

test('enlarged text puts floating header navigation in flow and resets its inline styles',()=>{
  const dom=new JSDOM(`<body><div id="header-root"><header style="position:relative;height:0px"><nav style="position:absolute;top:4px!important"><div style="display:flex;flex-direction:row;flex-wrap:nowrap;height:80px"><ul style="display:flex;flex-direction:row;flex-wrap:nowrap;height:80px"><li><a style="display:flex;height:80px;white-space:nowrap">Digital Accessibility Transformation (DAT)</a><div id="dropdown" style="position:absolute;display:none;height:120px"><a>Accessibility Development</a></div></li><li><a>Digital Solutions</a></li></ul></div></nav></header></div><main><h1>Page content</h1></main><div id="widget" data-uaw-ignore></div></body>`,{pretendToBeVisual:true});
  const previous={};
  for(const key of ['window','document','HTMLElement','MutationObserver','getComputedStyle']) {
    previous[key]=globalThis[key];
    globalThis[key]=key==='getComputedStyle'?dom.window.getComputedStyle.bind(dom.window):dom.window[key];
  }
  const doc=dom.window.document;
  dom.window.HTMLElement.prototype.getClientRects=function(){return this.closest('#dropdown')?[]:[{width:500,height:80}];};
  dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return {width:500,height:this.matches('header')?0:80,top:0,bottom:80};};
  const elements=[...doc.querySelectorAll('body *')],original=elements.map(el=>el.style.cssText);
  const engine=createContentEngine({host:doc.getElementById('widget')});
  try {
    for(const fontScale of [1.5,2,2]) {
      engine.apply({...DEFAULT_SETTINGS,fontScale});
      assert.equal(doc.querySelector('nav').style.position,'relative');
      assert.equal(doc.querySelector('header').style.height,'auto');
      assert.equal(doc.querySelector('ul').style.height,'auto');
      assert.equal(doc.querySelector('a').style.whiteSpace,'normal');
      assert.equal(doc.querySelector('#dropdown').style.position,'absolute');
      assert.equal(doc.querySelector('#dropdown').style.display,'none');
      assert.equal(doc.querySelector('h1').style.position,'');
    }
    engine.apply({...DEFAULT_SETTINGS,fontScale:1});
    assert.deepEqual(elements.map(el=>el.style.cssText),original);
    assert.equal(doc.querySelector('nav').style.getPropertyPriority('top'),'important');
    doc.querySelector('nav').setAttribute('data-uaw-preserve-layout','');
    engine.apply({...DEFAULT_SETTINGS,fontScale:2});
    assert.equal(doc.querySelector('nav').style.position,'absolute','explicit layout opt-outs stay floating');
    assert.equal(doc.querySelector('header').style.height,'0px');
  } finally {
    engine.destroy();dom.window.close();
    for(const [key,value] of Object.entries(previous)) {if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
  }
});
