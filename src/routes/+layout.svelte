<script lang="ts">
	// Cinder 0.2.0's `./styles` export declares a `types` target, but the
	// published tarball is missing that CSS declaration file. Keep this type-only
	// suppression until https://github.com/stevekinney/cinder/issues/351 ships.
	// @ts-expect-error -- missing declaration file for the CSS-only styles entry point
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
