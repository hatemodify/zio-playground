import { test, expect, type Page } from '@playwright/test';

const productionUrl = process.env.RECOVERY_TEST_URL;
if (productionUrl) test.use({ baseURL: productionUrl, serviceWorkers: 'block' });

async function openHome(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('kidsedu-settings')) localStorage.setItem('kidsedu-settings', JSON.stringify({ state: { onboarded: true, sfxEnabled: false }, version: 1 }));
    if (!localStorage.getItem('recovery-test-record')) localStorage.setItem('recovery-test-record', 'keep-this-record');
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '게임', exact: true })).toBeVisible();
}

const gamesModule = productionUrl ? '**/assets/GamesListPage-*.js*' : '**/src/pages/GamesListPage.tsx*';

test('missing game module reloads the app once and opens the latest game list', async ({ page }) => {
  let documents = 0;
  let requests = 0;
  page.on('request', (request) => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++; });
  await page.route(gamesModule, async (route) => {
    requests++;
    if (requests === 1) await route.abort('failed'); else await route.continue();
  });
  await openHome(page);
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.getByRole('heading', { name: '미니 게임', exact: true })).toBeVisible();
  expect(documents).toBe(2);
  expect(requests).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem('recovery-test-record'))).toBe('keep-this-record');
  expect(await page.evaluate(() => sessionStorage.getItem('kidsedu-page-reload:/games'))).toBeNull();
});

test('persistent missing module stops after one reload, allows other menus and manual recovery', async ({ page }) => {
  let documents = 0;
  page.on('request', (request) => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++; });
  await page.route(gamesModule, (route) => route.abort('failed'));
  await openHome(page);
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.getByRole('heading', { name: '화면을 불러오지 못했어요' })).toBeVisible();
  expect(documents).toBe(2);
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await expect(page.getByRole('button', { name: /숫자 - \d+\/50 완료/ })).toBeVisible();
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.getByRole('heading', { name: '화면을 불러오지 못했어요' })).toBeVisible();
  expect(documents).toBe(2);
  await page.unroute(gamesModule);
  await page.getByRole('button', { name: '화면 다시 열기' }).click();
  await expect(page.getByRole('heading', { name: '미니 게임', exact: true })).toBeVisible();
  expect(documents).toBe(3);
});

test('offline import failures do not automatically reload and recover after reconnecting', async ({ page, context }) => {
  let documents = 0;
  page.on('request', (request) => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++; });
  await openHome(page);
  await context.setOffline(true);
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.getByRole('heading', { name: '화면을 불러오지 못했어요' })).toBeVisible();
  expect(documents).toBe(1);
  await context.setOffline(false);
  await page.getByRole('button', { name: '화면 다시 열기' }).click();
  await expect(page.getByRole('heading', { name: '미니 게임', exact: true })).toBeVisible();
});

test('unrelated module errors use the normal error screen without reloading', async ({ page }) => {
  let documents = 0;
  page.on('request', (request) => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++; });
  await page.route(gamesModule, (route) => route.fulfill({ contentType: 'text/javascript', body: 'throw new Error("A real application bug"); export default function Page() {}' }));
  await openHome(page);
  await page.getByRole('button', { name: '게임', exact: true }).click();
  await expect(page.getByRole('heading', { name: '앗, 문제가 생겼어요!' })).toBeVisible();
  expect(documents).toBe(1);
  await page.getByRole('button', { name: '홈', exact: true }).click();
  await expect(page.getByRole('button', { name: /숫자 - \d+\/50 완료/ })).toBeVisible();
});
