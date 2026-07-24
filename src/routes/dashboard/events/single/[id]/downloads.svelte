<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Save, Trash2, Download } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { downloadTypes } from './schema.js';

	type EventDownload = {
		id: number;
		title: string;
		fileUrl: string;
		fileType: string | null;
		fileSize: number | null;
		downloadCount: number | null;
		sortOrder: number | null;
	};

	let { downloads = [] }: { downloads: EventDownload[] } = $props();

	const label = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

	/* fileSize is stored in bytes. */
	const showSize = (bytes: number | null) => {
		if (!bytes) return '—';
		const units = ['B', 'KB', 'MB', 'GB'];
		let n = bytes;
		let i = 0;
		while (n >= 1024 && i < units.length - 1) {
			n /= 1024;
			i++;
		}
		return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
	};

	let adding = $state(false);

	const fieldClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
</script>

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-6">
		<div>
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Downloads</nav>
			<h2 class="text-2xl font-bold tracking-tight">Schedules, brochures and handouts</h2>
		</div>

		<Button onclick={() => (adding = !adding)}>
			<Plus class="h-4 w-4" />
			{adding ? 'Cancel' : 'Add file'}
		</Button>
	</div>

	<div class="p-6">
		{#if adding}
			<form
				method="post"
				action="?/addDownload"
				enctype="multipart/form-data"
				use:enhance={() => async ({ update }) => {
					adding = false;
					await update();
				}}
				class="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-slate-50 p-4"
			>
				<div class="flex min-w-56 flex-1 flex-col gap-1">
					<label for="download-title" class="text-sm font-medium">Title</label>
					<input
						id="download-title"
						name="title"
						required
						placeholder="e.g. Conference schedule"
						class={fieldClass}
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="download-type" class="text-sm font-medium">Type</label>
					<select id="download-type" name="fileType" class={fieldClass}>
						{#each downloadTypes as t (t)}
							<option value={t}>{label(t)}</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-col gap-1">
					<label for="download-file" class="text-sm font-medium">File</label>
					<input id="download-file" name="file" type="file" required class={fieldClass} />
				</div>

				<div class="flex flex-col gap-1">
					<label for="download-order" class="text-sm font-medium">Sort order</label>
					<input
						id="download-order"
						name="sortOrder"
						type="number"
						min="0"
						value="0"
						class={fieldClass}
					/>
				</div>

				<Button type="submit"><Save class="h-4 w-4" /> Save file</Button>
			</form>
		{/if}

		{#if downloads.length === 0}
			<p class="text-sm text-slate-500">Nothing to download yet.</p>
		{:else}
			<ul class="divide-y divide-slate-100">
				{#each downloads as row (row.id)}
					<li class="flex items-center justify-between gap-4 py-3">
						<div class="min-w-0">
							<p class="font-medium">{row.title}</p>
							<p class="text-xs tracking-wider text-slate-400 uppercase">
								{label(row.fileType ?? 'other')} · {showSize(row.fileSize)} ·
								{row.downloadCount ?? 0} downloads
							</p>
						</div>

						<div class="flex shrink-0 items-center gap-2">
							<a
								href="/files/{row.fileUrl}"
                                download
                                target="_blank"
								class="text-slate-500 hover:text-slate-900"
								aria-label="Download {row.title}"
							>
								<Download class="h-4 w-4" />
							</a>
							<form method="post" action="?/deleteDownload" use:enhance>
								<input type="hidden" name="id" value={row.id} />
								<Button type="submit" variant="ghost" size="sm" aria-label="Remove file">
									<Trash2 class="h-4 w-4 text-red-600" />
								</Button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>