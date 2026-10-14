const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');

test('live captions use the video track in fullscreen and restore the overlay on exit',async()=>{
  const dom=new JSDOM('<!doctype html><body><video></video><div id="widget"></div></body>',{pretendToBeVisual:true});
  const w=dom.window,video=w.document.querySelector('video'),root=w.document.createElement('div');
  const globals=['window','document','Element','MutationObserver','requestAnimationFrame','cancelAnimationFrame','innerHeight','innerWidth'];
  const previous=Object.fromEntries(globals.map(key=>[key,globalThis[key]]));
  Object.assign(globalThis,{window:w,document:w.document,Element:w.Element,MutationObserver:w.MutationObserver,requestAnimationFrame:w.requestAnimationFrame.bind(w),cancelAnimationFrame:w.cancelAnimationFrame.bind(w),innerHeight:800,innerWidth:1200});
  const track=new w.EventTarget();track.kind='captions';track.mode='disabled';track.activeCues=[{text:'A spoken line.'}];
  const tracks=[track];tracks.addEventListener=()=>{};tracks.removeEventListener=()=>{};
  Object.defineProperty(video,'textTracks',{value:tracks});
  Object.defineProperties(video,{paused:{value:false},ended:{value:false}});
  video.getBoundingClientRect=()=>({left:100,top:100,bottom:400,width:500});
  w.document.body.append(root);
  let features;
  try{
    const {createSudhinFeatures}=await import('../integration/sudhinFeatures.js');
    features=createSudhinFeatures({host:w.document.getElementById('widget'),root,status:()=>{}});
    features.apply({liveCaptions:true,simplifiedNav:false});
    const caption=root.querySelector('.sudhin-live-caption');
    assert.equal(track.mode,'hidden');
    assert.equal(caption.hidden,false);
    assert.equal(caption.textContent,'A spoken line.');
    Object.defineProperty(w.document,'fullscreenElement',{configurable:true,value:video});
    w.document.dispatchEvent(new w.Event('fullscreenchange'));
    assert.equal(track.mode,'showing');
    assert.equal(caption.hidden,true);
    Object.defineProperty(w.document,'fullscreenElement',{configurable:true,value:null});
    w.document.dispatchEvent(new w.Event('fullscreenchange'));
    assert.equal(track.mode,'hidden');
    assert.equal(caption.hidden,false);
    features.destroy();features=null;
    assert.equal(track.mode,'disabled');
  }finally{
    features?.destroy();
    for(const key of globals)if(previous[key]===undefined)delete globalThis[key];else globalThis[key]=previous[key];
    w.close();
  }
});
