import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import ImageViewer from '$lib/components/Table/image-viewer.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import DataTableActions from './data-table-actions.svelte';
import { formatEthiopianDate } from '$lib/global.svelte';

export const columns = [
	{
		accessorKey: 'index',
		header: '#',
		cell: (info) => info.row.index + 1,
		sortable: false
	},
	{
		accessorKey: 'featuredImage',
		header: 'Featured Image',
		sortable: false,
		cell: ({ row }) =>
			renderComponent(ImageViewer, {
				src: row.original.featuredImage,
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
				link: '/dashboard/blog/single'
			})
	},
	{
		accessorKey: 'category',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Category',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'resourceType',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Type',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => (row.original.resourceType ?? '').replace('_', ' ')
	},
	{
		accessorKey: 'ministryArea',
		header: 'Ministry Area',
		sortable: true
	},
	{
		accessorKey: 'author',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Author',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => row.original.author ?? '—'
	},
	{
		accessorKey: 'speaker',
		header: 'Speaker',
		sortable: true,
		cell: ({ row }) => row.original.speaker ?? '—'
	},
	{
		accessorKey: 'status',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Status',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => renderComponent(Statuses, { status: row.original.status })
	},
	{
		accessorKey: 'publishedAt',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Published',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			row.original.publishedAt ? formatEthiopianDate(row.original.publishedAt) : '—'
	},
	{
		accessorKey: 'viewCount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Views',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'isFeaturedOnHome',
		header: 'Featured',
		sortable: true,
		cell: ({ row }) => (row.original.isFeaturedOnHome ? 'Yes' : 'No')
	},
	{
		accessorKey: 'excerpt',
		header: 'Excerpt',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.excerpt, html: true })
	},
	{
		accessorKey: 'content',
		header: 'Content',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.content, html: true })
	},
	{
		accessorKey: 'actions',
		header: '',
		sortable: false,
		cell: ({ row }) => renderComponent(DataTableActions, { id: row.original.id, name: row.original.name })
	}
];