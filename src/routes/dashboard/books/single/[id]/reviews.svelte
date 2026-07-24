<script lang="ts">
	import { enhance } from '$app/forms';
	import { Star, Trash2 } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { formatEthiopianDate } from '$lib/global.svelte.js';

	type Review = {
		id: number;
		reviewerName: string;
		reviewerEmail: string | null;
		accountName: string | null;
		rating: number | null;
		title: string | null;
		content: string;
		isApproved: boolean | null;
		createdAt: string | Date;
	};

	let { reviews = [] }: { reviews: Review[] } = $props();

	let pending = $derived(reviews.filter((r) => !r.isApproved));
	let approved = $derived(reviews.filter((r) => r.isApproved));

	let averageRating = $derived.by(() => {
		const rated = approved.filter((r) => typeof r.rating === 'number');
		if (rated.length === 0) return null;
		return (rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length).toFixed(1);
	});
</script>

<section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
	<div class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 p-6">
		<div>
			<nav class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase">Reviews</nav>
			<h2 class="text-2xl font-bold tracking-tight">
				{#if averageRating}
					{averageRating} out of 5
				{:else}
					No published ratings yet
				{/if}
			</h2>
		</div>

		{#if pending.length > 0}
			<span class="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
				{pending.length} waiting for review
			</span>
		{/if}
	</div>

	<div class="p-6">
		{#if reviews.length === 0}
			<p class="text-sm text-slate-500">Nobody has reviewed this book yet.</p>
		{:else}
			<ul class="divide-y divide-slate-100">
				{#each reviews as review (review.id)}
					<li class="py-5">
						<div class="flex flex-wrap items-start justify-between gap-4">
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-medium">{review.reviewerName}</p>

									{#if review.accountName}
										<span class="text-xs text-slate-400">signed in as {review.accountName}</span>
									{/if}

									{#if review.isApproved}
										<span
											class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
										>
											Published
										</span>
									{:else}
										<span
											class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
										>
											Hidden
										</span>
									{/if}
								</div>

								{#if review.rating}
									<div class="mt-1 flex items-center gap-0.5" aria-label="{review.rating} out of 5">
										{#each Array(5) as _, i (i)}
											<Star
												class="h-4 w-4 {i < review.rating
													? 'fill-amber-400 text-amber-400'
													: 'text-slate-300'}"
											/>
										{/each}
									</div>
								{/if}

								{#if review.title}
									<p class="mt-2 font-semibold text-slate-800">{review.title}</p>
								{/if}

								<p class="mt-1 text-sm leading-relaxed whitespace-pre-line text-slate-600">
									{review.content}
								</p>

								<p class="mt-2 text-xs text-slate-400">
									{formatEthiopianDate(new Date(review.createdAt))}
									{#if review.reviewerEmail}
										· {review.reviewerEmail}
									{/if}
								</p>
							</div>

							<div class="flex shrink-0 items-center gap-2">
								<form method="post" action="?/setReviewApproval" use:enhance>
									<input type="hidden" name="id" value={review.id} />
									{#if !review.isApproved}
										<input type="hidden" name="isApproved" value="true" />
										<Button type="submit" size="sm">Publish</Button>
									{:else}
										<Button type="submit" size="sm" variant="outline">Hide</Button>
									{/if}
								</form>

								<form method="post" action="?/deleteReview" use:enhance>
									<input type="hidden" name="id" value={review.id} />
									<Button type="submit" variant="ghost" size="sm" aria-label="Delete review">
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