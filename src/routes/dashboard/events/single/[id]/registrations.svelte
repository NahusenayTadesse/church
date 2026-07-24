<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Save, Trash2, Search } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { registrationStatuses } from './schema.js';
	import { formatEthiopianDate } from '$lib/global.svelte.js';

	type Registration = {
		id: number;
		name: string;
		email: string;
		phone: string | null;
		organization: string | null;
		seats: number;
		status: string | null;
		notes: string | null;
		checkedInAt: string | Date | null;
		createdAt: string | Date;
		paymentStatus: string | null;
		amountPaid: string | null;
		paidCurrency: string | null;
	};

	let {
		registrations = [],
		counts = {},
		seatsTaken = 0,
		seatsLeft = null,
		maxAttendees = null,
		isFree = true
	}: {
		registrations: Registration[];
		counts: Record<string, number>;
		seatsTaken: number;
		seatsLeft: number | null;
		maxAttendees?: number | null;
		isFree?: boolean | null;
	} = $props();

	const label = (v: string) => v.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

	const badge: Record<string, string> = {
		pending: 'bg-amber-50 text-amber-700',
		confirmed: 'bg-emerald-50 text-emerald-700',
		waitlisted: 'bg-sky-50 text-sky-700',
		cancelled: 'bg-slate-100 text-slate-500',
		attended: 'bg-indigo-50 text-indigo-700',
		no_show: 'bg-red-50 text-red-700'
	};

	let adding = $state(false);
	let query = $state('');
	let statusFilter = $state('all');

	let visible = $derived(
		registrations.filter((r) => {
			const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
			const q = query.trim().toLowerCase();
			const matchesQuery =
				!q ||
				r.name.toLowerCase().includes(q) ||
				r.email.toLowerCase().includes(q) ||
				(r.organization ?? '').toLowerCase().includes(q);
			return matchesStatus && matchesQuery;
		})
	);

	const fieldClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm';
