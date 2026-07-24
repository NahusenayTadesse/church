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
		accessorKey: 'photo',
		header: 'Photo',
		sortable: false,
		cell: ({ row }) =>
			renderComponent(ImageViewer, {
				src: row.original.photo,
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
				link: '/dashboard/team/single'
			})
	},
	{
		accessorKey: 'position',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Position',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => row.original.position ?? '—'
	},
	{
		accessorKey: 'roleLabel',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Role',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'areaNames',
		header: 'Areas of Expertise',
		sortable: false,
		cell: ({ row }) => renderComponent(BigText, { text: row.original.areaNames })
	},
	{
		accessorKey: 'email',
		header: 'Email',
		sortable: true,
		cell: ({ row }) => row.original.email ?? '—'
	},
	{
		accessorKey: 'phone',
		header: 'Phone',
		sortable: false,
		cell: ({ row }) => row.original.phone ?? '—'
	},
	{
		accessorKey: 'account',
		header: 'Login',
		sortable: true,
		cell: ({ row }) => (row.original.userId ? 'Linked' : '—')
	},
	{
		accessorKey: 'socialCount',
		header: 'Socials',
		sortable: true,
		cell: ({ row }) => row.original.platforms ?? '—'
	},
	{
		accessorKey: 'authored',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Resources',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const { authored, spoke } = row.original;
			if (!authored && !spoke) return '—';
			const parts = [];
			if (authored) parts.push(`${authored} written`);
			if (spoke) parts.push(`${spoke} spoken`);
			return parts.join(' · ');
		}
	},
	{
		accessorKey: 'organized',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Events',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => row.original.organized || '—'
	},
	{
		accessorKey: 'projectsLed',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Projects Led',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const { projectsLed, activeProjectsLed } = row.original;
			if (!projectsLed) return '—';
			return activeProjectsLed ? `${projectsLed} (${activeProjectsLed} active)` : `${projectsLed}`;
		}
	},
	{
		accessorKey: 'booksWritten',
		header: 'Books',
		sortable: true,
		cell: ({ row }) => row.original.booksWritten || '—'
	},
	{
		accessorKey: 'prayersAssigned',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Prayer Queue',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const { prayersAssigned, openPrayers } = row.original;
			if (!prayersAssigned) return '—';
			return openPrayers ? `${openPrayers} open / ${prayersAssigned}` : `${prayersAssigned}`;
		}
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
		cell: ({ row }) => (row.original.createdAt ? formatEthiopianDate(row.original.createdAt) : '—')
	},
	{
		accessorKey: 'biography',
		header: 'Biography',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.biography, html: true })
	}
];