<script lang="ts">
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import { enhance as formEnhance } from '$app/forms';
	import type { Snapshot } from '@sveltejs/kit';
	import { ArrowLeft, Pencil, Save, EyeOff } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { edit } from './schema.js';
	import Socials from './socials.svelte';
	import Involvement from './involvement.svelte';

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

	const showDate = (v: string | Date | null | undefined) =>
		v ? formatEthiopianDate(new Date(v)) : '—';

	const accountItems = $derived(
		data.accountOptions.map((a) => ({
			value: a.value,
			name: a.email ? `${a.name} (${a.email})` : a.name
		}))
	);

	let selectedAreas = $state<number[]>([]);

	/* Reset the checkboxes whenever the saved set changes. */
	$effect(() => {
		selectedAreas = data.areas.map((a) => a.id);
	});

	let singleTable = $derived([
		{ name: 'Name', value: data.member?.name },
		{ name: 'Position', value: data.member?.position ?? '—' },
		{ name: 'Email', value: data.member?.email ?? '—' },
		{ name: 'Phone', value: data.member?.phone ?? '—' },
		{
			name: 'Login Account',
			value: data.member?.accountName
				? `${data.member.accountName}${data.member.accountEmail ? ` (${data.member.accountEmail})` : ''}`
				: 'Not linked'
		},
		{
			name: 'Areas of Expertise',
			value: data.areas.length ? data.areas.map((a) => a.name).join(', ') : '—'
		},
		{
			name: 'Roles',
			value:
				[data.member?.isExecutive && 'Executive', data.member?.isSpeaker && 'Speaker']
					.filter(Boolean)
					.join(', ') || 'Team member'
		},
		{ name: 'Published', value: data.member?.isPublished ? 'Yes' : 'No' },
		{ name: 'Sort Order', value: data.member?.sortOrder ?? 0 },
		{ name: 'Added On', value: showDate(data.member?.createdAt) },
		{ name: 'Added By', value: data.member?.createdByName ?? '—' },
		{ name: 'Last Updated By', value: data.member?.updatedByName ?? '—' }
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
	<title>{data?.member?.name ?? 'Team member'} — Team Details</title>
</svelte:head>

<SingleView title={data?.member?.name} photo={String(data?.member?.photo)} class="w-full!">
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

		{#if data.member?.isPublished}
			<form method="post" action="?/unpublish" use:formEnhance>
				<Button type="submit" variant="outline">
					<EyeOff class="h-4 w-4" />
					Hide from site
				</Button>
			</form>
		{/if}

		<Delete redirect="/dashboard/team" />
	</div>

	{#if data.blockingCount > 0}
		<div
			class="mx-4 mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
		>
			This person is attached to other records, so they can't be deleted until those are
			reassigned. Hiding the profile is usually what you want instead — it keeps their name on
			everything they've written.
		</div>
	{/if}

	{#if !data.member?.isPublished}
		<div
			class="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
		>
			This profile is hidden from the public site. It still appears in dashboard pickers.
		</div>
	{/if}

	{#if !editForm}
		<div class="flex w-full flex-col items-start justify-start gap-4 p-4">
			<SingleTable {singleTable} />

			{#if data.member?.biography}
				<article class="max-auto mx-auto w-full max-w-4xl px-6 py-12">
					<div class="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
						<h2
							class="mb-6 border-b border-slate-100 pb-4 text-3xl font-bold tracking-tight text-slate-900"
						>
							Biography
						</h2>

						<div
							class="prose prose-slate prose-headings:text-slate-800 prose-p:leading-relaxed prose-li:my-1 max-w-none"
						>
							{@html data.member.biography}
						</div>
					</div>
				</article>
			{/if}
		</div>
	{:else}
		<div class="w-full p-4">
			<form
				action="?/editMember"
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
					label="Full Name"
					placeholder="Enter Name"
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

				<InputComp {form} {errors} label="Biography" type="hidden" name="biography" />
				<RichTextEditor bind:value={$form.biography} />

				<div class="grid w-full gap-4 sm:grid-cols-2">
					<InputComp
						{form}
						{errors}
						type="text"
						name="email"
						label="Public Email"
						placeholder="name@example.org"
					/>

					<InputComp
						{form}
						{errors}
						type="text"
						name="phone"
						label="Phone"
						placeholder="+251..."
					/>
				</div>

				<InputComp
					{form}
					{errors}
					type="select"
					name="userId"
					label="Login Account"
					placeholder="Link a login account (optional)"
					items={accountItems}
				/>

				<div class="flex flex-col gap-3 py-2">
					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.isExecutive}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Executive team
					</label>

					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.isSpeaker}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Available as a speaker
					</label>

					<label class="flex items-center gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.isPublished}
							class="h-4 w-4 rounded border-slate-300"
						/>
						Show on the public site
					</label>
				</div>

				<InputComp
					{form}
					{errors}
					type="text"
					name="sortOrder"
					label="Sort Order"
					placeholder="Lower numbers appear first"
				/>

				<InputComp
					{form}
					{errors}
					type="file"
					name="photoUrl"
					label="Photo"
					image={data?.member?.photo ?? ''}
					placeholder="Upload Photo"
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
	<!-- Areas of expertise -->
	<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
		<div class="border-b border-gray-100 p-6">
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Expertise</nav>
			<h2 class="text-2xl font-bold tracking-tight">Ministry areas</h2>
		</div>

		<div class="p-6">
			{#if data.allAreas.length === 0}
				<p class="text-sm text-slate-500">
					No ministry areas exist yet. Create some first and they'll show up here.
				</p>
			{:else}
				<form method="post" action="?/setAreas" use:formEnhance>
					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#each data.allAreas as area (area.id)}
							<label class="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									name="ministryAreaIds"
									value={area.id}
									checked={selectedAreas.includes(area.id)}
									class="h-4 w-4 rounded border-slate-300"
								/>
								{area.name}
							</label>
						{/each}
					</div>

					<Button type="submit" class="mt-6"><Save class="h-4 w-4" /> Save areas</Button>
				</form>
			{/if}
		</div>
	</section>

	<Socials socials={data.socials} />

	<Involvement involvement={data.involvement} />
</div>
