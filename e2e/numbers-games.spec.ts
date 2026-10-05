import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false, voiceEnabled: false }, version: 1 })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function savedRecords(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification') ?? '{"state":{"gameRecords":[]}}').state.gameRecords);
}

async function start(page: Page, id: 'tens-ones' | 'number-bonds', difficulty = '처음 해요') {
  await page.goto(`/games/${id}`);
  await page.getByRole('button', { name: difficulty }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
}

/** Clears whichever round is on screen: a multiple-choice one, or a build-the-number one. */
async function solveTensOnesRound(page: Page) {
  const prompt = page.locator('[data-correct="true"], [data-target]').first();
  await prompt.waitFor();
  const target = await prompt.getAttribute('data-target');
  if (target === null) { await prompt.click(); return; }
  const value = Number(target);
  for (let step = 0; step < Math.floor(value / 10); step++) await page.getByRole('button', { name: '10묶음 더하기' }).click();
  for (let step = 0; step < value % 10; step++) await page.getByRole('button', { name: '낱개 더하기' }).click();
  await expect(page.locator('.tens-counter strong')).toHaveText(String(value));
  await page.getByRole('button', { name: '확인' }).click();
}

test.describe('10개씩 묶기', () => {
  test('the intro loads and starting shows the first reading round', async ({ page }) => {
    await page.goto('/games/tens-ones');
    await expect(page.getByRole('heading', { name: '또리의 달걀 농장' })).toBeVisible();
    await expect(page.getByText('6문제 · 11부터 20까지')).toBeVisible();
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '0');
    await expect(page.getByRole('group', { name: '답 고르기' }).getByRole('button')).toHaveCount(3);
    await expect(page.locator('[data-correct="true"]')).toHaveCount(1);
  });

  test('reading and building rounds alternate until the reward, saving one record', async ({ page }) => {
    test.setTimeout(60000);
    await start(page, 'tens-ones');
    for (let round = 0; round < 6; round++) {
      await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', String(round));
      await solveTensOnesRound(page);
      // Every correct answer shows the split before moving on.
      await expect(page.getByRole('math')).toHaveAttribute('aria-label', /^\d0 더하기 \d는 \d+$/);
    }
    await expect(page.getByRole('heading', { name: '달걀을 모두 묶어 세었어요!' })).toBeVisible();
    expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'tens-ones', category: 'numbers', score: 6, stars: 3 });
    await page.getByRole('button', { name: '탭하여 계속하기' }).click();
    await page.getByRole('button', { name: '다시 놀기' }).click();
    await expect(page.getByRole('button', { name: '같이 시작하기' })).toBeVisible();
    expect(await savedRecords(page)).toHaveLength(1);
  });

  test('a wrong choice shakes and stays on the same round', async ({ page }) => {
    await start(page, 'tens-ones');
    await page.locator('[data-correct="false"]').first().click();
    await expect(page.locator('.numbers-shake')).toBeVisible();
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '0');
    await expect(page.locator('[data-correct="true"]')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('아니에요');
  });

  test('building the wrong amount is refused and the eggs stay for another try', async ({ page }) => {
    await start(page, 'tens-ones');
    await solveTensOnesRound(page);
    const target = page.locator('[data-target]');
    await target.waitFor();
    const value = Number(await target.getAttribute('data-target'));
    await expect(page.getByRole('button', { name: '확인' })).toBeDisabled();
    await page.getByRole('button', { name: '낱개 더하기' }).click();
    await page.getByRole('button', { name: '확인' }).click();
    await expect(page.locator('.numbers-shake')).toBeVisible();
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '1');
    await expect(page.locator('.tens-counter strong')).toHaveText('1');
    await expect(target).toHaveAttribute('data-target', String(value));
  });

  test('ten loose eggs pack themselves into one carton', async ({ page }) => {
    await start(page, 'tens-ones', '자신 있어요');
    await solveTensOnesRound(page);
    await page.locator('[data-target]').waitFor();
    for (let step = 0; step < 10; step++) await page.getByRole('button', { name: '낱개 더하기' }).click();
    await expect(page.getByText('10개씩 묶음 1개, 낱개 0개 =')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('10개씩 묶음 1개가 됐어요');
  });
});

test.describe('수 가르기·모으기', () => {
  test('the intro loads and starting shows a split round with houses and a bond', async ({ page }) => {
    await page.goto('/games/number-bonds');
    await expect(page.getByRole('heading', { name: '또리의 두 집 마을' })).toBeVisible();
    await expect(page.getByText('6문제 · 5까지의 수')).toBeVisible();
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '0');
    await expect(page.getByRole('img', { name: /^수 가르기 그림: 전체 \d+, 왼쪽 \d+, 오른쪽 \?$/ })).toBeVisible();
    await expect(page.getByLabel(/^왼쪽 집: /)).toBeVisible();
    await expect(page.getByLabel(/^오른쪽 집: /)).toBeVisible();
    await expect(page.getByRole('group', { name: '답 고르기' }).getByRole('button')).toHaveCount(3);
  });

  test('splitting and joining rounds alternate until the reward, saving one record', async ({ page }) => {
    test.setTimeout(60000);
    await start(page, 'number-bonds');
    for (let round = 0; round < 6; round++) {
      await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', String(round));
      const diagram = page.getByRole('img', { name: /^수 가르기 그림/ });
      // Even rounds hide a part, odd rounds hide the whole.
      await expect(diagram).toHaveAttribute('aria-label', round % 2 === 0 ? /오른쪽 \?$/ : /^수 가르기 그림: 전체 \?/);
      await page.locator('[data-correct="true"]').click();
      // Once solved, the bond is complete: no question marks left.
      await expect(diagram).toHaveAttribute('aria-label', /^수 가르기 그림: 전체 \d+, 왼쪽 \d+, 오른쪽 \d+$/);
    }
    await expect(page.getByRole('heading', { name: '동물 친구들이 모두 집을 찾았어요!' })).toBeVisible();
    expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'number-bonds', category: 'numbers', score: 6, stars: 3 });
    await page.getByRole('button', { name: '탭하여 계속하기' }).click();
    await page.getByRole('button', { name: '다시 놀기' }).click();
    await expect(page.getByRole('button', { name: '같이 시작하기' })).toBeVisible();
    expect(await savedRecords(page)).toHaveLength(1);
  });

  test('a wrong choice shakes and stays on the same round', async ({ page }) => {
    await start(page, 'number-bonds');
    await page.locator('[data-correct="false"]').first().click();
    await expect(page.locator('.numbers-shake')).toBeVisible();
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '0');
    await expect(page.locator('[data-correct="true"]')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('아니에요');
  });

  test('the hardest level closes the right-hand door so the part has to be worked out', async ({ page }) => {
    await start(page, 'number-bonds', '자신 있어요');
    await expect(page.getByLabel('오른쪽 집: 문이 닫혀 있어요')).toBeVisible();
    await expect(page.getByRole('group', { name: '답 고르기' }).getByRole('button')).toHaveCount(4);
  });
});
