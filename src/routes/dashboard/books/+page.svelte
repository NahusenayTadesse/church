<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Frown, Plus } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $state(data.bookList);
	$effect(() => {
		filteredList = data.bookList;
	});

	let published = $derived(data.bookList.filter((b) => b.status === 'published').length);
	let drafts = $derived(data.bookList.filter((b) => b.status === 'draft').length);
	let pendingReviews = $derived(
		data.bookList.reduce((sum, b) => sum + b.pendingReviews, 0)
	);
</script>

<svelte:head>
	<title>Book List</title>
</svelte:head>

{#if data.bookList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16 animate-bounce" />
			Book List is Empty
		</p>
		<Button href="/dashboard/books/add-book"><Plus />Add New Book</Button>
	</div>
{:else}
	<div class="my-4 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl">No of Books: {data.bookList.length}</h2>
			<p class="text-muted-foreground text-sm">
				{published} published · {drafts} draft
				{#if pendingReviews > 0}
					· <a href="/dashboard/books/reviews" class="underline">
						{pendingReviews} review{pendingReviews === 1 ? '' : 's'} awaiting approval
					</a>
				{/if}
			</p>
		</div>
		<Button href="/dashboard/books/add-book"><Plus />Add New Book</Button>
	</div>

	<FilterMenu
		data={data.bookList}
		bind:filteredList
		filterKeys={['status', 'language', 'ministryArea', 'author', 'sellsVia']}
	/>

	<DataTable data={filteredList} {columns} fileName="Book List" />
{/if}