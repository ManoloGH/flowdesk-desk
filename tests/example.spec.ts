import { test, expect } from '@playwright/test';

test('scraping básico — título de página', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});

test('navegación y captura de texto', async ({ page }) => {
  await page.goto('https://example.com');
  const heading = await page.locator('h1').textContent();
  console.log('Título encontrado:', heading);
  expect(heading).toContain('Example Domain');
});

test('screenshot automático', async ({ page }) => {
  await page.goto('https://example.com');
  await page.screenshot({ path: 'tests/screenshots/example.png', fullPage: true });
});
