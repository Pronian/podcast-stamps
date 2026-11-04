import { getVideoDetails } from 'youtube-caption-extractor';
import { parseYouTubeUrl } from '#lib/utils/youtube.js';
import { formatSecondsAsTimestamp } from '#lib/utils/transcript.js';

export type TranscriptResult = { ok: true; transcript: string; title: string } | { ok: false; error: string };

/** Extracts a timestamped transcript from a YouTube URL, or a friendly error. */
export async function fetchTranscript(url: string): Promise<TranscriptResult> {
	const videoId = parseYouTubeUrl(url);

	if (!videoId) {
		return { ok: false, error: 'That does not look like a valid YouTube link.' };
	}

	try {
		const details = await getVideoDetails({ videoID: videoId, lang: 'en' });

		if (details.subtitles.length === 0) {
			return { ok: false, error: 'No captions are available for this video.' };
		}

		const transcript = details.subtitles
			.map((segment) => {
				const text = segment.text.replace(/\s+/g, ' ').trim();
				return text ? `${formatSecondsAsTimestamp(Number.parseFloat(segment.start))} ${text}` : '';
			})
			.filter((line) => line.length > 0)
			.join('\n');

		if (!transcript) {
			return { ok: false, error: 'No captions are available for this video.' };
		}

		return { ok: true, transcript, title: details.title };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);

		if (msg.includes('Video unavailable') || msg.includes('private')) {
			return { ok: false, error: 'This video is unavailable or private.' };
		}

		if (msg.includes('LOGIN_REQUIRED') || msg.includes('not a bot')) {
			return { ok: false, error: 'Could not fetch the transcript right now. Please try again.' };
		}

		return { ok: false, error: 'Failed to fetch the transcript. Please try again.' };
	}
}
