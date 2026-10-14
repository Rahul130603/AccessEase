import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {createPortal} from 'react-dom';

import { warnDev } from '../warnDev.js';
import { useA11ySettings } from '../SettingsContext.jsx';
import ConfirmDialog from '../../ui/ConfirmDialog.jsx';

/**
 * One confirmation dialog for the whole application.
 *
 * `confirm()` returns a promise that resolves to true (confirmed) or false
 * (cancelled, Escape, backdrop press). Dialogs queue: a request made while another
 * dialog is open waits its turn instead of replacing it, so two features cannot
 * fight over the screen.
 *
 * Safety properties worth stating
 *  - Nothing is announced through the live regions: the dialog's own name and
 *    description are read when focus moves into it. One utterance, not two.
 *  - Focus returns to the invoking control, whether the user confirmed or cancelled.
 *  - Without a provider, `useConfirm()` fails **closed**: it falls back to
 *    `window.confirm`, and if even that is unavailable it resolves false. A
 *    destructive action is never performed silently because the dialog was missing.
 */

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children, portalTarget }) {
  const { strings } = useA11ySettings();
  const [request, setRequest] = useState(null);
  const currentRef = useRef(null);
  const queueRef = useRef([]);

  const settle = useCallback((result) => {
    const entry = currentRef.current;
    if (entry && typeof entry.resolve === 'function') entry.resolve(result);
    const next = queueRef.current.shift() || null;
    currentRef.current = next;
    setRequest(next);
  }, []);

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        const entry = { options, resolve };
        if (currentRef.current) {
          queueRef.current.push(entry);
          return;
        }
        currentRef.current = entry;
        setRequest(entry);
      }),
    [],
  );

  // If the provider unmounts while a confirmation is pending, resolve it as
  // cancelled rather than leaving the caller awaiting forever.
  useEffect(
    () => () => {
      const pending = [currentRef.current, ...queueRef.current].filter(Boolean);
      currentRef.current = null;
      queueRef.current = [];
      pending.forEach((entry) => {
        if (typeof entry.resolve === 'function') entry.resolve(false);
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      confirm,
      confirmDestructive: (options = {}) => confirm({ destructive: true, ...options }),
    }),
    [confirm],
  );

  const copy = strings.confirm;
  const options = (request && request.options) || {};

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {(() => {const dialog = <ConfirmDialog
        open={Boolean(request)}
        title={options.title || copy.dialogTitle}
        description={options.description || ''}
        details={options.details || []}
        confirmLabel={options.confirmLabel || copy.dialogConfirm}
        cancelLabel={options.cancelLabel || copy.dialogCancel}
        destructive={options.destructive === true}
        initialFocus={options.initialFocus}
        returnFocusTo={options.returnFocusTo}
        titleLevel={options.titleLevel}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />;return portalTarget ? createPortal(dialog, portalTarget) : dialog;})()}
    </ConfirmContext.Provider>
  );
}

/**
 * @returns {(options: {
 *   title: string,
 *   description?: string,
 *   details?: string[],
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   destructive?: boolean,
 *   initialFocus?: 'cancel'|'confirm',
 *   returnFocusTo?: React.RefObject<HTMLElement>,
 * }) => Promise<boolean>}
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);

  const fallback = useCallback(async (options = {}) => {
    warnDev(
      'confirm-without-provider',
      'useConfirm() ran without <AccessibilityModule> or <ConfirmProvider> mounted. Falling back to window.confirm; mount the provider so the dialog matches the application and the accessibility behaviour is guaranteed.',
    );
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const text = [options.title, options.description, ...(options.details || [])]
        .filter(Boolean)
        .join('\n\n');
      return window.confirm(text);
    }
    // Fail closed: never treat a missing dialog as permission.
    return false;
  }, []);

  return context ? context.confirm : fallback;
}

export default ConfirmProvider;
