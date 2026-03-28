import { describe, it, expect } from 'vitest';
import { compactTranscript, cleanPastedTimestamps } from '$lib/utils/transcript';

describe('compactTranscript', () => {
	it('returns the transcript unchanged when it is empty', () => {
		expect(compactTranscript('')).toBe('');
	});

	it('returns empty string when the transcript it is only whitespace', () => {
		expect(compactTranscript('   ')).toBe('');
		expect(compactTranscript('\t')).toBe('');
		expect(compactTranscript('\n\n')).toBe('');
	});

	it('removes filler words on their own timestamp lines', () => {
		const input = ['00:00:01 um', '00:00:02 Hello everyone', '00:00:03 uh', '00:00:04 Welcome to the show'].join('\n');

		const result = compactTranscript(input);

		expect(result).not.toContain('00:00:01 um');
		expect(result).not.toContain('00:00:03 uh');
		expect(result).toContain('00:00:02 Hello everyone');
		expect(result).toContain('00:00:04 Welcome to the show');
	});

	it('removes filler words with trailing punctuation', () => {
		const input = ['00:00:01 um,', '00:00:02 uh.', '00:00:03 ah!'].join('\n');

		const result = compactTranscript(input);

		expect(result).toBe('');
	});

	it('merges single-word non-filler lines into the previous timestamp line', () => {
		const input = ['00:00:01 Hello', '00:00:02 everyone'].join('\n');

		const result = compactTranscript(input);

		expect(result).toBe('00:00:01 Hello everyone');
	});

	it('does not merge single-word lines when there is no previous timestamp line', () => {
		const input = '00:00:01 Hello';

		const result = compactTranscript(input);

		expect(result).toBe('00:00:01 Hello');
	});

	it('preserves non-timestamp lines', () => {
		const input = ['Some intro text', '00:00:01 Hello', 'Some middle text', '00:00:02 World'].join('\n');

		const result = compactTranscript(input);

		expect(result).toContain('Some intro text');
		expect(result).toContain('Some middle text');
	});

	it('preserves timestamp lines that do not match the expected format', () => {
		const input = ['00:00:01 ', '00:00:02 Hello'].join('\n');

		const result = compactTranscript(input);

		expect(result).toContain('00:00:02 Hello');
	});

	it('handles multi-word timestamp lines without merging', () => {
		const input = ['00:00:01 Hello world', '00:00:02 Goodbye world'].join('\n');

		const result = compactTranscript(input);

		expect(result).toBe(input);
	});

	it('handles complex transcript with mixed line types', () => {
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

		const lines = result.split('\n');
		expect(lines).not.toContain('00:00:01 um');
		expect(lines).not.toContain('00:00:04 uh');
		expect(result).toContain('00:00:00 Welcome');
		expect(result).toContain('00:00:02 to the show everyone');
		expect(result).toContain('00:00:05 Today we discuss SvelteKit');
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
