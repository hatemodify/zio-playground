import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 })));
});
async function records(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification')!).state.gameRecords);
}

for (const [category, count] of [['동물', 10], ['탈것', 8], ['자연', 8], ['음식', 7], ['장난감', 7]] as const) {
  test(`${category}: every illustrated page completes and preserves its artwork`, async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/games/coloring');
    await expect(page.getByText('40개의 컬러 도안')).toBeVisible();
    for (let index = 0; index < count; index++) {
      await page.getByRole('button', { name: `${category} 카테고리` }).click();
      const cards = page.locator('button[aria-label$="색칠하기"]');
      await expect(cards).toHaveCount(count);
      await expect(cards.nth(index).locator('img')).toHaveJSProperty('complete', true);
      await cards.nth(index).click();
      const regions = page.getByRole('group', { name: '작은 영역 칠하기' }).getByRole('button');
      const total = await regions.count();
      for (let region = 0; region < total; region++) {
        await page.locator('button[aria-label^="색상"]').nth(region % 8).click();
        await regions.nth(region).click();
      }
      await expect(page.getByRole('dialog', { name: '게임 클리어!' })).toBeVisible();
      await expect(page.locator('.finished-art svg')).toBeVisible();
      await page.getByRole('button', { name: '탭하여 계속하기' }).click();
      await expect(page.locator('.finished-art svg')).toBeVisible();
      await page.getByRole('button', { name: '다시 하기', exact: true }).click();
    }
    expect((await records(page)).filter((record: { gameId: string }) => record.gameId === 'coloring')).toHaveLength(count);
  });
}

test('drawing stamps support exact undo, redo and resize', async ({ page }) => {
  await page.goto('/games/free-draw');
  await page.getByRole('button', { name: '고양이 스탬프' }).click();
  const canvas = page.locator('canvas');
  const snapshot = () => canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
  const before = await snapshot();
  await canvas.click({ position: { x: 120, y: 140 } });
  const stamped = await snapshot(); expect(stamped).not.toBe(before);
  await page.getByRole('button', { name: '되돌리기', exact: true }).click(); expect(await snapshot()).toBe(before);
  await page.getByRole('button', { name: '다시 실행', exact: true }).click(); expect(await snapshot()).toBe(stamped);
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(page.getByRole('button', { name: '되돌리기', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '완성!', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect((await records(page))[0]).toMatchObject({ gameId: 'free-draw', category: 'play' });
});

for (const food of ['피자', '샌드위치', '팬케이크']) {
  test(`${food} has distinct orders, ingredient placement, undo and completion`, async ({ page }) => {
    await page.goto('/games/food-stack');
    await page.getByRole('button', { name: food, exact: true }).click();
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    for (let round = 0; round < 3; round++) {
      const rows = page.getByRole('region', { name: '주문서' }).locator('li');
      const labels = await rows.evaluateAll((items) => items.map((item) => item.querySelectorAll('span')[1].textContent!));
      expect(labels[0]).toBe(food === '피자' ? '피자 도우' : food === '샌드위치' ? '식빵' : '팬케이크');
      for (const label of labels) await page.getByRole('button', { name: `${label} 놓기`, exact: true }).click();
      await expect(page.getByRole('list', { name: '쌓은 재료' }).getByRole('listitem')).toHaveCount(labels.length);
      await page.getByRole('button', { name: '한 칸 되돌리기' }).click();
      await expect(page.getByRole('button', { name: '손님께 드리기' })).toBeDisabled();
      await page.getByRole('button', { name: `${labels.at(-1)} 놓기`, exact: true }).click();
      await page.getByRole('button', { name: '손님께 드리기' }).click();
    }
    await expect(page.getByRole('heading', { name: '3개의 주문을 모두 완성했어요!' })).toBeVisible();
    expect(await records(page)).toHaveLength(1);
    expect((await records(page))[0]).toMatchObject({ gameId: 'food-stack', score: 3 });
  });
}

async function enterFestival(page: Page) {
  await page.goto('/games/mini-festival');
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await page.getByRole('button', { name: '준비됐어요!' }).click();
}

test('festival three missions accept keyboard and touch, recover mistakes, award once and restart', async ({ page }) => {
  await enterFestival(page);
  const firstColor = await page.locator('.festival-balloon span').last().innerText();
  await page.getByRole('button', { name: `${firstColor === '빨강' ? '초록' : '빨강'} 버튼` }).click();
  await expect(page.getByRole('status')).toContainText('다시 봐요');
  for (let i = 0; i < 6; i++) {
    const color = await page.locator('.festival-balloon span').last().innerText();
    await page.keyboard.press(color === '빨강' ? 'a' : color === '초록' ? 's' : 'd');
  }
  await page.getByRole('button', { name: '다음 미니게임' }).click();
  await page.getByRole('button', { name: '준비됐어요!' }).click();
  for (let i = 0; i < 18; i++) await page.getByRole('button', { name: '초록 버튼' }).click();
  await page.getByRole('button', { name: '다음 미니게임' }).click();
  await page.getByRole('button', { name: '준비됐어요!' }).click();
  const sequence = await page.getByRole('group', { name: '무지개 암호 순서' }).locator('small').allTextContents();
  for (const color of sequence) await page.getByRole('button', { name: `${color} 버튼` }).click();
  await expect(page.getByRole('heading', { name: '미니게임 축제 완료!' })).toBeVisible();
  expect(await records(page)).toHaveLength(1);
  expect((await records(page))[0]).toMatchObject({ gameId: 'mini-festival', category: 'play', score: 3, stars: 3 });
  await page.getByRole('button', { name: '탭하여 계속하기' }).click();
  await page.getByRole('button', { name: '다시 도전하기' }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await expect(page.getByRole('heading', { name: '톡톡! 색깔 풍선' })).toBeVisible();
  expect(await records(page)).toHaveLength(1);
});

test('festival timer pauses, held keys do not repeat, and timeouts still finish', async ({ page }) => {
  await page.clock.install();
  await enterFestival(page);
  await page.getByRole('button', { name: '잠깐 쉬기' }).click();
  await page.clock.runFor(35000);
  await expect(page.getByLabel('남은 시간')).toHaveText('30초');
  await page.getByRole('button', { name: '이어서 하기' }).click();
  await page.clock.runFor(31000);
  await expect(page.getByText('좋은 도전이었어요!')).toBeVisible();
  for (let round = 1; round < 3; round++) {
    await page.getByRole('button', { name: '다음 미니게임' }).click();
    await page.getByRole('button', { name: '준비됐어요!' }).click();
    if (round === 1) {
      await page.keyboard.down('a'); await page.keyboard.down('a'); await page.keyboard.up('a');
      await expect(page.getByLabel('미션 진행')).toHaveAttribute('value', '1');
    }
    await page.clock.runFor(31000);
  }
  await expect(page.getByRole('heading', { name: '미니게임 축제 완료!' })).toBeVisible();
  expect((await records(page))[0]).toMatchObject({ gameId: 'mini-festival', score: 0 });
});

test('mobile layouts stay inside the viewport and reduced motion hides celebration rays', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['coloring', 'food-stack', 'mini-festival']) {
    await page.goto(`/games/${route}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
  await page.goto('/games/coloring');
  await page.getByRole('button', { name: '물고기 색칠하기' }).click();
  const buttons = page.getByRole('group', { name: '작은 영역 칠하기' }).getByRole('button');
  for (let i = 0, length = await buttons.count(); i < length; i++) await buttons.nth(i).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.celebration-rays')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
