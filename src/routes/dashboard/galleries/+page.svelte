<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Frown, Plus } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $state(data.galleryList);
	$effect(() => {
		filteredList = data.galleryList;
	});

	let totalItems = $derived(data.galleryList.reduce((sum, g) => sum + g.items, 0));
	let published = $derived(data.galleryList.filter((g) => g.isPublished).length);
	let empty = $derived(data.galleryList.filter((g) => g.isEmpty).length);
</script>

<svelte:head>
	<title>Gallery List</title>
</svelte:head>

{#if data.galleryList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16 animate-bounce" />
			Gallery List is Empty
		</p>
		<Button href="/dashboard/galleries/add-gallery"><Plus />Add New Gallery</Button>
	</div>
{:else}
	<div class="my-4 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl">No of Galleries: {data.galleryList.length}</h2>
			<p class="text-muted-foreground text-sm">
				{published} published · {totalItems} item{totalItems === 1 ? '' : 's'} total
				{#if empty > 0}
					· {empty} with no media yet
				{/if}
			</p>
		</div>
		<Button href="/dashboard/galleries/add-gallery"><Plus />Add New Gallery</Button>
	</div>

	<FilterMenu
		data={data.galleryList}
		bind:filteredList
		filterKeys={['visibility', 'mediaMix', 'linkedTo', 'ministryArea']}
	/>

	<DataTable data={filteredList} {columns} fileName="Gallery List" />
{/if}