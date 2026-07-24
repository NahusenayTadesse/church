<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Save, Trash2, ExternalLink } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button/index.js';

	type LinkedPartner = {
		linkId: number;
		role: string | null;
		id: number;
		name: string;
		logo: string | null;
		partnershipType: string | null;
	};

	let {
		linked = [],
		partnerOptions = []
	}: {
		linked: LinkedPartner[];
		partnerOptions: { value: number; name: string }[];
	} = $props();

	const label = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

	let adding = $state(false);
	let editingId = $state<number | null>(null);

	const fieldClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
</script>

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-6">
		<div>
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Partners</nav>
			<h2 class="text-2xl font-bold tracking-tight">Who's working on this with us</h2>
		</div>

		{#if partnerOptions.length > 0}
			<Button onclick={() => (adding = !adding)}>
				<Plus class="h-4 w-4" />
				{adding ? 'Cancel' : 'Link a partner'}
			</Button>
		{/if}
	</div>

	<div class="p-6">
		{#if adding}
			<form
				method="post"
				action="?/linkPartner"
				use:enhance={() => async ({ update }) => {
					adding = false;
					await update();
				}}
				class="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-slate-50 p-4"
			>
				<div class="flex min-w-56 flex-1 flex-col gap-1">
					<label for="link-partner" class="text-sm font-medium">Partner</label>
					<select id="link-partner" name="partnerId" required class={fieldClass}>
						<option value="">Select a partner</option>
						{#each partnerOptions as option (option.value)}
							<option value={option.value}>{option.name}</option>
						{/each}
					</select>
				</div>

				<div class="flex min-w-56 flex-1 flex-col gap-1">
					<label for="link-partner-role" class="text-sm font-medium">Role on this project</label>
					<input
						id="link-partner-role"
						name="role"
						maxlength="150"
						placeholder="e.g. Funding partner, Training delivery"
						class={fieldClass}
					/>
				</div>

				<Button type="submit"><Save class="h-4 w-4" /> Link</Button>
			</form>
		{/if}

		{#if linked.length === 0}
			<p class="text-sm text-slate-500">No partners linked to this project yet.</p>
		{:else}
			<ul class="divide-y divide-slate-100">
				{#each linked as row (row.linkId)}
					<li class="py-4">
						<div class="flex flex-wrap items-start justify-between gap-4">
							<div class="flex min-w-0 items-start gap-3">
								{#if row.logo}
									<img
										src={row.logo}
										alt={row.name}
										class="h-12 w-12 shrink-0 rounded-lg bg-white object-contain p-1 ring-1 ring-slate-200"
										loading="lazy"
									/>
								{:else}
									<div
										class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-500"
									>
										{row.name.charAt(0)}
									</div>
								{/if}

								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<p class="font-medium">{row.name}</p>
										{#if row.partnershipType}
											<span
												class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
											>
												{label(row.partnershipType)}
											</span>
										{/if}
									</div>

									{#if editingId === row.linkId}
										<form
											method="post"
											action="?/updatePartnerRole"
											use:enhance={() => async ({ update }) => {
												editingId = null;
												await update();
											}}
											class="mt-2 flex flex-wrap items-center gap-2"
										>
											<input type="hidden" name="id" value={row.linkId} />
											<input
												name="role"
												value={row.role ?? ''}
												maxlength="150"
												placeholder="Role on this project"
												class="{fieldClass} w-64"
											/>
											<Button type="submit" size="sm"><Save class="h-4 w-4" /> Save</Button>
											<Button variant="ghost" size="sm" onclick={() => (editingId = null)}>
												Cancel
											</Button>
										</form>
									{:else}
										<p class="mt-1 text-sm text-slate-600">{row.role ?? 'No role set'}</p>
									{/if}
								</div>
							</div>

							<div class="flex shrink-0 items-center gap-2">
								{#if editingId !== row.linkId}
									<Button variant="ghost" size="sm" onclick={() => (editingId = row.linkId)}>
										Edit role
									</Button>
								{/if}

								<a
									href="/dashboard/partners/{row.id}"
									class="text-slate-500 hover:text-slate-900"
									aria-label="Open {row.name}"
								>
									<ExternalLink class="h-4 w-4" />
								</a>

								<form method="post" action="?/unlinkPartner" use:enhance>
									<input type="hidden" name="id" value={row.linkId} />
									<Button type="submit" variant="ghost" size="sm" aria-label="Unlink partner">
										<Trash2 class="h-4 w-4 text-red-600" />
									</Button>
								</form>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>