// Display supplied descriptions without inserting boxes into the host layout.
export function showImageAltText({ document: doc = document, host } = {}) {
  const view=doc.defaultView,labels=new Map();
  const layer=doc.createElement('div');
  layer.dataset.accesseaseAltLayer='';layer.setAttribute('data-uaw-ignore','');layer.setAttribute('aria-hidden','true');
  const setStyle=(element,values)=>{for(const [property,value] of Object.entries(values))if(element.style.getPropertyValue(property)!==value)element.style.setProperty(property,value,'important');};
  setStyle(layer,{all:'initial',position:'fixed',left:'0px',top:'0px',width:'0px',height:'0px',overflow:'visible','pointer-events':'none','z-index':'2147483645'});
  doc.body.append(layer);
  let frame;
  function positionLabels(){
    for(const [image,label] of labels){
      const rect=image.getBoundingClientRect(),style=view.getComputedStyle(image);
      const visible=image.isConnected&&image.getClientRects().length&&rect.width>16&&rect.height>16&&
        !image.closest('[hidden],[inert],[aria-hidden="true"]')&&style.visibility==='visible'&&Number(style.opacity)!==0&&
        rect.bottom>0&&rect.right>0&&rect.top<view.innerHeight&&rect.left<view.innerWidth;
      if(!visible){setStyle(label,{display:'none'});continue;}
      const left=Math.max(4,rect.left+4),right=Math.min(view.innerWidth-4,rect.right-4);
      const top=Math.max(4,rect.top+4),bottom=Math.min(view.innerHeight-4,rect.bottom-4);
      if(right-left<16||bottom-top<16){setStyle(label,{display:'none'});continue;}
      // Only the caption occupies pixels over the image, never its full height.
      setStyle(label,{display:'block',left:`${left}px`,top:`${top}px`,width:`${Math.min(420,right-left)}px`,'max-height':`${Math.min(84,bottom-top)}px`});
    }
    frame=view.requestAnimationFrame(positionLabels);
  }
  function scan(){
    const images=new Set([...doc.querySelectorAll('img')].filter(image=>
      !host?.contains(image)&&!image.closest('[data-uaw-ignore]')&&image.getAttribute('alt')?.trim()&&
      !['presentation','none'].includes(image.getAttribute('role'))&&!image.closest('[aria-hidden="true"]')));
    for(const [image,label] of labels)if(!images.has(image)){label.remove();labels.delete(image);}
    for(const image of images){
      let label=labels.get(image);
      if(!label){
        label=doc.createElement('span');label.className='accessease-image-alt';
        setStyle(label,{all:'initial',position:'fixed','box-sizing':'border-box',height:'auto','min-height':'0px','min-width':'0px',margin:'0px',padding:'6px 8px',border:'1px solid #64748b','border-radius':'5px',background:'rgba(9, 38, 68, 0.92)',color:'#ffffff',font:'12px/1.4 Arial, sans-serif','text-align':'left','white-space':'normal','overflow-wrap':'anywhere',overflow:'hidden','pointer-events':'none',transform:'none',transition:'none',animation:'none'});
        labels.set(image,label);layer.append(label);
      }
      const text=image.getAttribute('alt').trim();if(label.textContent!==text)label.textContent=text;
    }
  }
  const observer=new view.MutationObserver(records=>{
    if(records.some(record=>!layer.contains(record.target)))scan();
  });
  observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['alt','role','aria-hidden']});
  scan();positionLabels();
  return()=>{observer.disconnect();view.cancelAnimationFrame(frame);labels.clear();layer.remove();};
}
