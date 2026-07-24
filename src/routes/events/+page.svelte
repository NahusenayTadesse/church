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
		CalendarIcon,
		ClockIcon,
		MapPinIcon,
		VideoIcon,
		UsersIcon,
		TicketIcon,
		ArrowRightIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		XIcon,
		SparklesIcon
	} from '@lucide/svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props();

	let searchTerm = $state(data.filters.q);
	let timer: ReturnType<typeof setTimeout>;

	/* ------------------------------------------------------------- filters */
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

	/* --------------------------------------------------------------- dates */
	/** Values arrive as wall-clock strings; build them locally so the hours never shift. */
	function parseWallClock(value: string | null) {
		if (!value) return null;
		const [datePart, timePart = '00:00:00'] = value.split('T');
		const [y, mo, d] = datePart.split('-').map(Number);
		const [h, mi, s] = timePart.split(':').map(Number);
		if (!y || !mo || !d) return null;
		return new Date(y, mo - 1, d, h || 0, mi || 0, s || 0);
	}

	const locale = $derived(getLocale() === 'am' ? 'am-ET' : 'en-US');

	function fmt(value: string | null, options: Intl.DateTimeFormatOptions) {
		const date = parseWallClock(value);
		return date ? new Intl.DateTimeFormat(locale, options).format(date) : '';
	}

	const dayOf = (value: string | null) => fmt(value, { day: 'numeric' });
	const monthOf = (value: string | null) => fmt(value, { month: 'short' });
	const fullDate = (value: string | null) =>
		fmt(value, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
	const timeOf = (value: string | null) => fmt(value, { hour: 'numeric', minute: '2-digit' });

	/* ------------------------------------------------------------ labels */
	function typeLabel(type: string) {
		const labels: Record<string, string> = {
			conference: m.events_type_conference(),
			workshop: m.events_type_workshop(),
			retreat: m.events_type_retreat(),
			training: m.events_type_training(),
			seminar: m.events_type_seminar(),
			other: m.events_type_other()
		};
		return labels[type] ?? type;
	}

	function formatLabel(value: string) {
		const labels: Record<string, string> = {
			all: m.events_format_all(),
			in_person: m.events_format_in_person(),
			online: m.events_format_online()
		};
		return labels[value] ?? value;
	}

	function sortLabel(value: string) {
		const labels: Record<string, string> = {
			soonest: m.events_sort_soonest(),
			latest: m.events_sort_latest(),
			name: m.events_sort_name()
		};
		return labels[value] ?? value;
	}

	const areaLabel = $derived(
		data.options.areas.find((a) => a.id === data.filters.area)?.name ?? m.events_all_areas()
	);

	/* --------------------------------------------------------- seat status */
	type EventRow = (typeof data.events)[number];

	function seatsLeft(event: EventRow) {
		if (!event.maxAttendees) return null;
		return Math.max(0, event.maxAttendees - Number(event.seatsTaken ?? 0));
	}

	function deadlinePassed(event: EventRow) {
		const deadline = parseWallClock(event.registrationDeadline);
		return deadline ? deadline.getTime() < now : false;
	}

	function canRegister(event: EventRow) {
		if (!event.registrationRequired || event.status === 'cancelled') return false;
		if (deadlinePassed(event)) return false;
		const left = seatsLeft(event);
		return left === null || left > 0;
	}

	function priceLabel(event: EventRow) {
		if (event.isFree) return m.events_free_label();
		return `${event.currency ?? 'ETB'} ${Number(event.cost ?? 0).toLocaleString(locale)}`;
	}

	/* ------------------------------------------------------------ countdown */
	let now = $state(Date.now());

	$effect(() => {
		if (!data.spotlight) return;
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(id);
	});

	const countdown = $derived.by(() => {
		const start = parseWallClock(data.spotlight?.startsAt ?? null);
		if (!start) return null;

		const diff = start.getTime() - now;
		if (diff <= 0) return null;

		const seconds = Math.floor(diff / 1000);
		return {
			days: Math.floor(seconds / 86400),
			hours: Math.floor((seconds % 86400) / 3600),
			minutes: Math.floor((seconds % 3600) / 60),
			seconds: seconds % 60
		};
	});

	const pageNumbers = $derived.by(() => {
		const { page: current, pages } = data.pagination;
		const start = Math.max(1, Math.min(current - 2, pages - 4));
		const end = Math.min(pages, start + 4);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	});
</script>

<svelte:head>
	<title>{m.events_meta_title()}</title>
	<meta name="description" content={m.events_meta_description()} />
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
				{m.events_badge()}
			</span>
			<h1
				class="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl"
			>
				{m.events_heading()}
			</h1>
			<p class="max-w-xl text-base text-muted-foreground">{m.events_description()}</p>
		</div>

		<!-- ------------------------------------------------------- spotlight -->
		{#if data.spotlight}
			{@const item = data.spotlight}
			<div transition:fly={{ y: 20, duration: 700, delay: 100 }} class="mb-12">
				<Card
					class="overflow-hidden border-primary/15 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md"
				>
					<div class="grid lg:grid-cols-5">
						<div class="relative aspect-[16/9] overflow-hidden lg:col-span-2 lg:aspect-auto">
							{#if item.featuredImage}
								<img
									src="/files/{item.featuredImage}"
									alt={item.name}
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center bg-primary/10">
									<CalendarIcon class="h-12 w-12 text-primary/40" />
								</div>
							{/if}
							<span
								class="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 text-[11px] font-bold tracking-widest text-primary uppercase backdrop-blur-sm"
							>
								<SparklesIcon class="h-3.5 w-3.5" />
								{m.events_next_up()}
							</span>
						</div>

						<div class="flex flex-col justify-center gap-5 p-6 sm:p-8 lg:col-span-3">
							<div class="flex flex-wrap items-center gap-2">
								<Badge class="font-semibold">{typeLabel(item.eventType)}</Badge>
								{#if item.status === 'ongoing'}
									<Badge variant="secondary" class="font-semibold">
										{m.events_status_happening_now()}
									</Badge>
								{/if}
								{#if item.ministryAreaName}
									<span class="text-xs text-muted-foreground">{item.ministryAreaName}</span>
								{/if}
							</div>

							<h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{item.name}</h2>

							{#if item.shortDescription}
								<p class="text-sm leading-relaxed text-muted-foreground">{item.shortDescription}</p>
							{/if}

							<div class="grid gap-2.5 text-sm sm:grid-cols-2">
								<span class="flex items-center gap-2">
									<CalendarIcon class="h-4 w-4 shrink-0 text-primary" />
									{fullDate(item.startsAt)}
								</span>
								<span class="flex items-center gap-2">
									<ClockIcon class="h-4 w-4 shrink-0 text-primary" />
									{timeOf(item.startsAt)}{#if item.endsAt}&nbsp;— {timeOf(item.endsAt)}{/if}
								</span>
								<span class="flex items-center gap-2">
									{#if item.isOnline}
										<VideoIcon class="h-4 w-4 shrink-0 text-primary" />
										{m.events_online_label()}
									{:else}
										<MapPinIcon class="h-4 w-4 shrink-0 text-primary" />
										{item.location ?? '—'}
									{/if}
								</span>
								<span class="flex items-center gap-2">
									<TicketIcon class="h-4 w-4 shrink-0 text-primary" />
									{priceLabel(item)}
								</span>
							</div>

							{#if countdown}
								<div class="grid max-w-md grid-cols-4 gap-2">
									{#each [{ value: countdown.days, label: m.events_countdown_days() }, { value: countdown.hours, label: m.events_countdown_hours() }, { value: countdown.minutes, label: m.events_countdown_minutes() }, { value: countdown.seconds, label: m.events_countdown_seconds() }] as unit (unit.label)}
										<div
											class="flex flex-col items-center rounded-xl border border-primary/10 bg-primary/5 py-2.5"
										>
											<span class="font-mono text-xl font-extrabold tabular-nums">
												{String(unit.value).padStart(2, '0')}
											</span>
											<span class="text-[10px] tracking-widest text-muted-foreground uppercase">
												{unit.label}
											</span>
										</div>
									{/each}
								</div>
							{/if}

							<div class="flex flex-wrap items-center gap-3">
								<Button href="/events/{item.slug}" class="group gap-2">
									{canRegister(item) ? m.events_register() : m.events_view_details()}
									<ArrowRightIcon
										class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
									/>
								</Button>

								{#if item.speakers.length}
									<div class="flex items-center gap-2">
										<div class="flex -space-x-2">
											{#each item.speakers as speaker (speaker.id)}
												{#if speaker.photo}
													<img
														src="/files/{speaker.photo}"
														alt={speaker.name}
														title={speaker.name}
														class="h-8 w-8 rounded-full border-2 border-background object-cover"
													/>
												{:else}
													<span
														class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/15 text-[11px] font-bold text-primary"
														title={speaker.name}
													>
														{speaker.name.charAt(0)}
													</span>
												{/if}
											{/each}
										</div>
										<span class="text-xs text-muted-foreground">{m.events_speakers_label()}</span>
									</div>
								{/if}
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
								placeholder={m.events_search_placeholder()}
								class="h-11 border-primary/10 bg-primary/5 pl-10 focus-visible:ring-primary/30"
							/>
						</div>

						<!-- upcoming / past / all -->
						<div class="flex rounded-lg border border-primary/10 bg-primary/5 p-1">
							{#each [{ value: 'upcoming', label: m.events_when_upcoming() }, { value: 'past', label: m.events_when_past() }, { value: 'all', label: m.events_when_all() }] as option (option.value)}
								<button
									type="button"
									onclick={() => setParams({ when: option.value, sort: null })}
									class="flex-1 rounded-md px-4 py-1.5 text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-300 {data
										.filters.when === option.value
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground'}"
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>

					<!-- event type pills -->
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => setParams({ type: 'all' })}
							class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
								.filters.type === 'all'
								? 'border-primary bg-primary text-primary-foreground shadow-sm'
								: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
						>
							{m.events_all_types()}
						</button>

						{#each data.options.types as option (option.value)}
							<button
								type="button"
								onclick={() => setParams({ type: option.value })}
								class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
									.filters.type === option.value
									? 'border-primary bg-primary text-primary-foreground shadow-sm'
									: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
							>
								{typeLabel(option.value)}
								<span class="opacity-60">{option.total}</span>
							</button>
						{/each}

						<button
							type="button"
							onclick={() => setParams({ free: data.filters.freeOnly ? null : '1' })}
							class="rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 {data
								.filters.freeOnly
								? 'border-primary bg-primary text-primary-foreground shadow-sm'
								: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
						>
							{m.events_free_only()}
						</button>
					</div>

					<div class="grid gap-3 sm:grid-cols-3">
						<Select.Root
							type="single"
							value={String(data.filters.area || 'all')}
							onValueChange={(v) => setParams({ area: v })}
						>
							<Select.Trigger class="border-primary/10 bg-primary/5">{areaLabel}</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label={m.events_all_areas()}>
									{m.events_all_areas()}
								</Select.Item>
								{#each data.options.areas as area (area.id)}
									<Select.Item value={String(area.id)} label={area.name}>{area.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						<Select.Root
							type="single"
							value={data.filters.format}
							onValueChange={(v) => setParams({ format: v })}
						>
							<Select.Trigger class="border-primary/10 bg-primary/5">
								{formatLabel(data.filters.format)}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label={m.events_format_all()}>
									{m.events_format_all()}
								</Select.Item>
								<Select.Item value="in_person" label={m.events_format_in_person()}>
									{m.events_format_in_person()}
								</Select.Item>
								<Select.Item value="online" label={m.events_format_online()}>
									{m.events_format_online()}
								</Select.Item>
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
								<Select.Item value="soonest" label={m.events_sort_soonest()}>
									{m.events_sort_soonest()}
								</Select.Item>
								<Select.Item value="latest" label={m.events_sort_latest()}>
									{m.events_sort_latest()}
								</Select.Item>
								<Select.Item value="name" label={m.events_sort_name()}>
									{m.events_sort_name()}
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div
						class="flex flex-wrap items-center justify-between gap-3 border-t border-primary/5 pt-4"
					>
						<p class="text-sm text-muted-foreground">
							{m.events_results_count({ count: data.pagination.total })}
						</p>
						{#if data.filters.hasFilters}
							<Button variant="ghost" size="sm" class="gap-1.5 text-xs" onclick={clearAll}>
								<XIcon class="h-3.5 w-3.5" />
								{m.events_clear_filters()}
							</Button>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- ------------------------------------------------------------ grid -->
		{#if data.events.length}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.events as item, i (item.id)}
					{@const left = seatsLeft(item)}
					<div transition:fly={{ y: 20, duration: 500, delay: 80 + i * 40 }}>
						<a href="/events/{item.slug}" class="group block h-full">
							<Card
								class="flex h-full flex-col overflow-hidden border-primary/10 bg-card/40 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
							>
								<div class="relative aspect-[16/10] overflow-hidden">
									{#if item.featuredImage}
										<img
											src="/files/{item.featuredImage}"
											alt={item.name}
											loading="lazy"
											class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 {item.status ===
											'cancelled'
												? 'grayscale'
												: ''}"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-primary/10">
											<CalendarIcon class="h-10 w-10 text-primary/40" />
										</div>
									{/if}

									<!-- date block -->
									<div
										class="absolute top-3 left-3 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-background/90 shadow-md backdrop-blur-sm"
									>
										<span class="text-lg leading-none font-extrabold text-primary">
											{dayOf(item.startsAt)}
										</span>
										<span class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
											{monthOf(item.startsAt)}
										</span>
									</div>

									<span
										class="absolute top-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur-sm"
									>
										{typeLabel(item.eventType)}
									</span>

									{#if item.status === 'cancelled'}
										<span
											class="absolute right-3 bottom-3 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-white"
										>
											{m.events_status_cancelled()}
										</span>
									{:else if item.status === 'ongoing'}
										<span
											class="absolute right-3 bottom-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground"
										>
											{m.events_status_happening_now()}
										</span>
									{/if}
								</div>

								<CardContent class="flex flex-1 flex-col gap-3 p-5">
									<h3
										class="line-clamp-2 text-lg leading-snug font-bold tracking-tight transition-colors duration-300 group-hover:text-primary"
									>
										{item.name}
									</h3>

									{#if item.shortDescription}
										<p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
											{item.shortDescription}
										</p>
									{/if}

									<div class="flex flex-col gap-1.5 text-xs text-muted-foreground">
										<span class="flex items-center gap-2">
											<ClockIcon class="h-3.5 w-3.5 shrink-0 text-primary" />
											{timeOf(item.startsAt)}{#if item.endsAt}&nbsp;— {timeOf(item.endsAt)}{/if}
										</span>
										<span class="flex items-center gap-2">
											{#if item.isOnline}
												<VideoIcon class="h-3.5 w-3.5 shrink-0 text-primary" />
												{m.events_online_label()}
											{:else}
												<MapPinIcon class="h-3.5 w-3.5 shrink-0 text-primary" />
												<span class="truncate">{item.location ?? '—'}</span>
											{/if}
										</span>
										{#if left !== null}
											<span class="flex items-center gap-2">
												<UsersIcon class="h-3.5 w-3.5 shrink-0 text-primary" />
												{left > 0 ? m.events_seats_left({ count: left }) : m.events_sold_out()}
											</span>
										{/if}
									</div>

									<div
										class="mt-auto flex items-center justify-between border-t border-primary/5 pt-3"
									>
										<span class="text-sm font-bold {item.isFree ? 'text-primary' : ''}">
											{priceLabel(item)}
										</span>
										<span
											class="flex items-center gap-1 text-xs font-bold text-primary transition-transform duration-300 group-hover:translate-x-1"
										>
											{canRegister(item) ? m.events_register() : m.events_view_details()}
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
							<CalendarIcon class="h-6 w-6 text-primary" />
						</div>
						<h2 class="text-lg font-bold tracking-tight">{m.events_empty_title()}</h2>
						<p class="max-w-sm text-sm text-muted-foreground">{m.events_empty_description()}</p>
						<Button variant="outline" class="mt-2 gap-1.5" onclick={clearAll}>
							<XIcon class="h-4 w-4" />
							{m.events_clear_filters()}
						</Button>
					</CardContent>
				</Card>
			</div>
		{/if}

		<!-- ------------------------------------------------------ pagination -->
		{#if data.pagination.pages > 1}
			<nav class="mt-12 flex flex-col items-center gap-3" aria-label={m.events_pagination_label()}>
				<div class="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						class="gap-1 border-primary/10 bg-primary/5"
						disabled={data.pagination.page === 1}
						onclick={() => setParams({ page: data.pagination.page - 1 })}
					>
						<ChevronLeftIcon class="h-4 w-4" />
						<span class="hidden sm:inline">{m.events_previous()}</span>
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
						<span class="hidden sm:inline">{m.events_next()}</span>
						<ChevronRightIcon class="h-4 w-4" />
					</Button>
				</div>

				<p class="text-xs text-muted-foreground">
					{m.events_page_of({ current: data.pagination.page, total: data.pagination.pages })}
				</p>
			</nav>
		{/if}
	</main>
</div>