<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Handshake } from '@lucide/svelte';

	import PartnerCard from './PartnerCard.svelte';
	import { partnerTypes, partnerTypeLabel, type Partner, type PartnerType } from './partnerTypes';

	let {
		partners = [],
		showHeader = true,
		showFilters = true,
		showCta = true,
		contactHref = '/contact',
		limit
	}: {
		partners?: Partner[];
		showHeader?: boolean;
		showFilters?: boolean;
		showCta?: boolean;
		contactHref?: string;
		limit?: number;
	} = $props();

	let active = $state<PartnerType | 'all'>('all');

	/** Only offer a filter for types that actually appear in the data. */
	const availableTypes = $derived(
		partnerTypes.filter((type) => partners.some((p) => p.partnershipType === type))
	);

	const visible = $derived(
		partners
			.filter((p) => active === 'all' || p.partnershipType === active)
			.toSorted(
				(a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
			)
			.slice(0, limit ?? partners.length)
	);
</script>

<section class="w-full bg-background py-16 md:py-24">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		{#if showHeader}
			<header class="mx-auto max-w-2xl space-y-3 text-center">
				<p class="text-sm font-medium tracking-wide text-primary uppercase">
					{m.partners_eyebrow()}
				</p>
				<h2 class="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
					{m.partners_title()}
				</h2>
				<p class="text-base leading-relaxed text-muted-foreground">
					{m.partners_subtitle()}
				</p>
			</header>
		{/if}

		{#if showFilters && availableTypes.length > 1}
			<div class="mt-8 flex flex-wrap items-center justify-center gap-2">
				<Button
					variant={active === 'all' ? 'default' : 'outline'}
					size="sm"
					onclick={() => (active = 'all')}
				>
					{m.partners_filter_all()}
				</Button>

				{#each availableTypes as type (type)}
					<Button
						variant={active === type ? 'default' : 'outline'}
						size="sm"
						onclick={() => (active = type)}
					>
						{partnerTypeLabel(type)}
					</Button>
				{/each}
			</div>
		{/if}

		{#if visible.length}
			<ul
				class="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
				aria-label={m.partners_title()}
			>
				{#each visible as partner (partner.id)}
					<li>
						<PartnerCard {partner} />
					</li>
				{/each}
			</ul>
		{:else}
			<div
				class="mt-10 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center"
			>
				<Handshake class="size-8 text-muted-foreground" />
				<p class="font-medium text-foreground">{m.partners_empty_title()}</p>
				<p class="max-w-sm text-sm text-muted-foreground">{m.partners_empty_body()}</p>
			</div>
		{/if}

		{#if showCta}
			<div
				class="mt-12 flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/40 px-6 py-10 text-center"
			>
				<div class="space-y-2">
					<h3 class="text-xl font-semibold tracking-tight text-foreground">
						{m.partners_cta_title()}
					</h3>
					<p class="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
						{m.partners_cta_body()}
					</p>
				</div>
				<a href={contactHref} class={buttonVariants({ size: 'lg' })}>
					{m.partners_cta_button()}
				</a>
			</div>
		{/if}
	</div>
</section>