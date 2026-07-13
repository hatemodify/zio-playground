import { test, expect, type Page } from '@playwright/test';

/** Pixels on the visible canvas carrying paint (ignores transparent and pure white). */
async function paintedPixels(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let i = 0; i < data.length; i += 4) {
      const opaque = data[i + 3] > 50;
      const white = data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245;
      if (opaque && !white) painted += 1;
    }
    return painted;
  });
}

async function scribble(page: Page, offset: number): Promise<void> {
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.move(box.x + 40 + offset, box.y + 50 + offset);
  await page.mouse.down();
  for (let i = 0; i < 8; i += 1) {
    await page.mouse.move(box.x + 40 + offset + i * 15, box.y + 50 + offset + (i % 2 ? 25 : 0));
  }
  await page.mouse.up();
}

test.describe('Drawing Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'kidsedu-settings',
        JSON.stringify({
          state: { sfxEnabled: false, ttsSpeed: 1, volume: 0, onboarded: true, dailyTimeLimit: 30 },
          version: 1,
        })
      );
    });
  });

  test('free draw: undo and redo restore the canvas exactly', async ({ page }) => {
    await page.goto('/games/free-draw');
    await expect(page.locator('canvas')).toBeVisible();

    const undo = page.getByRole('button', { name: '되돌리기' });
    const redo = page.getByRole('button', { name: '다시 실행' });
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();

    await scribble(page, 0);
    const afterFirst = await paintedPixels(page);
    expect(afterFirst).toBeGreaterThan(0);

    await scribble(page, 70);
    const afterSecond = await paintedPixels(page);
    expect(afterSecond).toBeGreaterThan(afterFirst);
    await expect(undo).toBeEnabled();

    await undo.click();
    expect(await paintedPixels(page)).toBe(afterFirst);

    await undo.click();
    expect(await paintedPixels(page)).toBe(0);
    await expect(undo).toBeDisabled();
    await expect(redo).toBeEnabled();

    await redo.click();
    expect(await paintedPixels(page)).toBe(afterFirst);
    await redo.click();
    expect(await paintedPixels(page)).toBe(afterSecond);
    await expect(redo).toBeDisabled();

    // A fresh stroke drops the redo stack.
    await undo.click();
    await expect(redo).toBeEnabled();
    await scribble(page, 35);
    await expect(redo).toBeDisabled();
  });

  test('free draw: canvas fills the space left by the toolbars', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 860 });
    await page.goto('/games/free-draw');
    await expect(page.locator('canvas')).toBeVisible();

    const box = (await page.locator('canvas').boundingBox())!;
    // Comfortably larger than the old fixed 360x360 square, and inside the viewport.
    expect(box.width).toBeGreaterThan(360);
    expect(box.height).toBeGreaterThan(400);
    expect(box.y + box.height).toBeLessThanOrEqual(860);
    await expect(page.getByRole('button', { name: '지우기' })).toBeVisible();
  });

  test('coloring: undo removes paint but keeps the sketch outline', async ({ page }) => {
    await page.goto('/games/coloring');
    await page.locator('button[aria-label$="색칠하기"]').first().click();
    await expect(page.locator('canvas')).toBeVisible();

    const undo = page.getByRole('button', { name: '되돌리기' });
    const redo = page.getByRole('button', { name: '다시 실행' });
    await expect(undo).toBeDisabled();

    const outlineOnly = await paintedPixels(page);
    expect(outlineOnly).toBeGreaterThan(0);

    await scribble(page, 0);
    const painted = await paintedPixels(page);
    expect(painted).toBeGreaterThan(outlineOnly);

    await undo.click();
    // Paint is gone; the outline the child colors over must not be.
    expect(await paintedPixels(page)).toBe(outlineOnly);

    await redo.click();
    expect(await paintedPixels(page)).toBe(painted);
    await expect(redo).toBeDisabled();
  });

  test('coloring: canvas fits within the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 860 });
    await page.goto('/games/coloring');
    await page.locator('button[aria-label$="색칠하기"]').first().click();
    await expect(page.locator('canvas')).toBeVisible();

    const box = (await page.locator('canvas').boundingBox())!;
    // The old canvas was a hardcoded 480px square — wider than this screen.
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.width).toBeLessThanOrEqual(420);
    expect(box.y + box.height).toBeLessThanOrEqual(860);
  });
});
