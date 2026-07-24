<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';

	import { add as schema, partnershipTypeOptions } from './schema';

	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import FormCard from '$lib/formComponents/FormCard.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import RichTextEditor from '$lib/formComponents/RichTextEditor.svelte';

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
	<title>Add Partner</title>
</svelte:head>

<FormCard title="Add A Partner" description="Sponsors, donors and organizations you work with">
	<form
		use:enhance
		action="?/addPartner"
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
			placeholder="Enter the organization name"
			required
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="partnershipType"
			label="Partnership Type"
			placeholder="Select type"
			items={partnershipTypeOptions}
			required
		/>

		<InputComp
			{form}
			{errors}
			label="Short Description"
			type="textarea"
			name="description"
			placeholder="One line for the partner card"
			rows={2}
		/>

		<InputComp
			{form}
			{errors}
			label="About"
			type="hidden"
			name="about"
			placeholder="More about this partner and the work you do together"
		/>
		<RichTextEditor bind:value={$form.about} />

		<InputComp
			{form}
			{errors}
			type="url"
			name="website"
			label="Website"
			placeholder="https://example.org"
		/>

		<InputComp
			{form}
			{errors}
			type="file"
			name="logo"
			label="Logo"
			placeholder="Upload the logo"
			required={$form.showOnHome}
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="showOnHome"
			label="Show on the homepage"
			placeholder="Include in the homepage partner strip"
		/>

		<InputComp
			{form}
			{errors}
			type="number"
			name="sortOrder"
			label="Sort Order"
			placeholder="0"
			min="0"
		/>
		<p class="-mt-3 px-1 text-xs text-muted-foreground">
			Lower numbers appear first. Pre-filled with the next free position.
		</p>

		<Button type="submit" form="main">
			{#if $delayed}
				<LoadingBtn name="Adding Partner" />
			{:else}
				<Plus /> Add Partner
			{/if}
		</Button>
	</form>
</FormCard>