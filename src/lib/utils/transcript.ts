const FILLER_WORDS = new Set(['um', 'uh', 'ah', 'oh', 'hmm', 'mm', 'hm', 'eh', 'er', 'mhm', 'uh-huh']);

const TIMESTAMP_REGEX = /^(\d{2}:\d{2}:\d{2})\s+(.+)$/;
const BRACKET_TIMESTAMP_REGEX = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
const MIN_LINE_LENGTH = 25;

export function compactTranscript(transcript: string): string {
	if (!transcript.trim()) return '';

	const lines = transcript.split(/\r?\n/);
	const result: string[] = [];
	let lastTimestampLineIdx = -1;

	for (const line of lines) {
		const match = line.match(TIMESTAMP_REGEX);

		if (!match) {
			result.push(line);
			continue;
		}

		const [, timestamp, text] = match;
		const trimmedText = text.trim();

		if (!trimmedText) {
			continue;
		}

		const words = trimmedText.split(/\s+/);
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

	return result.join('\n');
}

export function cleanPastedTimestamps(text: string): string {
	return text.replace(BRACKET_TIMESTAMP_REGEX, '$1');
}
