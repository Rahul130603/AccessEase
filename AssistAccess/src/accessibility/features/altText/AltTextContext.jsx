import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useA11ySettings } from '../../core/SettingsContext.jsx';
import { subscribeToDomChanges } from '../../core/dom/domRegistry.js';
import { isOwnedByToolbar } from '../../core/dom/domScope.js';
import { applyImageAlt, snapshotImage, undoImageAlt } from './altTextWorkflow.js';
import { correctionIdentity, readImageForAlt, savedCorrection } from './altTextClient.js';

const Context = createContext(null);
let nextRecordId = 1;

export function AltTextProvider({ children }) {
  const { config, actions } = useA11ySettings();
  const [records, setRecords] = useState(new Map());
  const recordsRef = useRef(records);
  recordsRef.current = records;

  const update = useCallback((image, patch) => {
    setRecords((current) => {
      const next = new Map(current);
      next.set(image, { id: current.get(image)?.id || `image-${nextRecordId++}`, ...(current.get(image) || {}), ...patch });
      recordsRef.current = next;
      return next;
    });
  }, []);

  const apply = useCallback((image, { snapshot, text, decorative = false, allowReplace = false } = {}) => {
    const edit = applyImageAlt(snapshot || snapshotImage(image), text, { decorative, allowReplace });
    update(image, { edit, status: 'applied', error: '',
      draft: decorative ? (recordsRef.current.get(image)?.draft || '') : edit.applied });
    actions.announce(decorative ? 'Image marked decorative on this page. Undo is available.' :
      'Alternative text applied to the page image. Undo is available.', { dedupeKey: 'alt.apply', level: 'critical' });
    return edit;
  }, [actions, update]);

  const undo = useCallback((image) => {
    const edit = recordsRef.current.get(image)?.edit;
    undoImageAlt(edit);
    update(image, { edit: null, status: 'undone', error: '' });
    actions.announce('Original image alt attribute restored.', { dedupeKey: 'alt.undo', level: 'critical' });
  }, [actions, update]);

  useEffect(() => {
    return subscribeToDomChanges(() => {
      for (const [image, record] of recordsRef.current) {
        if (record.edit && (!image.isConnected || image.getAttribute('alt') !== record.edit.applied ||
            image.getAttribute('src') !== record.edit.before.src ||
            image.getAttribute('srcset') !== record.edit.before.srcset) &&
            record.status !== 'overridden') {
          update(image, { status: 'overridden', error: 'The website changed or replaced this image after the edit. The widget will not overwrite it.' });
        } else if (!record.edit && record.snapshot &&
            (image.getAttribute('alt') !== record.snapshot.alt || image.hasAttribute('alt') !== record.snapshot.hasAlt) &&
            record.status !== 'already-corrected') {
          update(image, { status: 'already-corrected', error: 'The website changed this alt attribute. Review the current image before editing again.' });
        }
      }
    }, { debounceMs: 400 });
  }, [update]);

  // Authorized saved corrections are exact matches: site + path + owner-supplied id
  // + SHA-256 of image bytes. This is opt-in and never contacts an AI model.
  useEffect(() => {
    if (!config.altText?.enabled || !config.altText?.persistence?.autoApply) return undefined;
    let active = true;
    const seen = new WeakMap();
    let running = false;
    async function inspect() {
      if (running || !active) return;
      running = true;
      try {
        const images = document.querySelectorAll('img[data-assistaccess-image-id]:not([alt])');
        for (const image of images) {
          if (!active || isOwnedByToolbar(image)) continue;
          const source = `${image.getAttribute('src')}|${image.getAttribute('srcset')}`;
          if (seen.get(image) === source) continue;
          seen.set(image, source);
          try {
            const snapshot = snapshotImage(image);
            const prepared = await readImageForAlt(image);
            const identity = correctionIdentity(config.altText, image, prepared.imageHash);
            const saved = await savedCorrection(config.altText, identity);
            if (active && typeof saved?.alt === 'string' && !image.hasAttribute('alt')) {
              apply(image, { snapshot, text: saved.alt, decorative: saved.alt === '' });
              update(image, { status: 'restored', saved: true, savedAlt: saved.alt, identity });
            }
          } catch { /* CORS, broken source, no saved record, or unavailable API: leave image unchanged. */ }
        }
      } finally { running = false; }
    }
    inspect();
    const unsubscribe = subscribeToDomChanges(inspect, { debounceMs: 500 });
    return () => { active = false; unsubscribe(); };
  }, [config.altText, apply, update]);

  const value = useMemo(() => ({ records, update, apply, undo }), [records, update, apply, undo]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAltTextSession() {
  const value = useContext(Context);
  if (!value) throw new Error('Alt-text controls require AltTextProvider.');
  return value;
}
