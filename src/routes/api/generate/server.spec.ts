import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('openai', () => {
	return {
		default: vi.fn().mockImplementation(function () {
			return {
				chat: {
					completions: {
						create: mockCreate,
					},
				},
			};
		}),
	};
});

vi.mock('$env/static/private', () => ({
	LLM_URL: 'http://localhost:11434',
	LLM_MODEL_ID: 'test-model',
	LLM_API_KEY: 'test-key',
}));

vi.mock('../../../prompt.md?raw', () => ({
	default: 'You are a helpful assistant.',
}));

import type { RequestHandler } from './$types';

describe('POST /api/generate', () => {
	let handler: RequestHandler;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import('./+server');
		handler = mod.POST;
	});

	async function callHandler(body: unknown): Promise<Response> {
		const request = new Request('http://localhost/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		return handler({ request } as Parameters<RequestHandler>[0]);
	}

	it('returns 400 when transcript is missing', async () => {
		await expect(callHandler({})).rejects.toMatchObject({ status: 400 });
	});

	it('returns 400 when transcript is not a string', async () => {
		await expect(callHandler({ transcript: 123 })).rejects.toMatchObject({ status: 400 });
	});

	it('returns 400 when transcript is empty string', async () => {
		await expect(callHandler({ transcript: '' })).rejects.toMatchObject({ status: 400 });
	});

	it('returns a streaming response with content on success', async () => {
		mockCreate.mockResolvedValue(
			(async function* () {
				yield {
					choices: [
						{
							delta: { content: 'Hello ' },
						},
					],
				};
				yield {
					choices: [
						{
							delta: { content: 'World' },
						},
					],
				};
			})(),
		);

		const response = await callHandler({ transcript: '00:00:01 Hello' });
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');

		const text = await response.text();
		const lines = text.split('\n').filter((l) => l.trim());
		expect(lines).toHaveLength(2);
		expect(JSON.parse(lines[0])).toEqual({ type: 'content', content: 'Hello ' });
		expect(JSON.parse(lines[1])).toEqual({ type: 'content', content: 'World' });
	});

	it('streams thinking content when reasoning_content is present', async () => {
		mockCreate.mockResolvedValue(
			(async function* () {
				yield {
					choices: [
						{
							delta: { reasoning_content: 'Let me think...' },
						},
					],
				};
				yield {
					choices: [
						{
							delta: { content: 'Here is the answer' },
						},
					],
				};
			})(),
		);

		const response = await callHandler({ transcript: 'test transcript' });
		const text = await response.text();
		const lines = text.split('\n').filter((l) => l.trim());

		expect(lines).toHaveLength(2);
		expect(JSON.parse(lines[0])).toEqual({ type: 'thinking', content: 'Let me think...' });
		expect(JSON.parse(lines[1])).toEqual({ type: 'content', content: 'Here is the answer' });
	});

	it('returns 502 when LLM API call fails', async () => {
		mockCreate.mockRejectedValue(new Error('API connection failed'));

		await expect(callHandler({ transcript: 'test' })).rejects.toMatchObject({ status: 502 });
	});

	it('skips chunks with no delta', async () => {
		mockCreate.mockResolvedValue(
			(async function* () {
				yield { choices: [{}] };
				yield {
					choices: [
						{
							delta: { content: 'Only this' },
						},
					],
				};
			})(),
		);

		const response = await callHandler({ transcript: 'test' });
		const text = await response.text();
		const lines = text.split('\n').filter((l) => l.trim());
		expect(lines).toHaveLength(1);
		expect(JSON.parse(lines[0])).toEqual({ type: 'content', content: 'Only this' });
	});

	it('sets correct cache control headers', async () => {
		mockCreate.mockResolvedValue(
			(async function* () {
				yield {
					choices: [{ delta: { content: 'ok' } }],
				};
			})(),
		);

		const response = await callHandler({ transcript: 'test' });
		expect(response.headers.get('Cache-Control')).toBe('no-cache');
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
	});
});
