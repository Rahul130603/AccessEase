import React, { useCallback, useState } from 'react';

import { SkipLink } from '../../patterns/PageStructure.jsx';

import {
  CanvasFixture,
  ExcludedZoneFixture,
  HazardousFlashFixture,
  MediaFixtures,
  OpacityBlinkFixture,
  SafePatternFixture,
  SafePulseFixture,
  SpinnerFixture,
} from './FlashingFixtures.jsx';
import { BrokenMarkupFixture, CorrectMarkupFixture } from './StructureFixtures.jsx';
import {
  AuthDefectsFixture,
  AuthExamplesFixture,
  ConfirmationFixture,
  ErrorSummaryFixture,
  PasswordVisibilityFixture,
} from './FormsFixtures.jsx';

/**
 * Host application for the dev harness.
 *
 * It plays the part of "the team project": it owns the DOM, has aggressive global
 * CSS, a sticky header, a fixed banner, its own toolbar-styled button and a long
 * page. The accessibility module is mounted around it (see main.jsx).
 */
export default function HostApp() {
  const [teammateFilter, setTeammateFilter] = useState(false);
  const [hasMainLandmark, setHasMainLandmark] = useState(true);
  /* Swapping <main> for <div> is how the "no main landmark" finding is demonstrated:
     a landmark cannot be missing and present at the same time. */
  const Content = hasMainLandmark ? 'main' : 'div';

  /**
   * Simulates a teammate module writing an inline filter on <html>.
   * The accessibility applier must compose with it (not overwrite it) and restore
   * it exactly when the toolbar's filters are switched off.
   */
  const toggleTeammateFilter = useCallback(() => {
    const root = document.documentElement;
    if (teammateFilter) {
      root.style.filter = '';
      setTeammateFilter(false);
      return;
    }
    root.style.filter = 'drop-shadow(0 0 0 rgba(0,0,0,0))';
    setTeammateFilter(true);
  }, [teammateFilter]);

  return (
    <div className="harness-app">
      <header className="harness-header">
        <h2 style={{ margin: 0 }}>AssistAccess dev harness</h2>
        <p>
          Host application owned by “the team”. Use it to check the flashing guard and the visual
          filters against markup and CSS the toolbar did not write.
        </p>
      </header>

      <div className="harness-teammate-toolbar">
        <button type="button" onClick={toggleTeammateFilter}>
          {teammateFilter ? 'Remove teammate inline filter' : 'Set teammate inline filter on <html>'}
        </button>
        <button type="button" onClick={() => setHasMainLandmark((current) => !current)}>
          {hasMainLandmark ? 'Remove the main landmark' : 'Restore the main landmark'}
        </button>
      </div>

      <SkipLink targetId="main" />

      <Content id="main">
        <h1>Accessibility toolbar test page</h1>

        <section className="harness-section">
          <h2>How to use this page</h2>
          <ol>
            <li>Open the toolbar (bottom-right button) and expand “Flashing content protection”.</li>
            <li>
              Watch which blocks stop animating: the fast flash and the opacity blink should be
              paused, the slow pulse and the spinner should keep running.
            </li>
            <li>Expand “Brightness and colour” and move the sliders.</li>
            <li>
              Confirm the toolbar itself keeps its own colours and stays readable, and that the
              purple fixed banner at the bottom of the window does not move.
            </li>
            <li>Use Tab only: every control must be reachable with a visible focus ring.</li>
          </ol>
        </section>

        <section className="harness-section">
          <h2>Flashing fixtures</h2>
          <HazardousFlashFixture />
          <hr />
          <OpacityBlinkFixture />
          <hr />
          <SafePulseFixture />
          <hr />
          <SpinnerFixture />
          <hr />
          <ExcludedZoneFixture />
        </section>

        <section className="harness-section">
          <h2>Media, canvas and embeds</h2>
          <CanvasFixture />
          <hr />
          <MediaFixtures />
        </section>

        <section className="harness-section">
          <h2>Authoring pattern</h2>
          <SafePatternFixture />
        </section>

        <section className="harness-section">
          <h2>Structure: defects to find</h2>
          <BrokenMarkupFixture />
        </section>

        <section className="harness-section">
          <h2>Structure: correct markup</h2>
          <CorrectMarkupFixture />
        </section>

        <section className="harness-section">
          <h2>Forms: errors, passwords, authentication, confirmation</h2>
          <ErrorSummaryFixture />
          <hr />
          <PasswordVisibilityFixture />
          <hr />
          <AuthExamplesFixture />
          <hr />
          <ConfirmationFixture />
          <hr />
          <AuthDefectsFixture />
        </section>

        <section className="harness-section">
          <h2>Long content</h2>
          <p>
            Scroll down so the fixtures leave the viewport. The guard keeps scanning while the page
            is visible and stops scanning (and its timer keeps ticking cheaply) while the tab is
            hidden.
          </p>
          <div className="harness-filler">Filler content — scroll to test rescanning</div>
        </section>
      </Content>

      <footer className="harness-section">
        <p>
          This page is a test fixture, not a demonstration of a compliant website. The toolbar
          cannot make it compliant.
        </p>
      </footer>

      <div className="harness-fixed-banner" role="note">
        Fixed banner inside the app tree: it must stay in place when visual filters are applied in
        “Whole page” mode, and is expected to break in “Content area only” mode.
      </div>
    </div>
  );
}
