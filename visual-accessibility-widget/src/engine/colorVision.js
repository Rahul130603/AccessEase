import { getColorMode } from '../colorVision/colorModes.js';

const PRESERVE = 'img,picture,svg,canvas,video,iframe,[role="img"],[data-uaw-ignore],[data-uaw-preserve-colors]';
const rgba = value => {
  const parts = value.match(/[\d.]+/g)?.map(Number);
  return value.startsWith('rgb') && parts?.length >= 3 ? [...parts.slice(0, 3), parts[3] ?? 1] : [255, 255, 255, 0];
};
const luminance = rgb => rgb.slice(0, 3).map(value => {
  const channel = value / 255;
  return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);

// Adapt actual host colors, including sites that don't use our demo classes.
// Read all inherited colors before writing; the engine journal restores them.
export function applyColorVision(elements, mode, override) {
  const palette = getColorMode(mode).colors;
  const styles = new Map();
  function baseline(element) {
    if (!styles.has(element)) {
      const css = getComputedStyle(element);
      styles.set(element, { background: rgba(css.backgroundColor), image: css.backgroundImage, color: rgba(css.color), border: rgba(css.borderTopColor) });
    }
    return styles.get(element);
  }
  const snapshots = elements.filter(element => !element.closest(PRESERVE)).map(element => {
    const css = baseline(element);
    let ancestor = element, dark = false, photo = false;
    while (ancestor) {
      const parent = baseline(ancestor);
      if (parent.image.includes('url(')) { photo = true; break; }
      if (parent.background[3] > .5) { dark = luminance(parent.background) < .2; break; }
      ancestor = ancestor.parentElement;
    }
    return { element, css, dark, photo };
  });
  for (const { element, css, dark, photo } of snapshots) {
    if (photo) continue;
    const link = element.matches('a[href],[role="link"]');
    const solidControl = element.matches('button,[role="button"],input[type="submit"],input[type="button"]') && css.background[3] > .5 && luminance(css.background) < .6;
    if (css.background[3] > 0) {
      const surface = element === document.body ? palette.background : dark || solidControl ? palette.primary : luminance(css.background) > .95 ? palette.surface : palette.background;
      override(element, 'background-color', surface);
    }
    if (css.image.includes('gradient(')) override(element, 'background-image', 'none');
    override(element, 'color', dark || solidControl ? '#ffffff' : link ? palette.link : palette.text);
    if (css.border[3] > 0) override(element, 'border-color', dark || solidControl ? '#ffffff' : palette.primary);
    override(element, 'text-shadow', 'none');
    if (element.matches('input,textarea')) {
      // Native text fields always use the light surface, even in a dark region.
      override(element, 'background-color', palette.surface);
      override(element, 'color', palette.text);
    }
  }
}
