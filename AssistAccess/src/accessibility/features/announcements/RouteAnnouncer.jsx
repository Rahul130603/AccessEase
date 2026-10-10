import { useEffect, useRef } from 'react';

import { createRouteAnnouncer } from '../../core/a11y/routeAnnouncer.js';
import { useA11ySettings } from '../../core/SettingsContext.jsx';

/**
 * Mounts the route/title change announcer while the toolbar is mounted.
 *
 * It renders nothing: the announcement goes through the shared live regions, which
 * live in the light DOM and therefore exist regardless of where this component sits
 * in the tree.
 */
export default function RouteAnnouncer() {
  const { settings, strings } = useA11ySettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const stringsRef = useRef(strings);
  stringsRef.current = strings;
  const announcerRef = useRef(null);

  useEffect(() => {
    const announcer = createRouteAnnouncer({
      getSettings: () => settingsRef.current,
      getStrings: () => stringsRef.current,
    });
    announcerRef.current = announcer;
    return () => {
      announcer.stop();
      announcerRef.current = null;
    };
  }, []);

  const enabled = settings.reader.announceRouteChanges !== false;

  useEffect(() => {
    const announcer = announcerRef.current;
    if (!announcer) return;
    if (enabled) announcer.start();
    else announcer.stop();
  }, [enabled]);

  return null;
}
