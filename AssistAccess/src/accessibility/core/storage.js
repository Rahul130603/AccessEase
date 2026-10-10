/**
 * Settings storage with graceful degradation.
 *
 * Backends are probed once at start-up: localStorage → sessionStorage → memory.
 * A blocked backend (Safari private mode, enterprise policy, quota) must never
 * throw into React render, and the active mode is surfaced in the UI so the user
 * is never silently told their preferences were saved when they were not.
 */

const PROBE_KEY = '__a11ytb_probe__';

function createMemoryAdapter() {
  const store = new Map();
  return {
    id: 'memory',
    read(key) {
      return store.has(key) ? store.get(key) : null;
    },
    write(key, value) {
      store.set(key, value);
      return true;
    },
    remove(key) {
      store.delete(key);
    },
  };
}

function createWebStorageAdapter(id, storage) {
  return {
    id,
    read(key) {
      try {
        return storage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    write(key, value) {
      try {
        storage.setItem(key, value);
        return true;
      } catch (error) {
        return false;
      }
    },
    remove(key) {
      try {
        storage.removeItem(key);
      } catch (error) {
        /* ignore */
      }
    },
  };
}

function canUse(storage) {
  if (!storage) return false;
  try {
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Choose a storage adapter.
 * @param {'auto'|'local'|'session'|'memory'} preferred
 * @returns {{ adapter: ReturnType<typeof createMemoryAdapter>, mode: string, degraded: boolean }}
 */
export function createStorage(preferred = 'auto') {
  const memory = createMemoryAdapter();

  if (typeof window === 'undefined') {
    return { adapter: memory, mode: 'memory', degraded: true };
  }

  const local = canUse(window.localStorage) ? window.localStorage : null;
  const session = canUse(window.sessionStorage) ? window.sessionStorage : null;

  const pick = () => {
    if (preferred === 'local') return local ? 'local' : null;
    if (preferred === 'session') return session ? 'session' : null;
    if (preferred === 'memory') return 'memory';
    if (local) return 'local';
    if (session) return 'session';
    return 'memory';
  };

  const mode = pick();

  if (mode === 'local') return { adapter: createWebStorageAdapter('local', local), mode, degraded: false };
  if (mode === 'session') return { adapter: createWebStorageAdapter('session', session), mode, degraded: true };
  return { adapter: memory, mode: 'memory', degraded: true };
}

export function settingsKey(prefix) {
  return `${prefix}.settings`;
}

/**
 * Read + parse persisted settings.
 * @returns {{ raw: any|undefined, ok: boolean }}
 */
export function readSettings(adapter, key) {
  const text = adapter.read(key);
  if (text === null || text === undefined) return { raw: undefined, ok: true };
  try {
    return { raw: JSON.parse(text), ok: true };
  } catch (error) {
    return { raw: undefined, ok: false };
  }
}

export function writeSettings(adapter, key, settings) {
  try {
    return adapter.write(key, JSON.stringify(settings)) === true;
  } catch (error) {
    return false;
  }
}

export function clearSettings(adapter, key) {
  adapter.remove(key);
}

/**
 * Cross-tab synchronisation. The callback receives the parsed payload or null.
 * Returns an unsubscribe function (no-op outside the browser).
 */
export function subscribeStorage(key, callback) {
  if (typeof window === 'undefined' || !window.addEventListener) return () => {};
  const handler = (event) => {
    if (event.key !== key) return;
    if (event.newValue === null) {
      callback(null);
      return;
    }
    try {
      callback(JSON.parse(event.newValue));
    } catch (error) {
      callback(null);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
