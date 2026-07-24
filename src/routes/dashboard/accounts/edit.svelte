<script lang="ts">
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { SquarePen, Save } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { EditPaymentAccount as schema } from './schema';

	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import Errors from '$lib/formComponents/Errors.svelte';
	import { toast } from 'svelte-sonner';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import DialogComp from '$lib/formComponents/DialogComp.svelte';

	let {
		data,
		action = '?/edit',
		id,
		paymentMethodId,
		accountName,
		accountNumber,
		bankName,
		branch,
		swiftCode,
		currency,
		instructions,
		sortOrder,
		paymentMethodOptions = [],
		icon = false
	}: {
		data: SuperValidated<Infer<schema>>;
		action: string;
		id: number;
		paymentMethodId?: number;
		accountName: string;
		accountNumber?: string;
		bankName?: string;
		branch?: string;
		swiftCode?: string;
		currency?: string;
		instructions?: string;
		sortOrder?: number;
		paymentMethodOptions?: { id: number; name: string }[];
		icon: boolean;
	} = $props();

	const { form, errors, enhance, delayed, message, allErrors } = superForm(data, {
		resetForm: false
	});

	$form.id = id;
	$form.paymentMethodId = paymentMethodId;
	$form.accountName = accountName;
	$form.accountNumber = accountNumber;
	$form.bankName = bankName;
	$form.branch = branch;
	$form.swiftCode = swiftCode;
	$form.currency = currency;
	$form.instructions = instructions;
	$form.sortOrder = sortOrder;

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

<DialogComp title={icon ? 'Edit' : accountName} variant="ghost" IconComp={icon ? SquarePen : undefined}>
	<form {action} use:enhance method="post" id="edit" class="flex w-full flex-col gap-4 p-4">
		<Errors allErrors={$allErrors} />
		<input type="hidden" name="id" value={$form.id} />

		<label class="flex flex-col gap-1 text-sm font-medium">
			Payment Method
			<select
				name="paymentMethodId"
				bind:value={$form.paymentMethodId}
				class="rounded-md border p-2"
				required
			>
				{#each paymentMethodOptions as method}
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

		<Button type="submit" class="mt-4" form="edit">
			{#if $delayed}
				<LoadingBtn name="Saving Changes" />
			{:else}
				<Save class="h-4 w-4" />
				Save Changes
			{/if}
		</Button>
	</form>
</DialogComp>