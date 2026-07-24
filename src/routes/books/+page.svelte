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
		BookOpenIcon,
		StarIcon,
		DownloadIcon,
		HeadphonesIcon,
		FileTextIcon,
		TabletIcon,
		ArrowRightIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		XIcon
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

	const locale = $derived(getLocale() === 'am' ? 'am-ET' : 'en-US');

	const formatIcons: Record<string, typeof BookOpenIcon> = {
		physical: BookOpenIcon,
		pdf: FileTextIcon,
		ebook: TabletIcon,
		audiobook: HeadphonesIcon
	};

	function languageLabel(value: string) {
		const labels: Record<string, string> = {
			english: m.books_language_english(),
			amharic: m.books_language_amharic(),
			other: m.books_language_other()
		};
		return labels[value] ?? value;
	}

	function formatLabel(value: string) {
		const labels: Record<string, string> = {
			physical: m.books_format_physical(),
			pdf: m.books_format_pdf(),
			ebook: m.books_format_ebook(),
			audiobook: m.books_format_audiobook()
		};
		return labels[value] ?? value;
	}

	function sortLabel(value: string) {
		const labels: Record<string, string> = {
			newest: m.books_sort_newest(),
			title: m.books_sort_title(),
			rating: m.books_sort_rating(),
			price_low: m.books_sort_price_low(),
			price_high: m.books_sort_price_high()
		};
		return labels[value] ?? value;
	}

	const areaLabel = $derived(
		data.options.areas.find((a) => a.id === data.filters.area)?.name ?? m.books_all_areas()
	);

	type BookRow = (typeof data.books)[number];

	function priceLabel(book: BookRow) {
		if (book.hasFreeDownload) return m.books_free_download();
		if (!book.price || Number(book.price) === 0) return m.books_price_on_request();
		return `${book.currency ?? 'ETB'} ${Number(book.price).toLocaleString(locale)}`;
	}

	const yearOf = (value: string | Date | null) =>
		value ? new Date(value).getFullYear().toString() : '';

	const pageNumbers = $derived.by(() => {
		const { page: current, pages } = data.pagination;
		const start = Math.max(1, Math.min(current - 2, pages - 4));
		const end = Math.min(pages, start + 4);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	});
</script>

