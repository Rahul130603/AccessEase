import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {applyLightTheme} from '../visual-accessibility-widget/src/engine/lightTheme.js';

function run(html,check) {
  const dom=new JSDOM(html),previous={document:globalThis.document,getComputedStyle:globalThis.getComputedStyle};
  globalThis.document=dom.window.document;
  globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
  const changes=[];
  try {
    applyLightTheme([...document.querySelectorAll('html,body,body *')],(element,property,value)=>changes.push({element,property,value}));
    check(changes,document);
  } finally {
    dom.window.close();
    for(const [key,value] of Object.entries(previous)) {if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
  }
}

test('light pages keep every original color, including dark headers and white SVG icons',()=>{
  run('<html style="background:#fff"><body style="background:#fff;color:#111"><header style="background:#b65d00;color:#fff">Header</header><main><div style="background:#b65d00"><svg style="color:white"><path fill="currentColor"/></svg></div><section style="background:#111;color:#fff">Dark accent</section></main></body></html>',changes=>assert.equal(changes.length,0));
});
test('transparent body on a light canvas also leaves dark accent cards alone',()=>{
  run('<html style="background:#f5f5f5"><body><div style="background:#111;color:#fff">Accent</div></body></html>',changes=>assert.equal(changes.length,0));
});
test('dark page converts to light while keeping already light panels and photos',()=>{
  run('<html style="background:#101827"><body style="color:#eee"><main><p>Content</p><a href="/">Link</a><section id="light" style="background:white;color:#111">Light panel</section><div id="photo" style="background-image:url(photo.jpg);color:white">Photo caption</div></main></body></html>',(changes,doc)=>{
    assert.ok(changes.some(change=>change.element===doc.documentElement && change.property==='background-color' && change.value==='#ffffff'));
    assert.ok(changes.some(change=>change.element===doc.querySelector('p') && change.property==='color' && change.value==='#0f172a'));
    assert.ok(changes.some(change=>change.element===doc.querySelector('a') && change.property==='color' && change.value==='#1d4ed8'));
    assert.ok(!changes.some(change=>['light','photo'].includes(change.element.id)));
  });
});
