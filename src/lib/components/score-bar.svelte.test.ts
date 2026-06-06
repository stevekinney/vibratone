import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Harness from './score-bar.test-harness.svelte';
import { createPracticeState } from '$lib/state.svelte';

beforeEach(() => {
	localStorage.clear();
	sessionStorage.clear();
});

/** Play one round and guess `correct`ly or not, building up a non-zero score. */
function scoreOne(state: ReturnType<typeof createPracticeState>, correct: boolean) {
	state.play();
	const pc = state.current!.pc;
	state.guess(correct ? pc : (pc + 1) % 12);
}

function scoreBarText(): string {
	return page.getByText('This session').element().closest('.score-bar')!.textContent ?? '';
}

describe('score-bar — display', () => {
	it('shows a dash for both scores before any attempts', async () => {
		const state = createPracticeState();
		render(Harness, { state });

		// An untouched score reads "—", not "0%", which would look like failure.
		expect(scoreBarText()).toContain('—');
		expect(scoreBarText()).toContain('0/0');
	});

	it('reflects a recorded guess in both stat blocks', async () => {
		const state = createPracticeState();
		scoreOne(state, true);
		render(Harness, { state });

		const text = scoreBarText();
		expect(text).toContain('100%');
		expect(text).toContain('1/1');
		expect(text).toContain('best 1'); // streak best is shown as text
	});

	it('exposes the streak as a single accessible label', async () => {
		const state = createPracticeState();
		scoreOne(state, true);
		render(Harness, { state });

		await expect.element(page.getByRole('img', { name: 'Streak: 1, best: 1' })).toBeInTheDocument();
	});
});

describe('score-bar — reset', () => {
	it('clears only the session score with "Session"', async () => {
		const state = createPracticeState();
		scoreOne(state, true);
		render(Harness, { state });

		await page.getByRole('button', { name: 'Reset session' }).click();

		expect(state.session.total).toBe(0);
		expect(state.allTime.total).toBe(1); // all-time untouched
	});

	it('clears both scores with "All time" (session is a subset of all time)', async () => {
		const state = createPracticeState();
		scoreOne(state, true);
		scoreOne(state, false);
		render(Harness, { state });

		await page.getByRole('button', { name: 'Reset all time' }).click();

		expect(state.allTime.total).toBe(0);
		expect(state.session.total).toBe(0);
		// The display zeroes out, confirming reactivity flows through the button.
		expect(scoreBarText()).toContain('0/0');
	});

	it('persists an all-time reset to storage', async () => {
		const state = createPracticeState();
		scoreOne(state, true);
		render(Harness, { state });

		await page.getByRole('button', { name: 'Reset all time' }).click();

		// A fresh state instance loads the cleared scores from storage.
		const reloaded = createPracticeState();
		expect(reloaded.session.total).toBe(0);
		expect(reloaded.allTime.total).toBe(0);
	});
});
