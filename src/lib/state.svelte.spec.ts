import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ATTEMPT_LOG_KEY } from './learning/drills';
import { resetSynth } from './audio';
import { createPracticeState } from './state.svelte';

const originalAudioContext = window.AudioContext;
const originalWebkitAudioContext = (
	window as typeof window & { webkitAudioContext?: typeof AudioContext }
).webkitAudioContext;

function attemptLog(): Array<Record<string, unknown>> {
	return JSON.parse(localStorage.getItem(ATTEMPT_LOG_KEY) ?? '[]') as Array<
		Record<string, unknown>
	>;
}

function disableAudioContext(): void {
	Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
	Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined });
}

function restoreAudioContext(): void {
	Object.defineProperty(window, 'AudioContext', {
		configurable: true,
		value: originalAudioContext
	});
	Object.defineProperty(window, 'webkitAudioContext', {
		configurable: true,
		value: originalWebkitAudioContext
	});
}

beforeEach(() => {
	vi.useRealTimers();
	localStorage.clear();
	sessionStorage.clear();
	resetSynth();
	disableAudioContext();
});

afterEach(() => {
	vi.useRealTimers();
	resetSynth();
	restoreAudioContext();
});

describe('practice state — drill conversion', () => {
	it('guess appends a complete AttemptEvent from the active prompt', () => {
		const state = createPracticeState('state-event');
		state.play();
		const prompt = state.currentPrompt!;

		state.guess(prompt.pitchClass);

		expect(attemptLog()).toHaveLength(1);
		expect(attemptLog()[0]).toMatchObject({
			version: 1,
			drillId: 'note-trainer',
			promptId: prompt.promptId,
			answer: prompt.pitchClass,
			correctAnswer: prompt.pitchClass,
			correct: true,
			pitchClass: prompt.pitchClass,
			octave: prompt.octave,
			timbre: prompt.timbre,
			frequencyHz: prompt.frequencyHz,
			referenceAvailable: false,
			stimulusType: 'synthesized'
		});
		expect(typeof attemptLog()[0].sessionId).toBe('string');
		expect(typeof attemptLog()[0].timestamp).toBe('number');
		expect(typeof attemptLog()[0].responseTimeMs).toBe('number');
	});

	it('guess does nothing outside the guessing phase', () => {
		const state = createPracticeState('state-outside-guessing');

		state.guess(0);

		expect(attemptLog()).toEqual([]);
		expect(state.phase).toBe('idle');
		expect(state.session.total).toBe(0);

		state.play();
		const answer = state.currentPrompt!.pitchClass;
		state.guess(answer);
		state.guess((answer + 1) % 12);

		expect(attemptLog()).toHaveLength(1);
		expect(state.session.total).toBe(1);
	});

	it('multiple guesses grow the attempt log and update scores through the converted path', () => {
		const state = createPracticeState('state-score-integration');

		state.play();
		const first = state.currentPrompt!;
		state.guess(first.pitchClass);
		state.play();
		const second = state.currentPrompt!;
		state.guess((second.pitchClass + 1) % 12);

		expect(attemptLog().map((event) => event.correct)).toEqual([true, false]);
		expect(state.session).toMatchObject({ total: 2, correct: 1, streak: 0, best: 1 });
		expect(state.allTime).toMatchObject({ total: 2, correct: 1, streak: 0, best: 1 });
	});

	it('destroy clears a pending auto-advance timer', () => {
		vi.useFakeTimers();
		const state = createPracticeState('state-destroy');
		state.play();
		const round = state.round;

		state.guess(state.currentPrompt!.pitchClass);
		state.destroy();
		vi.advanceTimersByTime(1600);

		expect(state.phase).toBe('revealed');
		expect(state.round).toBe(round);
	});
});
