<script lang="ts">
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
