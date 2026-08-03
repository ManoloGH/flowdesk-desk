import { test as setup } from '@playwright/test';

const BASE_URL  = process.env.FLOWDESK_URL    ?? 'http://localhost:3000';
const EMAIL     = process.env.FLOWDESK_EMAIL   ?? 'manolo@mentoriasystems.com';
const PASSWORD  = process.env.FLOWDESK_PASSWORD ?? '1234567890';

setup('autenticar sesión', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|home|team|agents)/, { timeout: 30_000 });
  await page.context().storageState({ path: 'tests/.auth/user.json' });
});
