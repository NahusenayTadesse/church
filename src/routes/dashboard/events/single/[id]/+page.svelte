<script lang="ts">
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm, dateProxy } from 'sveltekit-superforms/client';
	import type { Snapshot } from '@sveltejs/kit';
	import { ArrowLeft, Pencil, Save } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { edit, eventTypes, eventStatuses } from './schema.js';
	import Speakers from './speakers.svelte';
	import Downloads from './downloads.svelte';
	import Registrations from './registrations.svelte';
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

	const typeItems = eventTypes.map((value) => ({ value, name: label(value) }));
	const statusItems = eventStatuses.map((value) => ({ value, name: label(value) }));

	const showDate = (v: string | Date | null | undefined) =>
		v ? formatEthiopianDate(new Date(v)) : '—';

	const showTime = (v: string | Date | null | undefined) =>
		v
			? new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
			: '';

	const showWhen = (v: string | Date | null | undefined) =>
		v ? `${showDate(v)} ${showTime(v)}`.trim() : '—';

	/* What the calendar says, next to what the record says. A mismatch usually
	   means someone forgot to move the event on after it happened. */
	let impliedStatus = $derived.by(() => {
		const e = data.event;
		if (!e?.startsAt || e.status === 'draft' || e.status === 'cancelled') return null;

		const now = new Date();
		const start = new Date(e.startsAt);
		const end = e.endsAt ? new Date(e.endsAt) : start;

		if (now < start) return 'upcoming';
		if (now > end) return 'completed';
		return 'ongoing';
	});

	let statusDrifted = $derived(!!impliedStatus && impliedStatus !== data.event?.status);

	let singleTable = $derived([
		{ name: 'Name', value: data.event?.name },
		{ name: 'Slug', value: data.event?.slug },
		{ name: 'Type', value: label(data.event?.eventType ?? 'other') },
		{ name: 'Ministry Area', value: data.event?.ministryAreaName ?? '—' },
		{ name: 'Starts', value: showWhen(data.event?.startsAt) },
		{ name: 'Ends', value: showWhen(data.event?.endsAt) },
		{ name: 'Timezone', value: data.event?.timezone ?? '—' },
		{
			name: 'Where',
			value: data.event?.isOnline
				? (data.event?.onlineMeetingLink ?? 'Online')
				: (data.event?.location ?? '—')
		},
		{ name: 'Organizer', value: data.event?.organizerName ?? '—' },
		{ name: 'Short Description', value: data.event?.shortDescription ?? '—' },
		{
			name: 'Registration',
			value: data.event?.registrationRequired
				? `Required — closes ${showWhen(data.event?.registrationDeadline)}`
				: 'Not required'
		},
		{
			name: 'Capacity',
			value:
				typeof data.event?.maxAttendees === 'number'
					? `${data.seatsTaken} of ${data.event.maxAttendees} seats taken`
					: `${data.seatsTaken} seats taken (no limit set)`
		},
		{
			name: 'Cost',
			value: data.event?.isFree
				? 'Free'
				: `${data.event?.cost ?? '—'} ${data.event?.currency ?? 'ETB'}`
		},
		{ name: 'Status', value: label(data.event?.status ?? 'draft') },
		{ name: 'Featured On Home', value: data.event?.isFeaturedOnHome ? 'Yes' : 'No' },
		{ name: 'Added On', value: showDate(data.event?.createdAt) },
		{ name: 'Added By', value: data.event?.createdByName ?? '—' },
		{ name: 'Last Updated By', value: data.event?.updatedByName ?? '—' }
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

	const startsAt = dateProxy(form, 'startsAt', { format: 'datetime-local' });
	const endsAt = dateProxy(form, 'endsAt', { format: 'datetime-local', empty: 'null' });
	const registrationDeadline = dateProxy(form, 'registrationDeadline', {
		format: 'datetime-local',
		empty: 'null'
	});

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
	<title>{data?.event?.name ?? 'Event'} — Event Details</title>
</svelte:head>

<SingleView title={data?.event?.name} photo={String(data?.event?.featuredImage)} class="w-full!">
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

		<Delete redirect="/dashboard/events" />
	</div>

	{#if statusDrifted && !editForm}
		<div class="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
			The schedule says this event is <strong>{impliedStatus}</strong>, but it's saved as
			<strong>{data.event?.status}</strong>. Update the status so the public site matches.
		</div>
	{/if}

	{#if !editForm}
		<div class="flex w-full flex-col items-start justify-start gap-4 p-4">
			<SingleTable {singleTable} />

			<article class="max-auto mx-auto w-full max-w-4xl px-6 py-12">
				<div class="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
					<h2
						class="mb-6 border-b border-slate-100 pb-4 text-3xl font-bold tracking-tight text-slate-900"
					>
						About this event
					</h2>

					<div
						class="prose prose-slate prose-headings:text-slate-800 prose-p:leading-relaxed prose-li:my-1 max-w-none"
					>
						{@html data?.event?.fullDescription}
					</div>
				</div>
			</article>
		</div>
	{:else}
		<div class="w-full p-4">
			<form
				action="?/editEvent"
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
					label="Event Name"
					placeholder="Enter Name"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="text"
					name="slug"
					label="Event Slug"
					placeholder="e.g. marriage-retreat-2026"
					required
				/>

				<InputComp
					{form}
					{errors}
					type="select"
					name="eventType"
					label="Event Type"
					placeholder="Select Type"
					items={typeItems}
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
					name="organizerId"
					label="Organizer"
					placeholder="Select Organizer"
					items={data?.people}
				/>

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

				<!-- Schedule -->
				<div class="grid w-full gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1">
						<label for="startsAt" class="text-sm font-medium">Starts</label>
						<input id="startsAt" type="datetime-local" bind:value={$startsAt} class={fieldClass} />
						{#if $errors.startsAt}
							<span class="text-sm text-red-600">{$errors.startsAt}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-1">
						<label for="endsAt" class="text-sm font-medium">Ends</label>
						<input id="endsAt" type="datetime-local" bind:value={$endsAt} class={fieldClass} />
						{#if $errors.endsAt}
							<span class="text-sm text-red-600">{$errors.endsAt}</span>
						{/if}
					</div>
				</div>

				<InputComp
					{form}
					{errors}
					type="text"
					name="timezone"
					label="Timezone"
					placeholder="Africa/Addis_Ababa"
				/>

				<!-- Where -->
				<label class="flex items-center gap-2 pt-2 text-sm font-medium">
					<input
						type="checkbox"
						bind:checked={$form.isOnline}
						class="h-4 w-4 rounded border-slate-300"
					/>
					This event happens online
				</label>

				{#if $form.isOnline}
					<InputComp
						{form}
						{errors}
						type="text"
						name="onlineMeetingLink"
						label="Meeting Link"
						placeholder="https://meet.google.com/..."
						required
					/>
				{:else}
					<InputComp
						{form}
						{errors}
						type="text"
						name="location"
						label="Location"
						placeholder="e.g. Bole Ledeta, Addis Ababa"
						required
					/>

					<InputComp
						{form}
						{errors}
						type="text"
						name="locationMapUrl"
						label="Map Link"
						placeholder="https://maps.google.com/..."
					/>
				{/if}

				<!-- Registration -->
				<label class="flex items-center gap-2 pt-2 text-sm font-medium">
					<input
						type="checkbox"
						bind:checked={$form.registrationRequired}
						class="h-4 w-4 rounded border-slate-300"
					/>
					People have to register to attend
				</label>

				{#if $form.registrationRequired}
					<div class="grid w-full gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-1">
							<label for="registrationDeadline" class="text-sm font-medium">
								Registration closes
							</label>
							<input
								id="registrationDeadline"
								type="datetime-local"
								bind:value={$registrationDeadline}
								class={fieldClass}
							/>
							{#if $errors.registrationDeadline}
								<span class="text-sm text-red-600">{$errors.registrationDeadline}</span>
							{/if}
						</div>

						<InputComp
							{form}
							{errors}
							type="text"
							name="maxAttendees"
							label="Maximum Attendees"
							placeholder="Leave empty for no limit"
						/>
					</div>
				{/if}

				<!-- Cost -->
				<label class="flex items-center gap-2 pt-2 text-sm font-medium">
					<input
						type="checkbox"
						bind:checked={$form.isFree}
						class="h-4 w-4 rounded border-slate-300"
					/>
					Free to attend
				</label>

				{#if !$form.isFree}
					<div class="grid w-full gap-4 sm:grid-cols-2">
						<InputComp
							{form}
							{errors}
							type="text"
							name="cost"
							label="Cost"
							placeholder="e.g. 500"
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
				{/if}

				<InputComp
					{form}
					{errors}
					type="select"
					name="status"
					label="Status"
					placeholder="Select Status"
					items={statusItems}
				/>

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
					image={data?.event?.featuredImage ?? ''}
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
	<Speakers speakers={data.speakers} people={data.people} />

	<Registrations
		registrations={data.registrations}
		counts={data.counts}
		seatsTaken={data.seatsTaken}
		seatsLeft={data.seatsLeft}
		maxAttendees={data.event?.maxAttendees}
		isFree={data.event?.isFree}
	/>

	<Downloads downloads={data.downloads} />

	<!-- Gallery -->
	<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
		<div class="border-b border-gray-100 p-6">
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Gallery</nav>
			<h2 class="text-2xl font-bold tracking-tight">Photos from this event</h2>
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
				<Gallery {images} title={data?.event?.name} />
			{:else}
				<EditGallery data={data?.galleryEdit} bind:images />
			{/if}
		</div>
	</section>
</div>