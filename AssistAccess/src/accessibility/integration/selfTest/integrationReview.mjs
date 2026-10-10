/**
 * Integration review checks.
 *
 *     node src/accessibility/integration/selfTest/integrationReview.mjs
 *
 * Eight checks that a syntax checker cannot do, each aimed at a question from the
 * integration review:
 *
 *   1. duplicate literal `id` values across JSX files — the real source of broken
 *      `aria-labelledby` / `htmlFor` associations when two panels render at once
 *   2. settings-name consistency: every `settings.group.key`, `meta.key` and
 *      `strings.group.key` the code references must exist in the schema, the context
 *      and the copy table
 *   3. React DOM attribute hygiene in JSX (lowercase `class`, `for`, `tabindex`,
 *      `autocomplete`, … are warnings and silently do nothing)
 *   4. CSS scope: every static selector must be rooted at a namespaced class, `:host`
 *      or one of the module's `data-a11ytb-*` markers
 *   5. registry wiring: fourteen features, each with a Panel, a capability and WCAG refs
 *   6. focus coverage: every interactive class in the module's *light-DOM* stylesheet
 *      (which has no generic rule to fall back on) must carry its own focus rule
 *   7. controlled inputs: a JSX input with `value`/`checked` needs `onChange`, or to be
 *      deliberately `readOnly`/`disabled`, or React warns and the control is frozen
 *   8. list keys: heuristic comparison of `.map(` and `key=` counts per file
 *
 * Calibration notes (from the first run of this script, kept so the tool stays honest):
 *   - CSS in this module is authored in JS template literals for the shadow root, so the
 *     CSS extractor reads template-literal contents, not the raw file. Reading the raw
 *     file made the first version report JS statements as "unscoped selectors" and hide
 *     the light-DOM stylesheet entirely.
 *   - `meta.*` is matched only when it is not `settings.meta.*`.
 *   - String literals are stripped before path checks, so import paths such as
 *     `'../../strings.js'` are not mistaken for `strings.js` references.
 *   - Shadow-root interactive classes are covered by the module's generic
 *     `.a11ytb-root :is(button, input, …):focus` rule; the light-DOM stylesheet has no
 *     such fallback, so only its classes are required to carry their own focus rule.
 *
 * Exits non-zero when it reports an error, so it can be wired into CI.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { createDefaultSettings } from '../../core/settingsSchema.js';
import { defaultStrings } from '../../strings.js';

const root =
  process.argv[2] || new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const findings = [];
const report = (check, severity, message, hint) => findings.push({ check, severity, message, hint });

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/[.](js|jsx)$/.test(entry)) files.push(full);
  }
})(root);

const relative = (file) => file.slice(root.length).replace(/\\/g, '/');
const read = (file) => readFileSync(file, 'utf8');
const isReviewTool = (file) => file.includes('selfTest');

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function stripStrings(source) {
  let out = '';
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === quote) break;
        if (source[index] === '\n' && quote !== '`') break;
        index += 1;
      }
      index += 1;
      out += '""';
      continue;
    }
    out += char;
    index += 1;
  }
  return out;
}

/**
 * JSX opening tags with their attribute text, so checks can look at attributes only.
 * Strings are kept intact: `type="radio"` and `id="phone"` are attribute *values*, and
 * stripping them makes those checks silently match nothing.
 */
function jsxTags(source) {
  const cleaned = stripComments(source).replace(/=>/g, '= ');
  const tags = [];
  const pattern = /<([A-Za-z][A-Za-z0-9.]*)((?:"[^"]*"|'[^']*'|[^>'"])*)>/g;
  let match;
  while ((match = pattern.exec(cleaned))) tags.push({ name: match[1], attributes: match[2] });
  return tags;
}

