import { test, expect } from '@playwright/test';

test.describe('New Games Flow', () => {
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

  test('should start counting game', async ({ page }) => {
    await page.goto('/games/counting');
    await expect(page.getByText('숫자 세기')).toBeVisible();
  });

  test('should start tracing race game', async ({ page }) => {
    await page.goto('/games/tracing-race');
    await expect(page.getByText('따라쓰기 경주')).toBeVisible();
  });

  test('should start puzzle game', async ({ page }) => {
    await page.goto('/games/puzzle');
    await expect(page.getByText('퍼즐 맞추기')).toBeVisible();
  });

  test('should start connect dots game', async ({ page }) => {
    await page.goto('/games/connect-dots');
    await expect(page.getByText('점 잇기')).toBeVisible();
  });

  test('should list new games on games list page', async ({ page }) => {
    await page.goto('/games');
    await expect(page.getByText('숫자 세기')).toBeVisible();
    await expect(page.getByText('따라쓰기 경주')).toBeVisible();
    await expect(page.getByText('퍼즐 맞추기')).toBeVisible();
    await expect(page.getByText('점 잇기')).toBeVisible();
  });
});
