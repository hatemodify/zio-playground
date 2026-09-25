import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 })));
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

test('확인 then closing the praise moves on to the next character', async ({ page }) => {
  await page.goto('/hangul/ㄱ');
  await write(page);
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await page.getByText('잘했어!', { exact: true }).click();
  await expect(page).toHaveURL('/hangul/ㄴ');
  // A fresh sheet: nothing is drawn yet, so there is nothing to confirm.
  await expect(page.getByRole('button', { name: '확인', exact: true })).toHaveCount(0);
});

test('the praise advances on its own when it is left alone', async ({ page }) => {
  await page.clock.install();
  await page.goto('/numbers/1');
  await write(page);
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByText('잘했어!', { exact: true })).toBeVisible();
  await page.clock.runFor(3200);
  await expect(page).toHaveURL('/numbers/2');
});

test('the last character has nowhere to advance, so the praise just closes', async ({ page }) => {
  await page.goto('/numbers/50');
  await write(page);
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await page.getByText('잘했어!', { exact: true }).click();
  await expect(page.getByText('잘했어!', { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL('/numbers/50');
});

const BACK = { name: '뒤로 가기' };

for (const tab of ['/', '/numbers', '/hangul', '/english', '/games']) {
  test(`the bottom-nav tab ${tab} needs no back button`, async ({ page }) => {
    await page.goto(tab);
    await expect(page.getByRole('button', BACK)).toHaveCount(0);
  });
}

for (const [label, path, parent] of [
  ['한글 낱글자', '/hangul/ㄱ', '/hangul'],
  ['숫자 낱장', '/numbers/3', '/numbers'],
  ['영어 낱글자', '/english/B', '/english'],
  ['게임', '/games/daruma', '/games'],
  ['스티커북', '/stickers', '/'],
  ['설정', '/settings', '/'],
] as const) {
  test(`${label} offers a back button that lands on ${parent}`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole('button', BACK).click();
    await expect(page).toHaveURL(parent);
  });
}

test('back returns to where the child actually came from, not just the section', async ({ page }) => {
  await page.goto('/');
  await page.goto('/hangul');
  await page.goto('/hangul/ㄷ');
  await page.getByRole('button', BACK).click();
  await expect(page).toHaveURL('/hangul');
  await expect(page.getByRole('button', BACK)).toHaveCount(0);
});

test('the back button is reachable in landscape too', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/games/juice-math');
  await expect(page.getByRole('button', BACK)).toBeVisible();
  await page.getByRole('button', BACK).click();
  await expect(page).toHaveURL('/games');
});
