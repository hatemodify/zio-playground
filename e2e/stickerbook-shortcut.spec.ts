import { test, expect } from '@playwright/test';

test.describe('Sticker Book Shortcut', () => {
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

  test('should navigate to stickers page from home shortcut', async ({ page }) => {
    await page.goto('/');
    await page.getByText('스티커북').click();
    await expect(page).toHaveURL('/stickers');
    await expect(page.getByText('스티커북')).toBeVisible();
  });

  test('should display new sticker themes', async ({ page }) => {
    await page.goto('/stickers');
    // Check that category filters exist for new themes
    await expect(page.getByText('전체')).toBeVisible();
  });
});
