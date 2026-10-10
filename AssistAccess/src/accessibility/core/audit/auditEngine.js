/**
 * Page audit engine.
 *
 * Contract
 *  - Read-only. The audit never sets an attribute, never wraps or moves a node and
 *    never writes text into the page. Its only write is a temporary outline marker
 *    used by "show me where", which is added on request and removed again.
 *  - Report, not repair. Findings are data for the user; the fix belongs in the
 *    application's own markup (see fixExamples.js).
 *  - Cheap. It runs once on start, then only when the shared DOM observer reports
 *    a batch of changes (debounced, one observer for the whole module), and every
 *    check is capped by AUDIT_LIMITS.
 *  - Honest. Findings carry a `certainty` of 'detectable' or 'needs-review' and a
 *    verified `focusable` flag, so the UI can never promise more than the DOM
 *    proves.
 */

import { AUDIT_LIMITS, DATA_ATTRS, EVENTS, STYLE_IDS } from '../../constants.js';
import { emit } from '../../integration/events.js';
import { buildAuditHighlightCss } from '../apply/forcedStyles.js';
import { prefersReducedMotion } from '../a11y/reducedMotion.js';
import { markAttribute, setStyleText, unmarkAttribute } from '../dom/domPatches.js';
import { subscribeToDomChanges } from '../dom/domRegistry.js';
import { isOwnedByToolbar, isTabbable } from '../dom/domScope.js';
import { AUDIT_CHECKS } from './checks/index.js';
import { summarizeFindings, sortFindings } from './findings.js';

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

/**
 * @param {object} options
 * @param {() => object} options.getSettings
 * @param {() => object} options.getConfig
 * @param {(state: object) => void} [options.onUpdate]
 */
