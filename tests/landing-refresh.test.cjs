const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const sessionScript=fs.readFileSync(path.join(__dirname,'../dist/admin-session.js'),'utf8');
const adminScript=fs.readFileSync(path.join(__dirname,'../dist/admin.js'),'utf8');

function runSession({type='navigate',pathname='/',hash='',search=''}={}){
  const redirects=[],added=[],listeners={},scrolls=[],requests=[];
  const header={append:element=>added.push(element)};
  const context={
    performance:{getEntriesByType:()=>[{type}]},
    location:{pathname,hash,search,replace:url=>redirects.push(url)},
    history:{scrollRestoration:'auto'},
    window:{addEventListener:(name,handler)=>{(listeners[name]??=[]).push(handler);},scrollTo:(...args)=>scrolls.push(args)},
    document:{createElement:tag=>({tagName:tag.toUpperCase()}),querySelector:()=>header,addEventListener:()=>{},hidden:false},
    fetch:async url=>{requests.push(url);return {status:200,ok:true,json:async()=>({role:'admin'})};}
  };
  vm.runInNewContext(sessionScript,context);
  return {redirects,added,listeners,scrolls,requests,context};
}

test('refreshing another signed-in page returns to the landing page',()=>{
  for(const pathname of ['/learning-demo.html','/index.html']){
    const result=runSession({type:'reload',pathname});
    assert.deepEqual(result.redirects,['/']);
    assert.equal(result.added.length,0);
  }
  assert.deepEqual(runSession({type:'reload',hash:'#reading'}).redirects,['/']);
});

test('refreshing the landing page starts at the top and has no logout icon',async()=>{
  const result=runSession({type:'reload'});
  assert.deepEqual(result.redirects,[]);
  assert.equal(result.context.history.scrollRestoration,'manual');
  assert.equal(result.added.length,1);
  assert.equal(result.added[0].tagName,'A');
  result.listeners.pageshow.forEach(handler=>handler());
  assert.deepEqual(result.scrolls,[[0,0]]);
  await Promise.resolve();
  assert.equal(result.requests[0],'/api/auth/session');
});

test('workspace startup redirects only on reload',()=>{
  const guard=adminScript.slice(adminScript.lastIndexOf("if(performance.getEntriesByType"));
  assert.ok(guard.startsWith('if(performance.getEntriesByType'));
  for(const [type,expected] of [['reload',['/']],['navigate',[]]]){
    const redirects=[],started=[];
    vm.runInNewContext(guard,{
      performance:{getEntriesByType:()=>[{type}]},
      location:{replace:url=>redirects.push(url)},
      start:()=>started.push(true)
    });
    assert.deepEqual(redirects,expected);
    assert.equal(started.length,type==='reload'?0:1);
  }
});
