<script>
	import { renderComponent } from '$lib/components/ui/data-table/index.js';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
	import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
	import DialogComp from '$lib/formComponents/DialogComp.svelte';
	import Empty from '$lib/components/Empty.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import Edit from './edit.svelte';
	 const columns = [
		{
			id: 'index',
			header: '#',
			cell: (info) => {
				const rowIndex = info.table.getRowModel().rows.findIndex((row) => row.id === info.row.id);
				return rowIndex + 1;
			},
			enableSorting: false
		},
		{
			accessorKey: 'logo',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Logo',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				// You can pass whatever you need from `row.original` to the component
				return renderComponent(ImageViewer, {
				   src: row.original.logo,
				   alt: row.original.name
				});
			}
		},
		{
			accessorKey: 'name',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Name',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				// You can pass whatever you need from `row.original` to the component
				return renderComponent(Edit, {
					id: row.original.id,
					name: row.original.name,
					action: '?/edit',
					data: data.editForm,
							logo: row.original.logo,
					icon: false
				});
			}
		},

		{
			accessorKey: 'createdBy',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Created By',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				// You can pass whatever you need from `row.original` to the component
				return renderComponent(DataTableLinks, {
					id: row.original.createdById,
					name: row.original.createdBy,
					link: '/dashboard/users'
				});
			}
		},

		{
			accessorKey: '',
			header: 'Edit',
			sortable: true,
			cell: ({ row }) => {
				// You can pass whatever you need from `row.original` to the component
				return renderComponent(Edit, {
					id: row.original.id,
					name: row.original.name,
					action: '?/edit',
					data: data.editForm,
					logo: row.original.logo,
					icon: true
				});
			}
		}
	];
	let { data } = $props();
	import { superForm } from 'sveltekit-superforms/client';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { Plus } from '@lucide/svelte';

	const { form, errors, enhance, delayed, message } = superForm(data.form, {});

	import { toast } from 'svelte-sonner';
	import ImageViewer from '$lib/components/Table/image-viewer.svelte';
	$effect(() => {
		if ($message) {
			if ($message.type === 'error') {
				toast.error($message.text);
			} else {
				toast.success($message.text);
			}
		}
	});
</script>

<svelte:head>
	<title>Payment Methods</title>
</svelte:head>

<DialogComp title="+ Add New Payment Method" variant="default">
	<form action="?/add" use:enhance id="main" class="flex flex-col gap-4" method="post" enctype="multipart/form-data">
		<InputComp {form} {errors} label="Name" type="text" name="name" required={true} />
		<InputComp {form} {errors} label="Logo" type="file" name="logo" required={true} />

		<Button type="submit" form="main">
			{#if $delayed}
				<LoadingBtn name="Adding Payment Method" />
			{:else}
				<Plus /> Add Payment Method
			{/if}
		</Button>
	</form>
</DialogComp>
{#key data?.allPaymentMethods}
	<DataTable {columns} data={data?.allPaymentMethods} search={true} fileName="Payment Methods" />
{/key}
