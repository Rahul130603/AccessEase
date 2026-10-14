const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const project=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(project,file),'utf8');
const settle=()=>new Promise(resolve=>setTimeout(resolve,30));

function setup(html,{dictionary={},demo=false}={}){
  const errors=[],console=new VirtualConsole();console.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM(html,{url:'http://localhost:1434',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});
  const w=dom.window;
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
  w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};w.scrollBy=()=>{};
  Object.defineProperty(w.document,'currentScript',{value:{src:'http://localhost:1434/widget.js'}});
  if(demo){w.eval(read('dist/playground.js'));w.eval(read('dist/simple-text.js'));}
  else w.AccessEaseSimpleText=dictionary;
  w.eval(read('dist/widget.js'));
  if(demo)w.eval(read('dist/team-features.js'));
  return {w,document:w.document,errors,toggle:()=>w.AccessEase.root.querySelector('[data-setting="simple"]').click(),close:()=>w.close()};
}

test('plain language covers page text without removing inline controls or altering values',()=>{
  const t=setup(`<!doctype html><html lang="en"><body>
    <header><nav><a id="navigation" href="#content">Commence here</a></nav></header>
    <main id="content"><h1>Utilize this page</h1>
      <p id="authored" data-simple="Try the tool before continuing.">Try using the tool prior to continuing.</p>
      <p id="inline" data-simple="Never replace inline controls with a whole-block string.">Please <strong>utilize</strong> the <a id="link" href="#details">tool</a> in order to continue.</p>
      <ul><li>Approximately 12 items are available.</li></ul>
      <table><tbody><tr><td>You are able to keep all 3 items.</td></tr></tbody></table>
      <button id="action">Commence the action</button><label for="input">Utilize a sample value</label>
      <input id="input" value="Utilize my original value" placeholder="Utilize a sample value">
      <textarea id="textarea" placeholder="Commence writing">Utilize my notes</textarea>
      <select><option>Utilize this value</option></select>
      <img alt="Utilize this illustration" title="Commence here">
      <p lang="fr">Utilize ces mots</p><div contenteditable="true">Utilize my draft</div>
      <p translate="no">Utilize this name</p><p data-simple-ignore>Utilize my exact quote</p>
      <pre>utilize(code)</pre><script>const utilize = 12;</script>
    </main><footer>You can commence here on a daily basis.</footer>
  </body></html>`);
  try{
    const d=t.document,inline=d.querySelector('#inline'),link=d.querySelector('#link'),button=d.querySelector('#action');
    const original=inline.innerHTML;let clicks=0;button.addEventListener('click',()=>clicks++);
    const source=[...d.querySelectorAll('header,h1,p,li,td,button,label,footer')].map(el=>[el,el.textContent]);
    t.toggle();
    assert.equal(d.querySelector('h1').textContent,'Use this page');
    assert.equal(d.querySelector('#authored').textContent,'Try the tool before continuing.');
    assert.equal(inline.textContent,'Please use the tool to continue.');
    assert.equal(d.querySelector('#link'),link);
    assert.equal(link.getAttribute('href'),'#details');
    assert.equal(d.querySelector('nav a').textContent,'Start here');
    assert.equal(d.querySelector('li').textContent,'About 12 items are available.');
    assert.equal(d.querySelector('td').textContent,'You can keep all 3 items.');
    assert.equal(d.querySelector('footer').textContent,'You can start here each day.');
    assert.equal(d.querySelector('#input').placeholder,'Use a sample value');
    assert.equal(d.querySelector('#textarea').placeholder,'Start writing');
    assert.equal(d.querySelector('#input').value,'Utilize my original value');
    assert.equal(d.querySelector('#textarea').value,'Utilize my notes');
    assert.equal(d.querySelector('select').value,'Utilize this value');
    assert.equal(d.querySelector('[lang="fr"]').textContent,'Utilize ces mots');
    assert.equal(d.querySelector('[contenteditable]').textContent,'Utilize my draft');
    assert.equal(d.querySelector('[translate="no"]').textContent,'Utilize this name');
    assert.equal(d.querySelector('[data-simple-ignore]').textContent,'Utilize my exact quote');
    assert.equal(d.querySelector('pre').textContent,'utilize(code)');
    button.click();assert.equal(clicks,1);
    t.toggle();
    source.forEach(([el,text])=>assert.equal(el.textContent,text));
    assert.equal(inline.innerHTML,original);
    assert.equal(d.querySelector('#link'),link);
    assert.equal(d.querySelector('#input').placeholder,'Utilize a sample value');
    assert.equal(d.querySelector('img').alt,'Utilize this illustration');
    button.click();assert.equal(clicks,2);
    assert.deepEqual(t.errors,[]);
  }finally{t.close();}
});

