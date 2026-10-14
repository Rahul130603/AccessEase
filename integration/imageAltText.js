// Show supplied image descriptions without changing the image's accessible name.
export function showImageAltText({ document: doc = document, host } = {}) {
  const labels = new Map();
  const style = doc.createElement('style');
  style.textContent = '.accessease-image-alt{display:block;box-sizing:border-box;max-width:100%;margin:10px 0;padding:10px 15px;border:1px solid var(--border,#e2e8f0);border-radius:10px;background:var(--surface,#fff);color:var(--text,#0f172a);font:inherit;font-size:.9em;line-height:1.5;overflow-wrap:anywhere}';
  doc.head.append(style);
  function scan() {
    const images = new Set([...doc.querySelectorAll('img')].filter(image =>
      !host?.contains(image) && image.getAttribute('alt')?.trim() &&
      image.getAttribute('role') !== 'presentation' && image.getAttribute('aria-hidden') !== 'true'));
    for (const [image, label] of labels) {
      if (!images.has(image)) { label.remove(); labels.delete(image); }
    }
    for (const image of images) {
      let label = labels.get(image);
      if (!label) {
        label = doc.createElement('span');
        label.className = 'accessease-image-alt';
        // The original alt already gives screen readers this description.
        label.setAttribute('aria-hidden', 'true');
        labels.set(image, label);
      }
      const text = image.getAttribute('alt').trim();
      if (label.textContent !== text) label.textContent = text;
      const anchor = image.closest('a,button,picture') || image;
      let sibling = anchor.nextSibling;
      while (sibling?.classList?.contains('accessease-image-alt') && sibling !== label) sibling = sibling.nextSibling;
      if (sibling !== label) anchor.after(label);
    }
  }
  const observer = new doc.defaultView.MutationObserver(scan);
  observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['alt', 'role', 'aria-hidden'] });
  scan();
  return () => { observer.disconnect(); for (const label of labels.values()) label.remove(); labels.clear(); style.remove(); };
}
