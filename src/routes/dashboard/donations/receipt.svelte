<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import type { MarkReceiptSent as schema } from './schema';

	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { Receipt } from '@lucide/svelte';

	let {
		data,
		id
	}: {
		data: SuperValidated<Infer<schema>>;
		id: number;
	} = $props();

	const { form, enhance, delayed, message } = superForm(data, {
		resetForm: false,
		id: `receipt-${id}`
	});

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

	$form.id = id;
</script>

<form
	method="post"
	id={`receipt-${id}`}
	class="-mt-4 flex h-full flex-col items-start justify-start"
	action="?/receipt"
	use:enhance
>
	<Button type="submit" size="sm" variant="outline" class="mt-4" form={`receipt-${id}`}>
		{#if $delayed}
			<LoadingBtn name="Sending Receipt" />
		{:else}
			<Receipt /> Send Receipt
		{/if}
	</Button>
	<input bind:value={$form.id} name="id" type="hidden" />
</form>