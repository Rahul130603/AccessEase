/**
 * Styles for the app-owned pattern components (form fields, skip link, figure).
 *
 * These components render into the *application's* tree, not the toolbar's shadow
 * root, so they need a stylesheet in the light DOM. It is:
 *   - namespaced (.a11ytb-form__*, .a11ytb-skip-link, .a11ytb-figure),
 *   - injected once and removed when the last consumer unmounts (ref-counted),
 *   - free of `!important` and of any element/global selector, and
 *   - intentionally colour-neutral (currentColor / system colours) so it inherits
 *     the application's own theme instead of fighting it.
 *
 * Applications are expected to override these declarations with their own design
 * system; the class names are stable for exactly that purpose.
 */

import { useEffect } from 'react';

import { STYLE_IDS } from '../constants.js';
import { acquireStyle } from '../core/dom/domPatches.js';

/** Ref-counted injection of one namespaced stylesheet. */
export function usePatternStyles(id, css) {
  useEffect(() => acquireStyle(id, css), [id, css]);
}

export const FORM_STYLES = `
.a11ytb-form {
  display: block;
  margin-block-end: 1rem;
  max-inline-size: 34rem;
}

.a11ytb-form__label {
  display: block;
  margin-block-end: 0.25rem;
  font-weight: 600;
}

.a11ytb-form__hint {
  margin: 0 0 0.35rem;
  font-size: 0.9em;
}

.a11ytb-form__control {
  display: block;
  inline-size: 100%;
  min-block-size: 2.25rem;
  padding: 0.35rem 0.5rem;
  font: inherit;
  color: inherit;
  background-color: transparent;
  border: 1px solid currentColor;
  border-radius: 4px;
}

.a11ytb-form__control:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

/* A second, non-colour signal that the field is invalid. The message itself is
   always real text (see the Error: prefix), never generated content. */
.a11ytb-form__control[aria-invalid='true'] {
  border-style: dashed;
  border-width: 2px;
}

.a11ytb-form__error {
  margin: 0.35rem 0 0;
  font-size: 0.9em;
  font-weight: 600;
}

.a11ytb-form__error-label {
  font-weight: 700;
}

.a11ytb-form__choice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-block-size: 24px;
  padding-block: 0.2rem;
  cursor: pointer;
}

.a11ytb-form__choice input {
  inline-size: 1.15rem;
  block-size: 1.15rem;
  margin-block-start: 0.15rem;
  accent-color: currentColor;
}

.a11ytb-form__choice-label {
  font-weight: 600;
}

.a11ytb-form__group {
  margin: 0 0 1rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 4px;
}

.a11ytb-form__group-legend {
  padding-inline: 0.35rem;
  font-weight: 700;
}

@media (forced-colors: active) {
  .a11ytb-form__control,
  .a11ytb-form__group {
    border-color: ButtonText;
  }
}

.a11ytb-form__submit {
  font: inherit;
  min-block-size: 2.25rem;
  padding: 0.45rem 1rem;
  font-weight: 600;
  color: ButtonText;
  background-color: ButtonFace;
  border: 2px solid currentColor;
  border-radius: 4px;
  cursor: pointer;
}

.a11ytb-form__submit:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

.a11ytb-link-button {
  font: inherit;
  min-block-size: 24px;
  padding: 0.1rem 0.2rem;
  color: inherit;
  text-decoration: underline;
  background: none;
  border: 0;
  cursor: pointer;
}

.a11ytb-link-button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

/* ── Shared class names, defined for the light DOM ──────────────────────────
   a11ytb-button, a11ytb-button-row, a11ytb-hint and a11ytb-status are also used
   inside the toolbar's shadow root, where ui/styles/primitives.js styles them.
   The components in patterns/ render into the *application's* tree, which that
   stylesheet cannot reach, so the same names are defined here. Without this, buttons
   rendered by AuthForms and ReviewAndConfirm lost their 44px target size and the
   toolbar's focus styling. */
.a11ytb-button {
  font: inherit;
  min-block-size: 44px;
  min-inline-size: 24px;
  padding: 0.45rem 1rem;
  color: inherit;
  background-color: transparent;
  border: 1px solid currentColor;
  border-radius: 6px;
  cursor: pointer;
}

.a11ytb-button:hover {
  border-color: var(--a11ytb-accent, #0b4fd8);
}

.a11ytb-button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

.a11ytb-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-block: 0.5rem 0.25rem;
}

.a11ytb-hint {
  margin: 0.15rem 0 0;
  font-size: 0.9em;
  opacity: 0.85;
}

.a11ytb-status {
  margin: 0.5rem 0 0;
}

/* ── Error summary ──────────────────────────────────────────────────────── */
.a11ytb-error-summary {
  margin-block-end: 1rem;
  padding: 0.75rem 0.9rem;
  border: 2px solid currentColor;
  border-radius: 6px;
}

.a11ytb-error-summary:focus-visible,
.a11ytb-error-summary:focus {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

.a11ytb-error-summary__title {
  margin: 0 0 0.35rem;
  font-size: 1.05em;
}

.a11ytb-error-summary__list {
  margin: 0;
  padding-inline-start: 1.15rem;
}

.a11ytb-error-summary__link {
  color: inherit;
}

/* ── Password field with toggle ─────────────────────────────────────────── */
.a11ytb-password {
  display: block;
  position: relative;
}

.a11ytb-password--with-toggle .a11ytb-form__control {
  padding-inline-end: 4.5rem;
}

.a11ytb-password__toggle {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: 0.35rem;
  transform: translateY(-50%);
  min-inline-size: 24px;
  min-block-size: 24px;
  padding: 0.2rem 0.5rem;
  font: inherit;
  font-size: 0.85em;
  color: inherit;
  background-color: ButtonFace;
  border: 1px solid currentColor;
  border-radius: 4px;
  cursor: pointer;
}

.a11ytb-password__toggle:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

/* ── Authentication examples ────────────────────────────────────────────── */
.a11ytb-auth {
  max-inline-size: 34rem;
  margin-block-end: 1rem;
}

.a11ytb-auth__alternatives {
  margin: 0.5rem 0 0;
  padding-inline-start: 1.15rem;
}

/* ── Review and confirm ─────────────────────────────────────────────────── */
.a11ytb-review {
  margin-block-end: 1rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid currentColor;
  border-radius: 6px;
}

.a11ytb-review__title {
  margin: 0 0 0.35rem;
  font-size: 1.05em;
}

.a11ytb-review__list {
  display: grid;
  grid-template-columns: minmax(6rem, max-content) 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0.35rem 0 0.75rem;
}

.a11ytb-review__term {
  font-weight: 600;
}

.a11ytb-review__value {
  margin: 0;
}
`;

