<script lang="ts">
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import { toast } from 'svelte-sonner';

	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	import {
		ArrowLeftIcon,
		ArrowRightIcon,
		ClockIcon,
		EyeIcon,
		DownloadIcon,
		LinkIcon,
		ListIcon,
		BookOpenIcon,
		FileTextIcon,
		MicIcon,
		GraduationCapIcon,
		VideoIcon,
		HeadphonesIcon,
		QuoteIcon
	} from '@lucide/svelte';
	import {
		IconBrandFacebook,
		IconBrandX,
		IconBrandInstagram,
		IconBrandLinkedin,
		IconBrandYoutube,
		IconBrandTelegram,
		IconBrandTiktok,
		IconWorld
	} from '@tabler/icons-svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props();

	const typeIcons: Record<string, typeof FileTextIcon> = {
		article: FileTextIcon,
		sermon: MicIcon,
		teaching: GraduationCapIcon,
		video: VideoIcon,
		audio: HeadphonesIcon,
		bible_study: BookOpenIcon
	};

	const socialIcons: Record<string, typeof IconWorld> = {
		facebook: IconBrandFacebook,
		x: IconBrandX,
		instagram: IconBrandInstagram,
		linkedin: IconBrandLinkedin,
		youtube: IconBrandYoutube,
		telegram: IconBrandTelegram,
		tiktok: IconBrandTiktok,
		website: IconWorld
	};

	function typeLabel(type: string) {
		const labels: Record<string, string> = {
			article: m.blog_type_article(),
			sermon: m.blog_type_sermon(),
			teaching: m.blog_type_teaching(),
			video: m.blog_type_video(),
			audio: m.blog_type_audio(),
			bible_study: m.blog_type_bible_study()
		};
		return labels[type] ?? type;
	}

	function formatDate(value: string | Date | null) {
		if (!value) return '';
		return new Intl.DateTimeFormat(getLocale() === 'am' ? 'am-ET' : 'en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(new Date(value));
	}

	const shareUrl = $derived(page.url.href);
	const TypeIcon = $derived(typeIcons[data.post.resourceType ?? 'article']);
	const byline = $derived(data.post.speakerName ?? data.post.authorName);
	const bylinePhoto = $derived(data.post.speakerPhoto ?? data.post.authorPhoto);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success(m.post_share_copied());
		} catch {
			toast.error(m.post_share_copy_failed());
		}
	}

	let activeHeading = $state('');

	$effect(() => {
		if (!data.outline.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) activeHeading = entry.target.id;
				}
			},
			{ rootMargin: '-80px 0px -70% 0px', threshold: 0 }
		);

		for (const heading of data.outline) {
			const el = document.getElementById(heading.id);
			if (el) observer.observe(el);
		}

		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>{data.post.title} — Steward of Life</title>
	<meta name="description" content={data.post.excerpt ?? ''} />
	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={data.post.excerpt ?? ''} />
	<meta property="og:type" content="article" />
	{#if data.post.featuredImage}
		<meta property="og:image" content={data.post.featuredImage} />
	{/if}
</svelte:head>

<div
	class="relative min-h-dvh w-full overflow-hidden bg-background px-4 py-20 text-foreground transition-colors duration-300 sm:px-6 lg:px-8"
>
	<div
		class="absolute top-0 left-1/4 -z-10 h-96 w-96 animate-pulse rounded-full bg-primary/10 opacity-70 blur-3xl duration-4000 dark:bg-primary/5"
	></div>
	<div
		class="absolute right-1/4 bottom-0 -z-10 h-96 w-96 animate-pulse rounded-full bg-primary/5 opacity-70 blur-3xl duration-6000 dark:bg-primary/10"
	></div>

	<main class="mx-auto max-w-6xl">
		<a
			href="/blog"
			class="group mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
		>
			<ArrowLeftIcon class="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
			{m.post_back_to_resources()}
		</a>

		<!-- ------------------------------------------------------------ head -->
		<header transition:fly={{ y: 30, duration: 700 }} class="mb-10 flex flex-col gap-5">
			<div class="flex flex-wrap items-center gap-2">
				<Badge class="gap-1.5 font-semibold">
					<TypeIcon class="h-3.5 w-3.5" />
					{typeLabel(data.post.resourceType ?? 'article')}
				</Badge>
				{#if data.post.categoryName}
					<a
						href="/blog?category={data.post.categoryId}"
						class="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
					>
						{data.post.categoryName}
					</a>
				{/if}
				{#if data.post.ministryAreaName}
					<a
						href="/blog?area={data.post.ministryAreaId}"
						class="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
					>
						{data.post.ministryAreaName}
					</a>
				{/if}
			</div>

			<h1
				class="max-w-4xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl"
			>
				{data.post.title}
			</h1>

			{#if data.post.excerpt}
				<p class="max-w-3xl text-lg leading-relaxed text-muted-foreground">
					{data.post.excerpt}
				</p>
			{/if}

			<div class="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
				{#if byline}
					<span class="flex items-center gap-2.5">
						{#if bylinePhoto}
							<img
								src="/files/{bylinePhoto}"
								alt={byline}
								class="h-9 w-9 rounded-full border border-primary/20 object-cover"
							/>
						{/if}
						<span class="font-bold text-foreground">{byline}</span>
					</span>
				{/if}
				{#if data.post.publishedAt}
					<span>{formatDate(data.post.publishedAt)}</span>
				{/if}
				<span class="flex items-center gap-1.5">
					<ClockIcon class="h-4 w-4" />
					{m.blog_min_read({ minutes: data.post.readMinutes })}
				</span>
				<span class="flex items-center gap-1.5">
					<EyeIcon class="h-4 w-4" />
					{data.post.viewCount ?? 0}
				</span>
			</div>
		</header>

		<!-- ----------------------------------------------------------- media -->
		<div transition:fly={{ y: 20, duration: 600, delay: 100 }} class="mb-12">
			{#if data.post.videoEmbed}
				<div
					class="aspect-video w-full overflow-hidden rounded-3xl border border-primary/10 shadow-lg"
				>
					<iframe
						src={data.post.videoEmbed}
						title={data.post.title}
						class="h-full w-full"
						loading="lazy"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				</div>
			{:else if data.post.featuredImage}
				<figure class="overflow-hidden rounded-3xl border border-primary/10 shadow-lg">
					<img
						src="/files/{data.post.featuredImage}"
						alt={data.post.title}
						class="max-h-[60vh] w-full object-cover"
					/>
				</figure>
			{/if}

			{#if data.post.audioUrl}
				<Card class="mt-6 border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
					<CardContent class="flex flex-col gap-3 pt-6">
						<div class="flex items-center gap-2.5">
							<HeadphonesIcon class="h-5 w-5 text-primary" />
							<span class="text-sm font-bold tracking-wide">{m.post_listen_title()}</span>
						</div>
						<!-- svelte-ignore a11y_media_has_caption -->
						<audio controls preload="none" src={data.post.audioUrl} class="w-full"></audio>
					</CardContent>
				</Card>
			{/if}
		</div>

		<!-- ----------------------------------------------------- body + rail -->
		<div class="grid gap-10 lg:grid-cols-12">
			<article
				transition:fly={{ y: 20, duration: 600, delay: 150 }}
				class="lg:col-span-8"
			>
				{#if data.post.bibleReferences}
					<div
						class="mb-8 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4"
					>
						<QuoteIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
						<div>
							<p class="text-[11px] font-bold tracking-widest text-primary uppercase">
								{m.post_bible_references()}
							</p>
							<p class="font-mono text-sm font-semibold">{data.post.bibleReferences}</p>
						</div>
					</div>
				{/if}

				<div class="article-content">
					{@html data.post.content}
				</div>

				{#if data.tags.length}
					<div class="mt-10 flex flex-wrap items-center gap-2 border-t border-primary/10 pt-6">
						<span class="text-xs font-bold tracking-widest text-muted-foreground uppercase">
							{m.post_tags_title()}
						</span>
						{#each data.tags as tag (tag.id)}
							<a
								href="/blog?tag={tag.id}"
								class="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
							>
								#{tag.name}
							</a>
						{/each}
					</div>
				{/if}

				<!-- gallery -->
				{#if data.gallery.length}
					<section class="mt-12">
						<h2 class="mb-4 text-lg font-bold tracking-wide">{m.post_gallery_title()}</h2>
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{#each data.gallery as item (item.id)}
								<figure
									class="group overflow-hidden rounded-2xl border border-primary/10 bg-primary/5"
								>
									<img
										src="/files/{item.imageUrl}"
										alt={item.caption ?? data.post.title}
										loading="lazy"
										class="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									{#if item.caption}
										<figcaption class="px-3 py-2 text-[11px] text-muted-foreground">
											{item.caption}
										</figcaption>
									{/if}
								</figure>
							{/each}
						</div>
					</section>
				{/if}

				<!-- author -->
				{#if data.post.authorName && data.post.authorBio}
					<Card class="mt-12 border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
						<CardContent class="flex flex-col gap-4 pt-6 sm:flex-row sm:gap-5">
							{#if data.post.authorPhoto}
								<img
									src="/files/{data.post.authorPhoto}"
									alt={data.post.authorName}
									class="h-20 w-20 shrink-0 rounded-2xl border border-primary/20 object-cover"
								/>
							{/if}
							<div class="flex flex-col gap-2">
								<div>
									<p class="text-[11px] font-bold tracking-widest text-primary uppercase">
										{m.post_author_title()}
									</p>
									<p class="text-lg font-bold tracking-tight">{data.post.authorName}</p>
									{#if data.post.authorPosition}
										<p class="text-sm text-muted-foreground">{data.post.authorPosition}</p>
									{/if}
								</div>
								<p class="text-sm leading-relaxed text-muted-foreground">{data.post.authorBio}</p>

								{#if data.authorSocials.length}
									<div class="mt-1 flex flex-wrap gap-2">
										{#each data.authorSocials as social (social.id)}
											{@const SocialIcon = socialIcons[social.platform] ?? IconWorld}
											<a
												href={social.url}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={social.platform}
												class="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
											>
												<SocialIcon class="h-4 w-4" />
											</a>
										{/each}
									</div>
								{/if}
							</div>
						</CardContent>
					</Card>
				{/if}
			</article>

			<!-- rail -->
			<aside transition:fly={{ y: 20, duration: 600, delay: 200 }} class="lg:col-span-4">
				<div class="flex flex-col gap-5 lg:sticky lg:top-24">
					{#if data.outline.length > 1}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardHeader class="flex flex-row items-center gap-2.5 pb-2">
								<ListIcon class="h-4 w-4 text-primary" />
								<CardTitle class="!mt-0 text-sm font-bold tracking-wide">
									{m.post_outline_title()}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<nav class="flex flex-col gap-1 border-l border-primary/10">
									{#each data.outline as heading (heading.id)}
										<a
											href="#{heading.id}"
											class="-ml-px border-l-2 py-1 text-sm transition-colors {heading.level === 3
												? 'pl-6'
												: 'pl-3'} {activeHeading === heading.id
												? 'border-primary font-semibold text-primary'
												: 'border-transparent text-muted-foreground hover:text-foreground'}"
										>
											{heading.text}
										</a>
									{/each}
								</nav>
							</CardContent>
						</Card>
					{/if}

					{#if data.post.downloadUrl}
						<Button href={data.post.downloadUrl} download class="w-full gap-2">
							<DownloadIcon class="h-4 w-4" />
							{m.post_download()}
						</Button>
					{/if}

					<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
						<CardHeader class="pb-2">
							<CardTitle class="text-sm font-bold tracking-wide">{m.post_share_title()}</CardTitle>
						</CardHeader>
						<CardContent class="grid grid-cols-4 gap-2">
							<a
								href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(shareUrl)}"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Facebook"
								class="flex h-10 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary/10"
							>
								<IconBrandFacebook class="h-4 w-4" />
							</a>
							<a
								href="https://t.me/share/url?url={encodeURIComponent(shareUrl)}&text={encodeURIComponent(
									data.post.title
								)}"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Telegram"
								class="flex h-10 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary/10"
							>
								<IconBrandTelegram class="h-4 w-4" />
							</a>
							<a
								href="https://twitter.com/intent/tweet?url={encodeURIComponent(
									shareUrl
								)}&text={encodeURIComponent(data.post.title)}"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="X"
								class="flex h-10 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary/10"
							>
								<IconBrandX class="h-4 w-4" />
							</a>
							<button
								type="button"
								onclick={copyLink}
								aria-label={m.post_share_copy()}
								class="flex h-10 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary/10"
							>
								<LinkIcon class="h-4 w-4" />
							</button>
						</CardContent>
					</Card>

					{#if data.relatedBooks.length}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardHeader class="pb-2">
								<CardTitle class="text-sm font-bold tracking-wide">
									{m.post_related_books_title()}
								</CardTitle>
							</CardHeader>
							<CardContent class="flex flex-col gap-3">
								{#each data.relatedBooks as book (book.id)}
									<a
										href="/books/{book.slug}"
										class="group flex items-center gap-3 rounded-xl border border-primary/5 bg-primary/5 p-2.5 transition-all duration-300 hover:border-primary/20 hover:bg-primary/10"
									>
										{#if book.coverImage}
											<img
												src="/files/{book.coverImage}"
												alt={book.title}
												class="h-16 w-12 shrink-0 rounded-md object-cover shadow-sm"
											/>
										{:else}
											<div
												class="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10"
											>
												<BookOpenIcon class="h-5 w-5 text-primary/50" />
											</div>
										{/if}
										<div class="min-w-0">
											<p
												class="truncate text-sm font-bold transition-colors group-hover:text-primary"
											>
												{book.title}
											</p>
											{#if book.subtitle}
												<p class="truncate text-xs text-muted-foreground">{book.subtitle}</p>
											{/if}
										</div>
									</a>
								{/each}
							</CardContent>
						</Card>
					{/if}
				</div>
			</aside>
		</div>

		<!-- --------------------------------------------------------- related -->
		{#if data.related.length}
			<section class="mt-16">
				<h2 class="mb-6 text-xl font-bold tracking-tight">{m.post_related_title()}</h2>
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.related as item (item.id)}
						{@const Icon = typeIcons[item.resourceType ?? 'article']}
						<a href="/blog/{item.slug}" class="group block h-full">
							<Card
								class="flex h-full flex-col overflow-hidden border-primary/10 bg-card/40 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
							>
								<div class="relative aspect-[16/10] overflow-hidden">
									{#if item.featuredImage}
										<img
											src="/files/{item.featuredImage}"
											alt={item.title}
											loading="lazy"
											class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-primary/10">
											<Icon class="h-8 w-8 text-primary/40" />
										</div>
									{/if}
								</div>
								<CardContent class="flex flex-1 flex-col gap-2 p-5">
									<span class="text-[11px] font-bold tracking-wide text-primary">
										{typeLabel(item.resourceType ?? 'article')}
									</span>
									<h3
										class="line-clamp-2 leading-snug font-bold tracking-tight transition-colors group-hover:text-primary"
									>
										{item.title}
									</h3>
									{#if item.excerpt}
										<p class="line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p>
									{/if}
								</CardContent>
							</Card>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- -------------------------------------------------------- prev/next -->
		{#if data.previous || data.next}
			<nav class="mt-12 grid gap-4 sm:grid-cols-2">
				{#if data.previous}
					<a
						href="/blog/{data.previous.slug}"
						class="group flex flex-col gap-1 rounded-2xl border border-primary/10 bg-card/40 p-5 backdrop-blur-md transition-all duration-300 hover:border-primary/25 hover:bg-primary/5"
					>
						<span
							class="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
						>
							<ArrowLeftIcon
								class="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1"
							/>
							{m.post_previous()}
						</span>
						<span class="line-clamp-2 font-bold tracking-tight group-hover:text-primary">
							{data.previous.title}
						</span>
					</a>
				{:else}
					<div class="hidden sm:block"></div>
				{/if}

				{#if data.next}
					<a
						href="/blog/{data.next.slug}"
						class="group flex flex-col items-end gap-1 rounded-2xl border border-primary/10 bg-card/40 p-5 text-right backdrop-blur-md transition-all duration-300 hover:border-primary/25 hover:bg-primary/5"
					>
						<span
							class="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-muted-foreground uppercase"
						>
							{m.post_next()}
							<ArrowRightIcon
								class="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
							/>
						</span>
						<span class="line-clamp-2 font-bold tracking-tight group-hover:text-primary">
							{data.next.title}
						</span>
					</a>
				{/if}
			</nav>
		{/if}
	</main>
</div>

<style>
	/* Styling for editor-authored HTML coming out of `blog.content`. */
	.article-content {
		font-size: 1.0625rem;
		line-height: 1.85;
		color: var(--foreground);
	}

	.article-content :global(h2) {
		margin: 2.5rem 0 1rem;
		font-size: 1.5rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		scroll-margin-top: 6rem;
	}

	.article-content :global(h3) {
		margin: 2rem 0 0.75rem;
		font-size: 1.2rem;
		font-weight: 700;
		scroll-margin-top: 6rem;
	}

	.article-content :global(p) {
		margin-bottom: 1.25rem;
	}

	.article-content :global(a) {
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.article-content :global(ul),
	.article-content :global(ol) {
		margin: 0 0 1.25rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.article-content :global(ul) {
		list-style: disc;
	}

	.article-content :global(ol) {
		list-style: decimal;
	}

	.article-content :global(blockquote) {
		margin: 1.75rem 0;
		border-left: 3px solid var(--primary);
		background: color-mix(in oklab, var(--primary) 6%, transparent);
		padding: 1rem 1.25rem;
		border-radius: 0 0.75rem 0.75rem 0;
		font-style: italic;
	}

	.article-content :global(img) {
		margin: 1.75rem 0;
		width: 100%;
		border-radius: 1rem;
		border: 1px solid color-mix(in oklab, var(--primary) 12%, transparent);
	}

	.article-content :global(hr) {
		margin: 2.5rem 0;
		border-color: color-mix(in oklab, var(--primary) 12%, transparent);
	}

	.article-content :global(strong) {
		font-weight: 700;
	}

	@media (prefers-reduced-motion: reduce) {
		.article-content :global(*) {
			transition: none !important;
		}
	}
</style>