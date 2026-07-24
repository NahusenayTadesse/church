<script lang="ts">
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm, dateProxy } from 'sveltekit-superforms/client';
	import type { Snapshot } from '@sveltejs/kit';
	import { ArrowLeft, Pencil, Save } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { edit } from './schema.js';
	import Items from './items.svelte';

	import SingleTable from '$lib/components/SingleTable.svelte';
	import SingleView from '$lib/components/SingleView.svelte';
	import Delete from '$lib/forms/Delete.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { formatEthiopianDate } from '$lib/global.svelte.js';

	let { data } = $props();

	const showDate = (v: string | Date | null | undefined) =>
		v ? formatEthiopianDate(new Date(v)) : '—';

	let imageCount = $derived(data.items.filter((i) => i.mediaType === 'image').length);
	let videoCount = $derived(data.items.filter((i) => i.mediaType === 'video').length);

	/* A gallery can be tied to an area, an event, a project, or nothing at all. */
	let attachedTo = $derived(
		[
			data.gallery?.eventName && `Event: ${data.gallery.eventName}`,
			data.gallery?.projectName && `Project: ${data.gallery.projectName}`,
			data.gallery?.ministryAreaName && `Area: ${data.gallery.ministryAreaName}`
		]
			.filter(Boolean)
			.join(' · ') || 'Not attached to anything'
	);

	let singleTable = $derived([
		{ name: 'Title', value: data.gallery?.title },
		{ name: 'Description', value: data.gallery?.description ?? '—' },
		{ name: 'Attached To', value: attachedTo },
		{ name: 'Captured On', value: showDate(data.gallery?.capturedOn) },
		{
			name: 'Contents',
			value: `${imageCount} image(s), ${videoCount} video(s)`
		},
		{ name: 'Published', value: data.gallery?.isPublished ? 'Yes' : 'No' },
		{ name: 'Featured On Home', value: data.gallery?.isFeaturedOnHome ? 'Yes' : 'No' },
		{ name: 'Added On', value: showDate(data.gallery?.createdAt) },
		{ name: 'Added By', value: data.gallery?.createdByName ?? '—' },
		{ name: 'Last Updated By', value: data.gallery?.updatedByName ?? '—' }
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

	const capturedOn = dateProxy(form, 'capturedOn', { format: 'date', empty: 'null' });

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

	const fieldClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
</script>

<svelte:head>
	<title>{data?.gallery?.title ?? 'Gallery'} — Gallery Details</title>
</svelte:head>

<SingleView title={data?.gallery?.title} photo={String(data?.gallery?.coverImage)} class="w-full!">
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

		<Delete redirect="/dashboard/gallery" />
	</div>

	{#if data.gallery?.isPublished && data.items.length === 0}
		<div
			class="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
		>
			This gallery is published but empty. Add photos below, or unpublish it until it's ready.
		</div>
	{/if}

	{#if !editForm}
		<div class="flex w-full flex-col items-start justify-start gap-4 p-4">
			<SingleTable {singleTable} />
		</div>
	{:else}
		<div class="w-full p-4">
			<form
				action="?/editGallery"
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
					label="Gallery Title"
					placeholder="Enter Title"
					required
				/>

				<InputComp
					{form}
					{errors}
					label="Description"
					type="textarea"
					name="description"
					placeholder="One or two lines describing this set"
					rows={3}
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
					name="eventId"
					label="Event"
					placeholder="Select Event"
					items={data?.eventOptions}
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="projectId"
					label="Project"
					placeholder="Select Project"
					items={data?.projectOptions}
				/>

				<div class="flex w-full flex-col gap-1">
					<label for="capturedOn" class="text-sm font-medium">Captured On</label>
					<input id="capturedOn" type="date" bind:value={$capturedOn} class={fieldClass} />
					{#if $errors.capturedOn}
						<span class="text-sm text-red-600">{$errors.capturedOn}</span>
					{/if}
				</div>

				<div class="flex flex-col gap-3 py-2">
					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.isPublished}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Show on the public site
					</label>

					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.isFeaturedOnHome}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Feature on the home page
					</label>
				</div>

				<InputComp
					{form}
					{errors}
					type="file"
					name="cover"
					label="Cover Image"
					image={data?.gallery?.coverImage ?? ''}
					placeholder="Upload a cover, or pick one from the items below"
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
	<Items items={data.items} coverImage={data.gallery?.coverImage} />
</div>