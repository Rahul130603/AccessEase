const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');

test('transcripts remain below media when settings close, seek, refresh and clean up',async()=>{
  const errors=[];const console=new VirtualConsole();console.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM('<!doctype html><body><main><video aria-label="Voice sample"><track kind="captions" src="/sample.vtt"></video><audio aria-label="No track"></audio></main></body>',{url:'http://localhost:1434/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});
  const w=dom.window;
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};w.scrollBy=()=>{};
  w.fetch=async()=>({ok:true,text:async()=> 'WEBVTT\n\n00:00.000 --> 00:04.000\nHello &amp; welcome.\n\n00:05.000 --> 00:09.000\nSecond sentence.'});
  Object.defineProperty(w.document,'currentScript',{value:{src:'http://localhost:1434/widget.js'}});
  const until=async(predicate)=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,20));}assert.fail('Expected UI did not appear');};
  const roots=()=>[...w.document.querySelectorAll('[data-ae-transcript]')].map(host=>host.shadowRoot);
  try{
    w.eval(fs.readFileSync(path.join(__dirname,'../dist/widget.js'),'utf8'));
    w.eval(fs.readFileSync(path.join(__dirname,'../dist/team-features.js'),'utf8'));
    await until(()=>w.AccessEaseTeam);
    w.AccessEase.open();
    const panel=w.AccessEase.root;
    panel.querySelector('[data-team-card="audioTranscripts"] button').click();
    await until(()=>roots()[0]?.textContent.includes('Second sentence.'));
    assert.equal(roots().length,2);
    assert.ok(roots()[0].textContent.includes('Hello & welcome.'));
    assert.ok(roots()[1].textContent.includes('No transcript available'));
    roots()[0].querySelectorAll('button')[1].click();
    assert.equal(w.document.querySelector('video').currentTime,5);
    w.AccessEase.close();
    assert.equal(panel.querySelector('.panel').hidden,true);
    assert.ok(roots()[0].querySelector('details').open,'Transcript remains open outside panel');
    const dynamic=w.document.createElement('audio');dynamic.dataset.transcript='Host supplied words.';w.document.querySelector('main').append(dynamic);
    await until(()=>roots().some(root=>root.textContent.includes('Host supplied words.')));
    dynamic.dataset.transcript='Updated host words.';
    await until(()=>roots().some(root=>root.textContent.includes('Updated host words.')));
    dynamic.remove();await until(()=>roots().length===2);
    panel.querySelector('[data-team-card="audioTranscripts"] button').click();
    await until(()=>roots().length===0);
    assert.deepEqual(errors,[]);
  }finally{w.close();}
});
