import { test, expect, type Page } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const AUDIO_DIR = join(process.cwd(), 'public/assets/audio');
const settings = (voiceEnabled: boolean) =>
  JSON.stringify({ state: { onboarded: true, sfxEnabled: false, voiceEnabled }, version: 1 });

test.describe('bundled voice clips', () => {
  test('the generated clip set covers letters, numbers, words, shapes and phrases', () => {
    const files = readdirSync(AUDIO_DIR).filter((name) => name.endsWith('.mp3'));
    expect(files.length).toBeGreaterThanOrEqual(640);
    const ga = '가'.codePointAt(0)!.toString(16);
    for (const id of [`ko-char-${ga}`, 'ko-char-3131', 'en-letter-A', 'ko-number-1', 'ko-number-50', 'en-number-50', 'ko-word-backpack', 'en-word-apple', 'ko-shape-circle', 'en-shape-triangle', 'ko-phrase-above', 'ko-phrase-listen-word']) {
      expect(existsSync(join(AUDIO_DIR, `${id}.mp3`)), id).toBe(true);
    }
  });

  test.describe('with voice on', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('kidsedu-settings', value), settings(true));
    });

    for (const path of ['/numbers/12', '/hangul/ㄱ', '/hangul/가', '/english/B']) {
      test(`every speaker button on ${path} points at a clip that ships`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('[data-voice-clip]').first()).toBeVisible();
        const clips = await page.locator('[data-voice-clip]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-voice-clip')!));
        expect(clips.length).toBeGreaterThan(0);
        for (const clip of clips) {
          expect(existsSync(join(AUDIO_DIR, `${clip}.mp3`)), clip).toBe(true);
          const status = await page.evaluate(async (url) => (await fetch(url, { method: 'HEAD' })).status, `/assets/audio/${clip}.mp3`);
          expect(status, clip).toBe(200);
        }
      });
    }

    test('tapping the speaker fetches that number\'s clip', async ({ page }) => {
      await page.goto('/numbers/3');
      const request = page.waitForRequest((req) => req.url().endsWith('/assets/audio/ko-number-3.mp3'));
      await page.locator('[data-voice-clip="ko-number-3"]').click();
      await request;
    });

    test('numbers past ten are laid out in ten-frames', async ({ page }) => {
      await page.goto('/numbers/12');
      await expect(page.locator('[data-ten-frames="2"]')).toBeVisible();
      await expect(page.getByRole('group', { name: '10개 묶음 1' })).toBeVisible();
      await expect(page.getByRole('group', { name: '낱개 2개' })).toBeVisible();
      await expect(page.getByText('10개 묶음 1개 + 낱개 2개 = 12')).toBeVisible();
    });

    test('a syllable with a word shows the word and its picture', async ({ page }) => {
      await page.goto('/hangul/가');
      const card = page.getByTestId('syllable-word');
      await expect(card).toContainText('가방');
      await expect(card.locator('img')).toHaveAttribute('src', /backpack/);
      await expect(card.locator('[data-voice-clip="ko-word-backpack"]')).toBeVisible();
    });

    test('english word pictures from the emoji set render too', async ({ page }) => {
      await page.goto('/english/J');
      await expect(page.locator('img[src*="jellyfish"]')).toBeVisible();
    });
  });

  test('turning voice off hides every speaker button', async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('kidsedu-settings', value), settings(false));
    await page.goto('/hangul/ㄱ');
    await expect(page.getByText('기역', { exact: true })).toBeVisible();
    await expect(page.locator('[data-voice-clip]')).toHaveCount(0);
  });

  test('the settings page has a 읽어주기 switch that persists', async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('kidsedu-settings', value), settings(true));
    await page.goto('/settings');
    await solveParentGate(page);
    const toggle = page.getByRole('switch', { name: '읽어주기 켜기/끄기' });
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-settings')!).state.voiceEnabled)).toBe(false);
  });
});

async function solveParentGate(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const numbers = await dialog.locator('span.text-4xl').allTextContents();
  const answer = String(Number(numbers[0]) + Number(numbers[1]));
  for (const digit of answer) await dialog.getByRole('button', { name: digit, exact: true }).click();
  await expect(dialog).toBeHidden();
}

