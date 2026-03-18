import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should show onboarding on first visit', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByText('안녕! 나는 또리야!')).toBeVisible();
    await expect(page.getByRole('button', { name: '시작하기' })).toBeVisible();
  });

  test('should complete onboarding with name input', async ({ page }) => {
    await page.goto('/onboarding');

    // Step 1: Welcome
    await page.getByRole('button', { name: '시작하기' }).click();

    // Step 2: Name input
    await expect(page.getByText('이름이 뭐야?')).toBeVisible();
    await page.getByPlaceholder('이름을 입력해줘').fill('지오');
    await page.getByRole('button', { name: '다음' }).click();

    // Step 3: Done
    await expect(page.getByText('반가워, 지오!')).toBeVisible();
    await page.getByRole('button', { name: '학습 시작!' }).click();

    // Should navigate to home
    await expect(page).toHaveURL('/');
  });

  test('should show error for empty name', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: '시작하기' }).click();

    // Button should be disabled when empty
    await expect(page.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  test('should enforce max 10 character name limit', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: '시작하기' }).click();

    const input = page.getByPlaceholder('이름을 입력해줘');
    await input.fill('이것은열글자보다긴이름입니다');
    await expect(input).toHaveAttribute('maxlength', '10');
  });
});
