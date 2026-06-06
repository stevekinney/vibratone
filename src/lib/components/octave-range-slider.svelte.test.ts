import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import OctaveRangeSlider from './octave-range-slider.svelte';

/** Render the slider with a spy `onchange` and return the spy + locators. */
function setup(lo = 4, hi = 4) {
	const onchange = vi.fn();
	render(OctaveRangeSlider, { lo, hi, onchange });
	const lowThumb = page.getByRole('slider', { name: 'Lowest octave' });
	const highThumb = page.getByRole('slider', { name: 'Highest octave' });
	return { onchange, lowThumb, highThumb };
}

describe('octave-range-slider — structure and ARIA', () => {
	it('renders two sliders inside a labelled group', async () => {
		setup(3, 5);
		const group = page.getByRole('group', { name: 'Eligible octaves' });
		await expect.element(group).toBeInTheDocument();
		const sliders = page.getByRole('slider');
		await expect.element(sliders.first()).toBeInTheDocument();
	});

	it('exposes the current values and a C-prefixed valuetext', async () => {
		const { lowThumb, highThumb } = setup(3, 5);
		await expect.element(lowThumb).toHaveAttribute('aria-valuenow', '3');
		await expect.element(lowThumb).toHaveAttribute('aria-valuetext', 'C3');
		await expect.element(highThumb).toHaveAttribute('aria-valuenow', '5');
		await expect.element(highThumb).toHaveAttribute('aria-valuetext', 'C5');
	});

	it('cross-constrains the thumbs: low max = hi, high min = lo', async () => {
		const { lowThumb, highThumb } = setup(3, 5);
		await expect.element(lowThumb).toHaveAttribute('aria-valuemax', '5');
		await expect.element(lowThumb).toHaveAttribute('aria-valuemin', '2');
		await expect.element(highThumb).toHaveAttribute('aria-valuemin', '3');
		await expect.element(highThumb).toHaveAttribute('aria-valuemax', '6');
	});
});

describe('octave-range-slider — keyboard', () => {
	it('raises the low thumb with ArrowRight', async () => {
		const { onchange, lowThumb } = setup(4, 5);
		await lowThumb.element().focus();
		await userKey('ArrowRight');
		expect(onchange).toHaveBeenCalledWith(5, 5);
	});

	it('lowers the low thumb with ArrowDown', async () => {
		const { onchange, lowThumb } = setup(4, 5);
		await lowThumb.element().focus();
		await userKey('ArrowDown');
		expect(onchange).toHaveBeenCalledWith(3, 5);
	});

	it('clamps the low thumb so it cannot pass the high thumb', async () => {
		const { onchange, lowThumb } = setup(5, 5);
		await lowThumb.element().focus();
		await userKey('ArrowRight'); // would be 6, but hi is 5
		expect(onchange).toHaveBeenCalledWith(5, 5);
	});

	it('clamps the high thumb so it cannot drop below the low thumb', async () => {
		const { onchange, highThumb } = setup(5, 5);
		await highThumb.element().focus();
		await userKey('ArrowLeft'); // would be 4, but lo is 5
		expect(onchange).toHaveBeenCalledWith(5, 5);
	});

	it('jumps to bounds with Home and End', async () => {
		const { onchange, lowThumb, highThumb } = setup(4, 4);
		await lowThumb.element().focus();
		await userKey('Home');
		expect(onchange).toHaveBeenLastCalledWith(2, 4);
		await highThumb.element().focus();
		await userKey('End');
		expect(onchange).toHaveBeenLastCalledWith(4, 6);
	});

	it('does not fire onchange for unrelated keys', async () => {
		const { onchange, lowThumb } = setup(4, 4);
		await lowThumb.element().focus();
		await userKey('a');
		expect(onchange).not.toHaveBeenCalled();
	});
});

describe('octave-range-slider — pointer', () => {
	it('moves the nearest thumb on a track click', async () => {
		const { onchange } = setup(3, 5);
		// Click near the right end of the track; the high thumb is nearest.
		const track = document.querySelector('.track') as HTMLElement;
		const rect = track.getBoundingClientRect();
		track.dispatchEvent(
			new PointerEvent('pointerdown', {
				clientX: rect.left + rect.width, // → octave 6
				clientY: rect.top + rect.height / 2,
				bubbles: true
			})
		);
		expect(onchange).toHaveBeenCalledWith(3, 6);
	});

	it('drags the low thumb to a new octave', async () => {
		const { onchange } = setup(2, 6);
		const thumb = document.querySelectorAll('.thumb')[0] as HTMLElement;
		thumb.setPointerCapture = vi.fn();
		thumb.releasePointerCapture = vi.fn();
		const track = document.querySelector('.track') as HTMLElement;
		const rect = track.getBoundingClientRect();
		const midX = rect.left + rect.width / 2; // → octave 4

		thumb.dispatchEvent(
			new PointerEvent('pointerdown', { pointerId: 1, clientX: rect.left, bubbles: true })
		);
		thumb.dispatchEvent(
			new PointerEvent('pointermove', { pointerId: 1, clientX: midX, bubbles: true })
		);
		thumb.dispatchEvent(
			new PointerEvent('pointerup', { pointerId: 1, clientX: midX, bubbles: true })
		);

		expect(onchange).toHaveBeenLastCalledWith(4, 6);
	});
});

/** Dispatch a keydown on the active element (focus must be set first). */
async function userKey(key: string) {
	const target = document.activeElement as HTMLElement;
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
	// Let Svelte flush the reactive update before assertions.
	await Promise.resolve();
}
