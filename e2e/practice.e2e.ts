import { expect, test, type Page } from '@playwright/test';

/** The on-screen piano (scoped so its keys aren't confused with setup chips). */
function keyboard(page: Page) {
	return page.getByRole('group', { name: 'Piano keyboard' });
}

const viewports = [
	{ width: 375, height: 667 },
	{ width: 768, height: 1024 },
	{ width: 1280, height: 800 }
];

/**
 * Smoke test of one full guess round: load the app, start a round with Play,
 * guess a note on the keyboard, and confirm the answer is revealed, the score
 * updates, and the round auto-advances.
 */
for (const viewport of viewports) {
	test(`plays a round, reveals the answer, and advances the score at ${viewport.width}x${viewport.height}`, async ({
		page
	}) => {
		await page.clock.install();
		await page.setViewportSize(viewport);
		await page.goto('/');

		await expect(page.getByRole('heading', { name: 'Vibratone' })).toBeVisible();
		await expect(page.getByText('Press play to hear the first note')).toBeVisible();

		// Start the first round (also the audio-unlock gesture).
		await page.getByRole('button', { name: 'Play the note' }).click();

		await expect(page.getByText('Round 1')).toBeVisible();
		await expect(page.getByText('Identify the note you heard')).toBeVisible();

		// Guess by clicking an enabled key. In the chromatic default every key is
		// eligible, so C is always a valid guess.
		await keyboard(page).getByRole('button', { name: 'C', exact: true }).click();

		// The answer is revealed and the session score reflects one completed guess.
		await expect(page.getByText('Identify the note you heard')).toBeHidden();
		await expect(page.getByText(/^(Correct|Not quite)$/)).toBeVisible();
		await expect(page.locator('.score-bar')).toContainText('/1');

		await page.clock.fastForward(1600);
		await expect(page.getByText('Round 2')).toBeVisible();
	});
}

test('supports keyboard-only note guessing', async ({ page }) => {
	await page.goto('/');

	await page.getByRole('button', { name: 'Play the note' }).click();
	const cKey = keyboard(page).getByRole('button', { name: 'C', exact: true });
	for (let index = 0; index < 8; index++) {
		if (await cKey.evaluate((element) => document.activeElement === element)) break;
		await page.keyboard.press('Tab');
	}
	await expect(cKey).toBeFocused();
	await page.keyboard.press('Enter');

	await expect(page.getByText(/^(Correct|Not quite)$/)).toBeVisible();
});

test('replay is disabled until a note has played, then enabled', async ({ page }) => {
	await page.goto('/');

	const replay = page.getByRole('button', { name: 'Replay' });
	await expect(replay).toBeDisabled();

	await page.getByRole('button', { name: 'Play the note' }).click();
	await expect(replay).toBeEnabled();
});

test('persists the all-time score across a reload', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Play the note' }).click();
	await keyboard(page).getByRole('button', { name: 'C', exact: true }).click();
	await expect(page.getByText(/^(Correct|Not quite)$/)).toBeVisible();

	await page.reload();

	// The all-time score lives in localStorage and survives the reload; its stat
	// block shows "n/n", so a "/1" (or higher) confirms a guess persisted.
	await expect(page.locator('.score-bar')).toContainText('/1');
});

test('persists a non-default key selection across a reload', async ({ page }) => {
	await page.goto('/');

	// Switch to F major — a non-default key that changes the hint and the
	// eligible-note set. Reloading into this (not the default) proves settings
	// persistence rather than just defaults.
	await page.getByLabel('Key', { exact: true }).selectOption('F');
	await expect(page.getByText('Notes default to this scale; the tonic is marked.')).toBeVisible();

	await page.reload();

	await expect(page.getByLabel('Key', { exact: true })).toHaveValue('F');
	await expect(page.getByText('Notes default to this scale; the tonic is marked.')).toBeVisible();
});

test('records five AttemptEvent objects locally without outbound drill requests', async ({
	page
}) => {
	await page.clock.install();
	const outboundRequests: string[] = [];
	await page.route('**/*', async (route) => {
		const url = new URL(route.request().url());
		if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
			outboundRequests.push(route.request().url());
		}
		await route.continue();
	});
	await page.goto('/?seed=storage-check');
	await page.getByRole('button', { name: 'Play the note' }).click();

	for (let index = 0; index < 5; index++) {
		await keyboard(page).getByRole('button', { name: 'C', exact: true }).click();
		await expect(page.getByText(/^(Correct|Not quite)$/)).toBeVisible();
		await page.clock.fastForward(1600);
	}

	const attempts = await page.evaluate(() =>
		JSON.parse(localStorage.getItem('vibratone:attempts:v1') ?? '[]')
	);
	expect(attempts).toHaveLength(5);
	expect(attempts[0]).toEqual(
		expect.objectContaining({
			version: 1,
			drillId: 'note-trainer',
			referenceAvailable: true,
			stimulusType: 'synthesized'
		})
	);
	expect(outboundRequests).toEqual([]);
});
