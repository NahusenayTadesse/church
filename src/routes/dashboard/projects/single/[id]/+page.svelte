<script lang="ts">
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm, dateProxy } from 'sveltekit-superforms/client';
	import { enhance as formEnhance } from '$app/forms';
	import type { Snapshot } from '@sveltejs/kit';
	import { ArrowLeft, Pencil, Save, RefreshCw } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { edit, projectStatuses } from './schema.js';
	import Documents from './documents.svelte';
	import Partners from './partners.svelte';
	import Updates from './updates.svelte';
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

	const statusItems = projectStatuses.map((value) => ({ value, name: label(value) }));

	const showDate = (v: string | Date | null | undefined) =>
		v ? formatEthiopianDate(new Date(v)) : '—';

	const pct = (part: number, whole: number | null | undefined) =>
		whole && whole > 0 ? Math.min(Math.round((part / whole) * 100), 100) : null;

	let fundingPct = $derived(pct(data.funding.recorded, Number(data.project?.fundingGoal ?? 0)));

	let beneficiaryPct = $derived(
		pct(data.project?.reachedBeneficiaries ?? 0, data.project?.targetBeneficiaries)
	);

	/* The stored total and the donations table can drift — say so rather than
	   showing two numbers in different places and letting someone find out later. */
	let fundingDrift = $derived(
		Math.abs(data.funding.recorded - data.funding.fromDonations) > 0.005
	);

	let singleTable = $derived([
		{ name: 'Name', value: data.project?.name },
		{ name: 'Slug', value: data.project?.slug },
		{ name: 'Ministry Area', value: data.project?.ministryAreaName ?? '—' },
		{ name: 'Status', value: label(data.project?.status ?? 'planned') },
		{ name: 'Leader', value: data.project?.leaderName ?? '—' },
		{ name: 'Location', value: data.project?.location ?? '—' },
		{ name: 'Runs', value: `${showDate(data.project?.startDate)} → ${showDate(data.project?.endDate)}` },
		{ name: 'Short Description', value: data.project?.shortDescription ?? '—' },
		{ name: 'Beneficiaries', value: data.project?.beneficiaries ?? '—' },
		{
			name: 'Reach',
			value: data.project?.targetBeneficiaries
				? `${data.project.reachedBeneficiaries ?? 0} of ${data.project.targetBeneficiaries} (${beneficiaryPct}%)`
				: `${data.project?.reachedBeneficiaries ?? 0} reached (no target set)`
		},
		{
			name: 'Ways To Support',
			value:
				[
					data.project?.acceptsDonations && 'Donations',
					data.project?.acceptsVolunteers && 'Volunteers',
					data.project?.acceptsPrayer && 'Prayer'
				]
					.filter(Boolean)
					.join(', ') || 'None enabled'
		},
		{ name: 'Featured On Home', value: data.project?.isFeaturedOnHome ? 'Yes' : 'No' },
		{ name: 'Linked Stories', value: `${data.storyCount} testimonial(s)` },
		{ name: 'Linked Galleries', value: `${data.galleryCount} gallery/galleries` },
		{ name: 'Added On', value: showDate(data.project?.createdAt) },
		{ name: 'Added By', value: data.project?.createdByName ?? '—' },
		{ name: 'Last Updated By', value: data.project?.updatedByName ?? '—' }
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

	const startDate = dateProxy(form, 'startDate', { format: 'date', empty: 'null' });
	const endDate = dateProxy(form, 'endDate', { format: 'date', empty: 'null' });

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

	const fieldClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
</script>

<svelte:head>
	<title>{data?.project?.name ?? 'Project'} — Project Details</title>
</svelte:head>

<SingleView title={data?.project?.name} photo={String(data?.project?.featuredImage)} class="w-full!">
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

		<Delete redirect="/dashboard/projects" />
	</div>

	{#if !editForm}
		<!-- Progress -->
		<div class="grid w-full gap-4 p-4 sm:grid-cols-2">
			{#if data.project?.fundingGoal}
				<div class="rounded-2xl border border-slate-200 p-5">
					<p class="text-xs font-medium tracking-wider text-slate-400 uppercase">Funding</p>
					<p class="mt-1 text-2xl font-bold tracking-tight">
						{data.funding.recorded.toLocaleString()}
						<span class="text-base font-medium text-slate-400">
							of {Number(data.project.fundingGoal).toLocaleString()}
							{data.funding.currency}
						</span>
					</p>
					<div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
						<div class="h-full rounded-full bg-emerald-500" style="width: {fundingPct}%"></div>
					</div>
					<p class="mt-2 text-sm text-slate-500">{fundingPct}% of goal</p>
				</div>
			{/if}

			{#if data.project?.targetBeneficiaries}
				<div class="rounded-2xl border border-slate-200 p-5">
					<p class="text-xs font-medium tracking-wider text-slate-400 uppercase">People reached</p>
					<p class="mt-1 text-2xl font-bold tracking-tight">
						{(data.project.reachedBeneficiaries ?? 0).toLocaleString()}
						<span class="text-base font-medium text-slate-400">
							of {data.project.targetBeneficiaries.toLocaleString()}
						</span>
					</p>
					<div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
						<div class="h-full rounded-full bg-indigo-500" style="width: {beneficiaryPct}%"></div>
					</div>
					<p class="mt-2 text-sm text-slate-500">{beneficiaryPct}% of target</p>
				</div>
			{/if}
		</div>

		<div class="flex w-full flex-col items-start justify-start gap-4 p-4">
			<SingleTable {singleTable} />

			<article class="max-auto mx-auto w-full max-w-4xl px-6 py-12">
				<div
					class="flex flex-col gap-10 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12"
				>
					{#each [{ heading: 'About this project', body: data.project?.fullDescription }, { heading: 'Goal', body: data.project?.goal }, { heading: 'Activities', body: data.project?.activities }, { heading: 'Impact and results', body: data.project?.impactResults }] as block (block.heading)}
						{#if block.body}
							<section>
								<h2
									class="mb-6 border-b border-slate-100 pb-4 text-3xl font-bold tracking-tight text-slate-900"
								>
									{block.heading}
								</h2>
								<div
									class="prose prose-slate prose-headings:text-slate-800 prose-p:leading-relaxed prose-li:my-1 max-w-none"
								>
									{@html block.body}
								</div>
							</section>
						{/if}
					{/each}
				</div>
			</article>
		</div>
	{:else}
		<div class="w-full p-4">
			<form
				action="?/editProject"
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
					name="name"
					label="Project Name"
					placeholder="Enter Name"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="slug"
					label="Project Slug"
					placeholder="e.g. clean-water-tigray"
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
					name="leaderId"
					label="Project Leader"
					placeholder="Select Leader"
					items={data?.people}
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

				<InputComp
					{form}
					{errors}
					type="text"
					name="location"
					label="Location"
					placeholder="e.g. Tigray, Ethiopia"
				/>

				<div class="grid w-full gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label for="startDate" class="text-sm font-medium">Start date</label>
						<input id="startDate" type="date" bind:value={$startDate} class={fieldClass} />
						{#if $errors.startDate}
							<span class="text-sm text-red-600">{$errors.startDate}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-1">
						<label for="endDate" class="text-sm font-medium">End date</label>
						<input id="endDate" type="date" bind:value={$endDate} class={fieldClass} />
						{#if $errors.endDate}
							<span class="text-sm text-red-600">{$errors.endDate}</span>
						{/if}
					</div>
				</div>

				<InputComp
					{form}
					{errors}
					label="Short Description"
					type="textarea"
					name="shortDescription"
					placeholder="One or two lines for cards and listings"
					rows={3}
				/>

				<InputComp
					{form}
					{errors}
					label="Full Description"
					type="hidden"
					name="fullDescription"
					required={true}
				/>
				<RichTextEditor bind:value={$form.fullDescription} />

				<InputComp {form} {errors} label="Goal" type="hidden" name="goal" />
				<RichTextEditor bind:value={$form.goal} />

				<InputComp {form} {errors} label="Activities" type="hidden" name="activities" />
				<RichTextEditor bind:value={$form.activities} />

				<InputComp {form} {errors} label="Impact and Results" type="hidden" name="impactResults" />
				<RichTextEditor bind:value={$form.impactResults} />

				<!-- Reach -->
				<InputComp
					{form}
					{errors}
					type="text"
					name="beneficiaries"
					label="Who benefits"
					placeholder="e.g. Rural households in Tigray"
				/>

				<div class="grid w-full gap-4 sm:grid-cols-2">
					<InputComp
						{form}
						{errors}
						type="text"
						name="targetBeneficiaries"
						label="Target Beneficiaries"
						placeholder="Leave empty if there's no target"
					/>

					<InputComp
						{form}
						{errors}
						type="text"
						name="reachedBeneficiaries"
						label="Reached So Far"
						placeholder="0"
					/>
				</div>

				<!-- Ways to support -->
				<div class="flex flex-col gap-3 py-2">
					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.acceptsDonations}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Accept donations
					</label>

					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.acceptsVolunteers}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Accept volunteers
					</label>

					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.acceptsPrayer}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Accept prayer requests
					</label>
				</div>

				{#if $form.acceptsDonations}
					<div class="grid w-full gap-4 sm:grid-cols-2">
						<InputComp
							{form}
							{errors}
							type="text"
							name="fundingGoal"
							label="Funding Goal"
							placeholder="e.g. 500000"
							required
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
					</div>
					<p class="-mt-2 text-xs text-slate-500">
						The amount raised is tracked separately, below the project details.
					</p>
				{/if}

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
					name="image"
					label="Featured Image"
					image={data?.project?.featuredImage ?? ''}
					placeholder="Upload Featured Image"
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
	<!-- Funding -->
	{#if data.project?.acceptsDonations || data.funding.fromDonations > 0}
		<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
			<div class="border-b border-gray-100 p-6">
				<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Funding</nav>
				<h2 class="text-2xl font-bold tracking-tight">Amount raised</h2>
			</div>

			<div class="p-6">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-2xl bg-slate-50 p-5">
						<p class="text-xs font-medium tracking-wider text-slate-400 uppercase">
							Recorded on the project
						</p>
						<p class="mt-1 text-2xl font-bold tracking-tight">
							{data.funding.recorded.toLocaleString()}
							{data.funding.currency}
						</p>
						<p class="mt-1 text-sm text-slate-500">This is the number the public page shows.</p>
					</div>

					<div class="rounded-2xl bg-slate-50 p-5">
						<p class="text-xs font-medium tracking-wider text-slate-400 uppercase">
							Completed donations
						</p>
						<p class="mt-1 text-2xl font-bold tracking-tight">
							{data.funding.fromDonations.toLocaleString()}
							{data.funding.currency}
						</p>
						<p class="mt-1 text-sm text-slate-500">
							Summed from the donations table, this currency only.
						</p>
					</div>
				</div>

				{#if fundingDrift}
					<div
						class="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
					>
						<span>
							These two disagree. That's expected if you've taken offline gifts — otherwise the
							recorded total is stale.
						</span>
						<form method="post" action="?/recalculateFunding" use:formEnhance>
							<Button type="submit" size="sm" variant="outline">
								<RefreshCw class="h-4 w-4" />
								Set from donations
							</Button>
						</form>
					</div>
				{/if}

				{#if data.funding.otherCurrencies.length > 0}
					<p class="mt-4 text-sm text-slate-500">
						Also received, not included above:
						{#each data.funding.otherCurrencies as row, i (row.currency)}
							{i > 0 ? ', ' : ''}{row.total.toLocaleString()}
							{row.currency} ({row.count})
						{/each}
					</p>
				{/if}

				{#if data.funding.pendingDonations > 0}
					<p class="mt-1 text-sm text-slate-500">
						{data.funding.pendingDonations} donation(s) still pending — they're not counted until
						completed.
					</p>
				{/if}

				<form
					method="post"
					action="?/setFunding"
					use:formEnhance
					class="mt-6 flex flex-wrap items-end gap-3"
				>
					<div class="flex flex-col gap-1">
						<label for="fundingRaised" class="text-sm font-medium">
							Set the amount raised by hand
						</label>
						<input
							id="fundingRaised"
							name="fundingRaised"
							type="number"
							step="0.01"
							min="0"
							value={data.funding.recorded}
							class="{fieldClass} w-56"
						/>
					</div>
					<Button type="submit" variant="outline"><Save class="h-4 w-4" /> Save total</Button>
				</form>

				{#if data.causes.length > 0}
					<div class="mt-8">
						<p class="text-xs font-medium tracking-wider text-slate-400 uppercase">
							Donation causes pointing here
						</p>
						<ul class="mt-2 divide-y divide-slate-100">
							{#each data.causes as cause (cause.id)}
								<li class="flex items-center justify-between gap-4 py-2 text-sm">
									<a href="/dashboard/donation-causes/{cause.id}" class="font-medium hover:underline">
										{cause.name}
									</a>
									<span class="text-slate-500">
										{Number(cause.raisedAmount ?? 0).toLocaleString()} of
										{Number(cause.goalAmount ?? 0).toLocaleString()}
										{cause.currency ?? 'ETB'}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<Updates updates={data.updates} />

	<Partners linked={data.linkedPartners} partnerOptions={data.partnerOptions} />

	<Documents documents={data.documents} />

	<!-- Gallery -->
	<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
		<div class="border-b border-gray-100 p-6">
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Gallery</nav>
			<h2 class="text-2xl font-bold tracking-tight">Photos from this project</h2>
		</div>

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
				<Gallery {images} title={data?.project?.name} />
			{:else}
				<EditGallery data={data?.galleryEdit} bind:images />
			{/if}
		</div>
	</section>
</div>