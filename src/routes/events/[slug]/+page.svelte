<script lang="ts">
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';

	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';

	import {
		ArrowLeftIcon,
		ArrowRightIcon,
		CalendarIcon,
		CalendarPlusIcon,
		ClockIcon,
		MapPinIcon,
		VideoIcon,
		UsersIcon,
		TicketIcon,
		DownloadIcon,
		LinkIcon,
		MinusIcon,
		PlusIcon,
		CheckCircle2Icon,
		AlertCircleIcon,
		BanknoteIcon,
		CopyIcon,
		SendIcon
	} from '@lucide/svelte';
	import { IconBrandFacebook, IconBrandTelegram, IconBrandX } from '@tabler/icons-svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props();

	const { form, errors, enhance, delayed, message } = superForm(data.form, {
		dataType: 'json'
	});

	$effect(() => {
		if ($message) {
			if ($message.type === 'error') toast.error($message.text);
			else toast.success($message.text);
		}
	});

	/* --------------------------------------------------------------- dates */
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

	const fullDate = (value: string | null) =>
		fmt(value, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
	const shortDate = (value: string | null) => fmt(value, { month: 'short', day: 'numeric' });
	const timeOf = (value: string | null) => fmt(value, { hour: 'numeric', minute: '2-digit' });

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

	function roleLabel(role: string | null) {
		const labels: Record<string, string> = {
			speaker: m.event_role_speaker(),
			host: m.event_role_host(),
			panelist: m.event_role_panelist(),
			facilitator: m.event_role_facilitator()
		};
		return labels[role ?? 'speaker'] ?? role ?? '';
	}

	/* ---------------------------------------------------------- calendar */
	const calendarUrl = $derived.by(() => {
		const start = parseWallClock(data.event.startsAt);
		if (!start) return null;

		const end = parseWallClock(data.event.endsAt) ?? new Date(start.getTime() + 2 * 3600 * 1000);
		const stamp = (d: Date) =>
			[
				d.getFullYear(),
				String(d.getMonth() + 1).padStart(2, '0'),
				String(d.getDate()).padStart(2, '0'),
				'T',
				String(d.getHours()).padStart(2, '0'),
				String(d.getMinutes()).padStart(2, '0'),
				'00'
			].join('');

		const params = new URLSearchParams({
			action: 'TEMPLATE',
			text: data.event.name,
			dates: `${stamp(start)}/${stamp(end)}`,
			ctz: data.event.timezone ?? 'Africa/Addis_Ababa',
			details: data.event.shortDescription ?? '',
			location: data.event.isOnline
				? m.events_online_label()
				: (data.event.location ?? '')
		});

		return `https://calendar.google.com/calendar/render?${params}`;
	});

	/* ------------------------------------------------------------ seats */
	const maxSeats = $derived(Math.min(10, data.seatsLeft ?? 10));

	function changeSeats(delta: number) {
		const next = ($form.seats ?? 1) + delta;
		$form.seats = Math.min(maxSeats, Math.max(1, next));
	}

	const unitCost = $derived(Number(data.event.cost ?? 0));
	const totalCost = $derived(unitCost * ($form.seats ?? 1));
	const currency = $derived(data.event.currency ?? 'ETB');

	const selectedAccounts = $derived(
		data.accounts.filter((a) => !$form.paymentMethodId || a.methodId === $form.paymentMethodId)
	);

	const registered = $derived($message?.type === 'success');

	const shareUrl = $derived(page.url.href);

	async function copy(text: string, label: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(label);
		} catch {
			toast.error(m.post_share_copy_failed());
		}
	}
</script>

