const PRESERVE = 'img,picture,svg,canvas,video,[role="img"],[data-uaw-ignore],[data-uaw-preserve-colors],[data-uaw-chart],[data-chart],[class*="chart"],[class*="Chart"],.cv-pattern,.cv-feature-mark,button,a.button,[role="button"]';
const channels = color => {
  const values = color.match(/[\d.]+/g)?.map(Number);
  return color.startsWith('rgb') && values?.length >= 3 ? [...values.slice(0,3), values[3] ?? 1] : [255,255,255,0];
};
const luminance = color => color.slice(0,3).map(value => {
  const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}).reduce((sum,value,index) => sum + value * [0.2126,0.7152,0.0722][index],0);

export function applyLightTheme(elements, override) {
  const styles = new Map(), backgrounds = new Map();
  function baseline(element) {
    if (!styles.has(element)) {
      const css = getComputedStyle(element);
      styles.set(element, { background: channels(css.backgroundColor), image: css.backgroundImage, color: channels(css.color) });
    }
    return styles.get(element);
  }
  function background(element) {
    if (!element) return [255,255,255];
    if (!backgrounds.has(element)) {
      const own = baseline(element).background;
      const parent = background(element.parentElement);
      backgrounds.set(element, own.slice(0,3).map((value,index) => value * own[3] + parent[index] * (1-own[3])));
    }
    return backgrounds.get(element);
  }
  // Decide from the page canvas, not individual dark accents. A light page
  // can have dark/orange headers and icon tiles that must remain untouched.
  if (luminance(background(document.body || document.documentElement)) >= 0.18) return;
  // Snapshot all effective backgrounds before changing any inherited appearance.
  const snapshots = elements.map(element => ({ element, css: baseline(element), bg: background(element) }));
  for (const {element,css,bg} of snapshots) {
    if (element.closest(PRESERVE)) {
      if (element.matches(PRESERVE) && !element.matches('img,picture,canvas,video')) {
        override(element,'color',`rgb(${css.color.slice(0,3).join(',')})`);
        if (css.background[3] === 0 && luminance(bg) < 0.5) override(element,'background-color',`rgb(${bg.join(',')})`);
      }
      continue;
    }
    let ancestor = element, photo = false;
    while (ancestor) {
      if (baseline(ancestor).image.includes('url(')) { photo = true; break; }
      ancestor = ancestor.parentElement;
    }
    if (photo || luminance(bg) >= 0.5) continue;
    if (css.background[3] > 0) override(element,'background-color','#ffffff');
    if (css.image !== 'none') override(element,'background-image','none');
    override(element,'color', element.matches('a[href],[role="link"]') ? '#1d4ed8' : '#0f172a');
    override(element,'text-shadow','none');
  }
}
