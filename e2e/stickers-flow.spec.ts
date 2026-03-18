import { test, expect } from '@playwright/test';

test.describe('Stickers Flow', () => {
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

  test('should navigate to stickers page', async ({ page }) => {
    await page.goto('/stickers');
    await expect(page.getByText('스티커북')).toBeVisible();
  });

  test('should display sticker categories', async ({ page }) => {
    await page.goto('/stickers');
    await expect(page.getByText('전체')).toBeVisible();
    await expect(page.getByText('특별')).toBeVisible();
  });

  test('should show milestone and character stickers', async ({ page }) => {
    await page.goto('/stickers');
    await expect(page.getByText('마일스톤 스티커')).toBeVisible();
    await expect(page.getByText('글자 스티커')).toBeVisible();
  });

  test('should show sticker collection count', async ({ page }) => {
    await page.goto('/stickers');
    // The header shows "X / Y 수집" format
    await expect(page.getByText(/\d+\s*\/\s*\d+\s*수집/)).toBeVisible();
  });
});