<svelte:head>
	<title>{data.event.name} — Steward of Life</title>
	<meta name="description" content={data.event.shortDescription ?? ''} />
	<meta property="og:title" content={data.event.name} />
	<meta property="og:description" content={data.event.shortDescription ?? ''} />
	{#if data.event.featuredImage}
		<meta property="og:image" content="/files/{data.event.featuredImage}" />
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
			href="/events"
			class="group mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
		>
			<ArrowLeftIcon class="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
			{m.event_back_to_events()}
		</a>

		<!-- ------------------------------------------------------------ head -->
		<header transition:fly={{ y: 30, duration: 700 }} class="mb-10 flex flex-col gap-5">
			<div class="flex flex-wrap items-center gap-2">
				<Badge class="font-semibold">{typeLabel(data.event.eventType)}</Badge>
				{#if data.event.status === 'cancelled'}
					<Badge variant="destructive" class="font-semibold">
						{m.events_status_cancelled()}
					</Badge>
				{:else if data.event.status === 'ongoing'}
					<Badge variant="secondary" class="font-semibold">
						{m.events_status_happening_now()}
					</Badge>
				{/if}
				{#if data.event.ministryAreaName}
					<a
						href="/events?area={data.event.ministryAreaId}"
						class="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
					>
						{data.event.ministryAreaName}
					</a>
				{/if}
			</div>

			<h1
				class="max-w-4xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl"
			>
				{data.event.name}
			</h1>

			{#if data.event.shortDescription}
				<p class="max-w-3xl text-lg leading-relaxed text-muted-foreground">
					{data.event.shortDescription}
				</p>
			{/if}
		</header>

		{#if data.event.featuredImage}
			<figure
				transition:fly={{ y: 20, duration: 600, delay: 100 }}
				class="mb-12 overflow-hidden rounded-3xl border border-primary/10 shadow-lg"
			>
				<img
					src="/files/{data.event.featuredImage}"
					alt={data.event.name}
					class="max-h-[55vh] w-full object-cover {data.event.status === 'cancelled'
						? 'grayscale'
						: ''}"
				/>
			</figure>
		{/if}

		<div class="grid gap-10 lg:grid-cols-12">
			<!-- ------------------------------------------------------- main -->
			<div transition:fly={{ y: 20, duration: 600, delay: 150 }} class="flex flex-col gap-12 lg:col-span-7">
				{#if data.event.fullDescription}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.event_about_title()}</h2>
						<div class="event-content">
							{@html data.event.fullDescription}
						</div>
					</section>
				{/if}

				<!-- speakers -->
				{#if data.speakers.length}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.event_speakers_title()}</h2>
						<div class="grid gap-4 sm:grid-cols-2">
							{#each data.speakers as speaker (speaker.id)}
								<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
									<CardContent class="flex gap-4 pt-6">
										{#if speaker.photo}
											<img
												src="/files/{speaker.photo}"
												alt={speaker.name}
												class="h-16 w-16 shrink-0 rounded-2xl border border-primary/20 object-cover"
											/>
										{:else}
											<span
												class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary"
											>
												{speaker.name?.charAt(0)}
											</span>
										{/if}
										<div class="min-w-0">
											<p class="text-[10px] font-bold tracking-widest text-primary uppercase">
												{roleLabel(speaker.role)}
											</p>
											<p class="font-bold tracking-tight">{speaker.name}</p>
											{#if speaker.title}
												<p class="text-xs text-muted-foreground">{speaker.title}</p>
											{/if}
											{#if speaker.bio}
												<p class="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
													{speaker.bio}
												</p>
											{/if}
										</div>
									</CardContent>
								</Card>
							{/each}
						</div>
					</section>
				{/if}

				<!-- downloads -->
				{#if data.downloads.length}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.event_downloads_title()}</h2>
						<div class="flex flex-col gap-2.5">
							{#each data.downloads as file (file.id)}
								<a
									href="/files/{file.fileUrl}"
									download
									class="group flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-3.5 transition-all duration-300 hover:border-primary/25 hover:bg-primary/10"
								>
									<span
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
									>
										<DownloadIcon class="h-4 w-4" />
									</span>
									<span class="min-w-0 flex-1">
										<span class="block truncate text-sm font-bold">{file.title}</span>
										<span class="text-[11px] tracking-wide text-muted-foreground uppercase">
											{file.fileType}
											{#if file.fileSize}
												· {(file.fileSize / 1024 / 1024).toFixed(1)} MB
											{/if}
										</span>
									</span>
								</a>
							{/each}
						</div>
					</section>
				{/if}

				<!-- where -->
				<section>
					<h2 class="mb-4 text-xl font-bold tracking-tight">{m.event_location_title()}</h2>
					{#if data.event.isOnline}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col gap-3 pt-6">
								<span class="flex items-center gap-2 font-bold">
									<VideoIcon class="h-5 w-5 text-primary" />
									{m.events_online_label()}
								</span>
								<p class="text-sm text-muted-foreground">{m.event_online_note()}</p>
								{#if data.event.onlineMeetingLink && data.event.status === 'ongoing'}
									<Button href={data.event.onlineMeetingLink} target="_blank" class="w-fit gap-2">
										<VideoIcon class="h-4 w-4" />
										{m.event_join_online()}
									</Button>
								{/if}
							</CardContent>
						</Card>
					{:else}
						<div class="flex flex-col gap-3">
							<p class="flex items-center gap-2 font-semibold">
								<MapPinIcon class="h-5 w-5 shrink-0 text-primary" />
								{data.event.location ?? '—'}
							</p>
							{#if data.event.locationMapUrl}
								<iframe
									src={data.event.locationMapUrl}
									style="border:0;"
									class="h-[35vh] w-full rounded-3xl border border-primary/10 shadow-lg"
									loading="lazy"
									referrerpolicy="no-referrer-when-downgrade"
									title={data.event.location ?? m.event_location_title()}
								></iframe>
							{/if}
						</div>
					{/if}
				</section>

				<!-- gallery -->
				{#if data.gallery.length}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.event_gallery_title()}</h2>
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{#each data.gallery as item (item.id)}
								<figure
									class="group overflow-hidden rounded-2xl border border-primary/10 bg-primary/5"
								>
									<img
										src="/files/{item.imageUrl}"
										alt={item.caption ?? data.event.name}
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
			</div>

			<!-- ---------------------------------------------------- sidebar -->
			<aside transition:fly={{ y: 20, duration: 600, delay: 200 }} class="lg:col-span-5">
				<div class="flex flex-col gap-5 lg:sticky lg:top-24">
					<!-- the facts -->
					<Card
						class="border-primary/15 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md"
					>
						<CardContent class="flex flex-col gap-4 pt-6">
							<div class="flex items-start gap-3">
								<CalendarIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
								<div>
									<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
										{m.event_when_label()}
									</p>
									<p class="font-bold">{fullDate(data.event.startsAt)}</p>
									{#if data.event.endsAt && shortDate(data.event.endsAt) !== shortDate(data.event.startsAt)}
										<p class="text-sm text-muted-foreground">
											{m.event_until()}
											{fullDate(data.event.endsAt)}
										</p>
									{/if}
								</div>
							</div>

							<div class="flex items-start gap-3">
								<ClockIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
								<div>
									<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
										{m.event_time_label()}
									</p>
									<p class="font-bold">
										{timeOf(data.event.startsAt)}{#if data.event.endsAt}&nbsp;— {timeOf(
												data.event.endsAt
											)}{/if}
									</p>
									<p class="text-xs text-muted-foreground">{data.event.timezone}</p>
								</div>
							</div>

							<div class="flex items-start gap-3">
								{#if data.event.isOnline}
									<VideoIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
								{:else}
									<MapPinIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
								{/if}
								<div>
									<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
										{m.event_where_label()}
									</p>
									<p class="font-bold">
										{data.event.isOnline ? m.events_online_label() : (data.event.location ?? '—')}
									</p>
								</div>
							</div>

							<div class="flex items-start gap-3">
								<TicketIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
								<div>
									<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
										{m.event_cost_label()}
									</p>
									<p class="font-bold">
										{data.event.isFree
											? m.events_free_label()
											: `${currency} ${unitCost.toLocaleString(locale)}`}
										{#if !data.event.isFree}
											<span class="text-xs font-normal text-muted-foreground">
												{m.event_per_seat()}
											</span>
										{/if}
									</p>
								</div>
							</div>

							{#if data.seatsLeft !== null}
								<div class="flex items-start gap-3">
									<UsersIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
									<div class="w-full">
										<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
											{m.event_seats_label()}
										</p>
										<p class="font-bold">
											{data.seatsLeft > 0
												? m.events_seats_left({ count: data.seatsLeft })
												: m.events_sold_out()}
										</p>
										<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
											<div
												class="h-full rounded-full bg-primary transition-all duration-700"
												style="width: {Math.min(
													100,
													(data.seatsTaken / (data.event.maxAttendees || 1)) * 100
												)}%"
											></div>
										</div>
									</div>
								</div>
							{/if}

							{#if data.event.registrationDeadline && data.event.registrationOpen}
								<p class="rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
									{m.event_deadline_note({ date: fullDate(data.event.registrationDeadline) })}
								</p>
							{/if}

							{#if calendarUrl && !data.event.hasEnded && data.event.status !== 'cancelled'}
								<Button
									href={calendarUrl}
									target="_blank"
									rel="noopener noreferrer"
									variant="outline"
									class="w-full gap-2 border-primary/20 bg-primary/5"
								>
									<CalendarPlusIcon class="h-4 w-4" />
									{m.event_add_to_calendar()}
								</Button>
							{/if}
						</CardContent>
					</Card>

					<!-- registration -->
					{#if registered}
						<Card class="border-primary/25 bg-primary/5 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col items-center gap-3 py-10 text-center">
								<CheckCircle2Icon class="h-10 w-10 text-primary" />
								<h2 class="text-lg font-bold tracking-tight">{m.event_registered_title()}</h2>
								<p class="max-w-xs text-sm text-muted-foreground">{$message?.text}</p>
							</CardContent>
						</Card>
					{:else if data.event.status === 'cancelled'}
						<Card class="border-destructive/30 bg-destructive/5 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col items-center gap-2 py-10 text-center">
								<AlertCircleIcon class="h-8 w-8 text-destructive" />
								<h2 class="font-bold tracking-tight">{m.event_cancelled_title()}</h2>
								<p class="max-w-xs text-sm text-muted-foreground">{m.event_cancelled_description()}</p>
							</CardContent>
						</Card>
					{:else if data.event.hasEnded}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col items-center gap-3 py-10 text-center">
								<CalendarIcon class="h-8 w-8 text-primary" />
								<h2 class="font-bold tracking-tight">{m.event_finished_title()}</h2>
								<p class="max-w-xs text-sm text-muted-foreground">{m.event_finished_description()}</p>
								<Button href="/events" variant="outline" class="mt-1 gap-1.5">
									{m.event_see_upcoming()}
									<ArrowRightIcon class="h-4 w-4" />
								</Button>
							</CardContent>
						</Card>
					{:else if !data.event.registrationRequired}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col items-center gap-2 py-10 text-center">
								<CheckCircle2Icon class="h-8 w-8 text-primary" />
								<h2 class="font-bold tracking-tight">{m.event_no_registration_title()}</h2>
								<p class="max-w-xs text-sm text-muted-foreground">
									{m.event_no_registration_description()}
								</p>
							</CardContent>
						</Card>
					{:else if data.seatsLeft === 0}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col items-center gap-2 py-10 text-center">
								<UsersIcon class="h-8 w-8 text-primary" />
								<h2 class="font-bold tracking-tight">{m.events_sold_out()}</h2>
								<p class="max-w-xs text-sm text-muted-foreground">{m.event_sold_out_description()}</p>
							</CardContent>
						</Card>
					{:else if !data.event.registrationOpen}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col items-center gap-2 py-10 text-center">
								<ClockIcon class="h-8 w-8 text-primary" />
								<h2 class="font-bold tracking-tight">{m.event_closed_title()}</h2>
								<p class="max-w-xs text-sm text-muted-foreground">{m.event_closed_description()}</p>
							</CardContent>
						</Card>
					{:else}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardHeader>
								<CardTitle class="text-lg font-bold tracking-tight">
									{m.event_register_title()}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<form class="space-y-5" action="?/register" method="POST" use:enhance>
									<InputComp
										{form}
										{errors}
										type="text"
										name="name"
										label={m.event_form_name_label()}
										placeholder={m.event_form_name_placeholder()}
									/>

									<div class="grid gap-4 sm:grid-cols-2">
										<InputComp
											{form}
											{errors}
											type="email"
											name="email"
											label={m.event_form_email_label()}
											placeholder={m.event_form_email_placeholder()}
										/>
										<InputComp
											{form}
											{errors}
											type="tel"
											name="phone"
											label={m.event_form_phone_label()}
											placeholder={m.event_form_phone_placeholder()}
										/>
									</div>

									<InputComp
										{form}
										{errors}
										type="text"
										name="organization"
										label={m.event_form_organization_label()}
										placeholder={m.event_form_organization_placeholder()}
									/>

									<!-- seats -->
									<div class="flex flex-col gap-1.5">
										<span class="text-sm font-medium">{m.event_form_seats_label()}</span>
										<div class="flex items-center gap-3">
											<button
												type="button"
												onclick={() => changeSeats(-1)}
												disabled={($form.seats ?? 1) <= 1}
												aria-label={m.event_form_seats_decrease()}
												class="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
											>
												<MinusIcon class="h-4 w-4" />
											</button>
											<span class="w-10 text-center font-mono text-xl font-bold tabular-nums">
												{$form.seats ?? 1}
											</span>
											<button
												type="button"
												onclick={() => changeSeats(1)}
												disabled={($form.seats ?? 1) >= maxSeats}
												aria-label={m.event_form_seats_increase()}
												class="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
											>
												<PlusIcon class="h-4 w-4" />
											</button>

											{#if !data.event.isFree}
												<span class="ml-auto text-right">
													<span
														class="block text-[11px] tracking-widest text-muted-foreground uppercase"
													>
														{m.event_total_label()}
													</span>
													<span class="font-mono text-lg font-extrabold">
														{currency}
														{totalCost.toLocaleString(locale)}
													</span>
												</span>
											{/if}
										</div>
										{#if $errors.seats}
											<span class="text-xs text-destructive">{$errors.seats}</span>
										{/if}
									</div>

									<!-- payment method -->
									{#if !data.event.isFree && data.accounts.length}
										<div class="flex flex-col gap-2">
											<span class="text-sm font-medium">{m.event_form_payment_label()}</span>
											<div class="grid grid-cols-2 gap-2">
												{#each [...new Map(data.accounts.map((a) => [a.methodId, a])).values()] as account (account.methodId)}
													<button
														type="button"
														onclick={() => ($form.paymentMethodId = account.methodId)}
														class="flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition-all duration-300 {$form.paymentMethodId ===
														account.methodId
															? 'border-primary bg-primary/10 text-primary'
															: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/25'}"
													>
														{#if account.methodLogo}
															<img
																src="/files/{account.methodLogo}"
																alt={account.methodName}
																class="h-6 w-6 shrink-0 rounded object-contain"
															/>
														{:else}
															<BanknoteIcon class="h-4 w-4 shrink-0" />
														{/if}
														<span class="truncate">{account.methodName}</span>
													</button>
												{/each}
											</div>
										</div>
									{/if}

									<InputComp
										{form}
										{errors}
										type="textarea"
										name="notes"
										label={m.event_form_notes_label()}
										placeholder={m.event_form_notes_placeholder()}
									/>

									<Button type="submit" class="group w-full gap-2">
										{#if $delayed}
											<LoadingBtn name={m.event_form_loading()} />
										{:else}
											<SendIcon
												class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5"
											/>
											{data.event.isFree ? m.event_form_submit_free() : m.event_form_submit_paid()}
										{/if}
									</Button>
								</form>
							</CardContent>
						</Card>
					{/if}

					<!-- bank details for manual transfer -->
					{#if !data.event.isFree && selectedAccounts.length && !data.event.hasEnded && data.event.status !== 'cancelled'}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardHeader class="pb-2">
								<CardTitle class="text-sm font-bold tracking-wide">
									{m.event_payment_title()}
								</CardTitle>
							</CardHeader>
							<CardContent class="flex flex-col gap-4">
								<p class="text-xs leading-relaxed text-muted-foreground">
									{m.event_payment_description()}
								</p>

								{#each selectedAccounts as account (account.id)}
									<div class="flex flex-col gap-2 rounded-xl border border-primary/10 bg-primary/5 p-3.5">
										<p class="text-sm font-bold">{account.accountName}</p>
										<button
											type="button"
											onclick={() => copy(account.accountNumber, m.event_payment_copied())}
											class="group flex items-center justify-between gap-2 rounded-lg border border-primary/10 bg-background/50 px-3 py-2 text-left transition-colors hover:border-primary/25"
										>
											<span class="font-mono text-sm font-bold tracking-wide">
												{account.accountNumber}
											</span>
											<CopyIcon
												class="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
											/>
										</button>
										<div class="grid gap-1 text-xs text-muted-foreground">
											{#if account.bankName}
												<span>{account.bankName}{#if account.branch} · {account.branch}{/if}</span>
											{/if}
											{#if account.swiftCode}
												<span class="font-mono">SWIFT {account.swiftCode}</span>
											{/if}
											{#if account.instructions}
												<span class="mt-1 leading-relaxed">{account.instructions}</span>
											{/if}
										</div>
									</div>
								{/each}
							</CardContent>
						</Card>
					{/if}

					<!-- organizer + share -->
					<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
						<CardContent class="flex flex-col gap-4 pt-6">
							{#if data.event.organizerName}
								<div class="flex items-center gap-3">
									{#if data.event.organizerPhoto}
										<img
											src="/files/{data.event.organizerPhoto}"
											alt={data.event.organizerName}
											class="h-11 w-11 rounded-full border border-primary/20 object-cover"
										/>
									{/if}
									<div class="min-w-0">
										<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
											{m.event_organizer_label()}
										</p>
										<p class="truncate text-sm font-bold">{data.event.organizerName}</p>
										{#if data.event.organizerPosition}
											<p class="truncate text-xs text-muted-foreground">
												{data.event.organizerPosition}
											</p>
										{/if}
									</div>
								</div>
							{/if}

							<div class="grid grid-cols-4 gap-2">
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
									href="https://t.me/share/url?url={encodeURIComponent(
										shareUrl
									)}&text={encodeURIComponent(data.event.name)}"
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
									)}&text={encodeURIComponent(data.event.name)}"
									target="_blank"
									rel="noopener noreferrer"
									aria-label="X"
									class="flex h-10 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary/10"
								>
									<IconBrandX class="h-4 w-4" />
								</a>
								<button
									type="button"
									onclick={() => copy(shareUrl, m.post_share_copied())}
									aria-label={m.post_share_copy()}
									class="flex h-10 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary/10"
								>
									<LinkIcon class="h-4 w-4" />
								</button>
							</div>
						</CardContent>
					</Card>
				</div>
			</aside>
		</div>

		<!-- --------------------------------------------------------- related -->
		{#if data.related.length}
			<section class="mt-16">
				<h2 class="mb-6 text-xl font-bold tracking-tight">{m.event_related_title()}</h2>
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.related as item (item.id)}
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
											class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-primary/10">
											<CalendarIcon class="h-8 w-8 text-primary/40" />
										</div>
									{/if}
									<span
										class="absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur-sm"
									>
										{shortDate(item.startsAt)}
									</span>
								</div>
								<CardContent class="flex flex-1 flex-col gap-2 p-5">
									<span class="text-[11px] font-bold tracking-wide text-primary">
										{typeLabel(item.eventType)}
									</span>
									<h3
										class="line-clamp-2 leading-snug font-bold tracking-tight transition-colors group-hover:text-primary"
									>
										{item.name}
									</h3>
									<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
										{#if item.isOnline}
											<VideoIcon class="h-3.5 w-3.5" />
											{m.events_online_label()}
										{:else}
											<MapPinIcon class="h-3.5 w-3.5" />
											<span class="truncate">{item.location ?? '—'}</span>
										{/if}
									</span>
								</CardContent>
							</Card>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	</main>
</div>

<style>
	/* Editor-authored HTML from `events.fullDescription`. */
	.event-content {
		font-size: 1rem;
		line-height: 1.8;
		color: var(--foreground);
	}

	.event-content :global(h2),
	.event-content :global(h3) {
		margin: 2rem 0 0.75rem;
		font-size: 1.2rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.event-content :global(p) {
		margin-bottom: 1.1rem;
	}

	.event-content :global(a) {
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.event-content :global(ul),
	.event-content :global(ol) {
		margin: 0 0 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.event-content :global(ul) {
		list-style: disc;
	}

	.event-content :global(ol) {
		list-style: decimal;
	}

	.event-content :global(blockquote) {
		margin: 1.5rem 0;
		border-left: 3px solid var(--primary);
		background: color-mix(in oklab, var(--primary) 6%, transparent);
		padding: 0.9rem 1.1rem;
		border-radius: 0 0.75rem 0.75rem 0;
		font-style: italic;
	}

	.event-content :global(img) {
		margin: 1.5rem 0;
		width: 100%;
		border-radius: 1rem;
	}
</style>