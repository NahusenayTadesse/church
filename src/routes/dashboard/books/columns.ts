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
		accessorKey: 'coverImage',
		header: 'Cover',
		sortable: false,
		cell: ({ row }) =>
			renderComponent(ImageViewer, {
				src: row.original.coverImage,
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
				link: '/dashboard/books/single'
			})
	},
	{
		accessorKey: 'subtitle',
		header: 'Subtitle',
		sortable: false,
		cell: ({ row }) => row.original.subtitle ?? '—'
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
		accessorKey: 'language',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Language',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'ministryArea',
		header: 'Ministry Area',
		sortable: true,
		cell: ({ row }) => row.original.ministryArea ?? '—'
	},
	{
		accessorKey: 'formats',
		header: 'Formats',
		sortable: false,
		cell: ({ row }) =>
			row.original.formats.length ? row.original.formats.join(', ') : '—'
	},
	{
		accessorKey: 'price',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Price',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			row.original.price ? `${row.original.price} ${row.original.currency ?? ''}`.trim() : 'Free'
	},
	{
		accessorKey: 'sellsVia',
		header: 'Sold',
		sortable: true
	},
	{
		accessorKey: 'avgRating',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Rating',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			row.original.avgRating
				? `${row.original.avgRating} (${row.original.reviewCount})`
				: '—'
	},
	{
		accessorKey: 'downloads',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Downloads',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'pages',
		header: 'Pages',
		sortable: true,
		cell: ({ row }) => row.original.pages ?? '—'
	},
	{
		accessorKey: 'isbn',
		header: 'ISBN',
		sortable: false,
		cell: ({ row }) => row.original.isbn ?? '—'
	},
	{
		accessorKey: 'publicationDate',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Published',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			row.original.publicationDate ? formatEthiopianDate(row.original.publicationDate) : '—'
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
		accessorKey: 'isFeaturedOnHome',
		header: 'Featured',
		sortable: true,
		cell: ({ row }) => (row.original.isFeaturedOnHome ? 'Yes' : 'No')
	},
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.description, html: true })
	},

];