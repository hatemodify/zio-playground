import { test, expect } from '@playwright/test';

test.describe('Arcade Games Flow', () => {
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

  test('should display arcade and learning game sections on games list page', async ({ page }) => {
    await page.goto('/games');
    await expect(page.getByText('놀이 게임')).toBeVisible();
    await expect(page.getByText('학습 게임')).toBeVisible();
  });

  test('should display arcade games in games list', async ({ page }) => {
    await page.goto('/games');
    await expect(page.getByText('두더지 잡기')).toBeVisible();
    await expect(page.getByText('별 잡기')).toBeVisible();
    await expect(page.getByText('빠른 손')).toBeVisible();
  });

  test('should start whack-a-mole game and show game UI', async ({ page }) => {
    await page.goto('/games/whack-a-mole');
    await expect(page.getByText('두더지 잡기')).toBeVisible();
    // Score display
    await expect(page.getByText('0점')).toBeVisible();
    // Timer display
    await expect(page.getByText(/\d+초/)).toBeVisible();
    // 3x3 grid of holes
    await expect(page.getByRole('button', { name: '구멍 1' })).toBeVisible();
    await expect(page.getByRole('button', { name: '구멍 9' })).toBeVisible();
  });

  test('should start catch-falling game and show game UI', async ({ page }) => {
    await page.goto('/games/catch-falling');
    await expect(page.getByText('별 잡기')).toBeVisible();
    // Score display
    await expect(page.getByText('0점')).toBeVisible();
    // Timer display
    await expect(page.getByText(/\d+초/)).toBeVisible();
  });

  test('should start tap-speed game and show game UI', async ({ page }) => {
    await page.goto('/games/tap-speed');
    await expect(page.getByText('빠른 손')).toBeVisible();
    // Timer display
    await expect(page.getByText(/\d+초/)).toBeVisible();
    // Big tap button
    await expect(page.getByRole('button', { name: '터치 버튼' })).toBeVisible();
  });

  test('should navigate from games list to whack-a-mole', async ({ page }) => {
    await page.goto('/games');
    await page.getByText('두더지 잡기').click();
    await expect(page).toHaveURL('/games/whack-a-mole');
  });

  test('should navigate from games list to catch-falling', async ({ page }) => {
    await page.goto('/games');
    await page.getByText('별 잡기').click();
    await expect(page).toHaveURL('/games/catch-falling');
  });

  test('should navigate from games list to tap-speed', async ({ page }) => {
    await page.goto('/games');
    await page.getByText('빠른 손').click();
    await expect(page).toHaveURL('/games/tap-speed');
  });
});
