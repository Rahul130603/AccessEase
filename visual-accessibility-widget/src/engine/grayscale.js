const IGNORE='script,style,link,noscript,[data-uaw-ignore]';
const PAINT=['color','background-color','border-top-color','border-right-color','border-bottom-color','border-left-color','outline-color','text-decoration-color','box-shadow','text-shadow','background-image'];
const grayColors=value=>value.replace(/rgba?\([^)]+\)/g,color=>{
  const values=color.match(/[\d.]+/g)?.map(Number);
  if(!values || values.length<3) return color;
  const gray=Math.round(values[0]*0.2126+values[1]*0.7152+values[2]*0.0722);
  return values.length>3?`rgba(${gray}, ${gray}, ${gray}, ${values[3]})`:`rgb(${gray}, ${gray}, ${gray})`;
});

export function applyGrayscale(roots,override) {
  for(const root of roots) {
    const nodes=[root,...root.querySelectorAll('*')],styles=new Map(nodes.map(el=>[el,getComputedStyle(el)])),unsafe=new Set();
    // Filters create containing blocks and stacking contexts. Never put one
    // around a floating/sticky header or an explicitly ignored widget subtree.
    for(const el of nodes) {
      const style=styles.get(el);
      if(el.scrollHeight>el.clientHeight+2 || el.scrollWidth>el.clientWidth+2) unsafe.add(el);
      if(el.matches(IGNORE) || ['absolute','fixed','sticky'].includes(style.position) || (style.position==='relative' && style.zIndex!=='auto')) {
        for(let parent=el.parentElement;parent && styles.has(parent);parent=parent.parentElement) unsafe.add(parent);
      }
    }
    function visit(el) {
      if(el.matches(IGNORE)) return;
      const style=styles.get(el),rect=el.getBoundingClientRect();
      if(!unsafe.has(el) && rect.width>0 && rect.height>0) {
        const original=style.filter;
        override(el,'filter',`${original && original!=='none'?original+' ':''}grayscale(1)`);
        return;
      }
      // Color-only overrides cannot clip zero-height wrappers or trap header
      // z-index. Continue down to safe paint surfaces for images and SVGs.
      for(const property of PAINT) {
        const original=style.getPropertyValue(property),gray=grayColors(original);
        if(gray!==original) override(el,property,gray);
      }
      for(const child of el.children) visit(child);
    }
    visit(root);
  }
}
