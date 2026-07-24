<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import {
		QuoteIcon,
		XIcon,
		ArrowRightIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		UserIcon
	} from '@lucide/svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { Testimonial } from '$lib/types/testimonials';

	interface Props {
		testimonials: Testimonial[];
		eyebrow?: string | null;
		title?: string | null;
		description?: string | null;
		/**
		 * 'grid'     — cards, for an About or ministry page
		 * 'featured' — one large pull quote, for a section break
		 * 'carousel' — one at a time with controls, for a home page strip
		 */
		variant?: 'grid' | 'featured' | 'carousel';
		columns?: 2 | 3;
		/** Milliseconds between carousel slides. 0 turns autoplay off. */
		interval?: number;
		ctaHref?: string | null;
		ctaLabel?: string | null;
	}

	let {
		testimonials,
		eyebrow = null,
		title = null,
		description = null,
		variant = 'grid',
		columns = 3,
		interval = 7000,
		ctaHref = null,
		ctaLabel = null
	}: Props = $props();

	const columnClasses: Record<number, string> = {
		2: 'sm:grid-cols-2',
		3: 'sm:grid-cols-2 lg:grid-cols-3'
	};

	const locale = $derived(getLocale() === 'am' ? 'am-ET' : 'en-US');

	const formatDate = (value: Date | string | null) =>
		value
			? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(value))
			: '';

	/** Roughly three lines of a card — past this, the card clamps and offers the modal. */
	const isLong = (story: Testimonial) => story.message.length > 260;

	/* -------------------------------------------------------------- modal */
	let active = $state<Testimonial | null>(null);

	$effect(() => {
		if (!active) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') active = null;
	}

	/* ----------------------------------------------------------- carousel */
	let index = $state(0);
	let paused = $state(false);

	const current = $derived(testimonials[index] ?? null);

	function step(delta: number) {
		if (!testimonials.length) return;
		index = (index + delta + testimonials.length) % testimonials.length;
	}

	$effect(() => {
		if (variant !== 'carousel' || !interval || testimonials.length < 2) return;
		if (paused || active) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const id = setInterval(() => step(1), interval);
		return () => clearInterval(id);
	});
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet attribution(story: Testimonial, size = 'h-11 w-11')}
	<div class="flex items-center gap-3">
		{#if story.avatar}
			<img
				src="/files/{story.avatar}"
				alt={story.name}
				loading="lazy"
				class="{size} shrink-0 rounded-full border border-primary/20 object-cover"
			/>
		{:else}
			<span
				class="{size} flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary"
			>
				{story.name.charAt(0)}
			</span>
		{/if}
		<div class="min-w-0">
			<p class="truncate text-sm font-bold tracking-tight">{story.name}</p>
			{#if story.position}
				<p class="truncate text-xs text-muted-foreground">{story.position}</p>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet context(story: Testimonial)}
	{#if story.projectSlug || story.eventSlug || story.ministryAreaName}
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
			{#if story.projectSlug}
				<a href="/projects/{story.projectSlug}" class="font-semibold text-primary hover:underline">
					{story.projectName}
				</a>
			{:else if story.eventSlug}
				<a href="/events/{story.eventSlug}" class="font-semibold text-primary hover:underline">
					{story.eventName}
				</a>
			{:else if story.ministryAreaName}
				<span class="font-semibold text-primary">{story.ministryAreaName}</span>
			{/if}
			{#if story.storyDate}
				<span class="text-muted-foreground">{formatDate(story.storyDate)}</span>
			{/if}
		</div>
	{/if}
{/snippet}

{#if testimonials.length}
	<section class="w-full">
		{#if eyebrow || title || description}
			<div class="mb-10 flex flex-col items-center gap-3 text-center">
				{#if eyebrow}
					<span
						class="rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-[11px] font-bold tracking-widest text-primary uppercase backdrop-blur-sm"
					>
						{eyebrow}
					</span>
				{/if}
				{#if title}
					<h2
						class="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl"
					>
						{title}
					</h2>
				{/if}
				{#if description}
					<p class="max-w-xl text-base text-muted-foreground">{description}</p>
				{/if}
			</div>
		{/if}

		{#if variant === 'featured'}
			<!-- ----------------------------------------------------- featured -->
			{@const story = testimonials[0]}
			<Card
				class="relative overflow-hidden border-primary/15 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md"
			>
				<QuoteIcon
					class="absolute -top-4 -right-2 h-32 w-32 text-primary/5"
					aria-hidden="true"
				/>
				<CardContent class="flex flex-col gap-6 p-8 sm:p-12">
					{#if story.title}
						<h3 class="text-xl font-extrabold tracking-tight sm:text-2xl">{story.title}</h3>
					{/if}
					<blockquote
						class="text-lg leading-relaxed font-light whitespace-pre-line text-foreground sm:text-xl"
					>
						{story.message}
					</blockquote>
					<div class="flex flex-wrap items-center justify-between gap-4">
						{@render attribution(story, 'h-12 w-12')}
						{@render context(story)}
					</div>
				</CardContent>
			</Card>
		{:else if variant === 'carousel'}
			<!-- ----------------------------------------------------- carousel -->
			{#if current}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					onmouseenter={() => (paused = true)}
					onmouseleave={() => (paused = false)}
					onfocusin={() => (paused = true)}
					onfocusout={() => (paused = false)}
					class="relative"
					aria-live="polite"
				>
					<Card
						class="relative overflow-hidden border-primary/15 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md"
					>
						<CardContent class="flex min-h-[16rem] flex-col justify-center gap-6 p-8 sm:p-10">
							{#key current.id}
								<div transition:fade={{ duration: 250 }} class="flex flex-col gap-5">
									<QuoteIcon class="h-7 w-7 text-primary/40" aria-hidden="true" />
									{#if current.title}
										<h3 class="text-lg font-bold tracking-tight">{current.title}</h3>
									{/if}
									<blockquote class="text-base leading-relaxed whitespace-pre-line text-muted-foreground">
										{isLong(current) ? `${current.message.slice(0, 260).trim()}…` : current.message}
									</blockquote>
									{#if isLong(current)}
										<button
											type="button"
											onclick={() => (active = current)}
											class="w-fit text-xs font-bold text-primary hover:underline"
										>
											{m.testimonial_read_full()}
										</button>
									{/if}
									<div class="flex flex-wrap items-center justify-between gap-4">
										{@render attribution(current)}
										{@render context(current)}
									</div>
								</div>
							{/key}
						</CardContent>
					</Card>

					{#if testimonials.length > 1}
						<div class="mt-5 flex items-center justify-center gap-4">
							<button
								type="button"
								onclick={() => step(-1)}
								aria-label={m.testimonial_previous()}
								class="flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
							>
								<ChevronLeftIcon class="h-4 w-4" />
							</button>

							<div class="flex items-center gap-1.5">
								{#each testimonials as story, i (story.id)}
									<button
										type="button"
										onclick={() => (index = i)}
										aria-label={m.testimonial_go_to({ number: i + 1 })}
										aria-current={i === index}
										class="h-1.5 rounded-full transition-all duration-300 {i === index
											? 'w-6 bg-primary'
											: 'w-1.5 bg-primary/25 hover:bg-primary/50'}"
									></button>
								{/each}
							</div>

							<button
								type="button"
								onclick={() => step(1)}
								aria-label={m.testimonial_next()}
								class="flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
							>
								<ChevronRightIcon class="h-4 w-4" />
							</button>
						</div>
					{/if}
				</div>
			{/if}
		{:else}
			<!-- --------------------------------------------------------- grid -->
			<div class="grid gap-6 {columnClasses[columns]}">
				{#each testimonials as story, i (story.id)}
					<div transition:fly={{ y: 20, duration: 500, delay: 60 + i * 40 }}>
						<Card
							class="flex h-full flex-col border-primary/10 bg-card/40 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
						>
							<CardContent class="flex flex-1 flex-col gap-4 p-6">
								<QuoteIcon class="h-6 w-6 shrink-0 text-primary/40" aria-hidden="true" />

								{#if story.title}
									<h3 class="leading-snug font-bold tracking-tight">{story.title}</h3>
								{/if}

								<blockquote
									class="text-sm leading-relaxed whitespace-pre-line text-muted-foreground {isLong(
										story
									)
										? 'line-clamp-5'
										: ''}"
								>
									{story.message}
								</blockquote>

								{#if isLong(story)}
									<button
										type="button"
										onclick={() => (active = story)}
										class="w-fit text-xs font-bold text-primary transition-transform duration-300 hover:translate-x-0.5"
									>
										{m.testimonial_read_full()} →
									</button>
								{/if}

								<div class="mt-auto flex flex-col gap-2 border-t border-primary/5 pt-4">
									{@render attribution(story)}
									{@render context(story)}
								</div>
							</CardContent>
						</Card>
					</div>
				{/each}
			</div>
		{/if}

		{#if ctaHref && ctaLabel}
			<div class="mt-10 flex justify-center">
				<Button href={ctaHref} variant="outline" class="group gap-2 border-primary/20 bg-primary/5">
					{ctaLabel}
					<ArrowRightIcon
						class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
					/>
				</Button>
			</div>
		{/if}
	</section>
{/if}

<!-- -------------------------------------------------------------- story -->
{#if active}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
		role="dialog"
		aria-modal="true"
		aria-label={active.title ?? active.name}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="absolute inset-0" onclick={() => (active = null)}></div>

		<div
			transition:fly={{ y: 20, duration: 300 }}
			class="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-primary/15 bg-card p-6 shadow-2xl sm:p-8"
		>
			<button
				type="button"
				onclick={() => (active = null)}
				aria-label={m.testimonial_close()}
				class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-background/80 text-primary backdrop-blur-sm transition-colors hover:bg-primary/10"
			>
				<XIcon class="h-4 w-4" />
			</button>

			<div class="flex flex-col gap-5">
				<QuoteIcon class="h-8 w-8 text-primary/40" aria-hidden="true" />

				{#if active.title}
					<h3 class="pr-10 text-2xl font-extrabold tracking-tight">{active.title}</h3>
				{/if}

				<blockquote class="leading-relaxed whitespace-pre-line text-muted-foreground">
					{active.message}
				</blockquote>

				<div class="flex flex-wrap items-center justify-between gap-4 border-t border-primary/10 pt-4">
					{@render attribution(active, 'h-12 w-12')}
					{@render context(active)}
				</div>
			</div>
		</div>
	</div>
{/if}