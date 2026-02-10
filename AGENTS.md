# AGENTS.md - Coding Guidelines for Podcast Stamps

## Project Overview

SvelteKit 2 and Svelte 5 application for generating timestamped show notes from YouTube transcripts. Uses Svelte 5 runes, TypeScript, and modern CSS.

## Build/Lint/Test Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm build               # Production build
pnpm preview             # Preview production build

# Code Quality
pnpm lint                # Run ESLint + Prettier checks
pnpm format              # Auto-format with Prettier
pnpm check               # Type-check with svelte-check

# Testing
pnpm test                # Run all tests (unit + e2e)

# Run single test file
pnpm vitest run src/demo.spec.ts
pnpm vitest run src/routes/page.svelte.spec.ts
pnpm exec playwright test e2e/demo.test.ts

# Run tests in watch mode
pnpm vitest
pnpm vitest --ui         # With UI
```

## Code Style Guidelines

### Formatting (Prettier)

- **Indentation**: Tabs (not spaces)
- **Quote style**: Single quotes
- **Trailing commas**: Always
- **Print width**: 120 characters
- **Svelte**: Use `prettier-plugin-svelte`

### TypeScript

- Strict mode enabled
- Use TypeScript for all new files
- Prefer explicit types over implicit
- Use `$types` imports for SvelteKit types: `import type { RequestHandler } from './$types'`
- Path aliases: `$lib` for library code

### Naming Conventions

- **Components**: PascalCase (`Button.svelte`, `UserCard.svelte`)
- **Files**: kebab-case for utilities (`string-utils.ts`)
- **Variables**: camelCase (`userData`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ApiResponse`)
- **SvelteKit routes**: Follow file-based routing conventions
- **Server routes**: `+server.ts` for API endpoints
- **Environment variables**: SCREAMING_SNAKE_CASE in `.env`

### CSS/Styling

- Use CSS nesting (native, not SCSS)
- CSS variables defined in `+layout.svelte` `:global`
- Color scheme: Dark theme with amber accent (`#f59e0b`)
- Prefer logical properties: `margin-inline`, `padding-block`
- Use CSS custom properties for theming

```css
.example {
	/* Good - logical properties */
	margin-inline: auto;
	padding-block: var(--spacing-md);

	/* Good - CSS nesting */
	& .child {
		color: var(--color-accent);
	}
}
```

### Imports

```typescript
// Order: external → svelte → internal
import { onMount } from 'svelte';
import type { Snippet } from 'svelte';
import { goto } from '$app/navigation';
import { Button } from '$lib/components';
```

## Testing

### Unit Tests (Vitest + Browser Mode)

- Location: Co-located with source (`page.svelte.spec.ts`)
- Uses `@vitest/browser-playwright` for component testing
- Client tests: `src/**/*.svelte.{test,spec}.{js,ts}`
- Server tests: `src/**/*.{test,spec}.{js,ts}` (excluding svelte tests)

```typescript
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render', async () => {
		render(Page);
		// assertions
	});
});
```

### E2E Tests (Playwright)

- Location: `e2e/` directory
- Config: `playwright.config.ts`
- Auto-starts server on port 4173

## Key Configuration

- **Framework**: SvelteKit 2.x with Svelte 5
- **Build**: Vite 7.x
- **TypeScript**: Strict mode, erasable syntax only
- **Experimental**: `remoteFunctions` enabled, async Svelte enabled
- **Package manager**: pnpm

## Important Notes

- **Run lint and check** after making changes
