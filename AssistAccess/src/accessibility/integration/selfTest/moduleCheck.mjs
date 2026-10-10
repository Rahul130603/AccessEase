/**
 * Module integrity check — imports and exports.
 *
 *     node src/accessibility/integration/selfTest/moduleCheck.mjs
 *
 * A fast, bundler-free sanity gate for the module's own files. It answers the questions
 * that a syntax checker cannot:
 *
 *   1. does every relative import point at a file that exists?
 *   2. does every named import (`import { a } from './x'`) exist in that file — and
 *      every default import have a default export?
 *   3. does every re-export (`export { a } from './x'`) exist at the source?
 *   4. are there no duplicate export names in index.js (which a bundler reports only
 *      when it happens to process them in a particular order)?
 *
 * It is deliberately conservative: a name it cannot prove exists is reported, not
 * guessed, and it never executes the modules (no React, no DOM, so it runs anywhere
 * Node runs).
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = process.argv[2] || new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const EXTS = ['', '.js', '.jsx', '.mjs'];

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/[.](js|jsx|mjs)$/.test(entry)) files.push(full);
  }
})(root);

/**
 * Remove comments only.
 *
 * Import and re-export *specifiers* are string literals, so the checks below must run on
 * source that still contains them. An earlier version of this file stripped string
 * contents before matching, which silently made every resolution check match nothing —
 * it reported "no problems" for months' worth of runs while `npm run build` was the only
 * thing that could see a wrong path. Strings stay; comments go, so prose cannot match.
 */
function stripCommentsOnly(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Replace string contents with "" — only for checks that look at identifiers. */
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
 * Blank out template-literal contents.
 *
 * Copy tables and fix examples contain code samples such as
 * `import { useAnnounce } from './accessibility'`, which are prose, not imports. Blanking
 * backtick strings leaves real import specifiers — always single- or double-quoted —
 * untouched, so the module graph can be read without matching prose.
 */
function blankTemplates(source) {
  return source.replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

const strip = (source) => blankTemplates(stripCommentsOnly(source));

const exportCache = new Map();

function exportsOf(file) {
  if (exportCache.has(file)) return exportCache.get(file);
  const source = strip(readFileSync(file, 'utf8'));
  const names = new Set();
  let match;

  const declarations = /export\s+(?:const|let|var|function|class|async function)\s+([A-Za-z_$][\w$]*)/g;
  while ((match = declarations.exec(source))) names.add(match[1]);

  const braced = /export\s*\{([^}]*)\}/g;
  while ((match = braced.exec(source))) {
    match[1].split(',').forEach((entry) => {
      const parts = entry.trim().split(/\s+as\s+/);
      const exported = (parts[1] || parts[0] || '').trim();
      if (exported) names.add(exported);
    });
  }

  if (/export\s+default\s/.test(source)) names.add('default');
  exportCache.set(file, names);
  return names;
}

function resolveFile(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  for (const ext of EXTS) if (existsSync(base + ext)) return base + ext;
  for (const ext of ['.js', '.jsx']) if (existsSync(join(base, `index${ext}`))) return join(base, `index${ext}`);
  return null;
}

const problems = [];

for (const file of files) {
  const source = strip(readFileSync(file, 'utf8'));
  const relative = file.slice(root.length).replace(/\\/g, '/');
  let match;

  const namedImports = /(?:^|\n)\s*import\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\2/g;
  while ((match = namedImports.exec(source))) {
    const spec = match[3];
    if (!spec.startsWith('.')) continue;
    const target = resolveFile(file, spec);
    if (!target) {
      problems.push(`unresolved import: ${spec} in ${relative}`);
      continue;
    }
    const available = exportsOf(target);
    match[1].split(',').forEach((entry) => {
      const name = entry.trim().split(/\s+as\s+/)[0].trim();
      if (name && !available.has(name)) {
        problems.push(`missing export "${name}" imported by ${relative} from ${spec}`);
      }
    });
  }

  const defaultImports = /(?:^|\n)\s*import\s+([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]*\})?\s*from\s*(['"])([^'"]+)\2/g;
  while ((match = defaultImports.exec(source))) {
    const spec = match[3];
    if (!spec.startsWith('.')) continue;
    const target = resolveFile(file, spec);
    if (target && !exportsOf(target).has('default')) {
      problems.push(`missing default export: ${spec} imported by ${relative}`);
    }
  }

  const reExports = /(?:^|\n)\s*export\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\2/g;
  while ((match = reExports.exec(source))) {
    const spec = match[3];
    if (!spec.startsWith('.')) continue;
    const target = resolveFile(file, spec);
    if (!target) {
      problems.push(`unresolved re-export: ${spec} in ${relative}`);
      continue;
    }
    const available = exportsOf(target);
    match[1].split(',').forEach((entry) => {
      const source_ = entry.trim().split(/\s+as\s+/)[0].trim();
      if (source_ && !available.has(source_)) {
        problems.push(`missing re-export "${source_}" from ${spec} in ${relative}`);
      }
    });
  }
}

// Duplicate export names in the public entry point.
const entry = files.find((file) => file.endsWith(join('accessibility', 'index.js')));
if (entry) {
  const names = [];
  const source = strip(readFileSync(entry, 'utf8'));
  let match;
  const reExports = /export\s*\{([^}]*)\}\s*from/g;
  while ((match = reExports.exec(source))) {
    match[1].split(',').forEach((entryName) => {
      const parts = entryName.trim().split(/\s+as\s+/);
      const exported = (parts[1] || parts[0] || '').trim();
      if (exported) names.push(exported);
    });
  }
  const seen = new Map();
  names.forEach((name) => seen.set(name, (seen.get(name) || 0) + 1));
  Array.from(seen.entries())
    .filter(([, count]) => count > 1)
    .forEach(([name, count]) => problems.push(`duplicate export "${name}" in index.js (${count} times)`));
}

if (problems.length === 0) {
  console.log(`module check: ${files.length} files, no import or export problems`);
  process.exit(0);
}

console.error(`module check: ${problems.length} problem(s) in ${files.length} files\n`);
problems.forEach((problem) => console.error(`  ✗ ${problem}`));
process.exit(1);
