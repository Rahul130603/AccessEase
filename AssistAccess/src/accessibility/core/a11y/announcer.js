/**
 * Screen-reader announcement service.
 *
 * The two live regions are created imperatively (not by React) so they exist in
 * the DOM *before* anything is announced — a region that is inserted together
 * with its text is frequently missed by screen readers.
 *
 * They live in the light DOM on purpose: `aria-live` inside a shadow root has
 * inconsistent support, and the regions must be part of the page the screen
 * reader is reading.
 */

import { ANNOUNCEMENT_LEVELS, EVENTS, LIVE_REGION_IDS } from '../../constants.js';
import { emit } from '../../integration/events.js';

const REGION_STYLE = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: '0',
  border: '0',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};

const DEDUPE_WINDOW_MS = 1500;
const MAX_LOG_ENTRIES = 25;

let regions = null;
let enabled = true;
let verbosity = 'standard';
let lastMessage = '';
let lastAnnouncedAt = 0;
const pendingTimers = new Map();
const pendingKeys = new Set();

/**
 * Recent announcements, newest first. The log exists so the panel can *show* that
 * duplicates and verbosity-suppressed messages were dropped instead of merely
 * claiming it, and so teammates can debug what the toolbar said when.
 */
let log = [];
let sequence = 0;
const logListeners = new Set();

function record(entry) {
  sequence += 1;
  const item = { id: sequence, at: new Date().toISOString(), ...entry };
  log = [item, ...log].slice(0, MAX_LOG_ENTRIES);
  logListeners.forEach((listener) => {
    try {
      listener(log);
    } catch (error) {
      /* a listener must not break announcements */
    }
  });
  emit(EVENTS.ANNOUNCEMENT, item);
}

/** Current verbosity: 'minimal' | 'standard' | 'verbose'. */
export function getVerbosity() {
  return verbosity;
}

export function setVerbosity(level) {
  verbosity = ANNOUNCEMENT_LEVELS.includes(level) ? level : 'standard';
}

/** Does the current verbosity allow this level through? */
function allows(level) {
  if (verbosity === 'verbose') return true;
  if (verbosity === 'standard') return level !== 'verbose';
  return level === 'critical';
}

export function getAnnouncementLog() {
  return log;
}

export function subscribeAnnouncements(listener) {
  if (typeof listener !== 'function') return () => {};
  logListeners.add(listener);
  return () => logListeners.delete(listener);
}

export function clearAnnouncementLog() {
  log = [];
  logListeners.forEach((listener) => {
    try {
      listener(log);
    } catch (error) {
      /* ignore */
    }
  });
}

function applyRegionStyle(element) {
  Object.keys(REGION_STYLE).forEach((property) => {
    element.style[property] = REGION_STYLE[property];
  });
}

function createRegion(id, politeness) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('div');
    element.id = id;
    element.setAttribute('data-a11ytb-injected', '');
    (document.body || document.documentElement).appendChild(element);
  }
  element.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
  element.setAttribute('aria-live', politeness);
  element.setAttribute('aria-atomic', 'true');
  applyRegionStyle(element);
  return element;
}

/** Create the live regions. Safe to call repeatedly. */
export function initAnnouncer() {
  if (typeof document === 'undefined') return;
  regions = {
    polite: createRegion(LIVE_REGION_IDS.POLITE, 'polite'),
    assertive: createRegion(LIVE_REGION_IDS.ASSERTIVE, 'assertive'),
  };
}

export function setAnnouncerEnabled(value) {
  enabled = value !== false;
}

export function isAnnouncerReady() {
  return regions !== null;
}

function write(region, message) {
  // Alternating an invisible character guarantees that an identical repeat is
  // still treated as a content change by assistive technology.
  const suffix = message === lastMessage ? '\u00A0' : '';
  region.textContent = `${message}${suffix}`;
  lastMessage = message;
  lastAnnouncedAt = Date.now();
}

/**
 * Announce a message.
 *
 * Messages are dropped (and recorded in the log as suppressed) when the current
 * verbosity does not allow their level, and when an identical message was already
 * announced within the dedupe window. That dedupe is the backstop against a page
 * announcing the same thing through two channels; the app should still pick one
 * channel per message (see StatusMessage / useAnnounce).
 *
 * @param {string} message
 * @param {object} [options]
 * @param {'polite'|'assertive'} [options.politeness]
 * @param {'critical'|'standard'|'verbose'} [options.level] defaults to 'standard'
 * @param {string} [options.dedupeKey] coalesces rapid updates (sliders, etc.)
 * @param {number} [options.delayMs] delay used together with dedupeKey
 * @param {string} [options.source] free-form tag for the log (feature name)
 */
export function announce(message, options = {}) {
  if (!enabled || !message) return;
  if (typeof document === 'undefined') return;
  if (!regions) initAnnouncer();
  if (!regions) return;

  const politeness = options.politeness === 'assertive' ? 'assertive' : 'polite';
  const region = politeness === 'assertive' ? regions.assertive : regions.polite;
  const level = ANNOUNCEMENT_LEVELS.includes(options.level) ? options.level : 'standard';
  const source = options.source || 'toolbar';
  const key = options.dedupeKey || null;
  const delay = Number.isFinite(options.delayMs) ? Math.max(0, options.delayMs) : 0;

  if (!allows(level)) {
    record({ message, politeness, level, source, suppressed: 'verbosity' });
    return;
  }

  if (key && pendingTimers.has(key)) {
    clearTimeout(pendingTimers.get(key));
    pendingTimers.delete(key);
  }

  const run = () => {
    if (key) {
      pendingTimers.delete(key);
      pendingKeys.delete(key);
    }
    if (!enabled) return;
    const now = Date.now();
    const isRepeat = message === lastMessage && now - lastAnnouncedAt < DEDUPE_WINDOW_MS;
    if (isRepeat) {
      record({ message, politeness, level, source, suppressed: 'duplicate' });
      return;
    }
    write(region, message);
    record({ message, politeness, level, source, suppressed: null });
  };

  if (delay > 0) {
    pendingKeys.add(key || message);
    pendingTimers.set(key || message, setTimeout(run, delay));
    return;
  }

  run();
}

/** Remove the live regions and cancel pending announcements. */
export function destroyAnnouncer() {
  pendingTimers.forEach((timer) => clearTimeout(timer));
  pendingTimers.clear();
  pendingKeys.clear();
  lastMessage = '';
  lastAnnouncedAt = 0;
  if (typeof document === 'undefined') {
    regions = null;
    return;
  }
  [LIVE_REGION_IDS.POLITE, LIVE_REGION_IDS.ASSERTIVE].forEach((id) => {
    const element = document.getElementById(id);
    if (element && element.parentNode) element.parentNode.removeChild(element);
  });
  regions = null;
}
