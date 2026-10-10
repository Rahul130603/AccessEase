import assert from 'node:assert/strict';
import { preview } from 'vite';
import { chromium } from 'playwright';
import { expect } from '@playwright/test';
import { COLOR_MODES } from '../src/colorVision/colorModes.js';
const rgb = hex => `rgb(${hex.slice(1).match(/../g).map(part => parseInt(part,16)).join(', ')})`;

const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
let browser;
try {
  browser = await chromium.launch({ channel: 'chromium' });
  const page = await browser.newPage();
  const errors = [];
  assert.equal((await page.request.get('http://127.0.0.1:4173/color-blindness.html')).status(), 404);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  assert.equal(await page.locator('[data-card]').count(), 12);
  for (const mode of COLOR_MODES) {
    await page.getByRole('combobox',{name:'Color vision assistance',exact:true}).selectOption(mode.id);
    await expect(page.locator('.cv-section-heading .cv-primary')).toHaveCSS('background-color',rgb(mode.colors.primary));
    await expect(page.locator('[data-cv-bar="error"]')).toHaveCSS('background-color',rgb(mode.colors.error));
  }
  await page.getByRole('button',{name:'Reset to Default',exact:true}).click();
  for (const name of ['High Contrast Mode', 'Dark Mode', 'Light Mode']) {
    const control = page.getByRole('switch', { name, exact: true });
    assert.equal((await control.textContent()).trim(), '');
    await control.click();
    assert.equal(await control.getAttribute('aria-checked'), 'true');
    await control.click();
    assert.equal(await control.getAttribute('aria-checked'), 'false');
  }
  await page.getByRole('group', { name: 'Text Size', exact: true }).getByRole('button', { name: 'Increase Text Size', exact: true }).click();
  assert.equal(await page.evaluate(() => window.AccessibilityWidget.getInstance().getSettings().fontScale), 1.1);
  await page.goto('http://127.0.0.1:4173/integration.html');
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  assert.equal(await page.locator('[data-card]').count(), 12);
  assert.equal(await page.evaluate(() => window.AccessibilityWidget.getInstance().getSettings().fontScale), 1.1);
  await page.getByRole('button', { name: 'Reset All Settings', exact: true }).click();
  assert.equal(await page.locator('#sample-paragraph').evaluate(el => getComputedStyle(el).fontSize), '18px');
  const textCard = page.getByRole('group', { name: 'Text Size', exact: true });
  for (let i = 0; i < 5; i++) await textCard.getByRole('button', { name: 'Decrease Text Size', exact: true }).click();
  assert.equal(await textCard.locator('[data-font-scale]').textContent(), '50%');
  assert.equal(await textCard.getByRole('button', { name: 'Decrease Text Size', exact: true }).isDisabled(), true);
  assert.equal(await textCard.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
  await page.goto('http://127.0.0.1:4173/');
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).waitFor();
  // React may commit after widget initialization; its content observer reapplies saved sizes.
  await expect(page.locator('.hero-description')).toHaveCSS('font-size', '7px');
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Reset text size', exact: true }).click();
  assert.equal(await page.locator('.hero-description').evaluate(el => getComputedStyle(el).fontSize), '14px');
  await page.getByRole('combobox',{name:'Color vision assistance',exact:true}).selectOption('monochrome');
  await page.getByRole('button',{name:'Accessibility Settings',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Accessibility Settings',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Color vision assistance',exact:true})).toHaveValue('monochrome');
  await page.getByRole('button',{name:'Reset to Default',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Color vision assistance',exact:true})).toHaveValue('default');
  assert.deepEqual(errors, []);
  console.log('Production smoke passed: Integrated React demo, five dropdown palettes, monochrome persistence/reset, standalone SDK, 13 settings, 50%-200% sizing, switch-only themes and no browser exceptions.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
