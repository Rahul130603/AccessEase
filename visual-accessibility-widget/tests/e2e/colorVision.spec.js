import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { COLOR_MODES } from '../../src/colorVision/colorModes.js';
const rgb = hex => `rgb(${hex.slice(1).match(/../g).map(part => parseInt(part,16)).join(', ')})`;
const openColor = async page => {
  await page.getByRole('button',{name:'Open Color Blindness Settings',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Accessibility Settings',exact:true})).toBeInViewport();
};

test('five dropdown modes update colors, persist, reset and support keyboard selection', async ({page}) => {
  await page.goto('/');
  await openColor(page);
  const select = page.getByRole('combobox',{name:'Color vision assistance',exact:true});
  await expect(select.locator('option')).toHaveCount(5);
  await expect(page.getByRole('radio')).toHaveCount(0);
  await expect(page.locator('a[href="/color-blindness.html"]')).toHaveCount(0);
  const primary = page.locator('.cv-section-heading .cv-primary');
  const normalButton = await primary.evaluate(el => getComputedStyle(el).backgroundColor);
  const normalSurface = await page.locator('.hero-art').evaluate(el => getComputedStyle(el).backgroundColor);
  for (const mode of COLOR_MODES) {
    await select.selectOption(mode.id);
    await expect(select).toHaveValue(mode.id);
    await expect(page.locator('.color-current')).toContainText(mode.name);
    await expect(page.locator('[data-color-description]')).toHaveCount(0);
    await expect(primary).toHaveCSS('background-color',rgb(mode.colors.primary));
    for (const status of ['success','error','warning','information']) {
      await expect(page.locator(`[data-cv-bar="${status}"]`)).toHaveCSS('background-color',rgb(mode.colors[status]));
      expect(await page.locator(`[data-cv-bar="${status}"]`).evaluate(el => getComputedStyle(el).backgroundImage)).not.toBe('none');
    }
    await page.reload();
    await openColor(page);
    await expect(select).toHaveValue(mode.id);
    await expect(primary).toHaveCSS('background-color',rgb(mode.colors.primary));
  }
  await page.getByRole('button',{name:'Reset to Default',exact:true}).click();
  await expect(select).toHaveValue('default');
  await expect(primary).toHaveCSS('background-color',normalButton);
  await expect(page.locator('.hero-art')).toHaveCSS('background-color',normalSurface);
  await select.focus();
  await select.press('Home');
  await select.press('ArrowDown');
  await select.press('Enter');
  await expect(select).toHaveValue('protanopia');
  await expect(page.locator('.color-current')).toContainText('Protanopia Support');
  await page.getByRole('button',{name:'Increase Text Size',exact:true}).click();
  await page.getByRole('button',{name:'Reset to Default',exact:true}).click();
  expect(await page.evaluate(() => window.AccessibilityWidget.getInstance().getSettings().fontScale)).toBe(1.1);
});

test('all five dropdown modes pass contrast audits and fit desktop/mobile', async ({page}) => {
  test.setTimeout(180000);
  for (const width of [1280,390,320]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    await openColor(page);
    const select = page.getByRole('combobox',{name:'Color vision assistance',exact:true});
    const box = await select.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(width+0.01);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const mode of COLOR_MODES) {
      await select.selectOption(mode.id);
      const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      expect(result.violations,`${width}px ${mode.id}`).toEqual([]);
    }
  }
});
