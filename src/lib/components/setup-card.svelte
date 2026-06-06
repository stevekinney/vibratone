<script lang="ts">
	import Card from '@lostgradient/cinder/card';
	import Select from '@lostgradient/cinder/select';
	import { getPracticeState } from '$lib/state.svelte';
	import {
		KEYS,
		bothSpellings,
		isBlackPitchClass,
		noteLabel,
		scalePitchClassSet
	} from '$lib/music';
	import OctaveRangeSlider from './octave-range-slider.svelte';

	const state = getPracticeState();

	const keyOptions = KEYS.map((key) => ({ value: key.id, label: key.label }));

	const keyHint = $derived(
		state.key.tonicPc === null
			? 'All twelve notes, labelled with both spellings.'
			: 'Notes default to this scale; the tonic is marked.'
	);

	const pitchClasses = Array.from({ length: 12 }, (_, pc) => pc);

	/**
	 * The current key's diatonic scale. Dimming (out-of-key) is independent of
	 * eligibility (on/off fill) — a note the user toggles off still belongs to
	 * the key, and a non-scale note they enable is still out of key.
	 */
	const scale = $derived(scalePitchClassSet(state.key));

	function inKey(pc: number): boolean {
		return scale.has(pc);
	}

	function isTonic(pc: number): boolean {
		return state.key.tonicPc === pc;
	}

	function handleKeyChange(event: Event) {
		state.setKey((event.currentTarget as HTMLSelectElement).value);
	}
</script>

<Card title="Setup">
	<div class="fields">
		<div class="field">
			<Select
				id="key-select"
				label="Key"
				options={keyOptions}
				value={state.keyId}
				onchange={handleKeyChange}
			/>
			<p class="hint">{keyHint}</p>
		</div>

		<div class="field">
			<span class="field-label">Eligible notes</span>
			<div class="chips" role="group" aria-label="Eligible notes">
				{#each pitchClasses as pc (pc)}
					{@const on = state.eligibleNotes.has(pc)}
					{@const black = isBlackPitchClass(pc)}
					{@const [sharp, flat] = bothSpellings(pc)}
					<button
						type="button"
						class="chip"
						class:on
						class:tonic={isTonic(pc)}
						class:dimmed={!inKey(pc)}
						aria-pressed={on}
						aria-label={state.key.tonicPc === null && black ? `${sharp} or ${flat}` : undefined}
						onclick={() => state.toggleNote(pc)}
					>
						{#if state.key.tonicPc === null && black}
							<span class="chip-enharmonic" aria-hidden="true">
								<span class="chip-sharp">{sharp}</span><span class="chip-slash">/</span><span
									class="chip-flat">{flat}</span
								>
							</span>
						{:else}
							{noteLabel(pc, state.spelling)}
						{/if}
					</button>
				{/each}
			</div>
			{#if state.key.tonicPc !== null}
				<button type="button" class="match-key" onclick={() => state.matchKey()}>
					Match key
				</button>
			{/if}
		</div>

		<div class="field">
			<div class="field-header">
				<span class="field-label">Octaves</span>
				<span class="octave-readout">{state.octaveLabel}</span>
			</div>
			<OctaveRangeSlider
				lo={state.octaveLo}
				hi={state.octaveHi}
				onchange={(lo, hi) => state.setOctaves(lo, hi)}
			/>
			<p class="hint">
				{state.available} possible {state.available === 1 ? 'note' : 'notes'} across {state.octaveHi -
					state.octaveLo +
					1}
				{state.octaveHi - state.octaveLo + 1 === 1 ? 'octave' : 'octaves'}.
			</p>
		</div>
	</div>
</Card>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--cinder-space-5);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--cinder-space-2);
	}

	.field-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.field-label {
		font-size: var(--cinder-text-sm);
		font-weight: var(--cinder-font-medium);
		color: var(--cinder-text);
	}

	.octave-readout {
		font-size: var(--cinder-text-sm);
		color: var(--cinder-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.hint {
		margin: 0;
		font-size: var(--cinder-text-xs);
		color: var(--cinder-text-subtle);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--cinder-space-1-5);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 38px;
		min-height: 32px;
		padding: var(--cinder-space-1) var(--cinder-space-2-5);
		border: 1px solid var(--cinder-border);
		border-radius: var(--cinder-radius-md);
		background: var(--cinder-surface-inset);
		color: var(--cinder-text-muted);
		font-size: var(--cinder-text-sm);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		transition:
			background var(--cinder-duration-fast) var(--cinder-ease-standard),
			color var(--cinder-duration-fast) var(--cinder-ease-standard);
	}

	.chip.on {
		background: color-mix(in oklch, var(--cinder-accent), transparent 84%);
		color: var(--cinder-accent-text);
		border-color: color-mix(in oklch, var(--cinder-accent), transparent 60%);
	}

	.chip.dimmed {
		opacity: 0.45;
	}

	.chip.tonic {
		text-decoration: underline;
		text-decoration-color: var(--cinder-accent);
		text-underline-offset: 3px;
	}

	.chip-enharmonic {
		display: inline-flex;
		align-items: baseline;
		gap: 0;
		white-space: nowrap;
	}

	.chip-sharp {
		font-size: var(--cinder-text-sm);
	}

	.chip-slash {
		font-size: var(--cinder-text-xs);
		color: var(--cinder-text-subtle);
		margin: 0 1px;
	}

	.chip-flat {
		font-size: var(--cinder-text-xs);
		color: var(--cinder-text-muted);
	}

	.match-key {
		align-self: flex-start;
		padding: 0;
		border: none;
		background: none;
		color: var(--cinder-accent-text);
		font-size: var(--cinder-text-xs);
		cursor: pointer;
	}

	.match-key:hover {
		text-decoration: underline;
	}

	@media (pointer: coarse) {
		.chip {
			min-width: var(--cinder-touch-target-min);
			min-height: var(--cinder-touch-target-min);
		}
	}
</style>
