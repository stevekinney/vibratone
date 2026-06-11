import { describe, expect, it } from 'vitest';
import type { DrillConfig } from './schema.ts';
import { createSeededSession } from './seeded-session.ts';

const baseConfig: DrillConfig = {
	drillId: 'note-trainer',
	seed: 'daily-2026-06-11',
	eligiblePitchClasses: [0, 4, 7],
	octaveLo: 4,
	octaveHi: 5,
	timbre: 'sine'
};

describe('seeded-session', () => {
	it('identical seed yields identical prompt sequence', () => {
		expect(createSeededSession(baseConfig, 8)).toEqual(createSeededSession(baseConfig, 8));
	});

	it('different seeds yield different sequences', () => {
		expect(createSeededSession(baseConfig, 8)).not.toEqual(
			createSeededSession({ ...baseConfig, seed: 'other-seed' }, 8)
		);
	});

	it('no prompt repeats back-to-back when pool has alternatives', () => {
		const prompts = createSeededSession(baseConfig, 24);
		for (let index = 1; index < prompts.length; index++) {
			expect(`${prompts[index].pitchClass}:${prompts[index].octave}`).not.toBe(
				`${prompts[index - 1].pitchClass}:${prompts[index - 1].octave}`
			);
		}
	});

	it('every generated prompt has pitchClass within eligiblePitchClasses', () => {
		for (const prompt of createSeededSession(baseConfig, 16)) {
			expect(baseConfig.eligiblePitchClasses).toContain(prompt.pitchClass);
		}
	});

	it('every generated prompt has octave within [octaveLo, octaveHi]', () => {
		for (const prompt of createSeededSession(baseConfig, 16)) {
			expect(prompt.octave).toBeGreaterThanOrEqual(baseConfig.octaveLo);
			expect(prompt.octave).toBeLessThanOrEqual(baseConfig.octaveHi);
		}
	});

	it('returns empty array when eligiblePitchClasses is empty', () => {
		expect(createSeededSession({ ...baseConfig, eligiblePitchClasses: [] })).toEqual([]);
	});

	it('assigns a unique promptId to every generated prompt occurrence', () => {
		const prompts = createSeededSession(baseConfig, 64);

		expect(new Set(prompts.map((prompt) => prompt.promptId)).size).toBe(64);
	});

	it('honors the previous prompt across generated session batches', () => {
		const [prompt] = createSeededSession(baseConfig, 1, 64, { pc: 0, octave: 4 });

		expect(`${prompt.pitchClass}:${prompt.octave}`).not.toBe('0:4');
	});

	it('continues the seeded random stream across split batches', () => {
		const fullSession = createSeededSession(baseConfig, 128);
		const firstBatch = createSeededSession(baseConfig, 64);
		const lastPrompt = firstBatch[firstBatch.length - 1];
		const secondBatch = createSeededSession(baseConfig, 64, 64, {
			pc: lastPrompt.pitchClass,
			octave: lastPrompt.octave
		});

		expect([...firstBatch, ...secondBatch]).toEqual(fullSession);
	});
});
