<script>
	import { renderComponent } from '$lib/components/ui/data-table/index.js';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
	import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
	import DialogComp from '$lib/formComponents/DialogComp.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import Edit from './edit.svelte';
	import Delete from './delete.svelte';
	import BigText from './bigText.svelte';

	let { data } = $props();

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
			accessorKey: 'accountName',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Account Name',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return renderComponent(Edit, {
					id: row.original.id,
					paymentMethodId: row.original.paymentMethodId,
					accountName: row.original.accountName,
					accountNumber: row.original.accountNumber,
					bankName: row.original.bankName,
					branch: row.original.branch,
					swiftCode: row.original.swiftCode,
					currency: row.original.currency,
					instructions: row.original.instructions,
					sortOrder: row.original.sortOrder,
					paymentMethodOptions: data?.allPaymentMethodOptions ?? [],
					action: '?/edit',
					data: data.editForm,
					icon: false
				});
			}
		},
		{
			accessorKey: 'paymentMethodName',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Payment Method',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true
		},
		{
			accessorKey: 'accountNumber',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Account Number',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true
		},
		{ accessorKey: 'bankName', header: 'Bank', sortable: true },
		{ accessorKey: 'branch', header: 'Branch', sortable: true },
		{ accessorKey: 'swiftCode', header: 'SWIFT', sortable: true },
		{ accessorKey: 'currency', header: 'Currency', sortable: true },
		{
			accessorKey: 'instructions',
			header: 'Instructions',
			cell: ({ row }) => renderComponent(BigText, { text: row.original.instructions })
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
			accessorKey: 'createdBy',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Created By',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return renderComponent(DataTableLinks, {
					id: row.original.createdById,
					name: row.original.createdBy,
					link: '/dashboard/users'
				});
			}
		},
		{
			accessorKey: '',
			header: 'Delete',
			cell: ({ row }) => {
				return renderComponent(Delete, {
					id: row.original.id,
					action: '?/delete',
					data: data.deleteForm
				});
			}
		}
	];

	import { superForm } from 'sveltekit-superforms/client';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { Plus } from '@lucide/svelte';

	const { form, errors, enhance, delayed, message } = superForm(data.form, {});

	import { toast } from 'svelte-sonner';
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
	<title>Payment Accounts</title>
</svelte:head>

{#key data?.allPaymentAccounts}
	<DialogComp title="+ Add New Payment Account" variant="default">
		<form action="?/add" use:enhance id="main" class="flex flex-col gap-4" method="post">
			<label class="flex flex-col gap-1 text-sm font-medium">
				Payment Method
				<select
					name="paymentMethodId"
					bind:value={$form.paymentMethodId}
					class="rounded-md border p-2"
					required
				>
					<option value="" disabled selected>Select a payment method</option>
					{#each data?.allPaymentMethodOptions ?? [] as method}
						<option value={method.id}>{method.name}</option>
					{/each}
				</select>
				{#if $errors.paymentMethodId}
					<span class="text-sm text-destructive">{$errors.paymentMethodId}</span>
				{/if}
			</label>

			<InputComp {form} {errors} label="Account Name" type="text" name="accountName" required={true} />
			<InputComp {form} {errors} label="Account Number" type="text" name="accountNumber" required={true} />
			<InputComp {form} {errors} label="Bank Name" type="text" name="bankName" />
			<InputComp {form} {errors} label="Branch" type="text" name="branch" />
			<InputComp {form} {errors} label="SWIFT Code" type="text" name="swiftCode" />
			<InputComp {form} {errors} label="Currency" type="text" name="currency" />
			<InputComp {form} {errors} label="Instructions" type="textarea" name="instructions" />
			<InputComp {form} {errors} label="Sort Order" type="number" name="sortOrder" />

			<Button type="submit" form="main">
				{#if $delayed}
					<LoadingBtn name="Adding Payment Account" />
				{:else}
					<Plus /> Add Payment Account
				{/if}
			</Button>
		</form>
	</DialogComp>

	<DataTable {columns} data={data?.allPaymentAccounts} search={true} fileName="PaymentAccount" />
{/key}