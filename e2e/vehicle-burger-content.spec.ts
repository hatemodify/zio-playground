import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 })));
});

for (const [difficulty, rounds] of [['처음 해요', 3], ['할 수 있어요', 4], ['자신 있어요', 5]] as const) {
  test(`burger orders build bottom-up, recover errors and save once: ${difficulty}`, async ({ page }) => {
    await page.goto('/games/food-stack');
    await page.getByRole('button', { name: '햄버거', exact: true }).click();
    await page.getByRole('button', { name: difficulty }).click();
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    for (let round = 0; round < rounds; round++) {
      await expect(page.getByText(`${round + 1} / ${rounds} 주문`, { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '손님께 드리기' })).toBeDisabled();
      const order = page.getByRole('region', { name: '주문서' }).locator('li');
      const labels = await order.evaluateAll((rows) => rows.map((row) => row.querySelectorAll('span')[1].textContent!));
      expect(labels[0]).toBe('아랫빵'); expect(labels.at(-1)).toBe('윗빵');
      if (round === 0) {
        await page.getByRole('button', { name: '윗빵 놓기', exact: true }).click();
        await expect(page.getByRole('status')).toContainText('차례는 아직이에요');
        await expect(page.getByRole('list', { name: '쌓은 재료' }).getByRole('listitem')).toHaveCount(0);
      }
      for (let i = 0; i < labels.length; i++) {
        await page.getByRole('button', { name: `${labels[i]} 놓기`, exact: true }).click();
        await expect(page.getByRole('list', { name: '쌓은 재료' }).getByRole('listitem').nth(i)).toHaveAttribute('aria-label', `${i + 1}번째 ${labels[i]}`);
      }
      // Undo reopens the ingredient tray, including the final bun.
      await page.getByRole('button', { name: '한 칸 되돌리기', exact: true }).click();
      await expect(page.getByRole('button', { name: '손님께 드리기' })).toBeDisabled();
      await page.getByRole('button', { name: '윗빵 놓기', exact: true }).click();
      await page.getByRole('button', { name: '손님께 드리기' }).click();
    }
    await expect(page.getByRole('heading', { name: `${rounds}개의 주문을 모두 완성했어요!` })).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification')!).state);
    expect(saved.gameRecords).toHaveLength(1);
    expect(saved.gameRecords[0]).toMatchObject({ gameId: 'food-stack', score: rounds - 1, category: 'discovery' });
    await page.getByText('탭하여 계속하기').click();
    await page.getByRole('button', { name: '다시 요리하기' }).click();
    await expect(page.getByRole('button', { name: '같이 시작하기' })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification')!).state.gameRecords.length)).toBe(1);
  });
}

test('creative burger supports any recipe, undo and the ten-layer limit', async ({ page }) => {
  await page.goto('/games/food-stack');
    await page.getByRole('button', { name: '햄버거', exact: true }).click();
  await page.getByRole('button', { name: '내 마음대로 만들기' }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await expect(page.getByRole('button', { name: '내 음식 완성' })).toBeDisabled();
  for (let i = 0; i < 10; i++) await page.getByRole('button', { name: '치즈 놓기', exact: true }).click();
  await expect(page.getByRole('button', { name: '치즈 놓기', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '한 칸 되돌리기' }).click();
  await page.getByRole('button', { name: '윗빵 놓기' }).click();
  await page.getByRole('button', { name: '내 음식 완성' }).click();
  await expect(page.getByRole('heading', { name: '나만의 음식이 완성됐어요!' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification')!).state);
  expect(saved.gameRecords).toHaveLength(1);
  expect(saved.gameRecords[0]).toMatchObject({ gameId: 'food-stack', score: 1, category: 'play', stars: 3 });
});

test('vehicle missions give job feedback, recover errors and complete all rounds', async ({ page }) => {
  await page.goto('/games/vehicle-missions');
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  for (let i = 0; i < 6; i++) {
    const source = await page.locator('section img').getAttribute('src');
    const choices = page.getByLabel('출동할 탈것').getByRole('button');
    if (i === 0) {
      await choices.filter({ hasNot: page.locator(`img[src="${source}"]`) }).click();
      await expect(page.getByRole('status')).toContainText('맡은 일을 다시 살펴봐요');
    }
    const correct = choices.filter({ has: page.locator(`img[src="${source}"]`) });
    const name = (await correct.innerText()).trim();
    await correct.click();
    await expect(page.getByRole('status')).toContainText(name);
    await page.getByRole('button', { name: i === 5 ? '탐험 마치기' : '다음 탐험', exact: true }).click();
  }
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification')!).state.gameRecords);
  expect(saved).toHaveLength(1); expect(saved[0]).toMatchObject({ gameId: 'vehicle-missions', score: 5, category: 'discovery' });
});

test('vehicle playground saves mixed art and the construction scene across reload', async ({ page }) => {
  await page.goto('/games/animal-playground');
  await page.getByRole('button', { name: '1번 자리 비어 있음', exact: true }).click();
  await page.getByRole('button', { name: '경찰차', exact: true }).click();
  await page.getByRole('button', { name: '2번 자리 비어 있음', exact: true }).click();
  await page.getByRole('button', { name: '동물 20종', exact: true }).click();
  await page.getByRole('button', { name: '3번 자리 비어 있음', exact: true }).click();
  await page.getByRole('button', { name: '공사장', exact: true }).click();
  await page.reload();
  for (const label of ['1번 자리 굴착기', '2번 자리 경찰차', '3번 자리 토끼']) await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '공사장', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('sticker book uses matching illustrations and every local SVG decodes', async ({ page }) => {
  await page.goto('/stickers');
  for (const [label, file] of [['경찰차', 'police-car'], ['포크레인', 'excavator'], ['불도저', 'bulldozer'], ['콘크리트믹서', 'cement-mixer'], ['잠수함', 'submarine']] as const) {
    await expect(page.getByRole('button', { name: label, exact: true }).locator('img')).toHaveAttribute('src', `/assets/illustrations/${file}.svg`);
  }
  const paths = readdirSync('public/assets/illustrations').filter((file) => file.endsWith('.svg')).map((file) => `/assets/illustrations/${file}`);
  const results = await page.evaluate(async (paths) => Promise.all(paths.map(async (src) => {
    const image = new Image(); image.src = src;
    try { await image.decode(); return image.naturalWidth > 0 ? null : src; } catch { return src; }
  })), paths);
  expect(results.filter(Boolean)).toEqual([]);
  await page.getByRole('button', { name: '포크레인', exact: true }).click();
  await expect(page.locator('img[src="/assets/illustrations/excavator.svg"]').last()).toHaveClass(/w-48/);
});

test('vehicle and animal themes are selectable for word and pattern games', async ({ page }) => {
  for (const route of ['picture-words', 'pattern-garden']) {
    await page.goto(`/games/${route}`);
    await expect(page.getByRole('group', { name: '그림 주제' }).getByRole('button', { name: '탈것', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('group', { name: '그림 주제' }).getByRole('button', { name: '동물', exact: true }).click();
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    await expect(page.locator('.scene-meadow img').first()).toHaveAttribute('src', /\/kenney\/animals\//);
  }
});
