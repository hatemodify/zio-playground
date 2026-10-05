import { test, expect, type Page, type Locator } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false, voiceEnabled: false }, version: 1 })));
});

async function startGame(page: Page, difficulty = '처음 해요') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games/maze');
  await page.getByRole('button', { name: difficulty }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await expect(page.locator('svg[data-maze]')).toBeVisible();
}

/** Reads the board's geometry so cell indices can be turned into screen coordinates. */
async function readBoard(svg: Locator) {
  const box = (await svg.boundingBox())!;
  const size = Number(await svg.getAttribute('data-size'));
  const view = Number(await svg.getAttribute('data-view'));
  const cell = Number(await svg.getAttribute('data-cell'));
  const pad = Number(await svg.getAttribute('data-pad'));
  const solution = JSON.parse((await svg.getAttribute('data-solution'))!) as number[];
  const walls = JSON.parse((await svg.getAttribute('data-walls'))!) as number[];
  const center = (index: number) => ({
    x: box.x + ((pad + ((index % size) + 0.5) * cell) / view) * box.width,
    y: box.y + ((pad + (Math.floor(index / size) + 0.5) * cell) / view) * box.height,
  });
  return { size, solution, walls, center };
}

/** Drags the rabbit along the whole solution in one stroke. */
async function solveMaze(page: Page) {
  const svg = page.locator('svg[data-maze]');
  const { solution, center } = await readBoard(svg);
  const first = center(solution[0]);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const index of solution.slice(1)) {
    const point = center(index);
    await page.mouse.move(point.x, point.y, { steps: 3 });
  }
  await page.mouse.up();
  await expect(svg).toHaveAttribute('data-solved', 'true');
}

test('the intro explains the game and starting shows a maze with the rabbit at the entrance', async ({ page }) => {
  await page.goto('/games/maze');
  await expect(page.getByRole('heading', { name: '미로 찾기' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '토끼가 당근을 찾고 있어요!' })).toBeVisible();
  await expect(page.getByText('5×5 미로 · 3개')).toBeVisible();
  await page.getByRole('button', { name: '자신 있어요' }).click();
  await expect(page.getByText('9×9 미로 · 3개')).toBeVisible();
  await page.getByRole('button', { name: '같이 시작하기' }).click();

  const svg = page.locator('svg[data-maze]');
  await expect(svg).toBeVisible();
  await expect(svg).toHaveAttribute('data-size', '9');
  await expect(svg).toHaveAttribute('data-path-length', '1');
  await expect(svg).toHaveAttribute('data-current', '0');
  await expect(svg.locator('image[data-role="rabbit"]')).toHaveCount(1);
  await expect(svg.locator('image[data-role="carrot"]')).toHaveCount(1);
  await expect(page.getByText('1 / 3 탐험')).toBeVisible();
  const { walls, size } = await readBoard(svg);
  // A perfect maze: every cell was reached, so none is still boxed in on all four sides.
  expect(walls).toHaveLength(size * size);
  expect(walls.every((wall) => wall !== 15)).toBe(true);
});

test('dragging from the rabbit into an open neighbour extends the path, and 다시 그리기 clears it', async ({ page }) => {
  await startGame(page);
  const svg = page.locator('svg[data-maze]');
  const { solution, center } = await readBoard(svg);
  const [start, next] = [center(solution[0]), center(solution[1])];

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(next.x, next.y, { steps: 4 });
  await page.mouse.up();
  await expect(svg).toHaveAttribute('data-path-length', '2');
  await expect(svg).toHaveAttribute('data-current', String(solution[1]));

  // Dragging back onto the start pops the step again.
  await page.mouse.move(next.x, next.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y, { steps: 4 });
  await page.mouse.up();
  await expect(svg).toHaveAttribute('data-path-length', '1');

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(next.x, next.y, { steps: 4 });
  await page.mouse.up();
  await expect(svg).toHaveAttribute('data-path-length', '2');
  await page.getByRole('button', { name: '다시 그리기' }).click();
  await expect(svg).toHaveAttribute('data-path-length', '1');
  await expect(svg).toHaveAttribute('data-current', '0');
});

