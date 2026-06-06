<script lang="ts">
	// Cinder's `./styles` export has no `types` condition, so this side-effect
	// import fails type resolution under moduleResolution: bundler even though it
	// resolves and loads correctly at runtime via Vite. Suppress the type-only
	// error; the directive self-deletes once Cinder ships types for the export.
	// Upstream fix tracked at stevekinney/cinder (missing `types` on ./styles).
	// @ts-expect-error -- no type declaration for the CSS-only styles entry point
	import '@lostgradient/cinder/styles';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Vibratone — Ear-training flash cards</title>
</svelte:head>

{@render children()}
