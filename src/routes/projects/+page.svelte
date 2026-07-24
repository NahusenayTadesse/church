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
		MapPinIcon,
		UsersIcon,
		HandCoinsIcon,
		HeartIcon,
		TargetIcon,
		ArrowRightIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		XIcon,
		FolderIcon
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

	function statusLabel(value: string) {
		const labels: Record<string, string> = {
			planned: m.projects_status_planned(),
			active: m.projects_status_active(),
			paused: m.projects_status_paused(),
			completed: m.projects_status_completed()
		};
		return labels[value] ?? value;
	}

	function sortLabel(value: string) {
		const labels: Record<string, string> = {
			newest: m.projects_sort_newest(),
			name: m.projects_sort_name(),
			funding: m.projects_sort_funding(),
			reach: m.projects_sort_reach()
		};
		return labels[value] ?? value;
	}

	const statusStyles: Record<string, string> = {
		planned: 'bg-background/85 text-muted-foreground',
		active: 'bg-primary text-primary-foreground',
		paused: 'bg-background/85 text-muted-foreground',
		completed: 'bg-background/85 text-primary'
	};

	const areaLabel = $derived(
		data.options.areas.find((a) => a.id === data.filters.area)?.name ?? m.projects_all_areas()
	);

	type ProjectRow = (typeof data.projects)[number];

	const compact = (value: number) =>
		new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);

	function fundingPercent(project: ProjectRow) {
		const goal = Number(project.fundingGoal ?? 0);
		if (!goal) return null;
		return Math.min(100, Math.round((Number(project.fundingRaised ?? 0) / goal) * 100));
	}

	function reachPercent(project: ProjectRow) {
		const target = Number(project.targetBeneficiaries ?? 0);
		if (!target) return null;
		return Math.min(100, Math.round((Number(project.reachedBeneficiaries ?? 0) / target) * 100));
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

{#snippet supportIcons(project: ProjectRow)}
	<span class="flex items-center gap-1.5">
		{#if project.acceptsDonations}
			<span
				class="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"
				title={m.projects_support_donations()}
			>
				<HandCoinsIcon class="h-3.5 w-3.5" />
			</span>
		{/if}
		{#if project.acceptsVolunteers}
			<span
				class="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"
				title={m.projects_support_volunteers()}
			>
				<UsersIcon class="h-3.5 w-3.5" />
			</span>
		{/if}
		{#if project.acceptsPrayer}
			<span
				class="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"
				title={m.projects_support_prayer()}
			>
				<HeartIcon class="h-3.5 w-3.5" />
			</span>
		{/if}
	</span>
{/snippet}

<svelte:head>
	<title>{m.projects_meta_title()}</title>
	<meta name="description" content={m.projects_meta_description()} />
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
			class="mb-10 flex flex-col items-center gap-3 text-center"
		>
			<span
				class="rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-[11px] font-bold tracking-widest text-primary uppercase backdrop-blur-sm"
			>
				{m.projects_badge()}
			</span>
			<h1
				class="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl"
			>
				{m.projects_heading()}
			</h1>
			<p class="max-w-xl text-base text-muted-foreground">{m.projects_description()}</p>
		</div>

		<!-- ---------------------------------------------------- impact strip -->
		<div transition:fly={{ y: 20, duration: 600, delay: 100 }} class="mb-12">
			<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
				<CardContent class="grid grid-cols-3 divide-x divide-primary/10 py-6">
					<div class="flex flex-col items-center gap-1 px-2 text-center">
						<span class="text-2xl font-extrabold tabular-nums sm:text-3xl">
							{data.impact.projectCount}
						</span>
						<span class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
							{m.projects_stat_projects()}
						</span>
					</div>
					<div class="flex flex-col items-center gap-1 px-2 text-center">
						<span class="text-2xl font-extrabold text-primary tabular-nums sm:text-3xl">
							{compact(data.impact.reached)}
						</span>
						<span class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
							{m.projects_stat_reached()}
						</span>
					</div>
					<div class="flex flex-col items-center gap-1 px-2 text-center">
						<span class="text-2xl font-extrabold tabular-nums sm:text-3xl">
							{compact(data.impact.raised)}
						</span>
						<span class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
							{m.projects_stat_raised()}
						</span>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- -------------------------------------------------------- featured -->
		{#if data.featured}
			{@const project = data.featured}
			{@const percent = fundingPercent(project)}
			<div transition:fly={{ y: 20, duration: 700, delay: 150 }} class="mb-12">
				<a href="/projects/{project.slug}" class="group block">
					<Card
						class="overflow-hidden border-primary/15 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md transition-all duration-500 hover:border-primary/25"
					>
						<div class="grid md:grid-cols-2">
							<div class="relative aspect-[16/10] overflow-hidden md:aspect-auto">
								{#if project.featuredImage}
									<img
										src="/files/{project.featuredImage}"
										alt={project.name}
										class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center bg-primary/10">
										<FolderIcon class="h-12 w-12 text-primary/40" />
									</div>
								{/if}
								<span
									class="absolute top-4 left-4 rounded-full px-3 py-1 text-[11px] font-bold tracking-widest uppercase backdrop-blur-sm {statusStyles[
										project.status ?? 'planned'
									]}"
								>
									{statusLabel(project.status ?? 'planned')}
								</span>
							</div>

							<div class="flex flex-col justify-center gap-4 p-6 sm:p-8">
								{#if project.ministryAreaName}
									<span class="text-xs font-bold tracking-widest text-primary uppercase">
										{project.ministryAreaName}
									</span>
								{/if}

								<h2
									class="text-2xl font-extrabold tracking-tight transition-colors duration-300 group-hover:text-primary sm:text-3xl"
								>
									{project.name}
								</h2>

								{#if project.shortDescription}
									<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
										{project.shortDescription}
									</p>
								{/if}

								<div class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
									{#if project.location}
										<span class="flex items-center gap-1.5">
											<MapPinIcon class="h-3.5 w-3.5 text-primary" />
											{project.location}
										</span>
									{/if}
									{#if project.reachedBeneficiaries}
										<span class="flex items-center gap-1.5">
											<UsersIcon class="h-3.5 w-3.5 text-primary" />
											{m.projects_reached_count({
												count: Number(project.reachedBeneficiaries)
											})}
										</span>
									{/if}
								</div>

								{#if percent !== null}
									<div class="flex flex-col gap-1.5">
										<div class="flex items-baseline justify-between text-sm">
											<span class="font-bold">
												{project.currency ?? 'ETB'}
												{Number(project.fundingRaised ?? 0).toLocaleString(locale)}
											</span>
											<span class="text-xs text-muted-foreground">
												{m.projects_of_goal({
													goal: `${project.currency ?? 'ETB'} ${Number(
														project.fundingGoal ?? 0
													).toLocaleString(locale)}`
												})}
											</span>
										</div>
										<div class="h-2 w-full overflow-hidden rounded-full bg-primary/10">
											<div
												class="h-full rounded-full bg-primary transition-all duration-1000"
												style="width: {percent}%"
											></div>
										</div>
									</div>
								{/if}

								<div class="flex items-center justify-between pt-1">
									{@render supportIcons(project)}
									<span
										class="flex items-center gap-1.5 text-sm font-bold text-primary transition-transform duration-300 group-hover:translate-x-1"
									>
										{m.projects_view_project()}
										<ArrowRightIcon class="h-4 w-4" />
									</span>
								</div>
							</div>
						</div>
					</Card>
				</a>
			</div>
		{/if}

		<!-- --------------------------------------------------------- filters -->
		<div transition:fly={{ y: 20, duration: 600, delay: 200 }} class="mb-10">
			<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
				<CardContent class="flex flex-col gap-5 pt-6">
					<div class="relative">
						<SearchIcon
							class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type="search"
							bind:value={searchTerm}
							oninput={onSearchInput}
							placeholder={m.projects_search_placeholder()}
							class="h-11 border-primary/10 bg-primary/5 pl-10 focus-visible:ring-primary/30"
						/>
					</div>

					<!-- status -->
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => setParams({ status: 'all' })}
							class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
								.filters.status === 'all'
								? 'border-primary bg-primary text-primary-foreground shadow-sm'
								: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
						>
							{m.projects_all_statuses()}
						</button>
						{#each data.options.statuses as option (option.value)}
							<button
								type="button"
								onclick={() => setParams({ status: option.value })}
								class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
									.filters.status === option.value
									? 'border-primary bg-primary text-primary-foreground shadow-sm'
									: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
							>
								{statusLabel(option.value)}
								<span class="opacity-60">{option.total}</span>
							</button>
						{/each}
					</div>

					<!-- ways to support -->
					<div class="flex flex-wrap gap-2">
						<span class="self-center text-xs font-bold tracking-widest text-muted-foreground uppercase">
							{m.projects_support_label()}
						</span>
						{#each [{ value: 'all', label: m.projects_support_any(), icon: null }, { value: 'donations', label: m.projects_support_donations(), icon: HandCoinsIcon }, { value: 'volunteers', label: m.projects_support_volunteers(), icon: UsersIcon }, { value: 'prayer', label: m.projects_support_prayer(), icon: HeartIcon }] as option (option.value)}
							<button
								type="button"
								onclick={() => setParams({ support: option.value })}
								class="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
									.filters.support === option.value
									? 'border-primary bg-primary text-primary-foreground shadow-sm'
									: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
							>
								{#if option.icon}
									<option.icon class="h-3.5 w-3.5" />
								{/if}
								{option.label}
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
								<Select.Item value="all" label={m.projects_all_areas()}>
									{m.projects_all_areas()}
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
								<Select.Item value="newest" label={m.projects_sort_newest()}>
									{m.projects_sort_newest()}
								</Select.Item>
								<Select.Item value="name" label={m.projects_sort_name()}>
									{m.projects_sort_name()}
								</Select.Item>
								<Select.Item value="funding" label={m.projects_sort_funding()}>
									{m.projects_sort_funding()}
								</Select.Item>
								<Select.Item value="reach" label={m.projects_sort_reach()}>
									{m.projects_sort_reach()}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div
						class="flex flex-wrap items-center justify-between gap-3 border-t border-primary/5 pt-4"
					>
						<p class="text-sm text-muted-foreground">
							{m.projects_results_count({ count: data.pagination.total })}
						</p>
						{#if data.filters.hasFilters}
							<Button variant="ghost" size="sm" class="gap-1.5 text-xs" onclick={clearAll}>
								<XIcon class="h-3.5 w-3.5" />
								{m.projects_clear_filters()}
							</Button>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- ------------------------------------------------------------ grid -->
		{#if data.projects.length}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.projects as project, i (project.id)}
					{@const percent = fundingPercent(project)}
					{@const reach = reachPercent(project)}
					<div transition:fly={{ y: 20, duration: 500, delay: 80 + i * 40 }}>
						<a href="/projects/{project.slug}" class="group block h-full">
							<Card
								class="flex h-full flex-col overflow-hidden border-primary/10 bg-card/40 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
							>
								<div class="relative aspect-[16/10] overflow-hidden">
									{#if project.featuredImage}
										<img
											src="/files/{project.featuredImage}"
											alt={project.name}
											loading="lazy"
											class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-primary/10">
											<FolderIcon class="h-10 w-10 text-primary/40" />
										</div>
									{/if}

									<span
										class="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm {statusStyles[
											project.status ?? 'planned'
										]}"
									>
										{statusLabel(project.status ?? 'planned')}
									</span>

									{#if project.partners.length}
										<div class="absolute right-3 bottom-3 flex -space-x-1.5">
											{#each project.partners as partner (partner.id)}
												{#if partner.logo}
													<img
														src="/files/{partner.logo}"
														alt={partner.name}
														title={partner.name}
														class="h-6 w-6 rounded-full border border-background bg-background object-contain p-0.5"
													/>
												{/if}
											{/each}
										</div>
									{/if}
								</div>

								<CardContent class="flex flex-1 flex-col gap-3 p-5">
									{#if project.ministryAreaName}
										<span class="text-[11px] font-bold tracking-wide text-primary">
											{project.ministryAreaName}
										</span>
									{/if}

									<h3
										class="line-clamp-2 text-lg leading-snug font-bold tracking-tight transition-colors duration-300 group-hover:text-primary"
									>
										{project.name}
									</h3>

									{#if project.shortDescription}
										<p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
											{project.shortDescription}
										</p>
									{/if}

									<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
										{#if project.location}
											<span class="flex items-center gap-1.5">
												<MapPinIcon class="h-3.5 w-3.5 shrink-0 text-primary" />
												<span class="truncate">{project.location}</span>
											</span>
										{/if}
										{#if project.startDate}
											<span>{yearOf(project.startDate)}</span>
										{/if}
									</div>

									{#if reach !== null}
										<div class="flex items-center gap-2 text-xs">
											<TargetIcon class="h-3.5 w-3.5 shrink-0 text-primary" />
											<span class="text-muted-foreground">
												{m.projects_reach_progress({
													reached: Number(project.reachedBeneficiaries ?? 0),
													target: Number(project.targetBeneficiaries ?? 0)
												})}
											</span>
										</div>
									{/if}

									{#if percent !== null}
										<div class="flex flex-col gap-1.5">
											<div class="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
												<div
													class="h-full rounded-full bg-primary transition-all duration-1000"
													style="width: {percent}%"
												></div>
											</div>
											<div class="flex items-baseline justify-between text-[11px]">
												<span class="font-bold">
													{project.currency ?? 'ETB'}
													{Number(project.fundingRaised ?? 0).toLocaleString(locale)}
												</span>
												<span class="text-muted-foreground">{percent}%</span>
											</div>
										</div>
									{/if}

									<div
										class="mt-auto flex items-center justify-between border-t border-primary/5 pt-3"
									>
										{@render supportIcons(project)}
										<span
											class="flex items-center gap-1 text-xs font-bold text-primary transition-transform duration-300 group-hover:translate-x-1"
										>
											{m.projects_view_project()}
											<ArrowRightIcon class="h-3.5 w-3.5" />
										</span>
									</div>
								</CardContent>
							</Card>
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
							<FolderIcon class="h-6 w-6 text-primary" />
						</div>
						<h2 class="text-lg font-bold tracking-tight">{m.projects_empty_title()}</h2>
						<p class="max-w-sm text-sm text-muted-foreground">{m.projects_empty_description()}</p>
						<Button variant="outline" class="mt-2 gap-1.5" onclick={clearAll}>
							<XIcon class="h-4 w-4" />
							{m.projects_clear_filters()}
						</Button>
					</CardContent>
				</Card>
			</div>
		{/if}

		<!-- ------------------------------------------------------ pagination -->
		{#if data.pagination.pages > 1}
			<nav class="mt-12 flex flex-col items-center gap-3" aria-label={m.projects_pagination_label()}>
				<div class="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						class="gap-1 border-primary/10 bg-primary/5"
						disabled={data.pagination.page === 1}
						onclick={() => setParams({ page: data.pagination.page - 1 })}
					>
						<ChevronLeftIcon class="h-4 w-4" />
						<span class="hidden sm:inline">{m.projects_previous()}</span>
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
						<span class="hidden sm:inline">{m.projects_next()}</span>
						<ChevronRightIcon class="h-4 w-4" />
					</Button>
				</div>

				<p class="text-xs text-muted-foreground">
					{m.projects_page_of({ current: data.pagination.page, total: data.pagination.pages })}
				</p>
			</nav>
		{/if}
	</main>
</div>