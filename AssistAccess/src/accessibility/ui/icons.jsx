/**
 * Renderer for the widget's icons.
 *
 * Outline SVGs on a 24×24 grid, drawn with `currentColor` so they follow the theme.
 * Every icon is purely decorative: it is rendered with `aria-hidden="true"` and
 * `focusable="false"` and always sits next to a text label, so nothing depends on
 * recognising the glyph.
 */

import React from 'react';

import { getIconPaths } from './iconPaths.js';

export default function Icon({ name, className = '', size = null, title = null }) {
  const paths = getIconPaths(name);
  if (!paths) return null;

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size || undefined}
      height={size || undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** The accessibility symbol used by the launcher: person in a circle. */
export function AccessibilityGlyph({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9.2" />
      <circle cx="12" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
      <path d="M6.8 10.2c1.6.6 3.3.9 5.2.9s3.6-.3 5.2-.9" />
      <path d="M12 11.1v3.2" />
      <path d="M9.6 18.2 12 14.3l2.4 3.9" />
    </svg>
  );
}
