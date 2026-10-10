/**
 * Shared audit state for the reader panels.
 *
 * One engine serves every panel (screen reader report, alt text, form labels,
 * headings/landmarks): running four separate scans over the same page would be
 * wasteful and would produce four slightly different answers.
 *
 * The provider renders nothing; the panels read the results through `useAudit()`.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useA11ySettings } from '../SettingsContext.jsx';
import { createAuditEngine } from './auditEngine.js';
import { summarizeFindings } from './findings.js';

const EMPTY_STATE = {
  ran: false,
  ranAt: null,
  findings: [],
  outline: [],
  counters: {},
  summary: summarizeFindings([]),
  perCheck: [],
  truncated: false,
};

const AuditContext = createContext(null);

export function AuditProvider({ children }) {
  const { settings, config } = useA11ySettings();
  const [state, setState] = useState(EMPTY_STATE);
  const engineRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const engine = createAuditEngine({
      getSettings: () => settingsRef.current,
      getConfig: () => configRef.current,
      onUpdate: (next) => setState(next),
    });
    engineRef.current = engine;
    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  const enabled = settings.reader.auditEnabled !== false;

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (!enabled) {
      engine.stop();
      setState(EMPTY_STATE);
      return;
    }
    engine.start();
  }, [enabled]);

  const rescan = useCallback(() => {
    if (engineRef.current) engineRef.current.run({ force: true });
  }, []);

  const jump = useCallback((findingId, options) => {
    if (!engineRef.current) return false;
    return engineRef.current.jump(findingId, options);
  }, []);

  const jumpToElement = useCallback((elementKey, options) => {
    if (!engineRef.current) return false;
    return engineRef.current.jumpToElement(elementKey, options);
  }, []);

  const getElement = useCallback((findingId) => engineRef.current?.getElement(findingId) || null, []);

  const clearHighlight = useCallback(() => {
    if (engineRef.current) engineRef.current.clearHighlight();
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      enabled,
      rescan,
      jump,
      jumpToElement,
      getElement,
      clearHighlight,
      getEngine: () => engineRef.current,
    }),
    [state, enabled, rescan, jump, jumpToElement, getElement, clearHighlight],
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

/** Audit results and actions. Returns null when no provider is mounted. */
export function useAudit() {
  return useContext(AuditContext);
}
