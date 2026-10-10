/**
 * AccessibleStatus — screen reader status announcements (feature 7).
 *
 * One message, one channel. Pick the tool that matches the situation, never two:
 *
 * | Situation                                    | Use                                   |
 * |----------------------------------------------|---------------------------------------|
 * | There is something visible on screen         | `<StatusMessage>`                     |
 * | An error that must interrupt                 | `<StatusMessage role="alert">`        |
 * | Nothing visible to show                      | `useAnnounce()` / `announce()`        |
 * | A widget used without the provider mounted   | `<LiveAnnouncement>`                  |
 *
 * Mechanics that make it reliable
 * -------------------------------
 *  - **Region before message.** `StatusMessage` renders an empty region first and fills
 *    it on the next tick; a region that appears together with its text is routinely
 *    missed by screen readers.
 *  - **`aria-atomic`.** Set explicitly so the whole sentence is read rather than only
 *    the part that changed. `role="status"` already implies `aria-live="polite"`, so no
 *    `aria-live` is added — redundant ARIA is noise that has to be maintained.
 *  - **Deduplication and verbosity.** The shared service drops an identical message
 *    within 1.5 seconds and respects the user's verbosity setting; both are visible in
 *    the announcement log in the toolbar.
 *
 * @example
 * import { StatusMessage, useAnnounce } from './accessibility/AccessibleStatus';
 *
 * <StatusMessage>{saved ? 'Draft saved' : ''}</StatusMessage>
 *
 * const announce = useAnnounce();
 * announce('Filters applied: 3 results');
 */

export { default as StatusMessage } from './ui/StatusMessage.jsx';
export { default as LiveAnnouncement } from './ui/LiveAnnouncement.jsx';
export { useAnnounce } from './core/SettingsContext.jsx';
export {
  announce,
  getAnnouncementLog,
  subscribeAnnouncements,
  clearAnnouncementLog,
} from './core/a11y/announcer.js';
