<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import { getPracticeState } from '$lib/state.svelte';
	import { WHITE_PITCH_CLASSES, bothSpellings, noteLabel } from '$lib/music';

	const state = getPracticeState();

	/** White keys, left to right. */
	const whiteKeys = WHITE_PITCH_CLASSES;

	/**
	 * Black keys: pitch class plus the white-key index whose right edge the key
	 * sits over. Gaps are after white indices 0, 1, 3, 4, 5. The horizontal
	 * center is `(gapIndex + 1) × (100 / 7)%`.
	 */
	const blackKeys = [
		{ pc: 1, gapIndex: 0 },
		{ pc: 3, gapIndex: 1 },
		{ pc: 6, gapIndex: 3 },
		{ pc: 8, gapIndex: 4 },
		{ pc: 10, gapIndex: 5 }
	];

	function eligible(pc: number): boolean {
		return state.eligibleNotes.has(pc);
	}

	function isTonic(pc: number): boolean {
		return state.key.tonicPc === pc;
	}

	/** During reveal, classify a key for success/danger coloring. */
	function revealKind(pc: number): 'correct' | 'wrong' | null {
		if (state.phase !== 'revealed' || !state.current) return null;
		if (pc === state.current.pc) return 'correct';
		if (pc === state.guessedPc && !state.lastCorrect) return 'wrong';
		return null;
	}

	const interactive = $derived(state.phase === 'guessing');

	/**
	 * The accessible name for a key. In chromatic mode a black key carries both
	 * enharmonic spellings; in a key it matches the active spelling so screen
	 * readers and the visible label agree.
	 */
	function keyName(pc: number): string {
		const [sharp, flat] = bothSpellings(pc);
		if (state.key.tonicPc === null && sharp !== flat) return `${sharp} or ${flat}`;
		return noteLabel(pc, state.spelling);
	}

	function handleGuess(pc: number) {
		if (interactive && eligible(pc)) state.guess(pc);
	}
</script>

<div class="keyboard-wrapper">
	<div class="keyboard" role="group" aria-label="Piano keyboard">
		<div class="white-row">
			{#each whiteKeys as pc (pc)}
				{@const kind = revealKind(pc)}
				<button
					type="button"
					class="white-key"
					class:disabled={!eligible(pc)}
					data-reveal={kind}
					disabled={!eligible(pc) || !interactive}
					aria-label={keyName(pc)}
					onclick={() => handleGuess(pc)}
				>
					{#if isTonic(pc)}<span class="tonic-dot" aria-hidden="true"></span>{/if}
					{#if kind === 'correct'}
						<span class="mark mark-correct" aria-hidden="true"
							><Check size={18} strokeWidth={2.5} /></span
						>
					{:else if kind === 'wrong'}
						<span class="mark mark-wrong" aria-hidden="true"><X size={18} strokeWidth={2.5} /></span
						>
					{/if}
					<span class="key-label">{noteLabel(pc, state.spelling)}</span>
				</button>
			{/each}
		</div>

		{#each blackKeys as key (key.pc)}
			{@const kind = revealKind(key.pc)}
			{@const [sharp] = bothSpellings(key.pc)}
			<button
				type="button"
				class="black-key"
				class:disabled={!eligible(key.pc)}
				data-reveal={kind}
				disabled={!eligible(key.pc) || !interactive}
				style:left="{(key.gapIndex + 1) * (100 / 7)}%"
				aria-label={keyName(key.pc)}
				onclick={() => handleGuess(key.pc)}
			>
				{#if isTonic(key.pc)}<span class="tonic-dot" aria-hidden="true"></span>{/if}
				{#if kind === 'correct'}
					<span class="mark mark-correct" aria-hidden="true"
						><Check size={16} strokeWidth={2.5} /></span
					>
				{:else if kind === 'wrong'}
					<span class="mark mark-wrong" aria-hidden="true"><X size={16} strokeWidth={2.5} /></span>
				{/if}
				<span class="key-label">
					{#if state.key.tonicPc === null}
						{sharp}
					{:else}
						{noteLabel(key.pc, state.spelling)}
					{/if}
				</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.keyboard-wrapper {
		background: var(--cinder-surface-raised);
		border: 1px solid var(--cinder-border);
		border-radius: var(--cinder-radius-lg);
		box-shadow: var(--cinder-shadow-sm);
		padding: var(--cinder-space-5);
	}

	.keyboard {
		position: relative;
		max-width: 560px;
		margin: 0 auto;
	}

	.white-row {
		display: flex;
		gap: 0;
	}

	.white-key {
		position: relative;
		flex: 1;
		height: 164px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		gap: var(--cinder-space-1);
		padding-bottom: var(--cinder-space-2);
		border: 1px solid var(--cinder-border);
		border-radius: 0 0 var(--cinder-radius-md) var(--cinder-radius-md);
		background: var(--cinder-surface-raised);
		color: var(--cinder-text-muted);
		font-size: var(--cinder-text-sm);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		transition: background var(--cinder-duration-fast) var(--cinder-ease-standard);
	}

	.white-key + .white-key {
		border-left: none;
	}

	.white-key:hover:not(:disabled) {
		background: var(--cinder-surface-hover);
	}

	.white-key.disabled {
		background: var(--cinder-surface-inset);
		color: var(--cinder-text-disabled);
		cursor: not-allowed;
	}

	.black-key {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		width: 8.6%;
		height: 100px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		gap: var(--cinder-space-1);
		padding-bottom: var(--cinder-space-1);
		border: none;
		border-radius: 0 0 var(--cinder-radius-sm) var(--cinder-radius-sm);
		background: light-dark(oklch(30% 0.02 245), oklch(14% 0.025 245));
		color: light-dark(oklch(96% 0.005 245), oklch(86% 0.02 245));
		font-size: var(--cinder-text-2xs);
		cursor: pointer;
		z-index: 2;
		transition: background var(--cinder-duration-fast) var(--cinder-ease-standard);
	}

	.black-key.disabled {
		background: light-dark(oklch(74% 0.012 245), oklch(32% 0.03 245));
		color: light-dark(oklch(52% 0.01 245), oklch(54% 0.02 245));
		cursor: not-allowed;
	}

	.white-key[data-reveal='correct'],
	.black-key[data-reveal='correct'] {
		background: var(--cinder-success);
		color: var(--cinder-success-contrast);
	}

	.white-key[data-reveal='wrong'],
	.black-key[data-reveal='wrong'] {
		background: var(--cinder-danger);
		color: var(--cinder-danger-contrast);
	}

	.key-label {
		position: relative;
		z-index: 1;
	}

	.tonic-dot {
		position: absolute;
		top: var(--cinder-space-2);
		left: 50%;
		transform: translateX(-50%);
		width: 6px;
		height: 6px;
		border-radius: var(--cinder-radius-full);
		background: var(--cinder-accent);
	}

	.mark {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: inline-flex;
	}

	.mark-correct {
		color: var(--cinder-success-contrast);
	}

	.mark-wrong {
		color: var(--cinder-danger-contrast);
	}

	@media (pointer: coarse) {
		.white-key {
			height: 184px;
		}

		.black-key {
			height: 112px;
		}
	}
</style>
