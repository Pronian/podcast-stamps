<script lang="ts">
	let transcript = $state('');
	let generations: string[] = $state([]);
	let currentIndex = $state(0);
	let isStreaming = $state(false);
	let streamingText = $state('');
	let streamingThinking = $state('');
	let hasThinking = $state(false);
	let errorMessage = $state('');

	let canGenerate = $derived(transcript.trim().length > 0 && !isStreaming);
	let hasGenerations = $derived(generations.length > 0);
	let displayText = $derived(isStreaming ? streamingText : (generations[currentIndex] ?? ''));
	let canGoPrev = $derived(!isStreaming && currentIndex > 0);
	let canGoNext = $derived(!isStreaming && currentIndex < generations.length - 1);
	let copied = $state(false);

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const text = event.clipboardData?.getData('text') ?? '';
		const cleaned = text.replace(/\[(\d{1,2}:\d{2}:\d{2})\]/g, '$1');

		const textarea = event.target as HTMLTextAreaElement;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		transcript = transcript.slice(0, start) + cleaned + transcript.slice(end);

		// set cursor position after paste
		requestAnimationFrame(() => {
			textarea.selectionStart = textarea.selectionEnd = start + cleaned.length;
		});
	}

	function generate() {
		if (!canGenerate) return;

		isStreaming = true;
		streamingText = '';
		streamingThinking = '';
		hasThinking = false;
		errorMessage = '';

		// Run streaming in a detached async context so Svelte's async
		// coordination doesn't block intermediate state updates
		(async () => {
			try {
				const response = await fetch('/api/generate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ transcript }),
				});

				if (!response.ok) {
					const text = await response.text().catch(() => '');
					throw new Error(`Server error: ${response.status} ${text}`.trim());
				}

				if (!response.body) {
					throw new Error('No response body');
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = '';

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });

					// Process complete lines (JSON objects separated by newlines)
					const lines = buffer.split('\n');
					buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

					for (const line of lines) {
						if (!line.trim()) continue;
						try {
							const data = JSON.parse(line) as { type: string; content: string };
							if (data.type === 'thinking') {
								streamingThinking += data.content;
								hasThinking = true;
							} else if (data.type === 'content') {
								streamingText += data.content;
							}
						} catch {
							// Fallback: treat as plain text for backward compatibility
							streamingText += line;
						}
					}
				}

				// push completed generation and navigate to it
				generations = [...generations, streamingText];
				currentIndex = generations.length - 1;
			} catch (err) {
				errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			} finally {
				isStreaming = false;
				streamingText = '';
				streamingThinking = '';
				hasThinking = false;
			}
		})();
	}

	function goToPrev() {
		if (canGoPrev) currentIndex--;
	}

	function goToNext() {
		if (canGoNext) currentIndex++;
	}

	async function copyOutput() {
		const text = isStreaming ? streamingText : (generations[currentIndex] ?? '');
		if (!text) return;

		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Ignore copy errors
		}
	}
</script>

<main>
	<header>
		<h1>Podcast Stamps</h1>
		<p class="subtitle">Generate timestamped show notes from YouTube transcripts</p>
	</header>

	<section class="input-section">
		<label for="transcript">Paste Transcript</label>
		<textarea
			id="transcript"
			bind:value={transcript}
			onpaste={handlePaste}
			placeholder="00:00:00 Welcome to the show everybody...
