import { expect, test } from '@playwright/test';

test('scheduler-smoke redirects to the home page in production', async ({ page }) => {
	const response = await page.request.get('/scheduler-smoke', { maxRedirects: 0 });

	expect(response.status()).toBe(307);
	expect(response.headers().location).toBe('/');
});
