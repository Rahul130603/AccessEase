/**
 * Reduced-motion handling for the toolbar's own chrome.
 *
 * The toolbar must not animate when the user asked for less motion — neither via
 * the operating system nor via its own setting (`.a11ytb-root--reduce`). These
 * rules are scoped inside our shadow root, so the `!important` here only ever
 * affects our own elements.
 */
const reducedMotion = `
@media (prefers-reduced-motion: reduce) {
  .a11ytb-root *,
  .a11ytb-root *::before,
  .a11ytb-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

.a11ytb-root--reduce *,
.a11ytb-root--reduce *::before,
.a11ytb-root--reduce *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

.a11ytb-root--reduce .a11ytb-panel__body {
  scroll-behavior: auto !important;
}
`;

export default reducedMotion;
