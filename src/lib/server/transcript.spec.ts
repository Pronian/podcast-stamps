import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetVideoDetails = vi.hoisted(() => vi.fn());

vi.mock('youtube-caption-extractor', () => ({
	getVideoDetails: mockGetVideoDetails,
}));

import { fetchTranscript } from './transcript';

const ID = 'dQw4w9WgXcQ';

describe('fetchTranscript', () => {
	beforeEach(() => {
		mockGetVideoDetails.mockReset();
	});

	it('returns a formatted transcript and title on success', async () => {
		mockGetVideoDetails.mockResolvedValue({
			title: 'Test Video',
			description: '',
			subtitles: [
				{ start: '1.5', dur: '2', text: 'Hello world' },
				{ start: '65', dur: '2', text: 'Second line' },
			],
		});

		const result = await fetchTranscript(`https://www.youtube.com/watch?v=${ID}`);

		expect(result).toEqual({
			ok: true,
			transcript: '00:00:01 Hello world\n00:01:05 Second line',
			title: 'Test Video',
		});
		expect(mockGetVideoDetails).toHaveBeenCalledWith({ videoID: ID, lang: 'en' });
	});

	it('collapses internal whitespace and trims caption text', async () => {
		mockGetVideoDetails.mockResolvedValue({
			title: 'T',
			description: '',
			subtitles: [{ start: '0', dur: '1', text: '  hello\n  world  ' }],
		});

		const result = await fetchTranscript(ID);

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.transcript).toBe('00:00:00 hello world');
	});

	it('drops segments whose text is empty after trimming', async () => {
		mockGetVideoDetails.mockResolvedValue({
			title: 'T',
			description: '',
			subtitles: [
				{ start: '0', dur: '1', text: '   ' },
				{ start: '2', dur: '1', text: 'kept' },
			],
		});

		const result = await fetchTranscript(ID);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.transcript).toBe('00:00:02 kept');
			expect(result.transcript.split('\n')).toHaveLength(1);
		}
	});

	it('returns an error when the video has no captions', async () => {
		mockGetVideoDetails.mockResolvedValue({ title: 'T', description: '', subtitles: [] });

		const result = await fetchTranscript(`https://youtu.be/${ID}`);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toMatch(/no captions/i);
	});

	it('returns an error for an unparseable URL without calling the API', async () => {
		const result = await fetchTranscript('not a real link');

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toMatch(/valid youtube link/i);
		expect(mockGetVideoDetails).not.toHaveBeenCalled();
	});

	it('reports unavailable or private videos', async () => {
		mockGetVideoDetails.mockRejectedValue(new Error('Video unavailable'));

		const result = await fetchTranscript(ID);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toMatch(/unavailable or private/i);
	});

	it('treats bot-check failures as retryable', async () => {
		mockGetVideoDetails.mockRejectedValue(new Error('LOGIN_REQUIRED - Sign in to confirm you are not a bot'));

		const result = await fetchTranscript(ID);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toMatch(/try again/i);
	});

	it('returns a generic failure for unknown errors', async () => {
		mockGetVideoDetails.mockRejectedValue(new Error('boom'));

		const result = await fetchTranscript(ID);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toMatch(/failed to fetch/i);
	});
});
