import { test, expect, type Page } from '@playwright/test';

async function savedRecords(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification') ?? '{"state":{"gameRecords":[]}}').state.gameRecords);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 })));
});
async function startFrozen(page: Page, difficulty = '처음 해요') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games/daruma');
  await page.getByRole('button', { name: '같이 시작하기' }).waitFor();
  await page.clock.install({ time: new Date('2026-09-11T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-11T00:00:01Z'));
  await page.getByRole('button', { name: difficulty }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
}
async function waitForGreen(page: Page) {
  for (let step = 0; step < 100; step++) {
    const power = Number(await page.getByRole('meter', { name: '망치 힘' }).getAttribute('aria-valuenow'));
    if (power >= 45 && power <= 60) return;
    await page.clock.runFor(40);
  }
  throw new Error('Power meter did not reach the green range');
}

for (const [difficulty, blocks] of [['처음 해요', 5], ['할 수 있어요', 7], ['자신 있어요', 9]] as const) {
  test(`daruma ${difficulty}: hit both sides, block repeat input, complete once and replay`, async ({ page }) => {
    await startFrozen(page, difficulty);
    for (let index = 0; index < blocks; index++) {
      await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(blocks - index);
      await waitForGreen(page);
      if (index % 2 === 0) {
        await page.keyboard.down('ArrowLeft');
        await page.keyboard.down('ArrowLeft');
        await page.keyboard.up('ArrowLeft');
      } else {
        await page.getByRole('button', { name: '← 오른쪽에서 치기', exact: true }).click();
      }
      await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(blocks - index - 1);
      await page.keyboard.press('ArrowRight'); // strike animation locks out another hit
      await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(blocks - index - 1);
      await page.clock.runFor(200);
    }
    await expect(page.getByRole('heading', { name: '달마치기 성공!' })).toBeVisible();
    expect(await savedRecords(page)).toHaveLength(1);
    expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'daruma', category: 'play', score: blocks, stars: 3 });
    await page.keyboard.press('Escape');
    await page.clock.runFor(500);
    await page.getByRole('button', { name: '다시 놀기' }).click();
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(blocks);
    expect(await savedRecords(page)).toHaveLength(1);
  });
}

test('misses topple the tower, retries reset it, and failures grant no completion', async ({ page }) => {
  await startFrozen(page);
  for (let index = 0; index < 3; index++) {
    await page.keyboard.press('ArrowRight'); // zero / low power
    await page.clock.runFor(200);
  }
  await expect(page.getByRole('heading', { name: '다시 쌓으면 괜찮아요!' })).toBeVisible();
  await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(5);
  expect(await savedRecords(page)).toHaveLength(0);
  await page.getByRole('button', { name: '다시 쌓기', exact: true }).click();
  await expect(page.getByLabel('남은 기회 3번')).toBeVisible();
  await waitForGreen(page);
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(4);
});

test('pause freezes the gauge and blocks hits; leaving cancels a pending strike', async ({ page }) => {
  await startFrozen(page);
  await page.clock.runFor(200);
  await page.getByRole('button', { name: '잠깐 쉬기' }).click();
  const value = await page.getByRole('meter').getAttribute('aria-valuenow');
  await page.clock.runFor(5000);
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('meter')).toHaveAttribute('aria-valuenow', value!);
  await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(5);
  await page.getByRole('button', { name: '이어서 하기' }).click();
  await waitForGreen(page);
  await page.keyboard.press('ArrowLeft');
  await page.getByRole('link', { name: '게임 목록', exact: true }).click();
  await page.clock.runFor(5000);
  await expect(page).toHaveURL('/games');
  expect(await savedRecords(page)).toHaveLength(0);
});

test('catalog exposes daruma and mobile animation stays inside the stage', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games');
  await page.getByRole('button', { name: '톡! 톡! 달마치기', exact: true }).click();
  await page.getByRole('button', { name: '자신 있어요' }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  const stage = (await page.locator('.daruma-stage').boundingBox())!;
  const doll = (await page.getByRole('img', { name: '달마', exact: true }).boundingBox())!;
  expect(doll.y).toBeGreaterThanOrEqual(stage.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole('button', { name: '왼쪽에서 치기 →', exact: true })).toBeVisible();
  expect(await page.locator('.daruma-stage img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
});

test('a strong hit warns the player and a recovered clear reflects the mistake in rewards', async ({ page }) => {
  await startFrozen(page);
  await page.clock.runFor(1200);
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('status')).toContainText('너무 셌어요');
  await page.clock.runFor(200);
  for (let index = 0; index < 5; index++) {
    await waitForGreen(page);
    await page.keyboard.press('ArrowRight');
    await page.clock.runFor(200);
  }
  await expect(page.getByRole('heading', { name: '달마치기 성공!' })).toBeVisible();
  expect(await savedRecords(page)).toHaveLength(1);
  expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'daruma', score: 4, stars: 2 });
});
