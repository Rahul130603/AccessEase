const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../dist/widget.js'),'utf8');

function setup(savedRate=1,{text,voices=[],lang='en'}={}){
  const dom=new JSDOM('<!doctype html><html lang="en"><body><main id="main-content"><p>A clear passage to read at a comfortable pace.</p></main></body></html>',{url:'http://localhost:1434',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,spoken=[];let cancellations=0;
  if(text)w.document.querySelector('main p').textContent=text;
  w.document.documentElement.lang=lang;
  w.localStorage.setItem('accessease.preferences.v1',JSON.stringify({rate:savedRate}));
  w.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  w.speechSynthesis={speak:utterance=>spoken.push(utterance),cancel:()=>cancellations++,getVoices:()=>voices};
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

test('fast reading keeps sentences separate with a short punctuation pause and a matching voice',async()=>{
  const voices=[{name:'Wrong language',lang:'fr-FR',default:true},{name:'Google English',lang:'en-US'}];
  for(const rate of [1.25,1.5]){
    const t=setup(rate,{text:'First sentence is clear. Second sentence remains complete!',voices});
    try{
      t.read();
      const first=t.spoken[0];
      assert.equal(first.text,'First sentence is clear.');
      assert.equal(first.rate,rate);
      assert.equal(first.pitch,1);
      assert.equal(first.volume,1);
      assert.equal(first.voice,voices[1]);
      assert.equal(first.lang,'en-US');
      first.onend();
      assert.equal(t.spoken.length,1,'sentence pause does not overlap speech');
      await new Promise(resolve=>setTimeout(resolve,130));
      assert.equal(t.spoken[1].text,'Second sentence remains complete!');
      assert.equal(t.spoken[1].rate,rate,'faster labels keep their actual rate');
      t.spoken[1].onend();
      t.root.querySelector('[data-setting="speech"]').click();
      await new Promise(resolve=>setTimeout(resolve,130));
      assert.equal(t.spoken.length,2,'Stop cancels pending reading');
    }finally{t.close();}
  }
});

test('changing speed resumes the current word and ignores cancelled callbacks',async()=>{
  const t=setup(1.25,{text:'First phrase has several words. Next sentence.'});
  try{
    t.read();const old=t.spoken[0];
    old.onboundary({name:'word',charIndex:13});
    t.choose(1.5);
    assert.equal(t.spoken[1].text,'has several words.');
    assert.equal(t.spoken[1].rate,1.5);
    old.onend();old.onerror();old.onboundary({name:'word',charIndex:0});
    assert.equal(t.w.AccessEase.getSettings().speech,true);
    assert.equal(t.spoken.length,2);
    t.spoken[1].onend();
    t.choose(1.25);
    assert.equal(t.spoken[2].text,'Next sentence.');
    await new Promise(resolve=>setTimeout(resolve,130));
    assert.equal(t.spoken.length,3,'speed change clears pending sentence timer');
  }finally{t.close();}
});

test('long selections are bounded without losing words or punctuation',async()=>{
  const text=Array.from({length:160},(_,i)=>`word${i}`).join(' ')+'.';
  const t=setup(1.5,{text});
  try{
    t.read();
    for(let i=0;i<20;i++){
      const current=t.spoken.at(-1);
      assert.ok(current.text.length<=240);
      current.onend();
      if(current.text.endsWith('.'))break;
      await new Promise(resolve=>setTimeout(resolve,5));
    }
    assert.equal(t.spoken.map(u=>u.text).join(' '),text);
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
