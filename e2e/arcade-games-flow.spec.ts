import { test, expect } from '@playwright/test';

test.describe('Arcade Games Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'kidsedu-settings',
        JSON.stringify({
          state: { sfxEnabled: true, volume: 0.8, onboarded: true },
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
    await expect(page.getByText('반짝 우주 비행')).toBeVisible();
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

  test('should navigate from games list to whack-a-mole', async ({ page }) => {
    await page.goto('/games');
    await page.getByText('두더지 잡기').click();
    await expect(page).toHaveURL('/games/whack-a-mole');
  });

  // Retired games keep their paths so cached shells and old links still land
  // somewhere useful instead of on a blank route.
  for (const retired of ['tap-speed', 'tracing-race', 'addition', 'bubble',
    'pattern', 'number-order', 'counting', 'catch-falling']) {
    test(`retired game /games/${retired} redirects to the catalog`, async ({ page }) => {
      await page.goto(`/games/${retired}`);
      await expect(page).toHaveURL('/games');
      await expect(page.getByRole('heading', { name: '미니 게임' })).toBeVisible();
    });
  }
});
