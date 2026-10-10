/**
 * A pragmatic accessible-name computation for the audit.
 *
 * This is deliberately a *subset* of the ACCNAME algorithm, ordered the way the
 * specification orders it, and it returns the source it used. The audit shows that
 * source ("name from: title only") rather than just "has a name", because the
 * quality of a name source matters — and it refuses to guess: anything it cannot
 * compute is reported as no name, never as an assumed name.
 *
 * Semantic HTML comes first: `element.labels` (the native label association) is
 * checked before any ARIA attribute fallback could be needed.
 */

const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);

function textFrom(node, options) {
  const { skip = null, includeAlt = true } = options;
  if (!node || node === skip) return '';
  if (node.nodeType === 3) return node.nodeValue || '';
  if (node.nodeType !== 1) return '';

  const tag = node.tagName;
  if (SKIPPED_TAGS.has(tag)) return '';
  if (typeof node.getAttribute === 'function' && node.getAttribute('aria-hidden') === 'true') return '';
  if (tag === 'IMG') {
    const alt = node.getAttribute('alt');
    return includeAlt && alt ? alt : '';
  }
  // An <svg> contributes its own name only through its own <title>/aria-label,
  // which is handled by the caller, not by text aggregation.
  if (tag === 'SVG') return '';

  let output = '';
  const children = node.childNodes || [];
  for (let index = 0; index < children.length; index += 1) {
    output += textFrom(children[index], options);
  }
  return output;
}

/**
 * Visible text of an element, ignoring script/style and aria-hidden subtrees.
 * @param {Element} element
 * @param {{skip?: Element|null, includeAlt?: boolean}} [options]
 */
export function visibleText(element, options = {}) {
  return textFrom(element, { skip: options.skip || null, includeAlt: options.includeAlt !== false })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @typedef {object} AccessibleName
 * @property {string} name
 * @property {'aria-labelledby'|'aria-label'|'label'|'alt'|'alt-empty'|'value'|'text'|'title'|'placeholder'|'none'} source
 */

/**
 * @param {Element} element
 * @returns {AccessibleName}
 */
export function getAccessibleName(element) {
  if (!element || element.nodeType !== 1 || typeof element.getAttribute !== 'function') {
    return { name: '', source: 'none' };
  }

  const documentRef = element.ownerDocument || (typeof document !== 'undefined' ? document : null);

  // 1. aria-labelledby (IDs are resolved in the light DOM only)
  const labelledBy = (element.getAttribute('aria-labelledby') || '').trim();
  if (labelledBy && documentRef) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => {
        const target = documentRef.getElementById(id);
        return target ? visibleText(target) : '';
      })
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text) return { name: text, source: 'aria-labelledby' };
  }

  // 2. aria-label
  const ariaLabel = (element.getAttribute('aria-label') || '').trim();
  if (ariaLabel) return { name: ariaLabel, source: 'aria-label' };

  // 3. the native association (semantic HTML first)
  if (element.labels && element.labels.length) {
    const text = Array.from(element.labels)
      .map((label) => visibleText(label))
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text) return { name: text, source: 'label' };
  }

  // 4. images
  if (element.tagName === 'IMG' || (element.tagName === 'INPUT' && (element.getAttribute('type') || '').toLowerCase() === 'image')) {
    const alt = (element.getAttribute('alt') || '').trim();
    if (alt) return { name: alt, source: 'alt' };
    return { name: '', source: element.hasAttribute('alt') ? 'alt-empty' : 'none' };
  }

  // 5. input buttons use their value
  if (element.tagName === 'INPUT') {
    const type = (element.getAttribute('type') || 'text').toLowerCase();
    if (type === 'submit' || type === 'button' || type === 'reset') {
      const value = (element.getAttribute('value') || '').trim();
      if (value) return { name: value, source: 'value' };
    }
  }

  // 6. content (links, buttons, and other containers)
  const content = visibleText(element);
  if (content) return { name: content, source: 'text' };

  // 7. weak fallbacks — reported as weak by the caller
  const title = (element.getAttribute('title') || '').trim();
  if (title) return { name: title, source: 'title' };

  const placeholder = (element.getAttribute('placeholder') || '').trim();
  if (placeholder) return { name: placeholder, source: 'placeholder' };

  return { name: '', source: 'none' };
}

/** Human-readable description of where a name came from (for findings). */
export function describeNameSource(source) {
  switch (source) {
    case 'aria-labelledby':
      return 'name from aria-labelledby';
    case 'aria-label':
      return 'name from aria-label';
    case 'label':
      return 'name from a <label> element';
    case 'alt':
      return 'name from the image alt text';
    case 'alt-empty':
      return 'empty alt attribute';
    case 'value':
      return 'name from the input value';
    case 'text':
      return 'name from the element text';
    case 'title':
      return 'name from the title attribute only';
    case 'placeholder':
      return 'no name; only a placeholder is present';
    default:
      return 'no accessible name found';
  }
}
