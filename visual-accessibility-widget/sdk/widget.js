import panelCss from './panel.css?inline';
import controlsCss from './controls.css?inline';
import { icon } from './icons.js';
import { colorVisionControl } from './colorVisionControl.js';
import { getColorMode } from '../src/colorVision/colorModes.js';
import { DEFAULT_SETTINGS, SPACING_PRESETS, MIN_FONT_SCALE, MAX_FONT_SCALE, normalizeSettings, createPreferenceStore } from '../src/engine/preferenceStore.js';
import { createContentEngine } from '../src/engine/contentEngine.js';
import { createReadingEngine } from '../src/engine/readingEngine.js';
import { maskSizeLimit } from '../src/engine/preferenceStore.js';

const card = (id, name, description, symbol, control, extra = '') => `<div class="card" data-card="${id}"><div class="card-top"><span class="setting-icon">${icon(symbol)}</span><div class="setting-copy"><h3>${name}</h3></div>${control}</div>${extra}</div>`;
const toggle = (key, name) => `<button type="button" class="toggle" role="switch" aria-checked="false" aria-label="${name}" data-toggle="${key}"></button>`;
const themeToggle = (theme, name) => `<button class="theme-control theme-switch" type="button" role="switch" aria-label="${name}" data-theme="${theme}" aria-checked="false"><span class="theme-track" aria-hidden="true"></span></button>`;
const fontCard = () => `<div class="font-size-card" data-card="fontScale" role="group" aria-labelledby="uaw-font-title">
  <h3 id="uaw-font-title">Text Size</h3>
  <div class="font-size-control">
    <button class="font-step" type="button" data-action="decrease" aria-label="Decrease Text Size">${icon('minus')}</button>
    <button class="font-default" type="button" data-action="reset-font" aria-label="Reset text size" title="Reset text size to 100%"><span data-font-scale>100%</span></button>
    <button class="font-step" type="button" data-action="increase" aria-label="Increase Text Size">${icon('plus')}</button>
  </div>
</div>`;
const slider = (key, label, min, max, step) => `<div class="slider-row"><label for="uaw-${key}">${label}</label><input id="uaw-${key}" data-setting="${key}" type="range" min="${min}" max="${max}" step="${step}"/><output for="uaw-${key}" data-output="${key}"></output></div>`;
const readingSizeControls = side => `<div class="reading-size-controls reading-size-${side}" role="group" aria-label="${side === 'left' ? 'Decrease' : 'Increase'} reading tool sizes" hidden>${[['guideHeight','readingGuide','reading guide'],['maskHeight','readingMask','reading mask']].map(([key, feature, name]) => `<button type="button" class="reading-size-button" data-reading-key="${key}" data-reading-feature="${feature}" data-reading-step="${side === 'left' ? -1 : 1}" aria-label="${side === 'left' ? 'Decrease' : 'Increase'} ${name} size" title="${side === 'left' ? 'Decrease' : 'Increase'} ${name} size">${icon(side === 'left' ? 'minus' : 'plus')}</button>`).join('')}</div>`;
const spacingPreview = () => `<section class="spacing-preview" aria-label="Text spacing preview"><h4>Live preview</h4>${[['original','Original'],['adjusted','Adjusted']].map(([id, title]) => `<div class="spacing-preview-label">${title}</div><div class="spacing-preview-copy" data-spacing-preview="${id}"><p>Every reader deserves clear, comfortable text.</p><p>This second paragraph shows the paragraph gap.</p></div>`).join('')}</section>`;