test.describe('오늘의 복습', () => {
  const yesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString();
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('kidsedu-settings', value), settings(false));
  });

  test('stays out of the way when nothing has been practised yet', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('오늘의 추천 학습')).toBeVisible();
    await expect(page.getByTestId('review-card')).toHaveCount(0);
  });

  test('brings back yesterday\'s letters and a game that missed three stars', async ({ page }) => {
    await page.addInitScript(({ when }) => {
      localStorage.setItem('kidsedu-progress', JSON.stringify({ state: { nickname: '', items: {
        'hangul-ㄱ': { id: 'hangul-ㄱ', category: 'hangul', character: 'ㄱ', tracingStage: 3, completed: true, attempts: 2, bestScore: 60, lastPracticedAt: when },
        'number-7': { id: 'number-7', category: 'numbers', character: '7', tracingStage: 1, completed: false, attempts: 1, bestScore: 0, lastPracticedAt: when },
        'english-C': { id: 'english-C', category: 'english', character: 'C', tracingStage: 3, completed: true, attempts: 1, bestScore: 100, lastPracticedAt: new Date().toISOString() },
      } }, version: 1 }));
      localStorage.setItem('kidsedu-gamification', JSON.stringify({ state: { totalStars: 5, level: 1, streak: 1, lastLoginDate: '', stickers: [], unlockedGames: [], characterOutfits: [],
        gameRecords: [{ gameId: 'daruma', category: 'play', score: 1, stars: 2, completedAt: when, duration: 30 }] }, version: 1 }));
    }, { when: yesterday() });
    await page.goto('/');
    const card = page.getByTestId('review-card');
    await expect(card).toBeVisible();
    // Yesterday's items come back; today's (English C) does not.
    await expect(card.getByRole('button', { name: '기린 복습하기' })).toBeVisible();
    await expect(card.getByRole('button', { name: '일곱 복습하기' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Cat 복습하기' })).toHaveCount(0);
    await expect(card.getByText('어제').first()).toBeVisible();
    await expect(card.getByRole('button', { name: /달마치기 다시 도전하기/ })).toBeVisible();

    await card.getByRole('button', { name: '기린 복습하기' }).click();
    await expect(page).toHaveURL('/hangul/ㄱ');
  });
});

test.describe('듣고 찾기', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('kidsedu-settings', value), settings(false));
    await page.goto('/games/listen-find');
    await expect(page.getByRole('heading', { name: '귀를 쫑긋! 무슨 소리일까요?' })).toBeVisible();
  });

  async function playThrough(page: Page, rounds: number) {
    const stage = page.locator('.listen-stage');
    for (let round = 1; round <= rounds; round++) {
      await expect(page.getByText(`${round} / ${rounds} 탐험`)).toBeVisible();
      const answer = await stage.getAttribute('data-answer');
      await page.locator('[data-correct="true"]').click();
      if (round < rounds) await expect(stage).not.toHaveAttribute('data-answer', answer!);
    }
    await expect(page.getByText('소리를 모두 찾았어요!')).toBeVisible();
  }

  test('letter sounds: three Hangul choices, the clip is requested, the run finishes with a reward', async ({ page }) => {
    const request = page.waitForRequest((req) => /\/assets\/audio\/ko-char-[0-9a-f]+\.mp3$/.test(req.url()));
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    await request;
    await expect(page.getByRole('button', { name: '다시 듣기' })).toBeVisible();
    await expect(page.locator('.listen-choice')).toHaveCount(3);
    await playThrough(page, 6);
    await expect(page.getByText('게임 클리어!')).toBeVisible();
    const records = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification')!).state.gameRecords);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ gameId: 'listen-find', category: 'hangul', score: 6, stars: 3 });
  });

  test('a wrong tap shakes and keeps the round; the hint reveals the word', async ({ page }) => {
    await page.getByRole('button', { name: '단어 소리' }).click();
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    const stage = page.locator('.listen-stage');
    const answer = await stage.getAttribute('data-answer');
    await page.locator('.listen-choice:not([data-correct])').first().click();
    await expect(stage).toHaveAttribute('data-answer', answer!);
    await expect(page.getByText('1 / 6 탐험')).toBeVisible();
    await page.getByRole('button', { name: '힌트 보기' }).click();
    await expect(page.getByTestId('listen-hint')).toContainText('힌트:');
    // Word rounds answer with pictures, never text.
    await expect(page.locator('.listen-choice img')).toHaveCount(3);
  });

  test('english first-letter rounds offer four letters on the normal level', async ({ page }) => {
    await page.getByRole('group', { name: '언어 고르기' }).getByRole('button', { name: '영어' }).click();
    await page.getByRole('button', { name: '첫 글자' }).click();
    await page.getByRole('button', { name: '할 수 있어요' }).click();
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    await expect(page.locator('.listen-choice')).toHaveCount(4);
    await expect(page.locator('.listen-choice').first()).toHaveText(/^[A-Z]$/);
    await playThrough(page, 8);
  });
});
