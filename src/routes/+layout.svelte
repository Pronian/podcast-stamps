<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global {
		:root {
			--color-bg: #121212;
			--color-surface: #1e1e1e;
			--color-surface-raised: #2a2a2a;
			--color-accent: #f59e0b;
			--color-accent-hover: #d97706;
			--color-accent-dim: oklch(0.65 0.15 70);
			--color-text: #f0f0f0;
			--color-text-muted: #888;
			--color-border: #333;

			--spacing-xs: 0.25rem;
			--spacing-sm: 0.5rem;
			--spacing-md: 1rem;
			--spacing-lg: 1.5rem;
			--spacing-xl: 2rem;
			--spacing-2xl: 3rem;

			--radius: 0.5rem;
			--radius-sm: 0.25rem;

			--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
		}

		*,
		*::before,
		*::after {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			padding: 0;
			background: var(--color-bg);
			color: var(--color-text);
			font-family:
				system-ui,
				-apple-system,
				sans-serif;
			line-height: 1.6;
			min-height: 100dvh;
		}

		::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}

		::-webkit-scrollbar-track {
			background: var(--color-bg);
		}

		::-webkit-scrollbar-thumb {
			background: var(--color-border);
			border-radius: 4px;
		}

		::-webkit-scrollbar-thumb:hover {
			background: var(--color-text-muted);
		}
	}
</style>
