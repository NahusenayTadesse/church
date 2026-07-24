<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';

	import { add as schema, resourceTypeOptions, resourceStatusOptions } from './schema';

	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import FormCard from '$lib/formComponents/FormCard.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import RichTextEditor from '$lib/formComponents/RichTextEditor.svelte';

	let { data } = $props();

	/** Stop overwriting the slug once the user has typed their own. */
	let slugEdited = $state(false);

	/**
	 * Unicode-aware slugging. The old `\w` version wiped Amharic titles entirely,
	 * leaving an empty slug for anything like "ደስተኛ ሕዝቦች".
	 */
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

	let images = $state([]);

	const needsSpeaker = $derived(
		['sermon', 'teaching', 'audio', 'video'].includes($form.resourceType)
	);
	const needsVideo = $derived(['video', 'sermon', 'teaching'].includes($form.resourceType));
	const needsAudio = $derived(['audio', 'sermon', 'teaching'].includes($form.resourceType));
	const isScripture = $derived(['sermon', 'teaching', 'bible_study'].includes($form.resourceType));
</script>

<svelte:head>
	<title>Add New Resource</title>
</svelte:head>

<FormCard title="Add A Resource" description="Articles, sermons, teachings and studies">
	<form
		use:enhance
		action="?/addBlog"
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
			name="slug"
			label="Slug"
			placeholder="Enter slug"
			required
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="resourceType"
			label="Resource Type"
			placeholder="Select type"
			items={resourceTypeOptions}
			required
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="category"
			label="Category"
			placeholder="Select category"
			items={data?.cats}
			required
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
			type="select"
			name="author"
			label="Author"
			placeholder="Select author"
			items={data?.people}
		/>

		{#if needsSpeaker}
			<InputComp
				{form}
				{errors}
				type="select"
				name="speaker"
				label="Speaker"
				placeholder="Select speaker"
				items={data?.people}
				required={$form.resourceType === 'sermon'}
			/>
		{/if}

		<InputComp
			{form}
			{errors}
			label="Excerpt | Short Description"
			type="textarea"
			name="excerpt"
			placeholder="Enter a short summary"
			required
			rows={5}
		/>

		<InputComp
			{form}
			{errors}
			label="Content"
			type="hidden"
			name="content"
			placeholder="Enter content"
			required
		/>
		<RichTextEditor bind:value={$form.content} />

		{#if isScripture}
			<InputComp
				{form}
				{errors}
				type="text"
				name="bibleReferences"
				label="Bible References"
				placeholder="e.g. Ephesians 5:22–33, Proverbs 31"
			/>
		{/if}

		{#if needsVideo}
			<InputComp
				{form}
				{errors}
				type="text"
				name="videoLink"
				label="Video Link"
				placeholder="YouTube or Vimeo URL"
				required={$form.resourceType === 'video'}
			/>
		{/if}

		{#if needsAudio}
			<InputComp
				{form}
				{errors}
				type="file"
				name="audio"
				label="Audio File"
				placeholder="Upload sermon audio"
			/>
		{/if}

		<InputComp
			{form}
			{errors}
			type="file"
			name="attachment"
			label="Download File"
			placeholder="Upload a PDF or handout"
		/>

		<InputComp
			{form}
			{errors}
			type="file"
			name="image"
			label="Featured Image"
			placeholder="Upload featured image"
			required
		/>

		<InputComp
			{form}
			{errors}
			type="gallery"
			name="gallery"
			label="Gallery Images"
			placeholder="Upload gallery images"
			bind:images
		/>
<!-- 
		<InputComp
			{form}
			{errors}
			type="multiselect"
			name="tags"
			label="Tags"
			placeholder="Select tags"
			items={data?.tagOptions}
		/> -->

		<InputComp
			{form}
			{errors}
			type="select"
			name="status"
			label="Status"
			placeholder="Select status"
			items={resourceStatusOptions}
			required
		/>

		{#if $form.status === 'published'}
			<InputComp
				{form}
				{errors}
				type="date"
				name="publishedAt"
				label="Publish Date"
				placeholder="Leave blank to publish now"
			/>
		{/if}

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="allowComments"
			label="Allow comments on this resource"
			placeholder="Allow comments on this resource"
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
				<LoadingBtn name="Adding Resource" />
			{:else}
				<Plus /> Add Resource
			{/if}
		</Button>
	</form>
</FormCard>