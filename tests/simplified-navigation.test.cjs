const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');

test('simplified navigation adds tab stops without floating page-section controls',async()=>{
  const dom=new JSDOM('<!doctype html><body><main><h1>Welcome</h1><section><h2>Reading</h2><a href="#next">Next</a></section></main><div id="widget"></div></body>',{pretendToBeVisual:true});
  const w=dom.window,root=w.document.createElement('div');w.document.body.append(root);
  const globals=['window','document','Element','MutationObserver','requestAnimationFrame','cancelAnimationFrame'];
  const previous=Object.fromEntries(globals.map(key=>[key,globalThis[key]]));
  Object.assign(globalThis,{window:w,document:w.document,Element:w.Element,MutationObserver:w.MutationObserver,requestAnimationFrame:w.requestAnimationFrame.bind(w),cancelAnimationFrame:w.cancelAnimationFrame.bind(w)});
  w.HTMLElement.prototype.getClientRects=()=>[{width:100,height:20}];
  let features;
  try{
    const {createSudhinFeatures}=await import('../integration/sudhinFeatures.js');
    features=createSudhinFeatures({host:w.document.getElementById('widget'),root});
    features.apply({liveCaptions:false,simplifiedNav:true});
    const stops=[...w.document.querySelectorAll('main,main h1,main h2')];
    assert.deepEqual(stops.map(node=>node.tabIndex),[0,0,0]);
    assert.equal(w.document.querySelector('.sudhin-navigation,.sudhin-skip,.sudhin-landmark'),null);
    assert.equal(root.querySelector('.sudhin-navigation,.sudhin-skip'),null);
    features.destroy();features=null;
    assert.ok(stops.every(node=>!node.hasAttribute('tabindex')));
  }finally{
    features?.destroy();
    for(const key of globals)if(previous[key]===undefined)delete globalThis[key];else globalThis[key]=previous[key];
    w.close();
  }
});
