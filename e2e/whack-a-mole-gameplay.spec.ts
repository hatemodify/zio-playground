import { test, expect } from '@playwright/test';
import { clearMoleStages } from './helpers/mole-stages';

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0.5;
    localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { sfxEnabled: false, onboarded: true }, version: 1 }));
  });
});

test('큰 게임판에 단계 목표·타이머·라이프가 표시된다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/whack-a-mole');
  await expect(page.getByRole('heading', { name: '두더지 잡기' })).toBeVisible();
  await expect(page.getByText('1단계 · 연습 마당')).toBeVisible();
  await expect(page.getByLabel('라이프 3개')).toBeVisible();
  await expect(page.getByRole('progressbar', { name: '단계 목표' })).toHaveAttribute('aria-valuemax', '4');
  await expect(page.getByText('20초')).toBeVisible();
  const board = page.getByLabel('두더지 잡기 게임판');
  expect((await board.boundingBox())!.width).toBeGreaterThan(350);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  for (let index = 1; index <= 9; index++) await expect(page.getByRole('button', { name: `구멍 ${index}` })).toBeVisible();
  await page.clock.runFor(1500);
  await expect(page.getByText('19초')).toBeVisible();
  await expect(page.locator('button[data-kind="vehicle"]')).toHaveCount(1);
});

test('목표를 채우면 다음 단계로 올라가고 마지막에 완료 축하가 나타난다', async ({ page }) => {
  await page.goto('/games/whack-a-mole');
  await clearMoleStages(page);
  await expect(page.getByRole('dialog', { name: '게임 클리어!' })).toBeVisible();
  await expect(page.getByTestId('confetti-shower')).toBeVisible();
  await expect(page.getByText('18마리 잡았어요!')).toBeVisible();
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification') ?? '{"state":{"gameRecords":[]}}').state.gameRecords);
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({ gameId: 'whack-a-mole', score: 18 });
});

test('폭탄을 누르면 하트가 줄고 폭발 효과가 나타나며 세 번 맞으면 종료된다', async ({ page }) => {
  await page.goto('/games/whack-a-mole');
  await page.evaluate(() => { Math.random = () => 0; });
  for (const lives of [2, 1, 0]) {
    await page.clock.runFor(1100);
    await page.locator('button[data-kind="bomb"]').first().click();
    await expect(page.getByLabel(`라이프 ${lives}개`)).toBeVisible();
    await expect(page.locator('button[data-feedback="bomb"]')).toContainText('-1 ♥');
  }
  await page.clock.runFor(850);
  await expect(page.getByRole('heading', { name: '한 번 더 도전해요!' })).toBeVisible();
  await expect(page.getByText('폭탄에 하트를 모두 잃었어요.')).toBeVisible();
  await expect(page.getByRole('dialog', { name: '게임 클리어!' })).toHaveCount(0);
  await page.getByRole('button', { name: '다시 하기' }).click();
  await expect(page.getByLabel('라이프 3개')).toBeVisible();
});

test('시간 안에 목표를 못 채우면 재도전 화면을 보여준다', async ({ page }) => {
  await page.goto('/games/whack-a-mole');
  await page.clock.runFor(20500);
  await expect(page.getByRole('heading', { name: '한 번 더 도전해요!' })).toBeVisible();
  await expect(page.getByText(/시간이 끝났어요/)).toBeVisible();
});

test('영어로 바꿔도 단계·라이프·게임판 안내가 읽힌다', async ({ page }) => {
  await page.goto('/games/whack-a-mole');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(page.getByRole('heading', { name: 'Whack-a-Mole' })).toBeVisible();
  await expect(page.getByText('Stage 1 · Practice Yard')).toBeVisible();
  await expect(page.getByLabel('3 lives')).toBeVisible();
  await expect(page.getByLabel('Whack-a-Mole board')).toBeVisible();
});
