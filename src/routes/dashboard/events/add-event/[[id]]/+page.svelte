<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';

	import {
		add as schema,
		eventTypeOptions,
		eventStatusOptions,
		currencyOptions,
		timezoneOptions
	} from './schema';

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
				if (event.paths.includes('slug')) slugEdited = true;
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
</script>

<svelte:head>
	<title>Add New Event</title>
</svelte:head>

<FormCard title="Add An Event" description="Conferences, workshops, retreats and trainings">
	<form
		use:enhance
		action="?/addEvent"
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
			label="Event Name"
			placeholder="Enter event name"
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
			name="eventType"
			label="Event Type"
			placeholder="Select type"
			items={eventTypeOptions}
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

		<!-- Schedule -->
		<p class="px-1 pt-2 text-sm font-medium">Schedule</p>

		<InputComp
			{form}
			{errors}
			type="datetime-local"
			name="startsAt"
			label="Starts At"
			placeholder="Start date and time"
			required
		/>

		<InputComp
			{form}
			{errors}
			type="datetime-local"
			name="endsAt"
			label="Ends At"
			placeholder="Leave blank for a single-session event"
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="timezone"
			label="Timezone"
			placeholder="Select timezone"
			items={timezoneOptions}
		/>

		<!-- Where -->
		<p class="px-1 pt-2 text-sm font-medium">Location</p>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="isOnline"
			label="Online"
			placeholder="This event is held online"
		/>

		{#if $form.isOnline}
			<InputComp
				{form}
				{errors}
				type="url"
				name="onlineMeetingLink"
				label="Meeting Link"
				placeholder="Zoom, Meet or YouTube Live URL"
				required
			/>
		{/if}

		<InputComp
			{form}
			{errors}
			type="text"
			name="location"
			label="Venue"
			placeholder="e.g. Millennium Hall, Addis Ababa"
			required={!$form.isOnline}
		/>

		<InputComp
			{form}
			{errors}
			type="url"
			name="locationMapUrl"
			label="Map Link"
			placeholder="Google Maps URL"
		/>

		<!-- People -->
		<p class="px-1 pt-2 text-sm font-medium">People</p>

		<InputComp
			{form}
			{errors}
			type="select"
			name="organizer"
			label="Organizer"
			placeholder="Select organizer"
			items={data?.people}
		/>

		<!--
			Speakers post as repeated `speakers` fields so superforms parses them into
			an array; `bind:group` keeps the ids numeric on the client.
		-->
		<div class="flex w-full max-w-full flex-col justify-start gap-2 p-1">
			<Label>Speakers</Label>
			{#if data.speakers?.length}
				<div class="grid gap-2 sm:grid-cols-2">
					{#each data.speakers as person (person.value)}
						<label class="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name="speakers"
								value={person.value}
								bind:group={$form.speakers}
								class="size-4 rounded border-input accent-primary"
							/>
							{person.name}
						</label>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">
					No one is flagged as a speaker yet. Turn on "Speaker" for a team member, or add guest
					speakers once the event is saved.
				</p>
			{/if}
			<p class="text-xs text-muted-foreground">
				Everyone selected is added as a speaker. Change roles or add guests from the event page.
			</p>
		</div>

		<!-- Registration -->
		<p class="px-1 pt-2 text-sm font-medium">Registration</p>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="registrationRequired"
			label="Registration"
			placeholder="Attendees must register for this event"
		/>

		{#if $form.registrationRequired}
			<InputComp
				{form}
				{errors}
				type="datetime-local"
				name="registrationDeadline"
				label="Registration Closes"
				placeholder="Leave blank to accept registrations until the event starts"
			/>

			<InputComp
				{form}
				{errors}
				type="number"
				name="maxAttendees"
				label="Capacity"
				placeholder="Leave blank for unlimited seats"
				min="1"
			/>
		{/if}

		<!-- Cost -->
		<p class="px-1 pt-2 text-sm font-medium">Cost</p>

		<InputComp
			{form}
			{errors}
			type="checkboxSingle"
			name="isFree"
			label="Free"
			placeholder="This event is free to attend"
		/>

		{#if !$form.isFree}
			<InputComp
				{form}
				{errors}
				type="number"
				name="cost"
				label="Cost"
				placeholder="0.00"
				min="0"
				required
			/>

			<InputComp
				{form}
				{errors}
				type="select"
				name="currency"
				label="Currency"
				placeholder="Select currency"
				items={currencyOptions}
			/>
		{/if}

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
			name="brochure"
			label="Brochure or Schedule"
			placeholder="Upload a PDF or handout"
		/>

		<InputComp
			{form}
			{errors}
			type="select"
			name="status"
			label="Status"
			placeholder="Select status"
			items={eventStatusOptions}
			required
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
				<LoadingBtn name="Adding Event" />
			{:else}
				<Plus /> Add Event
			{/if}
		</Button>
	</form>
</FormCard>