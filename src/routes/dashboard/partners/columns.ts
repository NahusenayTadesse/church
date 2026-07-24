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
		accessorKey: 'logo',
		header: 'Logo',
		sortable: false,
		cell: ({ row }) =>
			renderComponent(ImageViewer, {
				src: row.original.logo,
				alt: row.original.name
			})
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Partner',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			renderComponent(DataTableLinks, {
				id: row.original.id,
				name: row.original.name,
				link: '/dashboard/partners/single'
			})
	},
	{
		accessorKey: 'partnershipType',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Type',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => (row.original.partnershipType ?? '').replaceAll('_', ' ')
	},
	{
		accessorKey: 'projectCount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Projects',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const { projectCount, activeProjects } = row.original;
			if (projectCount === 0) return '—';
			return activeProjects ? `${projectCount} (${activeProjects} active)` : `${projectCount}`;
		}
	},
	{
		accessorKey: 'projectNames',
		header: 'Project Names',
		sortable: false,
		cell: ({ row }) => renderComponent(BigText, { text: row.original.projectNames })
	},
	{
		accessorKey: 'roles',
		header: 'Role',
		sortable: false,
		cell: ({ row }) => row.original.roles ?? '—'
	},
	{
		accessorKey: 'website',
		header: 'Website',
		sortable: false,
		cell: ({ row }) =>
			row.original.website
				? renderComponent(DataTableLinks, {
						id: row.original.id,
						name: row.original.website.replace(/^https?:\/\//, ''),
						link: row.original.website
					})
				: '—'
	},
	{
		accessorKey: 'homepage',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Homepage',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => renderComponent(Statuses, { status: row.original.homepage })
	},
	{
		accessorKey: 'sortOrder',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Order',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
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
	{
		accessorKey: 'about',
		header: 'About',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.about, html: true })
	},

];