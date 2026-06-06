/**
 * Pure music-theory helpers for Vibratone.
 *
 * Pitch classes are integers 0–11 mapping to C…B. Everything here is
 * side-effect free and framework-agnostic so it can be exhaustively unit
 * tested without a DOM or an audio context. Frequencies and scales are
 * derived through `octavian` rather than hand-rolled equal-temperament math.
 */

import { Note, createMidiKey, midiToFrequency } from 'octavian';

/** A pitch class: an integer 0–11 where 0 = C and 11 = B. */
export type PitchClass = number;

/** How accidentals (the black keys) should be spelled. */
export type Spelling = 'sharp' | 'flat' | 'both';

/** A concrete pitch: a pitch class anchored to a scientific-pitch octave. */
export type Pitch = { pc: PitchClass; octave: number };

/** Sharp spelling of every pitch class, indexed 0–11. */
export const SHARP_NAMES = [
	'C',
	'C♯',
	'D',
	'D♯',
	'E',
	'F',
	'F♯',
	'G',
	'G♯',
	'A',
	'A♯',
	'B'
] as const;

/** Flat spelling of every pitch class, indexed 0–11. */
export const FLAT_NAMES = [
	'C',
	'D♭',
	'D',
	'E♭',
	'E',
	'F',
	'G♭',
	'G',
	'A♭',
	'A',
	'B♭',
	'B'
] as const;

/** The five accidental (black-key) pitch classes. */
export const BLACK_PITCH_CLASSES: ReadonlySet<PitchClass> = new Set([1, 3, 6, 8, 10]);

/** The intervals, in semitones, that make up a major scale. */
export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;

/** The seven natural pitch classes, in left-to-right white-key order. */
export const WHITE_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11] as const;

/** A selectable musical key: the chromatic "no key" option, or a major key. */
export type KeyDefinition = {
	/** Stable identifier used in persistence and `<Select>` options. */
	id: string;
	/** Human-facing label, e.g. "B♭ Major" or "Chromatic". */
	label: string;
	/** Compact label for the header meta line, e.g. "C" or "Chromatic". */
	short: string;
	/** The tonic pitch class, or `null` for Chromatic. */
	tonicPc: PitchClass | null;
	/** Which spelling the keyboard and chips should use. */
	spelling: Spelling;
};

/**
 * The selectable keys: Chromatic plus the eleven common major keys from the
 * handoff. Sharp keys (G/D/A/E/B) prefer sharp spelling; flat keys
 * (F/B♭/E♭/A♭/D♭) prefer flats; C is a no-op natural key spelled with sharps.
 */
export const KEYS: readonly KeyDefinition[] = [
	{ id: 'chromatic', label: 'Chromatic', short: 'Chromatic', tonicPc: null, spelling: 'both' },
	{ id: 'C', label: 'C Major', short: 'C', tonicPc: 0, spelling: 'sharp' },
	{ id: 'G', label: 'G Major', short: 'G', tonicPc: 7, spelling: 'sharp' },
	{ id: 'D', label: 'D Major', short: 'D', tonicPc: 2, spelling: 'sharp' },
	{ id: 'A', label: 'A Major', short: 'A', tonicPc: 9, spelling: 'sharp' },
	{ id: 'E', label: 'E Major', short: 'E', tonicPc: 4, spelling: 'sharp' },
	{ id: 'B', label: 'B Major', short: 'B', tonicPc: 11, spelling: 'sharp' },
	{ id: 'F', label: 'F Major', short: 'F', tonicPc: 5, spelling: 'flat' },
	{ id: 'Bb', label: 'B♭ Major', short: 'B♭', tonicPc: 10, spelling: 'flat' },
	{ id: 'Eb', label: 'E♭ Major', short: 'E♭', tonicPc: 3, spelling: 'flat' },
	{ id: 'Ab', label: 'A♭ Major', short: 'A♭', tonicPc: 8, spelling: 'flat' },
	{ id: 'Db', label: 'D♭ Major', short: 'D♭', tonicPc: 1, spelling: 'flat' }
];

const KEYS_BY_ID = new Map(KEYS.map((key) => [key.id, key]));

/** Look up a key definition by id, falling back to Chromatic for unknown ids. */
export function keyById(id: string): KeyDefinition {
	return KEYS_BY_ID.get(id) ?? KEYS[0];
}

/** Wrap any integer into the 0–11 pitch-class range. */
export function normalizePitchClass(value: number): PitchClass {
	return ((Math.trunc(value) % 12) + 12) % 12;
}

/** True if the pitch class is a black (accidental) key. */
export function isBlackPitchClass(pc: PitchClass): boolean {
	return BLACK_PITCH_CLASSES.has(normalizePitchClass(pc));
}

/**
 * The pitch classes of the major scale built on `tonicPc`, in ascending order
 * starting from the tonic. Uses `octavian` so the diatonic spelling logic stays
 * in the library, then maps each spelled note back to its pitch class.
 */
export function majorScalePitchClasses(tonicPc: PitchClass): PitchClass[] {
	const tonic = normalizePitchClass(tonicPc);
	// Anchor to octave 4 purely so octavian has a concrete note to build from;
	// the octave is irrelevant once we reduce to pitch classes.
	return MAJOR_SCALE_INTERVALS.map(
		(interval) => Note.fromMidi(createMidiKey(60 + tonic + interval)).chromaticIndex
	);
}

/** The set of eligible pitch classes for a key — its diatonic major scale. */
export function scalePitchClassSet(key: KeyDefinition): Set<PitchClass> {
	if (key.tonicPc === null) {
		return new Set(Array.from({ length: 12 }, (_, pc) => pc));
	}
	return new Set(majorScalePitchClasses(key.tonicPc));
}

/**
 * The label for a pitch class under a given spelling. White keys are spelled
 * identically in both; black keys differ. `'both'` returns the sharp name —
 * use {@link bothSpellings} when you need the stacked chromatic label.
 */
export function noteLabel(pc: PitchClass, spelling: Spelling): string {
	const index = normalizePitchClass(pc);
	return spelling === 'flat' ? FLAT_NAMES[index] : SHARP_NAMES[index];
}

/**
 * Both enharmonic spellings of a pitch class, sharp first. For natural pitch
 * classes the two entries are identical (e.g. `['C', 'C']`); callers can detect
 * that to render a single label.
 */
export function bothSpellings(pc: PitchClass): [sharp: string, flat: string] {
	const index = normalizePitchClass(pc);
	return [SHARP_NAMES[index], FLAT_NAMES[index]];
}

/** The MIDI number for a pitch in scientific pitch notation (C4 = 60). */
export function pitchToMidi(pitch: Pitch): number {
	return (pitch.octave + 1) * 12 + normalizePitchClass(pitch.pc);
}

/** The frequency, in Hz, for a pitch — equal temperament, A4 = 440. */
export function pitchToFrequency(pitch: Pitch): number {
	return midiToFrequency(createMidiKey(pitchToMidi(pitch)));
}

/** Format a pitch for display, e.g. `{ pc: 1, octave: 4 }` → "C♯4". */
export function formatPitch(pitch: Pitch, spelling: Spelling): string {
	return `${noteLabel(pitch.pc, spelling)}${pitch.octave}`;
}
