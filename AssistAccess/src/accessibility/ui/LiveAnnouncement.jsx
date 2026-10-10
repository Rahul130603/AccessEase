import React from 'react';

import StatusMessage from './StatusMessage.jsx';

/**
 * Invisible announcement region, for components that should not depend on the
 * toolbar's shared service (isolated widgets, tests, or an app that mounts the
 * pattern components without the provider).
 *
 * It uses the same region-before-message technique as StatusMessage, and it maps
 * `politeness` onto the matching role so the semantics stay declarative:
 *   polite    → role="status"
 *   assertive → role="alert"
 *
 * Prefer `useAnnounce()` when the toolbar is mounted: that service deduplicates,
 * coalesces slider-style chatter and honours the user's verbosity setting, which a
 * private region cannot do.
 */
export default function LiveAnnouncement({ message, politeness = 'polite', atomic = true }) {
  return (
    <StatusMessage
      as="div"
      visible={false}
      role={politeness === 'assertive' ? 'alert' : 'status'}
      atomic={atomic}
    >
      {message}
    </StatusMessage>
  );
}
