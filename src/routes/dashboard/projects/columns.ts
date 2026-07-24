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
				name: 'Project',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) =>
			renderComponent(DataTableLinks, {
				id: row.original.id,
				name: row.original.name,
				link: '/dashboard/projects/single'
			})
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
		accessorKey: 'ministryArea',
		header: 'Ministry Area',
		sortable: true,
		cell: ({ row }) => row.original.ministryArea ?? '—'
	},
	{
		accessorKey: 'leader',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Leader',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => row.original.leader ?? '—'
	},
	{
		accessorKey: 'location',
		header: 'Location',
		sortable: true,
		cell: ({ row }) => row.original.location ?? '—'
	},
	{
		accessorKey: 'startDate',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Start',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => (row.original.startDate ? formatEthiopianDate(row.original.startDate) : '—')
	},
	{
		accessorKey: 'endDate',
		header: 'End',
		sortable: true,
		cell: ({ row }) => (row.original.endDate ? formatEthiopianDate(row.original.endDate) : '—')
	},
	{
		accessorKey: 'timing',
		header: 'Timing',
		sortable: true
	},
	{
		accessorKey: 'fundingRaised',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Funding',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const { fundingGoal, fundingRaised, currency, fundingPercent } = row.original;
			if (!fundingGoal) return fundingRaised ? `${fundingRaised} ${currency ?? ''}`.trim() : '—';
			return `${fundingRaised ?? 0} / ${fundingGoal} ${currency ?? ''} (${fundingPercent}%)`.trim();
		}
	},
	{
		accessorKey: 'donationCount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Donations',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const { donationCount, donatedTotal, currency, fundingMismatch } = row.original;
			if (!donationCount) return '—';
			const base = `${donationCount} · ${donatedTotal} ${currency ?? ''}`.trim();
			// nudge to run "Sync funding" when the stored total has drifted
			return fundingMismatch ? `${base} ⚠` : base;
		}
	},
	{
		accessorKey: 'reachedBeneficiaries',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Beneficiaries',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const { reachedBeneficiaries, targetBeneficiaries, beneficiaryPercent } = row.original;
			if (!targetBeneficiaries) return reachedBeneficiaries || '—';
			return `${reachedBeneficiaries ?? 0} / ${targetBeneficiaries} (${beneficiaryPercent}%)`;
		}
	},
	{
		accessorKey: 'waysLabel',
		header: 'Accepts',
		sortable: true
	},
	{
		accessorKey: 'partnerCount',
		header: 'Partners',
		sortable: true,
		cell: ({ row }) => row.original.partnerCount || '—'
	},
	{
		accessorKey: 'updateCount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Updates',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const { updateCount, lastUpdateAt } = row.original;
			if (!updateCount) return '—';
			return lastUpdateAt
				? `${updateCount} · last ${formatEthiopianDate(lastUpdateAt)}`
				: `${updateCount}`;
		}
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
		accessorKey: 'isFeaturedOnHome',
		header: 'Featured',
		sortable: true,
		cell: ({ row }) => (row.original.isFeaturedOnHome ? 'Yes' : 'No')
	},
	{
		accessorKey: 'shortDescription',
		header: 'Description',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.shortDescription })
	},
	{
		accessorKey: 'impactResults',
		header: 'Impact',
		cell: ({ row }) => renderComponent(BigText, { text: row.original.impactResults })
	}

];