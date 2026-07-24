<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';

	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';

	import {
		SearchIcon,
		FileTextIcon,
		MicIcon,
		GraduationCapIcon,
		VideoIcon,
		HeadphonesIcon,
		BookOpenIcon,
		EyeIcon,
		ClockIcon,
		ArrowRightIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		XIcon,
		PlayIcon,
		DownloadIcon
	} from '@lucide/svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props();

	let searchTerm = $state(data.filters.q);
	let timer: ReturnType<typeof setTimeout>;

	/* ------------------------------------------------------------- helpers */
	function setParams(patch: Record<string, string | number | null>) {
		const params = new URLSearchParams(page.url.searchParams);

		for (const [key, value] of Object.entries(patch)) {
			const v = value === null ? '' : String(value);
			if (!v || v === 'all' || v === '0') params.delete(key);
			else params.set(key, v);
		}
		if (!('page' in patch)) params.delete('page');

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

	const typeIcons: Record<string, typeof FileTextIcon> = {
		article: FileTextIcon,
		sermon: MicIcon,
		teaching: GraduationCapIcon,
		video: VideoIcon,
		audio: HeadphonesIcon,
		bible_study: BookOpenIcon
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

	function sortLabel(sort: string) {
		const labels: Record<string, string> = {
			newest: m.blog_sort_newest(),
			oldest: m.blog_sort_oldest(),
			popular: m.blog_sort_popular(),
			title: m.blog_sort_title()
		};
		return labels[sort] ?? sort;
	}

	function formatDate(value: string | Date | null) {
		if (!value) return '';
		return new Intl.DateTimeFormat(getLocale() === 'am' ? 'am-ET' : 'en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(new Date(value));
	}

	/* ------------------------------------------------------------ reactive */
	const categoryLabel = $derived(
		data.options.categories.find((c) => c.id === data.filters.category)?.name ??
			m.blog_all_categories()
	);
	const areaLabel = $derived(
		data.options.areas.find((a) => a.id === data.filters.area)?.name ?? m.blog_all_areas()
	);
	const tagLabel = $derived(
		data.options.tags.find((t) => t.id === data.filters.tag)?.name ?? m.blog_all_tags()
	);

	const pageNumbers = $derived.by(() => {
		const { page: current, pages } = data.pagination;
		const start = Math.max(1, Math.min(current - 2, pages - 4));
		const end = Math.min(pages, start + 4);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	});
</script>

<svelte:head>
	<title>{m.blog_meta_title()}</title>
	<meta name="description" content={m.blog_meta_description()} />
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
				{m.blog_badge()}
			</span>
			<h1
				class="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl"
			>
				{m.blog_heading()}
			</h1>
			<p class="max-w-xl text-base text-muted-foreground">
				{m.blog_description()}
			</p>
		</div>

		<!-- --------------------------------------------------------- filters -->
		<div transition:fly={{ y: 20, duration: 600, delay: 100 }} class="mb-10">
			<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
				<CardContent class="flex flex-col gap-5 pt-6">
					<!-- search -->
					<div class="relative">
						<SearchIcon
							class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type="search"
							bind:value={searchTerm}
							oninput={onSearchInput}
							placeholder={m.blog_search_placeholder()}
							class="h-11 border-primary/10 bg-primary/5 pl-10 focus-visible:ring-primary/30"
						/>
					</div>

					<!-- resource type pills -->
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => setParams({ type: 'all' })}
							class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
								.filters.type === 'all'
								? 'border-primary bg-primary text-primary-foreground shadow-sm'
								: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
						>
							{m.blog_all_types()}
						</button>

						{#each data.options.types as option (option.value)}
							{@const Icon = typeIcons[option.value]}
							<button
								type="button"
								onclick={() => setParams({ type: option.value })}
								class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
									.filters.type === option.value
									? 'border-primary bg-primary text-primary-foreground shadow-sm'
									: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
							>
								<Icon class="h-3.5 w-3.5" />
								{typeLabel(option.value)}
								<span class="opacity-60">{option.total}</span>
							</button>
						{/each}
					</div>

					<!-- selects -->
					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<Select.Root
							type="single"
							value={String(data.filters.category || 'all')}
							onValueChange={(v) => setParams({ category: v })}
						>
							<Select.Trigger class="border-primary/10 bg-primary/5">
								{categoryLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label={m.blog_all_categories()}>
									{m.blog_all_categories()}
								</Select.Item>
								{#each data.options.categories as category (category.id)}
									<Select.Item value={String(category.id)} label={category.name}>
										{category.name}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						<Select.Root
							type="single"
							value={String(data.filters.area || 'all')}
							onValueChange={(v) => setParams({ area: v })}
						>
							<Select.Trigger class="border-primary/10 bg-primary/5">
								{areaLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label={m.blog_all_areas()}>
									{m.blog_all_areas()}
								</Select.Item>
								{#each data.options.areas as area (area.id)}
									<Select.Item value={String(area.id)} label={area.name}>
										{area.name}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						<Select.Root
							type="single"
							value={String(data.filters.tag || 'all')}
							onValueChange={(v) => setParams({ tag: v })}
						>
							<Select.Trigger class="border-primary/10 bg-primary/5">
								{tagLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label={m.blog_all_tags()}>
									{m.blog_all_tags()}
								</Select.Item>
								{#each data.options.tags as tag (tag.id)}
									<Select.Item value={String(tag.id)} label={tag.name}>
										{tag.name}
									</Select.Item>
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
								<Select.Item value="newest" label={m.blog_sort_newest()}>
									{m.blog_sort_newest()}
								</Select.Item>
								<Select.Item value="oldest" label={m.blog_sort_oldest()}>
									{m.blog_sort_oldest()}
								</Select.Item>
								<Select.Item value="popular" label={m.blog_sort_popular()}>
									{m.blog_sort_popular()}
								</Select.Item>
								<Select.Item value="title" label={m.blog_sort_title()}>
									{m.blog_sort_title()}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<!-- result line + reset -->
					<div class="flex flex-wrap items-center justify-between gap-3 border-t border-primary/5 pt-4">
						<p class="text-sm text-muted-foreground">
							{m.blog_results_count({ count: data.pagination.total })}
						</p>
						{#if data.filters.hasFilters}
							<Button variant="ghost" size="sm" class="gap-1.5 text-xs" onclick={clearAll}>
								<XIcon class="h-3.5 w-3.5" />
								{m.blog_clear_filters()}
							</Button>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- -------------------------------------------------------- featured -->
		{#if data.featured}
			{@const item = data.featured}
			<div transition:fly={{ y: 20, duration: 600, delay: 150 }} class="mb-12">
				<a href="/blog/{item.slug}" class="group block">
					<Card
						class="overflow-hidden border-primary/10 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md transition-all duration-500 hover:border-primary/25"
					>
						<div class="grid md:grid-cols-2">
							<div class="relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-full">
								{#if item.featuredImage}
									<img
										src="/files/{item.featuredImage}"
										alt={item.title}
										class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
										loading="lazy"
									/>
								{:else}
									<div class="h-full w-full bg-primary/10"></div>
								{/if}
								<span
									class="absolute top-4 left-4 rounded-full bg-background/80 px-3 py-1 text-[11px] font-bold tracking-widest text-primary uppercase backdrop-blur-sm"
								>
									{m.blog_featured()}
								</span>
							</div>

							<div class="flex flex-col justify-center gap-4 p-6 sm:p-8">
								<div class="flex flex-wrap items-center gap-2 text-xs">
									<Badge variant="secondary" class="font-semibold">
										{typeLabel(item.resourceType ?? 'article')}
									</Badge>
									{#if item.categoryName}
										<span class="text-muted-foreground">{item.categoryName}</span>
									{/if}
								</div>

								<h2
									class="text-2xl font-extrabold tracking-tight transition-colors duration-300 group-hover:text-primary sm:text-3xl"
								>
									{item.title}
								</h2>

								{#if item.excerpt}
									<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
										{item.excerpt}
									</p>
								{/if}

								<div class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
									{#if item.speakerName || item.authorName}
										<span class="font-semibold text-foreground">
											{m.blog_by()}
											{item.speakerName ?? item.authorName}
										</span>
									{/if}
									{#if item.publishedAt}
										<span>{formatDate(item.publishedAt)}</span>
									{/if}
									<span class="flex items-center gap-1">
										<ClockIcon class="h-3.5 w-3.5" />
										{m.blog_min_read({ minutes: item.readMinutes })}
									</span>
								</div>

								<span
									class="flex items-center gap-1.5 text-sm font-bold text-primary transition-transform duration-300 group-hover:translate-x-1"
								>
									{m.blog_read_more()}
									<ArrowRightIcon class="h-4 w-4" />
								</span>
							</div>
						</div>
					</Card>
				</a>
			</div>
		{/if}

		<!-- ------------------------------------------------------------ grid -->
		{#if data.resources.length}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.resources as item, i (item.id)}
					{@const Icon = typeIcons[item.resourceType ?? 'article']}
					<div transition:fly={{ y: 20, duration: 500, delay: 80 + i * 40 }}>
						<a href="/blogs/{item.slug}" class="group block h-full">
							<Card
								class="flex h-full flex-col overflow-hidden border-primary/10 bg-card/40 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
							>
								<div class="relative aspect-[16/10] overflow-hidden">
									{#if item.featuredImage}
										<img
											src="/files/{item.featuredImage}"
											alt={item.title}
											class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
											loading="lazy"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-primary/10">
											<Icon class="h-10 w-10 text-primary/40" />
										</div>
									{/if}

									<span
										class="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary backdrop-blur-sm"
									>
										<Icon class="h-3 w-3" />
										{typeLabel(item.resourceType ?? 'article')}
									</span>

									{#if item.videoLink || item.audioUrl}
										<span
											class="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110"
										>
											<PlayIcon class="h-4 w-4" />
										</span>
									{/if}
								</div>

								<CardContent class="flex flex-1 flex-col gap-3 p-5">
									<div class="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
										{#if item.categoryName}
											<span class="font-semibold text-primary">{item.categoryName}</span>
										{/if}
										{#if item.ministryAreaName}
											<span>· {item.ministryAreaName}</span>
										{/if}
									</div>

									<h3
										class="line-clamp-2 text-lg leading-snug font-bold tracking-tight transition-colors duration-300 group-hover:text-primary"
									>
										{item.title}
									</h3>

									{#if item.excerpt}
										<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
											{item.excerpt}
										</p>
									{/if}

									{#if item.bibleReferences}
										<p class="font-mono text-xs text-primary/80">{item.bibleReferences}</p>
									{/if}

									{#if item.tags.length}
										<div class="flex flex-wrap gap-1.5">
											{#each item.tags.slice(0, 3) as tag (tag.id)}
												<span
													class="rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
												>
													#{tag.name}
												</span>
											{/each}
										</div>
									{/if}

									<div
										class="mt-auto flex items-center justify-between border-t border-primary/5 pt-3 text-[11px] text-muted-foreground"
									>
										<span class="truncate font-medium">
											{#if item.speakerName || item.authorName}
												{item.speakerName ?? item.authorName} ·
											{/if}
											{formatDate(item.publishedAt)}
										</span>
										<span class="flex shrink-0 items-center gap-3">
											{#if item.downloadUrl}
												<DownloadIcon class="h-3.5 w-3.5" />
											{/if}
											<span class="flex items-center gap-1">
												<EyeIcon class="h-3.5 w-3.5" />
												{item.viewCount ?? 0}
											</span>
										</span>
									</div>
								</CardContent>
							</Card>
						</a>
					</div>
				{/each}
			</div>
		{:else}
			<!-- ------------------------------------------------------- empty -->
			<div transition:fly={{ y: 20, duration: 500 }}>
				<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
					<CardContent class="flex flex-col items-center gap-3 px-6 py-20 text-center">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5"
						>
							<SearchIcon class="h-6 w-6 text-primary" />
						</div>
						<h2 class="text-lg font-bold tracking-tight">{m.blog_empty_title()}</h2>
						<p class="max-w-sm text-sm text-muted-foreground">{m.blog_empty_description()}</p>
						<Button variant="outline" class="mt-2 gap-1.5" onclick={clearAll}>
							<XIcon class="h-4 w-4" />
							{m.blog_clear_filters()}
						</Button>
					</CardContent>
				</Card>
			</div>
		{/if}

		<!-- ------------------------------------------------------ pagination -->
		{#if data.pagination.pages > 1}
			<nav class="mt-12 flex flex-col items-center gap-3" aria-label={m.blog_pagination_label()}>
				<div class="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						class="gap-1 border-primary/10 bg-primary/5"
						disabled={data.pagination.page === 1}
						onclick={() => setParams({ page: data.pagination.page - 1 })}
					>
						<ChevronLeftIcon class="h-4 w-4" />
						<span class="hidden sm:inline">{m.blog_previous()}</span>
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
						<span class="hidden sm:inline">{m.blog_next()}</span>
						<ChevronRightIcon class="h-4 w-4" />
					</Button>
				</div>

				<p class="text-xs text-muted-foreground">
					{m.blog_page_of({ current: data.pagination.page, total: data.pagination.pages })}
				</p>
			</nav>
		{/if}
	</main>
</div>