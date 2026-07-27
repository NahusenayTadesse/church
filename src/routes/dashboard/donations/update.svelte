<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import Statuses from '$lib/components/Table/statuses.svelte';
	import { PencilLine } from '@lucide/svelte';

	import { donationStatuses, type UpdateDonationStatus as schema } from './schema';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';

	let {
		data,
		action = '?/updateStatus',
		id,
		status
	}: {
		data: SuperValidated<Infer<schema>>;
		action?: string;
		id: number;
		status: (typeof donationStatuses)[number];
	} = $props();

	const { form, enhance, delayed, message, allErrors } = superForm(data, {
		resetForm: false,
		id: `status-${id}`,
		onUpdated: ({ form }) => {
			if (form.valid) open = false;
		}
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
	$form.status = status;

	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class="flex items-center gap-2">
		<Statuses {status} />
		<PencilLine class="size-4 opacity-60" />
	</Dialog.Trigger>
	<Dialog.Content class="w-full">
		<Dialog.Header>
			<Dialog.Title>Update donation status</Dialog.Title>
		</Dialog.Header>
		<ScrollArea class="h-auto rounded-md border p-2">
			<form method="post" id={`status-${id}`} {action} use:enhance>
				<Errors allErrors={$allErrors} />

				<div class="flex flex-col gap-2 p-2">
					{#each donationStatuses as option (option)}
						<label class="flex cursor-pointer items-center gap-2 rounded-md border p-2">
							<input type="radio" name="status" value={option} bind:group={$form.status} />
							<span class="capitalize">{option}</span>
						</label>
					{/each}
				</div>

				<input bind:value={$form.id} name="id" type="hidden" />

				<div class="flex flex-row items-end justify-center gap-4 pt-2">
					<Button type="submit" class="mt-4" form={`status-${id}`}>
						{#if $delayed}
							<LoadingBtn name="Saving" />
						{:else}
							Save
						{/if}
					</Button>
					<Button variant="outline" onclick={() => (open = false)} class="mt-4">Cancel</Button>
				</div>
			</form>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>