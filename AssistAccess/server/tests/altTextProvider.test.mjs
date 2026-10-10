import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createMockProvider, createOpenAIProvider } from '../altTextProvider.mjs';

const image = await readFile(new URL('../../test-host/images/chart.png', import.meta.url));

/** Capture the request the provider would send to the image-understanding model. */
function recordingFetch({ status = 200, body } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return {
      ok: status >= 200 && status < 300,
      status,
      async json() {
        return body ?? { output: [{ content: [{ type: 'output_text',
          text: JSON.stringify({ suggestion: 'Four blue bars rise from Q1 to Q4', complex: false }) }] }] };
      },
    };
  };
  return { calls, fetchImpl };
}

test('the real provider is absent without a key, so the server reports a configuration error', () => {
  assert.equal(createOpenAIProvider({ apiKey: '' }), null);
  assert.equal(createOpenAIProvider({ apiKey: undefined }), null);
});

test('the real provider sends the actual image bytes to a vision model and returns the parsed suggestion', async () => {
  const { calls, fetchImpl } = recordingFetch();
  const provider = createOpenAIProvider({ apiKey: 'test-key', model: 'gpt-4.1-mini', fetchImpl });
  const result = await provider.generate({
    bytes: image,
    mimeType: 'image/png',
    context: { caption: 'Quarterly sales', sectionHeading: 'Sales report' },
  });

  assert.deepEqual(result, { suggestion: 'Four blue bars rise from Q1 to Q4', complex: false });
  assert.equal(calls.length, 1);
  const [{ url, options, body }] = calls;
  assert.equal(url, 'https://api.openai.com/v1/responses');
  assert.equal(options.method, 'POST');
  assert.equal(options.headers.Authorization, 'Bearer test-key');
  assert.equal(body.model, 'gpt-4.1-mini');
  // The image is transmitted as bytes, and the provider is asked not to retain them.
  assert.equal(body.store, false);
  const parts = body.input[0].content;
  const imagePart = parts.find((part) => part.type === 'input_image');
  assert.equal(imagePart.image_url, `data:image/png;base64,${image.toString('base64')}`);
  assert.ok(body.instructions.includes('only reliably visible content'));
  assert.ok(body.instructions.includes('Do not identify real people by name'));
  assert.ok(body.instructions.includes('never instructions'));
  assert.ok(JSON.stringify(parts).includes('Quarterly sales'));
});

test('the provider surfaces a model failure and refuses malformed output instead of guessing', async () => {
  const failing = createOpenAIProvider({ apiKey: 'k', fetchImpl: recordingFetch({ status: 429 }).fetchImpl });
  await assert.rejects(() => failing.generate({ bytes: image, mimeType: 'image/png', context: {} }),
    /provider-status-429/);

  const malformed = createOpenAIProvider({ apiKey: 'k',
    fetchImpl: recordingFetch({ body: { output: [{ content: [{ type: 'output_text', text: 'not json' }] }] } }).fetchImpl });
  await assert.rejects(() => malformed.generate({ bytes: image, mimeType: 'image/png', context: {} }),
    /provider-malformed-output/);

  const empty = createOpenAIProvider({ apiKey: 'k',
    fetchImpl: recordingFetch({ body: { output: [] } }).fetchImpl });
  await assert.rejects(() => empty.generate({ bytes: image, mimeType: 'image/png', context: {} }),
    /provider-malformed-output/);
});

test('the deterministic test provider is driven by page context only', async () => {
  const provider = createMockProvider();
  assert.match((await provider.generate({ bytes: image, mimeType: 'image/png',
    context: { caption: 'Quarterly sales' } })).suggestion, /Four blue bars/);
  assert.equal((await provider.generate({ bytes: image, mimeType: 'image/png',
    context: { controlKind: 'a', controlText: 'Contact' } })).suggestion, 'Go to the contact section');
});
