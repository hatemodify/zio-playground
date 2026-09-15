import { test, expect } from '@playwright/test';
import { HANGUL_SYLLABLES, HANGUL_DATA } from '../src/data/hangul';
import { CATEGORY_TOTALS } from '../src/types/learning';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 })));
});

test('140 basic syllables have correct Unicode composition and unique progress ids', () => {
  expect(HANGUL_SYLLABLES).toHaveLength(140);
  expect(new Set(HANGUL_DATA.map((item) => item.id)).size).toBe(CATEGORY_TOTALS.hangul);
  for (const item of HANGUL_SYLLABLES) {
    const parts = item.character.normalize('NFD');
    expect(parts).toHaveLength(2);
    expect(parts[0].codePointAt(0)).toBe(0x1100 + 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.indexOf(item.consonant!));
    expect(parts[1].codePointAt(0)).toBe(0x1161 + 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.indexOf(item.vowel!));
  }
});

test('syllable lists change with the vowel and open composed writing lessons', async ({ page }) => {
  await page.goto('/hangul');
  await page.getByRole('button', { name: '글자 (가나다)' }).click();
  for (const char of ['가', '나', '다', '라', '마', '바', '사']) await expect(page.getByRole('button', { name: new RegExp(`^${char} -`) })).toBeVisible();
  await page.getByRole('button', { name: 'ㅗ 모음 글자' }).click();
  await page.getByRole('button', { name: '고 - ㄱ + ㅗ', exact: true }).click();
  await expect(page.getByLabel('글자 조합')).toHaveText('ㄱ + ㅗ = 고');
  await expect(page.getByText('따라 쓰기', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '자음 ㄴ', exact: true }).click();
  await expect(page.getByLabel('글자 조합')).toHaveText('ㄴ + ㅗ = 노');
  await page.getByRole('button', { name: '모음 ㅏ', exact: true }).click();
  await expect(page.getByLabel('글자 조합')).toHaveText('ㄴ + ㅏ = 나');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByLabel('글자 조합')).toHaveText('ㄷ + ㅏ = 다');
  await page.getByRole('link', { name: '가나다 글자 목록' }).click();
  await expect(page.getByRole('button', { name: '글자 (가나다)' })).toHaveAttribute('aria-pressed', 'true');
});

test('syllable writing saves completion, resets on next letter and preserves earlier jamo progress', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('kidsedu-progress', JSON.stringify({ state: { nickname: '', items: { 'hangul-ㄱ': { id: 'hangul-ㄱ', category: 'hangul', character: 'ㄱ', tracingStage: 3, completed: true, attempts: 1, bestScore: 0, lastPracticedAt: null } } }, version: 1 })));
  await page.goto('/hangul/가');
  await expect(page.getByLabel('글자 조합')).toHaveText('ㄱ + ㅏ = 가');
  const canvas = page.locator('canvas').last();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 90, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 90, { steps: 5 });
  await page.mouse.move(box.x + 180, box.y + 200, { steps: 5 });
  await page.mouse.up();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await page.getByText('잘했어!', { exact: true }).click();
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByLabel('글자 조합')).toHaveText('ㄴ + ㅏ = 나');
  await expect(page.getByRole('button', { name: '확인', exact: true })).toHaveCount(0);
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-progress')!).state.items);
  expect(items['hangul-가'].completed).toBe(true);
  expect(items['hangul-ㄱ'].completed).toBe(true);
  expect(items['hangul-나'].completed).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: '/tmp/edu-hangul-syllable-mobile.png', fullPage: true });
});
