import { test, expect } from '@playwright/test';

test.describe('Learning Flow', () => {
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

  test('should navigate from home to numbers list', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('숫자')).toBeVisible();
    await page.locator('text=숫자').first().click();
    await expect(page).toHaveURL('/numbers');
  });

  test('should display number items in list page', async ({ page }) => {
    await page.goto('/numbers');
    await expect(page.getByText('1').first()).toBeVisible();
    await expect(page.getByText('2').first()).toBeVisible();
  });

  test('should navigate to number detail and show learning content', async ({ page }) => {
    await page.goto('/numbers/1');
    await expect(page.locator('text=1').first()).toBeVisible();
    await expect(page.getByText('따라 쓰기')).toBeVisible();
  });

  test('should navigate from home to hangul list', async ({ page }) => {
    await page.goto('/');
    await page.locator('text=한글').first().click();
    await expect(page).toHaveURL('/hangul');
  });

  test('should navigate from home to english list', async ({ page }) => {
    await page.goto('/');
    await page.locator('text=영어').first().click();
    await expect(page).toHaveURL('/english');
  });

  test('should navigate between learn pages with next/prev', async ({ page }) => {
    await page.goto('/numbers/1');
    const nextButton = page.getByText('다음').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      await expect(page.url()).not.toContain('/numbers/1');
    }
  });

  test('should show bottom navigation on main pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
  });
});
