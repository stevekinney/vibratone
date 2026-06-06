<script lang="ts">
	import Card from '@lostgradient/cinder/card';
	import { Play, RotateCcw, Check } from 'lucide-svelte';
	import { getPracticeState } from '$lib/state.svelte';
	import { formatPitch, noteLabel } from '$lib/music';

	const state = getPracticeState();

	const roundLabel = $derived(state.started ? `Round ${state.round}` : 'Ready');

	const statusText = $derived.by(() => {
		if (!state.canPlay) return 'Adjust the setup to begin';
		if (!state.started) return 'Press play to hear the first note';
		if (state.phase === 'guessing') return 'Identify the note you heard';
		if (state.phase === 'revealed') return state.lastCorrect ? 'Correct' : 'Not quite';
		return 'Press play to hear the first note';
	});

	const statusTone = $derived(
		state.phase === 'revealed' ? (state.lastCorrect ? 'success' : 'danger') : 'default'
	);

	const answerLabel = $derived(state.current ? formatPitch(state.current, state.spelling) : '');
	// The guess is a pitch class only — octave is never part of a guess.
	const guessLabel = $derived(
		state.guessedPc !== null ? noteLabel(state.guessedPc, state.spelling) : ''
	);
	const revealed = $derived(state.phase === 'revealed');
</script>

<Card>
	<div class="practice">
		<span class="round">{roundLabel}</span>

		<button
			type="button"
			class="play"
			class:guessing={state.phase === 'guessing'}
			disabled={!state.canPlay}
			onclick={() => state.play()}
			aria-label="Play the note"
		>
			{#if state.phase === 'guessing'}
				<span class="pulse" aria-hidden="true"></span>
			{/if}
			<Play size={40} strokeWidth={1.5} fill="currentColor" class="play-icon" />
		</button>

		<p class="status" data-tone={statusTone}>{statusText}</p>

		<button type="button" class="replay" disabled={!state.current} onclick={() => state.replay()}>
			<RotateCcw size={16} strokeWidth={1.5} />
			Replay
		</button>

		<div class="reveal" aria-live="polite">
			{#if revealed}
				<div class="reveal-answer">
					<span class="answer">{answerLabel}</span>
					{#if state.lastCorrect}
						<span class="answer-check" aria-hidden="true">
							<Check size={24} strokeWidth={2} />
						</span>
					{/if}
				</div>
				{#if !state.lastCorrect}
					<p class="guess">you played <span class="guess-note">{guessLabel}</span></p>
				{/if}
				<div class="progress" aria-hidden="true">
					<span class="progress-fill"></span>
				</div>
			{/if}
		</div>
	</div>
</Card>

<style>
	.practice {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--cinder-space-4);
		padding: var(--cinder-space-7) var(--cinder-space-6) var(--cinder-space-6);
	}

	.round {
		font-size: var(--cinder-text-2xs);
		font-weight: var(--cinder-font-semibold);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--cinder-text-subtle);
		font-variant-numeric: tabular-nums;
	}

	.play {
		position: relative;
		display: grid;
		place-items: center;
		width: 104px;
		height: 104px;
		border: none;
		border-radius: var(--cinder-radius-full);
		background: var(--cinder-accent);
		color: var(--cinder-accent-contrast);
		box-shadow: var(--cinder-shadow-md);
		cursor: pointer;
		transition:
			background var(--cinder-duration-fast) var(--cinder-ease-standard),
			transform var(--cinder-duration-fast) var(--cinder-ease-standard);
	}

	.play :global(.play-icon) {
		transform: translateX(3px);
	}

	.play:hover:not(:disabled) {
		background: var(--cinder-accent-hover);
	}

	.play:active:not(:disabled) {
		transform: scale(0.97);
	}

	.play:disabled {
		background: var(--cinder-fill-disabled);
		color: var(--cinder-text-disabled);
		box-shadow: none;
		cursor: not-allowed;
	}

	.pulse {
		position: absolute;
		inset: -6px;
		border-radius: var(--cinder-radius-full);
		border: 2px solid var(--cinder-accent);
		animation: pulse 2s var(--cinder-ease-standard) infinite;
		pointer-events: none;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 0.55;
		}
		100% {
			transform: scale(1.28);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse {
			animation: none;
		}
	}

	.status {
		margin: 0;
		min-height: 22px;
		font-size: var(--cinder-text-md);
		color: var(--cinder-text-subtle);
	}

	.status[data-tone='success'] {
		color: var(--cinder-color-success-fg);
		font-weight: var(--cinder-font-medium);
	}

	.status[data-tone='danger'] {
		color: var(--cinder-color-danger-fg);
		font-weight: var(--cinder-font-medium);
	}

	.status[data-tone='default'] {
		color: var(--cinder-text);
	}

	.replay {
		display: inline-flex;
		align-items: center;
		gap: var(--cinder-space-2);
		min-height: var(--cinder-control-height-sm);
		padding: 0 var(--cinder-space-4);
		border: 1px solid var(--cinder-border);
		border-radius: var(--cinder-radius-full);
		background: var(--cinder-surface-raised);
		color: var(--cinder-text-muted);
		font-size: var(--cinder-text-sm);
		cursor: pointer;
		transition: background var(--cinder-duration-fast) var(--cinder-ease-standard);
	}

	.replay:hover:not(:disabled) {
		background: var(--cinder-surface-hover);
	}

	.replay:disabled {
		color: var(--cinder-text-disabled);
		cursor: not-allowed;
	}

	.reveal {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--cinder-space-2);
		min-height: 64px;
		justify-content: center;
	}

	.reveal-answer {
		display: flex;
		align-items: center;
		gap: var(--cinder-space-2);
	}

	.answer {
		font-size: var(--cinder-text-4xl);
		font-weight: var(--cinder-font-semibold);
		font-variant-numeric: tabular-nums;
		color: var(--cinder-text);
	}

	.answer-check {
		color: var(--cinder-color-success-fg);
		display: inline-flex;
	}

	.guess {
		margin: 0;
		font-size: var(--cinder-text-sm);
		color: var(--cinder-text-muted);
	}

	.guess-note {
		color: var(--cinder-color-danger-fg);
		font-weight: var(--cinder-font-medium);
	}

	.progress {
		width: 120px;
		height: 3px;
		border-radius: var(--cinder-radius-full);
		background: var(--cinder-surface-inset);
		overflow: hidden;
	}

	.progress-fill {
		display: block;
		height: 100%;
		background: var(--cinder-accent);
		transform-origin: left center;
		animation: advance 1.6s linear forwards;
	}

	@keyframes advance {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.progress-fill {
			animation: none;
			transform: scaleX(1);
		}
	}

	@media (pointer: coarse) {
		.replay {
			min-height: var(--cinder-touch-target-min);
		}
	}
</style>
