import { expect, test } from '@playwright/test';

test.describe('Podcast Stamps', () => {
	test('home page has expected h1', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).toHaveText('Podcast Stamps');
	});

	test('has transcript input textarea', async ({ page }) => {
		await page.goto('/');
		const textarea = page.locator('#transcript');
		await expect(textarea).toBeVisible();
	});

	test('generate button is disabled when textarea is empty', async ({ page }) => {
		await page.goto('/');
		const btn = page.getByRole('button', { name: /Generate/i });
		await expect(btn).toBeDisabled();
	});

	test('generate button is enabled after entering text', async ({ page }) => {
		await page.goto('/');
		const textarea = page.locator('#transcript');
		await textarea.fill('00:00:01 Hello world');
		const btn = page.getByRole('button', { name: /Generate/i });
		await expect(btn).toBeEnabled();
	});

	test('compact button is disabled when textarea is empty', async ({ page }) => {
		await page.goto('/');
		const btn = page.getByRole('button', { name: /Compact/i });
		await expect(btn).toBeDisabled();
	});

	test('compact button is enabled after entering text', async ({ page }) => {
		await page.goto('/');
		const textarea = page.locator('#transcript');
		await textarea.fill('00:00:01 Hello');
		const btn = page.getByRole('button', { name: /Compact/i });
		await expect(btn).toBeEnabled();
	});

	test('output section is hidden initially', async ({ page }) => {
		await page.goto('/');
		const output = page.locator('.output-section');
		await expect(output).toBeHidden();
	});

	test('subtitle is visible', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.subtitle')).toHaveText('Generate timestamped show notes from YouTube transcripts');
	});
});
