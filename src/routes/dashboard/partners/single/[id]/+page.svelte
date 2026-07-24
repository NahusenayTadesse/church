<script lang="ts">
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import type { Snapshot } from '@sveltejs/kit';
	import { ArrowLeft, Pencil, Save, ExternalLink } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { edit, partnershipTypes } from './schema.js';
	import Projects from './projects.svelte';

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

	const typeItems = partnershipTypes.map((value) => ({ value, name: label(value) }));

	const showDate = (v: string | Date | null | undefined) =>
		v ? formatEthiopianDate(new Date(v)) : '—';

	let singleTable = $derived([
		{ name: 'Name', value: data.partner?.name },
		{ name: 'Partnership Type', value: label(data.partner?.partnershipType ?? 'other') },
		{ name: 'Short Description', value: data.partner?.description ?? '—' },
		{ name: 'Website', value: data.partner?.website ?? '—' },
		{
			name: 'Projects',
			value: data.linked.length
				? `${data.linked.length} project(s)`
				: 'Not on any project yet'
		},
		{
			name: 'Home Page',
			value: data.partner?.showOnHome
				? `Shown — position ${data.homePosition} of ${data.homeCount}`
				: 'Not shown'
		},
		{ name: 'Sort Order', value: data.partner?.sortOrder ?? 0 },
		{ name: 'Added On', value: showDate(data.partner?.createdAt) },
		{ name: 'Added By', value: data.partner?.createdByName ?? '—' },
		{ name: 'Last Updated By', value: data.partner?.updatedByName ?? '—' }
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
	<title>{data?.partner?.name ?? 'Partner'} — Partner Details</title>
</svelte:head>

<SingleView title={data?.partner?.name} photo={String(data?.partner?.logo)} class="w-full!">
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

		{#if data.partner?.website}
			<Button variant="outline" href={data.partner.website} target="_blank" rel="noopener">
				<ExternalLink class="h-4 w-4" />
				Visit site
			</Button>
		{/if}

		<Delete redirect="/dashboard/partners" />
	</div>

	{#if data.partner?.showOnHome && !data.partner?.logo}
		<div
			class="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
		>
			This partner is set to show on the home page but has no logo. Upload one, or it'll appear as
			a gap in the strip.
		</div>
	{/if}

	{#if !editForm}
		<div class="flex w-full flex-col items-start justify-start gap-4 p-4">
			<SingleTable {singleTable} />

			{#if data.partner?.about}
				<article class="max-auto mx-auto w-full max-w-4xl px-6 py-12">
					<div class="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
						<h2
							class="mb-6 border-b border-slate-100 pb-4 text-3xl font-bold tracking-tight text-slate-900"
						>
							About
						</h2>

						<div
							class="prose prose-slate prose-headings:text-slate-800 prose-p:leading-relaxed prose-li:my-1 max-w-none"
						>
							{@html data.partner.about}
						</div>
					</div>
				</article>
			{/if}
		</div>
	{:else}
		<div class="w-full p-4">
			<form
				action="?/editPartner"
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
					label="Partner Name"
					placeholder="Enter Name"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="partnershipType"
					label="Partnership Type"
					placeholder="Select Type"
					items={typeItems}
					required
				/>

				<InputComp
					{form}
					{errors}
					label="Short Description"
					type="textarea"
					name="description"
					placeholder="One line for cards and listings"
					rows={3}
				/>

				<InputComp {form} {errors} label="About" type="hidden" name="about" />
				<RichTextEditor bind:value={$form.about} />

				<InputComp
					{form}
					{errors}
					type="text"
					name="website"
					label="Website"
					placeholder="https://example.org"
				/>

				<label class="flex items-center gap-2 pt-2 text-sm font-medium">
					<input
						type="checkbox"
						bind:checked={$form.showOnHome}
						class="h-4 w-4 rounded border-slate-300"
					/>
					Show in the home page partner strip
				</label>

				{#if $form.showOnHome}
					<InputComp
						{form}
						{errors}
						type="text"
						name="sortOrder"
						label="Sort Order"
						placeholder="Lower numbers appear first"
					/>
				{/if}

				<InputComp
					{form}
					{errors}
					type="file"
					name="logoUrl"
					label="Logo"
					image={data?.partner?.logo ?? ''}
					placeholder="Upload Logo"
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
	<Projects linked={data.linked} projectOptions={data.projectOptions} />
</div>