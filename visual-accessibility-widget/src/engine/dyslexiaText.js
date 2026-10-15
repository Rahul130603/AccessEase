const ICON = '[data-uaw-icon],[data-uaw-icon] *,[role="img"],svg,svg *';
const ICON_FONT = /unicons?|font\s*awesome|material\s*(icons|symbols)|icomoon|glyphicons|bootstrap-icons/i;

export function applyDyslexiaText(elements, override) {
  // Snapshot before changing parents so inherited icon fonts remain intact.
  const text = elements.filter(el => !el.matches(ICON) && !ICON_FONT.test(getComputedStyle(el).fontFamily) && (
    el.matches('input,textarea,select,option') || [...el.childNodes].some(node =>
      node.nodeType === 3 && /[^\s\uE000-\uF8FF]/u.test(node.textContent))
  ));
  for (const el of text) {
    // Inline importance also beats host heading/utility rules with !important.
    override(el, 'font-family', '"UAW OpenDyslexic", sans-serif');
  }
}
