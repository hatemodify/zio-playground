import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false, voiceEnabled: false }, version: 1 })));
});

/** Scribbles something on the tracing sheet so 확인 becomes available. */
async function write(page: Page) {
  const canvas = page.locator('canvas').last();
  await canvas.waitFor();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 120, { steps: 5 });
  await page.mouse.up();
}

test('/shapes lists the eight shapes and lights up the 도형 tab', async ({ page }) => {
  await page.goto('/shapes');
  await expect(page.getByRole('heading', { name: '도형 놀이' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^(동그라미|세모|네모|긴네모|별|하트|마름모|타원) - / })).toHaveCount(8);
  await expect(page.getByRole('navigation', { name: '메인 네비게이션' }).getByRole('button', { name: '도형' })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: /^세모 - / }).click();
  await expect(page).toHaveURL('/shapes/triangle');
});

test('/shapes/triangle teaches 세모 with everyday things and a tracing sheet', async ({ page }) => {
  await page.goto('/shapes/triangle');
  await expect(page.getByRole('heading', { name: '세모' })).toBeVisible();
  await expect(page.getByText('꼭짓점 3개')).toBeVisible();
  const everyday = page.getByRole('region', { name: '생활 속에서 찾기' });
  await expect(everyday.getByRole('img', { name: '텐트' })).toBeVisible();
  await expect(everyday.getByRole('img', { name: '피자' })).toBeVisible();
  await expect(everyday.getByRole('img', { name: '트리' })).toBeVisible();
  await expect(page.locator('canvas').last()).toBeVisible();
  // Shapes trace a dashed outline from their stroke data, so 획순 is offered too.
  await expect(page.getByRole('button', { name: '획순 보기' })).toBeVisible();
});

test('tracing a shape and closing the praise moves on to the next shape', async ({ page }) => {
  await page.goto('/shapes/triangle');
  await write(page);
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await page.getByText('잘했어!', { exact: true }).click();
  await expect(page).toHaveURL('/shapes/square');
  await expect(page.getByRole('heading', { name: '네모' })).toBeVisible();
  // The sheet is fresh, and the list now marks 세모 as done.
  await expect(page.getByRole('button', { name: '확인', exact: true })).toHaveCount(0);
  await page.goto('/shapes');
  await expect(page.getByRole('button', { name: /^세모 - .*\(완료\)$/ })).toBeVisible();
});

test('the back button from a shape lands on the shapes list', async ({ page }) => {
  await page.goto('/shapes/circle');
  await page.getByRole('button', { name: '뒤로 가기' }).click();
  await expect(page).toHaveURL('/shapes');
});

test('도형 탐험대: picking the right shape, thing, and piece every time earns the reward', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games/shape-explorer');
  await expect(page.getByRole('heading', { name: '도형 탐험을 떠나요!' })).toBeVisible();
  await page.getByRole('button', { name: '처음 해요' }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '0');

  const done = page.getByRole('heading', { name: '도형 탐험을 모두 마쳤어요!' });
  // 6 rounds; the two picture-building rounds need one tap per piece.
  for (let taps = 0; taps < 30 && !(await done.isVisible()); taps++) {
    await page.locator('[data-correct="true"]').first().click();
  }
  await expect(done).toBeVisible();
  await expect(page.getByText('6번의 탐험 가운데 6번을 한 번에 해냈어요.')).toBeVisible();
  await page.getByRole('button', { name: '탭하여 계속하기' }).click();
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification') ?? '{"state":{"gameRecords":[]}}').state.gameRecords);
  expect(records[0]).toMatchObject({ gameId: 'shape-explorer', category: 'shapes', score: 6, stars: 3 });
  await page.getByRole('button', { name: '다시 놀기' }).click();
  await expect(page.getByRole('button', { name: '같이 시작하기' })).toBeVisible();
});

test('도형 탐험대: a wrong piece shakes and keeps the slot open, the right one fills it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games/shape-explorer');
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  // Rounds cycle 도형 고르기 → 생활 속 도형 → 도형 그림 만들기.
  await page.locator('[data-correct="true"]').first().click();
  await page.locator('[data-correct="true"]').first().click();
  const board = page.getByRole('img', { name: /그림, 조각 0\// });
  await expect(board).toBeVisible();
  const slots = page.locator('.shape-slot');
  const slotCount = await slots.count();
  expect(slotCount).toBeGreaterThanOrEqual(2);

  const palette = page.getByRole('group', { name: '도형 조각' });
  await palette.locator('button:not([data-correct="true"])').first().click();
  await expect(page.getByRole('status')).toContainText('맞지 않아요');
  await expect(slots.first()).toHaveAttribute('data-slot-state', 'active');

  await palette.locator('[data-correct="true"]').click();
  await expect(slots.first()).toHaveAttribute('data-slot-state', 'filled');
  await expect(page.getByRole('img', { name: /그림, 조각 1\// })).toBeVisible();
});
