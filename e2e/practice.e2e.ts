import { expect, test, type Page } from '@playwright/test';

/** The on-screen piano (scoped so its keys aren't confused with setup chips). */
function keyboard(page: Page) {
	return page.getByRole('group', { name: 'Piano keyboard' });
}

/**
 * Smoke test of one full guess round: load the app, start a round with Play,
 * guess a note on the keyboard, and confirm the answer is revealed, the score
 * updates, and the round auto-advances.
 */
test('plays a round, reveals the answer, and advances the score', async ({ page }) => {
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

	// The round auto-advances to round 2 within the auto-advance window.
	await expect(page.getByText('Round 2')).toBeVisible({ timeout: 4000 });
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
