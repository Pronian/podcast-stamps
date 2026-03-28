const FILLER_WORDS = new Set(['um', 'uh', 'ah', 'oh', 'hmm', 'mm', 'hm', 'eh', 'er', 'mhm', 'uh-huh']);

const TIMESTAMP_REGEX = /^(\d{2}:\d{2}:\d{2})\s+(.+)$/;
const BRACKET_TIMESTAMP_REGEX = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;

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

		const [, , text] = match;
		const trimmedText = text.trim();
		const words = trimmedText.split(/\s+/);

		if (!trimmedText) {
			continue;
		}

		if (words.length === 1) {
			const word = words[0];
			const wordLower = word.toLowerCase().replace(/[.,!?;:'"…]+$/, '');

			if (FILLER_WORDS.has(wordLower)) {
				continue;
			}

			if (lastTimestampLineIdx >= 0) {
				const prevMatch = result[lastTimestampLineIdx].match(TIMESTAMP_REGEX);
				if (prevMatch) {
					result[lastTimestampLineIdx] = `${prevMatch[1]} ${prevMatch[2]} ${word}`;
					continue;
				}
			}
		}

		result.push(line);
		lastTimestampLineIdx = result.length - 1;
	}

	return result.join('\n');
}

export function cleanPastedTimestamps(text: string): string {
	return text.replace(BRACKET_TIMESTAMP_REGEX, '$1');
}
