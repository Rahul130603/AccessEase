/**
 * Vitest setup for the module's tests.
 *
 * Add to vitest.config.js:
 *
 *   test: {
 *     environment: 'jsdom',
 *     setupFiles: ['./src/accessibility/integration/tests/vitest.setup.js'],
 *     globals: true,
 *   }
 *
 * Required dev dependencies:
 *   vitest jsdom @testing-library/react @testing-library/dom @testing-library/user-event
 *   @testing-library/jest-dom vitest-axe
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

/**
 * jsdom does not implement HTMLDialogElement.showModal. The confirmation dialog checks
 * both paths, so the tests decide which one they are exercising:
 *   - default: showModal is absent, so the component's documented fallback runs
 *     (aria-modal="true", manual Tab cycle, Escape).
 *   - call `mockShowModal()` to test the native path instead.
 */
export function mockShowModal() {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function close() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  });
}

/** A localStorage stand-in that fails every write, for the storage-unavailable case. */
export function createFailingStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: () => {
      throw new DOMException('QuotaExceededError');
    },
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  };
}
