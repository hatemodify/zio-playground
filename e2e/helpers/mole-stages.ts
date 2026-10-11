import { expect, type Page } from '@playwright/test';

/** A fixed random draw yields vehicles in the same hole without bombs. */
export async function clearMoleStages(page: Page) {
  for (const [stageIndex, goal] of [4, 6, 8].entries()) {
    await expect(page.getByText(`${stageIndex + 1}단계 ·`, { exact: false })).toBeVisible();
    for (let hit = 0; hit < goal; hit++) {
      await page.clock.runFor(1100);
      await page.locator('button[data-kind="vehicle"]').first().click();
      if (stageIndex < 2 || hit + 1 < goal) await expect(page.getByRole('progressbar', { name: '단계 목표' })).toHaveAttribute('aria-valuenow', String(hit + 1));
    }
    if (stageIndex < 2) {
      await expect(page.getByRole('dialog', { name: '단계 성공' })).toBeVisible();
      await page.getByRole('button', { name: '다음 단계' }).click();
    }
  }
  await page.clock.runFor(450);
  await expect(page.getByRole('heading', { name: '3단계 모두 성공!' })).toBeVisible();
}
