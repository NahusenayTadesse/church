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
		accessorKey: 'featuredImage',
		header: 'Image',
		sortable: false,
		cell: ({ row }) =>
			renderComponent(ImageViewer, {
				src: row.original.featuredImage,
				alt: row.original.name
			})
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Event',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			renderComponent(DataTableLinks, {
				id: row.original.id,
				name: row.original.name,
				link: '/dashboard/events/single'
			})
	},
	{
		accessorKey: 'eventType',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Type',
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
		accessorKey: 'startsAt',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Starts',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			row.original.startsAt ? formatEthiopianDate(row.original.startsAt) : '—'
	},
	{
		accessorKey: 'endsAt',
		header: 'Ends',
		sortable: true,
		cell: ({ row }) => (row.original.endsAt ? formatEthiopianDate(row.original.endsAt) : '—')
	},
	{
		accessorKey: 'timing',
		header: 'When',
		sortable: true
	},
	{
		accessorKey: 'format',
		header: 'Format',
		sortable: true,
		cell: ({ row }) =>
			row.original.isOnline ? 'Online' : (row.original.location ?? 'In person')
	},
	{
		accessorKey: 'organizer',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Organizer',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => row.original.organizer ?? '—'
	},
	{
		accessorKey: 'speakerCount',
		header: 'Speakers',
		sortable: true
	},
	{
		accessorKey: 'registrations',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Registrations',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			if (!row.original.registrationRequired) return 'n/a';
			const { seatsTaken, maxAttendees, registrations } = row.original;
			return maxAttendees != null
				? `${seatsTaken} / ${maxAttendees}`
				: `${registrations}`;
		}
	},
	{
		accessorKey: 'pending',
		header: 'Pending',
		sortable: true,
		cell: ({ row }) => row.original.pending || '—'
	},
	{
		accessorKey: 'waitlisted',
		header: 'Waitlist',
		sortable: true,
		cell: ({ row }) => row.original.waitlisted || '—'
	},
	{
		accessorKey: 'attended',
		header: 'Attended',
		sortable: true,
		cell: ({ row }) => row.original.attended || '—'
	},
	{
		accessorKey: 'registrationDeadline',
		header: 'Reg. Deadline',
		sortable: true,
		cell: ({ row }) =>
			row.original.registrationDeadline
				? formatEthiopianDate(row.original.registrationDeadline)
				: '—'
	},
	{
		accessorKey: 'pricing',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Cost',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			row.original.isFree
				? 'Free'
				: `${row.original.cost ?? 0} ${row.original.currency ?? ''}`.trim()
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
		accessorKey: 'photoCount',
		header: 'Photos',
		sortable: true
	},
	{
		accessorKey: 'fileCount',
		header: 'Files',
		sortable: true
	},
	{
		accessorKey: 'shortDescription',
		header: 'Description',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.shortDescription })
	},

];