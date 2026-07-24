<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Frown, Plus } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $state(data.eventList);
	$effect(() => {
		filteredList = data.eventList;
	});

	let upcoming = $derived(data.eventList.filter((e) => e.timing === 'upcoming').length);
	let ongoing = $derived(data.eventList.filter((e) => e.timing === 'ongoing').length);
	let pendingRegistrations = $derived(
		data.eventList.reduce((sum, e) => sum + e.pending, 0)
	);
	let full = $derived(data.eventList.filter((e) => e.isFull && e.timing !== 'past').length);
</script>

<svelte:head>
	<title>Event List</title>
</svelte:head>

{#if data.eventList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16 animate-bounce" />
			Event List is Empty
		</p>
		<Button href="/dashboard/events/add-event"><Plus />Add New Event</Button>
	</div>
{:else}
	<div class="my-4 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl">No of Events: {data.eventList.length}</h2>
			<p class="text-muted-foreground text-sm">
				{upcoming} upcoming · {ongoing} ongoing
				{#if full > 0}
					· {full} at capacity
				{/if}
				{#if pendingRegistrations > 0}
					· <a href="/dashboard/events/registrations" class="underline">
						{pendingRegistrations} registration{pendingRegistrations === 1 ? '' : 's'} pending
					</a>
				{/if}
			</p>
		</div>
		<Button href="/dashboard/events/add-event"><Plus />Add New Event</Button>
	</div>

	<FilterMenu
		data={data.eventList}
		bind:filteredList
		filterKeys={['timing', 'status', 'eventType', 'format', 'pricing', 'ministryArea', 'organizer']}
	/>

	<DataTable data={filteredList} {columns} fileName="Event List" />
{/if}