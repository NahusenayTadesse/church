<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Frown, Plus } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $derived(data.blogList);
	// $effect(() => {
	// 	filteredList = data.blogList;
	// });

	let published = $derived(data.blogList.filter((r) => r.status === 'published').length);
	let drafts = $derived(data.blogList.filter((r) => r.status === 'draft').length);
</script>

<svelte:head>
	<title>Resource List</title>
</svelte:head>

{#if data.blogList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16 animate-bounce" />
			Resource List is Empty
		</p>
		<Button href="/dashboard/blog/add-blog"><Plus />Add New Resource</Button>
	</div>
{:else}
	<div class="my-4 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl">No of Resources: {data.blogList.length}</h2>
			<p class="text-muted-foreground text-sm">
				{published} published · {drafts} draft
			</p>
		</div>
		<Button href="/dashboard/blog/add-blog"><Plus />Add New Resource</Button>
	</div>

	<FilterMenu
		data={data.blogList}
		bind:filteredList
		filterKeys={['category', 'resourceType', 'status', 'ministryArea', 'author']}
	/>

	<DataTable data={filteredList} {columns} fileName="Resource List" />
{/if}