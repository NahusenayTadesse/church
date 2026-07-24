<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Save } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';

	import type { EditGallery } from './schema';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';

	let {
		data,
		images = $bindable()
	}: {
		data: SuperValidated<Infer<EditGallery>>;
		images: string[];
	} = $props();

	const { form, errors, enhance, delayed, message } = superForm(data, {
		dataType: 'json',
		resetForm: false
	});

	/* `images` is what the user sees after adding/removing — keep the form in step. */
	$effect(() => {
		$form.existing = images;
	});

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

<div class="flex flex-col items-center justify-center gap-4 pt-4">
	<form
		method="post"
		action="?/editGallery"
		use:enhance
		class="flex w-full flex-col gap-3"
		enctype="multipart/form-data"
	>
		<InputComp
			{form}
			{errors}
			type="gallery"
			name="gallery"
			label="Event Gallery"
			placeholder="Edit and upload new gallery images"
			bind:images
		/>

		<Button type="submit" size="lg">
			{#if $delayed}
				<LoadingBtn name="Saving Gallery" />
			{:else}
				<Save /> Save Changes
			{/if}
		</Button>
	</form>
</div>