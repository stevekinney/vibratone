<script lang="ts">
	import Card from '@lostgradient/cinder/card';
	import { onDestroy, onMount } from 'svelte';
	import Play from 'lucide-svelte/icons/play';
	import Square from 'lucide-svelte/icons/square';
	import { getSynth } from '$lib/audio';
	import { createScheduler, toScheduledEvents, type Scheduler } from '$lib/audio-scheduler';
	import { pitchToFrequency, type Pitch } from '$lib/music';

	type ActiveVoice = { gain: GainNode; sources: AudioScheduledSourceNode[] };

	const sequencePitches: Pitch[] = [
		{ pc: 0, octave: 4 },
		{ pc: 2, octave: 4 },
		{ pc: 4, octave: 4 },
		{ pc: 5, octave: 4 },
		{ pc: 7, octave: 4 },
		{ pc: 9, octave: 4 },
		{ pc: 11, octave: 4 },
		{ pc: 0, octave: 5 },
		{ pc: 0, octave: 5 },
		{ pc: 11, octave: 4 },
		{ pc: 9, octave: 4 },
		{ pc: 7, octave: 4 },
		{ pc: 5, octave: 4 },
		{ pc: 4, octave: 4 },
		{ pc: 2, octave: 4 },
		{ pc: 0, octave: 4 }
	];

	let sequenceActive = $state(false);
	let hydrated = $state(false);
	let audioUnavailable = $state(false);
	let audioError = $state<string | null>(null);
	let scheduler: Scheduler | null = null;
	let completionTimer: ReturnType<typeof setTimeout> | undefined;
	const activeVoices: ActiveVoice[] = [];

	const playDisabled = $derived(!hydrated || sequenceActive || audioUnavailable);
	const stopDisabled = $derived(!hydrated || !sequenceActive);

	onMount(() => {
		hydrated = true;
		const AudioContextClass =
			window.AudioContext ??
			(window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AudioContextClass) {
			audioUnavailable = true;
			audioError = 'Audio is unavailable in this browser.';
		}
	});

	onDestroy(() => {
		stopSequence();
	});

	function clearCompletionTimer(): void {
		if (completionTimer !== undefined) {
			clearTimeout(completionTimer);
			completionTimer = undefined;
		}
	}

	function registerVoice(gain: GainNode, sources: AudioScheduledSourceNode[]): void {
		const voice = { gain, sources };
		activeVoices.push(voice);
		const last = sources[sources.length - 1];
		last.addEventListener('ended', () => {
			const index = activeVoices.indexOf(voice);
			if (index >= 0) activeVoices.splice(index, 1);
		});
	}

	function scheduleVoice(
		event: { when: number; frequencyHz: number; duration: number; gain?: number },
		context: AudioContext
	): void {
		const oscillator = context.createOscillator();
		const envelope = context.createGain();
		const peak = Math.max(0, Math.min(event.gain ?? 1, 1)) * 0.22;
		const end = event.when + event.duration;

		oscillator.type = 'sine';
		oscillator.frequency.value = event.frequencyHz;
		envelope.gain.setValueAtTime(0.0001, event.when);
		envelope.gain.linearRampToValueAtTime(peak, event.when + 0.01);
		envelope.gain.linearRampToValueAtTime(0.0001, end);
		oscillator.connect(envelope).connect(context.destination);
		oscillator.start(event.when);
		oscillator.stop(end + 0.02);
		registerVoice(envelope, [oscillator]);
	}

	function stopVoices(context: AudioContext): void {
		const now = context.currentTime;
		for (const voice of [...activeVoices]) {
			voice.gain.gain.cancelScheduledValues(now);
			voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
			voice.gain.gain.linearRampToValueAtTime(0, now + 0.06);
			for (const source of voice.sources) {
				try {
					source.stop(now + 0.07);
				} catch {
					// Already stopped.
				}
			}
		}
		activeVoices.length = 0;
	}

	function stopSequence(): void {
		clearCompletionTimer();
		scheduler?.stop();
		scheduler = null;
		const synth = getSynth();
		if (synth) stopVoices(synth.context);
		sequenceActive = false;
	}

	function finishSequence(): void {
		clearCompletionTimer();
		scheduler?.stop();
		scheduler = null;
		sequenceActive = false;
	}

	function playSequence(): void {
		if (playDisabled) return;
		const synth = getSynth();
		if (!synth) {
			audioUnavailable = true;
			audioError = 'Audio is unavailable in this browser.';
			return;
		}

		audioError = null;
		sequenceActive = true;
		try {
			const context = synth.context;
			const startTime = context.currentTime + 0.08;
			const noteDuration = 0.11;
			const offsetStep = 0.12;
			const notes = sequencePitches.map((pitch, index) => ({
				frequencyHz: pitchToFrequency(pitch),
				offsetSeconds: index * offsetStep,
				duration: noteDuration,
				gain: 0.9
			}));
			const events = toScheduledEvents(notes, startTime);
			scheduler = createScheduler(context, scheduleVoice);
			void synth.resume().catch(() => {
				audioError = 'Audio could not start.';
				audioUnavailable = true;
				stopSequence();
			});
			scheduler.enqueue(events);
			completionTimer = setTimeout(
				finishSequence,
				(sequencePitches.length - 1) * offsetStep * 1000 + noteDuration * 1000 + 250
			);
		} catch {
			audioError = 'Audio could not start.';
			audioUnavailable = true;
			stopSequence();
		}
	}
