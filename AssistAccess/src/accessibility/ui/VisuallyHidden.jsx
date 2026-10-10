import React from 'react';

import { VISUALLY_HIDDEN_STYLE } from './visuallyHiddenStyle.js';

/**
 * Visually hidden text that is still announced by screen readers.
 *
 * Uses inline styles rather than a global utility class so that nothing has to be
 * added to the page's stylesheet (and nothing can be renamed by a teammate's CSS).
 */
export default function VisuallyHidden({ children, as: Tag = 'span' }) {
  return <Tag style={VISUALLY_HIDDEN_STYLE}>{children}</Tag>;
}
