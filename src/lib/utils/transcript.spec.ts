import { describe, it, expect } from 'vitest';
import { compactTranscript, cleanPastedTimestamps } from '$lib/utils/transcript';

describe('compactTranscript', () => {
	it('returns empty string for empty or whitespace-only input', () => {
		expect(compactTranscript('')).toBe('');
		expect(compactTranscript('   ')).toBe('');
		expect(compactTranscript('\t')).toBe('');
		expect(compactTranscript('\n\n')).toBe('');
	});

	it('drops standalone filler words and merges remaining short lines', () => {
		const input = ['00:00:01 um', '00:00:02 Hello everyone', '00:00:03 uh', '00:00:04 Welcome to the show'].join('\n');
		const result = compactTranscript(input);
		expect(result).not.toContain('00:00:01 um');
		expect(result).not.toContain('00:00:03 uh');
		expect(result).not.toContain('00:00:04');
		expect(result).toBe('00:00:02 Hello everyone Welcome to the show');
	});

	it('returns empty string when all timestamp lines are filler words', () => {
		const input = ['00:00:01 um,', '00:00:02 uh.', '00:00:03 ah!'].join('\n');
		expect(compactTranscript(input)).toBe('');
	});

	it('does not merge when there is no previous timestamp line', () => {
		expect(compactTranscript('00:00:01 Hello')).toBe('00:00:01 Hello');
	});

	it('removes filler words from the middle of a multi-word line', () => {
		expect(compactTranscript('00:00:01 Hello um there')).toBe('00:00:01 Hello there');
	});

	it('removes filler words from the beginning of a line', () => {
		expect(compactTranscript('00:00:01 uh hello there')).toBe('00:00:01 hello there');
	});

	it('removes filler words from the end of a line', () => {
		expect(compactTranscript('00:00:01 hello there um')).toBe('00:00:01 hello there');
	});

	it('removes filler words and their trailing commas', () => {
		expect(compactTranscript('00:00:01 um, so uh, yeah right')).toBe('00:00:01 so yeah right');
	});

	it('merges short lines (single and multi-word) into previous timestamp line', () => {
		const input = [
			'00:00:01 This is a long enough sentence to stand on its own',
			'00:00:02 Hello',
			'00:00:03 I agree completely',
		].join('\n');
		const result = compactTranscript(input);
		const lines = result.split('\n');
		expect(lines).toHaveLength(1);
		expect(lines[0]).toMatch(/^00:00:01/);
		expect(lines[0]).not.toContain('00:00:02');
		expect(lines[0]).not.toContain('00:00:03');
		expect(lines[0]).toContain('Hello');
		expect(lines[0]).toContain('I agree completely');
	});

	it('does not concatenate lines with 25 or more chars of text', () => {
		const input = ['00:00:01 This sentence is over twenty five', '00:00:02 This sentence is over twenty five'].join(
			'\n',
		);
		expect(compactTranscript(input).split('\n')).toHaveLength(2);
	});

	it('concatenates multiple consecutive short lines into the same previous line', () => {
		const input = [
			'00:00:01 This is a long enough line to stand on its own right',
			'00:00:02 short one',
			'00:00:03 short two',
			'00:00:04 short three',
		].join('\n');
		const result = compactTranscript(input);
		const lines = result.split('\n');
		expect(lines).toHaveLength(1);
		expect(lines[0]).toMatch(/^00:00:01/);
		expect(lines[0]).toMatch(/short one short two short three$/);
	});

	it('preserves non-timestamp lines', () => {
		const input = ['Some intro text', '00:00:01 Hello', 'Some middle text', '00:00:02 World'].join('\n');
		const result = compactTranscript(input);
		expect(result).toContain('Some intro text');
		expect(result).toContain('Some middle text');
	});

	it('skips timestamp lines with empty text', () => {
		const input = ['00:00:01 ', '00:00:02 Hello'].join('\n');
		expect(compactTranscript(input)).toContain('00:00:02 Hello');
	});

	it('handles complex transcript with filler removal and short-line merging', () => {
		const input = [
			'00:00:00 Welcome',
			'00:00:01 um',
			'00:00:02 to the show',
			'00:00:03 everyone',
			'00:00:04 uh',
			'00:00:05 Today we discuss',
			'00:00:06 SvelteKit',
		].join('\n');
		const result = compactTranscript(input);
		expect(result).not.toContain('00:00:01 um');
		expect(result).not.toContain('00:00:04 uh');
		expect(result).toBe('00:00:00 Welcome to the show everyone Today we discuss SvelteKit');
	});

	it('handles Windows-style line endings', () => {
		const input = '00:00:01 Hello\r\n00:00:02 um\r\n00:00:03 World';

		const result = compactTranscript(input);

		expect(result).toContain('00:00:01 Hello World');
		expect(result).not.toContain('00:00:02 um');
	});
});

describe('cleanPastedTimestamps', () => {
	it('removes square brackets from timestamps', () => {
		const input = '[00:00:01] Hello [01:23:45] World';
		expect(cleanPastedTimestamps(input)).toBe('00:00:01 Hello 01:23:45 World');
	});

	it('handles single-digit hours in brackets', () => {
		const input = '[0:00:01] Hello';
		expect(cleanPastedTimestamps(input)).toBe('0:00:01 Hello');
	});

	it('handles missing hours', () => {
		const input = '[00:01] Hello, folks!';
		expect(cleanPastedTimestamps(input)).toBe('00:01 Hello, folks!');
	});

	it('returns text unchanged when there are no bracket timestamps', () => {
		const input = '00:00:01 Hello world';
		expect(cleanPastedTimestamps(input)).toBe(input);
	});

	it('handles empty string', () => {
		expect(cleanPastedTimestamps('')).toBe('');
	});

	it('handles text with no timestamps at all', () => {
		const input = 'Just some plain text';
		expect(cleanPastedTimestamps(input)).toBe(input);
	});

	it('handles multiple bracket timestamps on the same line', () => {
		const input = '[00:00:01] Hello [00:01:30] and [00:02:00] Goodbye';
		expect(cleanPastedTimestamps(input)).toBe('00:00:01 Hello 00:01:30 and 00:02:00 Goodbye');
	});
});
