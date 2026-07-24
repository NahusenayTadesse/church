<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Frown, Plus } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $state(data.projectList);
	$effect(() => {
		filteredList = data.projectList;
	});

	let active = $derived(data.projectList.filter((p) => p.status === 'active').length);
	let completed = $derived(data.projectList.filter((p) => p.status === 'completed').length);
	let raised = $derived(
		data.projectList.reduce((sum, p) => sum + Number(p.fundingRaised ?? 0), 0)
	);
	let mismatched = $derived(data.projectList.filter((p) => p.fundingMismatch).length);
	let staleUpdates = $derived(
		data.projectList.filter((p) => p.status === 'active' && p.updateCount === 0).length
	);
</script>

<svelte:head>
	<title>Project List</title>
</svelte:head>

{#if data.projectList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16 animate-bounce" />
			Project List is Empty
		</p>
		<Button href="/dashboard/projects/add-project"><Plus />Add New Project</Button>
	</div>
{:else}
	<div class="my-4 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl">No of Projects: {data.projectList.length}</h2>
			<p class="text-muted-foreground text-sm">
				{active} active · {completed} completed · {raised.toLocaleString()} raised
				{#if staleUpdates > 0}
					· {staleUpdates} active with no updates posted
				{/if}
				{#if mismatched > 0}
					· {mismatched} funding total{mismatched === 1 ? '' : 's'} out of sync
				{/if}
			</p>
		</div>
		<Button href="/dashboard/projects/add-project"><Plus />Add New Project</Button>
	</div>

	<FilterMenu
		data={data.projectList}
		bind:filteredList
		filterKeys={['status', 'timing', 'funding', 'ministryArea', 'leader', 'support']}
	/>

	<DataTable data={filteredList} {columns} fileName="Project List" />
{/if}