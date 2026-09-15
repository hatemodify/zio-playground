import { test, expect, type Page } from '@playwright/test';

async function savedRecords(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification') ?? '{"state":{"gameRecords":[]}}').state.gameRecords);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 })));
});

async function startGame(page: Page, difficulty = '처음 해요') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games/daruma');
  await page.getByRole('button', { name: difficulty }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
}
async function clickTarget(page: Page) {
  const target = page.getByRole('listitem', { name: /지금 제거할 블록/ });
  await expect(target).toBeVisible();
  const color = await target.getAttribute('data-color');
  expect(color).toBeTruthy();
  await page.getByRole('button', { name: `${color} 버튼`, exact: true }).click();
}

async function clearStages(page: Page, initialBlocks: number) {
  let total = 0;
  const themes: string[] = [];
  for (let stage = 0; stage < 3; stage++) {
    await expect(page.getByLabel('스테이지 진행')).toContainText(`스테이지 ${stage + 1} / 3`);
    themes.push(await page.getByLabel('스테이지 진행').locator('strong').innerText());
    const count = Math.min(9, initialBlocks + stage);
    total += count;
    for (let index = 0; index < count; index++) {
      await clickTarget(page);
      await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(count - index - 1);
    }
    if (stage < 2) {
      await expect(page.getByRole('heading', { name: `스테이지 ${stage + 1} 성공!` })).toBeVisible();
      expect(await savedRecords(page)).toHaveLength(0);
      await page.getByRole('button', { name: '다음 스테이지' }).click();
      await expect(page.getByLabel('남은 기회 3번')).toBeVisible();
    }
  }
  expect(new Set(themes).size).toBe(3);
  return total;
}

for (const [difficulty, blocks] of [['처음 해요', 5], ['할 수 있어요', 7], ['자신 있어요', 9]] as const) {
  test(`달마치기 ${difficulty}: 같은 색 버튼으로 블록을 하나씩 제거하고 다시 시작한다`, async ({ page }) => {
    test.setTimeout(60000);
    await startGame(page, difficulty);
    await expect(page.getByRole('group', { name: '블록 색상 선택' })).toBeVisible();
    const total = await clearStages(page, blocks);
    await expect(page.getByRole('heading', { name: '달마치기 성공!' })).toBeVisible();
    expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'daruma', category: 'play', score: total, stars: 3 });
    await page.getByRole('button', { name: '탭하여 계속하기' }).click();
    await page.getByRole('button', { name: '다시 놀기' }).click();
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(blocks);
    expect(await savedRecords(page)).toHaveLength(1);
  });
}

test('틀린 색을 세 번 누르면 달마가 넘어지고 기록되지 않는다', async ({ page }) => {
  await startGame(page);
  const target = page.getByRole('listitem', { name: /지금 제거할 블록/ });
  const targetColor = await target.getAttribute('data-color');
  const wrongButton = page.getByRole('button', { name: targetColor === '빨강' ? '파랑 버튼' : '빨강 버튼', exact: true });
  for (let index = 0; index < 3; index++) {
    await wrongButton.click();
    if (index < 2) await expect(page.getByRole('status')).toContainText('같은 색');
  }
  await expect(page.getByRole('heading', { name: '다시 쌓으면 괜찮아요!' })).toBeVisible();
  await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(5);
  expect(await savedRecords(page)).toHaveLength(0);
  await page.getByRole('button', { name: '다시 쌓기', exact: true }).click();
  await expect(page.getByLabel('남은 기회 3번')).toBeVisible();
  await clickTarget(page);
  await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(4);
});

test('잠깐 쉬기는 색상 버튼과 블록 제거를 멈춘다', async ({ page }) => {
  await startGame(page);
  await page.getByRole('button', { name: '잠깐 쉬기' }).click();
  await expect(page.getByRole('button', { name: '이어서 하기' })).toBeVisible();
  const target = page.getByRole('listitem', { name: /지금 제거할 블록/ });
  const color = await target.getAttribute('data-color');
  await expect(page.getByRole('button', { name: `${color} 버튼`, exact: true })).toBeDisabled();
  await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(5);
  await page.getByRole('button', { name: '이어서 하기' }).click();
  await clickTarget(page);
  await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(4);
});

test('한 번 틀린 뒤 모두 맞히면 보상 점수가 줄어든다', async ({ page }) => {
  await startGame(page);
  const target = page.getByRole('listitem', { name: /지금 제거할 블록/ });
  const targetColor = await target.getAttribute('data-color');
  await page.getByRole('button', { name: targetColor === '빨강' ? '파랑 버튼' : '빨강 버튼', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('같은 색');
  const total = await clearStages(page, 5);
  await expect(page.getByRole('heading', { name: '달마치기 성공!' })).toBeVisible();
  expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'daruma', score: total - 1, stars: 3 });
});

test('카탈로그에서 달마치기를 열고 모바일 화면 안에 색상 버튼이 배치된다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games');
  await page.getByRole('button', { name: '톡! 톡! 달마치기', exact: true }).click();
  await page.getByRole('button', { name: '자신 있어요' }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await expect(page.getByRole('group', { name: '블록 색상 선택' })).toBeVisible();
  await expect(page.getByRole('button', { name: '빨강 버튼', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.locator('.daruma-stage img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.getByRole('img', { name: '달마 망치' })).toBeVisible();
  await page.screenshot({ path: '/tmp/edu-daruma-stages-mobile.png', fullPage: true });
});

test('different random draws change both the stage order and block sequence', async ({ browser }) => {
  const layouts: { theme: string; colors: (string | null)[] }[] = [];
  for (const randomValue of [0, 0.99]) {
    const context = await browser.newContext();
    await context.addInitScript((value) => {
      Math.random = () => value;
      localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 }));
    }, randomValue);
    const page = await context.newPage();
    await startGame(page);
    layouts.push({ theme: await page.getByLabel('스테이지 진행').innerText(), colors: await page.getByRole('list', { name: '남은 블록' }).getByRole('listitem').evaluateAll((items) => items.map((item) => item.getAttribute('data-color'))) });
    await context.close();
  }
  expect(layouts[0].theme).not.toBe(layouts[1].theme);
  expect(layouts[0].colors).not.toEqual(layouts[1].colors);
});

test('keyboard hit swings the hammer and ignores repeated input during its animation', async ({ page }) => {
  await page.goto('/games/daruma');
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  const color = await page.getByRole('listitem', { name: /지금 제거할 블록/ }).getAttribute('data-color');
  const key = String(['빨강', '파랑', '초록', '노랑', '보라', '분홍'].indexOf(color!) + 1);
  await page.keyboard.down(key);
  await page.keyboard.down(key);
  await page.keyboard.up(key);
  const hammer = page.getByRole('img', { name: '달마 망치' });
  await expect(hammer).toHaveAttribute('data-striking', 'true');
  await expect(page.getByRole('list', { name: '남은 블록' }).getByRole('listitem')).toHaveCount(4);
  const before = await hammer.evaluate((element) => getComputedStyle(element).transform);
  await expect.poll(() => hammer.evaluate((element) => getComputedStyle(element).transform), { intervals: [16, 32, 32] }).not.toBe(before);
  await page.getByRole('link', { name: '게임 목록', exact: true }).click();
  expect(await savedRecords(page)).toHaveLength(0);
});
