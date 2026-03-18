import { test, expect } from '@playwright/test';

test.describe('Vehicle Stickers Theme Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'kidsedu-settings',
        JSON.stringify({
          state: { sfxEnabled: true, ttsSpeed: 1, volume: 0.8, onboarded: true, dailyTimeLimit: 30 },
          version: 1,
        })
      );
    });
  });

  test('should display sticker categories with vehicle theme', async ({ page }) => {
    await page.goto('/stickers');
    await expect(page.getByText('스티커북')).toBeVisible();
    await expect(page.getByText('마일스톤 스티커')).toBeVisible();
    await expect(page.getByText('글자 스티커')).toBeVisible();
  });

  test('should filter sticker categories', async ({ page }) => {
    await page.goto('/stickers');
    const main = page.getByRole('main');
    // Category filter buttons (inside main content area)
    await expect(main.getByRole('button', { name: '전체' })).toBeVisible();
    await expect(main.getByRole('button', { name: '숫자', exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: '한글', exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: '영어', exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: '특별' })).toBeVisible();

    // Click on '숫자' filter
    await main.getByRole('button', { name: '숫자', exact: true }).click();
    // Should still show sticker sections
    await expect(page.getByText('글자 스티커')).toBeVisible();
  });

  test('should show sticker collection progress', async ({ page }) => {
    await page.goto('/stickers');
    await expect(page.getByText(/\d+\s*\/\s*\d+\s*수집/)).toBeVisible();
  });
});
