import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function start(page, url = '/') {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Accessibility Settings', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Accessibility Settings' })).toBeVisible();
  await expect(page.locator('[data-card]')).toHaveCount(12);
  await expect(page.getByRole('group', { name: 'Text Size', exact: true })).toHaveCount(1);
}
const settings = page => page.evaluate(() => window.AccessibilityWidget.getInstance().getSettings());
const computed = (page, selector, property) => page.locator(selector).first().evaluate((el, prop) => getComputedStyle(el)[prop], property);
async function setRange(page, label, value) {
  const input = page.getByLabel(label, { exact: true });
  const min = Number(await input.getAttribute('min'));
  const step = Number(await input.getAttribute('step'));
  await input.focus();
  await input.press('Home');
  for (let i = 0; i < Math.round((value - min) / step); i++) await input.press('ArrowRight');
}

test('transitioned fonts stay stable across refreshes, dynamic updates and dyslexia switching', async ({page}) => {
  await start(page);
  await page.evaluate(()=>{
    const fixture=document.createElement('section');fixture.id='transition-fixture';
    fixture.innerHTML='<div style="display:flex;height:24px;width:200px"><a href="#journal" id="transition-text" style="font-size:20px;line-height:24px;transition:all 1s">Long navigation label</a><span>Second label</span></div>';
    document.body.append(fixture);
  });
  await page.evaluate(()=>window.AccessibilityWidget.getInstance().setSettings({fontScale:2}));
  for(let i=0;i<5;i++) {
    await page.evaluate(()=>{window.AccessibilityWidget.getInstance().refresh();const span=document.createElement('span');span.textContent='Dynamic';document.querySelector('#transition-fixture').append(span);});
    await expect(page.locator('#transition-text')).toHaveCSS('font-size','40px');
    await page.waitForTimeout(120);
  }
  await page.evaluate(()=>window.AccessibilityWidget.getInstance().setSettings({dyslexiaFont:true}));
  await expect(page.locator('#transition-text')).toHaveCSS('font-size','40px');
  await expect(page.locator('#transition-text')).toHaveCSS('line-height','48px');
  await expect(page.locator('#transition-text')).toHaveCSS('transition-property','all');
  await page.evaluate(()=>window.AccessibilityWidget.getInstance().setSettings({spacingPreset:'wide',lineHeight:2}));
  await expect(page.locator('#transition-text')).toHaveCSS('line-height','80px');
  await page.evaluate(()=>window.AccessibilityWidget.getInstance().reset());
  await expect(page.locator('#transition-text')).toHaveCSS('font-size','20px');
  await expect(page.locator('#transition-text')).toHaveCSS('line-height','24px');
  await expect(page.locator('#transition-text').locator('..')).toHaveCSS('height','24px');
});

test('text increase and decrease share bounded state and preserve heading hierarchy', async ({ page }) => {
  await start(page);
  const original = await computed(page, '.hero h1', 'fontSize');
  const paragraph = await computed(page, '.hero-description', 'fontSize');
  await expect(page.locator('[data-font-scale]')).toHaveText('100%');
  const minusPosition = await page.getByRole('button', { name: 'Decrease Text Size', exact: true }).first().boundingBox();
  const defaultPosition = await page.getByRole('button', { name: 'Reset text size', exact: true }).first().boundingBox();
  const plusPosition = await page.getByRole('button', { name: 'Increase Text Size', exact: true }).first().boundingBox();
  expect(minusPosition.x).toBeLessThan(defaultPosition.x);
  expect(defaultPosition.x).toBeLessThan(plusPosition.x);
  await page.getByRole('button', { name: 'Increase Text Size', exact: true }).first().click();
  await expect(page.locator('[data-font-scale]')).toHaveText('110%');
  expect(parseFloat(await computed(page, '.hero h1', 'fontSize'))).toBeCloseTo(parseFloat(original) * 1.1, 1);
  expect(parseFloat(await computed(page, '.hero-description', 'fontSize'))).toBeCloseTo(parseFloat(paragraph) * 1.1, 1);
  expect(await page.getByRole('heading', { name: 'Accessibility Settings' }).evaluate(el => getComputedStyle(el).fontSize)).toBe('15px');
  await page.getByRole('button', { name: 'Decrease Text Size', exact: true }).first().click();
  await expect(page.locator('[data-font-scale]')).toHaveText('100%');
  expect(await computed(page, '.hero h1', 'fontSize')).toBe(original);
  await page.evaluate(() => window.AccessibilityWidget.getInstance().setSettings({ fontScale: 9 }));
  expect((await settings(page)).fontScale).toBe(2);
  await expect(page.getByRole('button', { name: 'Increase Text Size', exact: true }).first()).toBeDisabled();
  await page.getByRole('button', { name: 'Reset text size', exact: true }).first().click();
  expect((await settings(page)).fontScale).toBe(1);
  await expect(page.locator('[data-font-scale]')).toHaveText('100%');
});