function template() {
  return `<button type="button" class="launcher" aria-label="Accessibility Settings" title="Accessibility Settings" aria-expanded="false" aria-controls="uaw-panel">${icon('accessibility')}</button>
  <section class="panel" id="uaw-panel" role="dialog" aria-labelledby="uaw-title" aria-describedby="uaw-subtitle" hidden>
    <header class="panel-header"><span class="brand-icon">${icon('accessibility')}</span><div class="heading"><h2 id="uaw-title">Accessibility Settings</h2><p id="uaw-subtitle">Customize your browsing experience</p></div><button class="icon-button" type="button" data-close aria-label="Close accessibility panel">${icon('close')}</button></header>
    <div class="panel-body" tabindex="-1">
      <div class="section-title">Visual appearance <span>Make it yours</span></div>
      ${fontCard()}
      ${card('contrast', 'High Contrast Mode', 'Strong contrast, clearer boundaries', 'contrast', themeToggle('contrast', 'High Contrast Mode'))}
      ${card('dark', 'Dark Mode', 'A softer view in low light', 'moon', themeToggle('dark', 'Dark Mode'))}
      ${card('light', 'Light Mode', 'Bright surfaces, readable text', 'sun', themeToggle('light', 'Light Mode'))}
      ${card('grayscale', 'Grayscale Mode', 'View page content without color', 'grayscale', toggle('grayscale', 'Grayscale Mode'))}
      ${card('colorVisionMode', 'Color Blindness Support', 'Palettes, labels and patterns', 'eye', '', colorVisionControl())}
      <div class="section-title reading">Text & reading <span>Find your focus</span></div>
      ${card('spacingPreset', 'Text Spacing Adjustment', 'Give words a little breathing room', 'spacing', '', `<div class="segmented" aria-label="Text spacing presets">${['default','comfortable','wide','custom'].map(preset => `<button type="button" data-spacing="${preset}" aria-pressed="false">${preset[0].toUpperCase() + preset.slice(1)}</button>`).join('')}</div><div data-custom hidden>${slider('letterSpacing','Letter spacing',0,0.2,0.01)}${slider('wordSpacing','Word spacing',0,0.4,0.01)}${slider('lineHeight','Line height',1.2,2.5,0.1)}${slider('paragraphSpacing','Paragraph gap',0,3,0.1)}${spacingPreview()}</div>`)}
      ${card('magnifier', 'Magnifier / Zoom', 'An enlarged text reading region', 'zoom', toggle('magnifier','Magnifier / Zoom'), '<p>Magnification: 1.5×</p>')}
      ${card('highlightLinks', 'Highlight Links', 'Underline and outline every link', 'link', toggle('highlightLinks','Highlight Links'))}
      ${card('dyslexiaFont', 'Dyslexia-Friendly Font', 'Readable alternative: Verdana / Arial', 'font', toggle('dyslexiaFont','Dyslexia-Friendly Font'), '')}
      ${card('readingGuide', 'Reading Guide', 'Follow a line as you read', 'guide', toggle('readingGuide','Reading Guide'), slider('guideHeight','Guide height',2,24,2))}
      ${card('readingMask', 'Reading Mask', 'Dim distractions around your line', 'mask', toggle('readingMask','Reading Mask'), slider('maskHeight','Reading band',60,540,10))}
    </div>
    <footer class="panel-footer"><div class="footer-buttons"><button class="reset-button" type="button" data-action="reset">${icon('reset')}Reset All Settings</button><button class="close-button" type="button" data-close>Close Panel</button></div><div class="footer-meta"><span class="saved">${icon('check')}<span data-storage>Preferences saved locally</span></span><span>Universal Access · v1.0</span></div></footer>
    <p class="sr-only" role="status" aria-live="polite" data-announcement></p>
  </section>
  <div class="guide" hidden></div><div class="mask mask-top" hidden></div><div class="mask mask-bottom" hidden></div>
  ${readingSizeControls('left')}${readingSizeControls('right')}
  <button type="button" class="overlay-close" hidden>Dismiss reading mask</button>
  <section class="magnifier" aria-label="Magnified text" hidden><p class="magnifier-text"></p></section>`;
}

