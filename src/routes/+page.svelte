<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createPracticeState, setPracticeState } from '$lib/state.svelte';
	import AppHeader from '$lib/components/app-header.svelte';
	import ScoreBar from '$lib/components/score-bar.svelte';
	import PracticeCard from '$lib/components/practice-card.svelte';
	import PianoKeyboard from '$lib/components/piano-keyboard.svelte';
	import SetupCard from '$lib/components/setup-card.svelte';

	const state = setPracticeState(createPracticeState());

	onDestroy(() => state.destroy());
</script>

<main class="page">
	<AppHeader />
	<ScoreBar />
	<div class="grid">
		<div class="practice-column">
			<PracticeCard />
			<PianoKeyboard />
		</div>
		<aside class="setup-rail">
			<SetupCard />
		</aside>
	</div>
</main>

<style>
	.page {
		max-width: 1040px;
		margin: 0 auto;
		padding: var(--cinder-space-8) var(--cinder-space-5) var(--cinder-space-12);
		display: flex;
		flex-direction: column;
		gap: var(--cinder-space-5);
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: var(--cinder-space-5);
		align-items: start;
	}

	.practice-column {
		display: flex;
		flex-direction: column;
		gap: var(--cinder-space-5);
		min-width: 0;
	}

	.setup-rail {
		min-width: 0;
	}

	@media (max-width: 860px) {
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
