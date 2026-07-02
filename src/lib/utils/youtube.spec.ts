import { describe, it, expect } from 'vitest';
import { parseYouTubeUrl } from './youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTubeUrl', () => {
	it('extracts the ID from a standard watch URL', () => {
		expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
	});

	it('extracts the ID when extra query params are present', () => {
		expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${ID}&t=30s&list=PL123`)).toBe(ID);
	});

	it('extracts the ID from an http URL', () => {
		expect(parseYouTubeUrl(`http://youtube.com/watch?v=${ID}`)).toBe(ID);
	});

	it('extracts the ID from a mobile watch URL', () => {
		expect(parseYouTubeUrl(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
	});

	it('extracts the ID from a youtu.be short link', () => {
		expect(parseYouTubeUrl(`https://youtu.be/${ID}`)).toBe(ID);
	});

	it('extracts the ID from a youtu.be link with a tracking param', () => {
		expect(parseYouTubeUrl(`https://youtu.be/${ID}?si=abc123`)).toBe(ID);
	});

	it('extracts the ID from a shorts URL', () => {
		expect(parseYouTubeUrl(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
	});

	it('extracts the ID from an embed URL', () => {
		expect(parseYouTubeUrl(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
	});

	it('extracts the ID from a live URL', () => {
		expect(parseYouTubeUrl(`https://www.youtube.com/live/${ID}`)).toBe(ID);
	});

	it('extracts the ID from a youtube-nocookie embed URL', () => {
		expect(parseYouTubeUrl(`https://www.youtube-nocookie.com/embed/${ID}`)).toBe(ID);
	});

	it('accepts a protocol-less youtu.be link', () => {
		expect(parseYouTubeUrl(`youtu.be/${ID}`)).toBe(ID);
	});

	it('accepts a bare 11-character video ID', () => {
		expect(parseYouTubeUrl(ID)).toBe(ID);
	});

	it('returns null for an empty string', () => {
		expect(parseYouTubeUrl('')).toBeNull();
	});

	it('returns null for whitespace-only input', () => {
		expect(parseYouTubeUrl('   ')).toBeNull();
	});

	it('returns null for a non-YouTube URL', () => {
		expect(parseYouTubeUrl(`https://example.com/watch?v=${ID}`)).toBeNull();
	});

	it('returns null when the v param is the wrong length', () => {
		expect(parseYouTubeUrl('https://www.youtube.com/watch?v=tooshort')).toBeNull();
	});

	it('returns null for arbitrary text', () => {
		expect(parseYouTubeUrl('hello world')).toBeNull();
	});
});