export function createWidget(options = {}) {
  const root = typeof options.root === 'string' ? document.querySelector(options.root) : options.root || document.body;
  if (!(root instanceof HTMLElement)) throw new Error('AccessibilityWidget: root must be an existing HTML element.');
  const store = createPreferenceStore(options.storageKey);
  let settings = store.load(), open = false, destroyed = false;
  const host = document.createElement('universal-accessibility-widget');
  host.dataset.uawIgnore = '';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  if (options.nonce) style.nonce = options.nonce;
  style.textContent = panelCss + controlsCss;
  shadow.append(style);
  const container = document.createElement('div'); container.innerHTML = template(); shadow.append(container);
  const color = /^#[0-9a-f]{6}$/i.test(options.primaryColor || '') ? options.primaryColor : '#2563eb';
  host.style.setProperty('--primary', color);
  document.body.append(host);
  const launcher = shadow.querySelector('.launcher');
  const panel = shadow.querySelector('.panel');
  const content = createContentEngine({ root, host, nonce: options.nonce });
  const reading = createReadingEngine({ shadow, root, update });

  function syncUI() {
    for (const button of shadow.querySelectorAll('[data-toggle]')) button.setAttribute('aria-checked', String(settings[button.dataset.toggle]));
    for (const button of shadow.querySelectorAll('[data-theme]')) {
      const active = settings.theme === button.dataset.theme;
      if (button.classList.contains('theme-control')) {
        button.setAttribute('aria-checked', String(active));
      } else button.setAttribute('aria-pressed', String(active));
    }
    for (const button of shadow.querySelectorAll('[data-spacing]')) button.setAttribute('aria-pressed', String(settings.spacingPreset === button.dataset.spacing));
    shadow.querySelector('[data-setting="maskHeight"]').max = String(maskSizeLimit());
    for (const input of shadow.querySelectorAll('[data-setting]')) input.value = String(settings[input.dataset.setting]);
    shadow.querySelector('[data-color-current]').textContent = getColorMode(settings.colorVisionMode).name;
    for (const output of shadow.querySelectorAll('[data-output]')) {
      const key = output.dataset.output;
      const value = key === 'maskHeight' ? Math.min(settings[key], window.innerHeight) : settings[key];
      output.textContent = `${value}${key === 'lineHeight' ? '×' : key.endsWith('Height') ? 'px' : 'em'}`;
    }
    for (const cardEl of shadow.querySelectorAll('[data-card]')) {
      const key = cardEl.dataset.card;
      const active = ['contrast', 'dark', 'light'].includes(key) ? settings.theme === key
        : ['increase', 'decrease'].includes(key) ? settings.fontScale !== 1
        : settings[key] !== DEFAULT_SETTINGS[key];
      cardEl.classList.toggle('active', active);
    }
    shadow.querySelectorAll('[data-font-scale]').forEach(label => { label.textContent = `${Math.round(settings.fontScale * 100)}%`; });
    shadow.querySelectorAll('[data-action="increase"]').forEach(button => { button.disabled = settings.fontScale >= MAX_FONT_SCALE; });
    shadow.querySelectorAll('[data-action="decrease"]').forEach(button => { button.disabled = settings.fontScale <= MIN_FONT_SCALE; });
    shadow.querySelector('[data-custom]').hidden = settings.spacingPreset !== 'custom';
    const sample = shadow.querySelector('[data-spacing-preview="adjusted"]');
    for (const [key, property, unit] of [['letterSpacing','letter-spacing','em'],['wordSpacing','word-spacing','em'],['lineHeight','line-height',''],['paragraphSpacing','--preview-paragraph-gap','em']]) {
      if (settings.customSpacingOverrides.includes(key)) sample.style.setProperty(property, `${settings[key]}${unit}`);
      else sample.style.removeProperty(property);
    }
    shadow.querySelectorAll('.sample').forEach(sample => { sample.classList.toggle('tritanopia', settings.colorVisionMode === 'tritanopia'); });
  }
  function notify(message) {
    shadow.querySelector('[data-announcement]').textContent = message;
    host.dispatchEvent(new CustomEvent('uaw:change', { detail: { ...settings }, bubbles: true, composed: true }));
    if (typeof options.onChange === 'function') options.onChange({ ...settings });
  }
  function update(patch, message = 'Accessibility preferences updated.') {
    if (destroyed) return;

    if ((patch.spacingPreset || settings.spacingPreset) === 'custom' && !Object.hasOwn(patch, 'customSpacingOverrides')) {
      const fields = Object.keys(SPACING_PRESETS.default).filter(key => Object.hasOwn(patch, key));
      if (fields.length) patch = { ...patch, customSpacingOverrides: [...settings.customSpacingOverrides, ...fields] };
    }
    settings = normalizeSettings({ ...settings, ...patch });
    content.apply(settings); reading.apply(settings); syncUI();
    const saved = store.save(settings);
    shadow.querySelector('[data-storage]').textContent = saved ? 'Preferences saved locally' : 'Preferences active for this visit';
    notify(message);
  }
  function setOpen(value) {
    if (destroyed) return;
    open = value; panel.hidden = !open; launcher.setAttribute('aria-expanded', String(open));
    if (open) shadow.querySelector('[data-close]').focus(); else launcher.focus();
  }
  function click(event) {
    const button = event.target.closest('button'); if (!button) return;
    if (button === launcher) return setOpen(!open);
    if (button.hasAttribute('data-close')) return setOpen(false);
    if (button.dataset.toggle) return update({ [button.dataset.toggle]: !settings[button.dataset.toggle] }, `${button.getAttribute('aria-label')} ${settings[button.dataset.toggle] ? 'disabled' : 'enabled'}.`);
    if (button.dataset.readingKey) {
      const key = button.dataset.readingKey;
      const [min, max, step] = key === 'guideHeight' ? [2,24,2] : [60,maskSizeLimit(),10];
      const current = Math.min(settings[key], max);
      return update({ [key]: Math.max(min, Math.min(max, current + Number(button.dataset.readingStep) * step)) }, `${key === 'guideHeight' ? 'Reading guide' : 'Reading mask'} size adjusted.`);
    }
    if (button.dataset.theme) {
      const theme = settings.theme === button.dataset.theme ? 'default' : button.dataset.theme;
      return update({ theme }, theme === 'default' ? 'Theme removed. Website default restored.' : `${theme === 'contrast' ? 'High contrast' : theme} theme applied.`);
    }
    if (button.dataset.spacing) {
      const preset = button.dataset.spacing;
      return update({ spacingPreset: preset, ...(SPACING_PRESETS[preset] || SPACING_PRESETS.default), customSpacingOverrides: [] }, `${preset} text spacing selected.`);
    }
    if (button.dataset.action === 'increase' || button.dataset.action === 'decrease') {
      const step = Math.round(settings.fontScale * 10) + (button.dataset.action === 'increase' ? 1 : -1);
      const scale = Math.max(MIN_FONT_SCALE, Math.min(MAX_FONT_SCALE, step / 10));
      return update({ fontScale: scale }, `Text size ${Math.round(scale * 100)} percent.`);
    }
    if (button.dataset.action === 'reset-font') return update({ fontScale: 1 }, 'Text size restored to 100 percent.');
    if (button.dataset.action === 'reset-color') return update({ colorVisionMode: 'default' }, 'Original website colors restored.');
    if (button.dataset.action === 'reset') return update({ ...DEFAULT_SETTINGS }, 'All accessibility settings reset.');
  }
  function change(event) {
    const key = event.target.dataset.setting; if (!key) return;
    const value = typeof DEFAULT_SETTINGS[key] === 'number' ? Number(event.target.value) : event.target.value;
    const spacing = Object.hasOwn(SPACING_PRESETS.default, key) && settings.spacingPreset === 'custom'
      ? { customSpacingOverrides: [...settings.customSpacingOverrides, key] } : {};
    update({ [key]: value, ...spacing }, `${event.target.labels?.[0]?.textContent || key} updated.`);
  }
  function keydown(event) {
    if (event.key !== 'Escape') return;
    if (open) { event.preventDefault(); setOpen(false); }
    else if (settings.readingMask || settings.magnifier) update({ readingMask: false, magnifier: false }, 'Reading overlays dismissed.');
  }
  function input(event) { if (event.target.type === 'range') change(event); }
  function selectChange(event) { if (event.target.type !== 'range') change(event); }
  shadow.addEventListener('click', click);
  shadow.addEventListener('input', input);
  shadow.addEventListener('change', selectChange);
  document.addEventListener('keydown', keydown);
  content.apply(settings); reading.apply(settings); syncUI();
  return {
    host, siteKey: options.siteKey || null,
    getSettings: () => ({ ...settings }),
    setSettings: update,
    open: () => setOpen(true), close: () => setOpen(false),
    reset: () => update({ ...DEFAULT_SETTINGS }, 'All accessibility settings reset.'),
    refresh: () => content.refresh(),
    destroy() {
      if (destroyed) return;
      destroyed = true; content.destroy(); reading.destroy();
      shadow.removeEventListener('click', click); shadow.removeEventListener('input', input); shadow.removeEventListener('change', selectChange);
      document.removeEventListener('keydown', keydown); host.remove();
    },
    get destroyed() { return destroyed; },
  };
}
