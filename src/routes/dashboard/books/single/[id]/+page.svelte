<script lang="ts">
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm, dateProxy } from 'sveltekit-superforms/client';
	import { enhance as formEnhance } from '$app/forms';
	import type { Snapshot } from '@sveltejs/kit';
	import { ArrowLeft, Pencil, Save, Plus, ExternalLink } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { edit, languages, bookStatuses } from './schema.js';
	import Formats from './formats.svelte';
	import Reviews from './reviews.svelte';

	import SingleTable from '$lib/components/SingleTable.svelte';
	import SingleView from '$lib/components/SingleView.svelte';
	import Delete from '$lib/forms/Delete.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import RichTextEditor from '$lib/formComponents/RichTextEditor.svelte';
	import { formatEthiopianDate } from '$lib/global.svelte.js';

	let { data } = $props();

	const label = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

	const languageItems = languages.map((value) => ({ value, name: label(value) }));
	const statusItems = bookStatuses.map((value) => ({ value, name: label(value) }));

	const showDate = (v: string | Date | null | undefined) =>
		v ? formatEthiopianDate(new Date(v)) : '—';

	const showMoney = (v: string | number | null | undefined, currency = 'ETB') =>
		v === null || v === undefined || v === '' ? '—' : `${v} ${currency}`;

	/* An outside author's name wins only when no team member is linked. */
	let author = $derived(data.book?.teamAuthorName ?? data.book?.authorName ?? '—');

	let singleTable = $derived([
		{ name: 'Title', value: data.book?.title },
		{ name: 'Subtitle', value: data.book?.subtitle ?? '—' },
		{ name: 'Slug', value: data.book?.slug },
		{ name: 'Author', value: author },
		{ name: 'Ministry Area', value: data.book?.ministryAreaName ?? '—' },
		{ name: 'Language', value: label(data.book?.language ?? 'english') },
		{ name: 'Published On', value: showDate(data.book?.publicationDate) },
		{ name: 'Pages', value: data.book?.pages ?? '—' },
		{ name: 'ISBN', value: data.book?.isbn ?? '—' },
		{ name: 'Price', value: showMoney(data.book?.price, data.book?.currency ?? 'ETB') },
		{
			name: 'Sold On Site',
			value: data.book?.productName
				? `${data.book.productName} — ${data.book.productQuantity ?? 0} in stock`
				: 'No (external link only)'
		},
		{ name: 'Purchase Link', value: data.book?.purchaseLink ?? '—' },
		{ name: 'Preview File', value: data.book?.previewFileUrl ?? '—' },
		{ name: 'Status', value: label(data.book?.status ?? 'draft') },
		{ name: 'Featured On Home', value: data.book?.isFeaturedOnHome ? 'Yes' : 'No' },
		{ name: 'Added On', value: showDate(data.book?.createdAt) },
		{ name: 'Added By', value: data.book?.createdByName ?? '—' },
		{ name: 'Last Updated By', value: data.book?.updatedByName ?? '—' }
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

	const publicationDate = dateProxy(form, 'publicationDate', { format: 'date', empty: 'null' });

	let editForm = $state(false);

	$effect(() => {
		if ($message) {
			if ($message.type === 'error') {
				toast.error($message.text);
			} else {
				toast.success($message.text);
			}
		}
	});
</script>

<svelte:head>
	<title>{data?.book?.title ?? 'Book'} — Book Details</title>
</svelte:head>

<SingleView title={data?.book?.title} photo={String(data?.book?.coverImage)} class="w-full!">
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

		<Delete redirect="/dashboard/books" />
	</div>

	{#if !editForm}
		<div class="flex w-full flex-col items-start justify-start gap-4 p-4">
			<SingleTable {singleTable} />

			<article class="max-auto mx-auto w-full max-w-4xl px-6 py-12">
				<div class="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
					<h2
						class="mb-6 border-b border-slate-100 pb-4 text-3xl font-bold tracking-tight text-slate-900"
					>
						Description
					</h2>

					<div
						class="prose prose-slate prose-headings:text-slate-800 prose-p:leading-relaxed prose-li:my-1 max-w-none"
					>
						{@html data?.book?.description}
					</div>
				</div>
			</article>
		</div>
	{:else}
		<div class="w-full p-4">
			<form
				action="?/editBook"
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
					label="Book Title"
					placeholder="Enter Title"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="subtitle"
					label="Subtitle"
					placeholder="Enter Subtitle"
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="slug"
					label="Book Slug"
					placeholder="e.g. the-quiet-hour"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="authorId"
					label="Author (team member)"
					placeholder="Select Author"
					items={data?.people}
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="authorName"
					label="Author (outside the team)"
					placeholder="Only fill this in when the author isn't a team member"
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
					name="language"
					label="Language"
					placeholder="Select Language"
					items={languageItems}
				/>

				<div class="flex w-full flex-col gap-1">
					<label for="publicationDate" class="text-sm font-medium">Publication Date</label>
					<input
						id="publicationDate"
						type="date"
						bind:value={$publicationDate}
						class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
					/>
					{#if $errors.publicationDate}
						<span class="text-sm text-red-600">{$errors.publicationDate}</span>
					{/if}
				</div>

				<InputComp
					{form}
					{errors}
					type="text"
					name="pages"
					label="Pages"
					placeholder="e.g. 248"
				/>

				<InputComp {form} {errors} type="text" name="isbn" label="ISBN" placeholder="978-..." />

				<InputComp
					{form}
					{errors}
					label="Description"
					type="hidden"
					name="description"
					placeholder="Enter Description"
					required={true}
					rows={10}
				/>
				<RichTextEditor bind:value={$form.description} />

				<InputComp
					{form}
					{errors}
					type="text"
					name="price"
					label="Price"
					placeholder="e.g. 350"
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="currency"
					label="Currency"
					placeholder="ETB"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="productId"
					label="Sell on site as"
					placeholder="Link an inventory product (leave empty for external sales)"
					items={data?.products}
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="purchaseLink"
					label="External Purchase Link"
					placeholder="https://amazon.com/..."
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

				<label class="flex items-center gap-2 py-2 text-sm font-medium">
					<input
						type="checkbox"
						bind:checked={$form.isFeaturedOnHome}
						class="h-4 w-4 rounded border-slate-300"
					/>
					Feature on the home page
				</label>

				<InputComp
					{form}
					{errors}
					type="file"
					name="cover"
					label="Cover Image"
					image={data?.book?.coverImage ?? ''}
					placeholder="Upload Cover Image"
				/>

				<InputComp
					{form}
					{errors}
					type="file"
					name="preview"
					label="Preview File (sample chapter)"
					placeholder="Upload a preview PDF"
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

<div class="mx-auto my-12 flex flex-col gap-12 px-4 sm:px-6 lg:px-4">
	<Formats formats={data.formats} usedFormats={data.usedFormats} currency={data.book?.currency} />

	<Reviews reviews={data.reviews} />

	<!-- Related resources -->
	<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
		<div class="border-b border-gray-100 p-6">
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">
				Related Resources
			</nav>
			<h2 class="text-2xl font-bold tracking-tight">Articles, sermons and teachings</h2>
		</div>

		<div class="p-6">
			<form
				method="post"
				action="?/linkResource"
				use:formEnhance
				class="mb-6 flex flex-wrap items-end gap-3"
			>
				<div class="flex min-w-64 flex-1 flex-col gap-1">
					<label for="resourceId" class="text-sm font-medium">Add a resource</label>
					<select
						id="resourceId"
						name="resourceId"
						required
						class="rounded-md border border-slate-300 px-3 py-2 text-sm"
					>
						<option value="">Select a published resource</option>
						{#each data.resourceOptions as option (option.value)}
							<option value={option.value}>{option.name}</option>
						{/each}
					</select>
				</div>
				<Button type="submit"><Plus class="h-4 w-4" /> Link</Button>
			</form>

			{#if data.linked.length === 0}
				<p class="text-sm text-slate-500">Nothing linked yet.</p>
			{:else}
				<ul class="divide-y divide-slate-100">
					{#each data.linked as item (item.linkId)}
						<li class="flex items-center justify-between gap-4 py-3">
							<div>
								<p class="font-medium">{item.title}</p>
								<p class="text-xs tracking-wider text-slate-400 uppercase">
									{label(item.resourceType ?? 'article')}
								</p>
							</div>
							<div class="flex items-center gap-2">
								<a
									href="/dashboard/blog/{item.id}"
									class="text-slate-500 hover:text-slate-900"
									aria-label="Open resource"
								>
									<ExternalLink class="h-4 w-4" />
								</a>
								<form method="post" action="?/unlinkResource" use:formEnhance>
									<input type="hidden" name="id" value={item.linkId} />
									<Button type="submit" variant="ghost" size="sm">Unlink</Button>
								</form>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</div>