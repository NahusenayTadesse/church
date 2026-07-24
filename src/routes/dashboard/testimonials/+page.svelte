<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Frown, Plus, TriangleAlert } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $state(data.testimonialList);
	$effect(() => {
		filteredList = data.testimonialList;
	});

	let published = $derived(data.testimonialList.filter((t) => t.isPublished).length);
	let awaitingPermission = $derived(
		data.testimonialList.filter((t) => !t.permissionGiven).length
	);
	let readyToPublish = $derived(
		data.testimonialList.filter((t) => t.permissionGiven && !t.isPublished).length
	);
	let needsAttention = $derived(data.testimonialList.filter((t) => t.needsAttention).length);
</script>

<svelte:head>
	<title>Testimonial List</title>
</svelte:head>

{#if data.testimonialList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16 animate-bounce" />
			Testimonial List is Empty
		</p>
		<Button href="/dashboard/testimonials/add-testimonial"><Plus />Add New Story</Button>
	</div>
{:else}
	<div class="my-4 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl">No of Stories: {data.testimonialList.length}</h2>
			<p class="text-muted-foreground text-sm">
				{published} published · {readyToPublish} ready · {awaitingPermission} awaiting permission
			</p>
		</div>
		<Button href="/dashboard/testimonials/add-testimonial"><Plus />Add New Story</Button>
	</div>

	{#if needsAttention > 0}
		<div
			class="border-destructive/40 bg-destructive/10 text-destructive mb-4 flex items-center gap-3 rounded-md border p-3 text-sm"
		>
			<TriangleAlert class="h-5 w-5 shrink-0" />
			<span>
				{needsAttention} published {needsAttention === 1 ? 'story is' : 'stories are'} live without
				permission on file. Filter by <strong>published without consent</strong> to review.
			</span>
		</div>
	{/if}

	<FilterMenu
		data={data.testimonialList}
		bind:filteredList
		filterKeys={['visibility', 'consent', 'linkedTo', 'ministryArea', 'hasAvatar']}
	/>

	<DataTable data={filteredList} {columns} fileName="Testimonial List" />
{/if}