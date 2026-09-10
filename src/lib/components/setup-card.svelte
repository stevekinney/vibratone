<script lang="ts">
	import Button from '@lostgradient/cinder/button';
	import Card from '@lostgradient/cinder/card';
	import FormField from '@lostgradient/cinder/form-field';
	import Select from '@lostgradient/cinder/select';
	import Slider from '@lostgradient/cinder/slider';
	import { MAX_OCTAVE, MIN_OCTAVE } from '$lib/round';
	import { getPracticeState } from '$lib/state.svelte';
	import {
		KEYS,
		bothSpellings,
		isBlackPitchClass,
		noteLabel,
		scalePitchClassSet
	} from '$lib/music';

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

	const octaveCount = $derived(state.octaveHi - state.octaveLo + 1);
	const octaveHint = $derived(
		`${state.available} possible ${state.available === 1 ? 'note' : 'notes'} across ${octaveCount} ${octaveCount === 1 ? 'octave' : 'octaves'}.`
	);
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
					<Button
						variant={on ? 'soft' : 'secondary'}
						size="sm"
						class={['chip', isTonic(pc) && 'tonic', !inKey(pc) && 'dimmed']
							.filter(Boolean)
							.join(' ')}
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
					</Button>
				{/each}
			</div>
			{#if state.key.tonicPc !== null}
				<Button variant="ghost" size="xs" class="match-key" onclick={() => state.matchKey()}>
					Match key
				</Button>
			{/if}
		</div>

		<div class="field">
			<FormField id="octaves" label="Octaves" description={octaveHint}>
				<Slider
					mode="range"
					label="Octaves"
					min={MIN_OCTAVE}
					max={MAX_OCTAVE}
					step={1}
					ticks
					valueText={(value) => `C${value}`}
					value={[state.octaveLo, state.octaveHi]}
					onValueChange={([lo, hi]) => state.setOctaves(lo, hi)}
				/>
			</FormField>
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

	.field-label {
		font-size: var(--cinder-text-sm);
		font-weight: var(--cinder-font-medium);
		color: var(--cinder-text);
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

	.chips :global(.chip) {
		min-width: 38px;
		font-variant-numeric: tabular-nums;
	}

	.chips :global(.chip.dimmed) {
		opacity: 0.45;
	}

	.chips :global(.chip.tonic) {
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

	.field :global(.match-key) {
		align-self: flex-start;
	}

	@media (pointer: coarse) {
		.chips :global(.chip) {
			min-width: var(--cinder-touch-target-min);
			min-height: var(--cinder-touch-target-min);
		}
	}
</style>
