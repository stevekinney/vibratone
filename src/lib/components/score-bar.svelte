<script lang="ts">
	import Flame from 'lucide-svelte/icons/flame';
	import Button from '@lostgradient/cinder/button';
	import { getPracticeState } from '$lib/state.svelte';

	const state = getPracticeState();

	/** Show a dash instead of "0%" when no attempts have been made yet. */
	function displayPercent(percent: number, total: number): string {
		return total === 0 ? '—' : `${percent}%`;
	}
</script>

<div class="score-bar">
	<div class="stats">
		<div class="stat">
			<span class="stat-label">This session</span>
			<span class="stat-value">{displayPercent(state.sessionPercent, state.session.total)}</span>
			<span class="stat-detail">
				<span class="fraction">{state.session.correct}/{state.session.total}</span>
				<span
					class="streak-group"
					role="img"
					aria-label="Streak: {state.session.streak}, best: {state.session.best}"
				>
					<span class="streak-icon" aria-hidden="true"><Flame size={12} strokeWidth={2} /></span>
					<span class="streak-current" aria-hidden="true">{state.session.streak}</span>
					<span class="streak-best" aria-hidden="true">best {state.session.best}</span>
				</span>
			</span>
		</div>

		<div class="stat stat-secondary">
			<span class="stat-label">All time</span>
			<span class="stat-value">{displayPercent(state.allTimePercent, state.allTime.total)}</span>
			<span class="stat-detail">
				<span class="fraction">{state.allTime.correct}/{state.allTime.total}</span>
			</span>
		</div>
	</div>

	<div class="actions">
		<span class="reset-label" aria-hidden="true">Reset</span>
		<Button
			variant="ghost"
			size="xs"
			aria-label="Reset session"
			onclick={() => state.resetSession()}>Session</Button
		>
		<Button
			variant="ghost"
			size="xs"
			aria-label="Reset all time"
			onclick={() => state.resetAllTime()}>All time</Button
		>
	</div>
</div>

<style>
	.score-bar {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--cinder-space-4);
		align-items: center;
		background: var(--cinder-surface-raised);
		border: 1px solid var(--cinder-border);
		border-radius: var(--cinder-radius-lg);
		box-shadow: var(--cinder-shadow-sm);
		padding: var(--cinder-space-3) var(--cinder-space-5);
	}

	.stats {
		display: flex;
		align-items: stretch;
		gap: var(--cinder-space-7);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--cinder-space-0-5);
	}

	.stat-secondary .stat-value {
		color: var(--cinder-text-muted);
	}

	.stat-label {
		font-size: var(--cinder-text-2xs);
		font-weight: var(--cinder-font-semibold);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--cinder-text-subtle);
	}

	.stat-value {
		font-size: var(--cinder-text-2xl);
		font-weight: var(--cinder-font-semibold);
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
		color: var(--cinder-text);
	}

	.stat-detail {
		display: flex;
		align-items: center;
		gap: var(--cinder-space-2-5);
		font-size: var(--cinder-text-xs);
		color: var(--cinder-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.fraction {
		color: var(--cinder-text-muted);
	}

	.streak-group {
		display: flex;
		align-items: center;
		gap: var(--cinder-space-0-5);
	}

	.streak-icon {
		display: inline-flex;
		color: var(--cinder-accent-text);
	}

	.streak-current {
		font-weight: var(--cinder-font-semibold);
		color: var(--cinder-accent-text);
	}

	.streak-best {
		color: var(--cinder-text-subtle);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: var(--cinder-space-1-5);
		flex-wrap: wrap;
	}

	.reset-label {
		font-size: var(--cinder-text-xs);
		color: var(--cinder-text-subtle);
	}

	@media (max-width: 560px) {
		.actions {
			width: 100%;
		}

		.actions :global(.cinder-button) {
			flex: 1;
		}
	}
</style>
