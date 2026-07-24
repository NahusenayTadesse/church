<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';

	import { add as schema } from './schema';

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
</script>

<svelte:head>
	<title>Add Testimonial</title>
</svelte:head>

<FormCard title="Add A Testimonial" description="Stories and quotes from the people you serve">
	<form
		use:enhance
		action="?/addTestimonial"
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
			name="name"
			label="Name"
			placeholder="Who is telling the story"
			required
		/>

		<InputComp
			{form}
			{errors}
			type="text"
			name="position"
			label="Position"
			placeholder="e.g. Youth Program Graduate"
		/>

		<InputComp
			{form}
			{errors}
			type="text"
			name="title"
			label="Headline"
			placeholder="A short headline for the story"
		/>

		<InputComp
			{form}
			{errors}
			label="Testimonial"
			type="textarea"
			name="message"
			placeholder="In their own words"
			required
			rows={7}
		/>

		<InputComp
			{form}
			{errors}
			type="file"
			name="avatar"
			label="Photo"
			placeholder="Upload a photo"
		/>

		<!-- Where the story came from -->
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
			name="project"
			label="Project"
			placeholder="Select a project"
			items={data?.projectOptions}
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
			type="date"
			name="storyDate"
			label="Story Date"
			placeholder="When did this happen"
			year
		/>

		<!-- Consent gates everything below it -->
		<p class="px-1 pt-2 text-sm font-medium">Consent</p>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="permissionGiven"
			label="Permission"
			placeholder="This person agreed to have their story and photo shared publicly"
		/>

		{#if $form.permissionGiven}
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
		{:else}
			<p class="px-1 text-sm text-muted-foreground">
				Without permission the story is saved as a draft only. Tick the box above to publish it.
			</p>
		{/if}

		<Button type="submit" form="main">
			{#if $delayed}
				<LoadingBtn name="Adding Testimonial" />
			{:else}
				<Plus /> Add Testimonial
			{/if}
		</Button>
	</form>
</FormCard>