import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
	LLM_URL: {
		static: true,
		schema: v.pipe(v.string(), v.url()),
	},
	LLM_MODEL_ID: {
		static: true,
		schema: v.pipe(v.string(), v.minLength(1)),
	},
	// optional: local OpenAI-compatible servers (LM Studio, Ollama, ...) don't require a key
	LLM_API_KEY: {
		static: true,
		schema: v.optional(v.pipe(v.string(), v.minLength(1))),
	},
});
