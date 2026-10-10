import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('sticker-test-initialized')) return;
    sessionStorage.setItem('sticker-test-initialized', '1');
    localStorage.setItem('kidsedu-settings', JSON.stringify({
      state: { sfxEnabled: false, voiceEnabled: false, volume: 0.8, onboarded: true, language: 'ko' },
      version: 1,
    }));
    localStorage.setItem('kidsedu-gamification', JSON.stringify({
      state: { totalStars: 0, level: 1, streak: 0, lastLoginDate: '', stickers: ['sticker-num-puppy'], unlockedGames: [], characterOutfits: [], gameRecords: [] },
      version: 1,
    }));
  });
});

test('switches the sticker artwork while keeping earned rewards', async ({ page }) => {
  await page.goto('/stickers');
  const owned = page.getByText(/1\s*\/\s*\d+\s*수집/);
  await expect(owned).toBeVisible();
  await expect(page.getByRole('button', { name: /경찰차/ }).locator('img')).toHaveAttribute('src', /police-car/);

  await page.getByRole('button', { name: /여아용/ }).click();
  await expect(page.getByRole('button', { name: /강아지/ }).locator('img')).toHaveAttribute('src', /animals\/dog\.png/);
  await expect(owned).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /여아용/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(owned).toBeVisible();
});

test('offers the sticker choice on the home screen for existing profiles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: '스티커북 선택' })).toBeVisible();
  await page.getByRole('button', { name: /여아용 · 동물/ }).click();
  await expect(page.getByRole('region', { name: '스티커북 선택' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('region', { name: '스티커북 선택' })).toHaveCount(0);
  await page.goto('/stickers');
  await expect(page.getByRole('button', { name: /여아용/ })).toHaveAttribute('aria-pressed', 'true');
});

test('adds four animals as tap-to-fill coloring pages', async ({ page }) => {
  await page.goto('/games/coloring');
  for (const animal of ['돼지', '기린', '소', '코끼리']) {
    await page.getByRole('button', { name: `${animal} 색칠하기` }).click();
    const region = page.locator('svg path[role="button"]').first();
    await expect(region).toBeVisible();
    await region.press('Enter');
    await expect(region).not.toHaveAttribute('fill', '#FFFDF8');
    await page.getByRole('button', { name: '다른 그림 선택' }).click();
  }
  await page.getByRole('button', { name: /특별 카테고리/ }).click();
  await expect(page.getByRole('button', { name: '엘사 눈꽃 색칠하기' })).toBeVisible();
});
