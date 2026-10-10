const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/widget.js'),'utf8');
const handler=source.slice(source.indexOf('  let stickyAltCaptured='),source.indexOf("  document.addEventListener('loadedmetadata'"));
function setup(sticky=true){
  const callbacks={},events=[];
  const context=vm.createContext({
    state:{sticky,switches:false,keyboard:false},panel:{hidden:true},latched:new Set(),
    document:{addEventListener:(name,fn)=>callbacks[name]=fn},
    window:{addEventListener:(name,fn)=>callbacks[name]=fn},
    openPanel:open=>{context.panel.hidden=!open;events.push(open);},status:()=>{},scan:()=>{},move:()=>{},scanned:null
  });
  vm.runInContext(handler,context);
  function key(name,options={}){
    const e={key:name,code:name==='a'?'KeyA':'',ctrlKey:false,altKey:false,repeat:false,
      composedPath:()=>[{closest:()=>options.input?{}:null}],preventDefault(){this.prevented=true;},...options};
    callbacks.keydown(e);return e;
  }
  function release(name){const e={key:name,preventDefault(){this.prevented=true;}};callbacks.keyup(e);return e;}
  return {context,callbacks,events,key,release};
}
let total=0;
function test(name,fn){fn();total++;console.log('PASS '+name);}
test('sequential shortcut opens and closes panel',()=>{
  const t=setup();for(let i=0;i<2;i++){t.key('Control');t.release('Control');t.key('Alt');t.release('Alt');t.key('a');}
  assert.deepEqual(t.events,[true,false]);
});
test('Alt key down and release prevent browser menu focus during sequence',()=>{
  const t=setup();t.key('Control');t.release('Control');assert.equal(t.key('Alt').prevented,true);assert.equal(t.release('Alt').prevented,true);
});
test('shortcut works while an input is focused',()=>{
  const t=setup();t.key('Control',{input:true});t.key('Alt',{input:true});const a=t.key('a',{input:true});
  assert.deepEqual(t.events,[true]);assert.equal(a.prevented,true);
});
test('ordinary input typing and unrelated Ctrl shortcuts are preserved',()=>{
  const t=setup();assert.equal(t.key('a',{input:true}).prevented,undefined);t.key('Control');assert.equal(t.key('c',{ctrlKey:true,input:true}).prevented,undefined);
  t.key('Alt');t.key('a');assert.deepEqual(t.events,[]);
});
test('physical KeyA handles keyboard layout differences',()=>{
  const t=setup();t.key('Control');t.key('Alt');t.key('á',{code:'KeyA'});assert.deepEqual(t.events,[true]);
});
test('simultaneous shortcut works and key repeat does not toggle repeatedly',()=>{
  const t=setup();t.key('a',{ctrlKey:true,altKey:true});t.key('a',{ctrlKey:true,altKey:true,repeat:true});assert.deepEqual(t.events,[true]);
});
test('disabled mode does not latch modifier keys or consume Alt',()=>{
  const t=setup(false);t.key('Control');assert.equal(t.key('Alt').prevented,undefined);t.key('a');assert.deepEqual(t.events,[]);
});
test('browser losing focus cancels incomplete shortcut',()=>{
  const t=setup();t.key('Control');t.key('Alt');t.callbacks.blur();t.key('a');assert.deepEqual(t.events,[]);
});
console.log(`${total} sticky key tests passed.`);
