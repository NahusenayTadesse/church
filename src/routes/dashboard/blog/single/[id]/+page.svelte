<script lang="ts">
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import type { Snapshot } from '@sveltejs/kit';
	import { ArrowLeft, Pencil, Save } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { edit, resourceTypes, blogStatuses } from './schema.js';
	import EditGallery from './editGallery.svelte';

	import SingleTable from '$lib/components/SingleTable.svelte';
	import SingleView from '$lib/components/SingleView.svelte';
	import Gallery from '$lib/components/gallery.svelte';
	import Delete from '$lib/forms/Delete.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import RichTextEditor from '$lib/formComponents/RichTextEditor.svelte';
	import { formatEthiopianDate } from '$lib/global.svelte.js';

	let { data } = $props();

	const label = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

	const typeItems = resourceTypes.map((value) => ({ value, name: label(value) }));
	const statusItems = blogStatuses.map((value) => ({ value, name: label(value) }));

	const showDate = (v: string | Date | null | undefined) =>
		v ? formatEthiopianDate(new Date(v)) : '—';

	let singleTable = $derived([
		{ name: 'Title', value: data.product?.title },
		{ name: 'Slug', value: data.product?.slug },
		{ name: 'Category', value: data.product?.categoryName ?? '—' },
		{ name: 'Ministry Area', value: data.product?.ministryAreaName ?? '—' },
		{ name: 'Type', value: label(data.product?.resourceType ?? 'article') },
		{ name: 'Author', value: data.product?.authorName ?? '—' },
		{ name: 'Speaker', value: data.product?.speakerName ?? '—' },
		{ name: 'Bible References', value: data.product?.bibleReferences ?? '—' },
		{ name: 'Excerpt | Short Description', value: data.product?.excerpt },
		{ name: 'Status', value: label(data.product?.status ?? 'draft') },
		{ name: 'Published On', value: showDate(data.product?.publishedAt) },
		{ name: 'Featured On Home', value: data.product?.isFeaturedOnHome ? 'Yes' : 'No' },
		{ name: 'Comments', value: data.product?.allowComments ? 'Open' : 'Closed' },
		{ name: 'Views', value: data.product?.viewCount ?? 0 },
		{ name: 'Video Link', value: data.product?.videoLink ?? '—' },
		{ name: 'Audio', value: data.product?.audioUrl ?? '—' },
		{ name: 'Download', value: data.product?.downloadUrl ?? '—' },
		{ name: 'Added On', value: showDate(data.product?.createdAt) },
		{ name: 'Added By', value: data.product?.createdByName ?? '—' },
		{ name: 'Last Updated By', value: data.product?.updatedByName ?? '—' }
	]);

	const { form, errors, enhance, delayed, capture, restore, allErrors, message } = superForm(
		data.form,
		{
			validators: zod4Client(edit),
			resetForm: false,
			dataType: 'json'
		}
	);

	export const snapshot: Snapshot = { capture, restore };

	let editForm = $state(false);
	let editGallery = $state(false);

	$effect(() => {
		if ($message) {
			if ($message.type === 'error') {
				toast.error($message.text);
			} else {
				toast.success($message.text);
			}
		}
	});

	let images = $derived(data?.images);
</script>

<svelte:head>
	<title>{data?.product?.title ?? 'Blog'} — Blog Details</title>
</svelte:head>

<SingleView
	title={data?.product?.title}
	photo={String(data?.product?.featuredImage)}
	class="w-full!"
