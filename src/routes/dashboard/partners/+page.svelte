<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Frown, Plus } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $state(data.partnerList);
	$effect(() => {
		filteredList = data.partnerList;
	});

	let onHome = $derived(data.partnerList.filter((p) => p.showOnHome).length);
	let linked = $derived(data.partnerList.filter((p) => p.projectCount > 0).length);
	let missingLogo = $derived(data.partnerList.filter((p) => !p.logo).length);
</script>

<svelte:head>
	<title>Partner List</title>
</svelte:head>

{#if data.partnerList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16 animate-bounce" />
			Partner List is Empty
		</p>
		<Button href="/dashboard/partners/add-partner"><Plus />Add New Partner</Button>
	</div>
{:else}
	<div class="my-4 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl">No of Partners: {data.partnerList.length}</h2>
			<p class="text-muted-foreground text-sm">
				{onHome} on homepage · {linked} linked to projects
				{#if missingLogo > 0}
					· {missingLogo} missing a logo
				{/if}
			</p>
		</div>
		<Button href="/dashboard/partners/add-partner"><Plus />Add New Partner</Button>
	</div>

	<FilterMenu
		data={data.partnerList}
		bind:filteredList
		filterKeys={['partnershipType', 'homepage', 'engagement', 'hasLogo']}
	/>

	<DataTable data={filteredList} {columns} fileName="Partner List" />
{/if}