import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false, voiceEnabled: false }, version: 1 }));
  });
});
async function gameState(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification')!).state);
}
const START = { name: '같이 시작하기' };

for (const [id, title, choices] of [
  ['word-pictures', '글자 보고 그림 찾기', 3],
  ['first-sound', '첫소리 찾기', 3],
  ['position-words', '어디에 있을까?', 3],
  ['daily-routine', '생활 순서 놀이', 3],
] as const) {
  test(`${id} opens from /games/${id}, starts and shows a round`, async ({ page }) => {
    await page.goto(`/games/${id}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.getByRole('button', START).click();
    await expect(page.getByText('1 / 6 탐험')).toBeVisible();
    await expect(page.locator('[aria-label="그림 고르기"] button, [aria-label="자리 말 고르기"] button, [aria-label="순서 카드"] button')).toHaveCount(choices);
    await expect.poll(() => page.locator('main img').evaluateAll((images) => images.every((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
  });
}

test('word pictures: a wrong picture asks to reread, the right one explains, English works too', async ({ page }) => {
  await page.goto('/games/word-pictures');
  await page.getByRole('button', START).click();
  const word = (await page.locator('.reading-word').innerText()).trim();
  expect(word.length).toBeLessThanOrEqual(3);
  await page.locator('[aria-label="그림 고르기"] button:not([data-correct])').first().click();
  await expect(page.getByRole('status')).toContainText(`'${word}'`);
  await page.locator('[aria-label="그림 고르기"] button[data-correct]').click();
  await expect(page.getByRole('status')).toContainText('잘 찾았어요');
  await expect(page.getByRole('status')).toContainText(word);
  await page.getByRole('button', { name: '다음 탐험', exact: true }).click();
  await expect(page.getByText('2 / 6 탐험')).toBeVisible();

  await page.goto('/games/word-pictures');
  await page.getByRole('button', { name: 'English 단어' }).click();
  await page.getByRole('button', { name: /자신 있어요/ }).click();
  await page.getByRole('button', START).click();
  await expect(page.locator('.reading-word')).toHaveText(/^[A-Za-z-]+$/);
  await expect(page.locator('[aria-label="그림 고르기"] button')).toHaveCount(4);
});

test('first sound shows the consonant with its name and labels pictures on easy', async ({ page }) => {
  await page.goto('/games/first-sound');
  await page.getByRole('button', START).click();
  const sound = (await page.locator('.first-sound-badge').innerText()).trim();
  expect(sound).toMatch(/^[ㄱ-ㅎ]$/);
  const correct = page.locator('[aria-label="그림 고르기"] button[data-correct]');
  const label = (await correct.locator('span').innerText()).trim();
  await correct.click();
  await expect(page.getByRole('status')).toContainText(`${label}`);
  await expect(page.getByRole('status')).toContainText(`${sound}(`);
});

test('position words: the scene matches the answer, hard mode picks a scene from a word', async ({ page }) => {
  await page.goto('/games/position-words');
  await page.getByRole('button', START).click();
  const place = await page.locator('.position-scene').getAttribute('data-place');
  await expect(page.locator('[aria-label="자리 말 고르기"] button[data-correct]')).toHaveText(place!);
  await page.getByRole('button', { name: place!, exact: true }).click();
  await expect(page.getByRole('status')).toContainText(`상자 ${place}에 있어요`);

  await page.goto('/games/position-words');
  await page.getByRole('button', { name: /자신 있어요/ }).click();
  await page.getByRole('button', START).click();
  const word = (await page.locator('.reading-word').innerText()).trim();
  const scenes = page.locator('[aria-label="그림 고르기"] button');
  await expect(scenes).toHaveCount(3);
  await expect(page.locator('[aria-label="그림 고르기"] button[data-correct] svg')).toHaveAttribute('data-place', word);
  await scenes.locator(`svg[data-place="${word}"]`).click();
  await expect(page.getByRole('status')).toContainText('잘 찾았어요');
});

test('daily routine: wrong order shakes, right order completes and records once', async ({ page }) => {
  await page.goto('/games/daily-routine');
  await page.getByRole('button', START).click();
  const cards = page.locator('[aria-label="순서 카드"] button');
  await expect(cards).toHaveCount(3);
  // The first card is never already in its place, so tapping something other than step 0 must fail.
  await cards.locator(':scope:not([data-step-index="0"])').first().click();
  await expect(page.getByRole('status')).toContainText('순서가 달라요');
  for (let round = 0; round < 6; round++) {
    const count = await cards.count();
    for (let step = 0; step < count; step++) await page.locator(`[aria-label="순서 카드"] button[data-step-index="${step}"]`).click();
    await expect(page.getByRole('status')).toContainText('잘 찾았어요');
    await expect(page.getByRole('status')).toContainText('→');
    await page.getByRole('button', { name: round === 5 ? '탐험 마치기' : '다음 탐험', exact: true }).click();
  }
  await expect(page.getByText('탐험을 마쳤어요!')).toBeVisible();
  const saved = await gameState(page);
  expect(saved.gameRecords).toHaveLength(1);
  expect(saved.gameRecords[0]).toMatchObject({ gameId: 'daily-routine', score: 5 });
});

test('hard routine lays out every step of a five-step routine', async ({ page }) => {
  await page.goto('/games/daily-routine');
  await page.getByRole('button', { name: /자신 있어요/ }).click();
  await page.getByRole('button', START).click();
  await expect(page.locator('.routine-slot')).toHaveCount(await page.locator('[aria-label="순서 카드"] button').count());
  const titles: string[] = [];
  for (let round = 0; round < 10; round++) {
    titles.push((await page.locator('.scene-meadow h2').innerText()).replace(/[은는] 어떤 순서일까요\?$/, ''));
    const count = await page.locator('[aria-label="순서 카드"] button').count();
    for (let step = 0; step < count; step++) await page.locator(`[aria-label="순서 카드"] button[data-step-index="${step}"]`).click();
    await page.getByRole('button', { name: round === 9 ? '탐험 마치기' : '다음 탐험', exact: true }).click();
  }
  expect(new Set(titles).size).toBe(7);
});
