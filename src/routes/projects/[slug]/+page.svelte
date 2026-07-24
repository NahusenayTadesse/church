<script lang="ts">
	import { fly, slide } from 'svelte/transition';
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
		MapPinIcon,
		CalendarIcon,
		UsersIcon,
		TargetIcon,
		HandCoinsIcon,
		HeartIcon,
		DownloadIcon,
		QuoteIcon,
		CheckCircle2Icon,
		SendIcon,
		FolderIcon,
		ExternalLinkIcon
	} from '@lucide/svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props();

	const { form, errors, enhance, delayed, message } = superForm(data.form, { dataType: 'json' });

	$effect(() => {
		if ($message) {
			if ($message.type === 'error') toast.error($message.text);
			else toast.success($message.text);
		}
	});

	const sent = $derived($message?.type === 'success');
	let showForm = $state(false);

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

	function purposeLabel(value: string) {
		const labels: Record<string, string> = {
			volunteer: m.project_purpose_volunteer(),
			pray: m.project_purpose_pray(),
			partner: m.project_purpose_partner(),
			question: m.project_purpose_question()
		};
		return labels[value] ?? value;
	}

	const statusStyles: Record<string, string> = {
		planned: 'bg-background/85 text-muted-foreground',
		active: 'bg-primary text-primary-foreground',
		paused: 'bg-background/85 text-muted-foreground',
		completed: 'bg-background/85 text-primary'
	};

	const formatDate = (value: string | Date | null, withDay = false) =>
		value
			? new Intl.DateTimeFormat(locale, {
					year: 'numeric',
					month: 'long',
					...(withDay ? { day: 'numeric' } : {})
				}).format(new Date(value))
			: '';

	const currency = $derived(data.project.currency ?? 'ETB');
	const raised = $derived(Number(data.project.fundingRaised ?? 0));
	const goal = $derived(Number(data.project.fundingGoal ?? 0));
	const fundingPercent = $derived(goal ? Math.min(100, Math.round((raised / goal) * 100)) : null);

	const reached = $derived(Number(data.project.reachedBeneficiaries ?? 0));
	const target = $derived(Number(data.project.targetBeneficiaries ?? 0));
	const reachPercent = $derived(target ? Math.min(100, Math.round((reached / target) * 100)) : null);

	const purposeOptions = $derived(
		[
			data.project.acceptsVolunteers ? 'volunteer' : null,
			data.project.acceptsPrayer ? 'pray' : null,
			'partner',
			'question'
		].filter(Boolean) as string[]
	);

	const money = (value: number) => `${currency} ${value.toLocaleString(locale)}`;
</script>

