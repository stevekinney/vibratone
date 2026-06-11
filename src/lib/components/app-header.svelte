<script lang="ts">
	import Activity from 'lucide-svelte/icons/activity';
</script>

<header class="header">
	<div class="brand">
		<span class="mark" aria-hidden="true">
			<Activity size={20} strokeWidth={1.5} />
		</span>
		<div class="titles">
			<h1 class="title">Vibratone</h1>
			<p class="subtitle">Train your ear, one note at a time</p>
		</div>
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		gap: var(--cinder-space-4);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--cinder-space-3);
	}

	.mark {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: var(--cinder-radius-md);
		background: color-mix(in oklch, var(--cinder-accent), transparent 84%);
		color: var(--cinder-accent-text);
	}

	.titles {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.title {
		margin: 0;
		font-size: var(--cinder-text-2xl);
		font-weight: var(--cinder-font-semibold);
		letter-spacing: var(--cinder-tracking-tight);
		line-height: 1.1;
	}

	.subtitle {
		margin: 0;
		font-size: var(--cinder-text-sm);
		color: var(--cinder-text-subtle);
	}
</style>