00:00:15 Today we're going to talk about...
00:01:30 Let's get into our first topic..."
			spellcheck="false"
		></textarea>
	</section>

	<div class="actions">
		<button class="generate-btn" onclick={generate} disabled={!canGenerate}>
			{#if isStreaming}
				<span class="spinner"></span>
				Generating...
			{:else}
				Generate Timestamps
			{/if}
		</button>
	</div>

	{#if errorMessage}
		<div class="error">
			{errorMessage}
		</div>
	{/if}

	{#if hasGenerations || isStreaming}
		<section class="output-section">
			<div class="output-header">
				<label for="output">Generated Timestamps</label>
				{#if hasGenerations}
					<div class="nav-controls">
						<button class="nav-btn" onclick={goToPrev} disabled={!canGoPrev} aria-label="Previous generation"
							>&lt;</button
						>
						<span class="nav-indicator">{currentIndex + 1} / {generations.length}</span>
						<button class="nav-btn" onclick={goToNext} disabled={!canGoNext} aria-label="Next generation">&gt;</button>
					</div>
				{/if}
			</div>
			<div class="output-wrapper">
				{#if isStreaming}
					<pre id="output" class="streaming-output"><code
							>{#if hasThinking}<span class="thinking">{streamingThinking}</span>{/if}{streamingText}</code
						></pre>
				{:else}
					<textarea id="output" readonly value={displayText} placeholder="Timestamps will appear here..."></textarea>
				{/if}
				<button
					class="copy-btn"
					onclick={copyOutput}
					aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
					title={copied ? 'Copied!' : 'Copy to clipboard'}
				>
					{#if copied}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20 6L9 17l-5-5" />
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
							<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
						</svg>
					{/if}
				</button>
			</div>
			{#if isStreaming}
				<div class="streaming-indicator">
					<span class="dot"></span>
					<span class="dot"></span>
					<span class="dot"></span>
					Receiving response...
				</div>
			{/if}
		</section>
	{/if}
</main>

<style>
	main {
		max-width: 50rem;
		margin-inline: auto;
		padding: var(--spacing-xl) var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	header {
		text-align: center;
		padding-block-end: var(--spacing-md);
		border-block-end: 1px solid var(--color-border);

		& h1 {
			margin: 0;
			font-size: 2rem;
			font-weight: 700;
			color: var(--color-accent);
			text-wrap: balance;
			letter-spacing: -0.02em;
		}

		& .subtitle {
			margin: var(--spacing-xs) 0 0;
			color: var(--color-text-muted);
			font-size: 0.95rem;
		}
	}

	/* Input section */
	.input-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);

		& label {
			font-weight: 600;
			font-size: 0.875rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--color-text-muted);
		}
	}

	textarea {
		width: 100%;
		min-height: 12rem;
		padding: var(--spacing-md);
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		line-height: 1.7;
		resize: vertical;
		transition: border-color 0.2s;
		field-sizing: content;
		max-height: 60vh;

		&:focus {
			outline: none;
			border-color: var(--color-accent);
		}

		&::placeholder {
			color: color-mix(in oklch, var(--color-text-muted), transparent 40%);
		}

		&[readonly] {
			cursor: default;
			background: var(--color-surface-raised);
		}
	}

	/* Streaming output with thinking support */
	.streaming-output {
		width: 100%;
		min-height: 12rem;
		padding: var(--spacing-md);
		background: var(--color-surface-raised);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		line-height: 1.7;
		overflow: auto;
		max-height: 60vh;
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;

		& code {
			font-family: inherit;
			background: transparent;
			padding: 0;
		}

		& .thinking {
			color: var(--color-text-muted);
			opacity: 0.7;
		}
	}

	/* Actions */
	.actions {
		display: flex;
		justify-content: center;

		& .generate-btn {
			display: inline-flex;
			align-items: center;
			gap: var(--spacing-sm);
			padding: var(--spacing-sm) var(--spacing-xl);
			background: var(--color-accent);
			color: #000;
			border: none;
			border-radius: var(--radius);
			font-size: 1rem;
			font-weight: 700;
			cursor: pointer;
			transition:
				background-color 0.15s,
				opacity 0.15s,
				scale 0.1s;

			&:hover:not(:disabled) {
				background: var(--color-accent-hover);
				scale: 1.02;
			}

			&:active:not(:disabled) {
				scale: 0.98;
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}
	}

	/* Spinner */
	.spinner {
		display: inline-block;
		width: 1em;
		height: 1em;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			rotate: 1turn;
		}
	}

	/* Error */
	.error {
		padding: var(--spacing-md);
		background: oklch(0.35 0.15 25);
		border: 1px solid oklch(0.5 0.2 25);
		border-radius: var(--radius);
		color: oklch(0.85 0.1 25);
		font-size: 0.9rem;
	}

	/* Output section */
	.output-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);

		& .output-header {
			display: flex;
			align-items: center;
			justify-content: space-between;

			& .nav-controls {
				display: flex;
				align-items: center;
				gap: var(--spacing-sm);

				& .nav-btn {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 2rem;
					height: 2rem;
					padding: 0;
					background: var(--color-surface-raised);
					color: var(--color-text);
					border: 1px solid var(--color-border);
					border-radius: var(--radius-sm);
					font-family: var(--font-mono);
					font-size: 0.9rem;
					font-weight: 700;
					cursor: pointer;
					transition:
						background-color 0.15s,
						border-color 0.15s;

					&:hover:not(:disabled) {
						background: var(--color-border);
						border-color: var(--color-accent);
					}

					&:disabled {
						opacity: 0.3;
						cursor: not-allowed;
					}
				}

				& .nav-indicator {
					font-family: var(--font-mono);
					font-size: 0.8rem;
					color: var(--color-text-muted);
					min-width: 3rem;
					text-align: center;
				}
			}
		}
	}

	/* Output wrapper for copy button positioning */
	.output-wrapper {
		position: relative;

		&:hover .copy-btn {
			opacity: 1;
			pointer-events: auto;
		}
	}

	.copy-btn {
		position: absolute;
		top: var(--spacing-sm);
		right: var(--spacing-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: var(--color-surface-raised);
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			background-color 0.15s,
			border-color 0.15s,
			color 0.15s;
		opacity: 0;
		pointer-events: none;

		&:focus {
			opacity: 1;
			pointer-events: auto;
		}

		&:hover {
			background: var(--color-accent);
			color: #000;
			border-color: var(--color-accent);
		}

		&:focus-visible {
			outline: 2px solid var(--color-accent);
			outline-offset: 2px;
		}

		&:has(svg > path[d='M20 6L9 17l-5-5']) {
			opacity: 1;
			pointer-events: auto;
			background: oklch(0.4 0.15 145);
			color: oklch(0.9 0.05 145);
			border-color: oklch(0.5 0.15 145);
		}

		& svg {
			width: 1rem;
			height: 1rem;
		}
	}

	/* Streaming indicator */
	.streaming-indicator {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.8rem;
		color: var(--color-accent-dim);
		padding-inline-start: var(--spacing-xs);

		& .dot {
			display: inline-block;
			width: 4px;
			height: 4px;
			background: var(--color-accent);
			border-radius: 50%;
			animation: pulse 1.4s ease-in-out infinite;

			&:nth-child(2) {
				animation-delay: 0.2s;
			}

			&:nth-child(3) {
				animation-delay: 0.4s;
			}
		}
	}

	@keyframes pulse {
		0%,
		80%,
		100% {
			opacity: 0.3;
			scale: 0.8;
		}
		40% {
			opacity: 1;
			scale: 1;
		}
	}
</style>
