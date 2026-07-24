<script lang="ts">
	import { formatEthiopianDate } from '$lib/global.svelte.js';

	type Resource = { id: number; title: string; status: string | null; kind: string | null };
	type EventRow = {
		id: number;
		name: string;
		startsAt: string | Date | null;
		status: string | null;
		role?: string | null;
	};
	type Project = { id: number; name: string; status: string | null };
	type Book = { id: number; title: string; status: string | null };

	let {
		involvement
	}: {
		involvement: {
			authored: Resource[];
			spoken: Resource[];
			organized: EventRow[];
			speakingAt: EventRow[];
			led: Project[];
			wrote: Book[];
			prayerCount: number;
		};
	} = $props();

	const label = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

	const showDate = (v: string | Date | null) => (v ? formatEthiopianDate(new Date(v)) : '');

	/* Only render the groups that have something in them. */
	let groups = $derived(
		[
			{
				heading: 'Resources authored',
				href: '/dashboard/blog',
				rows: involvement.authored.map((r) => ({
					id: r.id,
					label: r.title,
					meta: [r.kind && label(r.kind), r.status && label(r.status)].filter(Boolean).join(' · ')
				}))
			},
			{
				heading: 'Resources as speaker',
				href: '/dashboard/blog',
				rows: involvement.spoken.map((r) => ({
					id: r.id,
					label: r.title,
					meta: [r.kind && label(r.kind), r.status && label(r.status)].filter(Boolean).join(' · ')
				}))
			},
			{
				heading: 'Events organized',
				href: '/dashboard/events',
				rows: involvement.organized.map((e) => ({
					id: e.id,
					label: e.name,
					meta: [showDate(e.startsAt), e.status && label(e.status)].filter(Boolean).join(' · ')
				}))
			},
			{
				heading: 'Speaking at',
				href: '/dashboard/events',
				rows: involvement.speakingAt.map((e) => ({
					id: e.id,
					label: e.name,
					meta: [showDate(e.startsAt), e.role && label(e.role)].filter(Boolean).join(' · ')
				}))
			},
			{
				heading: 'Projects led',
				href: '/dashboard/projects',
				rows: involvement.led.map((p) => ({
					id: p.id,
					label: p.name,
					meta: p.status ? label(p.status) : ''
				}))
			},
			{
				heading: 'Books',
				href: '/dashboard/books',
				rows: involvement.wrote.map((b) => ({
					id: b.id,
					label: b.title,
					meta: b.status ? label(b.status) : ''
				}))
			}
		].filter((g) => g.rows.length > 0)
	);
</script>

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="border-b border-gray-100 p-6">
		<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Involvement</nav>
		<h2 class="text-2xl font-bold tracking-tight">What's attached to this person</h2>
		<p class="mt-1 text-sm text-slate-500">
			Read-only. Reassign anything here from the record's own page.
		</p>
	</div>

	<div class="p-6">
		{#if groups.length === 0 && involvement.prayerCount === 0}
			<p class="text-sm text-slate-500">
				Nothing points at this person yet, so the profile can be deleted safely.
			</p>
		{:else}
			<div class="grid gap-8 sm:grid-cols-2">
				{#each groups as group (group.heading)}
					<div>
						<p class="text-xs font-medium tracking-wider text-slate-400 uppercase">
							{group.heading} ({group.rows.length})
						</p>
						<ul class="mt-2 divide-y divide-slate-100">
							{#each group.rows as row (row.id)}
								<li class="py-2">
									<a
										href="{group.href}/{row.id}"
										class="text-sm font-medium hover:underline"
									>
										{row.label}
									</a>
									{#if row.meta}
										<p class="text-xs text-slate-400">{row.meta}</p>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>

			{#if involvement.prayerCount > 0}
				<p class="mt-8 text-sm text-slate-500">
					Also assigned {involvement.prayerCount} prayer request(s).
				</p>
			{/if}
		{/if}
	</div>
</section>
