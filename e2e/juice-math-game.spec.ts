import { test, expect, type Page } from '@playwright/test';

async function savedRecords(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification') ?? '{"state":{"gameRecords":[]}}').state.gameRecords);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 })));
});

async function startGame(page: Page, mode: '주스 만들기' | '동물 친구 빙고' = '주스 만들기', difficulty = '처음 해요') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games/juice-math');
  await page.getByRole('button', { name: mode }).click();
  await page.getByRole('button', { name: difficulty }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
}

/** Reads the visible equation, which is the only place the round's numbers are stated. */
async function readEquation(page: Page) {
  const label = (await page.getByRole('math').getAttribute('aria-label'))!;
  const [, a, op, b] = label.match(/^(\d+) (더하기|빼기) (\d+)/)!;
  return { a: Number(a), b: Number(b), plus: op === '더하기' };
}

/** Pours or removes the requested fruit, then names the total. */
async function serveOneJuice(page: Page) {
  const { a, b, plus } = await readEquation(page);
  const button = page.getByRole('button', { name: plus ? /넣기$/ : /덜어내기$/ });
  for (let step = 0; step < b; step++) await button.click();
  await page.getByRole('button', { name: `답 ${plus ? a + b : a - b}`, exact: true }).click();
}

async function answerOneBingo(page: Page) {
  const { a, b, plus } = await readEquation(page);
  await page.getByRole('group', { name: '빙고판' }).getByRole('button', { name: String(plus ? a + b : a - b), exact: true }).click();
}

test('juice mode: pouring then naming the total clears every order and saves one record', async ({ page }) => {
  test.setTimeout(60000);
  await startGame(page);
  for (let round = 0; round < 5; round++) {
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', String(round));
    await serveOneJuice(page);
  }
  await expect(page.getByRole('heading', { name: '주문을 모두 완성했어요!' })).toBeVisible();
  expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'juice-math', category: 'numbers', score: 5, stars: 3 });
  await page.getByRole('button', { name: '탭하여 계속하기' }).click();
  await page.getByRole('button', { name: '다시 놀기' }).click();
  await expect(page.getByRole('button', { name: '같이 시작하기' })).toBeVisible();
  expect(await savedRecords(page)).toHaveLength(1);
});

test('juice mode: the answer options stay closed until the blender holds the right amount', async ({ page }) => {
  await startGame(page);
  const { a, b, plus } = await readEquation(page);
  await expect(page.getByRole('group', { name: '답 고르기' })).toHaveCount(0);
  const button = page.getByRole('button', { name: plus ? /넣기$/ : /덜어내기$/ });
  for (let step = 0; step < b - 1; step++) await button.click();
  await expect(page.getByRole('group', { name: '답 고르기' })).toHaveCount(0);
  await button.click();
  await expect(page.getByRole('group', { name: '답 고르기' })).toBeVisible();
  // Easy level counts out loud, so the tally has to match the poured total.
  await expect(page.getByText(`지금 ${plus ? a + b : a - b}개`)).toBeVisible();
});

test('juice mode: a wrong total is refused, explained and still scoreable after the retry', async ({ page }) => {
  await startGame(page);
  const { a, b, plus } = await readEquation(page);
  const answer = plus ? a + b : a - b;
  const button = page.getByRole('button', { name: plus ? /넣기$/ : /덜어내기$/ });
  for (let step = 0; step < b; step++) await button.click();
  const wrong = page.getByRole('group', { name: '답 고르기' }).getByRole('button').filter({ hasNotText: String(answer) }).first();
  await wrong.click();
  await expect(page.getByRole('status')).toContainText('하나씩 세어');
  await expect(page.getByRole('group', { name: '답 고르기' })).toBeVisible();
  await page.getByRole('button', { name: `답 ${answer}`, exact: true }).click();
  // The round advanced, but a corrected answer earns no point.
  await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '1');
});

test('bingo mode: every problem seats an animal and the last one completes a line', async ({ page }) => {
  test.setTimeout(60000);
  await startGame(page, '동물 친구 빙고');
  const board = page.getByRole('group', { name: '빙고판' });
  await expect(board.getByRole('button')).toHaveCount(9);
  for (let round = 0; round < 5; round++) {
    await expect(board.getByRole('button', { name: /동물 친구가 앉았어요/ })).toHaveCount(round);
    await answerOneBingo(page);
  }
  await expect(page.getByRole('heading', { name: '빙고까지 완성했어요!' })).toBeVisible();
  expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'juice-math', score: 5, stars: 3 });
  // The finished board stays on screen so the winning line is actually seen.
  await expect(page.locator('.juice-tile-bingo')).toHaveCount(3);
  await expect(page.getByRole('img', { name: /에 앉은 동물 친구/ })).toHaveCount(5);
});

test('bingo mode: tapping the wrong number leaves the board untouched', async ({ page }) => {
  await startGame(page, '동물 친구 빙고');
  const board = page.getByRole('group', { name: '빙고판' });
  const { a, b, plus } = await readEquation(page);
  const wrong = board.getByRole('button').filter({ hasNotText: String(plus ? a + b : a - b) }).first();
  await wrong.click();
  await expect(page.getByRole('status')).toContainText('다시 세어 봐요');
  await expect(board.getByRole('button', { name: /동물 친구가 앉았어요/ })).toHaveCount(0);
});

test('the hardest juice level hides the blender while the total is answered', async ({ page }) => {
  await startGame(page, '주스 만들기', '자신 있어요');
  const { b, plus } = await readEquation(page);
  const button = page.getByRole('button', { name: plus ? /넣기$/ : /덜어내기$/ });
  for (let step = 0; step < b; step++) await button.click();
  await expect(page.getByText('윙~ 갈고 있어요!')).toBeVisible();
  await expect(page.getByRole('group', { name: '답 고르기' })).toBeVisible();
});

test('the catalog opens the juice shop and it fits a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games');
  await page.getByRole('button', { name: '또리의 주스 가게', exact: true }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await expect(page.getByRole('group', { name: '과일 넣고 덜기' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.locator('.juice-blender img, .juice-pour-button img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: '/tmp/edu-juice-math-mobile.png', fullPage: true });
});
