const FILLER_WORDS = new Set(['um', 'uh', 'ah', 'oh', 'hmm', 'mm', 'hm', 'eh', 'er', 'mhm', 'uh-huh']);

const TIMESTAMP_REGEX = /^(\d{2}:\d{2}:\d{2})\s+(.+)$/;
const BRACKET_TIMESTAMP_REGEX = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
const MIN_LINE_LENGTH = 25;

const PROFANITY_REGEX = /\[\s*_+\s*\]/g;
const DUPLICATE_WORD_REGEX = /\b(\w+)(?:\s+\1\b)+/gi;
const FILLER_PHRASES_REGEX =
	/\b(?:and all that sort of stuff|and what have you|and stuff|or whatever|sort of|kind of|you know|i mean)\b[,.]?/gi;

export function compactTranscript(transcript: string): string {
	if (!transcript.trim()) return '';

	const normalized = transcript.replace(PROFANITY_REGEX, '__');
	const lines = normalized.split(/\r?\n/);
	const result: string[] = [];
	let lastTimestampLineIdx = -1;

	for (const line of lines) {
		const match = line.match(TIMESTAMP_REGEX);

		if (!match) {
			result.push(line);
			continue;
		}

		const [, timestamp, text] = match;
		const withoutPhrases = removeFillerPhrases(text);

		if (!withoutPhrases) {
			continue;
		}

		const words = withoutPhrases.split(/\s+/);
		const filteredWords = words.filter((word) => {
			const clean = word.toLowerCase().replace(/[.,!?;:'"…]+$/, '');
			return !FILLER_WORDS.has(clean);
		});

		const cleanedText = filteredWords.join(' ');

		if (!cleanedText) {
			continue;
		}

		if (cleanedText.length < MIN_LINE_LENGTH && lastTimestampLineIdx >= 0) {
			const prevMatch = result[lastTimestampLineIdx].match(TIMESTAMP_REGEX);
			if (prevMatch) {
				result[lastTimestampLineIdx] = `${prevMatch[1]} ${prevMatch[2]} ${cleanedText}`;
				continue;
			}
		}

		result.push(`${timestamp} ${cleanedText}`);
		lastTimestampLineIdx = result.length - 1;
	}

	return result.map(dedupeConsecutiveWords).join('\n');
}

/**
 * Strips conversational filler phrases (you know, kind of, sort of, ...) and
 * collapses the whitespace they leave behind.
 */
function removeFillerPhrases(text: string): string {
	return text
		.replace(FILLER_PHRASES_REGEX, '')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

/**
 * Collapses consecutive duplicate words to a single instance (e.g. "the the the"
 * becomes "the"). The first occurrence's casing is preserved.
 */
function dedupeConsecutiveWords(line: string): string {
	return line.replace(DUPLICATE_WORD_REGEX, '$1').replace(/\s{2,}/g, ' ');
}

export function cleanPastedTimestamps(text: string): string {
	return text.replace(BRACKET_TIMESTAMP_REGEX, '$1');
}

/**
 * Converts a number of seconds (e.g. from a caption segment start) into an
 * `HH:MM:SS` timestamp string. Fractional seconds are floored so the timestamp
 * marks where the segment begins.
 */
export function formatSecondsAsTimestamp(totalSeconds: number): string {
	const clamped = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
	const total = Math.floor(clamped);
	const hh = Math.floor(total / 3600);
	const mm = Math.floor((total % 3600) / 60);
	const ss = total % 60;
	return [hh, mm, ss].map((n) => String(n).padStart(2, '0')).join(':');
}
