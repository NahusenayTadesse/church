<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';

	import {
		add as schema,
		languageOptions,
		bookStatusOptions,
		currencyOptions
	} from './schema';

	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import FormCard from '$lib/formComponents/FormCard.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import RichTextEditor from '$lib/formComponents/RichTextEditor.svelte';

	let { data } = $props();

	/** Stop overwriting the slug once the user has typed their own. */
	let slugEdited = $state(false);

	const slugify = (value: string) =>
		value
			.toLowerCase()
			.trim()
			.replace(/[^\p{L}\p{N}\s-]/gu, '')
			.replace(/[\s-]+/g, '-')
			.replace(/^-|-$/g, '');

	const { form, errors, enhance, delayed, allErrors, capture, restore, message } = superForm(
		data.form,
		{
			taintedMessage: () =>
				new Promise((resolve) => {
					resolve(window.confirm('Do you want to leave?\nChanges you made may not be saved.'));
				}),
			onChange(event) {
				if (event.paths.includes('title') && !slugEdited) {
					$form.slug = slugify($form.title ?? '');
				}
			},
			validators: zod4Client(schema)
		}
	);

	export const snapshot: Snapshot = { capture, restore };

	$effect(() => {
		if ($message) {
			if ($message.type === 'error') toast.error($message.text);
			else toast.success($message.text);
		}
	});

	/** An external store link and on-site stock are two different answers to the
	 *  same question, so only offer the one that's in play. */
</script>

<svelte:head>
	<title>Add New Book</title>
</svelte:head>

<FormCard title="Add A Book" description="Titles, formats and where readers get them">
	<form
		use:enhance
		action="?/addBook"
		id="main"
		class="flex flex-col gap-4"
		method="POST"
		enctype="multipart/form-data"
	>
		<Errors allErrors={$allErrors} />

		<InputComp
			{form}
			{errors}
			type="text"
			name="title"
			label="Title"
			placeholder="Enter title"
			required
		/>

		<InputComp
			{form}
			{errors}
			type="text"
			name="subtitle"
			label="Subtitle"
			placeholder="Enter subtitle"
		/>

		<InputComp
			{form}
			{errors}
			type="text"
			name="slug"
			label="Slug"
			placeholder="Enter slug"
			required
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="author"
			label="Author"
			placeholder="Select a team member"
			items={data?.people}
		/>

		{#if !$form.author}
			<InputComp
				{form}
				{errors}
				type="text"
				name="authorName"
				label="Author Name"
				placeholder="For authors outside the team"
				required
			/>
		{/if}

		<InputComp
			{form}
			{errors}
			type="select"
			name="language"
			label="Language"
			placeholder="Select language"
			items={languageOptions}
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="ministryArea"
			label="Ministry Area"
			placeholder="Select ministry area"
			items={data?.areas}
		/>

		<InputComp
			{form}
			{errors}
			label="Description"
			type="hidden"
			name="description"
			placeholder="Enter the description"
		/>
		<RichTextEditor bind:value={$form.description} />

		<InputComp
			{form}
			{errors}
			type="file"
			name="cover"
			label="Cover Image"
			placeholder="Upload the cover"
			required
		/>

		<!-- Publication details -->
		<p class="px-1 pt-2 text-sm font-medium">Publication</p>

		<InputComp
			{form}
			{errors}
			type="date"
			name="publicationDate"
			label="Publication Date"
			placeholder="Select the publication date"
			year
			futureDays
		/>

		<InputComp {form} {errors} type="number" name="pages" label="Pages" placeholder="e.g. 248" min="1" />

		<InputComp
			{form}
			{errors}
			type="text"
			name="isbn"
			label="ISBN"
			placeholder="978-3-16-148410-0"
		/>

		<!-- Where readers get it -->
		<p class="px-1 pt-2 text-sm font-medium">Availability</p>

		<InputComp
			{form}
			{errors}
			type="number"
			name="price"
			label="Price"
			placeholder="Used by any format that doesn't set its own"
			min="0"
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="currency"
			label="Currency"
			placeholder="Select currency"
			items={currencyOptions}
		/>

		<!-- <InputComp
			{form}
			{errors}
			type="select"
			name="product"
			label="Sold On Site As"
			placeholder="Link a product to sell from stock"
			items={data?.productOptions}
		/>  -->

			<InputComp
				{form}
				{errors}
				type="url"
				name="purchaseLink"
				label="External Store Link"
				placeholder="Amazon, Lulu or another store URL"
			/>

		<!-- Formats -->
		<p class="px-1 pt-2 text-sm font-medium">Formats</p>
		<p class="-mt-3 px-1 text-xs text-muted-foreground">
			A digital format is listed once its file is uploaded. Leave the price blank to use the book
			price above.
		</p>


		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="physicalAvailable"
			label="Print"
			placeholder="Available in print"
		/>

		{#if $form.physicalAvailable}
			<InputComp
				{form}
				{errors}
				type="number"
				name="physicalPrice"
				label="Print Price"
				placeholder="Leave blank to use the book price"
				min="0"
			/>
		{/if}
  
		<InputComp
			{form}
			{errors}
			type="file"
			name="pdfFile"
			label="PDF File"
			placeholder="Upload the PDF"
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="pdfFree"
			label="Free PDF"
			placeholder="Offer the PDF as a free download"
		/>

		{#if !$form.pdfFree}
			<InputComp
				{form}
				{errors}
				type="number"
				name="pdfPrice"
				label="PDF Price"
				placeholder="Leave blank to use the book price"
				min="0"
			/>
		{/if}

		<InputComp
			{form}
			{errors}
			type="file"
			name="ebookFile"
			label="Ebook File"
			placeholder="Upload the EPUB or MOBI"
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="ebookFree"
			label="Free Ebook"
			placeholder="Offer the ebook as a free download"
		/>

		{#if !$form.ebookFree}
			<InputComp
				{form}
				{errors}
				type="number"
				name="ebookPrice"
				label="Ebook Price"
				placeholder="Leave blank to use the book price"
				min="0"
			/>
		{/if}

		<InputComp
			{form}
			{errors}
			type="file"
			name="audiobookFile"
			label="Audiobook File"
			placeholder="Upload the audio"
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="audiobookFree"
			label="Free Audiobook"
			placeholder="Offer the audiobook as a free download"
		/>

		{#if !$form.audiobookFree}
			<InputComp
				{form}
				{errors}
				type="number"
				name="audiobookPrice"
				label="Audiobook Price"
				placeholder="Leave blank to use the book price"
				min="0"
			/>
		{/if}

		<InputComp
			{form}
			{errors}
			type="file"
			name="preview"
			label="Preview File"
			placeholder="Upload a sample chapter"
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="status"
			label="Status"
			placeholder="Select status"
			items={bookStatusOptions}
			required
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="isFeaturedOnHome"
			label="Feature on the homepage"
			placeholder="Featured on the homepage?"
		/>

		<Button type="submit" form="main">
			{#if $delayed}
				<LoadingBtn name="Adding Book" />
			{:else}
				<Plus /> Add Book
			{/if}
		</Button>
	</form>
</FormCard>