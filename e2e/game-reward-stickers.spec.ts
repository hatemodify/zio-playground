import { test, expect } from '@playwright/test';

test.describe('Game Reward & Sticker System', () => {
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

  test('should show reward celebration with game_complete type', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('/games/whack-a-mole');

    // Wait for game to complete (30s + buffer)
    await page.waitForTimeout(33000);

    // RewardCelebration should show "게임 클리어!" title
    await expect(page.getByText('게임 클리어!')).toBeVisible({ timeout: 5000 });

    // Should show stars
    const stars = page.locator('svg path[fill="#FFD93D"]');
    const starCount = await stars.count();
    expect(starCount).toBeGreaterThanOrEqual(1);

    // Should show "탭하여 계속하기" text
    await expect(page.getByText('탭하여 계속하기')).toBeVisible();
  });

  test('should dismiss reward celebration on click', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('/games/whack-a-mole');

    // Wait for game to complete
    await page.waitForTimeout(33000);

    // Reward should be visible
    await expect(page.getByText('게임 클리어!')).toBeVisible({ timeout: 5000 });

    // Click to dismiss (click the overlay)
    await page.locator('.fixed.inset-0').click();

    // After dismiss, should show the score result with buttons
    await expect(page.getByText('다시 하기')).toBeVisible();
    await expect(page.getByText('게임 목록')).toBeVisible();
  });

  test('should show game complete message in reward celebration', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('/games/whack-a-mole');

    // Wait for game to end (30s game + 1.5s transition)
    await page.waitForTimeout(33000);

    // Should show reward screen with default game complete message
    await expect(page.getByText('게임 클리어!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/게임을 완료했어요/)).toBeVisible();
  });

  test('should navigate to stickers page and see sticker collection', async ({ page }) => {
    await page.goto('/stickers');
    await expect(page.getByText('스티커북')).toBeVisible();

    // Should show collection count format
    await expect(page.getByText(/\d+\s*\/\s*\d+\s*수집/)).toBeVisible();

    // Should show milestone and character sticker sections
    await expect(page.getByText('마일스톤 스티커')).toBeVisible();
    await expect(page.getByText('글자 스티커')).toBeVisible();
  });

  test('should navigate from game completion back to games list', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('/games/whack-a-mole');
    await page.waitForTimeout(33000);

    // Dismiss reward
    await expect(page.getByText('게임 클리어!')).toBeVisible({ timeout: 5000 });
    await page.locator('.fixed.inset-0').click();

    // Click "게임 목록" button
    await page.getByText('게임 목록').click();

    // Should navigate to games list
    await expect(page.getByText('미니 게임')).toBeVisible();
  });
});
