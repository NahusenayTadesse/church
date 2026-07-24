<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Frown, Plus } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $state(data.teamList);
	$effect(() => {
		filteredList = data.teamList;
	});

	let publishedCount = $derived(data.teamList.filter((m) => m.isPublished).length);
	let executives = $derived(data.teamList.filter((m) => m.isExecutive).length);
	let speakers = $derived(data.teamList.filter((m) => m.isSpeaker).length);
	let incomplete = $derived(
		data.teamList.filter((m) => m.isPublished && !m.profileComplete).length
	);
	let openPrayers = $derived(data.teamList.reduce((sum, m) => sum + m.openPrayers, 0));
</script>

<svelte:head>
	<title>Team List</title>
</svelte:head>

{#if data.teamList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16 animate-bounce" />
			Team List is Empty
		</p>
		<Button href="/dashboard/team/add-member"><Plus />Add New Member</Button>
	</div>
{:else}
	<div class="my-4 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl">No of Team Members: {data.teamList.length}</h2>
			<p class="text-muted-foreground text-sm">
				{publishedCount} published · {executives} executive · {speakers} speaker{speakers === 1
					? ''
					: 's'}
				{#if incomplete > 0}
					· {incomplete} published profile{incomplete === 1 ? '' : 's'} missing photo, position or bio
				{/if}
				{#if openPrayers > 0}
					· <a href="/dashboard/prayer-requests" class="underline">
						{openPrayers} prayer request{openPrayers === 1 ? '' : 's'} open in queues
					</a>
				{/if}
			</p>
		</div>
		<Button href="/dashboard/team/add-member"><Plus />Add New Member</Button>
	</div>

	<FilterMenu
		data={data.teamList}
		bind:filteredList
		filterKeys={['visibility', 'roleLabel', 'account', 'hasPhoto']}
	/>

	<DataTable data={filteredList} {columns} fileName="Team List" />
{/if}