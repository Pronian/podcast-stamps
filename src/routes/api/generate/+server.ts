import { LLM_URL, LLM_MODEL_ID, LLM_API_KEY } from '$env/static/private';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
// @ts-ignore — Vite raw import
import systemPrompt from '../../../prompt.md?raw';

export const POST: RequestHandler = async ({ request }) => {
	const { transcript } = await request.json();

	if (!transcript || typeof transcript !== 'string') {
		error(400, 'Missing or invalid transcript');
	}

	const llmUrl = LLM_URL.replace(/\/$/, '') + '/chat/completions';
	console.log('[generate] Calling LLM:', llmUrl, 'model:', LLM_MODEL_ID);

	const response = await fetch(llmUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${LLM_API_KEY}`,
		},
		body: JSON.stringify({
			model: LLM_MODEL_ID,
			stream: true,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: transcript },
			],
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		console.error('[generate] LLM API error:', response.status, text);
		error(502, `LLM API returned ${response.status}`);
	}

	if (!response.body) {
		error(502, 'LLM API returned no body');
	}

	const upstream = response.body;
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			const reader = upstream.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			try {
				while (true) {
					const { done, value } = await reader.read();

					if (done) {
						// process any remaining data left in the buffer
						if (buffer.trim()) {
							processLine(buffer.trim(), controller, encoder);
						}
						break;
					}

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split('\n');
					buffer = lines.pop() ?? '';

					for (const line of lines) {
						const trimmed = line.trim();
						if (!trimmed || !trimmed.startsWith('data: ')) continue;

						const shouldStop = processLine(trimmed, controller, encoder);
						if (shouldStop) return;
					}
				}
			} catch (err) {
				console.error('[generate] Stream error:', err);
				controller.error(err);
				return;
			}

			try {
				controller.close();
			} catch {
				// already closed
			}
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-cache',
			'X-Content-Type-Options': 'nosniff',
		},
	});
};

/**
 * Process a single SSE line. Returns true if the stream should stop.
 */
function processLine(line: string, controller: ReadableStreamDefaultController, encoder: TextEncoder): boolean {
	if (!line.startsWith('data: ')) return false;

	const data = line.slice(6);

	if (data === '[DONE]') {
		try {
			controller.close();
		} catch {
			// already closed
		}
		return true;
	}

	try {
		const parsed = JSON.parse(data);
		const content = parsed.choices?.[0]?.delta?.content;
		if (content) {
			controller.enqueue(encoder.encode(content));
		}
	} catch {
		// skip malformed JSON chunks
		console.warn('[generate] Malformed chunk:', data);
	}

	return false;
}
