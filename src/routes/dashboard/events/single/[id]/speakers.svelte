<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Save, Trash2 } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { speakerRoles } from './schema.js';

	type Speaker = {
		id: number;
		teamMemberId: number | null;
		guestName: string | null;
		guestTitle: string | null;
		guestPhoto: string | null;
		guestBio: string | null;
		role: string | null;
		sortOrder: number | null;
		memberName: string | null;
		memberPhoto: string | null;
		memberPosition: string | null;
	};

	let {
		speakers = [],
		people = []
	}: {
		speakers: Speaker[];
		people: { value: number; name: string }[];
	} = $props();

	const label = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

	/* A row is either a linked team member or a typed-in guest. */
	const nameOf = (s: Speaker) => s.memberName ?? s.guestName ?? 'Unnamed';
	const titleOf = (s: Speaker) => s.memberPosition ?? s.guestTitle ?? '';
	const photoOf = (s: Speaker) => s.memberPhoto ?? s.guestPhoto;

	let adding = $state(false);
	let editingId = $state<number | null>(null);

	const fieldClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
</script>

{#snippet speakerFields(row: Partial<Speaker> | null)}
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="flex flex-col gap-1">
			<label for="member-{row?.id ?? 'new'}" class="text-sm font-medium">Team member</label>
			<select
				id="member-{row?.id ?? 'new'}"
				name="teamMemberId"
				value={row?.teamMemberId ?? ''}
				class={fieldClass}
			>
				<option value="">Not a team member</option>
				{#each people as person (person.value)}
					<option value={person.value}>{person.name}</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-1">
			<label for="role-{row?.id ?? 'new'}" class="text-sm font-medium">Role</label>
			<select id="role-{row?.id ?? 'new'}" name="role" value={row?.role ?? 'speaker'} class={fieldClass}>
				{#each speakerRoles as r (r)}
					<option value={r}>{label(r)}</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-1">
			<label for="guestName-{row?.id ?? 'new'}" class="text-sm font-medium">Guest name</label>
			<input
				id="guestName-{row?.id ?? 'new'}"
				name="guestName"
				value={row?.guestName ?? ''}
				placeholder="Only for speakers outside the team"
				class={fieldClass}
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="guestTitle-{row?.id ?? 'new'}" class="text-sm font-medium">Guest title</label>
			<input
				id="guestTitle-{row?.id ?? 'new'}"
				name="guestTitle"
				value={row?.guestTitle ?? ''}
				placeholder="e.g. Senior Pastor, Hope Church"
				class={fieldClass}
			/>
		</div>

		<div class="flex flex-col gap-1 sm:col-span-2">
			<label for="guestBio-{row?.id ?? 'new'}" class="text-sm font-medium">Guest bio</label>
			<textarea
				id="guestBio-{row?.id ?? 'new'}"
				name="guestBio"
				rows="3"
				maxlength="500"
				class={fieldClass}>{row?.guestBio ?? ''}</textarea
			>
		</div>

		<div class="flex flex-col gap-1">
			<label for="photo-{row?.id ?? 'new'}" class="text-sm font-medium">Guest photo</label>
			<input id="photo-{row?.id ?? 'new'}" name="photo" type="file" class={fieldClass} />
		</div>

		<div class="flex flex-col gap-1">
			<label for="sortOrder-{row?.id ?? 'new'}" class="text-sm font-medium">Sort order</label>
			<input
				id="sortOrder-{row?.id ?? 'new'}"
				name="sortOrder"
				type="number"
				min="0"
				value={row?.sortOrder ?? 0}
				class={fieldClass}
			/>
		</div>
	</div>
{/snippet}

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-6">
		<div>
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Speakers</nav>
			<h2 class="text-2xl font-bold tracking-tight">Who's on the platform</h2>
		</div>

		<Button onclick={() => (adding = !adding)}>
			<Plus class="h-4 w-4" />
			{adding ? 'Cancel' : 'Add speaker'}
		</Button>
	</div>

	<div class="p-6">
		{#if adding}
			<form
				method="post"
				action="?/addSpeaker"
				enctype="multipart/form-data"
				use:enhance={() => async ({ update }) => {
					adding = false;
					await update();
				}}
				class="mb-6 rounded-2xl bg-slate-50 p-4"
			>
				{@render speakerFields(null)}
				<Button type="submit" class="mt-4"><Save class="h-4 w-4" /> Save speaker</Button>
			</form>
		{/if}

		{#if speakers.length === 0}
			<p class="text-sm text-slate-500">No speakers listed yet.</p>
		{:else}
			<ul class="divide-y divide-slate-100">
				{#each speakers as row (row.id)}
					<li class="py-4">
						{#if editingId === row.id}
							<form
								method="post"
								action="?/editSpeaker"
								enctype="multipart/form-data"
								use:enhance={() => async ({ update }) => {
									editingId = null;
									await update();
								}}
								class="rounded-2xl bg-slate-50 p-4"
							>
								<input type="hidden" name="id" value={row.id} />
								{@render speakerFields(row)}
								<div class="mt-4 flex gap-2">
									<Button type="submit"><Save class="h-4 w-4" /> Save</Button>
									<Button variant="ghost" onclick={() => (editingId = null)}>Cancel</Button>
								</div>
							</form>
						{:else}
							<div class="flex items-start justify-between gap-4">
								<div class="flex min-w-0 items-start gap-3">
									{#if photoOf(row)}
										<img
											src="/files/{photoOf(row)}"
											alt={nameOf(row)}
											class="h-12 w-12 shrink-0 rounded-full object-cover"
										/>
									{:else}
										<div
											class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-500"
										>
											{nameOf(row).charAt(0)}
										</div>
									{/if}

									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<p class="font-medium">{nameOf(row)}</p>
											<span
												class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
											>
												{label(row.role ?? 'speaker')}
											</span>
											{#if !row.teamMemberId}
												<span class="text-xs text-slate-400">guest</span>
											{/if}
										</div>

										{#if titleOf(row)}
											<p class="text-sm text-slate-500">{titleOf(row)}</p>
										{/if}

										{#if row.guestBio && !row.teamMemberId}
											<p class="mt-1 text-sm leading-relaxed text-slate-600">{row.guestBio}</p>
										{/if}
									</div>
								</div>

								<div class="flex shrink-0 items-center gap-2">
									<Button variant="ghost" size="sm" onclick={() => (editingId = row.id)}>
										Edit
									</Button>
									<form method="post" action="?/deleteSpeaker" use:enhance>
										<input type="hidden" name="id" value={row.id} />
										<Button type="submit" variant="ghost" size="sm" aria-label="Remove speaker">
											<Trash2 class="h-4 w-4 text-red-600" />
										</Button>
									</form>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>