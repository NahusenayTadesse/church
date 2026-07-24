<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Save, Trash2, Link as LinkIcon } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { socialPlatforms } from './schema.js';

	type Social = {
		id: number;
		platform: string;
		url: string;
		sortOrder: number | null;
	};

	let { socials = [] }: { socials: Social[] } = $props();

	/* 'x' is a name, not a word — everything else just needs a capital. */
	const label = (v: string) => (v === 'x' ? 'X' : v.charAt(0).toUpperCase() + v.slice(1));

	let adding = $state(false);
	let editingId = $state<number | null>(null);

	const fieldClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
</script>

{#snippet socialFields(row: Social | null)}
	<div class="flex flex-wrap items-end gap-3">
		<div class="flex flex-col gap-1">
			<label for="platform-{row?.id ?? 'new'}" class="text-sm font-medium">Platform</label>
			<select
				id="platform-{row?.id ?? 'new'}"
				name="platform"
				value={row?.platform ?? 'website'}
				class={fieldClass}
			>
				{#each socialPlatforms as p (p)}
					<option value={p}>{label(p)}</option>
				{/each}
			</select>
		</div>

		<div class="flex min-w-64 flex-1 flex-col gap-1">
			<label for="url-{row?.id ?? 'new'}" class="text-sm font-medium">URL</label>
			<input
				id="url-{row?.id ?? 'new'}"
				name="url"
				type="url"
				required
				value={row?.url ?? ''}
				placeholder="https://..."
				class={fieldClass}
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="order-{row?.id ?? 'new'}" class="text-sm font-medium">Sort order</label>
			<input
				id="order-{row?.id ?? 'new'}"
				name="sortOrder"
				type="number"
				min="0"
				value={row?.sortOrder ?? 0}
				class="{fieldClass} w-24"
			/>
		</div>
	</div>
{/snippet}

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-6">
		<div>
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Links</nav>
			<h2 class="text-2xl font-bold tracking-tight">Where to find them</h2>
		</div>

		<Button onclick={() => (adding = !adding)}>
			<Plus class="h-4 w-4" />
			{adding ? 'Cancel' : 'Add link'}
		</Button>
	</div>

	<div class="p-6">
		{#if adding}
			<form
				method="post"
				action="?/addSocial"
				use:enhance={() => async ({ update }) => {
					adding = false;
					await update();
				}}
				class="mb-6 rounded-2xl bg-slate-50 p-4"
			>
				{@render socialFields(null)}
				<Button type="submit" class="mt-4"><Save class="h-4 w-4" /> Save link</Button>
			</form>
		{/if}

		{#if socials.length === 0}
			<p class="text-sm text-slate-500">No links yet.</p>
		{:else}
			<ul class="divide-y divide-slate-100">
				{#each socials as row (row.id)}
					<li class="py-3">
						{#if editingId === row.id}
							<form
								method="post"
								action="?/editSocial"
								use:enhance={() => async ({ update }) => {
									editingId = null;
									await update();
								}}
								class="rounded-2xl bg-slate-50 p-4"
							>
								<input type="hidden" name="id" value={row.id} />
								{@render socialFields(row)}
								<div class="mt-4 flex gap-2">
									<Button type="submit"><Save class="h-4 w-4" /> Save</Button>
									<Button variant="ghost" onclick={() => (editingId = null)}>Cancel</Button>
								</div>
							</form>
						{:else}
							<div class="flex items-center justify-between gap-4">
								<div class="flex min-w-0 items-center gap-3">
									<span
										class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
									>
										<LinkIcon class="h-4 w-4" />
									</span>
									<div class="min-w-0">
										<p class="text-sm font-medium">{label(row.platform)}</p>
										<a
											href={row.url}
											target="_blank"
											rel="noopener"
											class="block truncate text-sm text-slate-500 hover:text-slate-900 hover:underline"
										>
											{row.url}
										</a>
									</div>
								</div>

								<div class="flex shrink-0 items-center gap-2">
									<Button variant="ghost" size="sm" onclick={() => (editingId = row.id)}>
										Edit
									</Button>
									<form method="post" action="?/deleteSocial" use:enhance>
										<input type="hidden" name="id" value={row.id} />
										<Button type="submit" variant="ghost" size="sm" aria-label="Remove link">
											<Trash2 class="h-4 w-4 text-red-600" />
										</Button>
									</form>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