</script>

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-6">
		<div>
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">
				Registrations
			</nav>
			<h2 class="text-2xl font-bold tracking-tight">
				{#if typeof maxAttendees === 'number'}
					{seatsTaken} of {maxAttendees} seats taken
				{:else}
					{seatsTaken} seats taken
				{/if}
			</h2>
			{#if seatsLeft === 0}
				<p class="mt-1 text-sm font-medium text-red-600">Full — new sign-ups go to the waitlist.</p>
			{:else if typeof seatsLeft === 'number'}
				<p class="mt-1 text-sm text-slate-500">{seatsLeft} seat(s) left.</p>
			{/if}
		</div>

		<Button onclick={() => (adding = !adding)}>
			<Plus class="h-4 w-4" />
			{adding ? 'Cancel' : 'Add registration'}
		</Button>
	</div>

	<!-- Status tally -->
	<div class="flex flex-wrap gap-2 border-b border-gray-100 px-6 py-4">
		<button
			type="button"
			onclick={() => (statusFilter = 'all')}
			class="rounded-full px-3 py-1 text-sm font-medium {statusFilter === 'all'
				? 'bg-slate-900 text-white'
				: 'bg-slate-100 text-slate-600'}"
		>
			All {registrations.length}
		</button>
		{#each registrationStatuses as status (status)}
			{#if counts[status]}
				<button
					type="button"
					onclick={() => (statusFilter = status)}
					class="rounded-full px-3 py-1 text-sm font-medium {statusFilter === status
						? 'bg-slate-900 text-white'
						: badge[status]}"
				>
					{label(status)} {counts[status]}
				</button>
			{/if}
		{/each}
	</div>

	<div class="p-6">
		{#if adding}
			<form
				method="post"
				action="?/addRegistration"
				use:enhance={() => async ({ update }) => {
					adding = false;
					await update();
				}}
				class="mb-6 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2"
			>
				<div class="flex flex-col gap-1">
					<label for="reg-name" class="text-sm font-medium">Name</label>
					<input id="reg-name" name="name" required class={fieldClass} />
				</div>

				<div class="flex flex-col gap-1">
					<label for="reg-email" class="text-sm font-medium">Email</label>
					<input id="reg-email" name="email" type="email" required class={fieldClass} />
				</div>

				<div class="flex flex-col gap-1">
					<label for="reg-phone" class="text-sm font-medium">Phone</label>
					<input id="reg-phone" name="phone" class={fieldClass} />
				</div>

				<div class="flex flex-col gap-1">
					<label for="reg-org" class="text-sm font-medium">Organization</label>
					<input id="reg-org" name="organization" class={fieldClass} />
				</div>

				<div class="flex flex-col gap-1">
					<label for="reg-seats" class="text-sm font-medium">Seats</label>
					<input id="reg-seats" name="seats" type="number" min="1" value="1" class={fieldClass} />
				</div>

				<div class="flex flex-col gap-1">
					<label for="reg-status" class="text-sm font-medium">Status</label>
					<select id="reg-status" name="status" value="confirmed" class={fieldClass}>
						{#each registrationStatuses as s (s)}
							<option value={s}>{label(s)}</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-col gap-1 sm:col-span-2">
					<label for="reg-notes" class="text-sm font-medium">Notes</label>
					<input id="reg-notes" name="notes" maxlength="255" class={fieldClass} />
				</div>

				<div class="sm:col-span-2">
					<Button type="submit"><Save class="h-4 w-4" /> Save registration</Button>
				</div>
			</form>
		{/if}

		{#if registrations.length === 0}
			<p class="text-sm text-slate-500">Nobody has registered yet.</p>
		{:else}
			<div class="relative mb-4">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<input
					bind:value={query}
					placeholder="Search by name, email or organization"
					class="{fieldClass} pl-9"
				/>
			</div>

			{#if visible.length === 0}
				<p class="text-sm text-slate-500">Nothing matches that search.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead
							class="border-b border-slate-200 text-xs tracking-wider text-slate-400 uppercase"
						>
							<tr>
								<th class="py-3 pr-4">Attendee</th>
								<th class="py-3 pr-4">Seats</th>
								<th class="py-3 pr-4">Status</th>
								{#if !isFree}
									<th class="py-3 pr-4">Payment</th>
								{/if}
								<th class="py-3 pr-4">Registered</th>
								<th class="py-3"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each visible as row (row.id)}
								<tr>
									<td class="py-3 pr-4">
										<p class="font-medium">{row.name}</p>
										<p class="text-xs text-slate-500">{row.email}</p>
										{#if row.organization}
											<p class="text-xs text-slate-400">{row.organization}</p>
										{/if}
										{#if row.notes}
											<p class="mt-1 text-xs text-slate-400 italic">{row.notes}</p>
										{/if}
									</td>

									<td class="py-3 pr-4">{row.seats}</td>

									<td class="py-3 pr-4">
										<form
											method="post"
											action="?/setRegistrationStatus"
											use:enhance
											class="flex items-center gap-2"
										>
											<input type="hidden" name="id" value={row.id} />
											<select
												name="status"
												value={row.status}
												onchange={(e) => e.currentTarget.form?.requestSubmit()}
												class="rounded-full px-2 py-1 text-xs font-medium {badge[
													row.status ?? 'pending'
												]}"
											>
												{#each registrationStatuses as s (s)}
													<option value={s}>{label(s)}</option>
												{/each}
											</select>
										</form>
										{#if row.checkedInAt}
											<p class="mt-1 text-xs text-slate-400">
												In at {new Date(row.checkedInAt).toLocaleTimeString('en-GB', {
													hour: '2-digit',
													minute: '2-digit'
												})}
											</p>
										{/if}
									</td>

									{#if !isFree}
										<td class="py-3 pr-4">
											{#if row.paymentStatus}
												<span class="text-xs">{label(row.paymentStatus)}</span>
												{#if row.amountPaid}
													<p class="text-xs text-slate-400">
														{row.amountPaid}
														{row.paidCurrency ?? ''}
													</p>
												{/if}
											{:else}
												<span class="text-xs text-slate-400">No transaction</span>
											{/if}
										</td>
									{/if}

									<td class="py-3 pr-4 text-xs text-slate-500">
										{formatEthiopianDate(new Date(row.createdAt))}
									</td>

									<td class="py-3">
										<div class="flex items-center justify-end gap-2">
											{#if !row.checkedInAt && row.status !== 'cancelled'}
												<form method="post" action="?/checkIn" use:enhance>
													<input type="hidden" name="id" value={row.id} />
													<Button type="submit" size="sm" variant="outline">Check in</Button>
												</form>
											{/if}
											<form method="post" action="?/deleteRegistration" use:enhance>
												<input type="hidden" name="id" value={row.id} />
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													aria-label="Delete registration"
												>
													<Trash2 class="h-4 w-4 text-red-600" />
												</Button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{/if}
	</div>
</section>