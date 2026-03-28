import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
		await expect.element(heading).toHaveTextContent('Podcast Stamps');
	});

	it('should render subtitle', async () => {
		render(Page);

		const subtitle = page.getByText('Generate timestamped show notes from YouTube transcripts');
		await expect.element(subtitle).toBeInTheDocument();
	});

	it('should render the transcript textarea', async () => {
		render(Page);

		const textarea = page.getByPlaceholder(
			"00:00:00 Welcome to the show everybody...\n00:00:15 Today we're going to talk about...\n00:01:30 Let's get into our first topic...",
		);
		await expect.element(textarea).toBeInTheDocument();
	});

	it('should have generate button disabled initially', async () => {
		render(Page);

		const generateBtn = page.getByRole('button', { name: 'Generate Timestamps' });
		await expect.element(generateBtn).toBeDisabled();
	});

	it('should have compact button disabled initially', async () => {
		render(Page);

		const compactBtn = page.getByRole('button', { name: 'Compact Transcript' });
		await expect.element(compactBtn).toBeDisabled();
	});

	it('should enable generate button when transcript is entered', async () => {
		render(Page);

		const textarea = page.getByPlaceholder(
			"00:00:00 Welcome to the show everybody...\n00:00:15 Today we're going to talk about...\n00:01:30 Let's get into our first topic...",
		);
		await textarea.fill('Some transcript text');

		const generateBtn = page.getByRole('button', { name: 'Generate Timestamps' });
		await expect.element(generateBtn).not.toBeDisabled();
	});

	it('should enable compact button when transcript is entered', async () => {
		render(Page);

		const textarea = page.getByPlaceholder(
			"00:00:00 Welcome to the show everybody...\n00:00:15 Today we're going to talk about...\n00:01:30 Let's get into our first topic...",
		);
		await textarea.fill('Some transcript text');

		const compactBtn = page.getByRole('button', { name: 'Compact Transcript' });
		await expect.element(compactBtn).not.toBeDisabled();
	});

	it('should not show output section initially', async () => {
		render(Page);

		const outputSection = document.querySelector('.output-section');
		expect(outputSection).toBeNull();
	});

	it('should show token count', async () => {
		render(Page);

		const tokenCount = page.getByText(/tokens/);
		await expect.element(tokenCount).toBeInTheDocument();
	});
});
