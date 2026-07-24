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
		accessorKey: 'cover',
		header: 'Cover',
		sortable: false,
		cell: ({ row }) =>
			renderComponent(ImageViewer, {
				src: row.original.cover,
				alt: row.original.title
			})
	},
	{
		accessorKey: 'title',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Title',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			renderComponent(DataTableLinks, {
				id: row.original.id,
				name: row.original.title,
				link: '/dashboard/galleries/single'
			})
	},
	{
		accessorKey: 'items',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Items',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => (row.original.items === 0 ? 'Empty' : row.original.items)
	},
	{
		accessorKey: 'mediaMix',
		header: 'Media',
		sortable: true,
		cell: ({ row }) => {
			const { images, videos } = row.original;
			if (!images && !videos) return '—';
			const parts = [];
			if (images) parts.push(`${images} photo${images === 1 ? '' : 's'}`);
			if (videos) parts.push(`${videos} video${videos === 1 ? '' : 's'}`);
			return parts.join(' · ');
		}
	},
	{
		accessorKey: 'linkedTo',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Linked To',
				onclick: column.getToggleSortingHandler()
			}),
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
		accessorKey: 'capturedOn',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Captured',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			row.original.capturedOn ? formatEthiopianDate(row.original.capturedOn) : '—'
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
		cell: ({ row }) =>
			row.original.createdAt ? formatEthiopianDate(row.original.createdAt) : '—'
	},
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.description })
	},

];