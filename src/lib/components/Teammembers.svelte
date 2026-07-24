<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { MailIcon, PhoneIcon, XIcon, ArrowRightIcon, UserIcon } from '@lucide/svelte';
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
	/**
 * Shared shapes for team members. Lives outside `$lib/server` so components can
 * import the types without SvelteKit complaining about a server-only import.
 */

 type SocialPlatform =
	| 'facebook'
	| 'x'
	| 'instagram'
	| 'linkedin'
	| 'youtube'
	| 'telegram'
	| 'tiktok'
	| 'website';

 interface TeamMemberSocial {
	id: number;
	platform: SocialPlatform;
	url: string;
}

 interface TeamMemberArea {
	id: number;
	name: string;
}

interface TeamMember {
	id: number;
	name: string;
	photo: string | null;
	position: string | null;
	biography: string | null;
	email: string | null;
	phone: string | null;
	isExecutive: boolean | null;
	isSpeaker: boolean | null;
	sortOrder: number | null;
	areas: TeamMemberArea[];
	socials: TeamMemberSocial[];
}

	interface Props {
		members: TeamMember[];
		/** Small uppercase label above the heading. Pass null to hide the whole header. */
		eyebrow?: string | null;
		title?: string | null;
		description?: string | null;
		/** 'full' shows bios and socials; 'compact' is a slim strip for the home page. */
		variant?: 'full' | 'compact';
		columns?: 2 | 3 | 4;
		/** Link shown under the strip, e.g. through to the About page. */
		ctaHref?: string | null;
		ctaLabel?: string | null;
	}

	let {
		members,
		eyebrow = null,
		title = null,
		description = null,
		variant = 'full',
		columns = 3,
		ctaHref = null,
		ctaLabel = null
	}: Props = $props();

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

	/* Full class strings — Tailwind cannot see interpolated ones. */
	const columnClasses: Record<number, string> = {
		2: 'sm:grid-cols-2',
		3: 'sm:grid-cols-2 lg:grid-cols-3',
		4: 'sm:grid-cols-2 lg:grid-cols-4'
	};

	let active = $state<TeamMember | null>(null);

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
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet socialRow(member: TeamMember, size = 'h-8 w-8')}
	{#if member.socials.length}
		<div class="flex flex-wrap gap-1.5">
			{#each member.socials as social (social.id)}
				{@const Icon = socialIcons[social.platform] ?? IconWorld}
				<a
					href={social.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="{member.name} — {social.platform}"
					class="flex {size} items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
				>
					<Icon class="h-4 w-4" />
				</a>
			{/each}
		</div>
	{/if}
{/snippet}

{#if members.length}
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

		{#if variant === 'compact'}
			<!-- ------------------------------------------------------ compact -->
			<div class="flex flex-wrap justify-center gap-8">
				{#each members as member, i (member.id)}
					<button
						type="button"
						onclick={() => (active = member)}
						transition:fly={{ y: 20, duration: 500, delay: 60 + i * 50 }}
						class="group flex w-36 flex-col items-center gap-3 text-center"
					>
						{#if member.photo}
							<img
								src="/files/{member.photo}"
								alt={member.name}
								loading="lazy"
								class="h-28 w-28 rounded-full border-2 border-primary/15 object-cover shadow-lg transition-all duration-500 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl"
							/>
						{:else}
							<span
								class="flex h-28 w-28 items-center justify-center rounded-full border-2 border-primary/15 bg-primary/10 text-2xl font-extrabold text-primary shadow-lg transition-transform duration-500 group-hover:-translate-y-1"
							>
								{member.name.charAt(0)}
							</span>
						{/if}
						<span>
							<span
								class="block text-sm font-bold tracking-tight transition-colors group-hover:text-primary"
							>
								{member.name}
							</span>
							{#if member.position}
								<span class="block text-xs leading-snug text-muted-foreground">
									{member.position}
								</span>
							{/if}
						</span>
					</button>
				{/each}
			</div>
		{:else}
			<!-- --------------------------------------------------------- full -->
			<div class="grid gap-6 {columnClasses[columns]}">
				{#each members as member, i (member.id)}
					<div transition:fly={{ y: 20, duration: 500, delay: 60 + i * 40 }}>
						<Card
							class="flex h-full flex-col overflow-hidden border-primary/10 bg-card/40 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
						>
							<div class="relative aspect-[4/5] overflow-hidden bg-primary/5">
								{#if member.photo}
									<img
										src="/files/{member.photo}"
										alt={member.name}
										loading="lazy"
										class="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center">
										<UserIcon class="h-14 w-14 text-primary/30" />
									</div>
								{/if}

								{#if member.isExecutive}
									<span
										class="absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-bold tracking-widest text-primary uppercase backdrop-blur-sm"
									>
										{m.team_executive_badge()}
									</span>
								{/if}
							</div>

							<CardContent class="flex flex-1 flex-col gap-3 p-5">
								<div>
									<h3 class="text-lg font-bold tracking-tight">{member.name}</h3>
									{#if member.position}
										<p class="text-sm font-semibold text-primary">{member.position}</p>
									{/if}
								</div>

								{#if member.areas.length}
									<div class="flex flex-wrap gap-1.5">
										{#each member.areas as area (area.id)}
											<span
												class="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
											>
												{area.name}
											</span>
										{/each}
									</div>
								{/if}

								{#if member.biography}
									<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
										{@html member.biography}
									</p>
									<button
										type="button"
										onclick={() => (active = member)}
										class="w-fit text-xs font-bold text-primary transition-transform duration-300 hover:translate-x-0.5"
									>
										{m.team_read_bio()} →
									</button>
								{/if}

								<div class="mt-auto flex items-center justify-between gap-3 pt-2">
									{@render socialRow(member)}

									{#if member.email}
										<a
											href="mailto:{member.email}"
											aria-label="{m.team_email_label()} {member.name}"
											class="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
										>
											<MailIcon class="h-4 w-4" />
										</a>
									{/if}
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

<!-- ---------------------------------------------------------------- bio -->
{#if active}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
		role="dialog"
		aria-modal="true"
		aria-label={active.name}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="absolute inset-0" onclick={() => (active = null)}></div>

		<div
			transition:fly={{ y: 20, duration: 300 }}
			class="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-primary/15 bg-card shadow-2xl"
		>
			<button
				type="button"
				onclick={() => (active = null)}
				aria-label={m.team_close()}
				class="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-background/80 text-primary backdrop-blur-sm transition-colors hover:bg-primary/10"
			>
				<XIcon class="h-4 w-4" />
			</button>

			<div class="flex flex-col gap-5 p-6 sm:flex-row sm:gap-6 sm:p-8">
				{#if active.photo}
					<img
						src="/files/{active.photo}"
						alt={active.name}
						class="h-40 w-40 shrink-0 self-start rounded-2xl border border-primary/15 object-cover shadow-lg"
					/>
				{/if}

				<div class="flex flex-col gap-3">
					<div>
						<h3 class="text-2xl font-extrabold tracking-tight">{active.name}</h3>
						{#if active.position}
							<p class="font-semibold text-primary">{active.position}</p>
						{/if}
					</div>

					{#if active.areas.length}
						<div class="flex flex-wrap gap-1.5">
							{#each active.areas as area (area.id)}
								<span
									class="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
								>
									{area.name}
								</span>
							{/each}
						</div>
					{/if}

					{#if active.biography}
						<p class="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
							{@html  active.biography}
						</p>
					{/if}

					<div class="flex flex-wrap items-center gap-3 pt-1">
						{@render socialRow(active, 'h-9 w-9')}

						{#if active.email}
							<a
								href="mailto:{active.email}"
								class="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
							>
								<MailIcon class="h-4 w-4" />
								{active.email}
							</a>
						{/if}
						{#if active.phone}
							<a
								href="tel:{active.phone}"
								class="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
							>
								<PhoneIcon class="h-4 w-4" />
								{active.phone}
							</a>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}