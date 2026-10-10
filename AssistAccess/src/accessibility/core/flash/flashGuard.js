/**
 * Flashing content guard.
 *
 * Orchestrates: scan → estimate → (maybe) pause/hide → report.
 *
 * Behaviour contract
 * ------------------
 *  - It only ever *pauses* or *hides* elements, never deletes or rewrites them,
 *    and every change is recorded so it can be reverted per element or all at
 *    once.
 *  - Automatic action is limited to findings the estimator actually measured.
 *    Video, animated images, marquees and third-party embeds are listed with a
 *    manual control instead, because their content cannot be measured from the
 *    page and guessing would be dishonest.
 *  - "Allow" reverts the change *and* remembers the element for this page, so the
 *    next rescan does not fight the user.
 *  - Re-scanning is debounced and skipped while the document is hidden, so the
 *    guard stays cheap on large pages.
 *
 * It is deliberately *not* a conformance checker: it cannot see cross-origin
 * content, cannot measure pixels, and cannot stop anything the platform does not
 * expose. The panel copy says so.
 *
 * Scan structure (important for correctness): one pass *collects* findings of the
 * current page state, a second pass applies or reverts changes. Nothing is
 * applied while the findings list is still being built, so a reverted record can
 * never be lost and a first scan behaves exactly like a later one.
 */

import { DATA_ATTRS, FLASH_LIMITS, STYLE_IDS } from '../../constants.js';
import { buildFlashGuardCss } from '../apply/forcedStyles.js';
import { markAttribute, setStyleText, unmarkAttribute } from '../dom/domPatches.js';
import { createDomRegistry } from '../dom/domRegistry.js';
import { resolveTargetRoot, viewportAreaPx } from '../dom/domScope.js';
import { collectAnimationCandidates, isAnimationApiSupported } from './animationInventory.js';
import { estimateFlashRisk, FLASH_BANDS } from './flashEstimator.js';
import {
  collectMediaCandidates,
  collectUninspectable,
  isPausableMedia,
  pauseMediaElement,
} from './mediaInventory.js';

const EMPTY_STATE = {
  supported: true,
  checked: 0,
  findings: [],
  uninspectable: [],
  scannedAt: null,
  pausedCount: 0,
  hiddenCount: 0,
};

const BAND_ORDER = { hazard: 0, caution: 1, unverified: 2 };

/**
 * @param {object} options
 * @param {() => object} options.getSettings current settings (read on each scan)
 * @param {() => object} options.getConfig normalised config
 * @param {(state: object) => void} [options.onUpdate] publish results to React
 */
