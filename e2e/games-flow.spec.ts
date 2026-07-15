import { test, expect } from '@playwright/test';

test.describe('Games Flow', () => {
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

  test('should navigate to games list from bottom nav', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByText('게임').click();
    await expect(page).toHaveURL('/games');
  });

  test('should display available games on games list page', async ({ page }) => {
    await page.goto('/games');
    await expect(page.getByText('미니 게임')).toBeVisible();
    await expect(page.getByText('글자-이미지 매칭')).toBeVisible();
    await expect(page.getByText('순서 맞추기')).toBeVisible();
  });

  test('should start matching game', async ({ page }) => {
    await page.goto('/games/matching');
    await expect(page.getByText('글자-이미지 매칭')).toBeVisible();
    await expect(page.locator('button').first()).toBeVisible();
  });

  test('should start sorting game', async ({ page }) => {
    await page.goto('/games/sorting');
    await expect(page.getByText('순서 맞추기')).toBeVisible();
  });

  test('should start balloon game', async ({ page }) => {
    await page.goto('/games/balloon');
    await expect(page.getByText('풍선 터뜨리기')).toBeVisible();
  });

  test('should start coloring game', async ({ page }) => {
    await page.goto('/games/coloring');
    await expect(page.getByText('색칠하기')).toBeVisible();
  });

  test('should show bottom navigation on games page', async ({ page }) => {
    await page.goto('/games');
    await expect(page.locator('nav')).toBeVisible();
  });
});