/** CSS text of a stylesheet module, resolving template literals and simple constants. */
function cssOf(modulePath) {
  const file = join(root, modulePath);
  let source;
  try {
    source = read(file);
  } catch (error) {
    report('css-scope', 'error', `${modulePath} is missing`);
    return '';
  }
  // Comments go first: this module writes CSS inside template literals in JS files, and
  // JSDoc prose contains backticks, which would otherwise be mistaken for CSS strings.
  const withoutComments = stripComments(source);
  if (modulePath.endsWith('.css')) return withoutComments;

  const constants = new Map();
  const declaration = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:'([^']*)'|`([\s\S]*?)`)/g;
  const unescapeOnce = (text) =>
    text.replace(/\\(n|t|r|`|\\|')/g, (whole, char) =>
      ({ n: '\n', t: '\t', r: '\r', '`': '`', '\\': '\\', "'": "'" })[char],
    );
  let match;
  while ((match = declaration.exec(withoutComments))) {
    // Constant values are unescaped too: they are interpolated into the CSS text, so a
    // literal "\n" inside them would otherwise look like part of a selector.
    constants.set(match[1], unescapeOnce(match[2] !== undefined ? match[2] : match[3]));
  }

  const substitute = (text, rounds = 2) => {
    let current = text;
    for (let round = 0; round < rounds; round += 1) {
      current = current.replace(/\$\{([A-Za-z_$][\w$]*)\}/g, (whole, name) =>
        constants.has(name) ? constants.get(name) : whole,
      );
    }
    return current;
  };

  let css = '';
  const literal = /`([\s\S]*?)`/g;
  while ((match = literal.exec(withoutComments))) css += `${substitute(unescapeOnce(match[1]))}\n`;
  return stripComments(css);
}

/** Split a selector list on top-level commas only (commas inside :is() are not separators). */
function splitSelectors(selectorText) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of selectorText) {
    if (char === '(' || char === '[') depth += 1;
    if (char === ')' || char === ']') depth = Math.max(0, depth - 1);
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

// ── 1. Duplicate literal ids in JSX ────────────────────────────────────────
/**
 * id → Map(file → occurrences).
 *
 * Unit tests under integration/tests/ are skipped: each `it()` renders its own
 * document, so reusing a fixture id across tests cannot collide. The dev harness is
 * *not* skipped — it is one page, so its ids really do share a document.
 */
const idUsage = new Map();
for (const file of files) {
  if (!file.endsWith('.jsx') || isReviewTool(file)) continue;
  if (relative(file).includes('integration/tests/')) continue;
  jsxTags(read(file)).forEach((tag) => {
    const idMatch = /\sid="([A-Za-z][\w:.-]*)"/.exec(tag.attributes);
    if (!idMatch) return;
    const id = idMatch[1];
    if (!idUsage.has(id)) idUsage.set(id, new Map());
    const perFile = idUsage.get(id);
    const name = relative(file);
    perFile.set(name, (perFile.get(name) || 0) + 1);
  });
}
idUsage.forEach((perFile, id) => {
  const entries = Array.from(perFile.entries());
  const repeated = entries.filter(([, count]) => count > 1);
  if (repeated.length > 0) {
    // Two elements with the same id in one file's markup always render together.
    report(
      'duplicate-id',
      'error',
      `literal id "${id}" is used ${repeated[0][1]} times in ${repeated[0][0]}`,
      'Ids must be unique within a document; use useId() for per-instance ids.',
    );
    return;
  }
  if (entries.length > 1) {
    // Across files this is a risk, not a certainty: the two components may never
    // render in the same document.
    report(
      'duplicate-id',
      'warning',
      `literal id "${id}" also appears in ${entries
        .slice(1)
        .map(([name]) => name)
        .join(', ')} (first in ${entries[0][0]})`,
      'Fine if they never render together; use useId() if they can.',
    );
  }
});

// ── 2. Settings, meta and copy name consistency ────────────────────────────
const defaults = createDefaultSettings();
const metaKeys = new Set([
  'hydrated',
  'storageMode',
  'storageDegraded',
  'storageKey',
  'lastSavedAt',
  'storageError',
  'osReducedMotion',
  'effectiveReducedMotion',
  'verbosity',
  'schemaVersion',
  'apiVersion',
]);

function pathExists(object, path) {
  let current = object;
  for (const segment of path) {
    if (current === null || typeof current !== 'object' || !(segment in current)) return false;
    current = current[segment];
  }
  return true;
}

for (const file of files) {
  if (isReviewTool(file)) continue;
  const source = stripComments(stripStrings(read(file)));
  const label = relative(file);
  let match;

  const settingsRefs = /\bsettings\.([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)/g;
  while ((match = settingsRefs.exec(source))) {
    const [, group, key] = match;
    if (!(group in defaults)) {
      report('settings-name', 'error', `settings.${group} does not exist in the schema (${label})`);
    } else if (!(key in defaults[group])) {
      report('settings-name', 'error', `settings.${group}.${key} does not exist in the schema (${label})`);
    }
  }

  const metaRefs = /(?<![.\w$])meta\.([A-Za-z_$][\w$]*)/g;
  while ((match = metaRefs.exec(source))) {
    if (!metaKeys.has(match[1])) {
      report('meta-name', 'error', `meta.${match[1]} is not provided by the settings context (${label})`);
    }
  }

  const stringRefs = /\bstrings\.([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?(?:\.([A-Za-z_$][\w$]*))?/g;
  while ((match = stringRefs.exec(source))) {
    const [, group, key, sub] = match;
    if (['length', 'map', 'join', 'concat'].includes(group)) continue;
    const path = [group, key, sub].filter(Boolean);
    if (!pathExists(defaultStrings, path)) {
      report('copy-name', 'error', `strings.${path.join('.')} is missing from strings.js (${label})`);
    }
  }
}

// ── 3. React DOM attribute hygiene ─────────────────────────────────────────
const DOM_ATTRIBUTE_FIXES = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  maxlength: 'maxLength',
  readonly: 'readOnly',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  srcset: 'srcSet',
  inputmode: 'inputMode',
  spellcheck: 'spellCheck',
  autocorrect: 'autoCorrect',
  autocapitalize: 'autoCapitalize',
  crossorigin: 'crossOrigin',
  contenteditable: 'contentEditable',
  enctype: 'encType',
  formaction: 'formAction',
  novalidate: 'noValidate',
  usemap: 'useMap',
  accesskey: 'accessKey',
  allowfullscreen: 'allowFullScreen',
};

for (const file of files) {
  if (!file.endsWith('.jsx') || isReviewTool(file)) continue;
  jsxTags(read(file)).forEach((tag) => {
    Object.keys(DOM_ATTRIBUTE_FIXES).forEach((attribute) => {
      if (new RegExp(`\\s${attribute}\\s*=`).test(tag.attributes)) {
        report(
          'react-attribute',
          'warning',
          `lowercase "${attribute}" on <${tag.name}> should be "${DOM_ATTRIBUTE_FIXES[attribute]}" (${relative(file)})`,
        );
      }
    });
  });
}

// ── 4. CSS scope ───────────────────────────────────────────────────────────
const CSS_MODULES = [
  'ui/styles/tokens.js',
  'ui/styles/primitives.js',
  'ui/styles/panel.js',
  'ui/styles/highContrast.js',
  'ui/styles/reducedMotion.js',
  'ui/styles/widget.js',
  'patterns/appStyles.js',
  'core/apply/forcedStyles.js',
  'accessibility.css',
];
const ALLOWED_SELECTOR_START = /^(\.a11ytb-|:host|\[data-a11ytb)/;

const cssByModule = new Map();
CSS_MODULES.forEach((modulePath) => {
  const css = cssOf(modulePath);
  cssByModule.set(modulePath, css);
  const rulePattern = /([^{}]+)\{/g;
  let match;
  while ((match = rulePattern.exec(css))) {
    const selectorText = match[1].trim();
    if (!selectorText || selectorText.startsWith('@')) continue;
    if (/^(from|to|\d+%)$/.test(selectorText)) continue;
    if (selectorText.includes('${')) {
      report('css-scope', 'warning', `dynamic selector "${selectorText}" in ${modulePath} (verify by eye)`);
      continue;
    }
    selectorText && splitSelectors(selectorText).forEach((selector) => {
      const trimmed = selector.trim();
      if (!trimmed || !ALLOWED_SELECTOR_START.test(trimmed)) {
        report(
          'css-scope',
          'error',
          `unscoped selector "${trimmed}" in ${modulePath}`,
          'Root every selector at .a11ytb-*, :host or a data-a11ytb-* marker.',
        );
      }
    });
  }
});

// ── 5. Registry wiring ─────────────────────────────────────────────────────
const registry = read(join(root, 'features/registry.js'));
const counts = {
  features: (registry.match(/id: FEATURE_IDS\./g) || []).length,
  panels: (registry.match(/\bPanel:/g) || []).length,
  capabilities: (registry.match(/\bcapability:/g) || []).length,
  wcag: (registry.match(/\bwcag:\s*\[/g) || []).length,
  summaries: (registry.match(/\bsummary:/g) || []).length,
};
if (counts.features !== 14) report('registry', 'error', `registry declares ${counts.features} features, expected 14`);
if (counts.panels !== 14) report('registry', 'error', `registry has ${counts.panels} Panel entries, expected 14`);
if (counts.capabilities !== 14) report('registry', 'error', `registry has ${counts.capabilities} capability entries, expected 14`);
if (counts.wcag !== 14) report('registry', 'error', `registry has ${counts.wcag} wcag arrays, expected 14`);
if (counts.summaries !== 14) report('registry', 'error', `registry has ${counts.summaries} summaries, expected 14`);

// ── 6. Focus coverage ──────────────────────────────────────────────────────
/** Classes rendered by app-owned components: the light DOM has no generic focus rule. */
const LIGHT_DOM_INTERACTIVE = [
  '.a11ytb-form__control',
  '.a11ytb-form__submit',
  '.a11ytb-link-button',
  '.a11ytb-password__toggle',
  '.a11ytb-error-summary',
  '.a11ytb-safe-motion__button',
  '.a11ytb-skip-link',
  '.a11ytb-dialog__button',
];
/** Classes rendered inside the shadow root: covered by the generic rule below. */
const SHADOW_INTERACTIVE = [
  '.a11ytb-launcher--circle',
  '.a11ytb-widget__close',
  '.a11ytb-quick__profile',
  '.a11ytb-disclosure__button',
  '.a11ytb-outline__button',
  '.a11ytb-button',
  '.a11ytb-icon-button',
  '.a11ytb-switch',
];

const appOwnedCss = cssByModule.get('patterns/appStyles.js') || '';
const shadowCss = CSS_MODULES.filter((modulePath) => !modulePath.startsWith('patterns/'))
  .map((modulePath) => cssByModule.get(modulePath) || '')
  .join('\n');

const hasGenericShadowFocus =
  /\.a11ytb-root[^{]*:is\([^)]*button[^)]*\)[^{]*:focus/.test(shadowCss) ||
  /\.a11ytb-root[^{]*:(is|where)\([^{]*\)[^{]*:focus/.test(shadowCss);

if (!hasGenericShadowFocus) {
  report(
    'focus-coverage',
    'error',
    'the generic shadow focus rule (.a11ytb-root :is(button, input, …):focus) is missing',
    'Without it, shadow-root controls lose their focus indicator.',
  );
}

LIGHT_DOM_INTERACTIVE.forEach((className) => {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`${escaped}(?![\\w-])`).test(appOwnedCss)) return;
  if (!new RegExp(`${escaped}[^{,]*:(focus|focus-visible)`).test(appOwnedCss)) {
    report(
      'focus-coverage',
      'error',
      `${className} (light DOM) has styles but no :focus / :focus-visible rule`,
      'WCAG 2.4.7 / 2.4.13: every interactive element needs a visible focus indicator.',
    );
  }
});

SHADOW_INTERACTIVE.forEach((className) => {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`${escaped}(?![\\w-])`).test(shadowCss)) return;
  if (!hasGenericShadowFocus && !new RegExp(`${escaped}[^{,]*:(focus|focus-visible)`).test(shadowCss)) {
    report('focus-coverage', 'error', `${className} (shadow root) has no focus indicator coverage`);
  }
});

// ── 7. Controlled inputs ───────────────────────────────────────────────────
/**
 * `value` on a radio, checkbox, submit, button or file input is the option's data, not
 * the controlled value, so those are only a problem when `checked` is set without a
 * handler. Text-like inputs, textareas and selects are controlled by `value`.
 */
const DATA_VALUE_INPUT_TYPES = new Set([
  'radio',
  'checkbox',
  'submit',
  'button',
  'reset',
  'file',
  'image',
  'hidden',
]);

for (const file of files) {
  if (!file.endsWith('.jsx') || isReviewTool(file)) continue;
  jsxTags(read(file)).forEach((tag) => {
    if (!['input', 'textarea', 'select'].includes(tag.name)) return;
    const hasHandler = /\sonChange\s*=/.test(tag.attributes);
    const deliberate = /\s(readOnly|disabled)\b/.test(tag.attributes);
    if (hasHandler || deliberate) return;

    const typeMatch = /\stype="([^"]*)"/.exec(tag.attributes);
    const type = typeMatch ? typeMatch[1].toLowerCase() : '';
    const isDataValue = tag.name === 'input' && DATA_VALUE_INPUT_TYPES.has(type);
    const controlsWith = isDataValue ? /\schecked\s*=/.test(tag.attributes) : /\s(value|checked)\s*=/.test(tag.attributes);

    if (controlsWith) {
      report(
        'controlled-input',
        'error',
        `<${tag.name}${type ? ` type="${type}"` : ''}> is controlled but has no onChange in ${relative(file)}`,
        'React warns and the control becomes read-only; add onChange, readOnly or disabled.',
      );
    }
  });
}

// ── 8. List keys (heuristic) ───────────────────────────────────────────────
for (const file of files) {
  if (!file.endsWith('.jsx') || isReviewTool(file)) continue;
  const source = stripComments(stripStrings(read(file)));
  // Only maps whose callback returns JSX need keys; maps that build data do not.
  const mapsReturningJsx = (source.match(/\.map\([^)]*\)\s*=>\s*\(?\s*</g) || []).length;
  const keys = (source.match(/\bkey=/g) || []).length;
  if (mapsReturningJsx > keys) {
    report(
      'list-key',
      'warning',
      `${relative(file)}: ${mapsReturningJsx} .map( returning JSX but ${keys} key= prop(s)`,
      'Each element returned from map needs a stable key; verify by eye.',
    );
  }
}

// ── Report ─────────────────────────────────────────────────────────────────
const errors = findings.filter((finding) => finding.severity === 'error');
const warnings = findings.filter((finding) => finding.severity === 'warning');

console.log(`integration review: ${files.length} files scanned`);
console.log(`  errors   ${errors.length}`);
console.log(`  warnings ${warnings.length}`);
console.log('');

findings.forEach((finding) => {
  console.log(`${finding.severity === 'error' ? '✗' : '!'} [${finding.check}] ${finding.message}`);
  if (finding.hint) console.log(`    → ${finding.hint}`);
});

if (findings.length === 0) console.log('no findings');

process.exit(errors.length > 0 ? 1 : 0);
