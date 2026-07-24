<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Save, Trash2, Download } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { formatTypes } from './schema.js';

	type Format = {
		id: number;
		format: string;
		fileUrl: string | null;
		price: string | null;
		isFreeDownload: boolean | null;
		downloadCount: number | null;
	};

	let {
		formats = [],
		usedFormats = [],
		currency = 'ETB'
	}: {
		formats: Format[];
		usedFormats: string[];
		currency?: string | null;
	} = $props();

	const label = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

	/* Each format may only exist once per book — the server checks too. */
	let available = $derived(formatTypes.filter((f) => !usedFormats.includes(f)));

	let adding = $state(false);
	let editingId = $state<number | null>(null);

	const inputClass = 'rounded-md border border-slate-300 px-3 py-2 text-sm';
</script>

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-6">
		<div>
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Formats</nav>
			<h2 class="text-2xl font-bold tracking-tight">How this book is available</h2>
		</div>

		{#if available.length > 0}
			<Button onclick={() => (adding = !adding)}>
				<Plus class="h-4 w-4" />
				{adding ? 'Cancel' : 'Add format'}
			</Button>
		{/if}
	</div>

	<div class="p-6">
		{#if adding}
			<form
				method="post"
				action="?/addFormat"
				enctype="multipart/form-data"
				use:enhance={() => {
					return async ({ update }) => {
						adding = false;
						await update();
					};
				}}
				class="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-slate-50 p-4"
			>
				<div class="flex flex-col gap-1">
					<label for="new-format" class="text-sm font-medium">Format</label>
					<select id="new-format" name="format" required class={inputClass}>
						{#each available as f (f)}
							<option value={f}>{label(f)}</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-col gap-1">
					<label for="new-price" class="text-sm font-medium">Price ({currency})</label>
					<input id="new-price" name="price" type="number" step="0.01" min="0" class={inputClass} />
				</div>

				<div class="flex flex-col gap-1">
					<label for="new-file" class="text-sm font-medium">File</label>
					<input id="new-file" name="file" type="file" class={inputClass} />
				</div>

				<label class="flex items-center gap-2 py-2 text-sm font-medium">
					<input
						type="checkbox"
						name="isFreeDownload"
						value="true"
						class="h-4 w-4 rounded border-slate-300"
					/>
					Free download
				</label>

				<Button type="submit"><Save class="h-4 w-4" /> Save format</Button>
			</form>
		{/if}

		{#if formats.length === 0}
			<p class="text-sm text-slate-500">
				No formats yet. Add at least one so readers know how to get the book.
			</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-slate-200 text-xs tracking-wider text-slate-400 uppercase">
						<tr>
							<th class="py-3 pr-4">Format</th>
							<th class="py-3 pr-4">Price</th>
							<th class="py-3 pr-4">File</th>
							<th class="py-3 pr-4">Downloads</th>
							<th class="py-3"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each formats as row (row.id)}
							{#if editingId === row.id}
								<tr>
									<td colspan="5" class="py-4">
										<form
											method="post"
											action="?/editFormat"
											enctype="multipart/form-data"
											use:enhance={() => {
												return async ({ update }) => {
													editingId = null;
													await update();
												};
											}}
											class="flex flex-wrap items-end gap-3 rounded-2xl bg-slate-50 p-4"
										>
											<input type="hidden" name="id" value={row.id} />

											<div class="flex flex-col gap-1">
												<label for="format-{row.id}" class="text-sm font-medium">Format</label>
												<select
													id="format-{row.id}"
													name="format"
													value={row.format}
													class={inputClass}
												>
													{#each formatTypes as f (f)}
														<option value={f} disabled={f !== row.format && usedFormats.includes(f)}>
															{label(f)}
														</option>
													{/each}
												</select>
											</div>

											<div class="flex flex-col gap-1">
												<label for="price-{row.id}" class="text-sm font-medium">
													Price ({currency})
												</label>
												<input
													id="price-{row.id}"
													name="price"
													type="number"
													step="0.01"
													min="0"
													value={row.price ?? ''}
													class={inputClass}
												/>
											</div>

											<div class="flex flex-col gap-1">
												<label for="file-{row.id}" class="text-sm font-medium">
													Replace file
												</label>
												<input id="file-{row.id}" name="file" type="file" class={inputClass} />
											</div>

											<label class="flex items-center gap-2 py-2 text-sm font-medium">
												<input
													type="checkbox"
													name="isFreeDownload"
													value="true"
													checked={row.isFreeDownload ?? false}
													class="h-4 w-4 rounded border-slate-300"
												/>
												Free download
											</label>

											<Button type="submit"><Save class="h-4 w-4" /> Save</Button>
											<Button variant="ghost" onclick={() => (editingId = null)}>Cancel</Button>
										</form>
									</td>
								</tr>
							{:else}
								<tr>
									<td class="py-3 pr-4 font-medium">{label(row.format)}</td>
									<td class="py-3 pr-4">
										{#if row.isFreeDownload}
											<span class="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
												Free
											</span>
										{:else}
											{row.price ? `${row.price} ${currency}` : '—'}
										{/if}
									</td>
									<td class="py-3 pr-4">
										{#if row.fileUrl}
											<a
												href="/files/{row.fileUrl}"
												download
												target="_blank"
												class="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
											>
												<Download class="h-4 w-4" /> File
											</a>
										{:else}
											—
										{/if}
									</td>
									<td class="py-3 pr-4">{row.downloadCount ?? 0}</td>
									<td class="py-3">
										<div class="flex items-center justify-end gap-2">
											<Button variant="ghost" size="sm" onclick={() => (editingId = row.id)}>
												Edit
											</Button>
											<form method="post" action="?/deleteFormat" use:enhance>
												<input type="hidden" name="id" value={row.id} />
												<Button type="submit" variant="ghost" size="sm" aria-label="Remove format">
													<Trash2 class="h-4 w-4 text-red-600" />
												</Button>
											</form>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</section>