test('tapping moves one step, but never through a wall', async ({ page }) => {
  await startGame(page);
  const svg = page.locator('svg[data-maze]');
  const { size, solution, walls, center } = await readBoard(svg);
  const DIRS = [{ bit: 1, dr: -1, dc: 0 }, { bit: 2, dr: 0, dc: 1 }, { bit: 4, dr: 1, dc: 0 }, { bit: 8, dr: 0, dc: -1 }];

  // Walk the solution by taps until a cell with a walled-off neighbour inside the board turns up.
  for (let step = 0; step < solution.length; step++) {
    const cell = solution[step];
    if (step > 0) {
      await page.mouse.click(center(cell).x, center(cell).y);
      await expect(svg).toHaveAttribute('data-current', String(cell));
      await expect(svg).toHaveAttribute('data-path-length', String(step + 1));
    }
    const r = Math.floor(cell / size), c = cell % size;
    const blocked = DIRS.find((dir) => walls[cell] & dir.bit && r + dir.dr >= 0 && c + dir.dc >= 0 && r + dir.dr < size && c + dir.dc < size);
    if (!blocked) continue;
    const behindWall = (r + blocked.dr) * size + c + blocked.dc;
    await page.mouse.click(center(behindWall).x, center(behindWall).y);
    await expect(svg).toHaveAttribute('data-current', String(cell));
    await expect(svg).toHaveAttribute('data-path-length', String(step + 1));
    return;
  }
  throw new Error('expected at least one inner wall along the solution');
});

test('solving all three mazes finishes the run with a reward', async ({ page }) => {
  await startGame(page);
  await solveMaze(page);
  await expect(page.getByText('당근을 찾았어요!')).toBeVisible();
  await expect(page.getByText('2 / 3 탐험')).toBeVisible();
  await expect(page.locator('svg[data-maze]')).toHaveAttribute('data-path-length', '1');
  await solveMaze(page);
  await expect(page.getByText('3 / 3 탐험')).toBeVisible();
  await solveMaze(page);

  await expect(page.getByRole('heading', { name: '미로를 모두 통과했어요!' })).toBeVisible();
  await expect(page.getByText('토끼가 당근을 3개 찾았어요.')).toBeVisible();
  await expect(page.getByText('게임 클리어!')).toBeVisible();
  await expect(page.getByText('길을 잘 찾아 토끼를 집까지 데려다줬어요!')).toBeVisible();
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification') ?? '{"state":{"gameRecords":[]}}').state.gameRecords);
  expect(records.filter((record: { gameId: string }) => record.gameId === 'maze')).toHaveLength(1);
  expect(records[0]).toMatchObject({ gameId: 'maze', score: 3, stars: 3 });

  await page.getByRole('button', { name: '다시 놀기' }).click();
  await expect(page.getByRole('button', { name: '같이 시작하기' })).toBeVisible();
});

test('the solution route really is walkable: every consecutive pair is adjacent and unwalled', async ({ page }) => {
  await startGame(page, '할 수 있어요');
  const svg = page.locator('svg[data-maze]');
  const { size, solution, walls } = await readBoard(svg);
  expect(size).toBe(7);
  expect(solution[0]).toBe(0);
  expect(solution[solution.length - 1]).toBe(size * size - 1);
  for (let i = 1; i < solution.length; i++) {
    const [from, to] = [solution[i - 1], solution[i]];
    const dr = Math.floor(to / size) - Math.floor(from / size), dc = (to % size) - (from % size);
    expect(Math.abs(dr) + Math.abs(dc)).toBe(1);
    const bit = dr === -1 ? 1 : dc === 1 ? 2 : dr === 1 ? 4 : 8;
    expect(walls[from] & bit).toBe(0);
  }
});