test('high contrast, dark, and light themes are exclusive and reversible', async ({ page }) => {
  await start(page);
  const original = await computed(page, '.hero-art', 'backgroundColor');
  const cases = [['contrast','rgb(0, 0, 0)'], ['dark','rgb(16, 24, 39)'], ['light',original]];
  for (const [theme, color] of cases) {
    await page.locator(`[data-theme="${theme}"]`).click();
    expect((await settings(page)).theme).toBe(theme);
    expect(await computed(page, '.hero-art', 'backgroundColor')).toBe(color);
    await expect(page.locator('.theme-control[aria-checked="true"]')).toHaveCount(1);
    expect(await computed(page, '.hero-art img', 'filter')).toBe('none');
  }
  await page.locator('[data-theme="light"]').click();
  expect(await computed(page, '.hero-art', 'backgroundColor')).toBe(original);
});

test('single Text Size card adjusts, resets, and enforces both limits', async ({ page }) => {
  await start(page);
  const group = page.getByRole('group', { name: 'Text Size', exact: true });
  await expect(group.getByRole('button')).toHaveCount(3);
  await expect(page.getByRole('group', { name: /Increase Font|Decrease Font/ })).toHaveCount(0);
  await group.getByRole('button', { name: 'Increase Text Size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('110%');
  await group.getByRole('button', { name: 'Decrease Text Size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('100%');
  await group.getByRole('button', { name: 'Decrease Text Size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('90%');
  await group.getByRole('button', { name: 'Decrease Text Size', exact: true }).click();
  await expect(group.getByRole('button', { name: 'Decrease Text Size', exact: true })).toBeEnabled();
  for (let percent = 70; percent >= 50; percent -= 10) {
    await group.getByRole('button', { name: 'Decrease Text Size', exact: true }).click();
    await expect(group.locator('[data-font-scale]')).toHaveText(`${percent}%`);
  }
  await expect(group.getByRole('button', { name: 'Decrease Text Size', exact: true })).toBeDisabled();
  await group.getByRole('button', { name: 'Reset text size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('100%');
  for (let percent = 110; percent <= 200; percent += 10) {
    await group.getByRole('button', { name: 'Increase Text Size', exact: true }).click();
    await expect(group.locator('[data-font-scale]')).toHaveText(`${percent}%`);
  }
  await expect(group.getByRole('button', { name: 'Increase Text Size', exact: true })).toBeDisabled();
  await group.getByRole('button', { name: 'Decrease Text Size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('190%');
  await group.getByRole('button', { name: 'Reset text size', exact: true }).click();
  expect((await settings(page)).fontScale).toBe(1);
});

test('50% minimum scales website text proportionally, persists, and uses the default card color', async ({ page }) => {
  await start(page);
  const group = page.getByRole('group', { name: 'Text Size', exact: true });
  const original = await computed(page, '.hero-description', 'fontSize');
  const originalHeading = parseFloat(await computed(page, '.hero h1', 'fontSize'));
  expect(await group.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await group.evaluate(el => getComputedStyle(el).borderTopColor)).toBe('rgb(226, 232, 240)');
  const minus = group.getByRole('button', { name: 'Decrease Text Size', exact: true });
  for (let i = 0; i < 5; i++) await minus.click();
  await expect(group.locator('[data-font-scale]')).toHaveText('50%');
  await expect(minus).toBeDisabled();
  expect((await settings(page)).fontScale).toBe(0.5);
  expect(parseFloat(await computed(page, '.hero-description', 'fontSize'))).toBeCloseTo(parseFloat(original) * 0.5, 2);
  expect(parseFloat(await computed(page, '.hero h1', 'fontSize'))).toBeCloseTo(originalHeading * 0.5, 2);
  expect(await page.getByRole('heading', { name: 'Accessibility Settings' }).evaluate(el => getComputedStyle(el).fontSize)).toBe('15px');
  expect(await group.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  await page.reload();
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('50%');
  expect(parseFloat(await computed(page, '.hero-description', 'fontSize'))).toBeCloseTo(parseFloat(original) * 0.5, 2);
  await group.getByRole('button', { name: 'Increase Text Size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('60%');
  await expect(minus).toBeEnabled();
  await group.getByRole('button', { name: 'Reset text size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('100%');
  expect(await computed(page, '.hero-description', 'fontSize')).toBe(original);
});

test('saved 102% is normalized to 100% and every subsequent click uses 10% steps', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('uaw:preferences:v1', JSON.stringify({ version: 1, settings: { fontScale: 1.02 } }));
  });
  await start(page);
  const group = page.getByRole('group', { name: 'Text Size', exact: true });
  await expect(group.locator('[data-font-scale]')).toHaveText('100%');
  await group.getByRole('button', { name: 'Increase Text Size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('110%');
  await group.getByRole('button', { name: 'Decrease Text Size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('100%');
  await page.evaluate(() => window.AccessibilityWidget.getInstance().setSettings({ fontScale: 1.03 }));
  await expect(group.locator('[data-font-scale]')).toHaveText('100%');
  await group.getByRole('button', { name: 'Decrease Text Size', exact: true }).click();
  await expect(group.locator('[data-font-scale]')).toHaveText('90%');
});

test('adaptive light mode preserves light surfaces, photos and charts and converts dark sections', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const fixture = document.createElement('section'); fixture.id='light-fixture';
    fixture.innerHTML='<div id="light-surface" style="background:#fff8e7;color:#243b53">Original pastel surface</div><div id="dark-surface" style="background:#13243a;color:#ffffff"><p id="dark-copy">Dark section text</p><a id="dark-link" href="#journal">Read more</a><div class="dashboard-chart" id="protected-chart"><span>Chart label</span><div id="protected-bar" style="height:24px;background:linear-gradient(90deg,#15803d,#2563eb)">Chart data</div></div></div><div id="photo-background" style="background:#123 url(/images/landscape.svg);color:white">Text on photo</div>';
    document.body.append(fixture);
  });
  const selectors=['#light-surface','.hero-art','.hero-art img','#protected-chart','#protected-bar','.cv-status','.cv-bar','.cv-pattern','#photo-background'];
  const appearance = () => Promise.all(selectors.map(selector => page.locator(selector).first().evaluate(el => {
    const css=getComputedStyle(el);
    // Compare the visible backdrop: a transparent chart originally uses its parent.
    let backdrop=css.backgroundColor, ancestor=el;
    while (backdrop === 'rgba(0, 0, 0, 0)' && ancestor.parentElement) {
      ancestor=ancestor.parentElement; backdrop=getComputedStyle(ancestor).backgroundColor;
    }
    return [backdrop,css.backgroundImage,css.color,css.borderColor,css.filter];
  })));
  const before=await appearance();
  const originalCopyColor=await computed(page,'#dark-copy','color');
  await page.getByRole('switch',{name:'Light Mode',exact:true}).click();
  expect(await appearance()).toEqual(before);
  expect(await computed(page,'#dark-surface','backgroundColor')).toBe('rgb(255, 255, 255)');
  expect(await computed(page,'#dark-copy','color')).toBe('rgb(15, 23, 42)');
  expect(await computed(page,'#dark-link','color')).toBe('rgb(29, 78, 216)');
  await page.evaluate(() => { const section=document.createElement('div'); section.id='dynamic-dark';section.style.cssText='background:#101827;color:white';section.textContent='New dark content';document.body.append(section); });
  await expect.poll(() => computed(page,'#dynamic-dark','backgroundColor')).toBe('rgb(255, 255, 255)');
  await page.getByRole('switch',{name:'Light Mode',exact:true}).click();
  expect(await computed(page,'#dark-surface','backgroundColor')).toBe('rgb(19, 36, 58)');
  expect(await computed(page,'#dark-copy','color')).toBe(originalCopyColor);
  expect(await appearance()).toEqual(before);
});

test('theme switches apply and remove the selected mode, persist, and reset', async ({ page }) => {
  await start(page);
  const original = await computed(page, '.hero-art', 'backgroundColor');
  for (const name of ['High Contrast Mode', 'Dark Mode', 'Light Mode']) {
    const control = page.getByRole('switch', { name, exact: true });
    await expect(control).toHaveText('');
    await expect(control).not.toBeChecked();
    await control.click();
    await expect(control).toHaveText('');
    await expect(control).toBeChecked();
    await control.click();
    await expect(control).toHaveText('');
    await expect(control).not.toBeChecked();
    expect((await settings(page)).theme).toBe('default');
    expect(await computed(page, '.hero-art', 'backgroundColor')).toBe(original);
  }
  await page.getByRole('switch', { name: 'High Contrast Mode', exact: true }).click();
  await page.getByRole('switch', { name: 'Dark Mode', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'High Contrast Mode', exact: true })).not.toBeChecked();
  await page.reload();
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Dark Mode', exact: true })).toBeChecked();
  await expect(page.getByRole('switch', { name: 'Dark Mode', exact: true })).toHaveText('');
  await page.getByRole('switch', { name: 'Dark Mode', exact: true }).focus();
  await page.keyboard.press('Space');
  expect((await settings(page)).theme).toBe('default');
  await page.getByRole('switch', { name: 'Dark Mode', exact: true }).click();
  await page.getByRole('button', { name: 'Reset All Settings', exact: true }).click();
  await expect(page.locator('.theme-control[aria-checked="true"]')).toHaveCount(0);
});

test('grayscale filters content and leaves widget controls independent', async ({ page }) => {
  await start(page);
  await page.getByRole('switch', { name: 'Grayscale Mode', exact: true }).click();
  expect(await computed(page, '#root', 'filter')).toContain('grayscale(1)');
  expect(await page.locator('.panel').evaluate(el => getComputedStyle(el).filter)).toBe('none');
  await page.getByRole('switch', { name: 'Grayscale Mode', exact: true }).click();
  expect(await computed(page, '#root', 'filter')).toBe('none');
});

test('color assistance adds distinct labeled statuses for all four assistance palettes', async ({ page }) => {
  await start(page);
  for (const [mode, name] of [['protanopia','Protanopia Support'],['deuteranopia','Deuteranopia Support'],['tritanopia','Tritanopia Support'],['monochrome','High Distinction / Monochrome']]) {
    await page.getByRole('combobox', { name: 'Color vision assistance', exact: true }).selectOption(mode);
    expect((await settings(page)).colorVisionMode).toBe(mode);
    expect(await computed(page, '[data-uaw-status="ready"]', 'borderStyle')).toBe('solid');
    expect(await computed(page, '[data-uaw-status="review"]', 'borderStyle')).toBe('dotted');
    expect(await computed(page, '[data-uaw-status="draft"]', 'borderStyle')).toBe('double');
    await expect(page.locator('[data-uaw-status="ready"]')).toContainText('Ready');
  }
  await page.getByRole('combobox', { name: 'Color vision assistance', exact: true }).selectOption('default');
  expect(await computed(page, '[data-uaw-status="review"]', 'borderStyle')).toBe('solid');
});

test('spacing presets and custom controls update every typography dimension', async ({ page }) => {
  await start(page);
  const properties = ['letterSpacing', 'wordSpacing', 'lineHeight', 'marginBottom'];
  const baseline = await Promise.all(properties.map(property => computed(page, '.hero-description', property)));
  await page.getByRole('button', { name: 'Comfortable', exact: true }).click();
  expect((await settings(page)).lineHeight).toBe(1.7);
  await page.getByRole('button', { name: 'Wide', exact: true }).click();
  const font = parseFloat(await computed(page, '.hero-description', 'fontSize'));
  expect(parseFloat(await computed(page, '.hero-description', 'letterSpacing'))).toBeCloseTo(font * 0.12, 1);
  expect(parseFloat(await computed(page, '.hero-description', 'wordSpacing'))).toBeCloseTo(font * 0.16, 1);
  expect(parseFloat(await computed(page, '.hero-description', 'lineHeight'))).toBeCloseTo(font * 2, 1);
  expect(parseFloat(await computed(page, '.hero-description', 'marginBottom'))).toBeCloseTo(font * 2, 1);
  await page.getByRole('button', { name: 'Custom', exact: true }).click();
  expect(await Promise.all(properties.map(property => computed(page, '.hero-description', property)))).toEqual(baseline);
  const originalPreview = await page.locator('[data-spacing-preview="original"]').evaluate(el => {
    const style = getComputedStyle(el); return [style.letterSpacing, style.wordSpacing, style.lineHeight];
  });
  await expect(page.locator('[data-output="lineHeight"]')).toHaveText('1.5×');
  await setRange(page, 'Letter spacing', 0.15);
  expect((await settings(page)).letterSpacing).toBe(0.15);
  expect(parseFloat(await computed(page, '.hero-description', 'letterSpacing'))).toBeCloseTo(font * 0.15, 1);
  expect(await computed(page, '.hero-description', 'lineHeight')).toBe(baseline[2]);
  await setRange(page, 'Word spacing', 0.2);
  expect(parseFloat(await computed(page, '.hero-description', 'wordSpacing'))).toBeCloseTo(font * 0.2, 1);
  await setRange(page, 'Line height', 1.5);
  await setRange(page, 'Paragraph gap', 1);
  expect(parseFloat(await computed(page, '.hero-description', 'lineHeight'))).toBeCloseTo(font * 1.5, 1);
  expect(parseFloat(await computed(page, '.hero-description', 'marginBottom'))).toBeCloseTo(font, 1);
  const adjusted = page.locator('[data-spacing-preview="adjusted"]');
  expect(await adjusted.evaluate(el => getComputedStyle(el).letterSpacing)).toBe('1.8px');
  expect(await adjusted.evaluate(el => getComputedStyle(el).wordSpacing)).toBe('2.4px');
  expect(await adjusted.evaluate(el => getComputedStyle(el).lineHeight)).toBe('18px');
  expect(await adjusted.locator('p').last().evaluate(el => getComputedStyle(el).marginTop)).toBe('12px');
  expect(await page.locator('[data-spacing-preview="original"]').evaluate(el => {
    const style = getComputedStyle(el); return [style.letterSpacing, style.wordSpacing, style.lineHeight];
  })).toEqual(originalPreview);
  await page.getByRole('button', { name: 'Reset All Settings', exact: true }).click();
  expect(await Promise.all(properties.map(property => computed(page, '.hero-description', property)))).toEqual(baseline);
  await page.getByRole('button', { name: 'Custom', exact: true }).click();
  expect(await Promise.all(properties.map(property => computed(page, '.hero-description', property)))).toEqual(baseline);
  await page.getByRole('button', { name: 'Default', exact: true }).click();
  expect(await computed(page, '.hero-description', 'letterSpacing')).toBe('normal');
  await page.evaluate(() => window.AccessibilityWidget.getInstance().setSettings({ spacingPreset: 'custom', lineHeight: 1.5 }));
  expect(parseFloat(await computed(page, '.hero-description', 'lineHeight'))).toBeCloseTo(font * 1.5, 1);
  await page.reload();
  await expect.poll(() => computed(page, '.hero-description', 'lineHeight')).toBe(`${font * 1.5}px`);
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Reset All Settings', exact: true }).click();
  expect(await Promise.all(properties.map(property => computed(page, '.hero-description', property)))).toEqual(baseline);
});

test('magnifier shows actual hovered text, follows focus, scales and dismisses', async ({ page }) => {
  await start(page);
  await page.getByRole('switch', { name: 'Magnifier / Zoom', exact: true }).click();
  await page.getByLabel('Magnification level', { exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Close Panel', exact: true }).click();
  await page.locator('.hero-description').hover();
  await expect(page.locator('.magnifier-text')).toHaveText(/We bring ideas to life/);
  expect(await page.locator('.magnifier-text').evaluate(el => getComputedStyle(el).fontSize)).toBe('48px');
  const paragraph = await page.locator('.hero-description').boundingBox();
  const cursor = { x: paragraph.x + 20, y: paragraph.y + 15 };
  await page.mouse.move(cursor.x, cursor.y);
  await expect.poll(async () => (await page.locator('.magnifier').boundingBox()).x).toBeCloseTo(cursor.x + 18, 0);
  const firstPosition = await page.locator('.magnifier').boundingBox();
  await page.mouse.move(cursor.x + 40, cursor.y);
  await expect.poll(async () => (await page.locator('.magnifier').boundingBox()).x).toBeCloseTo(firstPosition.x + 40, 0);
  await page.locator('.hero-actions a').first().focus();
  await expect(page.locator('.magnifier-text')).toHaveText('Explore our stories');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Magnified text' })).toBeHidden();
  expect((await settings(page)).magnifier).toBe(false);
});

test('cursor magnifier stays inside desktop and mobile viewport edges', async ({ page }) => {
  await start(page);
  await page.getByRole('switch', { name: 'Magnifier / Zoom', exact: true }).click();
  await page.getByRole('button', { name: 'Close Panel', exact: true }).click();
  await page.evaluate(() => {
    const text = document.createElement('p');
    text.id = 'magnifier-edge-text';
    text.textContent = 'Readable text near the screen edge';
    text.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:1000;margin:0;width:200px;background:white';
    document.body.append(text);
  });
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('#magnifier-edge-text').hover();
    await expect(page.locator('.magnifier')).toBeVisible();
    await expect(page.locator('.magnifier-text')).toHaveText('Readable text near the screen edge');
    await expect.poll(async () => {
      const box = await page.locator('.magnifier').boundingBox();
      return box.x >= 9 && box.y >= 9 && box.x + box.width <= width - 9 && box.y + box.height <= 835;
    }).toBe(true);
  }
});

test('magnifier reads generic text elements and excludes images and private fields', async ({ page }) => {
  await start(page);
  await page.getByRole('switch', { name: 'Magnifier / Zoom', exact: true }).click();
  await page.getByRole('button', { name: 'Close Panel', exact: true }).click();
  await page.evaluate(() => {
    const fixture = document.createElement('div');
    fixture.id = 'magnifier-fixture';
    fixture.style.cssText = 'position:fixed;top:100px;left:20px;z-index:1000;background:white;padding:10px';
    fixture.innerHTML = '<div id="generic-copy">Generic DIV words 123 தமிழ்</div><span id="inline-copy">Inline letters ABC</span><div><strong id="strong-copy">Bold content only</strong><span> Different sibling</span></div><img id="excluded-image" alt="Do not magnify image alternatives" width="80" height="40" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2240%22/%3E"><input id="visible-copy" value="Visible form text"><input id="private-copy" type="password" value="Private input text">';
    document.body.append(fixture);
  });
  for (const [id, text] of [['generic-copy','Generic DIV words 123 தமிழ்'], ['inline-copy','Inline letters ABC'], ['strong-copy','Bold content only'], ['visible-copy','Visible form text']]) {
    await page.locator(`#${id}`).hover();
    await expect(page.locator('.magnifier-text')).toHaveText(text);
    await expect(page.locator('.magnifier')).toBeVisible();
  }
  await expect(page.locator('.magnifier-header')).toHaveCount(0);
  for (const id of ['excluded-image', 'private-copy']) {
    await page.locator(`#${id}`).hover();
    await expect(page.locator('.magnifier')).toBeHidden();
  }
});

test('link highlighting and dyslexia font affect the site and restore defaults', async ({ page }) => {
  await start(page);
  const link = '.hero-actions a:first-child';
  const destination = await page.locator(link).getAttribute('href');
  const font = await computed(page, '.hero-description', 'fontFamily');
  await page.getByRole('switch', { name: 'Highlight Links', exact: true }).click();
  expect(await computed(page, link, 'textDecorationLine')).toContain('underline');
  expect(await computed(page, link, 'outlineStyle')).toBe('solid');
  expect(await page.locator(link).getAttribute('href')).toBe(destination);
  await page.getByRole('switch', { name: 'Dyslexia-Friendly Font', exact: true }).click();
  expect(await computed(page, '.hero-description', 'fontFamily')).toContain('UAW OpenDyslexic');
  expect(await page.evaluate(async () => {
    const variants = ['400 16px','700 16px','italic 400 16px','italic 700 16px'];
    const loaded = await Promise.all(variants.map(variant => document.fonts.load(`${variant} "UAW OpenDyslexic"`, 'The Quick Brown Fox')));
    return loaded.every(faces => faces.length > 0 && faces.every(face => face.status === 'loaded'));
  })).toBe(true);
  await page.getByRole('switch', { name: 'Dyslexia-Friendly Font', exact: true }).click();
  expect(await computed(page, '.hero-description', 'fontFamily')).toBe(font);
});

test('highlight mode marks links and every semantic button, including dynamic controls, and restores styles', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const fixture = document.createElement('section');
    fixture.id = 'highlight-fixture';
    fixture.innerHTML = '<a href="#services">Fixture link</a><button type="button">Native button</button><button disabled>Disabled button</button><input type="submit" value="Submit"><input type="reset" value="Reset"><input type="button" value="Input button"><div role="button" tabindex="0">Custom button</div><span role="link" tabindex="0">Custom link</span><details><summary>Open details</summary>Details text</details><p>Plain content</p>';
    fixture.querySelector('button').onclick = () => { fixture.dataset.clicked = 'yes'; };
    document.body.append(fixture);
  });
  const controls = page.locator('#highlight-fixture').locator('a,button,input,[role="button"],[role="link"],summary');
  const original = await controls.evaluateAll(elements => elements.map(el => {
    const css = getComputedStyle(el); return [css.outlineStyle, css.outlineWidth, css.boxShadow, css.textDecorationLine];
  }));
  await page.getByRole('switch', { name: 'Highlight Links', exact: true }).click();
  await expect.poll(() => controls.evaluateAll(elements => elements.every(el => getComputedStyle(el).outlineStyle === 'solid' && getComputedStyle(el).outlineWidth === '2px'))).toBe(true);
  expect(await page.locator('#highlight-fixture p').evaluate(el => getComputedStyle(el).outlineStyle)).toBe('none');
  await page.evaluate(() => {
    const button = document.createElement('button'); button.id = 'dynamic-highlight'; button.textContent = 'New dynamic button';
    document.querySelector('#highlight-fixture').append(button);
  });
  await expect.poll(() => page.locator('#dynamic-highlight').evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.getByRole('button', { name: 'Close Panel', exact: true }).click();
  await page.locator('#highlight-fixture button').first().click();
  await expect(page.locator('#highlight-fixture')).toHaveAttribute('data-clicked','yes');
  await page.locator('#highlight-fixture [role="button"]').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#highlight-fixture [role="link"]')).toBeFocused();
  await expect.poll(() => page.locator('#highlight-fixture [role="link"]').evaluate(el => getComputedStyle(el).outlineStyle)).toBe('dashed');
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  await page.getByRole('switch', { name: 'Highlight Links', exact: true }).click();
  expect(await controls.evaluateAll(elements => elements.slice(0,-1).map(el => {
    const css = getComputedStyle(el); return [css.outlineStyle, css.outlineWidth, css.boxShadow, css.textDecorationLine];
  }))).toEqual(original);
});

test('screen-edge reading controls resize guide and mask without opening settings', async ({ page }) => {
  await start(page);
  await expect(page.locator('.reading-size-controls').first()).toBeHidden();
  await page.getByRole('switch', { name: 'Reading Guide', exact: true }).click();
  await page.getByRole('switch', { name: 'Reading Mask', exact: true }).click();
  await page.getByRole('button', { name: 'Close Panel', exact: true }).click();
  await page.mouse.move(500,350);
  await page.getByRole('button', { name: 'Increase reading guide size', exact: true }).click();
  expect((await settings(page)).guideHeight).toBe(10);
  await expect.poll(() => page.locator('.guide').evaluate(el => getComputedStyle(el).height)).toBe('10px');
  await page.getByRole('button', { name: 'Increase reading mask size', exact: true }).click();
  expect((await settings(page)).maskHeight).toBe(130);
  await page.getByRole('button', { name: 'Decrease reading guide size', exact: true }).click();
  await page.getByRole('button', { name: 'Decrease reading mask size', exact: true }).click();
  expect((await settings(page)).guideHeight).toBe(8);
  expect((await settings(page)).maskHeight).toBe(120);
  await page.evaluate(() => window.AccessibilityWidget.getInstance().setSettings({ guideHeight:24, maskHeight:Math.ceil(innerHeight / 10) * 10 }));
  await expect(page.getByRole('button', { name: 'Increase reading guide size', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Increase reading mask size', exact: true })).toBeDisabled();
  await page.evaluate(() => window.AccessibilityWidget.getInstance().setSettings({ guideHeight:2, maskHeight:60 }));
  await expect(page.getByRole('button', { name: 'Decrease reading guide size', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Decrease reading mask size', exact: true })).toBeDisabled();
  for (const width of [1280,390,320]) {
    await page.setViewportSize({ width, height:844 });
    await page.mouse.move(width / 2, 810);
    await expect.poll(() => page.locator('.reading-size-controls').evaluateAll(elements => elements.every(el => {
      const box=el.getBoundingClientRect();return box.left>=0 && box.right<=innerWidth && box.top>=0 && box.bottom<=innerHeight-80;
    }))).toBe(true);
  }
  await page.getByRole('button', { name: 'Increase reading mask size', exact: true }).focus();
  await page.keyboard.press('Enter');
  expect((await settings(page)).maskHeight).toBe(70);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Increase reading mask size', exact: true })).toBeVisible();
  expect((await settings(page)).maskHeight).toBe(70);
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  await expect(page.getByLabel('Reading band', { exact:true })).toHaveValue('70');
  await page.getByRole('button', { name: 'Reset All Settings', exact:true }).click();
  await expect(page.locator('.reading-size-controls').first()).toBeHidden();
});

test('reading mask has a 540px maximum, persists and shrinks again', async ({ page }) => {
  await start(page);
  await page.getByRole('switch', { name:'Reading Mask', exact:true }).click();
  const band = page.getByLabel('Reading band', { exact:true });
  await band.focus(); await band.press('End');
  expect((await settings(page)).maskHeight).toBe(540);
  await page.getByRole('button', { name:'Close Panel', exact:true }).click();
  for (const [width,height] of [[1280,900],[390,844],[320,640]]) {
    await page.setViewportSize({width,height});
    for (const y of [15,height-15]) {
      await page.mouse.move(width / 2,y);
      await expect.poll(() => page.locator('.mask').evaluateAll(elements => innerHeight - elements.reduce((sum,el) => sum + el.getBoundingClientRect().height,0))).toBe(540);
    }
    await expect(page.getByRole('button',{name:'Increase reading mask size',exact:true})).toBeDisabled();
  }
  await page.reload();
  expect((await settings(page)).maskHeight).toBe(540);
  await page.getByRole('button',{name:'Decrease reading mask size',exact:true}).click();
  expect((await settings(page)).maskHeight).toBeLessThan(540);
  await expect.poll(() => page.locator('.mask').evaluateAll(elements => elements.reduce((sum,el) => sum + el.getBoundingClientRect().height,0))).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Increase reading mask size',exact:true}).click();
  expect((await settings(page)).maskHeight).toBe(540);
  await page.getByRole('button',{name:'Accessibility Settings',exact:true}).click();
  await page.getByRole('button',{name:'Reset All Settings',exact:true}).click();
  expect((await settings(page)).maskHeight).toBeLessThan(540);
  expect((await settings(page)).maskHeight).toBe(120);
});

test('reading guide and mask cooperate, follow pointer/focus, and do not block clicks', async ({ page }) => {
  await start(page);
  await page.getByRole('switch', { name: 'Reading Guide', exact: true }).click();
  await page.getByRole('switch', { name: 'Reading Mask', exact: true }).click();
  await setRange(page, 'Guide height', 16);
  await setRange(page, 'Reading band', 180);
  await page.getByRole('button', { name: 'Close Panel', exact: true }).click();
  await page.mouse.move(300, 300);
  await expect(page.locator('.guide')).toBeVisible();
  expect(await page.locator('.guide').evaluate(el => getComputedStyle(el).top)).toBe('300px');
  expect(await page.locator('.guide').evaluate(el => getComputedStyle(el).height)).toBe('16px');
  expect(await page.locator('.mask-top').evaluate(el => getComputedStyle(el).height)).toBe('210px');
  expect(await page.locator('.mask-top').evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
  await page.locator('.hero-actions a').first().focus();
  const box = await page.locator('.hero-actions a').first().boundingBox();
  await expect.poll(() => page.locator('.guide').evaluate(el => parseFloat(getComputedStyle(el).top))).toBeCloseTo(box.y + box.height / 2, 0);
  await page.getByRole('button', { name: 'Dismiss reading mask', exact: true }).click();
  await expect(page.locator('.mask-top')).toBeHidden();
  await page.locator('.hero-actions a').first().click();
  await expect(page).toHaveURL(/#journal/);
});

test('combined preferences persist on reload and reset restores the host', async ({ page }) => {
  await start(page);
  const original = await computed(page, '.hero-description', 'fontSize');
  await page.evaluate(() => window.AccessibilityWidget.getInstance().setSettings({ fontScale: 1.3, theme: 'dark', grayscale: true, spacingPreset: 'wide', letterSpacing: 0.12, wordSpacing: 0.16, lineHeight: 2, paragraphSpacing: 2, highlightLinks: true, dyslexiaFont: true, readingGuide: true, readingMask: true }));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Accessibility Settings', exact: true })).toBeVisible();
  expect(await settings(page)).toMatchObject({ theme: 'dark', fontScale: 1.3, grayscale: true, readingGuide: true, readingMask: true });
  await page.getByRole('button', { name: 'Accessibility Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Reset All Settings', exact: true }).click();
  expect(await settings(page)).toMatchObject({ theme: 'default', fontScale: 1, grayscale: false, readingGuide: false, readingMask: false });
  expect(await computed(page, '.hero-description', 'fontSize')).toBe(original);
  expect(await computed(page, '#root', 'filter')).toBe('none');
});

test('Escape returns focus and drawer permits keyboard navigation back to the page', async ({ page }) => {
  await start(page);
  await expect(page.getByRole('button', { name: 'Close accessibility panel', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Decrease Text Size', exact: true }).first()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Reset text size', exact: true }).first()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Increase Text Size', exact: true }).first()).toBeFocused();
  await page.keyboard.press('Enter');
  expect((await settings(page)).fontScale).toBe(1.1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Accessibility Settings', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('desktop and mobile reflow, including combined wide text at 200 percent', async ({ page }) => {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await start(page);
    const panel = await page.locator('.panel').boundingBox();
    // WebKit can report fractional transform geometry a few millionths over a CSS pixel.
    expect(panel.width).toBeLessThanOrEqual(350.01);
    expect(panel.height).toBeLessThanOrEqual(700.01);
    expect(panel.x).toBeGreaterThanOrEqual(0); expect(panel.x + panel.width).toBeLessThanOrEqual(width);
    await page.evaluate(() => window.AccessibilityWidget.getInstance().setSettings({ fontScale: 2 }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.evaluate(() => window.AccessibilityWidget.getInstance().setSettings({ fontScale: 2, spacingPreset: 'wide', letterSpacing: 0.12, wordSpacing: 0.16, lineHeight: 2, paragraphSpacing: 2 }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(await page.locator('.panel-body').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.getByRole('button', { name: 'Reset All Settings', exact: true }).click();
  }
});

test('new React article content inherits preferences after navigation', async ({ page }) => {
  await start(page);
  await page.evaluate(() => window.AccessibilityWidget.getInstance().setSettings({ fontScale: 1.5, theme: 'dark' }));
  await page.getByRole('button', { name: 'Close Panel', exact: true }).click();
  await page.locator('.article-read').first().click();
  await expect(page.locator('.article-reader')).toBeVisible();
  await expect.poll(() => computed(page, '.article-reader', 'backgroundColor')).toBe('rgb(16, 24, 39)');
  await expect.poll(() => computed(page, '.article-reader p', 'fontSize').then(parseFloat)).toBe(24);
});

test('standalone script integrates without React, handles dynamic content, and cleans up', async ({ page }) => {
  await start(page, '/integration.html');
  expect(await page.evaluate(() => Boolean(document.querySelector('script[src*="main.jsx"]')))).toBe(false);
  const baseline = await computed(page, '#sample-paragraph', 'fontSize');
  const originalFamily = await computed(page, '#sample-paragraph', 'fontFamily');
  await page.getByRole('switch', { name: 'Dyslexia-Friendly Font', exact: true }).click();
  expect(await page.evaluate(async () => (await document.fonts.load('16px "UAW OpenDyslexic"', 'The Quick Brown Fox')).some(face => face.status === 'loaded'))).toBe(true);
  expect(await computed(page, '#sample-paragraph', 'fontFamily')).toContain('UAW OpenDyslexic');
  await page.getByRole('button', { name: 'Increase Text Size', exact: true }).first().click();
  expect(parseFloat(await computed(page, '#sample-paragraph', 'fontSize'))).toBeCloseTo(parseFloat(baseline) * 1.1, 1);
  await page.getByRole('button', { name: 'Close Panel', exact: true }).click();
  await page.getByRole('button', { name: 'Add a new paragraph', exact: true }).click();
  await expect.poll(() => computed(page, '#dynamic-content p', 'fontSize').then(parseFloat)).toBeCloseTo(17.6, 1);
  expect(await page.evaluate(() => window.AccessibilityWidget.init() === window.AccessibilityWidget.init())).toBe(true);
  await expect(page.locator('universal-accessibility-widget')).toHaveCount(1);
  await page.evaluate(() => window.AccessibilityWidget.destroy());
  await expect(page.locator('universal-accessibility-widget')).toHaveCount(0);
  await expect(page.locator('[data-uaw-scope]')).toHaveCount(0);
  expect(await computed(page, '#sample-paragraph', 'fontSize')).toBe(baseline);
  expect(await computed(page, '#sample-paragraph', 'fontFamily')).toBe(originalFamily);
  expect(await page.locator('#sample-paragraph').getAttribute('style')).toContain('18px');
  expect(await page.locator('#dynamic-content p').getAttribute('style')).toBeNull();
});

test('storage failures do not prevent preferences from working', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); });
  await start(page);
  await page.getByRole('button', { name: 'Increase Text Size', exact: true }).first().click();
  expect((await settings(page)).fontScale).toBe(1.1);
  await expect(page.locator('[data-storage]')).toContainText('this visit');
});

test('axe audit of demo and open widget has no WCAG 2.2 AA violations', async ({ page }) => {
  test.setTimeout(90000);
  await start(page);
  let results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('switch', { name: 'Reading Mask', exact: true }).click();
  await page.getByRole('switch', { name: 'Magnifier / Zoom', exact: true }).click();
  results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('axe audits coordinated themes and color assistance on the host page', async ({ page }) => {
  test.setTimeout(90000);
  await start(page);
  await page.getByRole('button', { name: 'Close Panel', exact: true }).click();
  for (const theme of ['light','dark','contrast']) {
    await page.evaluate(theme => window.AccessibilityWidget.getInstance().setSettings({ theme, colorVisionMode: 'tritanopia' }), theme);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(results.violations, `${theme} theme`).toEqual([]);
  }
});
