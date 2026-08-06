<script lang="ts">
	import { page } from '$app/state';
	import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { resolveHelp } from '$lib/Registry';

	let open = $state(false);
	let language = $state<'en' | 'am'>('en');

	const entry = $derived(resolveHelp(page.url.pathname));

	const displayEntry = $derived.by(() => {
		if (!entry) return null;

		const rawEntry = entry as any;
		if (rawEntry.languages && rawEntry.languages[language]) {
			return rawEntry.languages[language];
		}
		return entry;
	});

	// Close the panel when the route changes, so it never explains the wrong page.
	$effect(() => {
		page.url.pathname;
		open = false;
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return;
		const t = e.target as HTMLElement | null;
		if (t?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t?.tagName ?? '')) return;
		e.preventDefault();
		open = !open;
	}
</script>

<svelte:window onkeydown={handleKeydown} />




{#if entry}
	<Sheet.Root bind:open>
		<Sheet.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					size="icon"
					variant="default"
					aria-label="Help for this page"
					title="Help for this page (?)"
					class="size-11 rounded-full border shadow-lg"
				>
					<CircleQuestionMark class="size-5" />
				</Button>
			{/snippet}
		</Sheet.Trigger>

		<Sheet.Content side="right" class="flex w-full flex-col gap-0 sm:max-w-md">
			<Sheet.Header class="gap-1 flex items-start justify-between">
				<div class="space-y-1">
					<Sheet.Title>{displayEntry?.title}</Sheet.Title>
					{#if displayEntry?.summary}
						<Sheet.Description>{displayEntry.summary}</Sheet.Description>
					{/if}
				</div>
				<div class="flex gap-1">
					<button
						onclick={() => (language = 'en')}
						class="rounded px-2 py-1 text-xs font-medium transition-colors {language === 'en'
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					>
						EN
					</button>
					<button
						onclick={() => (language = 'am')}
						class="rounded px-2 py-1 text-xs font-medium transition-colors {language === 'am'
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					>
						አ
					</button>
				</div>
			</Sheet.Header>

			<div class="flex-1 space-y-6 overflow-y-auto px-4 pb-6">
				{#each displayEntry?.sections ?? [] as section (section.heading)}
					<section class="space-y-1.5">
						<h3 class="text-sm font-medium">{section.heading}</h3>
						<p class="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
							{section.body}
						</p>
					</section>
				{/each}

				{#if displayEntry?.links?.length}
					<Separator />
					<nav class="space-y-2">
						{#each displayEntry.links as link (link.href)}
							<a
								href={link.href}
								class="text-primary flex items-center gap-1.5 text-sm hover:underline"
							>
								{link.label}
								<ExternalLink class="size-3.5" />
							</a>
						{/each}
					</nav>
				{/if}
			</div>

			<Sheet.Footer class="border-t">
				<p class="text-muted-foreground text-xs">
					Press <kbd class="bg-muted rounded border px-1 font-mono">?</kbd> anywhere to open this.
				</p>
			</Sheet.Footer>
		</Sheet.Content>
	</Sheet.Root>
{/if}