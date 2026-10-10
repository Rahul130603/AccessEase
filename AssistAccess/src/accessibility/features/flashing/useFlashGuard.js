import { useCallback, useEffect, useRef, useState } from 'react';

import { EVENTS } from '../../constants.js';
import { announce } from '../../core/a11y/announcer.js';
import { createFlashGuard } from '../../core/flash/flashGuard.js';
import { useA11ySettings } from '../../core/SettingsContext.jsx';
import { emit } from '../../integration/events.js';
import { formatMessage } from '../../strings.js';

const EMPTY_STATE = {
  supported: true,
  checked: 0,
  findings: [],
  uninspectable: [],
  scannedAt: null,
  pausedCount: 0,
  hiddenCount: 0,
};

/**
 * React binding for the flashing guard.
 *
 * The guard itself is framework-agnostic (core/flash/flashGuard.js); this hook
 * owns its lifecycle, pushes its results into React state and does the
 * announcing, so the panel stays presentational.
 *
 * Announcement policy: the toolbar speaks when it *changes* something ("two items
 * were paused"), not on every rescan, and it speaks once when it detects something
 * in "warn me only" mode — otherwise that mode would be silent, which would defeat
 * its purpose.
 */
export default function useFlashGuard() {
  const { settings, actions, config, strings } = useA11ySettings();
  const [state, setState] = useState(EMPTY_STATE);

  const guardRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const configRef = useRef(config);
  configRef.current = config;
  const stringsRef = useRef(strings);
  stringsRef.current = strings;
  const announcedRef = useRef({ applied: 0, measurable: 0, failed: false });

  // Create the guard once. Callbacks read refs, so the guard never holds a stale
  // copy of settings.
  useEffect(() => {
    const guard = createFlashGuard({
      getSettings: () => settingsRef.current,
      getConfig: () => configRef.current,
      onUpdate: (next) => {
        setState(next);
        emit(EVENTS.FINDING, next);
      },
    });
    guardRef.current = guard;
    return () => {
      guard.stop();
      guardRef.current = null;
    };
  }, []);

  const guardSettings = settings.motion.flashGuard;
  const enabled = guardSettings.enabled;
  const action = guardSettings.action;
  const allowlistKey = guardSettings.allowlist.join('|');

  // A change of policy must clear manual exemptions, otherwise an element the user
  // unpaused by hand would silently ignore the new policy.
  useEffect(() => {
    if (guardRef.current) guardRef.current.clearManualOverrides();
  }, [action]);

  // Start/stop with the setting. `start()` is idempotent and re-scans, which is
  // what makes action/allowlist changes take effect immediately.
  useEffect(() => {
    const guard = guardRef.current;
    if (!guard) return;
    if (!enabled) {
      guard.stop();
      setState(EMPTY_STATE);
      return;
    }
    guard.start();
  }, [enabled, action, allowlistKey]);

  useEffect(() => {
    const copy = stringsRef.current;
    const measurable = state.findings.filter((item) => item.measurable).length;
    const applied = state.pausedCount + state.hiddenCount;
    const previous = announcedRef.current;

    if (applied > previous.applied) {
      const added = applied - previous.applied;
      announce(
        added === 1
          ? copy.announcements.guardPausedOne
          : formatMessage(copy.announcements.guardPausedMany, { count: added }),
        { politeness: 'assertive' },
      );
    } else if (applied === 0 && measurable > previous.measurable && action === 'warn') {
      announce(
        measurable === 1
          ? copy.flashing.statusFlaggedOne
          : formatMessage(copy.flashing.statusFlaggedMany, { count: measurable }),
      );
    }

    announcedRef.current = { ...previous, applied, measurable };
  }, [state.pausedCount, state.hiddenCount, state.findings, action]);

  useEffect(() => {
    if (state.supported === false && !announcedRef.current.failed) {
      announcedRef.current.failed = true;
      announce(stringsRef.current.announcements.guardFailed, { politeness: 'assertive' });
    }
  }, [state.supported]);

  const rescan = useCallback(() => {
    if (guardRef.current) guardRef.current.scan();
  }, []);

  const allowFinding = useCallback(
    (finding) => {
      if (guardRef.current) guardRef.current.allow(finding.elementKey);
      actions.allowFlashElement(finding.elementKey);
    },
    [actions],
  );

  const unallowFinding = useCallback(
    (finding) => {
      actions.unallowFlashElement(finding.elementKey);
      if (guardRef.current) guardRef.current.scan();
    },
    [actions],
  );

  const manualAction = useCallback((findingId, nextAction) => {
    if (guardRef.current) guardRef.current.applyManual(findingId, nextAction);
  }, []);

  const restoreAll = useCallback(() => {
    if (guardRef.current) {
      guardRef.current.revertAll();
      guardRef.current.scan();
    }
    announce(stringsRef.current.announcements.restoredAll);
  }, []);

  return {
    ...state,
    enabled,
    action,
    rescan,
    allowFinding,
    unallowFinding,
    manualAction,
    restoreAll,
  };
}
