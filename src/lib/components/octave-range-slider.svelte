<script lang="ts">
	import { MAX_OCTAVE, MIN_OCTAVE, clampOctave, nearestOctave } from '$lib/round';

	type Props = {
		/** Current low octave (controlled). */
		lo: number;
		/** Current high octave (controlled). */
		hi: number;
		/** Called with a committed, normalized `(lo, hi)` pair. */
		onchange: (lo: number, hi: number) => void;
	};

	let { lo, hi, onchange }: Props = $props();

	const STOPS = Array.from({ length: MAX_OCTAVE - MIN_OCTAVE + 1 }, (_, i) => MIN_OCTAVE + i);
	const SPAN = MAX_OCTAVE - MIN_OCTAVE;

	let track = $state<HTMLDivElement | null>(null);
	/** Which thumb is being dragged, if any. */
	let dragging = $state<'lo' | 'hi' | null>(null);

	/** Convert an octave value to a 0–100% position along the track. */
	function toPercent(octave: number): number {
		return ((octave - MIN_OCTAVE) / SPAN) * 100;
	}

	/** Convert a clientX coordinate to the nearest octave stop. */
	function clientXToOctave(clientX: number): number {
		if (!track) return lo;
		const rect = track.getBoundingClientRect();
		const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
		return nearestOctave(MIN_OCTAVE + ratio * SPAN);
	}

	/** Commit a thumb to a new value, clamped so lo ≤ hi. */
	function commit(thumb: 'lo' | 'hi', value: number) {
		const clamped = clampOctave(value);
		if (thumb === 'lo') {
			onchange(Math.min(clamped, hi), hi);
		} else {
			onchange(lo, Math.max(clamped, lo));
		}
	}

	function onThumbPointerDown(thumb: 'lo' | 'hi', event: PointerEvent) {
		event.preventDefault();
		dragging = thumb;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function onThumbPointerMove(event: PointerEvent) {
		if (!dragging) return;
		commit(dragging, clientXToOctave(event.clientX));
	}

	function onThumbPointerUp(event: PointerEvent) {
		if (!dragging) return;
		(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
		dragging = null;
	}

	/** Track click (not on a thumb) moves whichever thumb is nearest. */
	function onTrackPointerDown(event: PointerEvent) {
		if (event.target !== track) return;
		const octave = clientXToOctave(event.clientX);
		const thumb = Math.abs(octave - lo) <= Math.abs(octave - hi) ? 'lo' : 'hi';
		commit(thumb, octave);
	}

	function onThumbKeyDown(thumb: 'lo' | 'hi', event: KeyboardEvent) {
		const value = thumb === 'lo' ? lo : hi;
		let next: number;
		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				next = value + 1;
				break;
			case 'ArrowLeft':
			case 'ArrowDown':
				next = value - 1;
				break;
			case 'Home':
				next = MIN_OCTAVE;
				break;
			case 'End':
				next = MAX_OCTAVE;
				break;
			default:
				return;
		}
		event.preventDefault();
		commit(thumb, next);
	}
</script>

<div class="slider" role="group" aria-label="Eligible octaves">
	<div class="track" bind:this={track} role="presentation" onpointerdown={onTrackPointerDown}>
		<span
			class="fill"
			style:left="{toPercent(lo)}%"
			style:right="{100 - toPercent(hi)}%"
			aria-hidden="true"
		></span>

		<button
			type="button"
			class="thumb"
			class:dragging={dragging === 'lo'}
			role="slider"
			aria-label="Lowest octave"
			aria-valuemin={MIN_OCTAVE}
			aria-valuemax={hi}
			aria-valuenow={lo}
			aria-valuetext="C{lo}"
			style:left="{toPercent(lo)}%"
			onpointerdown={(event) => onThumbPointerDown('lo', event)}
			onpointermove={onThumbPointerMove}
			onpointerup={onThumbPointerUp}
			onpointercancel={onThumbPointerUp}
			onkeydown={(event) => onThumbKeyDown('lo', event)}
		></button>

		<button
			type="button"
			class="thumb"
			class:dragging={dragging === 'hi'}
			role="slider"
			aria-label="Highest octave"
			aria-valuemin={lo}
			aria-valuemax={MAX_OCTAVE}
			aria-valuenow={hi}
			aria-valuetext="C{hi}"
			style:left="{toPercent(hi)}%"
			onpointerdown={(event) => onThumbPointerDown('hi', event)}
			onpointermove={onThumbPointerMove}
			onpointerup={onThumbPointerUp}
			onpointercancel={onThumbPointerUp}
			onkeydown={(event) => onThumbKeyDown('hi', event)}
		></button>
	</div>

	<div class="ticks" aria-hidden="true">
		{#each STOPS as stop (stop)}
			<span class="tick" class:active={stop >= lo && stop <= hi}>C{stop}</span>
		{/each}
	</div>
</div>

<style>
	.slider {
		display: flex;
		flex-direction: column;
		gap: var(--cinder-space-2);
		padding-top: var(--cinder-space-2);
	}

	.track {
		position: relative;
		height: 20px;
		margin: 0 10px;
		border-radius: var(--cinder-radius-full);
		cursor: pointer;
		touch-action: none;
	}

	.track::before {
		content: '';
		position: absolute;
		inset-block: 50%;
		inset-inline: -10px;
		height: 4px;
		transform: translateY(-50%);
		border-radius: var(--cinder-radius-full);
		background: var(--cinder-surface-inset);
		border: 1px solid var(--cinder-border-muted);
	}

	.fill {
		position: absolute;
		inset-block: 50%;
		height: 4px;
		transform: translateY(-50%);
		border-radius: var(--cinder-radius-full);
		background: var(--cinder-accent);
	}

	.thumb {
		position: absolute;
		top: 50%;
		width: 20px;
		height: 20px;
		padding: 0;
		transform: translate(-50%, -50%);
		border: 2px solid var(--cinder-accent);
		border-radius: var(--cinder-radius-full);
		background: var(--cinder-surface-raised);
		cursor: grab;
		touch-action: none;
		transition: box-shadow var(--cinder-duration-fast) var(--cinder-ease-standard);
	}

	.thumb.dragging {
		cursor: grabbing;
	}

	.thumb:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 1px var(--cinder-bg),
			0 0 0 4px color-mix(in oklch, var(--cinder-accent), transparent 40%);
	}

	.ticks {
		display: flex;
		justify-content: space-between;
		font-size: var(--cinder-text-2xs);
		color: var(--cinder-text-subtle);
		font-variant-numeric: tabular-nums;
	}

	.tick.active {
		color: var(--cinder-accent-text);
		font-weight: var(--cinder-font-medium);
	}

	@media (pointer: coarse) {
		.thumb {
			width: 26px;
			height: 26px;
		}
	}
</style>