export const CONFIRM_STYLES = `
.a11ytb-dialog {
  inline-size: min(30rem, calc(100vw - 2rem));
  max-block-size: calc(100vh - 2rem);
  max-block-size: calc(100dvh - 2rem);
  margin: auto;
  padding: 1rem 1.1rem 1.1rem;
  font: inherit;
  color: ButtonText;
  background-color: Canvas;
  border: 2px solid currentColor;
  border-radius: 8px;
  overflow: auto;
}

.a11ytb-dialog::backdrop {
  background-color: rgb(0 0 0 / 0.5);
}

.a11ytb-dialog__title {
  margin: 0 0 0.35rem;
  font-size: 1.1rem;
}

.a11ytb-dialog__description {
  margin: 0 0 0.5rem;
}

.a11ytb-dialog__details {
  margin: 0 0 0.75rem;
  padding-inline-start: 1.15rem;
}

.a11ytb-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-block-start: 0.5rem;
}

.a11ytb-dialog__button {
  font: inherit;
  min-block-size: 2.25rem;
  padding: 0.45rem 0.9rem;
  color: ButtonText;
  background-color: ButtonFace;
  border: 2px solid currentColor;
  border-radius: 4px;
  cursor: pointer;
}

.a11ytb-dialog__button:focus-visible {
  outline: 3px solid Highlight;
  outline-offset: 2px;
}

.a11ytb-dialog__button--primary {
  font-weight: 600;
}

.a11ytb-dialog__button--destructive {
  font-weight: 700;
  /* A second, non-colour signal that this button destroys something. */
  border-style: double;
  border-width: 4px;
}

/* Fallback path only: used when the browser has no showModal(). */
.a11ytb-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgb(0 0 0 / 0.5);
}

@media (prefers-contrast: more) {
  .a11ytb-dialog,
  .a11ytb-dialog__button {
    border-color: currentColor;
  }
}
`;

export const STRUCTURE_STYLES = `
/* Skip link: off-screen until it receives focus. No transition, so it appears
   instantly for users who asked for reduced motion. */
.a11ytb-skip-link {
  position: fixed;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 2147482000;
  padding: 0.6rem 1rem;
  font: inherit;
  font-weight: 600;
  color: ButtonText;
  background-color: ButtonFace;
  border: 2px solid ButtonText;
  border-end-end-radius: 6px;
  transform: translateY(-130%);
}

.a11ytb-skip-link:focus {
  transform: translateY(0);
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

.a11ytb-figure {
  margin: 0 0 1rem;
}

.a11ytb-figure__caption {
  margin-block-start: 0.35rem;
  font-size: 0.9em;
}
`;

export function useFormStyles() {
  usePatternStyles(STYLE_IDS.FORM_PATTERN, FORM_STYLES);
}

export function useStructureStyles() {
  usePatternStyles(STYLE_IDS.STRUCTURE_PATTERN, STRUCTURE_STYLES);
}

export function useConfirmStyles() {
  usePatternStyles(STYLE_IDS.CONFIRM_PATTERN, CONFIRM_STYLES);
}