test('new and changed content is simplified without restoring stale app messages',async()=>{
  const t=setup('<!doctype html><html lang="en"><body><main><p id="status">Utilize the original message.</p></main></body></html>');
  try{
    t.toggle();
    const status=t.document.querySelector('#status'),node=status.firstChild;
    node.nodeValue='Utilize the updated message for 8 items.';
    const added=t.document.createElement('p');added.textContent='You are able to commence now.';t.document.querySelector('main').append(added);
    await settle();
    assert.equal(node.nodeValue,'Use the updated message for 8 items.');
    assert.equal(added.textContent,'You can start now.');
    t.document.querySelector('main').append(t.document.createTextNode(' Utilize the appended text.'));
    await settle();
    assert.equal(t.document.querySelector('main').lastChild.nodeValue,' Use the appended text.');
    t.toggle();
    assert.equal(node.nodeValue,'Utilize the updated message for 8 items.');
    assert.equal(added.textContent,'You are able to commence now.');
    assert.equal(t.document.querySelector('main').lastChild.nodeValue,' Utilize the appended text.');
    assert.deepEqual(t.errors,[]);
  }finally{t.close();}
});

test('the current demo uses meaningful alternatives across every content section and restores them',async()=>{
  const html=read('dist/index.html');
  assert.ok(html.indexOf('src="simple-text.js"')<html.indexOf('src="widget.js?'),'wording loads before the widget');
  const t=setup(html,{demo:true});
  try{
    for(let i=0;i<30&&!t.w.AccessEaseTeam;i++)await settle();
    assert.ok(t.w.AccessEaseTeam);
    const d=t.document,hero=d.querySelector('.lab-hero p'),original=hero.textContent;
    const inline=d.querySelector('#reading p a'),heading=d.querySelector('.lab-hero h1 em');
    const sections=['.lab-hero','#reading','#media','#forms','#motion','#audit','#test-guide','footer'];
    const before=sections.map(selector=>d.querySelector(selector).textContent);
    t.toggle();await settle();
    assert.equal(hero.textContent,'Try settings that change how you use this page. Read the story, play a clip and try the sample form. Choose the settings that work for you.');
    assert.ok(d.querySelector('#reading p[data-simple]').textContent.includes('build confidence'));
    sections.forEach((selector,index)=>assert.notEqual(d.querySelector(selector).textContent,before[index],`${selector} includes page-wide plain wording`));
    assert.equal(d.querySelector('#reading p a'),inline);
    assert.equal(d.querySelector('.lab-hero h1 em'),heading);
    const bookmark=d.querySelector('#compact-save');bookmark.click();await settle();
    assert.match(d.querySelector('#bookmark-status').textContent,/Bookmark saved/);
    const submit=[...d.querySelectorAll('#demo-form-root button')].find(button=>button.textContent==='Try demo sign-in');
    assert.ok(submit);submit.click();await settle();
    assert.ok(d.querySelector('#demo-form-root [aria-invalid="true"]'),'React form handlers still work');
    t.toggle();await settle();
    assert.equal(hero.textContent,original);
    assert.equal(d.querySelector('.lab-hero h1 em').textContent,'50 ways to explore.');
    assert.equal(d.querySelector('#reading p a'),inline);
    assert.deepEqual(t.errors,[]);
  }finally{t.close();}
});