export function createAuditEngine({ getSettings, getConfig, onUpdate } = {}) {
  /** finding id → element, kept outside React state */
  const elements = new Map();
  /** element key → element (covers elements with no finding, e.g. plain headings) */
  const elementsByKey = new Map();
  let state = { ...EMPTY_STATE };
  let stateSignature = '';
  let started = false;
  let unsubscribe = null;
  let highlightTimer = null;
  let highlighted = null;
  let imageSettleTimer = null;

  function readSettings() {
    return (typeof getSettings === 'function' ? getSettings() : null) || null;
  }

  function publish(force = false) {
    const signature = [
      state.ranAt ? state.findings.length : 0,
      state.findings.map((finding) => finding.id).join('|'),
      Object.keys(state.counters)
        .map((key) => `${key}=${state.counters[key]}`)
        .join(','),
      state.truncated ? 'truncated' : '',
    ].join('#');

    if (!force && signature === stateSignature) return;
    stateSignature = signature;
    emit(EVENTS.AUDIT_UPDATED, {
      summary: state.summary,
      counters: state.counters,
      ranAt: state.ranAt,
    });
    if (typeof onUpdate === 'function') onUpdate(state);
  }

  function clearHighlight() {
    if (highlightTimer !== null) {
      clearTimeout(highlightTimer);
      highlightTimer = null;
    }
    if (highlighted) {
      unmarkAttribute(highlighted, DATA_ATTRS.AUDIT_HIGHLIGHT);
      highlighted = null;
    }
    setStyleText(STYLE_IDS.AUDIT_HIGHLIGHT, '');
  }

  /**
   * Run every check over the page.
   * @param {{force?: boolean}} [options] force publishes even when nothing changed
   */
  function run(options = {}) {
    if (typeof document === 'undefined') return state;
    const settings = readSettings();
    if (!settings) return state;

    if (settings.reader.auditEnabled === false) {
      stop();
      state = { ...EMPTY_STATE };
      publish(true);
      return state;
    }

    const root = document.body || document.documentElement;
    const findings = [];
    const counters = {};
    const perCheck = [];
    let outline = [];
    let truncated = false;

    elements.clear();
    elementsByKey.clear();

    AUDIT_CHECKS.forEach((check) => {
      let result = null;
      try {
        result = check.run({ root, limits: AUDIT_LIMITS }) || null;
      } catch (error) {
        result = null;
      }
      const produced = (result && result.findings) || [];
      if (produced.length > AUDIT_LIMITS.MAX_FINDINGS_PER_CHECK) truncated = true;
      const kept = produced.slice(0, AUDIT_LIMITS.MAX_FINDINGS_PER_CHECK);

      kept.forEach((finding) => {
        const { element, ...serialisable } = finding;
        if (element) {
          elements.set(finding.id, element);
          elementsByKey.set(finding.elementKey, element);
          serialisable.focusable = isTabbable(element);
        }
        findings.push(serialisable);
      });

      // Checks may expose elements that have no finding of their own (the heading
      // outline, for example), so the panel can navigate to them.
      if (result && result.elements instanceof Map) {
        result.elements.forEach((element, key) => elementsByKey.set(key, element));
      }

      Object.assign(counters, (result && result.counters) || {});
      if (result && Array.isArray(result.outline)) outline = result.outline;

      perCheck.push({
        id: check.id,
        title: check.title,
        detects: check.detects,
        needsReview: check.needsReview,
        wcag: check.wcag,
        count: produced.length,
        reported: kept.length,
      });
    });

    state = {
      ran: true,
      ranAt: new Date().toISOString(),
      findings: sortFindings(findings),
      outline,
      counters,
      summary: summarizeFindings(findings),
      perCheck,
      truncated,
    };
    publish(options.force === true);
    return state;
  }

  /**
   * Scroll a target into view and (optionally) outline it.
   * Focus is only moved when the caller asks for it *and* the element is really
   * focusable: moving focus into a page can fire the page's own handlers.
   *
   * @param {Element} element
   * @param {{focus?: boolean}} [options]
   */
  function performJump(element, options = {}) {
    if (!element || element.isConnected === false) return false;
    const settings = readSettings() || { reader: {} };

    if (typeof element.scrollIntoView === 'function') {
      try {
        element.scrollIntoView({
          block: 'center',
          inline: 'nearest',
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
      } catch (error) {
        element.scrollIntoView();
      }
    }

    if (settings.reader.highlightOnJump !== false) {
      setStyleText(STYLE_IDS.AUDIT_HIGHLIGHT, buildAuditHighlightCss());
      if (highlighted && highlighted !== element) {
        unmarkAttribute(highlighted, DATA_ATTRS.AUDIT_HIGHLIGHT);
      }
      markAttribute(element, DATA_ATTRS.AUDIT_HIGHLIGHT, '1');
      highlighted = element;
      if (highlightTimer !== null) clearTimeout(highlightTimer);
      highlightTimer = setTimeout(clearHighlight, AUDIT_LIMITS.HIGHLIGHT_MS);
    }

    if (options.focus === true && isTabbable(element) && typeof element.focus === 'function') {
      try {
        element.focus({ preventScroll: true });
      } catch (error) {
        element.focus();
      }
    }

    return true;
  }

  /** @param {string} findingId @param {{focus?: boolean}} [options] */
  function jump(findingId, options = {}) {
    return performJump(elements.get(findingId), options);
  }

  /** Jump by element key, for navigation that is not tied to a finding. */
  function jumpToElement(elementKey, options = {}) {
    return performJump(elementsByKey.get(elementKey), options);
  }

  /** One shared timer: a page full of images still causes a single extra run. */
  function scheduleImageRescan() {
    if (!started || imageSettleTimer !== null) return;
    imageSettleTimer = setTimeout(() => {
      imageSettleTimer = null;
      if (started) run();
    }, 350);
  }

  /** @param {Event} event capture-phase image load/error from anywhere in the page */
  function handleImageSettled(event) {
    const target = event.target;
    if (!target || target.tagName !== 'IMG') return;
    if (isOwnedByToolbar(target)) return;
    scheduleImageRescan();
  }

  function start() {
    if (typeof document === 'undefined' || started) return;
    started = true;
    run({ force: true });
    unsubscribe = subscribeToDomChanges(() => run(), { debounceMs: 500 });
    // A lazy or slow image gets its rendered box only when the bytes arrive, and
    // loading an image does not mutate the DOM, so the observer above never hears
    // about it. Two capture listeners on the document cover the whole page without
    // touching a single host element: 'load' for images that appear late, 'error'
    // for sources that fail (a broken image can gain a box from its alt text).
    document.addEventListener('load', handleImageSettled, true);
    document.addEventListener('error', handleImageSettled, true);
  }

  function stop() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('load', handleImageSettled, true);
      document.removeEventListener('error', handleImageSettled, true);
    }
    if (imageSettleTimer !== null) {
      clearTimeout(imageSettleTimer);
      imageSettleTimer = null;
    }
    started = false;
    clearHighlight();
    elements.clear();
    elementsByKey.clear();
  }

  return {
    start,
    stop,
    run,
    jump,
    jumpToElement,
    getElement: (findingId) => elements.get(findingId) || null,
    clearHighlight,
    getState: () => state,
    isRunning: () => started,
  };
}
