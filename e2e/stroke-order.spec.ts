import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 })));
});

/** Ink on the guide layer — the faint character alone leaves very little. */
async function guideInk(page: Page) {
  return page.locator('canvas').first().evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let index = 3; index < data.length; index += 4) if (data[index] > 40) painted += 1;
    return painted;
  });
}

for (const [label, path] of [['한글 자음 ㄱ', '/hangul/ㄱ'], ['숫자 1', '/numbers/1'], ['영어 A', '/english/A']] as const) {
  test(`${label}: 획순 replays the strokes in order and can be hidden again`, async ({ page }) => {
    await page.goto(path);
    const button = page.getByRole('button', { name: '획순 보기' });
    await expect(button).toBeVisible();

    const before = await guideInk(page);
    await button.click();
    await expect(page.getByRole('button', { name: '획순 숨기기' })).toBeVisible();
    await expect.poll(() => guideInk(page), { timeout: 5000 }).toBeGreaterThan(before * 2 + 500);

    await page.getByRole('button', { name: '획순 숨기기' }).click();
    await expect(button).toBeVisible();
    await expect.poll(() => guideInk(page)).toBeLessThanOrEqual(before);
  });
}

test('composed syllables have no stroke data, so they offer no 획순 button', async ({ page }) => {
  await page.goto('/hangul/가');
  await expect(page.getByRole('button', { name: '지우기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '획순 보기' })).toHaveCount(0);
});

test('the stroke guide sits under the writing and never blocks completing a letter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/hangul/ㄴ');
  await page.getByRole('button', { name: '획순 보기' }).click();
  const canvas = page.locator('canvas').last();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 60, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + 200, { steps: 5 });
  await page.mouse.move(box.x + 220, box.y + 200, { steps: 5 });
  await page.mouse.up();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByText('잘했어!', { exact: true })).toBeVisible();
  await expect(page.getByTestId('confetti-shower')).toBeVisible();
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-progress')!).state.items);
  expect(items['hangul-ㄴ'].completed).toBe(true);
});

test('moving to the next letter resets the reveal', async ({ page }) => {
  await page.goto('/hangul/ㄱ');
  await page.getByRole('button', { name: '획순 보기' }).click();
  await expect(page.getByRole('button', { name: '획순 숨기기' })).toBeVisible();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByRole('button', { name: '획순 보기' })).toBeVisible();
});

for (const [theme, picture] of [['boy', 'light-plane'], ['girl', 'fox']] as const) {
  test(`English C completion shows the earned ${theme} sticker artwork`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((stickerTheme) => localStorage.setItem('kidsedu-settings', JSON.stringify({
      state: { onboarded: true, sfxEnabled: false, stickerBookTheme: stickerTheme }, version: 1,
    })), theme);
    await page.goto('/english/C');
    const canvas = page.locator('canvas').last();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200, { steps: 8 });
    await page.mouse.up();
    await page.getByRole('button', { name: '확인', exact: true }).click();

    const earned = page.getByTestId('earned-stickers');
    await expect(earned).toBeVisible();
    const image = earned.getByRole('img', { name: 'C' });
    await expect(image).toHaveAttribute('src', new RegExp(`${picture}\\.svg$`));
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  });
}

test('repeating an already completed letter does not announce a new sticker', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kidsedu-progress', JSON.stringify({ state: {
      items: { 'english-C': { id: 'english-C', category: 'english', character: 'C', tracingStage: 3, completed: true, attempts: 1, bestScore: 100, lastPracticedAt: null } },
    }, version: 1 }));
    localStorage.setItem('kidsedu-gamification', JSON.stringify({ state: {
      totalStars: 3, level: 1, streak: 0, lastLoginDate: '', stickers: ['sticker-learn-english-C'], unlockedGames: [], characterOutfits: [], gameRecords: [],
    }, version: 1 }));
  });
  await page.goto('/english/C');
  const box = (await page.locator('canvas').last().boundingBox())!;
  await page.mouse.move(box.x + 50, box.y + 50);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 200, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('button', { name: '확인', exact: true }).click();

  await expect(page.getByText('한 번 더 멋지게 연습했어요!')).toBeVisible();
  await expect(page.getByTestId('earned-stickers')).toHaveCount(0);
});
