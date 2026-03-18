import { test, expect } from '@playwright/test';

test.describe('Coloring Sketches Flow', () => {
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

  test('should display sketch category tabs on coloring game page', async ({ page }) => {
    await page.goto('/games/coloring');
    await expect(page.getByText('색칠하기')).toBeVisible();
    await expect(page.getByText('그림을 골라봐!')).toBeVisible();

    // Verify all 4 category tabs are visible
    await expect(page.getByRole('button', { name: /동물 카테고리/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /탈것 카테고리/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /자연 카테고리/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /기타 카테고리/ })).toBeVisible();
  });

  test('should display sketch thumbnails in grid', async ({ page }) => {
    await page.goto('/games/coloring');
    await expect(page.getByText('색칠하기')).toBeVisible();

    // Default category is animals - should see animal sketches
    const sketchButtons = page.locator('button[aria-label$="색칠하기"]');
    await expect(sketchButtons.first()).toBeVisible();
    const count = await sketchButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should switch sketch categories', async ({ page }) => {
    await page.goto('/games/coloring');
    await expect(page.getByText('색칠하기')).toBeVisible();

    // Click vehicles category
    await page.getByRole('button', { name: /탈것 카테고리/ }).click();

    // Should see vehicle sketch buttons
    const sketchButtons = page.locator('button[aria-label$="색칠하기"]');
    await expect(sketchButtons.first()).toBeVisible();
  });

  test('should start coloring game when sketch is selected', async ({ page }) => {
    await page.goto('/games/coloring');
    await expect(page.getByText('색칠하기')).toBeVisible();

    // Click the first sketch to start game
    const firstSketch = page.locator('button[aria-label$="색칠하기"]').first();
    await firstSketch.click();

    // Should show the canvas drawing view
    await expect(page.locator('canvas')).toBeVisible();

    // Should show back button and color palette
    await expect(page.getByRole('button', { name: '다른 그림 선택' })).toBeVisible();
    await expect(page.getByText('0%')).toBeVisible();

    // Should show color palette buttons
    const colorButtons = page.locator('button[aria-label^="색상"]');
    const colorCount = await colorButtons.count();
    expect(colorCount).toBe(8);
  });

  test('should navigate back to sketch picker', async ({ page }) => {
    await page.goto('/games/coloring');
    await expect(page.getByText('색칠하기')).toBeVisible();

    // Select a sketch
    const firstSketch = page.locator('button[aria-label$="색칠하기"]').first();
    await firstSketch.click();

    // Click back button
    await page.getByRole('button', { name: '다른 그림 선택' }).click();

    // Should go back to picker
    await expect(page.getByText('그림을 골라봐!')).toBeVisible();
  });

  test('should show mascot with encouraging message', async ({ page }) => {
    await page.goto('/games/coloring');
    await expect(page.getByText('어떤 그림을 칠해볼까?')).toBeVisible();
  });
});
