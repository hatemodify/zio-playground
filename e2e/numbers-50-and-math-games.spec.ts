import { test, expect, type Page } from '@playwright/test';

const SETTINGS = {
  state: { sfxEnabled: false, ttsSpeed: 0.8, volume: 0.8, onboarded: true, dailyTimeLimit: 30 },
  version: 1,
};

async function seedSettings(page: Page): Promise<void> {
  await page.addInitScript((settings) => {
    localStorage.setItem('kidsedu-settings', JSON.stringify(settings));
  }, SETTINGS);
}

/** "3 / 10" in the game header. */
async function questionNumber(page: Page): Promise<string | undefined> {
  const text = await page.locator('main').innerText();
  return text.match(/(\d+) \/ 10/)?.[1];
}

test.describe('Numbers up to 50', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page); });

  test('numbers list shows all 50 cards', async ({ page }) => {
    await page.goto('/numbers');
    await expect(page.getByText('숫자 놀이')).toBeVisible();

    const cards = page.locator('main .grid > div');
    await expect(cards).toHaveCount(50);
    await expect(page.getByText('0/50')).toBeVisible();
  });

  test('number 50 is reachable and reads as 쉰 / Fifty', async ({ page }) => {
    await page.goto('/numbers/50');
    const main = page.locator('main');
    await expect(main).toContainText('쉰');
    await expect(main).toContainText('Fifty');
  });

  test('two-digit numbers use native Korean count words', async ({ page }) => {
    await page.goto('/numbers/23');
    await expect(page.locator('main')).toContainText('스물셋');
    await expect(page.locator('main')).toContainText('Twenty-Three');
  });
});

test.describe('Addition game', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page); });

  test('correct answer advances, wrong answer does not', async ({ page }) => {
    await page.goto('/games/addition');
    await expect(page.getByRole('math')).toBeVisible();

    const label = (await page.getByRole('math').getAttribute('aria-label')) ?? '';
    const [, a, b] = label.match(/(\d+) 더하기 (\d+)/)!.map(Number);
    const answer = a + b;

    expect(await questionNumber(page)).toBe('1');

    // A wrong option leaves the child on the same question.
    const wrong = await page.evaluate((correct) => {
      const options = [...document.querySelectorAll('main button[aria-label^="정답"]')]
        .map((el) => Number(el.getAttribute('aria-label')!.replace('정답 ', '')));
      return options.find((v) => v !== correct)!;
    }, answer);

    await page.locator(`main button[aria-label="정답 ${wrong}"]`).click();
    await page.waitForTimeout(900);
    expect(await questionNumber(page)).toBe('1');

    await page.locator(`main button[aria-label="정답 ${answer}"]`).click();
    await expect.poll(() => questionNumber(page)).toBe('2');
  });
});

test.describe('Number compare game', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page); });

  test('picking the number the prompt asks for advances', async ({ page }) => {
    await page.goto('/games/number-compare');
    await expect(page.locator('main button[aria-label^="숫자 "]').first()).toBeVisible();

    for (const expected of ['2', '3']) {
      const { prompt, numbers } = await page.evaluate(() => ({
        prompt: document.querySelector('main')!.innerText,
        numbers: [...document.querySelectorAll('main button[aria-label^="숫자 "]')]
          .map((el) => Number(el.getAttribute('aria-label')!.slice(3))),
      }));

      // The prompt flips between bigger and smaller from question to question.
      const wantsBigger = prompt.includes('더 큰 수');
      const target = wantsBigger ? Math.max(...numbers) : Math.min(...numbers);

      await page.locator(`main button[aria-label="숫자 ${target}"]`).first().click();
      await expect.poll(() => questionNumber(page)).toBe(expected);
    }
  });
});

test.describe('Number order game', () => {
  test.beforeEach(async ({ page }) => { await seedSettings(page); });

  test('filling the blank from the sequence rule advances', async ({ page }) => {
    await page.goto('/games/number-order');
    await expect(page.getByRole('listitem').first()).toBeVisible();

    for (const expected of ['2', '3']) {
      const cells = await page
        .getByRole('listitem')
        .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')!));

      const values = cells.map((c) => (c === '빈칸' ? null : Number(c)));
      const blankIndex = values.indexOf(null);
      const known = values
        .map((v, i) => [i, v] as const)
        .filter((entry): entry is readonly [number, number] => entry[1] !== null);

      const step = (known[1][1] - known[0][1]) / (known[1][0] - known[0][0]);
      const answer = known[0][1] + step * (blankIndex - known[0][0]);

      await page.locator(`main button[aria-label="숫자 ${answer}"]`).first().click();
      await expect.poll(() => questionNumber(page)).toBe(expected);
    }
  });
});
