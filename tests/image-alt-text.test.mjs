import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {showImageAltText} from '../integration/imageAltText.js';

test('alt captions preserve image markup, stay out of layout, skip hidden duplicates, and track movement',async()=>{
  const dom=new JSDOM('<body><header style="display:flex"><a href="#"><img alt="Brand" style="opacity:1"></a><img hidden alt="Brand" style="opacity:1"></header><main><picture><img id="hero" alt="A person reading a book" style="opacity:1;width:600px;height:500px"></picture><img alt="" role="presentation"><img alt="Private icon" aria-hidden="true"></main><div id="widget" data-uaw-ignore><img alt="Widget badge"></div></body>',{pretendToBeVisual:true});
  const doc=dom.window.document,hero=doc.getElementById('hero'),original=doc.body.innerHTML;
  let y=100,nextFrame,frames=0,cancelled=false;
  dom.window.requestAnimationFrame=callback=>{nextFrame=callback;return ++frames;};
  dom.window.cancelAnimationFrame=()=>{cancelled=true;};
  dom.window.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[{}];};
  dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return {left:20,top:y,right:620,bottom:y+500,width:600,height:500};};
  const stop=showImageAltText({document:doc,host:doc.getElementById('widget')});
  try{
    const labels=[...doc.querySelectorAll('.accessease-image-alt')];
    assert.equal(labels.length,3,'only supplied non-decorative page alt text has captions');
    assert.equal(labels.filter(label=>label.style.display==='block').length,2,'hidden logo has no visible duplicate');
    const caption=labels.find(label=>label.textContent==='A person reading a book');
    assert.equal(caption.style.position,'fixed');
    assert.equal(caption.style.height,'auto');
    assert.equal(caption.style.maxHeight,'84px');
    assert.equal(caption.style.width,'420px');
    assert.equal(caption.style.pointerEvents,'none');
    assert.equal(caption.style.getPropertyPriority('height'),'important');
    assert.equal(caption.closest('[data-uaw-ignore]').getAttribute('aria-hidden'),'true');
    assert.equal(hero.parentElement.tagName,'PICTURE');
    assert.equal(hero.parentElement.children.length,1,'caption is never inserted beside the image');
    assert.equal(doc.querySelector('header').children.length,2,'header flex children never change');
    assert.equal(hero.style.width,'600px');assert.equal(hero.alt,'A person reading a book');
    y=180;nextFrame();assert.equal(caption.style.top,'184px');
    y=2000;nextFrame();assert.equal(caption.style.display,'none');
    hero.alt='Updated description';await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(caption.textContent,'Updated description');
    hero.remove();await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(caption.isConnected,false);
  }finally{stop();}
  assert.equal(cancelled,true);
  // Put the authored element back before comparing, since the test changed it.
  hero.alt='A person reading a book';doc.querySelector('picture').append(hero);
  assert.equal(doc.body.innerHTML,original,'OFF removes every caption without changing the host page');
  dom.window.close();
});
