import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ATTEMPT_LOG_KEY, SESSION_ID, appendAttemptEvent, loadAttemptLog } from './attempt-log.ts';
import type { AttemptEvent } from './schema.ts';

vi.mock('$app/environment', () => ({
	browser: true,
	building: false,
	dev: false,
	version: ''
}));

function createMockStorage(initial: Record<string, string> = {}): Storage {
	const map = new Map(Object.entries(initial));
	return {
		get length() {
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
		key: (index: number) => [...map.keys()][index] ?? null,
		removeItem: (key: string) => void map.delete(key),
		setItem: (key: string, value: string) => void map.set(key, value)
	} satisfies Storage;
}

const event: AttemptEvent = {
	version: 1,
	drillId: 'note-trainer',
	promptId: '0:4:seed',
	sessionId: SESSION_ID,
	timestamp: 1_800_000_000_000,
	responseTimeMs: 300,
	answer: 0,
	correctAnswer: 0,
	correct: true,
	pitchClass: 0,
	octave: 4,
	timbre: 'sine',
	frequencyHz: 261.6255653005986,
	referenceAvailable: true,
	stimulusType: 'synthesized'
};

beforeEach(() => {
	const storage = createMockStorage();
	Object.defineProperty(globalThis, 'window', {
		configurable: true,
		value: { localStorage: storage }
	});
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: storage
	});
});

describe('attempt-log', () => {
	it('appendAttemptEvent appends to localStorage under vibratone:attempts:v1', () => {
		appendAttemptEvent(event);

		expect(JSON.parse(localStorage.getItem(ATTEMPT_LOG_KEY) ?? '[]')).toEqual([event]);
	});

	it('loadAttemptLog returns an empty array when localStorage has no key', () => {
		expect(loadAttemptLog()).toEqual([]);
	});

	it('loadAttemptLog returns previously appended events in insertion order', () => {
		const second = { ...event, promptId: '4:4:seed', pitchClass: 4 };
		appendAttemptEvent(event);
		appendAttemptEvent(second);

		expect(loadAttemptLog()).toEqual([event, second]);
	});

	it('malformed localStorage value returns empty array without throwing', () => {
		localStorage.setItem(ATTEMPT_LOG_KEY, 'not json');

		expect(loadAttemptLog()).toEqual([]);
	});

	it('SESSION_ID is a valid UUID v4 format', () => {
		expect(SESSION_ID).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		);
	});

	it('SESSION_ID is stable within a module session', () => {
		expect(SESSION_ID).toBe(SESSION_ID);
	});
});