>
	<div class="mt-4 flex w-full flex-row flex-wrap items-start justify-start gap-2 pl-4">
		<Button onclick={() => (editForm = !editForm)}>
			{#if !editForm}
				<Pencil class="h-4 w-4" />
				Edit
			{:else}
				<ArrowLeft class="h-4 w-4" />
				Back
			{/if}
		</Button>

		<Delete redirect="/dashboard/blog" />
	</div>

	{#if !editForm}
		<div class="flex w-full flex-col items-start justify-start gap-4 p-4">
			<SingleTable {singleTable} />

			<article class="max-auto mx-auto w-full max-w-4xl px-6 py-12">
				<div class="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
					<h2
						class="mb-6 border-b border-slate-100 pb-4 text-3xl font-bold tracking-tight text-slate-900"
					>
						Content
					</h2>

					<div
						class="prose prose-slate prose-headings:text-slate-800 prose-p:leading-relaxed prose-li:my-1 max-w-none"
					>
						{@html data?.product?.content}
					</div>
				</div>
			</article>
		</div>
	{:else}
		<div class="w-full p-4">
			<form
				action="?/editProduct"
				use:enhance
				class="flex w-full flex-col items-start justify-start gap-4 lg:w-full"
				id="edit"
				method="post"
				enctype="multipart/form-data"
			>
				<Errors allErrors={$allErrors} />

				<InputComp
					{form}
					{errors}
					type="text"
					name="title"
					label="Blog Title"
					placeholder="Enter Title"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="slug"
					label="Blog Slug"
					placeholder="e.g. walking-in-grace"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="categoryId"
					label="Category"
					placeholder="Select Category"
					items={data?.cats}
					required
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="ministryAreaId"
					label="Ministry Area"
					placeholder="Select Ministry Area"
					items={data?.areas}
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="resourceType"
					label="Resource Type"
					placeholder="Select Type"
					items={typeItems}
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="authorId"
					label="Author"
					placeholder="Select Author"
					items={data?.people}
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="speakerId"
					label="Speaker"
					placeholder="Select Speaker"
					items={data?.people}
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="bibleReferences"
					label="Bible References"
					placeholder="e.g. John 3:16-18; Romans 8"
				/>

				<InputComp
					{form}
					{errors}
					label="Excerpt | Short Description"
					type="textarea"
					name="excerpt"
					placeholder="Enter Excerpt of Blog"
					required={true}
					rows={10}
				/>

				<InputComp
					{form}
					{errors}
					label="Content"
					type="hidden"
					name="content"
					placeholder="Enter Content"
					required={true}
					rows={10}
				/>
				<RichTextEditor bind:value={$form.content} />

				<InputComp
					{form}
					{errors}
					type="text"
					name="videoLink"
					label="Video Link"
					placeholder="https://youtube.com/watch?v=..."
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="audioUrl"
					label="Audio Link"
					placeholder="https://..."
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="downloadUrl"
					label="Download Link"
					placeholder="https://... (PDF, handout, notes)"
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="status"
					label="Status"
					placeholder="Select Status"
					items={statusItems}
				/>

				<div class="flex flex-col gap-3 py-2">
					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.isFeaturedOnHome}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Feature on the home page
					</label>

					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.allowComments}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Allow comments
					</label>
				</div>

				<InputComp
					{form}
					{errors}
					type="file"
					name="image"
					label="Blog Featured Image"
					image={data?.product?.featuredImage ?? ''}
					placeholder="Upload Blog Featured Image"
				/>

				<Button form="edit" type="submit" class="mt-4">
					{#if $delayed}
						<LoadingBtn name="Saving Changes" />
					{:else}
						<Save class="h-4 w-4" />
						Save Changes
					{/if}
				</Button>
			</form>
		</div>
	{/if}
</SingleView>

<div class="mx-auto my-12 px-4 sm:px-6 lg:px-4">
	{#if data?.product?.title}
		<div class="mb-6 border-b border-gray-100 pb-4">
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">
				Gallery Images
			</nav>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
				{data.product.title}
			</h1>
		</div>
	{/if}

	<div
		class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl transition-shadow hover:shadow-2xl"
	>
		<div class="p-3 sm:p-6">
			<Button onclick={() => (editGallery = !editGallery)} class="mb-4">
				{#if !editGallery}
					<Pencil class="h-4 w-4" />
					Edit
				{:else}
					<ArrowLeft class="h-4 w-4" />
					Back
				{/if}
			</Button>

			{#if !editGallery}
				<Gallery {images} title={data?.product?.title} />
			{:else}
				<EditGallery data={data?.galleryEdit} bind:images />
			{/if}
		</div>
	</div>
</div>