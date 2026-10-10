import { expect, test } from '@playwright/test';

test('switches between Korean and English and keeps the choice after reload', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('kidsedu-settings')) return;
    localStorage.setItem('kidsedu-settings', JSON.stringify({
      state: { sfxEnabled: true, voiceEnabled: true, volume: 0.8, onboarded: true, language: 'ko' },
      version: 1,
    }));
  });

  await page.goto('/games');
  await expect(page.getByRole('heading', { name: '미니 게임' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(page.getByRole('heading', { name: 'Mini Games' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vehicle Mission Town' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/hangul');
  await expect(page.getByRole('heading', { name: 'Korean Play' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ㄱ - 기린' })).toBeVisible();

  await page.goto('/games');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mini Games' })).toBeVisible();
  await page.getByRole('button', { name: '한국어로 전환' }).click();
  await expect(page.getByRole('heading', { name: '미니 게임' })).toBeVisible();
  await expect(page.getByRole('button', { name: '출동! 탈것 마을' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
});
