import { describe, expect, it } from 'vitest';
import {
	MAX_OCTAVE,
	MIN_OCTAVE,
	buildPool,
	clamp,
	clampOctave,
	createPrompt,
	nearestOctave,
	normalizeOctaveRange,
	poolSize
} from './round.ts';

describe('buildPool', () => {
	it('produces one entry per pitch class per octave', () => {
		const pool = buildPool([0, 4, 7], 4, 5);
		expect(pool).toHaveLength(6);
		expect(pool).toContainEqual({ pc: 0, octave: 4 });
		expect(pool).toContainEqual({ pc: 7, octave: 5 });
	});

	it('returns an empty pool when no pitch classes are eligible', () => {
		expect(buildPool([], 4, 6)).toEqual([]);
	});

	it('deduplicates and normalizes pitch classes', () => {
		const pool = buildPool([0, 12, 0], 4, 4);
		expect(pool).toEqual([{ pc: 0, octave: 4 }]);
	});

	it('returns an empty pool when the octave range is inverted', () => {
		expect(buildPool([0], 6, 4)).toEqual([]);
	});
});

describe('poolSize', () => {
	it('multiplies eligible pitch classes by octave span', () => {
		expect(poolSize([0, 2, 4, 5, 7, 9, 11], 4, 4)).toBe(7);
		expect(poolSize([0, 2, 4, 5, 7, 9, 11], 4, 6)).toBe(21);
	});

	it('is zero with no eligible notes', () => {
		expect(poolSize([], 2, 6)).toBe(0);
	});

	it('counts distinct normalized pitch classes only', () => {
		expect(poolSize([0, 12], 4, 4)).toBe(1);
	});
});

describe('createPrompt', () => {
	it('returns null when the pool is empty', () => {
		expect(createPrompt({ eligiblePitchClasses: [], octaveLo: 4, octaveHi: 6 })).toBeNull();
	});

	it('returns the only pitch when the pool has one entry', () => {
		const prompt = createPrompt({ eligiblePitchClasses: [9], octaveLo: 4, octaveHi: 4 });
		expect(prompt).toEqual({ pc: 9, octave: 4 });
	});

	it('selects deterministically via the injected randomInt', () => {
		const prompt = createPrompt({
			eligiblePitchClasses: [0, 4, 7],
			octaveLo: 4,
			octaveHi: 4,
			randomInt: () => 1
		});
		expect(prompt).toEqual({ pc: 4, octave: 4 });
	});

	it('avoids repeating the previous pitch when alternatives exist', () => {
		const previous = { pc: 0, octave: 4 };
		const prompt = createPrompt({
			eligiblePitchClasses: [0, 4],
			octaveLo: 4,
			octaveHi: 4,
			previous,
			// Index into the filtered candidate list (previous removed).
			randomInt: () => 0
		});
		expect(prompt).toEqual({ pc: 4, octave: 4 });
	});

	it('repeats the previous pitch when it is the only option', () => {
		const previous = { pc: 0, octave: 4 };
		const prompt = createPrompt({
			eligiblePitchClasses: [0],
			octaveLo: 4,
			octaveHi: 4,
			previous
		});
		expect(prompt).toEqual({ pc: 0, octave: 4 });
	});

	it('clamps an out-of-bounds random index back into range', () => {
		const prompt = createPrompt({
			eligiblePitchClasses: [0, 4],
			octaveLo: 4,
			octaveHi: 4,
			randomInt: () => 99
		});
		expect(prompt).toEqual({ pc: 4, octave: 4 });
	});

	it('never returns the previous pitch across a full sweep of indices', () => {
		const previous = { pc: 4, octave: 4 };
		const eligible = [0, 4, 7];
		for (let index = 0; index < eligible.length; index++) {
			const prompt = createPrompt({
				eligiblePitchClasses: eligible,
				octaveLo: 4,
				octaveHi: 4,
				previous,
				randomInt: () => index
			});
			expect(prompt).not.toEqual(previous);
		}
	});
});

describe('clamp', () => {
	it('passes through in-range values', () => {
		expect(clamp(3, 0, 5)).toBe(3);
	});

	it('clamps below and above', () => {
		expect(clamp(-1, 0, 5)).toBe(0);
		expect(clamp(9, 0, 5)).toBe(5);
	});
});

describe('clampOctave', () => {
	it('rounds and clamps into the C2–C6 range', () => {
		expect(clampOctave(4.4)).toBe(4);
		expect(clampOctave(4.6)).toBe(5);
		expect(clampOctave(0)).toBe(MIN_OCTAVE);
		expect(clampOctave(99)).toBe(MAX_OCTAVE);
	});
});

describe('normalizeOctaveRange', () => {
	it('keeps an already-ordered pair', () => {
		expect(normalizeOctaveRange(3, 5)).toEqual([3, 5]);
	});

	it('swaps a reversed pair', () => {
		expect(normalizeOctaveRange(5, 3)).toEqual([3, 5]);
	});

	it('clamps both ends into range', () => {
		expect(normalizeOctaveRange(-2, 99)).toEqual([MIN_OCTAVE, MAX_OCTAVE]);
	});

	it('allows lo === hi', () => {
		expect(normalizeOctaveRange(4, 4)).toEqual([4, 4]);
	});
});

describe('nearestOctave', () => {
	it('snaps a fractional track position to the nearest stop', () => {
		expect(nearestOctave(3.2)).toBe(3);
		expect(nearestOctave(3.8)).toBe(4);
	});

	it('clamps positions beyond the track ends', () => {
		expect(nearestOctave(-5)).toBe(MIN_OCTAVE);
		expect(nearestOctave(20)).toBe(MAX_OCTAVE);
	});
});
