import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AccessibilityLauncher from './AccessibilityLauncher.jsx';
import AccessibilityPanel from './AccessibilityPanel.jsx';
import { EVENTS, FEATURE_IDS } from './constants.js';
import { normalizeConfig } from './config.js';
import { AuditProvider } from './core/audit/AuditContext.jsx';
import { AltTextProvider } from './features/altText/AltTextContext.jsx';
import { ConfirmProvider } from './core/confirm/ConfirmContext.jsx';
import { getToolbarHost } from './core/dom/domPatches.js';
import { SettingsProvider, useA11ySettings } from './core/SettingsContext.jsx';
import RouteAnnouncer from './features/announcements/RouteAnnouncer.jsx';
import { emit, subscribe } from './integration/events.js';
import { createStrings } from './strings.js';
import PanelHost from './ui/PanelHost.jsx';

const PANEL_ID = 'a11ytb-panel';

/**
 * The widget chrome: the floating launcher and the panel, rendered inside the
 * toolbar's shadow host.
 *
 * How the button opens and closes the panel
 * -----------------------------------------
 *  1. `open` is React state in this component. `toggle` flips it and emits
 *     `a11ytb:panel-opened` / `a11ytb:panel-closed` for the host application.
 *  2. The launcher receives `open` (for `aria-expanded`) and `onToggle`. Mouse, touch,
 *     Enter and Space all run the same handler, so there is no second code path.
 *  3. The panel is mounted only while `open` is true. Its own `Panel` focuses itself on
 *     mount, which is what makes a screen reader announce the dialog and its
 *     description.
 *  4. Closing — the close button, Escape (handled inside the panel), a press outside
 *     the toolbar, or the launcher again — calls the same `close()`, which unmounts the
 *     panel and returns focus to the launcher unless the pointer started the close.
 *  5. `a11ytb:panel-open-request` and `a11ytb:panel-close-request` let the host
 *     application (or a teammate's toolbar button) drive the same state.
 *
 * The widget stays out of the way otherwise: it is a click-through full-viewport layer
 * (`pointer-events: none`) with only the launcher and the panel opting back in, a very
 * high z-index, and no global styles — see the isolation notes in INTEGRATION.md.
 */
function AccessibilityChrome({ config, strings }) {
  const { meta } = useA11ySettings();
  const [open, setOpen] = useState(false);
  const launcherRef = useRef(null);

  const close = useCallback((options = {}) => {
    const { restoreFocus = true } = options;
    setOpen(false);
    emit(EVENTS.PANEL_CLOSED, {});
    if (restoreFocus && launcherRef.current) launcherRef.current.focus();
  }, []);

  const toggle = useCallback(() => {
    // Kept out of the state updater so StrictMode's double invocation cannot emit the
    // events twice.
    const next = !open;
    setOpen(next);
    emit(next ? EVENTS.PANEL_OPENED : EVENTS.PANEL_CLOSED, {});
  }, [open]);

  useEffect(() => subscribe(EVENTS.PANEL_OPEN_REQUEST, () => setOpen(true)), []);
  useEffect(() => subscribe(EVENTS.PANEL_CLOSE_REQUEST, () => close()), [close]);

  // A press anywhere outside the toolbar closes the panel. composedPath crosses the
  // shadow boundary, so clicks inside the widget are recognised.
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => {
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      const host = getToolbarHost();
      if (host && path.indexOf(host) !== -1) return;
      close({ restoreFocus: false });
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [open, close]);

  return (
    <PanelHost config={config} reducedMotion={meta.effectiveReducedMotion}>
      {/* Renders nothing: keeps route/title announcements running while closed. */}
      <RouteAnnouncer />
      <AccessibilityLauncher
        open={open}
        onToggle={toggle}
        controlsId={open ? PANEL_ID : undefined}
        label={strings.widget.launcher}
        launcherRef={launcherRef}
      />
      {open ? <AccessibilityPanel id={PANEL_ID} config={config} onClose={close} /> : null}
    </PanelHost>
  );
}

/**
 * The whole module: settings provider, confirmation service, audit provider, the
 * floating launcher and the panel with all fourteen features.
 *
 * `children` is optional — pass the host application's tree to keep the providers above
 * it (so teammates can use the hooks), or render the module standalone.
 */
export default function AccessibilityModule({ config, children }) {
  const normalizedConfig = useMemo(() => normalizeConfig(config), [config]);
  const strings = useMemo(() => createStrings(normalizedConfig.strings), [normalizedConfig.strings]);

  return (
    <SettingsProvider config={normalizedConfig} strings={strings}>
      {/* One confirmation dialog for the app tree and for the toolbar's own panels. */}
      <ConfirmProvider>
        {children}
        <AuditProvider>
          <AltTextProvider>
            <AccessibilityChrome config={normalizedConfig} strings={strings} />
          </AltTextProvider>
        </AuditProvider>
      </ConfirmProvider>
    </SettingsProvider>
  );
}

/**
 * Settings (and hooks) without any toolbar chrome — for apps that want the shared
 * settings API, the confirmation service and the pattern components with their own
 * launcher button.
 */
export function AccessibilityProvider({ config, children }) {
  const normalizedConfig = useMemo(() => normalizeConfig(config), [config]);
  const strings = useMemo(() => createStrings(normalizedConfig.strings), [normalizedConfig.strings]);

  return (
    <SettingsProvider config={normalizedConfig} strings={strings}>
      <ConfirmProvider>{children}</ConfirmProvider>
    </SettingsProvider>
  );
}

export { FEATURE_IDS, PANEL_ID };
