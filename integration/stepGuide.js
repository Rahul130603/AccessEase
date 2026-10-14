const controls='input:not([type="hidden"]),textarea,select,button,summary,a[href],[role="button"],[role="checkbox"],[role="radio"],[role="switch"],[role="combobox"],[role="listbox"],[role="option"],[contenteditable="true"]';
const candidates=`h1,h2,h3,h4,h5,h6,[role="heading"],form,[role="form"],fieldset,ol>li,[data-step],[data-step-number],.step-card,.numbered-card,article,${controls}`;
export function stepLabel(element){
  const clean=text=>(text||'').replace(/\s+/g,' ').trim();
  const referenced=clean((element.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>element.ownerDocument.getElementById(id)?.textContent||'').join(' '));
  const label=clean(element.getAttribute('aria-label'))||referenced||clean([...element.labels||[]].map(label=>label.textContent).join(' '));
  if(element.matches('form,[role="form"],fieldset'))return `Form: ${label||clean(element.querySelector('legend,h1,h2,h3,h4')?.textContent)||'Form fields'}`;
  if(element.matches('article,[data-step],[data-step-number],.step-card,.numbered-card,ol>li')){
    const number=clean(element.getAttribute('data-step-number'))||clean(element.querySelector('.lab-kicker,[data-step-label],.step-number,.card-number')?.textContent).match(/^\d+/)?.[0];
    return `${number?`Card ${number}: `:'Step: '}${label||clean(element.querySelector('h1,h2,h3,h4,h5,h6,strong')?.textContent)||clean(element.textContent).slice(0,100)}`;
  }
  if(label)return label.slice(0,140);
  if(element.matches('input'))return clean(element.getAttribute('placeholder'))||(['submit','button','reset'].includes(element.type)?clean(element.value):'')||`${element.type==='password'?'Password':element.type==='email'?'Email':element.type==='checkbox'?'Checkbox':element.type==='radio'?'Choice':'Input'} field`;
  if(element.matches('select,textarea,[contenteditable="true"]'))return clean(element.getAttribute('placeholder'))|| (element.matches('select')?'Selection':'Text field');
  return clean(element.querySelector('h1,h2,h3,h4,h5,h6')?.textContent)||clean(element.textContent).slice(0,140)||'Page action';
}
export function collectSteps(document){
  const root=document.querySelector('main,[role="main"]')||document.body;
  return [...root.querySelectorAll(candidates)].filter(element=>{
    if(element.closest('#accessease-widget,[data-ae-transcript],[hidden],[aria-hidden="true"],[inert]')||element.matches(':disabled,[aria-disabled="true"],input[type="hidden"]')||!element.getClientRects().length)return false;
    for(let parent=element.parentElement;parent;parent=parent.parentElement)if(parent.matches('details:not([open])')&&!parent.querySelector(':scope > summary')?.contains(element))return false;
    const style=document.defaultView.getComputedStyle(element);
    if(style.visibility==='hidden'||style.visibility==='collapse')return false;
    if(element.matches('article')&&!element.matches('[data-step],[data-step-number],.step-card,.numbered-card')){
      const number=element.querySelector('.lab-kicker,[data-step-label],.step-number,.card-number');
      if(!/^\s*\d+\b/.test(number?.textContent||''))return false;
    }
    return true;
  });
}
export function focusStep(target){
  const native=target.matches(`${controls},[tabindex]`),previous=target.getAttribute('tabindex');
  if(!native)target.setAttribute('tabindex','-1');
  target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:'auto'});
  return()=>{if(!native){previous===null?target.removeAttribute('tabindex'):target.setAttribute('tabindex',previous);}};
}
