<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';

	import { add as schema, projectStatusOptions, currencyOptions } from './schema';

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
				if (event.paths.includes('name') && !slugEdited) {
					$form.slug = slugify($form.name ?? '');
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

	/** A project that hasn't started has nothing to report yet. */
	const hasStarted = $derived($form.status !== 'planned');
</script>

<svelte:head>
	<title>Add New Project</title>
</svelte:head>

<FormCard title="Add A Project" description="Programs, initiatives and the work behind them">
	<form
		use:enhance
		action="?/addProject"
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
			label="Project Name"
			placeholder="Enter project name"
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
			name="ministryArea"
			label="Ministry Area"
			placeholder="Select ministry area"
			items={data?.areas}
		/>

		<InputComp
			{form}
			{errors}
			label="Short Description"
			type="textarea"
			name="shortDescription"
			placeholder="One or two lines for cards and listings"
			required
			rows={3}
		/>

		<InputComp
			{form}
			{errors}
			label="Full Description"
			type="hidden"
			name="fullDescription"
			placeholder="Enter the full description"
		/>
		<RichTextEditor bind:value={$form.fullDescription} />

		<InputComp
			{form}
			{errors}
			type="file"
			name="image"
			label="Featured Image"
			placeholder="Upload featured image"
			required
		/>

		<!-- Timeline -->
		<p class="px-1 pt-2 text-sm font-medium">Timeline</p>

		<InputComp
			{form}
			{errors}
			type="select"
			name="status"
			label="Status"
			placeholder="Select status"
			items={projectStatusOptions}
			required
		/>

		<InputComp
			{form}
			{errors}
			type="date"
			name="startDate"
			label="Start Date"
			placeholder="When does the work begin"
			year
			futureDays
			required={$form.status === 'active'}
		/>

		<InputComp
			{form}
			{errors}
			type="date"
			name="endDate"
			label="End Date"
			placeholder="Leave blank for ongoing work"
			year
			futureDays
			required={$form.status === 'completed'}
		/>

		<InputComp
			{form}
			{errors}
			type="text"
			name="location"
			label="Location"
			placeholder="e.g. Bahir Dar, Amhara"
		/>

		<!-- The work -->
		<p class="px-1 pt-2 text-sm font-medium">The Work</p>

		<InputComp
			{form}
			{errors}
			label="Goal"
			type="textarea"
			name="goal"
			placeholder="What this project sets out to do"
			rows={3}
		/>

		<InputComp
			{form}
			{errors}
			label="Activities"
			type="hidden"
			name="activities"
			placeholder="What the work involves"
		/>
		<RichTextEditor bind:value={$form.activities} />

		{#if hasStarted}
			<InputComp
				{form}
				{errors}
				label="Impact & Results"
				type="hidden"
				name="impactResults"
				placeholder="What has come of it so far"
			/>
			<RichTextEditor bind:value={$form.impactResults} />
		{/if}

		<!-- People -->
		<p class="px-1 pt-2 text-sm font-medium">People</p>

		<InputComp
			{form}
			{errors}
			type="select"
			name="leader"
			label="Project Leader"
			placeholder="Select a team member"
			items={data?.people}
		/>

		<!--
			Partners post as repeated `partners` fields so superforms parses them into
			an array; `bind:group` keeps the ids numeric on the client.
		-->
		<div class="flex w-full max-w-full flex-col justify-start gap-2 p-1">
			<Label>Partners</Label>
			{#if data.partnerOptions?.length}
				<div class="grid gap-2 sm:grid-cols-2">
					{#each data.partnerOptions as partner (partner.value)}
						<label class="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name="partners"
								value={partner.value}
								bind:group={$form.partners}
								class="size-4 rounded border-input accent-primary"
							/>
							{partner.name}
						</label>
					{/each}
				</div>
				<p class="text-xs text-muted-foreground">
					Each partner's role on this project is set from the project page.
				</p>
			{:else}
				<p class="text-sm text-muted-foreground">
					No partners yet — add one first and it will show up here.
				</p>
			{/if}
		</div>

		<!-- Reach -->
		<p class="px-1 pt-2 text-sm font-medium">Reach</p>

		<InputComp
			{form}
			{errors}
			type="text"
			name="beneficiaries"
			label="Beneficiaries"
			placeholder="Who this project serves"
		/>

		<InputComp
			{form}
			{errors}
			type="number"
			name="targetBeneficiaries"
			label="Target"
			placeholder="How many people you aim to reach"
			min="1"
		/>

		{#if hasStarted}
			<InputComp
				{form}
				{errors}
				type="number"
				name="reachedBeneficiaries"
				label="Reached So Far"
				placeholder="0"
				min="0"
			/>
		{/if}

		<!-- Funding -->
		<p class="px-1 pt-2 text-sm font-medium">Funding</p>

		<InputComp
			{form}
			{errors}
			type="number"
			name="fundingGoal"
			label="Funding Goal"
			placeholder="Leave blank if this project isn't fundraising"
			min="0"
		/>

		<InputComp
			{form}
			{errors}
			type="number"
			name="fundingRaised"
			label="Already Raised"
			placeholder="0.00"
			min="0"
		/>
		<p class="-mt-3 px-1 text-xs text-muted-foreground">
			Only for money raised before this project was listed here. Donations taken through the site
			add to this figure on their own.
		</p>

		<InputComp
			{form}
			{errors}
			type="select"
			name="currency"
			label="Currency"
			placeholder="Select currency"
			items={currencyOptions}
		/>

		<!-- Ways to support -->
		<p class="px-1 pt-2 text-sm font-medium">Ways To Support</p>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="acceptsDonations"
			label="Donations"
			placeholder="Accept donations toward this project"
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="acceptsVolunteers"
			label="Volunteers"
			placeholder="Accept volunteer sign-ups"
		/>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="acceptsPrayer"
			label="Prayer"
			placeholder="Invite prayer for this project"
		/>

		<!-- Media -->
		<p class="px-1 pt-2 text-sm font-medium">Media</p>

		<InputComp
			{form}
			{errors}
			type="gallery"
			name="gallery"
			label="Gallery Images"
			placeholder="Upload gallery images"
			bind:images
		/>

		<InputComp
			{form}
			{errors}
			type="file"
			name="proposal"
			label="Proposal or Report"
			placeholder="Upload a PDF or document"
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
				<LoadingBtn name="Adding Project" />
			{:else}
				<Plus /> Add Project
			{/if}
		</Button>
	</form>
</FormCard>