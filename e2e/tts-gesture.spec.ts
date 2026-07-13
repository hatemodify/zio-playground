import { test, expect, type Page } from '@playwright/test';

interface SpeakCall {
  text: string;
  lang: string;
  volume: number;
  delayFromClick: number | null;
}

declare global {
  interface Window {
    __ttsCalls: SpeakCall[];
    __lastClickAt: number | null;
  }
}

/**
 * iOS Safari only speaks an utterance queued in the same task as the tap that
 * asked for it. Anything awaited in between (voice loading, a cancel() delay)
 * silently drops the speech — which is exactly how TTS died on tablets before.
 * These tests pin the timing, since a regression here is inaudible on desktop.
 */
const GESTURE_BUDGET_MS = 20;

async function instrumentSpeech(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      'kidsedu-settings',
      JSON.stringify({
        state: { sfxEnabled: false, ttsSpeed: 0.8, volume: 0.8, onboarded: true, dailyTimeLimit: 30 },
        version: 1,
      }),
    );

    window.__ttsCalls = [];
    window.__lastClickAt = null;
    const mark = () => { window.__lastClickAt = performance.now(); };
    document.addEventListener('pointerup', mark, true);
    document.addEventListener('click', mark, true);

    const speak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      window.__ttsCalls.push({
        text: utterance.text,
        lang: utterance.lang,
        volume: utterance.volume,
        delayFromClick:
          window.__lastClickAt === null ? null : performance.now() - window.__lastClickAt,
      });
      return speak(utterance);
    };
  });
}

/** Audible calls only — the silent priming utterance has volume 0. */
async function audibleCalls(page: Page): Promise<SpeakCall[]> {
  return page.evaluate(() => window.__ttsCalls.filter((c) => c.volume > 0));
}

test.describe('TTS is queued inside the user gesture', () => {
  test.beforeEach(async ({ page }) => { await instrumentSpeech(page); });

  test('counting an object speaks immediately on tap', async ({ page }) => {
    await page.goto('/numbers/3');
    await page.evaluate(() => { window.__ttsCalls = []; });

    await page.locator('main button[aria-label$=" 1"]').first().click();

    await expect.poll(async () => (await audibleCalls(page)).length).toBeGreaterThan(0);

    const [call] = await audibleCalls(page);
    expect(call.lang).toBe('ko-KR');
    // Native count word, as a child counts aloud — not the sino-Korean digit reading.
    expect(call.text).toBe('하나');
    expect(call.delayFromClick).toBeLessThan(GESTURE_BUDGET_MS);
  });

  test('the first tap primes speech with a silent utterance', async ({ page }) => {
    await page.goto('/numbers');
    await page.locator('main .grid > div').first().click();

    const primed = await page.evaluate(() =>
      window.__ttsCalls.some((c) => c.volume === 0),
    );
    expect(primed).toBe(true);
  });

  test('speech honours the volume setting', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'kidsedu-settings',
        JSON.stringify({
          state: { sfxEnabled: false, ttsSpeed: 0.8, volume: 0.3, onboarded: true, dailyTimeLimit: 30 },
          version: 1,
        }),
      );
    });

    await page.goto('/numbers/3');
    await page.evaluate(() => { window.__ttsCalls = []; });
    await page.locator('main button[aria-label$=" 1"]').first().click();

    await expect.poll(async () => (await audibleCalls(page)).length).toBeGreaterThan(0);
    const [call] = await audibleCalls(page);
    expect(call.volume).toBeCloseTo(0.3, 2);
  });
});
