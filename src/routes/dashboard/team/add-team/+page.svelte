<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';

	import { add as schema, socialPlatforms, socialLabels, socialPlaceholders } from './schema';

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
	<title>Add Team Member</title>
</svelte:head>

<FormCard title="Add A Team Member" description="Staff, leadership and speakers">
	<form
		use:enhance
		action="?/addTeamMember"
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
			label="Full Name"
			placeholder="Enter full name"
			required
		/>

		<InputComp
			{form}
			{errors}
			type="text"
			name="position"
			label="Position"
			placeholder="e.g. Director of Youth Ministry"
		/>

		<InputComp
			{form}
			{errors}
			type="file"
			name="photo"
			label="Photo"
			placeholder="Upload a profile photo"
			required
		/>

		<InputComp
			{form}
			{errors}
			type="email"
			name="email"
			label="Email"
			placeholder="name@example.com"
		/>

		<InputComp {form} {errors} type="tel" name="phone" label="Phone" placeholder="+251 ..." />

		<InputComp
			{form}
			{errors}
			label="Biography"
			type="hidden"
			name="biography"
			placeholder="Enter biography"
		/>
		<RichTextEditor bind:value={$form.biography} />

		<!--
			Areas of expertise. Rendered as real checkboxes sharing one name so the
			browser posts `ministryAreas` once per selection — superforms then parses
			it straight into an array. `bind:group` keeps the ids as numbers client-side.
		-->
		<div class="flex w-full max-w-full flex-col justify-start gap-2 p-1">
			<Label>Areas of Expertise</Label>
			{#if data.areas?.length}
				<div class="grid gap-2 sm:grid-cols-2">
					{#each data.areas as area (area.value)}
						<label class="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name="ministryAreas"
								value={area.value}
								bind:group={$form.ministryAreas}
								class="size-4 rounded border-input accent-primary"
							/>
							{area.name}
						</label>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">
					No ministry areas yet — add one first and it will show up here.
				</p>
			{/if}
			{#if $errors.ministryAreas?._errors}
				<p class="text-red-500">{$errors.ministryAreas._errors[0]}</p>
			{/if}
		</div>

		<InputComp
			{form}
			{errors}
			type="combo"
			name="userId"
			label="Linked Login Account"
			placeholder="Search accounts"
			items={data?.accounts}
		/>

		<!-- Social links: one optional URL per platform, saved as rows on submit. -->
		<div class="flex flex-col gap-1">
			<p class="px-1 text-sm font-medium">Social Links</p>
			{#each socialPlatforms as platform (platform)}
				<InputComp
					{form}
					{errors}
					type="url"
					name={platform}
					label={socialLabels[platform]}
					placeholder={socialPlaceholders[platform]}
				/>
			{/each}
		</div>

		<InputComp
			{form}
			{errors}
			type="number"
			name="sortOrder"
			label="Sort Order"
			placeholder="0"
			min="0"
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="isExecutive"
			label="Executive"
			placeholder="Show under executive leadership"
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="isSpeaker"
			label="Speaker"
			placeholder="Available as a speaker for events and sermons"
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="isPublished"
			label="Published"
			placeholder="Visible on the public site"
		/>

		<Button type="submit" form="main">
			{#if $delayed}
				<LoadingBtn name="Adding Team Member" />
			{:else}
				<Plus /> Add Team Member
			{/if}
		</Button>
	</form>
</FormCard>