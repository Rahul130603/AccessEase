/**
 * Check: authentication fields.
 *
 * What it can prove, from attributes alone:
 *  - a password field with no autocomplete value, or with autocomplete="off";
 *  - a credential field with an inline paste/copy/cut blocker;
 *  - a one-time-code field with no autocomplete="one-time-code".
 *
 * What it can only raise for a person:
 *  - an identifier field that probably needs autocomplete="username" (intent has to
 *    be confirmed — the same input could be a newsletter signup);
 *  - signals of a memory or puzzle test, which WCAG 3.3.8 asks to replace or
 *    supplement with an alternative.
 *
 * This check never reads `input.value` for a credential field and never writes
 * anything: a toolbar cannot repair a login flow owned by another site, and it has
 * no business silently changing a security-related form. It reports, and hands the
 * fix to whoever owns the sign-in code.
 */

import {
  describeElement,
  elementKey,
  isElementVisible,
  isExcludedFromScanning,
  isOwnedByToolbar,
} from '../../dom/domScope.js';
import { visibleText } from '../../dom/accessibilityName.js';
import { AUDIT_LIMITS } from '../../../constants.js';
import { CERTAINTY, SEVERITIES, createFinding } from '../findings.js';

const CREDENTIAL_AUTOCOMPLETE = ['username', 'current-password', 'new-password', 'one-time-code'];
const NAME_HINT = /(user|login|email|pass|pwd|otp|one-?time|code|token|2fa|mfa|pin)/i;
const OTP_HINT = /(otp|one-?time|2fa|mfa|verif\w*\s*code|security\s*code|auth\w*\s*code)/i;
const COGNITIVE_TEXT = /(enter|type)\s+the\s+(third|3rd|fourth|4th|fifth|5th|last)\s+character|what\s+is\s+\d+\s*[-+x*]\s*\d+/i;
const CAPTCHA_SELECTOR =
  'iframe[src*="recaptcha" i], iframe[src*="hcaptcha" i], iframe[src*="turnstile" i], [class*="captcha" i], [id*="captcha" i], [class*="puzzle" i]';

function typeOf(element) {
  return (element.getAttribute('type') || 'text').toLowerCase();
}

function autoCompleteOf(element) {
  return (element.getAttribute('autocomplete') || '').trim().toLowerCase();
}

function hasInlineBlocker(element) {
  return ['onpaste', 'oncopy', 'oncut', 'ondrop'].some((attribute) => element.hasAttribute(attribute));
}

