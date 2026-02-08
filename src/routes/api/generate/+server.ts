import { LLM_URL, LLM_MODEL_ID, LLM_API_KEY } from '$env/static/private';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import systemPrompt from '../../../prompt.md?raw';

const openai = new OpenAI({
	apiKey: LLM_API_KEY,
	baseURL: LLM_URL,
});

export const POST: RequestHandler = async ({ request }) => {
	const { transcript } = await request.json();

	if (!transcript || typeof transcript !== 'string') {
		error(400, 'Missing or invalid transcript');
	}

	console.log('[generate] Calling LLM:', LLM_URL, 'model:', LLM_MODEL_ID);

	try {
		const stream = await openai.chat.completions.create({
			model: LLM_MODEL_ID,
			stream: true,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: transcript },
			],
		});

		const encoder = new TextEncoder();

		const responseStream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content;
						if (content) {
							controller.enqueue(encoder.encode(content));
						}
					}
					controller.close();
				} catch (err) {
					console.error('[generate] Stream error:', err);
					controller.error(err);
				}
			},
		});

		return new Response(responseStream, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'no-cache',
				'X-Content-Type-Options': 'nosniff',
			},
		});
	} catch (err) {
		console.error('[generate] LLM API error:', err);
		error(502, 'LLM API request failed');
	}
};