</script>

<svelte:head>
	<title>Scheduler Smoke — Vibratone</title>
</svelte:head>

<main class="smoke-page">
	<Card>
		<div class="smoke-panel">
			<p class="eyebrow">Scheduler Smoke</p>
			<h1>Lookahead audio scheduler</h1>
			<div class="controls">
				<button
					type="button"
					class="control"
					disabled={playDisabled}
					onclick={playSequence}
					aria-label="Play 16-note diatonic sequence"
				>
					<Play size={18} fill="currentColor" aria-hidden="true" />
					Play 16-note diatonic sequence
				</button>
				<button
					type="button"
					class="control secondary"
					disabled={stopDisabled}
					onclick={stopSequence}
					aria-label="Stop sequence"
				>
					<Square size={16} fill="currentColor" aria-hidden="true" />
					Stop
				</button>
			</div>
			<div class="alert" role="alert">
				{#if audioError}
					{audioError}
				{/if}
			</div>
		</div>
	</Card>
</main>

<style>
	.smoke-page {
		min-height: 100svh;
		display: grid;
		place-items: center;
		padding: var(--cinder-space-5);
		background: var(--cinder-background);
	}

	.smoke-panel {
		width: min(100%, 560px);
		padding: var(--cinder-space-7);
		display: flex;
		flex-direction: column;
		gap: var(--cinder-space-5);
	}

	.eyebrow {
		margin: 0;
		color: var(--cinder-text-muted);
		font-size: var(--cinder-text-xs);
		font-weight: var(--cinder-font-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	h1 {
		margin: 0;
		color: var(--cinder-text);
		font-size: var(--cinder-text-3xl);
		letter-spacing: 0;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--cinder-space-3);
	}

	.control {
		min-height: var(--cinder-touch-target-min);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--cinder-space-2);
		padding: 0 var(--cinder-space-4);
		border: 1px solid var(--cinder-accent);
		border-radius: var(--cinder-radius-md);
		background: var(--cinder-accent);
		color: var(--cinder-accent-contrast);
		font: inherit;
		font-weight: var(--cinder-font-medium);
		cursor: pointer;
	}

	.control.secondary {
		background: var(--cinder-surface-raised);
		color: var(--cinder-text);
		border-color: var(--cinder-border);
	}

	.control:disabled {
		background: var(--cinder-fill-disabled);
		border-color: var(--cinder-border);
		color: var(--cinder-text-disabled);
		cursor: not-allowed;
	}

	.alert {
		min-height: 22px;
		color: var(--cinder-color-danger-fg);
		font-size: var(--cinder-text-sm);
	}

	@media (max-width: 460px) {
		.smoke-panel {
			padding: var(--cinder-space-5);
		}

		.controls,
		.control {
			width: 100%;
		}
	}
</style>
