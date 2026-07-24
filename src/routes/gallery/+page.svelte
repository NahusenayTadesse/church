<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fly, fade } from 'svelte/transition';

	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';

	import {
		SearchIcon,
		ImageIcon,
		PlayIcon,
		XIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		CalendarIcon,
		CameraIcon,
		LinkIcon,
		ExternalLinkIcon
	} from '@lucide/svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props();

	let searchTerm = $state(data.filters.q);
	let timer: ReturnType<typeof setTimeout>;

	function setParams(patch: Record<string, string | number | null>) {
		const params = new URLSearchParams(page.url.searchParams);

		for (const [key, value] of Object.entries(patch)) {
			const v = value === null ? '' : String(value);
			if (!v || v === 'all' || v === '0') params.delete(key);
			else params.set(key, v);
		}
		if (!('page' in patch) && !('album' in patch)) params.delete('page');

		const qs = params.toString();
		goto(qs ? `?${qs}` : page.url.pathname, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	function onSearchInput() {
		clearTimeout(timer);
		timer = setTimeout(() => setParams({ q: searchTerm }), 350);
	}

	function clearAll() {
		searchTerm = '';
		goto(page.url.pathname, { noScroll: true });
	}

	const locale = $derived(getLocale() === 'am' ? 'am-ET' : 'en-US');

	const formatDate = (value: string | Date | null) =>
		value
			? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(
					new Date(value)
				)
			: '';

	const areaLabel = $derived(
		data.options.areas.find((a) => a.id === data.filters.area)?.name ?? m.gallery_all_areas()
	);

	function sortLabel(value: string) {
		const labels: Record<string, string> = {
			newest: m.gallery_sort_newest(),
			oldest: m.gallery_sort_oldest(),
			title: m.gallery_sort_title()
		};
		return labels[value] ?? value;
	}

	/* ------------------------------------------------------------- viewer */
	let index = $state(0);

	const album = $derived(data.album);
	const items = $derived(album?.items ?? []);
	const current = $derived(items[index] ?? null);

	/* A new album always opens on its first frame. */
	$effect(() => {
		album?.id;
		index = 0;
	});

	/* Nothing behind the viewer should scroll while it is open. */
	$effect(() => {
		if (!album) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	function openAlbum(id: number) {
		setParams({ album: id });
	}

	function closeAlbum() {
		setParams({ album: null });
	}

	function step(delta: number) {
		if (!items.length) return;
		index = (index + delta + items.length) % items.length;
	}

	function onKeydown(event: KeyboardEvent) {
		if (!album) return;
		if (event.key === 'Escape') closeAlbum();
		else if (event.key === 'ArrowRight') step(1);
		else if (event.key === 'ArrowLeft') step(-1);
	}

	/** YouTube and Vimeo links become embeds; anything else plays as a file. */
	function embedUrl(url: string) {
		const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
		if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
		const vimeo = url.match(/vimeo\.com\/(\d+)/);
		if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
		return null;
	}

	const isRemote = (url: string) => url.startsWith('http://') || url.startsWith('https://');
	const src = (url: string) => (isRemote(url) ? url : `/files/${url}`);

	const pageNumbers = $derived.by(() => {
		const { page: current, pages } = data.pagination;
		const start = Math.max(1, Math.min(current - 2, pages - 4));
		const end = Math.min(pages, start + 4);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	});
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>{album ? `${album.title} — ${m.gallery_meta_title()}` : m.gallery_meta_title()}</title>
	<meta name="description" content={album?.description ?? m.gallery_meta_description()} />
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
		<!-- ------------------------------------------------------------ hero -->
		<div
			transition:fly={{ y: 30, duration: 800 }}
			class="mb-12 flex flex-col items-center gap-3 text-center"
		>
			<span
				class="rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-[11px] font-bold tracking-widest text-primary uppercase backdrop-blur-sm"
			>
				{m.gallery_badge()}
			</span>
			<h1
				class="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl"
			>
				{m.gallery_heading()}
			</h1>
			<p class="max-w-xl text-base text-muted-foreground">{m.gallery_description()}</p>
		</div>

		<!-- --------------------------------------------------------- filters -->
		<div transition:fly={{ y: 20, duration: 600, delay: 100 }} class="mb-10">
			<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
				<CardContent class="flex flex-col gap-4 pt-6">
					<div class="relative">
						<SearchIcon
							class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type="search"
							bind:value={searchTerm}
							oninput={onSearchInput}
							placeholder={m.gallery_search_placeholder()}
							class="h-11 border-primary/10 bg-primary/5 pl-10 focus-visible:ring-primary/30"
						/>
					</div>

					{#if data.options.years.length}
						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								onclick={() => setParams({ year: null })}
								class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {!data
									.filters.year
									? 'border-primary bg-primary text-primary-foreground shadow-sm'
									: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
							>
								{m.gallery_all_years()}
							</button>
							{#each data.options.years as year (year)}
								<button
									type="button"
									onclick={() => setParams({ year })}
									class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tabular-nums transition-all duration-300 {data
										.filters.year === year
										? 'border-primary bg-primary text-primary-foreground shadow-sm'
										: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
								>
									{year}
								</button>
							{/each}
						</div>
					{/if}

					<div class="grid gap-3 sm:grid-cols-2">
						<Select.Root
							type="single"
							value={String(data.filters.area || 'all')}
							onValueChange={(v) => setParams({ area: v })}
						>
							<Select.Trigger class="border-primary/10 bg-primary/5">{areaLabel}</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label={m.gallery_all_areas()}>
									{m.gallery_all_areas()}
								</Select.Item>
								{#each data.options.areas as area (area.id)}
									<Select.Item value={String(area.id)} label={area.name}>{area.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						<Select.Root
							type="single"
							value={data.filters.sort}
							onValueChange={(v) => setParams({ sort: v })}
						>
							<Select.Trigger class="border-primary/10 bg-primary/5">
								{sortLabel(data.filters.sort)}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="newest" label={m.gallery_sort_newest()}>
									{m.gallery_sort_newest()}
								</Select.Item>
								<Select.Item value="oldest" label={m.gallery_sort_oldest()}>
									{m.gallery_sort_oldest()}
								</Select.Item>
								<Select.Item value="title" label={m.gallery_sort_title()}>
									{m.gallery_sort_title()}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div
						class="flex flex-wrap items-center justify-between gap-3 border-t border-primary/5 pt-4"
					>
						<p class="text-sm text-muted-foreground">
							{m.gallery_results_count({ count: data.pagination.total })}
						</p>
						{#if data.filters.hasFilters}
							<Button variant="ghost" size="sm" class="gap-1.5 text-xs" onclick={clearAll}>
								<XIcon class="h-3.5 w-3.5" />
								{m.gallery_clear_filters()}
							</Button>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- ------------------------------------------------------------ grid -->
		{#if data.albums.length}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.albums as item, i (item.id)}
					{@const cover = item.coverImage ?? item.preview[0]?.thumbnailUrl ?? item.preview[0]?.url}
					<div transition:fly={{ y: 20, duration: 500, delay: 60 + i * 30 }}>
						<button
							type="button"
							onclick={() => openAlbum(item.id)}
							class="group block h-full w-full text-left"
						>
							<Card
								class="flex h-full flex-col overflow-hidden border-primary/10 bg-card/40 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
							>
								<div class="relative aspect-[4/3] overflow-hidden">
									{#if cover}
										<img
											src={src(cover)}
											alt={item.title}
											loading="lazy"
											class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-primary/10">
											<CameraIcon class="h-10 w-10 text-primary/40" />
										</div>
									{/if}

									<div
										class="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
									></div>

									<span
										class="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur-sm"
									>
										<ImageIcon class="h-3 w-3" />
										{item.itemCount}
									</span>

									{#if item.videoCount > 0}
										<span
											class="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur-sm"
										>
											<PlayIcon class="h-3 w-3" />
											{item.videoCount}
										</span>
									{/if}

									<!-- preview strip -->
									{#if item.preview.length > 1}
										<div
											class="absolute right-3 bottom-3 left-3 flex gap-1.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
										>
											{#each item.preview.slice(1, 4) as thumb (thumb.id)}
												<img
													src={src(thumb.thumbnailUrl ?? thumb.url)}
													alt=""
													loading="lazy"
													class="h-10 w-10 rounded-md border border-background/60 object-cover shadow-sm"
												/>
											{/each}
										</div>
									{/if}
								</div>

								<CardContent class="flex flex-1 flex-col gap-2 p-5">
									<h2
										class="line-clamp-2 leading-snug font-bold tracking-tight transition-colors duration-300 group-hover:text-primary"
									>
										{item.title}
									</h2>
									{#if item.description}
										<p class="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
									{/if}

									<div
										class="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[11px] text-muted-foreground"
									>
										{#if item.capturedOn}
											<span class="flex items-center gap-1.5">
												<CalendarIcon class="h-3 w-3 text-primary" />
												{formatDate(item.capturedOn)}
											</span>
										{/if}
										{#if item.ministryAreaName}
											<span class="font-semibold text-primary">{item.ministryAreaName}</span>
										{/if}
									</div>
								</CardContent>
							</Card>
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<div transition:fly={{ y: 20, duration: 500 }}>
				<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
					<CardContent class="flex flex-col items-center gap-3 px-6 py-20 text-center">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5"
						>
							<CameraIcon class="h-6 w-6 text-primary" />
						</div>
						<h2 class="text-lg font-bold tracking-tight">{m.gallery_empty_title()}</h2>
						<p class="max-w-sm text-sm text-muted-foreground">{m.gallery_empty_description()}</p>
						<Button variant="outline" class="mt-2 gap-1.5" onclick={clearAll}>
							<XIcon class="h-4 w-4" />
							{m.gallery_clear_filters()}
						</Button>
					</CardContent>
				</Card>
			</div>
		{/if}

		<!-- ------------------------------------------------------ pagination -->
		{#if data.pagination.pages > 1}
			<nav class="mt-12 flex flex-col items-center gap-3" aria-label={m.gallery_pagination_label()}>
				<div class="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						class="gap-1 border-primary/10 bg-primary/5"
						disabled={data.pagination.page === 1}
						onclick={() => setParams({ page: data.pagination.page - 1 })}
					>
						<ChevronLeftIcon class="h-4 w-4" />
						<span class="hidden sm:inline">{m.gallery_previous()}</span>
					</Button>

					{#each pageNumbers as n (n)}
						<Button
							variant={n === data.pagination.page ? 'default' : 'outline'}
							size="sm"
							class={n === data.pagination.page
								? 'w-9'
								: 'w-9 border-primary/10 bg-primary/5 text-muted-foreground'}
							onclick={() => setParams({ page: n })}
						>
							{n}
						</Button>
					{/each}

					<Button
						variant="outline"
						size="sm"
						class="gap-1 border-primary/10 bg-primary/5"
						disabled={data.pagination.page === data.pagination.pages}
						onclick={() => setParams({ page: data.pagination.page + 1 })}
					>
						<span class="hidden sm:inline">{m.gallery_next()}</span>
						<ChevronRightIcon class="h-4 w-4" />
					</Button>
				</div>

				<p class="text-xs text-muted-foreground">
					{m.gallery_page_of({ current: data.pagination.page, total: data.pagination.pages })}
				</p>
			</nav>
		{/if}
	</main>
</div>

<!-- ------------------------------------------------------------- viewer -->
{#if album}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 flex flex-col bg-background/97 backdrop-blur-xl"
		role="dialog"
		aria-modal="true"
		aria-label={album.title}
	>
		<!-- header -->
		<header class="flex items-start justify-between gap-4 border-b border-primary/10 px-4 py-4 sm:px-6">
			<div class="min-w-0">
				<h2 class="truncate text-lg font-bold tracking-tight">{album.title}</h2>
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
					{#if album.capturedOn}
						<span>{formatDate(album.capturedOn)}</span>
					{/if}
					{#if items.length}
						<span>{m.gallery_item_of({ current: index + 1, total: items.length })}</span>
					{/if}
					{#if album.eventSlug}
						<a
							href="/events/{album.eventSlug}"
							class="flex items-center gap-1 font-semibold text-primary hover:underline"
						>
							{album.eventName}
							<ExternalLinkIcon class="h-3 w-3" />
						</a>
					{/if}
					{#if album.projectSlug}
						<a
							href="/projects/{album.projectSlug}"
							class="flex items-center gap-1 font-semibold text-primary hover:underline"
						>
							{album.projectName}
							<ExternalLinkIcon class="h-3 w-3" />
						</a>
					{/if}
				</div>
			</div>

			<button
				type="button"
				onclick={closeAlbum}
				aria-label={m.gallery_close()}
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary transition-colors hover:bg-primary/10"
			>
				<XIcon class="h-5 w-5" />
			</button>
		</header>

		<!-- stage -->
		<div class="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
			{#if current}
				{#key current.id}
					<div transition:fade={{ duration: 150 }} class="flex h-full w-full items-center justify-center">
						{#if current.mediaType === 'video'}
							{@const embed = embedUrl(current.url)}
							{#if embed}
								<iframe
									src={embed}
									title={current.caption ?? album.title}
									class="aspect-video h-auto max-h-full w-full max-w-5xl rounded-2xl border border-primary/10"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
									allowfullscreen
								></iframe>
							{:else}
								<!-- svelte-ignore a11y_media_has_caption -->
								<video
									src={src(current.url)}
									controls
									class="max-h-full max-w-full rounded-2xl border border-primary/10"
								></video>
							{/if}
						{:else}
							<img
								src={src(current.url)}
								alt={current.caption ?? album.title}
								class="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
							/>
						{/if}
					</div>
				{/key}
			{:else}
				<p class="text-sm text-muted-foreground">{m.gallery_album_empty()}</p>
			{/if}

			{#if items.length > 1}
				<button
					type="button"
					onclick={() => step(-1)}
					aria-label={m.gallery_previous_item()}
					class="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-primary shadow-lg backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground sm:left-6"
				>
					<ChevronLeftIcon class="h-5 w-5" />
				</button>
				<button
					type="button"
					onclick={() => step(1)}
					aria-label={m.gallery_next_item()}
					class="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-primary shadow-lg backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground sm:right-6"
				>
					<ChevronRightIcon class="h-5 w-5" />
				</button>
			{/if}
		</div>

		<!-- caption + thumbnails -->
		<footer class="border-t border-primary/10 px-4 py-4 sm:px-6">
			{#if current?.caption}
				<p class="mb-3 text-center text-sm text-muted-foreground">{current.caption}</p>
			{/if}

			{#if items.length > 1}
				<div class="flex gap-2 overflow-x-auto pb-1">
					{#each items as item, i (item.id)}
						<button
							type="button"
							onclick={() => (index = i)}
							aria-label="{i + 1}"
							class="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300 {i ===
							index
								? 'border-primary opacity-100'
								: 'border-transparent opacity-50 hover:opacity-100'}"
						>
							<img
								src={src(item.thumbnailUrl ?? item.url)}
								alt=""
								loading="lazy"
								class="h-full w-full object-cover"
							/>
							{#if item.mediaType === 'video'}
								<span class="absolute inset-0 flex items-center justify-center bg-background/40">
									<PlayIcon class="h-4 w-4 text-primary" />
								</span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</footer>
	</div>
{/if}