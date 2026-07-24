<script lang="ts">
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm, dateProxy } from 'sveltekit-superforms/client';
	import { enhance as formEnhance } from '$app/forms';
	import type { Snapshot } from '@sveltejs/kit';
	import { ArrowLeft, Pencil, Save, ShieldCheck, ShieldOff, Quote } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { edit } from './schema.js';

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

	let attachedTo = $derived(
		[
			data.story?.projectName && `Project: ${data.story.projectName}`,
			data.story?.eventName && `Event: ${data.story.eventName}`,
			data.story?.ministryAreaName && `Area: ${data.story.ministryAreaName}`
		]
			.filter(Boolean)
			.join(' · ') || 'Not attached to anything'
	);

	let liveState = $derived(
		!data.story?.permissionGiven
			? 'No permission on file'
			: data.story?.isFeaturedOnHome
				? 'Published and on the home page'
				: data.story?.isPublished
					? 'Published'
					: 'Held back'
	);

	let singleTable = $derived([
		{ name: 'Name', value: data.story?.name },
		{ name: 'Position', value: data.story?.position ?? '—' },
		{ name: 'Headline', value: data.story?.title ?? '—' },
		{ name: 'Attached To', value: attachedTo },
		{ name: 'Story Date', value: showDate(data.story?.storyDate) },
		{ name: 'Permission', value: data.story?.permissionGiven ? 'On file' : 'Not recorded' },
		{ name: 'State', value: liveState },
		{ name: 'Added On', value: showDate(data.story?.createdAt) },
		{ name: 'Added By', value: data.story?.createdByName ?? '—' },
		{ name: 'Last Updated By', value: data.story?.updatedByName ?? '—' }
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

	const storyDate = dateProxy(form, 'storyDate', { format: 'date', empty: 'null' });

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
	<title>{data?.story?.name ?? 'Story'} — Testimonial</title>
</svelte:head>

<SingleView
	title={data?.story?.title || data?.story?.name}
	photo={String(data?.story?.avatar)}
	class="w-full!"
>
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

		{#if data.story?.permissionGiven}
			<form method="post" action="?/setPublished" use:formEnhance>
				{#if !data.story?.isPublished}
					<input type="hidden" name="isPublished" value="true" />
					<Button type="submit">Publish</Button>
				{:else}
					<Button type="submit" variant="outline">Unpublish</Button>
				{/if}
			</form>

			{#if data.story?.isPublished}
				<form method="post" action="?/setFeatured" use:formEnhance>
					{#if !data.story?.isFeaturedOnHome}
						<input type="hidden" name="isFeaturedOnHome" value="true" />
						<Button type="submit" variant="outline">Add to home page</Button>
					{:else}
						<Button type="submit" variant="outline">Remove from home page</Button>
					{/if}
				</form>
			{/if}
		{/if}

		<Delete redirect="/dashboard/testimonials" />
	</div>

	<!-- Permission gate -->
	{#if !data.story?.permissionGiven}
		<div class="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="flex items-start gap-3">
					<ShieldOff class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
					<div>
						<p class="font-semibold text-red-900">No permission on file</p>
						<p class="mt-1 text-sm text-red-800">
							This story stays off the public site until someone confirms {data.story?.name} agreed
							to it being shared. Only record this once you've actually asked.
						</p>
					</div>
				</div>

				<form method="post" action="?/setPermission" use:formEnhance>
					<input type="hidden" name="permissionGiven" value="true" />
					<Button type="submit">
						<ShieldCheck class="h-4 w-4" />
						Record permission
					</Button>
				</form>
			</div>
		</div>
	{:else}
		<div
			class="mx-4 mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
		>
			<span class="flex items-center gap-2">
				<ShieldCheck class="h-4 w-4 shrink-0" />
				Permission is on file for this story.
			</span>

			<form method="post" action="?/setPermission" use:formEnhance>
				<Button type="submit" variant="ghost" size="sm">Withdraw permission</Button>
			</form>
		</div>
	{/if}

	{#if data.story?.isFeaturedOnHome}
		<p class="mx-4 mt-2 text-sm text-slate-500">
			One of {data.featuredCount} stories currently on the home page.
		</p>
	{/if}

	{#if !editForm}
		<div class="flex w-full flex-col items-start justify-start gap-4 p-4">
			<SingleTable {singleTable} />

			<!-- How it reads on the site -->
			<article class="max-auto mx-auto w-full max-w-3xl px-6 py-12">
				<figure class="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
					<Quote class="h-8 w-8 text-slate-300" />

					{#if data.story?.title}
						<h2 class="mt-4 text-2xl font-bold tracking-tight text-slate-900">
							{data.story.title}
						</h2>
					{/if}

					<blockquote
						class="mt-4 text-lg leading-relaxed whitespace-pre-line text-slate-700"
					>
						{data.story?.message}
					</blockquote>

					<figcaption class="mt-6 flex flex-col items-center gap-3 border-t border-slate-100 pt-6">
						{#if data.story?.avatar}
							<img
								src="/files/{data.story.avatar}"
								alt={data.story.name}
								class="h-11 object-cover"
							/>
						{:else}
							<div
								class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-500"
							>
								{data.story?.name?.charAt(0)}
							</div>
						{/if}

						<div>
							<p class="font-medium text-slate-900">{data.story?.name}</p>
							{#if data.story?.position}
								<p class="text-sm text-slate-500">{data.story.position}</p>
							{/if}
						</div>
					</figcaption>
				</figure>
			</article>
		</div>
	{:else}
		<div class="w-full p-4">
			<form
				action="?/editStory"
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
					label="Name"
					placeholder="Who told this story"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="position"
					label="Position"
					placeholder="e.g. Parent, Bole congregation"
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="title"
					label="Headline"
					placeholder="A short line the story is listed under"
				/>

				<InputComp
					{form}
					{errors}
					label="The story"
					type="textarea"
					name="message"
					placeholder="In their own words"
					required={true}
					rows={10}
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
					name="projectId"
					label="Project"
					placeholder="Select Project"
					items={data?.projectOptions}
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

				<div class="flex w-full flex-col gap-1">
					<label for="storyDate" class="text-sm font-medium">Story date</label>
					<input
						id="storyDate"
						type="date"
						bind:value={$storyDate}
						class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
					/>
					{#if $errors.storyDate}
						<span class="text-sm text-red-600">{$errors.storyDate}</span>
					{/if}
				</div>

				<!-- Permission and visibility -->
				<div class="flex w-full flex-col gap-3 rounded-2xl bg-slate-50 p-4">
					<label class="flex items-start gap-2 text-sm font-medium">
						<input
							type="checkbox"
							bind:checked={$form.permissionGiven}
							class="mt-0.5 h-4 w-4 rounded border-slate-300"
						/>
						<span>
							{$form.name || 'This person'} agreed to their story being shared publicly
							<span class="block text-xs font-normal text-slate-500">
								Nothing below can be turned on until this is ticked.
							</span>
						</span>
					</label>

					{#if $form.permissionGiven}
						<label class="flex items-center gap-2 text-sm font-medium">
							<input
								type="checkbox"
								bind:checked={$form.isPublished}
								class="h-4 w-4 rounded border-slate-300"
							/>
							Show on the public site
						</label>

						{#if $form.isPublished}
							<label class="flex items-center gap-2 text-sm font-medium">
								<input
									type="checkbox"
									bind:checked={$form.isFeaturedOnHome}
									class="h-4 w-4 rounded border-slate-300"
								/>
								Feature on the home page
							</label>
						{/if}
					{/if}
				</div>

				<InputComp
					{form}
					{errors}
					type="file"
					name="avatarUrl"
					label="Photo"
					image={data?.story?.avatar ?? ''}
					placeholder="Upload a photo"
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
