import React from 'react';

import { useA11ySettings } from '../../core/SettingsContext.jsx';
import MotionControls from '../motion/MotionControls.jsx';
import FlashGuardControls from './FlashGuardControls.jsx';

/**
 * Feature 1 — Flashing content protection (panel).
 *
 * Composes the reusable motion controls with the flash guard and closes with the
 * full limitation notice. The notice is deliberately part of the feature rather
 * than a tooltip: a user who is photosensitive needs to know what this switch does
 * *not* cover before they rely on it.
 */
export default function FlashingPanel() {
  const { strings } = useA11ySettings();

  return (
    <div className="a11ytb-feature">
      <MotionControls />
      <FlashGuardControls />

      <div className="a11ytb-note a11ytb-note--warning">
        <h4 className="a11ytb-note__heading">{strings.limits.flashingHeading}</h4>
        <ul>
          {strings.limits.flashing.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