export const checkAuthFields = {
  id: 'auth-fields',
  title: 'Authentication fields',
  detects:
    'Password and one-time-code fields with no autocomplete value, autocomplete="off" on credential fields, and inline paste or copy blockers.',
  needsReview:
    'Identifier fields that probably need autocomplete="username", and signals of a memory or puzzle test that WCAG 3.3.8 asks to replace with an alternative.',
  wcag: [
    { id: '1.3.5', level: 'AA', title: 'Identify Input Purpose' },
    { id: '3.3.8', level: 'AA', title: 'Accessible Authentication (Minimum)' },
    { id: '3.3.7', level: 'A', title: 'Redundant Entry' },
  ],

  run({ root, limits = AUDIT_LIMITS } = {}) {
    const findings = [];
    const counters = {
      authFields: 0,
      passwordFields: 0,
      missingAutocomplete: 0,
      pasteBlocked: 0,
      cognitiveSignals: 0,
    };
    if (!root || typeof root.querySelectorAll !== 'function') return { findings, counters };

    const inputs = Array.from(root.querySelectorAll('input, select, textarea')).slice(
      0,
      limits.MAX_NODES_PER_CHECK,
    );

    inputs.forEach((element) => {
      if (isOwnedByToolbar(element) || isExcludedFromScanning(element)) return;
      if (!isElementVisible(element)) return;

      const type = typeOf(element);
      const autoComplete = autoCompleteOf(element);
      const identity = `${element.getAttribute('name') || ''} ${element.id || ''}`;
      const looksCredential =
        type === 'password' ||
        CREDENTIAL_AUTOCOMPLETE.includes(autoComplete) ||
        (NAME_HINT.test(identity) && ['text', 'email', 'tel', 'number', 'search'].includes(type));

      if (!looksCredential) return;
      counters.authFields += 1;
      if (type === 'password') counters.passwordFields += 1;

      const key = elementKey(element);
      const label = describeElement(element) || element.tagName.toLowerCase();
      const base = {
        checkId: 'auth-fields',
        elementKey: key,
        label,
        element,
        focusable: true,
      };

      // ── Paste and copy blockers ───────────────────────────────────────────
      if (hasInlineBlocker(element)) {
        counters.pasteBlocked += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'paste-blocked',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [{ id: '3.3.8', level: 'AA' }],
            message: 'This field blocks pasting, copying or dropping, which also blocks password managers.',
            why: 'Blocking paste forces people to type a credential by hand, which pushes them towards short, memorable, weak passwords.',
            evidence: ['onpaste', 'oncopy', 'oncut', 'ondrop']
              .filter((attribute) => element.hasAttribute(attribute))
              .join(', '),
            fixExampleId: 'auth-paste',
          }),
        );
      }

      // ── autocomplete="off" on a credential field ──────────────────────────
      if (autoComplete === 'off' || autoComplete === 'none') {
        counters.missingAutocomplete += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'autocomplete-off',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [{ id: '1.3.5', level: 'AA' }],
            message: 'This credential field turns autofill off, so browsers and password managers will not fill it.',
            why: 'Requiring a credential to be recalled and typed by hand is the failure WCAG 3.3.8 addresses.',
            evidence: `autocomplete="${autoComplete}"`,
            fixExampleId: 'auth-autocomplete',
          }),
        );
        return;
      }

      // ── Password fields need current-password or new-password ─────────────
      if (type === 'password' && !['current-password', 'new-password'].includes(autoComplete)) {
        counters.missingAutocomplete += 1;
        findings.push(
          createFinding({
            ...base,
            code: 'password-autocomplete',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.DETECTABLE,
            wcag: [{ id: '1.3.5', level: 'AA' }],
            message:
              'This password field has no usable autocomplete value, so a password manager cannot tell whether it is a current or a new password.',
            why: 'The autocomplete value is what lets a manager fill or offer to save the credential.',
            evidence: autoComplete ? `autocomplete="${autoComplete}"` : 'no autocomplete attribute',
            fixExampleId: 'auth-autocomplete',
          }),
        );
        return;
      }

      // ── One-time code fields ──────────────────────────────────────────────
      if ((OTP_HINT.test(identity) || element.getAttribute('inputmode') === 'numeric') && autoComplete !== 'one-time-code') {
        findings.push(
          createFinding({
            ...base,
            code: 'otp-autocomplete',
            severity: SEVERITIES.WARNING,
            certainty: CERTAINTY.REVIEW,
            wcag: [{ id: '1.3.5', level: 'AA' }],
            message: 'This looks like a one-time code field, but it does not declare autocomplete="one-time-code".',
            why: 'That value is what lets phones and password managers offer the code instead of making the user copy six digits by hand.',
            evidence: autoComplete ? `autocomplete="${autoComplete}"` : 'no autocomplete attribute',
            fixExampleId: 'auth-mfa',
          }),
        );
        return;
      }

      // ── Identifier fields that probably need autocomplete="username" ──────
      if (!autoComplete && ['text', 'email', 'tel'].includes(type) && !OTP_HINT.test(identity)) {
        findings.push(
          createFinding({
            ...base,
            code: 'identifier-autocomplete',
            severity: SEVERITIES.INFO,
            certainty: CERTAINTY.REVIEW,
            wcag: [{ id: '1.3.5', level: 'AA' }],
            message: 'This field looks like a sign-in identifier but does not declare its purpose with autocomplete.',
            why: 'Declaring the purpose lets the browser and the password manager fill it on the next visit. Confirm the field really is an identifier: the same input could be a newsletter signup.',
            evidence: identity.trim() ? `name/id: ${identity.trim()}` : 'no name or id',
            fixExampleId: 'auth-autocomplete',
          }),
        );
      }
    });

    // ── Signals of a memory or puzzle test ──────────────────────────────────
    const captchas = Array.from(root.querySelectorAll(CAPTCHA_SELECTOR))
      .filter((element) => !isOwnedByToolbar(element) && !isExcludedFromScanning(element))
      .filter((element) => isElementVisible(element))
      .slice(0, 3);

    captchas.forEach((element) => {
      counters.cognitiveSignals += 1;
      findings.push(
        createFinding({
          checkId: 'auth-fields',
          elementKey: elementKey(element),
          label: describeElement(element) || 'challenge',
          element,
          code: 'cognitive-challenge',
          severity: SEVERITIES.WARNING,
          certainty: CERTAINTY.REVIEW,
          wcag: [{ id: '3.3.8', level: 'AA' }],
          message: 'This looks like a puzzle or bot challenge on an authentication screen.',
          why: 'WCAG 3.3.8 requires an alternative for any step that relies on remembering, transcribing or solving something, unless the test provides an accessible alternative or a helper.',
          evidence: element.tagName.toLowerCase() + (element.className ? `.${String(element.className).split(' ')[0]}` : ''),
          fixExampleId: 'auth-alternatives',
        }),
      );
    });

    const transcribed = Array.from(root.querySelectorAll('p, label, li, span'))
      .filter((element) => !isOwnedByToolbar(element) && !isExcludedFromScanning(element))
      .slice(0, 400)
      .filter((element) => {
        const text = visibleText(element);
        return Boolean(text && text.length < 160 && COGNITIVE_TEXT.test(text));
      })
      .slice(0, 2);

    transcribed.forEach((element) => {
      counters.cognitiveSignals += 1;
      findings.push(
        createFinding({
          checkId: 'auth-fields',
          elementKey: elementKey(element),
          label: describeElement(element) || 'instruction',
          element,
          code: 'transcription-challenge',
          severity: SEVERITIES.WARNING,
          certainty: CERTAINTY.REVIEW,
          wcag: [{ id: '3.3.8', level: 'AA' }],
          message: 'This instruction asks the user to transcribe or calculate something as part of signing in.',
          why: 'Cognitive function tests are only allowed when an alternative, a mechanism to assist, or a way to avoid the test is provided.',
          evidence: `text: "${visibleText(element).slice(0, 80)}"`,
          fixExampleId: 'auth-alternatives',
        }),
      );
    });

    return { findings, counters };
  },
};
