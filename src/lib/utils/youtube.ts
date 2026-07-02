const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const PATH_PREFIXES = new Set(['shorts', 'embed', 'live', 'v']);

function toUrl(input: string): URL | null {
	try {
		return new URL(input.includes('://') ? input : `https://${input}`);
	} catch {
		return null;
	}
}

/**
 * Extracts the 11-character YouTube video ID from a URL or raw ID.
 * Supports watch URLs, youtu.be short links, shorts, embed, and live paths.
 * Returns `null` when no valid ID can be extracted.
 */
export function parseYouTubeUrl(input: string): string | null {
	const trimmed = input.trim();
	if (!trimmed) return null;

	if (VIDEO_ID_PATTERN.test(trimmed)) return trimmed;

	const url = toUrl(trimmed);
	if (url) {
		const host = url.hostname.replace(/^(www|m)\./, '');

		if (host === 'youtu.be') {
			const id = url.pathname.split('/').filter(Boolean)[0];
			if (id && VIDEO_ID_PATTERN.test(id)) return id;
		}

		if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
			const v = url.searchParams.get('v');
			if (v && VIDEO_ID_PATTERN.test(v)) return v;

			const segments = url.pathname.split('/').filter(Boolean);
			if (segments.length >= 2) {
				const last = segments[segments.length - 1];
				const prefix = segments[segments.length - 2];
				if (PATH_PREFIXES.has(prefix) && VIDEO_ID_PATTERN.test(last)) return last;
			}
		}
	}

	return null;
}