{#snippet stars(average: number, size = 'h-3.5 w-3.5')}
	<span class="flex items-center gap-0.5" aria-label="{average} / 5">
		{#each [1, 2, 3, 4, 5] as step (step)}
			<StarIcon
				class="{size} {average >= step - 0.5
					? 'fill-primary text-primary'
					: 'text-muted-foreground/30'}"
			/>
		{/each}
	</span>
{/snippet}

<svelte:head>
	<title>{m.books_meta_title()}</title>
	<meta name="description" content={m.books_meta_description()} />
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
				{m.books_badge()}
			</span>
			<h1
				class="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl"
			>
				{m.books_heading()}
			</h1>
			<p class="max-w-xl text-base text-muted-foreground">{m.books_description()}</p>
		</div>

		<!-- -------------------------------------------------------- featured -->
		{#if data.featured}
			{@const book = data.featured}
			<div transition:fly={{ y: 20, duration: 700, delay: 100 }} class="mb-12">
				<Card
					class="overflow-hidden border-primary/15 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md"
				>
					<div class="grid items-center gap-8 p-6 sm:p-10 md:grid-cols-5">
						<a href="/books/{book.slug}" class="group md:col-span-2">
							<div class="mx-auto max-w-[240px]">
								{#if book.coverImage}
									<img
										src="/files/{book.coverImage}"
										alt={book.title}
										class="w-full rounded-xl border border-primary/10 shadow-2xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-1"
									/>
								{:else}
									<div
										class="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-primary/10 shadow-2xl"
									>
										<BookOpenIcon class="h-12 w-12 text-primary/40" />
									</div>
								{/if}
							</div>
						</a>

						<div class="flex flex-col gap-4 md:col-span-3">
							<div class="flex flex-wrap items-center gap-2">
								<Badge class="font-semibold">{m.books_featured()}</Badge>
								<span class="text-xs font-semibold text-muted-foreground">
									{languageLabel(book.language ?? 'english')}
								</span>
								{#if book.ministryAreaName}
									<span class="text-xs text-muted-foreground">· {book.ministryAreaName}</span>
								{/if}
							</div>

							<div>
								<h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{book.title}</h2>
								{#if book.subtitle}
									<p class="mt-1 text-base text-muted-foreground">{book.subtitle}</p>
								{/if}
							</div>

							{#if book.authorName}
								<p class="text-sm font-semibold">
									{m.books_by()}
									{book.authorName}
								</p>
							{/if}

							{#if book.reviewCount > 0}
								<div class="flex items-center gap-2">
									{@render stars(Number(book.ratingAverage), 'h-4 w-4')}
									<span class="text-xs text-muted-foreground">
										{m.books_review_count({ count: book.reviewCount })}
									</span>
								</div>
							{/if}

							{#if book.description}
								<p class="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
									{book.description}
								</p>
							{/if}

							{#if book.formats.length}
								<div class="flex flex-wrap gap-2">
									{#each book.formats as f (f.id)}
										{@const Icon = formatIcons[f.format]}
										<span
											class="flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold text-muted-foreground"
										>
											<Icon class="h-3.5 w-3.5 text-primary" />
											{formatLabel(f.format)}
										</span>
									{/each}
								</div>
							{/if}

							<div class="flex flex-wrap items-center gap-3 pt-1">
								<Button href="/books/{book.slug}" class="group gap-2">
									{m.books_view_book()}
									<ArrowRightIcon
										class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
									/>
								</Button>
								<span class="text-lg font-extrabold {book.hasFreeDownload ? 'text-primary' : ''}">
									{priceLabel(book)}
								</span>
							</div>
						</div>
					</div>
				</Card>
			</div>
		{/if}

		<!-- --------------------------------------------------------- filters -->
		<div transition:fly={{ y: 20, duration: 600, delay: 150 }} class="mb-10">
			<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
				<CardContent class="flex flex-col gap-5 pt-6">
					<div class="flex flex-col gap-3 sm:flex-row">
						<div class="relative flex-1">
							<SearchIcon
								class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								type="search"
								bind:value={searchTerm}
								oninput={onSearchInput}
								placeholder={m.books_search_placeholder()}
								class="h-11 border-primary/10 bg-primary/5 pl-10 focus-visible:ring-primary/30"
							/>
						</div>

						<div class="flex rounded-lg border border-primary/10 bg-primary/5 p-1">
							{#each [{ value: 'all', label: m.books_access_all() }, { value: 'free', label: m.books_access_free() }, { value: 'paid', label: m.books_access_paid() }] as option (option.value)}
								<button
									type="button"
									onclick={() => setParams({ access: option.value })}
									class="flex-1 rounded-md px-4 py-1.5 text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-300 {data
										.filters.access === option.value
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground'}"
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>

					<!-- language -->
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => setParams({ language: 'all' })}
							class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
								.filters.language === 'all'
								? 'border-primary bg-primary text-primary-foreground shadow-sm'
								: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
						>
							{m.books_all_languages()}
						</button>
						{#each data.options.languages as option (option.value)}
							<button
								type="button"
								onclick={() => setParams({ language: option.value })}
								class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
									.filters.language === option.value
									? 'border-primary bg-primary text-primary-foreground shadow-sm'
									: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
							>
								{languageLabel(option.value)}
								<span class="opacity-60">{option.total}</span>
							</button>
						{/each}
					</div>

					<!-- format -->
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => setParams({ format: 'all' })}
							class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
								.filters.format === 'all'
								? 'border-primary bg-primary text-primary-foreground shadow-sm'
								: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
						>
							{m.books_all_formats()}
						</button>
						{#each data.options.formats as option (option.value)}
							{@const Icon = formatIcons[option.value]}
							<button
								type="button"
								onclick={() => setParams({ format: option.value })}
								class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
									.filters.format === option.value
									? 'border-primary bg-primary text-primary-foreground shadow-sm'
									: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
							>
								<Icon class="h-3.5 w-3.5" />
								{formatLabel(option.value)}
								<span class="opacity-60">{option.total}</span>
							</button>
						{/each}
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						<Select.Root
							type="single"
							value={String(data.filters.area || 'all')}
							onValueChange={(v) => setParams({ area: v })}
						>
							<Select.Trigger class="border-primary/10 bg-primary/5">{areaLabel}</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label={m.books_all_areas()}>
									{m.books_all_areas()}
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
								<Select.Item value="newest" label={m.books_sort_newest()}>
									{m.books_sort_newest()}
								</Select.Item>
								<Select.Item value="title" label={m.books_sort_title()}>
									{m.books_sort_title()}
								</Select.Item>
								<Select.Item value="rating" label={m.books_sort_rating()}>
									{m.books_sort_rating()}
								</Select.Item>
								<Select.Item value="price_low" label={m.books_sort_price_low()}>
									{m.books_sort_price_low()}
								</Select.Item>
								<Select.Item value="price_high" label={m.books_sort_price_high()}>
									{m.books_sort_price_high()}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div
						class="flex flex-wrap items-center justify-between gap-3 border-t border-primary/5 pt-4"
					>
						<p class="text-sm text-muted-foreground">
							{m.books_results_count({ count: data.pagination.total })}
						</p>
						{#if data.filters.hasFilters}
							<Button variant="ghost" size="sm" class="gap-1.5 text-xs" onclick={clearAll}>
								<XIcon class="h-3.5 w-3.5" />
								{m.books_clear_filters()}
							</Button>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- ------------------------------------------------------------ grid -->
		{#if data.books.length}
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
				{#each data.books as book, i (book.id)}
					<div transition:fly={{ y: 20, duration: 500, delay: 60 + i * 30 }}>
						<a href="/books/{book.slug}" class="group flex h-full flex-col gap-3">
							<div class="relative">
								{#if book.coverImage}
									<img
										src="/files/{book.coverImage}"
										alt={book.title}
										loading="lazy"
										class="aspect-[3/4] w-full rounded-xl border border-primary/10 object-cover shadow-lg transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-2xl"
									/>
								{:else}
									<div
										class="flex aspect-[3/4] w-full items-center justify-center rounded-xl border border-primary/10 bg-primary/10 shadow-lg transition-all duration-500 group-hover:-translate-y-1.5"
									>
										<BookOpenIcon class="h-10 w-10 text-primary/40" />
									</div>
								{/if}

								{#if book.hasFreeDownload}
									<span
										class="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary-foreground shadow-md"
									>
										<DownloadIcon class="h-3 w-3" />
										{m.books_free_label()}
									</span>
								{/if}

								{#if book.formats.length}
									<div class="absolute right-2.5 bottom-2.5 flex gap-1">
										{#each book.formats.slice(0, 3) as f (f.id)}
											{@const Icon = formatIcons[f.format]}
											<span
												class="flex h-6 w-6 items-center justify-center rounded-md bg-background/85 text-primary shadow-sm backdrop-blur-sm"
												title={formatLabel(f.format)}
											>
												<Icon class="h-3 w-3" />
											</span>
										{/each}
									</div>
								{/if}
							</div>

							<div class="flex flex-1 flex-col gap-1">
								<h3
									class="line-clamp-2 leading-snug font-bold tracking-tight transition-colors duration-300 group-hover:text-primary"
								>
									{book.title}
								</h3>
								{#if book.authorName}
									<p class="truncate text-xs text-muted-foreground">{book.authorName}</p>
								{/if}

								{#if book.reviewCount > 0}
									<div class="flex items-center gap-1.5">
										{@render stars(Number(book.ratingAverage))}
										<span class="text-[11px] text-muted-foreground">({book.reviewCount})</span>
									</div>
								{/if}

								<div
									class="mt-auto flex items-center justify-between pt-1.5 text-xs text-muted-foreground"
								>
									<span class="font-bold {book.hasFreeDownload ? 'text-primary' : 'text-foreground'}">
										{priceLabel(book)}
									</span>
									{#if book.publicationDate}
										<span>{yearOf(book.publicationDate)}</span>
									{/if}
								</div>
							</div>
						</a>
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
							<BookOpenIcon class="h-6 w-6 text-primary" />
						</div>
						<h2 class="text-lg font-bold tracking-tight">{m.books_empty_title()}</h2>
						<p class="max-w-sm text-sm text-muted-foreground">{m.books_empty_description()}</p>
						<Button variant="outline" class="mt-2 gap-1.5" onclick={clearAll}>
							<XIcon class="h-4 w-4" />
							{m.books_clear_filters()}
						</Button>
					</CardContent>
				</Card>
			</div>
		{/if}

		<!-- ------------------------------------------------------ pagination -->
		{#if data.pagination.pages > 1}
			<nav class="mt-12 flex flex-col items-center gap-3" aria-label={m.books_pagination_label()}>
				<div class="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						class="gap-1 border-primary/10 bg-primary/5"
						disabled={data.pagination.page === 1}
						onclick={() => setParams({ page: data.pagination.page - 1 })}
					>
						<ChevronLeftIcon class="h-4 w-4" />
						<span class="hidden sm:inline">{m.books_previous()}</span>
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
						<span class="hidden sm:inline">{m.books_next()}</span>
						<ChevronRightIcon class="h-4 w-4" />
					</Button>
				</div>

				<p class="text-xs text-muted-foreground">
					{m.books_page_of({ current: data.pagination.page, total: data.pagination.pages })}
				</p>
			</nav>
		{/if}
	</main>
</div>