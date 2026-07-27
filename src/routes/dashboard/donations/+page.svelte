<script>
	import { renderComponent } from '$lib/components/ui/data-table/index.js';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
	import Statuses from '$lib/components/Table/statuses.svelte';

	import Receipt from './receipt.svelte';
	import UpdateStatus from './update.svelte';
	import Delete from './delete.svelte';
	import BigText from '$lib/components/Table/bigText.svelte';

	import Copy from '$lib/Copy.svelte';
	import { formatEthiopianDate as formatDate } from '$lib/global.svelte.js';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';

	let { data } = $props();

	const money = (amount, currency) =>
		`${Number(amount ?? 0).toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})} ${currency ?? 'ETB'}`;

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
			accessorKey: 'donorName',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Donor',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) =>
				row.original.isAnonymous ? 'Anonymous' : (row.original.donorName ?? '—')
		},

		{
			accessorKey: 'donorPhone',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Phone',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => renderComponent(Copy, { data: row.original.donorPhone })
		},

		{
			accessorKey: 'donorEmail',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Email',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => renderComponent(Copy, { data: row.original.donorEmail })
		},

		{
			accessorKey: 'amount',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Amount',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => money(row.original.amount, row.original.currency)
		},

		{
			accessorKey: 'causeName',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Cause',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => row.original.causeName ?? row.original.projectName ?? 'General'
		},

		{
			accessorKey: 'isRecurring',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Recurring',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) =>
				row.original.isRecurring
					? renderComponent(Statuses, { status: row.original.recurrenceInterval ?? 'Recurring' })
					: 'One-time'
		},

		{
			accessorKey: 'nextChargeAt',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Next Charge',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => (row.original.nextChargeAt ? formatDate(row.original.nextChargeAt) : '—')
		},

		{
			accessorKey: 'message',
			header: 'Message',
			sortable: true,
			cell: ({ row }) => renderComponent(BigText, { text: row.original.message })
		},

		{
			accessorKey: 'txnRef',
			header: 'Txn Ref',
			sortable: true,
			cell: ({ row }) => renderComponent(Copy, { data: row.original.txnRef })
		},

		{
			accessorKey: 'createdAt',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Donated At',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => formatDate(row.original.createdAt)
		},

		{
			accessorKey: 'status',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Status',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) =>
				renderComponent(UpdateStatus, {
					id: row.original.id,
					status: row.original.status,
					action: '?/updateStatus',
					data: data.statusForm
				})
		},

		// {
		// 	accessorKey: 'receiptSentAt',
		// 	header: ({ column }) =>
		// 		renderComponent(DataTableSort, {
		// 			name: 'Receipt',
		// 			onclick: column.getToggleSortingHandler()
		// 		}),
		// 	sortable: true,
		// 	cell: ({ row }) =>
		// 		row.original.receiptSentAt
		// 			? renderComponent(Statuses, { status: 'Sent' })
		// 			: renderComponent(Receipt, {
		// 					id: row.original.id,
		// 					action: '?/receipt',
		// 					data: data.receiptForm
		// 				})
		// },

		{
			accessorKey: '',
			header: 'Delete',
			sortable: true,
			cell: ({ row }) =>
				renderComponent(Delete, {
					id: row.original.id,
					action: '?/delete',
					data: data.deleteForm
				})
		}
	];

	let filteredList = $derived(data?.allDonations);
</script>

<svelte:head>
	<title>Donations</title>
</svelte:head>

{#key data?.allDonations}
	<FilterMenu
		data={data?.allDonations}
		bind:filteredList
		filterKeys={['status', 'causeName', 'isRecurring']}
	/>
	<DataTable {columns} data={filteredList} search={true} fileName="Donations" />
{/key}