import React, { useEffect, useRef } from 'react';

import SafeAnimatedContent from '../../patterns/SafeAnimatedContent.jsx';

/**
 * Fixtures for manually testing flashing detection.
 *
 * Each fixture states what the guard is expected to do, so a reviewer can check
 * behaviour without reading the implementation.
 */

export function HazardousFlashFixture() {
  return (
    <div>
      <h3>Fast flashing block — expected: flagged and paused</h3>
      <p>
        A 150&nbsp;ms colour cycle (about 6.7 flashes per second) filling a large area. This is
        above the three-per-second threshold and above the small-safe-area size, so the guard
        should classify it as a hazard.
      </p>
      <div className="harness-hazard" style={{ padding: '2rem', fontWeight: 700 }}>
        Flashing block (150 ms cycle)
      </div>
    </div>
  );
}

export function OpacityBlinkFixture() {
  return (
    <div>
      <h3>Opacity blink — expected: flagged, marked as a low-confidence estimate</h3>
      <p>
        A 120&nbsp;ms opacity cycle (about 8.3 per second). The luminance swing is estimated,
        because the backdrop behind the element is unknown, so the finding should say so.
      </p>
      <div className="harness-blink" style={{ padding: '1rem', background: '#ffd9d9' }}>
        Blinking block (120 ms opacity cycle)
      </div>
    </div>
  );
}

export function SafePulseFixture() {
  return (
    <div>
      <h3>Slow pulse — expected: not flagged</h3>
      <p>An 800&nbsp;ms cycle (about 1.3 per second) is below the threshold and must be left alone.</p>
      <div className="harness-slow-flash" style={{ padding: '1rem', border: '1px solid #333' }}>
        Slow pulse (800 ms cycle)
      </div>
    </div>
  );
}

export function SpinnerFixture() {
  return (
    <div>
      <h3>Spinner — expected: not flagged</h3>
      <p>
        A rotation changes no colour or opacity, so the estimated luminance swing is zero. This is
        the fixture that proves the check is luminance-based rather than “any infinite animation”.
      </p>
      <div className="harness-spinner" role="img" aria-label="Loading indicator" />
    </div>
  );
}

export function ExcludedZoneFixture() {
  return (
    <div data-a11ytb-exclude="">
      <h3>Excluded zone — expected: not scanned</h3>
      <p>
        This section carries <code>data-a11ytb-exclude</code>, which the toolbar's scanners skip.
        The flashing block below must keep flashing even with protection switched on.
      </p>
      <div className="harness-hazard" style={{ padding: '1rem' }}>
        Excluded flashing block
      </div>
    </div>
  );
}

/** Canvas animation: invisible to CSS-based detection, on purpose. */
export function CanvasFixture() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return undefined;
    const context = canvas.getContext('2d');
    let raf = 0;
    let last = 0;
    let light = false;

    const draw = (time) => {
      if (time - last > 100) {
        last = time;
        light = !light;
        context.fillStyle = light ? '#ffffff' : '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div>
      <h3>Canvas animation — expected: listed as “cannot be inspected”</h3>
      <p>
        This canvas toggles between black and white every 100&nbsp;ms (about 5 flashes per second)
        and the toolbar cannot detect it, because the pixels are not readable or measurable from
        the page. It can only appear in the “what this toolbar cannot inspect” list.
      </p>
      <canvas
        className="harness-canvas"
        ref={canvasRef}
        width="240"
        height="120"
        role="img"
        aria-label="Canvas that toggles between black and white"
      />
    </div>
  );
}

/** Media fixtures: stoppable, but not measurable. */
export function MediaFixtures() {
  return (
    <div>
      <h3>Media and animated images — expected: stoppable, never “verified”</h3>
      <p>
        The toolbar can pause a video and hide an animated image, but it cannot analyse their
        frames, so these are listed as manual controls rather than as detected flashing.
      </p>

      <video
        className="harness-video"
        width="320"
        height="180"
        src="./sample.mp4"
        autoPlay
        loop
        muted
        playsInline
      >
        <track kind="captions" />
      </video>
      <p className="harness-note">
        Drop any <code>sample.mp4</code> next to <code>index.html</code> to test the pause control.
        Without the file the element still appears in the list.
      </p>

      <img
        className="harness-image"
        src="./flash.gif"
        width="160"
        height="120"
        alt="Example animated image"
      />
      <p className="harness-note">
        Drop any <code>flash.gif</code> next to <code>index.html</code> to see the hide control act
        on a real animated image.
      </p>

      <marquee className="harness-marquee" behavior="alternate" scrollAmount="12">
        Scrolling text fixture — stoppable only by hiding it.
      </marquee>
    </div>
  );
}

/** The authoring-side pattern, used correctly. */
export function SafePatternFixture() {
  return (
    <div>
      <h3>Safe pattern — expected: starts paused, three controls, honours reduced motion</h3>
      <p>
        This uses <code>SafeAnimatedContent</code>. It does not autoplay, it exposes pause, stop and
        hide controls inside a labelled group, it reports its flash rate to development, and it
        stays paused when reduced motion is requested.
      </p>
      <SafeAnimatedContent
        caption="Safe animated banner (900 ms cycle, about 1.1 flashes per second)"
        flashesPerSecond={1.1}
        areaPx={640 * 120}
        defaultState="paused"
      >
        <div className="harness-safe-animation">Animated content that never autoplays</div>
      </SafeAnimatedContent>
    </div>
  );
}
