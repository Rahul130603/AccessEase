const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../dist/widget.js'),'utf8');

function setup(savedRate=1){
  const dom=new JSDOM('<!doctype html><html lang="en"><body><main id="main-content"><p>A clear passage to read at a comfortable pace.</p></main></body></html>',{url:'http://localhost:1434',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,spoken=[];let cancellations=0;
  w.localStorage.setItem('accessease.preferences.v1',JSON.stringify({rate:savedRate}));
  w.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  w.speechSynthesis={speak:utterance=>spoken.push(utterance),cancel:()=>cancellations++};
  Object.defineProperty(w.document,'currentScript',{value:{src:'http://localhost:1434/widget.js'}});
  w.eval(source);
  const root=w.AccessEase.root;
  const rate=root.querySelector('#rate');
  const choose=value=>{rate.value=String(value);rate.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const read=()=>{
    const range=w.document.createRange();range.selectNodeContents(w.document.querySelector('main p'));
    w.getSelection().removeAllRanges();w.getSelection().addRange(range);
    w.document.dispatchEvent(new w.Event('selectionchange'));
    root.querySelector('[data-setting="speech"]').click();
  };
  return {w,root,rate,spoken,choose,read,get cancellations(){return cancellations;},close:()=>w.close()};
}

test('reading dropdown applies its labeled speed to speech and updates active playback',()=>{
  const t=setup();
  try{
    assert.deepEqual([...t.rate.options].map(option=>Number(option.value)),[.75,1,1.1,1.25,1.5]);
    assert.equal(t.rate.options[t.rate.options.length-1].textContent,'1.5× · Faster');
    t.read();
    assert.equal(t.spoken.at(-1).rate,1);
    for(const value of [.75,1,1.1,1.25,1.5]){
      const cancellations=t.cancellations;
      t.choose(value);
      assert.equal(t.spoken.at(-1).rate,value);
      assert.equal(t.spoken.at(-1).text,'A clear passage to read at a comfortable pace.');
      assert.equal(t.cancellations,cancellations+1,'old playback is cancelled before the speed changes');
      assert.equal(JSON.parse(t.w.localStorage.getItem('accessease.preferences.v1')).rate,value);
    }
    t.root.querySelector('.reset').click();
    assert.equal(t.w.AccessEase.getSettings().rate,1);
    assert.equal(t.rate.value,'1');
    assert.equal(t.w.AccessEase.getSettings().speech,false);
  }finally{t.close();}
});

test('saved and imported 2x rates migrate to 1.5x without starting speech',()=>{
  const t=setup(2);
  try{
    assert.equal(t.w.AccessEase.getSettings().rate,1.5);
    assert.equal(t.rate.value,'1.5');
    assert.equal(JSON.parse(t.w.localStorage.getItem('accessease.preferences.v1')).rate,1.5);
    t.w.AccessEase.setSettings({rate:2,speech:true,voice:true});
    assert.equal(t.w.AccessEase.getSettings().rate,1.5);
    assert.equal(t.spoken.length,0);
    assert.equal(t.w.AccessEase.getSettings().speech,false);
    assert.equal(t.w.AccessEase.getSettings().voice,false);
    t.w.AccessEase.setSettings({rate:99});
    assert.equal(t.w.AccessEase.getSettings().rate,1);
    t.w.AccessEase.setSettings({rate:1.1});
    t.read();
    assert.equal(t.spoken.at(-1).rate,1.1);
  }finally{t.close();}
});
