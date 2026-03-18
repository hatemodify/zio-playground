import { test, expect } from '@playwright/test';

test.describe('Settings Flow', () => {
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

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('설정')).toBeVisible();
  });

  test('should show settings page content', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
