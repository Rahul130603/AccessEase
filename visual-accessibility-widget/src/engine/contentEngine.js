// All overrides have a property-level journal. Removing the widget restores host values.
import { colorModeVariables, colorSupportCss } from '../colorVision/colorModes.js';
import { dyslexiaFontCss } from './dyslexiaFont.js';
import { applyLightTheme } from './lightTheme.js';
import { reflowText } from './textReflow.js';
import { applyColorVision } from './colorVision.js';
import { applyGrayscale } from './grayscale.js';
const TEXT_SKIP = 'script,style,noscript,svg,svg *,canvas,iframe,[data-uaw-ignore],[data-uaw-ignore] *,[data-uaw-icon],[data-uaw-icon] *,[aria-hidden="true"],[aria-hidden="true"] *';
const SCOPE = ':where([data-uaw-scope], [data-uaw-scope] *):not(:where([data-uaw-ignore],[data-uaw-ignore] *))';
const TEXT = `${SCOPE}:not(:where(svg, svg *, img, video, canvas, [data-uaw-icon], [data-uaw-icon] *, [data-uaw-ignore], [data-uaw-ignore] *))`;

export function createContentEngine({ root = document.body, host, nonce }) {
  const journal = new Map();
  const scopes = new Map();
  let current, timer, dyslexiaReady=false;
  const stylesheet = document.createElement('style');
  if (nonce) stylesheet.nonce = nonce;
  stylesheet.dataset.uawStyle = '';
  document.head.append(stylesheet);

  function override(el, property, value) {
    let entries = journal.get(el);
    if (!entries) journal.set(el, entries = { hadStyle: el.hasAttribute('style'), properties: new Map() });
    if (!entries.properties.has(property)) entries.properties.set(property, { value: el.style.getPropertyValue(property), priority: el.style.getPropertyPriority(property) });
    el.style.setProperty(property, value, 'important');
  }
  function restore() {
    for (const [el, entries] of journal) {
      for (const [property, original] of entries.properties) {
        if (original.value) el.style.setProperty(property, original.value, original.priority);
        else el.style.removeProperty(property);
      }
      if (!entries.hadStyle && !el.getAttribute('style')) el.removeAttribute('style');
    }
    journal.clear();
  }
  function scopeContent() {
    for (const el of root === document.body ? root.children : [root]) {
      if (el === host || el.matches('script,style,link,[data-uaw-ignore]')) continue;
      if (!scopes.has(el)) scopes.set(el, el.getAttribute('data-uaw-scope'));
      el.setAttribute('data-uaw-scope', '');
    }
    // Release detached roots so navigation doesn't accumulate page references.
    for (const [el, previous] of scopes) if (!el.isConnected) {
      previous === null ? el.removeAttribute('data-uaw-scope') : el.setAttribute('data-uaw-scope', previous);
      scopes.delete(el);
    }
  }
  function apply(settings) {
    current = settings;
    // Host transition:all must not animate baseline restoration. Otherwise a
    // mid-transition font size gets multiplied again on every content refresh.
    stylesheet.textContent = `${SCOPE}{transition:none!important;}`;
    restore();
    scopeContent();
    const elements = [...scopes.keys()].flatMap(el => [el, ...el.querySelectorAll('*')])
      .filter(el => el instanceof HTMLElement && el !== host && !el.matches(TEXT_SKIP));
    // Measure every baseline before changing any inherited font size.
    if (settings.fontScale !== 1) {
      const sizes = elements.map(el => {
        const style=getComputedStyle(el);
        return {font:parseFloat(style.fontSize),line:parseFloat(style.lineHeight)};
      });
      elements.forEach((el, i) => {
        if (Number.isFinite(sizes[i].font)) override(el, 'font-size', `${sizes[i].font * settings.fontScale}px`);
        const customLine=settings.spacingPreset!=='default' && (settings.spacingPreset!=='custom' || settings.customSpacingOverrides?.includes('lineHeight'));
        if (!customLine && Number.isFinite(sizes[i].line)) override(el, 'line-height', `${sizes[i].line * settings.fontScale}px`);
      });
    }
    let css = '';
    if (settings.colorVisionMode !== 'default') {
      applyColorVision([...new Set([root, ...elements])], settings.colorVisionMode, override);
      for (const el of scopes.keys()) for (const [property, value] of Object.entries(colorModeVariables(settings.colorVisionMode))) override(el, property, value);
      css += colorSupportCss(SCOPE);
    }
    if (settings.fontScale !== 1 || settings.dyslexiaFont) css += `${TEXT}{overflow-wrap:anywhere!important;}`;
    if (settings.theme === 'light') applyLightTheme([...new Set([root,...elements])], override);
    if (settings.theme === 'dark' || settings.theme === 'contrast') {
      const palette = settings.theme === 'dark' ? ['#101827', '#e8eef9', '#9db8ff', '#93a4bd']
        : settings.theme === 'contrast' ? ['#000000', '#ffffff', '#ffff00', '#ffffff']
        : ['#ffffff', '#0f172a', '#1d4ed8', '#64748b'];
      const [bg, fg, link, border] = palette;
      css += `${TEXT}{color:${fg}!important;background-color:${bg}!important;border-color:${border}!important;text-shadow:none!important;}
      ${SCOPE}:where(div,section,main,header,footer,nav,article,aside,form,fieldset,details,summary,table,thead,tbody,tr,td,th,dialog,button,input,select,textarea){background-color:${bg}!important;background-image:none!important;}
      ${SCOPE}:where(a){color:${link}!important;}
      ${SCOPE}:where(button,input,select,textarea,a[role="button"],a.button){color:${fg}!important;border:1px solid ${border}!important;}
      ${SCOPE}:where(input,textarea)::placeholder{color:${border}!important;opacity:1!important;}
      ${SCOPE}:where(:focus-visible){outline:3px solid ${link}!important;outline-offset:3px!important;}`;
    }
    if (settings.spacingPreset !== 'default') {
      const enabled = key => settings.spacingPreset !== 'custom' || settings.customSpacingOverrides?.includes(key);
      const declarations = [['letterSpacing','letter-spacing','em'], ['wordSpacing','word-spacing','em'], ['lineHeight','line-height','']]
        .filter(([key]) => enabled(key)).map(([key, property, unit]) => `${property}:${settings[key]}${unit}!important;`).join('');
      if (declarations) css += `${TEXT}{${declarations}overflow-wrap:anywhere!important;}`;
      if (enabled('paragraphSpacing')) css += `${SCOPE}:where(p){margin-block-end:${settings.paragraphSpacing}em!important;}`;
    }
    if (settings.dyslexiaFont) css += dyslexiaFontCss + `${TEXT}{font-family:"UAW OpenDyslexic",sans-serif!important;}`;
    if (settings.highlightLinks) {
      const controls = `${SCOPE}:where(a[href],area[href],button,input[type="button"],input[type="submit"],input[type="reset"],input[type="image"],[role="button"],[role="link"],summary)`;
      const color = ['dark','contrast'].includes(settings.theme) ? '#facc15' : '#2563eb';
      const halo = ['dark','contrast'].includes(settings.theme) ? '#101827' : '#ffffff';
      css += `${controls}{outline:2px solid ${color}!important;outline-offset:3px!important;box-shadow:0 0 0 3px ${halo}!important;border-radius:3px!important;}
      ${SCOPE}:where(a[href],[role="link"]){text-decoration:underline!important;text-decoration-thickness:2px!important;text-underline-offset:4px!important;}
      ${controls}:focus-visible{outline:3px dashed ${color}!important;outline-offset:5px!important;}`;
    }
    if (settings.grayscale) applyGrayscale([...scopes.keys()],override);
    // Commit scaled inline values while transitions are disabled, then return
    // the host's hover/focus transitions unchanged.
    root.getBoundingClientRect();
    stylesheet.textContent = css;
    if(settings.fontScale>1 || settings.dyslexiaFont || settings.spacingPreset!=='default') {
      reflowText(elements,override);
      if(settings.dyslexiaFont && !dyslexiaReady && document.fonts) {
        dyslexiaReady=true;
        document.fonts.load('16px "UAW OpenDyslexic"').then(()=>refresh());
      }
    }
  }
  function refresh() { clearTimeout(timer); timer = setTimeout(() => { if (current) apply(current); }, 80); }
  const observer = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node => node !== host && node.nodeType === 1))) refresh();
  });
  observer.observe(root, { childList: true, subtree: true });
  window.addEventListener('resize', refresh);
  return {
    apply, refresh,
    destroy() {
      current=null;
      clearTimeout(timer); observer.disconnect(); window.removeEventListener('resize', refresh); restore(); stylesheet.remove();
      for (const [el, previous] of scopes) previous === null ? el.removeAttribute('data-uaw-scope') : el.setAttribute('data-uaw-scope', previous);
      scopes.clear();
    },
  };
}
