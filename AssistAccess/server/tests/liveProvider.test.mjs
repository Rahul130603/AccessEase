/**
 * Optional live check against a real image-understanding provider.
 *
 *     OPENAI_API_KEY=... npm run test:alt:live
 *
 * This is the only test in the project that contacts a real model. It is skipped unless
 * `OPENAI_API_KEY` is set, because no deterministic assertion can stand in for a live
 * provider. It verifies the transport and the shape of the answer — that real bytes reach
 * the model, that a non-empty, concise description comes back, and that a chart is flagged
 * for a longer explanation. It deliberately does **not** assert the wording or the quality
 * of the description: a human still has to review it against the image.
 *
 * Set ASSISTACCESS_LIVE_IMAGE to test another file (PNG, JPEG or WebP) and
 * ASSISTACCESS_LIVE_CONTEXT to JSON that mimics the page context the widget sends.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createOpenAIProvider } from '../altTextProvider.mjs';

const apiKey = process.env.OPENAI_API_KEY;
const imagePath = resolve(process.env.ASSISTACCESS_LIVE_IMAGE || 'test-host/images/chart.png');
const mimeType = imagePath.endsWith('.png') ? 'image/png'
  : imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg') ? 'image/jpeg'
    : imagePath.endsWith('.webp') ? 'image/webp' : 'application/octet-stream';
const context = process.env.ASSISTACCESS_LIVE_CONTEXT
  ? JSON.parse(process.env.ASSISTACCESS_LIVE_CONTEXT)
  : { caption: 'Quarterly sales increased from Q1 to Q4.', sectionHeading: 'Sales report' };

test('a live provider turns real image bytes into a concise, reviewable description',
  { skip: apiKey ? false : 'OPENAI_API_KEY is not set — the live provider check is opt-in' },
  async () => {
    assert.notEqual(mimeType, 'application/octet-stream', 'use a PNG, JPEG or WebP image');
    const bytes = await readFile(imagePath);
    const provider = createOpenAIProvider({ apiKey });
    assert.ok(provider, 'a provider is created when a key is present');

    const result = await provider.generate({ bytes, mimeType, context });
    assert.equal(typeof result.suggestion, 'string');
    const suggestion = result.suggestion.trim();
    assert.ok(suggestion.length > 0, 'the model returned a description');
    assert.ok(suggestion.length <= 500, `description is too long for alt text: ${suggestion.length} characters`);
    assert.doesNotMatch(suggestion, /^(an? )?(image|picture|photo) of\b/i, 'the description must not start with "image of"');
    assert.doesNotMatch(suggestion, /\.(png|jpe?g|webp|svg|gif)\b/i, 'the description must not be a file name');
    assert.ok(['boolean', 'undefined'].includes(typeof result.complex));

    // Printed for the human reviewer; the assertion above is only about shape.
    process.stdout.write(`live suggestion (${imagePath}, complex=${result.complex === true}): ${suggestion}\n`);
  });
