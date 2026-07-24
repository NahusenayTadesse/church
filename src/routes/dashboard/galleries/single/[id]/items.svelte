<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		ImagePlus,
		Video,
		ChevronLeft,
		ChevronRight,
		Star,
		Trash2,
		Save,
		Play
	} from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button/index.js';

	type Item = {
		id: number;
		mediaType: string | null;
		url: string;
		thumbnailUrl: string | null;
		caption: string | null;
		sortOrder: number | null;
	};

	let {
		items = [],
		coverImage = null
	}: {
		items: Item[];
		coverImage?: string | null;
	} = $props();

	/* Videos are linked, so the poster frame is the only thing we can render. */
	const previewOf = (item: Item) =>
		item.mediaType === 'video' ? item.thumbnailUrl : item.url;

	const isCover = (item: Item) => {
		const preview = previewOf(item);
		return !!preview && !!coverImage && preview === coverImage;
	};

	let panel = $state<'none' | 'images' | 'video'>('none');
	let editingId = $state<number | null>(null);

	const fieldClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
	const iconBtn =
		'rounded-md bg-white/90 p-1.5 text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-40';
</script>

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-6">
		<div>
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Items</nav>
			<h2 class="text-2xl font-bold tracking-tight">
				{items.length} item{items.length === 1 ? '' : 's'}, in display order
			</h2>
		</div>

		<div class="flex flex-wrap gap-2">
			<Button onclick={() => (panel = panel === 'images' ? 'none' : 'images')}>
				<ImagePlus class="h-4 w-4" />
				{panel === 'images' ? 'Cancel' : 'Upload photos'}
			</Button>
			<Button
				variant="outline"
				onclick={() => (panel = panel === 'video' ? 'none' : 'video')}
			>
				<Video class="h-4 w-4" />
				{panel === 'video' ? 'Cancel' : 'Link a video'}
			</Button>
		</div>
	</div>

	<div class="p-6">
		{#if panel === 'images'}
			<form
				method="post"
				action="?/addImages"
				enctype="multipart/form-data"
				use:enhance={() => async ({ update }) => {
					panel = 'none';
					await update();
				}}
				class="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-slate-50 p-4"
			>
				<div class="flex min-w-64 flex-1 flex-col gap-1">
					<label for="gallery-images" class="text-sm font-medium">Photos</label>
					<input
						id="gallery-images"
						name="images"
						type="file"
						accept="image/*"
						multiple
						required
						class={fieldClass}
					/>
					<span class="text-xs text-slate-500">
						Pick several at once — they're added in the order you select them.
					</span>
				</div>

				<Button type="submit"><Save class="h-4 w-4" /> Upload</Button>
			</form>
		{/if}

		{#if panel === 'video'}
			<form
				method="post"
				action="?/addVideo"
				enctype="multipart/form-data"
				use:enhance={() => async ({ update }) => {
					panel = 'none';
					await update();
				}}
				class="mb-6 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2"
			>
				<div class="flex flex-col gap-1 sm:col-span-2">
					<label for="video-url" class="text-sm font-medium">Video URL</label>
					<input
						id="video-url"
						name="url"
						type="url"
						required
						placeholder="https://youtube.com/watch?v=..."
						class={fieldClass}
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="video-caption" class="text-sm font-medium">Caption</label>
					<input id="video-caption" name="caption" maxlength="255" class={fieldClass} />
				</div>

				<div class="flex flex-col gap-1">
					<label for="video-thumb" class="text-sm font-medium">Poster frame</label>
					<input
						id="video-thumb"
						name="thumbnail"
						type="file"
						accept="image/*"
						class={fieldClass}
					/>
				</div>

				<div class="sm:col-span-2">
					<Button type="submit"><Save class="h-4 w-4" /> Add video</Button>
				</div>
			</form>
		{/if}

		{#if items.length === 0}
			<p class="text-sm text-slate-500">
				Nothing here yet. Upload photos or link a video to start the gallery.
			</p>
		{:else}
			<ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{#each items as item, i (item.id)}
					<li class="group overflow-hidden rounded-2xl border border-slate-200">
						<div class="relative aspect-square bg-slate-100">
							{#if previewOf(item)}
								<img
									src="/files/{previewOf(item)}"
									alt={item.caption ?? `Item ${i + 1}`}
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							{:else}
								<div class="flex h-full items-center justify-center text-slate-400">
									<Video class="h-8 w-8" />
								</div>
							{/if}

							{#if item.mediaType === 'video'}
								<span
									class="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white"
								>
									<Play class="h-3 w-3" /> Video
								</span>
							{/if}

							{#if isCover(item)}
								<span
									class="absolute top-2 right-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950"
								>
									Cover
								</span>
							{/if}

							<!-- Reorder / cover / delete -->
							<div
								class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100"
							>
								<div class="flex gap-1">
									<form method="post" action="?/moveItem" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<input type="hidden" name="direction" value="up" />
										<button
											type="submit"
											class={iconBtn}
											disabled={i === 0}
											aria-label="Move earlier"
										>
											<ChevronLeft class="h-4 w-4" />
										</button>
									</form>

									<form method="post" action="?/moveItem" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<input type="hidden" name="direction" value="down" />
										<button
											type="submit"
											class={iconBtn}
											disabled={i === items.length - 1}
											aria-label="Move later"
										>
											<ChevronRight class="h-4 w-4" />
										</button>
									</form>
								</div>

								<div class="flex gap-1">
									<form method="post" action="?/setCover" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<button type="submit" class={iconBtn} aria-label="Use as cover">
											<Star class="h-4 w-4 {isCover(item) ? 'fill-amber-400 text-amber-500' : ''}" />
										</button>
									</form>

									<form method="post" action="?/deleteItem" use:enhance>
										<input type="hidden" name="id" value={item.id} />
										<button type="submit" class={iconBtn} aria-label="Remove item">
											<Trash2 class="h-4 w-4 text-red-600" />
										</button>
									</form>
								</div>
							</div>
						</div>

						<div class="p-3">
							{#if editingId === item.id}
								<form
									method="post"
									action="?/editItem"
									enctype="multipart/form-data"
									use:enhance={() => async ({ update }) => {
										editingId = null;
										await update();
									}}
									class="flex flex-col gap-2"
								>
									<input type="hidden" name="id" value={item.id} />

									<label class="sr-only" for="caption-{item.id}">Caption</label>
									<input
										id="caption-{item.id}"
										name="caption"
										value={item.caption ?? ''}
										maxlength="255"
										placeholder="Caption"
										class={fieldClass}
									/>

									{#if item.mediaType === 'video'}
										<label class="sr-only" for="url-{item.id}">Video URL</label>
										<input
											id="url-{item.id}"
											name="url"
											type="url"
											value={item.url}
											class={fieldClass}
										/>
									{/if}

									<label class="text-xs font-medium text-slate-500" for="file-{item.id}">
										{item.mediaType === 'video' ? 'Replace poster frame' : 'Replace image'}
									</label>
									<input
										id="file-{item.id}"
										name="file"
										type="file"
										accept="image/*"
										class={fieldClass}
									/>

									<div class="flex gap-2">
										<Button type="submit" size="sm"><Save class="h-4 w-4" /> Save</Button>
										<Button variant="ghost" size="sm" onclick={() => (editingId = null)}>
											Cancel
										</Button>
									</div>
								</form>
							{:else}
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="text-xs text-slate-400">#{i + 1}</p>
										<p class="truncate text-sm text-slate-600">
											{item.caption ?? 'No caption'}
										</p>
									</div>
									<Button variant="ghost" size="sm" onclick={() => (editingId = item.id)}>
										Edit
									</Button>
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>