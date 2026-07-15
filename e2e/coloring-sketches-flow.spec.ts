import { test, expect, type Page } from '@playwright/test';

test.describe('Coloring (tap-to-fill) Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'kidsedu-settings',
        JSON.stringify({
          state: { sfxEnabled: false, volume: 0.8, onboarded: true, dailyTimeLimit: 30 },
          version: 1,
        })
      );
    });
  });

  async function openFirstPage(page: Page): Promise<void> {
    await page.goto('/games/coloring');
    await expect(page.getByText('색칠하기')).toBeVisible();
    await page.locator('button[aria-label$="색칠하기"]').first().click();
    await expect(page.locator('svg path[role="button"]').first()).toBeVisible();
  }

  test('shows the four category tabs and page thumbnails', async ({ page }) => {
    await page.goto('/games/coloring');
    await expect(page.getByText('그림을 골라봐!')).toBeVisible();

    await expect(page.getByRole('button', { name: /동물 카테고리/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /탈것 카테고리/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /자연 카테고리/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /기타 카테고리/ })).toBeVisible();

    const thumbnails = page.locator('button[aria-label$="색칠하기"]');
    expect(await thumbnails.count()).toBeGreaterThan(0);
  });

  test('starts a coloring page with fillable regions and 8 colors', async ({ page }) => {
    await openFirstPage(page);

    await expect(page.getByRole('button', { name: '다른 그림 선택' })).toBeVisible();

    // Colorable regions are tappable SVG paths.
    const regions = page.locator('svg path[role="button"]');
    expect(await regions.count()).toBeGreaterThan(0);

    // Progress starts at 0 filled.
    await expect(page.getByText(/^0\/\d+$/)).toBeVisible();

    const colors = page.locator('button[aria-label^="색상"]');
    expect(await colors.count()).toBe(8);
  });

  test('tapping a region fills it, and undo reverts it', async ({ page }) => {
    await openFirstPage(page);

    const firstRegion = page.locator('svg path[role="button"]').first();
    const fillBefore = await firstRegion.getAttribute('fill');

    await firstRegion.click();
    const fillAfter = await firstRegion.getAttribute('fill');
    expect(fillAfter).not.toBe(fillBefore);
    // Progress advanced past 0.
    await expect(page.getByText(/^0\/\d+$/)).toHaveCount(0);

    const undo = page.getByRole('button', { name: '되돌리기' });
    await expect(undo).toBeEnabled();
    await undo.click();
    expect(await firstRegion.getAttribute('fill')).toBe(fillBefore);
  });

  test('filling every region completes the picture', async ({ page }) => {
    await openFirstPage(page);

    const regions = page.locator('svg path[role="button"]');
    const count = await regions.count();
    for (let i = 0; i < count; i += 1) {
      await regions.nth(i).click();
    }

    // Completing all regions rolls into the reward screen.
    await expect(page.getByRole('button', { name: '게임 목록' })).toBeVisible({ timeout: 6000 });
  });

  test('can go back to the picker', async ({ page }) => {
    await openFirstPage(page);
    await page.getByRole('button', { name: '다른 그림 선택' }).click();
    await expect(page.getByText('그림을 골라봐!')).toBeVisible();
  });
});