<svelte:head>
	<title>{data.project.name} — Steward of Life</title>
	<meta name="description" content={data.project.shortDescription ?? ''} />
	<meta property="og:title" content={data.project.name} />
	<meta property="og:description" content={data.project.shortDescription ?? ''} />
	{#if data.project.featuredImage}
		<meta property="og:image" content="/files/{data.project.featuredImage}" />
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
			href="/projects"
			class="group mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
		>
			<ArrowLeftIcon class="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
			{m.project_back_to_projects()}
		</a>

		<!-- ------------------------------------------------------------ head -->
		<header transition:fly={{ y: 30, duration: 700 }} class="mb-10 flex flex-col gap-5">
			<div class="flex flex-wrap items-center gap-2">
				<span
					class="rounded-full px-3 py-1 text-[11px] font-bold tracking-widest uppercase {statusStyles[
						data.project.status ?? 'planned'
					]}"
				>
					{statusLabel(data.project.status ?? 'planned')}
				</span>
				{#if data.project.ministryAreaName}
					<a
						href="/projects?area={data.project.ministryAreaId}"
						class="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
					>
						{data.project.ministryAreaName}
					</a>
				{/if}
			</div>

			<h1
				class="max-w-4xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl"
			>
				{data.project.name}
			</h1>

			{#if data.project.shortDescription}
				<p class="max-w-3xl text-lg leading-relaxed text-muted-foreground">
					{data.project.shortDescription}
				</p>
			{/if}
		</header>

		{#if data.project.featuredImage}
			<figure
				transition:fly={{ y: 20, duration: 600, delay: 100 }}
				class="mb-12 overflow-hidden rounded-3xl border border-primary/10 shadow-lg"
			>
				<img
					src="/files/{data.project.featuredImage}"
					alt={data.project.name}
					class="max-h-[55vh] w-full object-cover"
				/>
			</figure>
		{/if}

		<div class="grid gap-10 lg:grid-cols-12">
			<!-- ------------------------------------------------------- main -->
			<div
				transition:fly={{ y: 20, duration: 600, delay: 150 }}
				class="flex flex-col gap-12 lg:col-span-7"
			>
				{#if data.project.fullDescription}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.project_about_title()}</h2>
						<div class="project-content">{@html data.project.fullDescription}</div>
					</section>
				{/if}

				{#if data.project.goal}
					<section>
						<h2 class="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight">
							<TargetIcon class="h-5 w-5 text-primary" />
							{m.project_goal_title()}
						</h2>
						<div class="project-content">{@html data.project.goal}</div>
					</section>
				{/if}

				{#if data.project.activities}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.project_activities_title()}</h2>
						<div class="project-content">{@html data.project.activities}</div>
					</section>
				{/if}

				{#if data.project.impactResults}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.project_results_title()}</h2>
						<div class="project-content">{@html data.project.impactResults}</div>
					</section>
				{/if}

				<!-- updates timeline -->
				{#if data.updates.length}
					<section>
						<h2 class="mb-6 text-xl font-bold tracking-tight">{m.project_updates_title()}</h2>
						<ol class="relative flex flex-col gap-8 border-l border-primary/15 pl-6">
							{#each data.updates as update (update.id)}
								<li class="relative">
									<span
										class="absolute top-1.5 -left-[1.9rem] flex h-3 w-3 items-center justify-center rounded-full border-2 border-background bg-primary"
									></span>
									{#if update.publishedAt}
										<p class="text-[11px] font-bold tracking-widest text-primary uppercase">
											{formatDate(update.publishedAt, true)}
										</p>
									{/if}
									<h3 class="mt-1 text-lg font-bold tracking-tight">{update.title}</h3>
									{#if update.image}
										<img
											src="/files/{update.image}"
											alt={update.title}
											loading="lazy"
											class="mt-3 w-full rounded-2xl border border-primary/10 object-cover"
										/>
									{/if}
									{#if update.content}
										<p class="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
											{update.content}
										</p>
									{/if}
								</li>
							{/each}
						</ol>
					</section>
				{/if}

				<!-- stories -->
				{#if data.stories.length}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.project_stories_title()}</h2>
						<div class="flex flex-col gap-4">
							{#each data.stories as story (story.id)}
								<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
									<CardContent class="flex flex-col gap-3 pt-6">
										<QuoteIcon class="h-5 w-5 text-primary/50" />
										{#if story.title}
											<p class="font-bold tracking-tight">{story.title}</p>
										{/if}
										<p class="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
											{story.message}
										</p>
										<div class="flex items-center gap-3 pt-1">
											{#if story.avatar}
												<img
													src="/files/{story.avatar}"
													alt={story.name}
													class="h-9 w-9 rounded-full border border-primary/20 object-cover"
												/>
											{/if}
											<div>
												<p class="text-sm font-bold">{story.name}</p>
												{#if story.position}
													<p class="text-xs text-muted-foreground">{story.position}</p>
												{/if}
											</div>
										</div>
									</CardContent>
								</Card>
							{/each}
						</div>
					</section>
				{/if}

				<!-- gallery -->
				{#if data.gallery.length}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.project_gallery_title()}</h2>
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{#each data.gallery as item (item.id)}
								<figure
									class="group overflow-hidden rounded-2xl border border-primary/10 bg-primary/5"
								>
									<img
										src="/files/{item.imageUrl}"
										alt={item.caption ?? data.project.name}
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

				<!-- documents -->
				{#if data.documents.length}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.project_documents_title()}</h2>
						<div class="flex flex-col gap-2.5">
							{#each data.documents as file (file.id)}
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
			</div>

			<!-- ---------------------------------------------------- sidebar -->
			<aside transition:fly={{ y: 20, duration: 600, delay: 200 }} class="lg:col-span-5">
				<div class="flex flex-col gap-5 lg:sticky lg:top-24">
					<!-- where it stands -->
					<Card
						class="border-primary/15 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md"
					>
						<CardContent class="flex flex-col gap-5 pt-6">
							{#if fundingPercent !== null}
								<div class="flex flex-col gap-2">
									<div class="flex items-baseline justify-between">
										<span class="text-2xl font-extrabold">{money(raised)}</span>
										<span class="text-xs text-muted-foreground">
											{m.projects_of_goal({ goal: money(goal) })}
										</span>
									</div>
									<div class="h-2.5 w-full overflow-hidden rounded-full bg-primary/10">
										<div
											class="h-full rounded-full bg-primary transition-all duration-1000"
											style="width: {fundingPercent}%"
										></div>
									</div>
									<span class="text-xs font-semibold text-primary">
										{m.project_funded_percent({ percent: fundingPercent })}
									</span>
								</div>
							{/if}

							{#if reachPercent !== null || reached > 0}
								<div class="flex items-start gap-3">
									<UsersIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
									<div class="w-full">
										<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
											{m.project_people_label()}
										</p>
										<p class="font-bold">
											{#if target}
												{m.projects_reach_progress({ reached, target })}
											{:else}
												{m.projects_reached_count({ count: reached })}
											{/if}
										</p>
										{#if reachPercent !== null}
											<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
												<div
													class="h-full rounded-full bg-primary transition-all duration-1000"
													style="width: {reachPercent}%"
												></div>
											</div>
										{/if}
									</div>
								</div>
							{/if}

							{#if data.project.beneficiaries}
								<div class="flex items-start gap-3">
									<TargetIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
									<div>
										<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
											{m.project_serves_label()}
										</p>
										<p class="text-sm font-semibold">{data.project.beneficiaries}</p>
									</div>
								</div>
							{/if}

							{#if data.project.location}
								<div class="flex items-start gap-3">
									<MapPinIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
									<div>
										<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
											{m.project_where_label()}
										</p>
										<p class="text-sm font-semibold">{data.project.location}</p>
									</div>
								</div>
							{/if}

							{#if data.project.startDate}
								<div class="flex items-start gap-3">
									<CalendarIcon class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
									<div>
										<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
											{m.project_running_label()}
										</p>
										<p class="text-sm font-semibold">
											{formatDate(data.project.startDate)}
											{#if data.project.endDate}
												— {formatDate(data.project.endDate)}
											{:else}
												— {m.project_ongoing()}
											{/if}
										</p>
									</div>
								</div>
							{/if}
						</CardContent>
					</Card>

					<!-- support -->
					{#if sent}
						<Card class="border-primary/25 bg-primary/5 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col items-center gap-2 py-10 text-center">
								<CheckCircle2Icon class="h-8 w-8 text-primary" />
								<p class="font-bold tracking-tight">{m.project_support_sent_title()}</p>
								<p class="max-w-xs text-sm text-muted-foreground">{$message?.text}</p>
							</CardContent>
						</Card>
					{:else}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardHeader class="pb-3">
								<CardTitle class="text-lg font-bold tracking-tight">
									{m.project_support_title()}
								</CardTitle>
							</CardHeader>
							<CardContent class="flex flex-col gap-3">
								{#if data.project.acceptsDonations}
									<Button
										href={data.cause ? `/donate?cause=${data.cause.slug}` : '/donate'}
										class="w-full gap-2"
									>
										<HandCoinsIcon class="h-4 w-4" />
										{m.project_give_button()}
									</Button>
								{/if}

								{#if !showForm}
									<Button
										variant="outline"
										class="w-full gap-2 border-primary/20 bg-primary/5"
										onclick={() => (showForm = true)}
									>
										<HeartIcon class="h-4 w-4" />
										{m.project_get_involved_button()}
									</Button>
									<p class="text-[11px] leading-relaxed text-muted-foreground">
										{m.project_support_note()}
									</p>
								{:else}
									<div transition:slide={{ duration: 250 }}>
										<form class="flex flex-col gap-4" action="?/support" method="POST" use:enhance>
											<div class="flex flex-wrap gap-2">
												{#each purposeOptions as option (option)}
													<button
														type="button"
														onclick={() => ($form.purpose = option as typeof $form.purpose)}
														class="rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 {$form.purpose ===
														option
															? 'border-primary bg-primary text-primary-foreground'
															: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30'}"
													>
														{purposeLabel(option)}
													</button>
												{/each}
											</div>

											<InputComp
												{form}
												{errors}
												type="text"
												name="name"
												label={m.project_form_name_label()}
												placeholder={m.project_form_name_placeholder()}
											/>

											<div class="grid gap-4 sm:grid-cols-2">
												<InputComp
													{form}
													{errors}
													type="email"
													name="email"
													label={m.project_form_email_label()}
													placeholder={m.project_form_email_placeholder()}
												/>
												<InputComp
													{form}
													{errors}
													type="tel"
													name="phone"
													label={m.project_form_phone_label()}
													placeholder={m.project_form_phone_placeholder()}
												/>
											</div>

											<InputComp
												{form}
												{errors}
												type="textarea"
												name="message"
												label={m.project_form_message_label()}
												placeholder={m.project_form_message_placeholder()}
											/>

											<Button type="submit" class="group w-full gap-2">
												{#if $delayed}
													<LoadingBtn name={m.project_form_loading()} />
												{:else}
													<SendIcon
														class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5"
													/>
													{m.project_form_submit()}
												{/if}
											</Button>
										</form>
									</div>
								{/if}
							</CardContent>
						</Card>
					{/if}

					<!-- leader -->
					{#if data.project.leaderName}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardContent class="flex items-center gap-3 pt-6">
								{#if data.project.leaderPhoto}
									<img
										src="/files/{data.project.leaderPhoto}"
										alt={data.project.leaderName}
										class="h-12 w-12 rounded-full border border-primary/20 object-cover"
									/>
								{/if}
								<div class="min-w-0">
									<p class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
										{m.project_leader_label()}
									</p>
									<p class="truncate text-sm font-bold">{data.project.leaderName}</p>
									{#if data.project.leaderPosition}
										<p class="truncate text-xs text-muted-foreground">
											{data.project.leaderPosition}
										</p>
									{/if}
								</div>
							</CardContent>
						</Card>
					{/if}

					<!-- partners -->
					{#if data.partners.length}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardHeader class="pb-2">
								<CardTitle class="text-sm font-bold tracking-wide">
									{m.project_partners_title()}
								</CardTitle>
							</CardHeader>
							<CardContent class="flex flex-col gap-2.5">
								{#each data.partners as partner (partner.id)}
									<a
										href={partner.website ?? '#'}
										target={partner.website ? '_blank' : undefined}
										rel="noopener noreferrer"
										class="group flex items-center gap-3 rounded-xl border border-primary/5 bg-primary/5 p-2.5 transition-all duration-300 hover:border-primary/20"
									>
										{#if partner.logo}
											<img
												src="/files/{partner.logo}"
												alt={partner.name}
												class="h-9 w-9 shrink-0 rounded-lg bg-background object-contain p-1"
											/>
										{/if}
										<span class="min-w-0 flex-1">
											<span class="block truncate text-sm font-bold">{partner.name}</span>
											{#if partner.role}
												<span class="block truncate text-[11px] text-muted-foreground">
													{partner.role}
												</span>
											{/if}
										</span>
										{#if partner.website}
											<ExternalLinkIcon
												class="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
											/>
										{/if}
									</a>
								{/each}
							</CardContent>
						</Card>
					{/if}
				</div>
			</aside>
		</div>

		<!-- ---------------------------------------------------- other projects -->
		{#if data.otherProjects.length}
			<section class="mt-16">
				<h2 class="mb-6 text-xl font-bold tracking-tight">{m.project_related_title()}</h2>
				<div class="grid gap-6 sm:grid-cols-3">
					{#each data.otherProjects as other (other.id)}
						{@const percent = Number(other.fundingGoal ?? 0)
							? Math.min(
									100,
									Math.round(
										(Number(other.fundingRaised ?? 0) / Number(other.fundingGoal ?? 1)) * 100
									)
								)
							: null}
						<a href="/projects/{other.slug}" class="group block h-full">
							<Card
								class="flex h-full flex-col overflow-hidden border-primary/10 bg-card/40 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
							>
								<div class="relative aspect-[16/10] overflow-hidden">
									{#if other.featuredImage}
										<img
											src="/files/{other.featuredImage}"
											alt={other.name}
											loading="lazy"
											class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-primary/10">
											<FolderIcon class="h-8 w-8 text-primary/40" />
										</div>
									{/if}
									<span
										class="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm {statusStyles[
											other.status ?? 'planned'
										]}"
									>
										{statusLabel(other.status ?? 'planned')}
									</span>
								</div>
								<CardContent class="flex flex-1 flex-col gap-2 p-5">
									<h3
										class="line-clamp-2 leading-snug font-bold tracking-tight transition-colors group-hover:text-primary"
									>
										{other.name}
									</h3>
									{#if other.shortDescription}
										<p class="line-clamp-2 text-sm text-muted-foreground">
											{other.shortDescription}
										</p>
									{/if}
									{#if percent !== null}
										<div class="mt-auto flex flex-col gap-1.5 pt-2">
											<div class="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
												<div class="h-full rounded-full bg-primary" style="width: {percent}%"></div>
											</div>
											<span class="text-[11px] text-muted-foreground">{percent}%</span>
										</div>
									{/if}
								</CardContent>
							</Card>
						</a>
					{/each}
				</div>

				<div class="mt-8 flex justify-center">
					<Button
						href="/projects"
						variant="outline"
						class="group gap-2 border-primary/20 bg-primary/5"
					>
						{m.project_see_all()}
						<ArrowRightIcon
							class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
						/>
					</Button>
				</div>
			</section>
		{/if}
	</main>
</div>

<style>
	/* Editor-authored HTML from the project's long text fields. */
	.project-content {
		font-size: 1rem;
		line-height: 1.8;
		color: var(--muted-foreground);
	}

	.project-content :global(h3) {
		margin: 1.75rem 0 0.6rem;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--foreground);
	}

	.project-content :global(p) {
		margin-bottom: 1rem;
	}

	.project-content :global(a) {
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.project-content :global(ul),
	.project-content :global(ol) {
		margin: 0 0 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.project-content :global(ul) {
		list-style: disc;
	}

	.project-content :global(ol) {
		list-style: decimal;
	}

	.project-content :global(strong) {
		color: var(--foreground);
		font-weight: 700;
	}

	.project-content :global(img) {
		margin: 1.5rem 0;
		width: 100%;
		border-radius: 1rem;
	}
</style>