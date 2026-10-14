import { maskSizeLimit } from './preferenceStore.js';

export function createReadingEngine({ shadow, root, update }) {
  const guide = shadow.querySelector('.guide');
  const masks = shadow.querySelectorAll('.mask');
  const magnifier = shadow.querySelector('.magnifier');
  const preview = shadow.querySelector('.magnifier-text');
  const dismiss = shadow.querySelector('.overlay-close');
  const sizeControls = shadow.querySelectorAll('.reading-size-controls');
  let passageOffset = 0;
  let settings, x = window.innerWidth / 2, y = window.innerHeight / 2, frame = 0, target, focusTracking = false;
  const excluded = '[data-uaw-ignore],[aria-hidden="true"],[hidden],[role="img"],[data-logo],script,style,template,img,picture,svg,canvas,video,audio,iframe,input[type="password"],input[type="hidden"]';

  function isExcluded(element) {
    if (!element || element.closest(excluded)) return true;
    // Wordmarks are sometimes text inside a logo wrapper rather than images.
    for (let current = element; current; current = current.parentElement) {
      if (/(^|[\s_-])logo([\s_-]|$)/i.test(current.id + ' ' + (current.getAttribute('class') || ''))) return true;
    }
    return false;
  }

  function readableText(element) {
    passageOffset = 0;
    if (isExcluded(element)) return '';
    let boundary = element;
    while (!root.contains(boundary) && boundary.getRootNode().host) boundary = boundary.getRootNode().host;
    if (!root.contains(boundary) || isExcluded(boundary)) return '';
    const visible = item => { const style = getComputedStyle(item); return style.visibility === 'visible' && style.display !== 'none'; };
    if (!visible(element)) return '';
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return ['password','hidden','checkbox','radio','range','color','file','image'].includes(element.type) ? '' : (element.value || element.placeholder || '').trim();
    }
    if (element instanceof HTMLSelectElement) return [...element.selectedOptions].map(option => option.text).join(' ').trim();
    // Keep inline links and emphasis together as one continuous paragraph.
    const block = element.closest('p,li,blockquote,h1,h2,h3,h4,h5,h6,figcaption,td,th,label,button') || element;
    if (isExcluded(block)) return '';
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let node, text = '', hit = focusTracking;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim() || isExcluded(node.parentElement) || !visible(node.parentElement)) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      if (!focusTracking && [...range.getClientRects()].some(rect => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)) {
        hit = true;
        const caret = document.caretPositionFromPoint?.(x,y);
        const legacy = !caret && document.caretRangeFromPoint?.(x,y);
        const offset = caret?.offsetNode === node ? caret.offset : legacy?.startContainer === node ? legacy.startOffset : 0;
        passageOffset = text.length + offset;
      }
      text += node.textContent;
    }
    // Do not collect neighboring sections just because a layout container is hovered.
    if (!hit) return '';
    const before = text.slice(0,passageOffset).replace(/\s+/g,' ').trimStart();
    passageOffset = before.length;
    return text.replace(/\s+/g,' ').trim();
  }

  function fitPassage(text) {
    const words = [...text.matchAll(/\S+/g)];
    if (!words.length) return false;
    const fits = () => preview.scrollHeight <= preview.clientHeight && preview.scrollWidth <= preview.clientWidth;
    preview.textContent = text;
    if (fits()) return true;
    // Long paragraphs advance with the hovered word, without scrollbars or shrinking text.
    const active = Math.max(0, words.findIndex(word => word.index + word[0].length >= passageOffset));
    const start = Math.max(0, active - 3);
    let low = 0, high = words.length - start;
    while (low < high) {
      const count = Math.ceil((low + high) / 2);
      preview.textContent = words.slice(start,start + count).map(word => word[0]).join(' ');
      if (fits()) low = count; else high = count - 1;
    }
    preview.textContent = words.slice(start,start + low).map(word => word[0]).join(' ');
    return low > 0;
  }

  function positionPreview() {
    const margin = 10, gap = 18;
    const anchorY = focusTracking && target ? target.getBoundingClientRect().bottom : y;
    const { width, height } = magnifier.getBoundingClientRect();
    const left = Math.max(margin, Math.min(x + gap, window.innerWidth - width - margin));
    const preferredTop = anchorY + gap + height <= window.innerHeight - margin ? anchorY + gap : anchorY - height - gap;
    const top = Math.max(margin, Math.min(preferredTop, window.innerHeight - height - margin));
    magnifier.style.left = `${left}px`;
    magnifier.style.top = `${top}px`;
  }

  function render() {
    frame = 0;
    shadow.host.style.setProperty('--guide-y', `${Math.max(0, Math.min(window.innerHeight, y))}px`);
    const maskHeight = Math.min(window.innerHeight, settings?.maskHeight || 120);
    const maskY = Math.max(maskHeight / 2, Math.min(y, window.innerHeight - maskHeight / 2));
    shadow.host.style.setProperty('--mask-height', `${maskHeight}px`);
    shadow.host.style.setProperty('--mask-y', `${maskY}px`);
    const maskInput = shadow.querySelector('[data-setting="maskHeight"]');
    maskInput.max = String(maskSizeLimit());
    maskInput.value = String(Math.min(settings?.maskHeight || 120, maskSizeLimit()));
    shadow.querySelector('[data-output="maskHeight"]').textContent = `${maskHeight}px`;
    shadow.querySelector('[data-reading-key="maskHeight"][data-reading-step="1"]').disabled = settings?.maskHeight >= maskSizeLimit();
    const controlHeight = sizeControls[0].getBoundingClientRect().height;
    const controlY = Math.max(12 + controlHeight / 2, Math.min(y, window.innerHeight - 90 - controlHeight / 2));
    shadow.host.style.setProperty('--reading-controls-y', `${controlY}px`);
    if (!settings?.magnifier || !target) { magnifier.hidden = true; return; }
    const text = readableText(target);
    magnifier.hidden = !text;
    if (text) {
      magnifier.hidden = !fitPassage(text);
      if (!magnifier.hidden) positionPreview();
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function pointer(event) {
    if (!settings || (!settings.readingGuide && !settings.readingMask && !settings.magnifier)) return;
    if (event.composedPath().includes(shadow.host)) return;
    focusTracking = false; x = event.clientX; y = event.clientY; target = event.composedPath().find(item => item instanceof Element) || null; schedule();
  }
  function focus(event) {
    if (!(event.target instanceof Element) || event.composedPath().includes(shadow.host)) return;
    focusTracking = true; target = event.target; const rect = target.getBoundingClientRect(); x = rect.left; y = rect.top + rect.height / 2; schedule();
  }
  function scroll() {
    if (focusTracking && document.activeElement && document.activeElement !== document.body && root.contains(document.activeElement)) focus({ target: document.activeElement, composedPath: () => [] });
    else { target = document.elementFromPoint(x, y); schedule(); }
  }
  document.addEventListener('pointermove', pointer, { passive: true });
  document.addEventListener('focusin', focus);
  window.addEventListener('scroll', scroll, { passive: true, capture: true });
  window.addEventListener('resize', scroll);
  const closeMask = () => update({ readingMask: false });
  dismiss.addEventListener('click', closeMask);
  return {
    apply(next) {
      settings = next;
      guide.hidden = !next.readingGuide;
      masks.forEach(mask => { mask.hidden = !next.readingMask; });
      magnifier.hidden = !next.magnifier || !target;
      dismiss.hidden = !next.readingMask;
      sizeControls.forEach(group => { group.hidden = !next.readingGuide && !next.readingMask; });
      shadow.querySelectorAll('[data-reading-key]').forEach(button => {
        const key = button.dataset.readingKey;
        button.hidden = !next[button.dataset.readingFeature];
        const [min,max] = key === 'guideHeight' ? [2,24] : [60,maskSizeLimit()];
        const value = next[key];
        button.disabled = Number(button.dataset.readingStep) < 0 ? value <= min : value >= max;
      });
      shadow.host.style.setProperty('--guide-height', `${next.guideHeight}px`);
      shadow.host.style.setProperty('--mask-height', `${next.maskHeight}px`);
      shadow.host.style.setProperty('--zoom', String(next.zoomLevel * next.fontScale));
      schedule();
    },
    destroy() {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', pointer); document.removeEventListener('focusin', focus);
      window.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', scroll);
      dismiss.removeEventListener('click', closeMask);
    },
  };
}
