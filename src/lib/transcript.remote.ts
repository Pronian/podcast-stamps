import { query } from '$app/server';
import * as v from 'valibot';
import { fetchTranscript } from '$lib/server/transcript';

export const getTranscript = query(v.pipe(v.string(), v.nonEmpty()), fetchTranscript);
