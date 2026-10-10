import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DATA_ATTRS } from '../constants.js';
import { setToolbarHost } from '../core/dom/domPatches.js';
import { getStylesText } from './styles/index.js';

/**
 * Shadow DOM host for the toolbar's own UI.
 *
 * Isolation contract
 * ------------------
 *  - The host is appended to <body> as a *sibling* of the app root. React never
 *    renders into it and never deletes it; our own React tree is portalled into a
 *    div inside the shadow root, so a teammate's re-render cannot remove it.
 *  - The host's stylesheet lives inside the shadow root: the page's CSS cannot
 *    restyle the panel, and the panel's CSS cannot leak into the page. Only the
 *    documented `--a11ytb-*` custom properties cross the boundary.
 *  - The host is a full-viewport, click-through fixed layer (`pointer-events:
 *    none`, re-enabled on the launcher/panel). Using a viewport-sized layer
 *    instead of a small anchored box means our chrome never depends on
 *    `position: fixed` *inside* a filtered ancestor: when the user applies visual
 *    filters, the counter-filter on the host creates a containing block for its
 *    descendants, and an absolutely positioned viewport-sized layer is immune to
 *    that.
 *
 * @param {object} props
 * @param {object} props.config normalised config
 * @param {boolean} props.reducedMotion user/OS motion preference for our own chrome
 */
export default function PanelHost({ config, reducedMotion, children }) {
  const [mountPoint, setMountPoint] = useState(null);
  const [shadowReady, setShadowReady] = useState(false);
  const hostRef = useRef(null);
  // Read config through a ref: the host must be created exactly once, even if the
  // app passes an inline config object whose identity changes on every render.
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const activeConfig = configRef.current;
    const host = document.createElement('div');
    host.setAttribute(DATA_ATTRS.HOST, '');
    host.setAttribute('data-a11ytb-injected', '');

    // Explicit longhand offsets rather than `inset`: the shorthand is missing in
    // older engines, and a host with no offsets would have no positioning box.
    Object.assign(host.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
      pointerEvents: 'none',
      display: 'block',
      margin: '0',
      padding: '0',
      border: '0',
      background: 'transparent',
    });

    // Allow teammates to move the toolbar in the stacking order with a token, but
    // never end up with no z-index at all if a value containing var() is rejected.
    host.style.setProperty('z-index', 'var(--a11ytb-z-toolbar, 2147483000)');
    if (!host.style.getPropertyValue('z-index')) {
      host.style.setProperty('z-index', '2147483000');
    }

    const shadow = typeof host.attachShadow === 'function' ? host.attachShadow({ mode: 'open' }) : null;
    const root = shadow || host;

    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-a11ytb-injected', '');
    styleElement.textContent = getStylesText();
    root.appendChild(styleElement);

    const mount = document.createElement('div');
    mount.className = 'a11ytb-mount';
    root.appendChild(mount);

    // Design-token overrides from config.theme, applied on the host so they are
    // inherited by the whole shadow tree.
    const theme = activeConfig.theme || {};
    Object.keys(theme).forEach((token) => {
      if (token.indexOf('--a11ytb-') === 0) host.style.setProperty(token, String(theme[token]));
    });

    let parent = document.body || document.documentElement;
    if (activeConfig.mountTarget) {
      const resolved =
        typeof activeConfig.mountTarget === 'string'
          ? document.querySelector(activeConfig.mountTarget)
          : activeConfig.mountTarget;
      if (resolved) parent = resolved;
    }
    parent.appendChild(host);

    hostRef.current = host;
    setToolbarHost(host);
    setMountPoint(mount);
    setShadowReady(Boolean(shadow));

    return () => {
      setToolbarHost(null);
      setMountPoint(null);
      if (host.parentNode) host.parentNode.removeChild(host);
      hostRef.current = null;
    };
  }, []);

  const positionVars = useMemo(
    () => ({
      '--a11ytb-offset-x': `${config.position.offsetX}px`,
      '--a11ytb-offset-y': `${config.position.offsetY}px`,
    }),
    [config.position.offsetX, config.position.offsetY],
  );

  if (!mountPoint) return null;

  return createPortal(
    <div
      className={`a11ytb-root${reducedMotion ? ' a11ytb-root--reduce' : ''}`}
      data-corner={config.position.corner}
      data-a11ytb-shadow={shadowReady ? 'open' : 'none'}
      style={positionVars}
    >
      {children}
    </div>,
    mountPoint,
  );
}
