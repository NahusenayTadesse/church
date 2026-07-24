<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Save, Trash2 } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { formatEthiopianDate } from '$lib/global.svelte.js';

	type Update = {
		id: number;
		title: string;
		content: string | null;
		image: string | null;
		publishedAt: string | Date | null;
		createdByName: string | null;
	};

	let { updates = [] }: { updates: Update[] } = $props();

	const showDate = (v: string | Date | null) => (v ? formatEthiopianDate(new Date(v)) : 'No date');

	/* <input type="date"> needs YYYY-MM-DD regardless of how it's displayed. */
	const dateValue = (v: string | Date | null) =>
		v ? new Date(v).toISOString().slice(0, 10) : '';

	let adding = $state(false);
	let editingId = $state<number | null>(null);

	const fieldClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
</script>

{#snippet updateFields(row: Update | null)}
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="flex flex-col gap-1 sm:col-span-2">
			<label for="title-{row?.id ?? 'new'}" class="text-sm font-medium">Title</label>
			<input
				id="title-{row?.id ?? 'new'}"
				name="title"
				value={row?.title ?? ''}
				required
				maxlength="200"
				placeholder="e.g. First borehole completed"
				class={fieldClass}
			/>
		</div>

		<div class="flex flex-col gap-1 sm:col-span-2">
			<label for="content-{row?.id ?? 'new'}" class="text-sm font-medium">What happened</label>
			<textarea id="content-{row?.id ?? 'new'}" name="content" rows="5" class={fieldClass}
				>{row?.content ?? ''}</textarea
			>
		</div>

		<div class="flex flex-col gap-1">
			<label for="date-{row?.id ?? 'new'}" class="text-sm font-medium">Published on</label>
			<input
				id="date-{row?.id ?? 'new'}"
				name="publishedAt"
				type="date"
				value={dateValue(row?.publishedAt ?? null)}
				class={fieldClass}
			/>
			<span class="text-xs text-slate-500">Leave empty to publish today.</span>
		</div>

		<div class="flex flex-col gap-1">
			<label for="image-{row?.id ?? 'new'}" class="text-sm font-medium">
				{row ? 'Replace photo' : 'Photo'}
			</label>
			<input
				id="image-{row?.id ?? 'new'}"
				name="image"
				type="file"
				accept="image/*"
				class={fieldClass}
			/>
		</div>
	</div>
{/snippet}

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-6">
		<div>
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Updates</nav>
			<h2 class="text-2xl font-bold tracking-tight">Progress and impact stories</h2>
		</div>

		<Button onclick={() => (adding = !adding)}>
			<Plus class="h-4 w-4" />
			{adding ? 'Cancel' : 'Post an update'}
		</Button>
	</div>

	<div class="p-6">
		{#if adding}
			<form
				method="post"
				action="?/addUpdate"
				enctype="multipart/form-data"
				use:enhance={() => async ({ update }) => {
					adding = false;
					await update();
				}}
				class="mb-6 rounded-2xl bg-slate-50 p-4"
			>
				{@render updateFields(null)}
				<Button type="submit" class="mt-4"><Save class="h-4 w-4" /> Post update</Button>
			</form>
		{/if}

		{#if updates.length === 0}
			<p class="text-sm text-slate-500">
				No updates yet. These are what keep supporters coming back to the project page.
			</p>
		{:else}
			<ol class="relative border-l border-slate-200 pl-6">
				{#each updates as row (row.id)}
					<li class="mb-8 last:mb-0">
						<span
							class="absolute -left-[5px] mt-2 h-2.5 w-2.5 rounded-full bg-slate-300"
							aria-hidden="true"
						></span>

						{#if editingId === row.id}
							<form
								method="post"
								action="?/editUpdate"
								enctype="multipart/form-data"
								use:enhance={() => async ({ update }) => {
									editingId = null;
									await update();
								}}
								class="rounded-2xl bg-slate-50 p-4"
							>
								<input type="hidden" name="id" value={row.id} />
								{@render updateFields(row)}
								<div class="mt-4 flex gap-2">
									<Button type="submit"><Save class="h-4 w-4" /> Save</Button>
									<Button variant="ghost" onclick={() => (editingId = null)}>Cancel</Button>
								</div>
							</form>
						{:else}
							<div class="flex flex-wrap items-start justify-between gap-4">
								<div class="min-w-0 flex-1">
									<p class="text-xs tracking-wider text-slate-400 uppercase">
										{showDate(row.publishedAt)}
										{#if row.createdByName}
											· {row.createdByName}
										{/if}
									</p>
									<h3 class="mt-1 text-lg font-semibold tracking-tight">{row.title}</h3>

									{#if row.content}
										<p class="mt-2 text-sm leading-relaxed whitespace-pre-line text-slate-600">
											{row.content}
										</p>
									{/if}

									{#if row.image}
										<img
											src={row.image}
											alt={row.title}
											class="mt-3 max-h-64 rounded-xl object-cover"
											loading="lazy"
										/>
									{/if}
								</div>

								<div class="flex shrink-0 items-center gap-2">
									<Button variant="ghost" size="sm" onclick={() => (editingId = row.id)}>
										Edit
									</Button>
									<form method="post" action="?/deleteUpdate" use:enhance>
										<input type="hidden" name="id" value={row.id} />
										<Button type="submit" variant="ghost" size="sm" aria-label="Delete update">
											<Trash2 class="h-4 w-4 text-red-600" />
										</Button>
									</form>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</section>