export function createFlashGuard({ getSettings, getConfig, onUpdate } = {}) {
  /** finding id → { element, animations, media } */
  const entries = new Map();
  /** finding id → { kind: 'paused'|'hidden', animations: Array<{animation, state}> } */
  const appliedChanges = new Map();
  /**
   * Findings the user acted on by hand. The automatic policy must not undo a
   * deliberate choice on the next rescan (which happens every few seconds), so
   * these ids are exempt from the automatic pass until the policy changes.
   */
  const manualOverrides = new Set();

  let state = { ...EMPTY_STATE };
  let stateSignature = '';
  let started = false;
  let intervalId = null;

  const registry = createDomRegistry({ onChange: () => scan(), debounceMs: 250 });

  function publish() {
    const signature = [
      state.checked,
      state.findings.map((item) => `${item.id}:${item.band}:${item.applied}:${item.allowed}`).join(','),
      state.uninspectable.length,
      state.pausedCount,
      state.hiddenCount,
      state.scannedAt,
      state.supported,
    ].join('|');
    if (signature === stateSignature) return;
    stateSignature = signature;
    if (typeof onUpdate === 'function') onUpdate(state);
  }

  function pauseAnimationsOf(entry, record) {
    entry.animations.forEach((animation) => {
      const playState = animation.playState;
      if (playState !== 'running' && playState !== 'pending') return;
      try {
        animation.pause();
        record.animations.push({ animation, state: playState });
      } catch (error) {
        /* the animation may have been cancelled by the page */
      }
    });
  }

  function resumeAnimationsOf(record) {
    (record.animations || []).forEach(({ animation, state: previous }) => {
      try {
        if (previous === 'running' || previous === 'pending') animation.play();
      } catch (error) {
        /* ignore */
      }
    });
    record.animations = [];
  }

  /** Apply an action to an entry. `entry` must belong to the current scan. */
  function applyWithEntry(entry, findingId, action) {
    const record = { kind: null, animations: [] };
    if (action === 'hide') {
      markAttribute(entry.element, DATA_ATTRS.FLASH_HIDDEN, '1');
      pauseAnimationsOf(entry, record);
      if (entry.media) pauseMediaElement(entry.element);
      record.kind = 'hidden';
    } else if (action === 'pause') {
      pauseAnimationsOf(entry, record);
      if (entry.media) pauseMediaElement(entry.element);
      markAttribute(entry.element, DATA_ATTRS.FLASH_PAUSED, '1');
      record.kind = 'paused';
    } else {
      return null;
    }
    appliedChanges.set(findingId, record);
    return record.kind;
  }

  /** Revert one finding. Works with the entry map of any scan generation. */
  function revert(findingId) {
    const record = appliedChanges.get(findingId);
    if (!record) return false;
    const entry = entries.get(findingId);
    resumeAnimationsOf(record);
    if (entry) {
      unmarkAttribute(entry.element, DATA_ATTRS.FLASH_HIDDEN);
      unmarkAttribute(entry.element, DATA_ATTRS.FLASH_PAUSED);
    }
    appliedChanges.delete(findingId);
    return true;
  }

  function revertAll() {
    Array.from(appliedChanges.keys()).forEach((id) => revert(id));
  }

  function countApplied() {
    let paused = 0;
    let hidden = 0;
    appliedChanges.forEach((record) => {
      if (record.kind === 'hidden') hidden += 1;
      else if (record.kind === 'paused') paused += 1;
    });
    return { paused, hidden };
  }

  function buildState(findings, uninspectable, checked, supported) {
    const { paused, hidden } = countApplied();
    return {
      supported,
      checked,
      findings: findings.sort(
        (a, b) => (BAND_ORDER[a.band] ?? 3) - (BAND_ORDER[b.band] ?? 3),
      ),
      uninspectable,
      scannedAt: new Date().toISOString(),
      pausedCount: paused,
      hiddenCount: hidden,
    };
  }

  /** One full pass over the page. */
  function scan() {
    if (typeof document === 'undefined') return state;
    const settings = typeof getSettings === 'function' ? getSettings() : null;
    if (!settings) return state;
    const config = (typeof getConfig === 'function' ? getConfig() : null) || {};
    const supported = isAnimationApiSupported();
    const guard = settings.motion.flashGuard;

    const root = resolveTargetRoot({
      settingTarget: settings.visual.target,
      forcedTarget: config.visualTarget,
      contentRootSelector: config.contentRoot,
    });

    if (!guard.enabled || !root) {
      stop();
      state = { ...EMPTY_STATE, supported };
      publish();
      return state;
    }

    // Keep the marker stylesheet while the guard is active.
    setStyleText(STYLE_IDS.FLASH_GUARD, buildFlashGuardCss());

    const allowed = new Set(Array.isArray(guard.allowlist) ? guard.allowlist : []);
    const viewportArea = viewportAreaPx();
    const candidates = collectAnimationCandidates({ root });
    const media = collectMediaCandidates({ root });
    const uninspectable = collectUninspectable({ root });

    const nextEntries = new Map();
    const findings = [];
    let checked = 0;

    // ── Pass 1: measurable animation candidates, grouped per element ────────
    const byElement = new Map();
    candidates.forEach((candidate) => {
      checked += 1;
      const list = byElement.get(candidate.elementKey) || [];
      list.push(candidate);
      byElement.set(candidate.elementKey, list);
    });

    byElement.forEach((list, key) => {
      const risk = estimateFlashRisk({
        flashesPerSecond: Math.max(...list.map((item) => item.flashesPerSecond)),
        luminanceDelta: Math.max(...list.map((item) => item.luminanceDelta)),
        areaPx: Math.max(...list.map((item) => item.areaPx)),
        viewportArea,
        redFlashSuspected: list.some((item) => item.redFlashSuspected),
      });
      if (risk.band === FLASH_BANDS.SAFE) return;

      const id = `animation:${key}`;
      nextEntries.set(id, {
        element: list[0].element,
        animations: list.map((item) => item.animation),
        media: false,
      });
      findings.push({
        id,
        elementKey: key,
        kind: 'animation',
        band: risk.band,
        measurable: true,
        label: list[0].label,
        flashesPerSecond: risk.flashesPerSecond,
        areaPercent: risk.areaPercent,
        redFlashSuspected: risk.redFlashSuspected,
        confidence: list.some((item) => item.confidence === 'high') ? 'high' : 'low',
        canPause: true,
        canHide: true,
        allowed: allowed.has(key),
        applied: null,
        manual: false,
        note: null,
      });
    });

    // ── Content that can be stopped or hidden but never measured ────────────
    media.forEach((item, index) => {
      const id = `media:${item.elementKey}:${index}`;
      nextEntries.set(id, {
        element: item.element,
        animations: [],
        media: isPausableMedia(item.element),
      });
      findings.push({
        id,
        elementKey: item.elementKey,
        kind: item.kind,
        band: FLASH_BANDS.UNVERIFIED,
        measurable: false,
        label: item.label,
        flashesPerSecond: null,
        areaPercent: null,
        redFlashSuspected: false,
        confidence: 'low',
        canPause: item.action === 'pause',
        canHide: true,
        allowed: allowed.has(item.elementKey),
        applied: null,
        manual: true,
        note: item.note,
      });
    });

    // ── Pass 2: revert stale changes, then apply the current policy ─────────
    Array.from(appliedChanges.keys()).forEach((id) => {
      if (!nextEntries.has(id)) revert(id);
    });

    findings.forEach((finding) => {
      const entry = nextEntries.get(finding.id);
      if (!entry) return;
      const existing = appliedChanges.get(finding.id);

      if (finding.allowed) {
        if (existing) revert(finding.id);
        manualOverrides.delete(finding.id);
        finding.applied = null;
        return;
      }
      if (manualOverrides.has(finding.id)) {
        // The user chose this explicitly; leave it alone until the policy changes.
        finding.applied = existing ? existing.kind : null;
        return;
      }
      if (!finding.measurable) {
        // Manual-only content keeps whatever the user chose for it.
        finding.applied = existing ? existing.kind : null;
        return;
      }
      if (guard.action === 'warn') {
        if (existing) revert(finding.id);
        finding.applied = null;
        return;
      }
      if (existing && existing.kind === guard.action) {
        finding.applied = existing.kind;
        return;
      }
      if (existing) revert(finding.id);
      finding.applied = applyWithEntry(entry, finding.id, guard.action);
    });

    // ── Swap in the new entry map ───────────────────────────────────────────
    entries.clear();
    nextEntries.forEach((entry, id) => entries.set(id, entry));

    state = buildState(findings, uninspectable, checked, supported);
    publish();
    return state;
  }

  /** Manual pause/hide for unmeasurable content, from the findings list. */
  function applyManual(findingId, action) {
    const entry = entries.get(findingId);
    if (!entry) return null;
    const existing = appliedChanges.get(findingId);
    if (existing) revert(findingId);
    if (action === 'none') {
      manualOverrides.add(findingId);
      state = buildState(state.findings.map((item) => (item.id === findingId ? { ...item, applied: null } : item)), state.uninspectable, state.checked, state.supported);
      publish();
      return null;
    }
    const kind = applyWithEntry(entry, findingId, action);
    manualOverrides.add(findingId);
    state = buildState(
      state.findings.map((item) => (item.id === findingId ? { ...item, applied: kind } : item)),
      state.uninspectable,
      state.checked,
      state.supported,
    );
    publish();
    return kind;
  }

  /** Allow an element: revert its change and remember it for this page. */
  function allow(elementKey) {
    Array.from(entries.keys()).forEach((id) => {
      const finding = state.findings.find((item) => item.id === id);
      if (finding && finding.elementKey === elementKey) revert(id);
    });
  }

  function handleVisibility() {
    if (!document.hidden) scan();
  }

  function start() {
    if (typeof document === 'undefined') return;
    if (!started) {
      started = true;
      registry.start();
      document.addEventListener('visibilitychange', handleVisibility);
      intervalId = setInterval(() => {
        if (!document.hidden) scan();
      }, FLASH_LIMITS.RESCAN_INTERVAL_MS);
    }
    scan();
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (started) {
      registry.stop();
      document.removeEventListener('visibilitychange', handleVisibility);
      started = false;
    }
    revertAll();
    manualOverrides.clear();
    setStyleText(STYLE_IDS.FLASH_GUARD, '');
    stateSignature = '';
  }

  return {
    start,
    stop,
    scan,
    allow,
    revert,
    revertAll,
    applyManual,
    /** Drop manual exemptions — called when the user changes the guard policy. */
    clearManualOverrides() {
      manualOverrides.clear();
    },
    getState: () => state,
    isRunning: () => started,
    /** Exposed for tests. */
    getAppliedCount: () => appliedChanges.size,
  };
}
