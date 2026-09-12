<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
	import Button from '@lostgradient/cinder/button';
	import SegmentedControl, { Segment } from '@lostgradient/cinder/segmented-control';
	import Check from 'lucide-svelte/icons/check';
	import Select from '@lostgradient/cinder/select';
	import { KEYS, bothSpellings, isBlackPitchClass, keyById, noteLabel } from '$lib/music';

	interface Props {
		keyId: string;
		eligibleNotes: Iterable<number>;
		onKeyChange: (keyId: string) => void;
		onToggleNote: (pitchClass: number) => void;
		onResetNotes: () => void;
		idPrefix?: string;
	}

	const generatedId = $props.id();

	let {
		keyId,
		eligibleNotes,
		onKeyChange,
		onToggleNote,
		onResetNotes,
		idPrefix = generatedId
	}: Props = $props();

	const keyOptions = KEYS.map((key) => ({ value: key.id, label: key.label }));
	const pitchClasses = Array.from({ length: 12 }, (_, pitchClass) => pitchClass);
	const key = $derived(keyById(keyId));
	const eligibleSet = $derived(new Set(eligibleNotes));
	const eligibleSelection = $derived(new SvelteSet([...eligibleNotes].map(String)));
	const isChromatic = $derived(key.tonicPc === null);
	function toggleNoteFromSegment() {
		const pitchClass = pitchClasses.find(
			(note) => eligibleSelection.has(String(note)) !== eligibleSet.has(note)
		);
		if (pitchClass !== undefined) onToggleNote(pitchClass);
	}
</script>

<div class="scope">
	<div class="fields">
		<div class="field">
			<Select
				disabled={!mounted}
				id={idPrefix}
				label="Key"
				options={keyOptions}
				value={keyId}
				onchange={(event) => onKeyChange(event.currentTarget.value)}
			/>
			{#if !isChromatic}
				<Button variant="secondary" size="sm" class="match-key" onclick={onResetNotes}>
					Reset notes to {key.label}
				</Button>
			{/if}
		</div>

		<div class="field">
			<span id={`${idPrefix}-eligible-label`} class="field-label">Eligible notes</span>
			<SegmentedControl
				class="notes4small"
				detached
				disabled={!mounted}
				fullWidth
				id={`${idPrefix}-eligible`}
				label="Eligible notes"
				labelVisible={false}
				selectionMode="multiple"
				size="sm"
				value={eligibleSelection}
				onclick={toggleNoteFromSegment}
			>
				{#each pitchClasses as pitchClass (pitchClass)}
					{@const on = eligibleSet.has(pitchClass)}
					{@const black = isBlackPitchClass(pitchClass)}
					{@const [sharp, flat] = bothSpellings(pitchClass)}
					<Segment
						value={String(pitchClass)}
						class={['chip', key.tonicPc === pitchClass && 'tonic'].filter(Boolean).join(' ')}
						aria-label={isChromatic && black ? `${sharp} or ${flat}` : undefined}
					>
						{#if isChromatic && black}
							<span class="chip-enharmonic" aria-hidden="true">
								<span class="chip-sharp">{sharp}</span><span class="chip-slash">/</span><span
									class="chip-flat">{flat}</span
								>
							</span>
						{:else}
							{noteLabel(pitchClass, key.spelling)}
						{/if}
						{#snippet trailing()}
							<span class="selection-check-slot">
								{#if on}<Check size={12} strokeWidth={2.5} aria-hidden="true" />{/if}
							</span>
						{/snippet}
					</Segment>
				{/each}
			</SegmentedControl>
			{#if eligibleSet.size === 0}
				<p class="empty-scope">No eligible notes selected.</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.scope {
		container-type: inline-size;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--cinder-space-5);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--cinder-space-1-5);
	}

	:global(.notes4small) :global(.chip) {
		min-width: 38px;
		font-variant-numeric: tabular-nums;
	}

	:global(.notes4small) :global(.chip.tonic) {
		text-decoration: underline;
		text-decoration-color: currentColor;
		text-underline-offset: 3px;
	}

	:global(.notes4small) {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--cinder-space-1-5);
	}

	.selection-check-slot {
		display: inline-flex;
		width: 12px;
		height: 12px;
		align-items: center;
		justify-content: center;
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
		margin: 0 1px;
	}

	.chip-flat {
		font-size: var(--cinder-text-xs);
	}

	.field :global(.match-key) {
		align-self: flex-start;
	}

	.empty-scope {
		margin: 0;
		font-size: var(--cinder-text-sm);
		color: var(--cinder-text-muted);
	}

	@container (min-width: 560px) {
		.fields {
			display: grid;
			grid-template-columns: var(--note-scope-columns, minmax(180px, 0.7fr) minmax(0, 1.3fr));
			align-items: start;
		}

		:global(.notes4small) {
			grid-template-columns: repeat(6, minmax(0, 1fr));
		}
	}

	@media (pointer: coarse) {
		:global(.notes4small) :global(.chip) {
			min-width: var(--cinder-touch-target-min);
			min-height: var(--cinder-touch-target-min);
		}
	}
</style>
