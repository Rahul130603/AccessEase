// Presentation only: original buttons keep their listeners; React controls use portals.
export const settingCategories = [
  {id:'vision',label:'Vision',icon:'◉',settings:['light','dark','grayscale','colorVisionMode','visuals','contrast','highlightLinks']},
  {id:'reading',label:'Reading',icon:'Aa',settings:['fontScale','spacingPreset','dyslexiaFont','magnifier','readingGuide','readingMask','speech','rate','align','simple','highlight','summary','progress']},
  {id:'navigation',label:'Navigation',icon:'↗',settings:['keyboard','skip','targets','voice','switches','sticky','steps','simplifiedNav','headings']},
  {id:'focus',label:'Focus',icon:'◎',settings:['focus','distraction','notifications','screen-reader','announcements']},
  {id:'media',label:'Media',icon:'▶',settings:['captions','liveCaptions','audioTranscripts']},
  {id:'motion',label:'Motion',icon:'≈',settings:['reduce-motion','pause-animations','pause-auto-media','flashing']},
  {id:'forms',label:'Forms',icon:'☑',settings:['auth','form-labels','error-messages','password','confirm']},
  {id:'tools',label:'Tools',icon:'⚙',settings:['timeLimits','preferences','profiles','alt-text']},
];

export function createSettingsLayout(base) {
  const root=base.root,grid=root.querySelector('.grid');
  const originalControls=[...grid.children];
  grid.classList.add('settings-groups');
  const groups=new Map();
  for(const category of settingCategories){
    const section=document.createElement('section');
    section.className='settings-group';section.dataset.category=category.id;
    section.setAttribute('aria-labelledby',`category-${category.id}`);
    const heading=document.createElement('h3');heading.className='category-heading';heading.id=`category-${category.id}`;
    const icon=document.createElement('span');icon.className='category-icon';icon.setAttribute('aria-hidden','true');icon.textContent=category.icon;
    const label=document.createElement('span');label.textContent=category.label;
    const count=document.createElement('span');count.className='category-count';
    heading.append(icon,label,count);
    const controls=document.createElement('div');controls.className='category-controls';
    section.append(heading,controls);grid.append(section);
    groups.set(category.id,{section,controls,count});
  }
  const categoryFor=id=>settingCategories.find(category=>category.settings.includes(id))?.id||'tools';
  const targetFor=id=>groups.get(categoryFor(id)).controls;
  for(const control of originalControls){
    const id=control.dataset.setting||control.querySelector('select')?.id;
    targetFor(id).append(control);
  }
  const search=document.createElement('div');search.className='team-search';
  search.innerHTML='<label for="team-search">Search accessibility settings</label><input id="team-search" type="search" placeholder="Search accessibility settings…" autocomplete="off">';
  const empty=document.createElement('p');empty.className='team-empty';empty.hidden=true;empty.setAttribute('role','status');empty.textContent='No matching settings. Try another word or category.';
  root.querySelector('.body').append(empty);
  const filter=()=>{
    const query=search.querySelector('input').value.trim().toLowerCase();
    grid.dataset.categoryFilter='all';
    let matches=0;
    for(const [id,group] of groups){
      const cards=[...group.controls.children].filter(card=>card.matches('.tile,.select-row,.team-card'));
      const order=settingCategories.find(category=>category.id===id).settings;
      const ordered=[...cards].sort((a,b)=>order.indexOf(a.dataset.setting||a.dataset.teamCard||a.querySelector('select')?.id)-order.indexOf(b.dataset.setting||b.dataset.teamCard||b.querySelector('select')?.id));
      ordered.forEach((card,index)=>{if(group.controls.children[index]!==card)group.controls.insertBefore(card,group.controls.children[index]);});
      let visible=0;
      for(const card of cards){
        const labelNode=card.querySelector('.card-title,.motion-title,strong,label,summary');
        const label=base.panelLanguage?.searchText(labelNode)||labelNode?.textContent||'';
        card.hidden=!label.toLowerCase().includes(query);
        if(!card.hidden)visible++;
      }
      group.count.textContent=`${cards.length} settings`;
      group.section.hidden=visible===0;
      if(!group.section.hidden)matches+=visible;
    }
    empty.hidden=matches!==0;
  };
  root.querySelector('.intro').after(search);
  search.querySelector('input').addEventListener('input',filter);
  // React may add content after initialization; observe children only to avoid attribute loops.
  const observer=new MutationObserver(filter);
  for(const group of groups.values())observer.observe(group.controls,{childList:true,subtree:true});
  filter();
  return {targetFor,filter};
}
