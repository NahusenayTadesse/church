<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';

	import { add as schema, parseVideoUrls, MAX_VIDEOS } from '../schema.js';

	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import FormCard from '$lib/formComponents/FormCard.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';

	let { data } = $props();

	const { form, errors, enhance, delayed, allErrors, capture, restore, message } = superForm(
		data.form,
		{
			taintedMessage: () =>
				new Promise((resolve) => {
					resolve(window.confirm('Do you want to leave?\nChanges you made may not be saved.'));
				}),
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

	const videoCount = $derived(parseVideoUrls($form.videoUrls).length);
</script>

<svelte:head>
	<title>Add Gallery</title>
</svelte:head>

<FormCard title="Add A Gallery" description="Photo and video collections">
	<form
		use:enhance
		action="?/addGallery"
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
			placeholder="Enter a title"
			required
		/>

		<InputComp
			{form}
			{errors}
			label="Description"
			type="textarea"
			name="description"
			placeholder="One or two lines for the gallery card"
			rows={3}
		/>

		<InputComp
			{form}
			{errors}
			type="date"
			name="capturedOn"
			label="Captured On"
			placeholder="When were these taken"
			year
		/>

		<!-- Where the photos came from -->
		<p class="px-1 pt-2 text-sm font-medium">Context</p>

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
			name="event"
			label="Event"
			placeholder="Select an event"
			items={data?.eventOptions}
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="project"
			label="Project"
			placeholder="Select a project"
			items={data?.projectOptions}
		/>

		<!-- Media -->
		<p class="px-1 pt-2 text-sm font-medium">Media</p>

		<InputComp
			{form}
			{errors}
			type="gallery"
			name="gallery"
			label="Photos"
			placeholder="Upload photos"
			bind:images
		/>

		<InputComp
			{form}
			{errors}
			label="Video Links"
			type="textarea"
			name="videoUrls"
			placeholder={'One link per line\nhttps://youtu.be/…'}
			rows={4}
		/>
		<p class="-mt-3 px-1 text-xs text-muted-foreground">
			{videoCount} of {MAX_VIDEOS} links. YouTube thumbnails are picked up automatically; captions
			and ordering are set on the gallery page.
		</p>

		<InputComp
			{form}
			{errors}
			type="file"
			name="cover"
			label="Cover Image"
			placeholder="Leave blank to use the first photo"
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="isPublished"
			label="Published"
			placeholder="Visible on the public site"
		/>

		{#if $form.isPublished}
			<InputComp
				{form}
				{errors}
				type="checkboxSingle"
				name="isFeaturedOnHome"
				label="Feature on the homepage"
				placeholder="Featured on the homepage?"
			/>
		{/if}

		<Button type="submit" form="main">
			{#if $delayed}
				<LoadingBtn name="Adding Gallery" />
			{:else}
				<Plus /> Add Gallery
			{/if}
		</Button>
	</form>
</FormCard>