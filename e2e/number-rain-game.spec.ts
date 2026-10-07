import { test, expect, type Page } from '@playwright/test';

async function savedRecords(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification') ?? '{"state":{"gameRecords":[]}}').state.gameRecords);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 })));
  // The rain runs on requestAnimationFrame; a fake clock lets the tests step through it.
  await page.clock.install({ time: new Date('2026-01-01T09:00:00') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games/number-rain');
  await page.clock.pauseAt(new Date('2026-01-01T09:01:00'));
  await page.getByRole('button', { name: '같이 시작하기' }).click();
});

const drops = (page: Page) => page.getByRole('list', { name: '떨어지는 숫자' }).getByRole('listitem');

async function popVisible(page: Page) {
  for (const digit of await drops(page).evaluateAll((items) => items.map((item) => item.getAttribute('data-digit')))) {
    await page.getByRole('button', { name: `${digit} 누르기` }).click();
  }
}

test('숫자 비: 떨어지는 숫자와 같은 키를 누르면 사라지고, 없는 숫자는 하트를 깎지 않는다', async ({ page }) => {
  await page.clock.runFor(100);
  await expect(drops(page)).toHaveCount(1);
  await expect(page.getByLabel('스테이지 진행')).toContainText('1 / 10');
  const digit = Number(await drops(page).first().getAttribute('data-digit'));
  // Stage 1 only uses 1–3; the rest of the keypad is switched off.
  await expect(page.getByRole('button', { name: '9 누르기' })).toBeDisabled();
  await page.getByRole('button', { name: `${(digit % 3) + 1} 누르기` }).click();
  await expect(drops(page)).toHaveCount(1);
  await expect(page.getByLabel('남은 하트 3개')).toBeVisible();
  await page.getByRole('button', { name: `${digit} 누르기` }).click();
  await expect(drops(page)).toHaveCount(0);
  await expect(page.getByLabel('없앤 숫자 1개 중 6개')).toBeVisible();
});

test('숫자 비: 숫자가 땅에 세 번 닿으면 끝나고 기록이 남는다', async ({ page }) => {
  // The first stage drops one number every 2.4s and each takes 14s to land.
  await page.clock.runFor(14500);
  await expect(page.getByLabel('남은 하트 2개')).toBeVisible();
  await page.clock.runFor(20000);
  await expect(page.getByRole('heading', { name: '스테이지 1까지 왔어요!' })).toBeVisible();
  expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'number-rain', category: 'play', score: 0 });
});

test('숫자 비: 10스테이지를 모두 깨면 성공하고 점점 어려워진다', async ({ page }) => {
  test.setTimeout(120000);
  for (let stage = 1; stage <= 10; stage++) {
    await expect(page.getByLabel('스테이지 진행')).toContainText(`${stage} / 10`);
    if (stage === 6) await expect(page.getByRole('button', { name: '0 누르기' })).toBeEnabled();
    const next = page.getByRole('button', { name: '다음 스테이지' });
    const done = page.getByRole('heading', { name: '10스테이지 모두 성공!' });
    for (let tick = 0; tick < 200 && !(await next.isVisible()) && !(await done.isVisible()); tick++) {
      await page.clock.runFor(400);
      await popVisible(page);
    }
    if (stage < 10) {
      await expect(page.getByRole('heading', { name: `스테이지 ${stage} 성공!` })).toBeVisible();
      expect(await savedRecords(page)).toHaveLength(0);
      await next.click();
    }
  }
  await expect(page.getByRole('heading', { name: '10스테이지 모두 성공!' })).toBeVisible();
  expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'number-rain', score: 93, stars: 3 });
});
