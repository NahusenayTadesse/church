<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { ExternalLink } from '@lucide/svelte';

	import { partnerTypeLabel, initials, type Partner } from './partnerTypes';

	let { partner }: { partner: Partner } = $props();

	let broken = $state(false);

	/** A dialog is only worth opening if there's something behind it. */
	const hasDetails = $derived(Boolean(partner.about || partner.description || partner.website));
</script>

{#snippet logo()}
	{#if partner.logo && !broken}
		<img
			src={`/files/${partner.logo}`}
			alt={m.partner_logo_alt({ name: partner.name })}
			loading="lazy"
			decoding="async"
			onerror={() => (broken = true)}
			class="h-14 w-auto max-w-[85%] object-contain opacity-90 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 motion-reduce:transition-none"
		/>
	{:else}
		<span class="text-2xl font-semibold tracking-tight text-muted-foreground">
			{initials(partner.name)}
		</span>
	{/if}
{/snippet}

{#if hasDetails}
	<Dialog.Root>
		<Dialog.Trigger
			class="group flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-4 transition hover:border-foreground/20 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
		>
			{@render logo()}
			<span class="line-clamp-1 text-xs font-medium text-muted-foreground">{partner.name}</span>
		</Dialog.Trigger>

		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<div class="flex items-start gap-4">
					{#if partner.logo && !broken}
						<img
							src={`/files/${partner.logo}`}
							alt={m.partner_logo_alt({ name: partner.name })}
							class="h-12 w-12 shrink-0 rounded-md border border-border bg-background object-contain p-1"
						/>
					{/if}
					<div class="space-y-1 text-left">
						<Dialog.Title class="text-lg">{partner.name}</Dialog.Title>
						<Badge variant="secondary">{partnerTypeLabel(partner.partnershipType)}</Badge>
					</div>
				</div>
			</Dialog.Header>

			{#if partner.description}
				<Dialog.Description class="text-left text-sm">{partner.description}</Dialog.Description>
			{/if}

			{#if partner.about}
				<div class="space-y-2">
					<h3 class="text-sm font-medium text-foreground">{m.partner_about_heading()}</h3>
					<p class="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
						{partner.about}
					</p>
				</div>
			{/if}

			{#if partner.website}
				<Dialog.Footer class="sm:justify-start">
					<a
						href={partner.website}
						target="_blank"
						rel="noopener noreferrer external"
						class={buttonVariants({ variant: 'outline', size: 'sm' })}
					>
						{m.partner_visit_website()}
						<ExternalLink class="size-4" />
					</a>
				</Dialog.Footer>
			{/if}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<!-- Nothing to show in a dialog: link straight out, or render a plain tile. -->
	<div
		class="group flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-4"
	>
		{@render logo()}
		<span class="line-clamp-1 text-xs font-medium text-muted-foreground">{partner.name}</span>
	</div>
{/if}