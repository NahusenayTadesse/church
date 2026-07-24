import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import ImageViewer from '$lib/components/Table/image-viewer.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import { formatEthiopianDate } from '$lib/global.svelte';

export const columns = [
	{
		accessorKey: 'index',
		header: '#',
		cell: (info) => info.row.index + 1,
		sortable: false
	},
	{
		accessorKey: 'avatar',
		header: 'Photo',
		sortable: false,
		cell: ({ row }) =>
			renderComponent(ImageViewer, {
				src: row.original.avatar,
				alt: row.original.name
			})
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Name',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			renderComponent(DataTableLinks, {
				id: row.original.id,
				name: row.original.name,
				link: '/dashboard/testimonials/single'
			})
	},
	{
		accessorKey: 'position',
		header: 'Position',
		sortable: true,
		cell: ({ row }) => row.original.position ?? '—'
	},
	{
		accessorKey: 'title',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Headline',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => row.original.title ?? '—'
	},
	{
		accessorKey: 'consent',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Permission',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			renderComponent(Statuses, {
				status: row.original.permissionGiven ? 'given' : 'not given'
			})
	},
	{
		accessorKey: 'visibility',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Visibility',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => renderComponent(Statuses, { status: row.original.visibility })
	},
	{
		accessorKey: 'linkedTo',
		header: 'Linked To',
		sortable: true,
		cell: ({ row }) =>
			row.original.linkedName
				? `${row.original.linkedTo}: ${row.original.linkedName}`
				: 'Standalone'
	},
	{
		accessorKey: 'ministryArea',
		header: 'Ministry Area',
		sortable: true,
		cell: ({ row }) => row.original.ministryArea ?? '—'
	},
	{
		accessorKey: 'storyDate',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Story Date',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => (row.original.storyDate ? formatEthiopianDate(row.original.storyDate) : '—')
	},
	{
		accessorKey: 'isFeaturedOnHome',
		header: 'Featured',
		sortable: true,
		cell: ({ row }) => (row.original.isFeaturedOnHome ? 'Yes' : 'No')
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Added',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => (row.original.createdAt ? formatEthiopianDate(row.original.createdAt) : '—')
	},
	{
		accessorKey: 'message',
		header: 'Story',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.message })
	},

];