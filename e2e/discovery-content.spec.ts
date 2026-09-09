import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false, volume: 0.8 }, version: 1 }));
  });
});
async function gameState(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification')!).state);
}

test('catalog has illustrated additions and no audio-first games', async ({ page }) => {
  await page.goto('/games');
  await page.getByRole('button', { name: '새로운 탐험', exact: true }).click();
  for (const title of ['꼬마 장보기', '동물 탐험대', '그림 단어 공방', '규칙 정원', '반짝 우주 비행', '상상 마을 놀이터', '출동! 탈것 마을', '차곡차곡 햄버거 가게']) {
    await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: '풍선 터뜨리기', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '빠르기 도전', exact: true })).toHaveCount(0);
  await expect.poll(() => page.locator('main img').evaluateAll((images) => images.every((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
});

for (const id of ['quiz', 'speak', 'balloon', 'speed-quiz']) {
  test(`retired ${id} URL returns to games`, async ({ page }) => {
    await page.goto(`/games/${id}`);
    await expect(page).toHaveURL('/games');
  });
}

test('shopping teaches quantity, retries errors, records once before reward dismissal', async ({ page }) => {
  await page.goto('/games/little-market');
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await page.getByRole('button', { name: '주문 확인' }).click();
  await expect(page.getByRole('status')).toContainText('조금 더 담아');
  await expect(page.getByText('1 / 6 탐험')).toBeVisible();
  for (let i = 0; i < 6; i++) {
    const amount = i % 5 + 1;
    for (let j = 0; j < amount; j++) await page.getByRole('button', { name: '한 개 담기', exact: true }).click();
    await page.getByRole('button', { name: '주문 확인' }).click();
    await expect(page.getByRole('status')).toContainText('잘 찾았어요');
    await page.getByRole('button', { name: i === 5 ? '탐험 마치기' : '다음 탐험', exact: true }).click();
  }
  await expect(page.getByText('탐험을 마쳤어요!')).toBeVisible();
  const saved = await gameState(page);
  expect(saved.gameRecords).toHaveLength(1);
  expect(saved.gameRecords[0]).toMatchObject({ gameId: 'little-market', score: 5, stars: 2 });
  expect(saved.stickers).toContain('sticker-special-firstgame');
  expect(saved.totalStars).toBe(2);
  await expect(page.getByText('탭하여 계속하기')).toBeVisible();
  await page.getByText('탭하여 계속하기').click();
  expect((await gameState(page)).gameRecords).toHaveLength(1);
  await page.reload();
  expect((await gameState(page)).gameRecords).toHaveLength(1);
});

test('hard market combines two groups', async ({ page }) => {
  await page.goto('/games/little-market');
  await page.getByRole('button', { name: /자신 있어요/ }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await expect(page.getByText(/2 \+ 1개/)).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '한 개 담기', exact: true }).click();
  await page.getByRole('button', { name: '주문 확인' }).click();
  await expect(page.getByRole('status')).toContainText('2 + 1 = 3');
});

test('picture words supports English and repeated letter tiles', async ({ page }) => {
  await page.goto('/games/picture-words');
  await page.getByRole('button', { name: 'English 단어' }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  const word = (await page.locator('.scene-meadow p').innerText()).trim();
  for (const letter of word) await page.getByRole('button', { name: `글자 ${letter}`, exact: true }).and(page.locator(':enabled')).first().click();
  await page.getByRole('button', { name: '단어 확인' }).click();
  await expect(page.getByRole('status')).toContainText('잘 찾았어요');
});

test('animal classification explains biological features', async ({ page }) => {
  await page.goto('/games/animal-families');
  await page.getByRole('button', { name: '할 수 있어요', exact: false }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  const name = await page.locator('.scene-meadow img').getAttribute('alt');
  const group = ['앵무새', '펭귄', '오리', '부엉이'].includes(name!) ? '새' : ['뱀', '악어'].includes(name!) ? '파충류' : '포유류';
  const choices = page.locator('.picture-choice');
  await choices.filter({ has: page.getByText(group, { exact: true }) }).click();
  await expect(page.getByRole('status')).toContainText(`${group}에 속해요`);
});

test('pattern has a consistent repeated unit', async ({ page }) => {
  await page.goto('/games/pattern-garden');
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  const src = await page.getByLabel('그림 규칙').locator('img').first().getAttribute('src');
  await page.locator('.picture-choice').filter({ has: page.locator(`img[src="${src}"]`) }).click();
  await expect(page.getByRole('status')).toContainText('순서가 반복돼요');
});

test('playground places animals, undoes, persists and completes once', async ({ page }) => {
  await page.goto('/games/animal-playground');
  await page.getByRole('button', { name: '동물 20종', exact: true }).click();
  for (let i = 1; i <= 3; i++) await page.getByRole('button', { name: `${i}번 자리 비어 있음`, exact: true }).click();
  await page.getByRole('button', { name: '바닷가', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '1번 자리 토끼', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '바닷가', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '모두 지우기', exact: true }).click();
  await expect(page.getByRole('button', { name: '작품 완성', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '되돌리기', exact: true }).click();
  await page.getByRole('button', { name: '작품 완성', exact: true }).click();
  await page.getByText('탭하여 계속하기').click();
  await page.getByRole('button', { name: '작품 완성', exact: true }).click();
  expect((await gameState(page)).gameRecords).toHaveLength(1);
});

test('rocket can start, move, pause and return to list', async ({ page }) => {
  await page.goto('/games/rocket-ride');
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  const field = page.getByRole('application');
  await field.press('ArrowLeft');
  await expect(page.getByRole('button', { name: '← 왼쪽', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '잠깐 쉬기', exact: true }).click();
  await expect(page.getByRole('button', { name: '계속 비행하기' })).toBeVisible();
  await page.getByRole('link', { name: '게임 목록' }).click();
  await expect(page).toHaveURL('/games');
});

test('home uses 50 as the number total and shows completed count accurately', async ({ page }) => {
  await page.addInitScript(() => {
    const items = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`number-${i + 1}`, { id: `number-${i + 1}`, category: 'numbers', character: String(i + 1), tracingStage: 3, completed: true, attempts: 1, bestScore: 0, lastPracticedAt: null }]));
    localStorage.setItem('kidsedu-progress', JSON.stringify({ state: { items, nickname: '테스트' }, version: 1 }));
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '숫자 - 50/50 완료', exact: true })).toBeVisible();
  expect((await gameState(page)).stickers).toContain('sticker-num-trophy');
});

test('writing grants the learning milestone once, including after a revisit', async ({ page }) => {
  async function write() {
    await page.goto('/numbers/1');
    const canvas = page.locator('canvas').last();
    await canvas.waitFor();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down();
    await page.mouse.move(box.x + 50, box.y + 80, { steps: 4 }); await page.mouse.up();
    await page.getByRole('button', { name: '확인', exact: true }).click();
    await expect(page.getByText('잘했어!', { exact: true })).toBeVisible();
  }
  await write();
  expect((await gameState(page)).stickers).toContain('sticker-num-puppy');
  expect((await gameState(page)).totalStars).toBe(3);
  await write();
  expect((await gameState(page)).totalStars).toBe(3);
});

test('settings removes study limits and resets playground together with learning', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kidsedu-playground', JSON.stringify({ state: { scene: { theme: 'night', cells: Array(15).fill('rabbit') } }, version: 1 }));
  });
  await page.goto('/settings');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('span.text-4xl')).toHaveCount(2);
  const numbers = await dialog.locator('span.text-4xl').allTextContents();
  const answer = String(numbers.reduce((total, value) => total + Number(value.trim()), 0));
  for (const digit of answer) await dialog.getByRole('button', { name: digit, exact: true }).click();
  await expect(page.getByRole('switch', { name: '효과음 켜기/끄기' })).toBeVisible();
  await expect(page.getByText('학습 시간 제한', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '15분', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '데이터 초기화', exact: true }).click();
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(page).toHaveURL('/onboarding');
  const scene = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-playground')!).state.scene);
  expect(scene.cells.every((cell: unknown) => cell === null)).toBe(true);
});

test('counting the minimum quantity never hangs and the last point is rewarded', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/games/counting');
  for (let i = 1; i <= 8; i++) {
    await expect(page.getByText(`${i} / 8`, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '1', exact: true }).click();
    await page.clock.runFor(900);
  }
  const saved = await gameState(page);
  expect(saved.gameRecords).toHaveLength(1);
  expect(saved.gameRecords[0]).toMatchObject({ gameId: 'counting', score: 8, stars: 3 });
  expect(saved.totalStars).toBe(3);
});
