import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false, voiceEnabled: false }, version: 1 })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function savedRecords(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('kidsedu-gamification') ?? '{"state":{"gameRecords":[]}}').state.gameRecords);
}

async function start(page: Page, mode: '바늘 맞추기' | '시계 읽기' | '마음껏 돌리기', difficulty = '처음 해요') {
  await page.goto('/games/clock');
  await page.getByRole('button', { name: difficulty }).click();
  await page.getByRole('button', { name: mode }).click();
  await page.getByRole('button', { name: '같이 시작하기' }).click();
  await page.locator('[data-clock]').waitFor();
}

/** Speaker buttons only render with voice on; this runs after the default init script, so it wins. */
const withVoice = (page: Page) => page.addInitScript(() => localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false, voiceEnabled: true }, version: 1 })));

const clock = (page: Page) => page.locator('[data-clock]');
const timeOf = async (page: Page) => Number(await clock(page).getAttribute('data-time'));

/** Grabs a hand by its knob and turns it clockwise by `degrees`, the way a finger would. */
async function turnHand(page: Page, hand: 'hour' | 'minute', degrees: number) {
  const face = clock(page);
  const box = (await face.boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2, radius = box.width / 2;
  const total = await timeOf(page);
  const from = (hand === 'minute' ? (total % 60) * 6 : total / 2) * Math.PI / 180;
  const reach = hand === 'minute' ? 0.6 : 0.38;
  await page.mouse.move(cx + Math.sin(from) * radius * reach, cy - Math.cos(from) * radius * reach);
  await page.mouse.down();
  const steps = Math.max(2, Math.ceil(Math.abs(degrees) / 10));
  for (let index = 1; index <= steps; index++) {
    const angle = from + (degrees * index / steps) * Math.PI / 180;
    await page.mouse.move(cx + Math.sin(angle) * radius * reach, cy - Math.cos(angle) * radius * reach);
  }
  await expect(face).toHaveAttribute('data-dragging', hand);
  await page.mouse.up();
  await expect(face).not.toHaveAttribute('data-dragging', hand);
}

/** Turns the hands to the round's target with the nudge buttons and checks. */
async function solveSetRound(page: Page) {
  const target = Number(await page.locator('[data-target]').getAttribute('data-target'));
  const current = await timeOf(page);
  const hours = (((target - current) / 60) % 12 + 12) % 12;
  for (let index = 0; index < hours; index++) await page.getByRole('button', { name: '1시간 더' }).click();
  await expect(clock(page)).toHaveAttribute('data-time', String(target));
  await page.getByRole('button', { name: '확인' }).click();
}

test.describe('시계 보기', () => {
  test('the intro lists the three ways to play and shows the first 바늘 맞추기 round', async ({ page }) => {
    await page.goto('/games/clock');
    await expect(page.getByRole('heading', { name: '똑딱똑딱 시계 나라' })).toBeVisible();
    await expect(page.getByText('6문제 · 정각만 · 시간 제한 없음')).toBeVisible();
    const modes = page.getByRole('group', { name: '놀이 고르기' }).getByRole('button');
    await expect(modes).toHaveText([/^바늘 맞추기/, /^시계 읽기/, /^마음껏 돌리기/]);
    await expect(modes.first()).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '같이 시작하기' }).click();
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '0');
    await expect(page.getByText('이 시간으로 맞춰요')).toBeVisible();
    await expect(clock(page)).toHaveAttribute('data-minute', '0');
    // Hours only in easy mode: the minute hand has no knob and no minute nudges.
    await expect(page.locator('.clock-hand-minute .clock-knob')).toHaveCount(0);
    await expect(page.getByRole('group', { name: '바늘 돌리기' }).getByRole('button')).toHaveText(['−1시간', '+1시간']);
    await expect(page.locator('[data-readout]')).toHaveAttribute('data-readout', await clock(page).getAttribute('data-time') ?? '');
  });

  test('dragging the hands turns them, snapping to the difficulty step', async ({ page }) => {
    await start(page, '바늘 맞추기', '할 수 있어요');
    const before = await timeOf(page);
    // Half a turn of the minute hand is 30 minutes.
    await turnHand(page, 'minute', 180);
    await expect(clock(page)).toHaveAttribute('data-time', String((before + 30) % 720));
    // Two hour marks of the hour hand is two hours; the minutes stay.
    await turnHand(page, 'hour', 60);
    await expect(clock(page)).toHaveAttribute('data-time', String((before + 150) % 720));
    await expect(page.locator('[data-readout]')).toHaveAttribute('data-readout', String((before + 150) % 720));
    await expect(clock(page)).toHaveAttribute('aria-label', /^시계 \d+시( 30분)?$/);
  });

  test('a wrong time gets a hint about the hands and keeps the round', async ({ page }) => {
    await start(page, '바늘 맞추기');
    const target = Number(await page.locator('[data-target]').getAttribute('data-target'));
    if (await timeOf(page) === target) await page.getByRole('button', { name: '1시간 더' }).click();
    await page.getByRole('button', { name: '확인' }).click();
    await expect(page.getByRole('status')).toHaveText(/^지금은 \d+시이에요\. 짧은 바늘이 \d+[을를] 가리켜야 해요\.$/);
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '0');
    await expect(page.locator('[data-target]')).toHaveAttribute('data-target', String(target));
  });

  test('setting every time wins the round, reveals the answer and saves one record', async ({ page }) => {
    test.setTimeout(60000);
    await start(page, '바늘 맞추기');
    for (let round = 0; round < 6; round++) {
      await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', String(round));
      await solveSetRound(page);
      await expect(page.locator('.clock-reveal')).toBeVisible();
      await expect(page.getByRole('status')).toHaveText(/^딩동! \d+시, [가-힣 ]+ 시 정각이에요\.$/);
    }
    await expect(page.getByRole('heading', { name: '게임 클리어!' })).toBeVisible();
    await page.getByRole('button', { name: '탭하여 계속하기' }).click();
    await expect(page.getByRole('heading', { name: '시계를 모두 맞혔어요!' })).toBeVisible();
    expect((await savedRecords(page))[0]).toMatchObject({ gameId: 'clock', category: 'numbers', score: 6, stars: 3 });
    await page.getByRole('button', { name: '다시 놀기' }).click();
    await expect(page.getByRole('button', { name: '같이 시작하기' })).toBeVisible();
    expect(await savedRecords(page)).toHaveLength(1);
  });

  test('시계 읽기 offers three answers at first and four later, and only the right one advances', async ({ page }) => {
    await start(page, '시계 읽기');
    const options = page.getByRole('group', { name: '답 고르기' }).getByRole('button');
    await expect(options).toHaveCount(3);
    await expect(page.locator('[data-correct="true"]')).toHaveCount(1);
    await expect(page.locator('[data-readout]')).toHaveCount(0);
    await page.locator('[data-correct="false"]').first().click();
    await expect(page.getByRole('status')).toHaveText(/아니에요\. 짧은 바늘부터 다시 볼까요\?$/);
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '0');
    await page.locator('[data-correct="true"]').click();
    await expect(page.locator('.clock-reveal')).toBeVisible();
    await expect(page.getByLabel('탐험 진행')).toHaveAttribute('value', '1');

    await start(page, '시계 읽기', '할 수 있어요');
    await expect(options).toHaveCount(4);
    await expect(page.locator('[data-correct="true"]')).toHaveText(/^\d+시( 30분)?$/);
  });

  test('마음껏 돌리기 reads whatever the hands say and goes back to the intro', async ({ page }) => {
    await withVoice(page);
    await start(page, '마음껏 돌리기', '할 수 있어요');
    await expect(clock(page)).toHaveAttribute('data-time', '180');
    await expect(page.locator('[data-readout]')).toHaveText('3시세 시 정각3:00');
    await expect(page.getByLabel('탐험 진행')).toHaveCount(0);
    await turnHand(page, 'minute', 180);
    await expect(page.locator('[data-readout]')).toHaveText('3시 30분세 시 삼십 분3:30');
    await page.getByRole('button', { name: '30분 더' }).click();
    await expect(page.locator('[data-readout]')).toHaveText('4시네 시 정각4:00');
    await expect(page.getByRole('button', { name: '시간 듣기' })).toHaveAttribute('data-voice-clip', 'ko-clock-hour-4 ko-phrase-sharp');
    await page.getByRole('button', { name: '그만하기' }).click();
    await expect(page.getByRole('button', { name: '같이 시작하기' })).toBeVisible();
    expect(await savedRecords(page)).toHaveLength(0);
  });

  test('5분 단위 mode shows the minute ring, hides the readout and snaps to five minutes', async ({ page }) => {
    await withVoice(page);
    await start(page, '바늘 맞추기', '자신 있어요');
    await expect(page.getByText('10문제 · 5분 단위 · 시간 제한 없음')).toBeHidden();
    await expect(page.locator('.clock-minute-number')).toHaveText(['5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55', '60']);
    await expect(page.locator('[data-readout]')).toHaveCount(0);
    await expect(page.getByRole('group', { name: '바늘 돌리기' }).getByRole('button')).toHaveText(['−1시간', '+1시간', '−5분', '+5분']);
    const before = await timeOf(page);
    await turnHand(page, 'minute', 33);
    await expect(clock(page)).toHaveAttribute('data-time', String((before + 5) % 720));
    // The time to set is spoken from real clips: the hour, then "정각" or the minutes.
    const clip = await page.getByRole('button', { name: '시간 다시 듣기' }).getAttribute('data-voice-clip');
    expect(clip).toMatch(/^ko-clock-hour-\d+ (ko-phrase-sharp|ko-clock-minute-\d+)$/);
    for (const id of clip!.split(' ')) expect((await page.request.get(`/assets/audio/${id}.mp3`)).ok()).toBe(true);
  });
});
