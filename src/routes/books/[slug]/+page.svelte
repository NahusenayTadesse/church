<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';

	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Select from '$lib/components/ui/select';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';

	import {
		ArrowLeftIcon,
		ArrowRightIcon,
		BookOpenIcon,
		StarIcon,
		DownloadIcon,
		HeadphonesIcon,
		FileTextIcon,
		TabletIcon,
		ExternalLinkIcon,
		EyeIcon,
		MinusIcon,
		PlusIcon,
		ShoppingBagIcon,
		CheckCircle2Icon,
		PenLineIcon,
		SendIcon
	} from '@lucide/svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props();

	const locale = $derived(getLocale() === 'am' ? 'am-ET' : 'en-US');

	/* ------------------------------------------------------------- forms */
	const {
		form: reviewForm,
		errors: reviewErrors,
		enhance: reviewEnhance,
		delayed: reviewDelayed,
		message: reviewMessage
	} = superForm(data.reviewForm, { dataType: 'json', id: 'review' });

	const {
		form: orderForm,
		errors: orderErrors,
		enhance: orderEnhance,
		delayed: orderDelayed,
		message: orderMessage
	} = superForm(data.orderForm, { dataType: 'json', id: 'order' });

	$effect(() => {
		if ($reviewMessage) {
			if ($reviewMessage.type === 'error') toast.error($reviewMessage.text);
			else toast.success($reviewMessage.text);
		}
	});

	$effect(() => {
		if ($orderMessage) {
			if ($orderMessage.type === 'error') toast.error($orderMessage.text);
			else toast.success($orderMessage.text);
		}
	});

	let showReviewForm = $state(false);
	const reviewSent = $derived($reviewMessage?.type === 'success');
	const ordered = $derived($orderMessage?.type === 'success');

	/* ------------------------------------------------------------ helpers */
	const formatIcons: Record<string, typeof BookOpenIcon> = {
		physical: BookOpenIcon,
		pdf: FileTextIcon,
		ebook: TabletIcon,
		audiobook: HeadphonesIcon
	};

	function formatLabel(value: string) {
		const labels: Record<string, string> = {
			physical: m.books_format_physical(),
			pdf: m.books_format_pdf(),
			ebook: m.books_format_ebook(),
			audiobook: m.books_format_audiobook()
		};
		return labels[value] ?? value;
	}

	function languageLabel(value: string) {
		const labels: Record<string, string> = {
			english: m.books_language_english(),
			amharic: m.books_language_amharic(),
			other: m.books_language_other()
		};
		return labels[value] ?? value;
	}

	function typeLabel(type: string) {
		const labels: Record<string, string> = {
			article: m.blog_type_article(),
			sermon: m.blog_type_sermon(),
			teaching: m.blog_type_teaching(),
			video: m.blog_type_video(),
			audio: m.blog_type_audio(),
			bible_study: m.blog_type_bible_study()
		};
		return labels[type] ?? type;
	}

	const formatDate = (value: string | Date | null) =>
		value
			? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(value))
			: '';

	const currency = $derived(data.book.currency ?? 'ETB');
	const freeFormats = $derived(data.formats.filter((f) => f.isFreeDownload && f.hasFile));
	const priceValue = $derived(Number(data.book.price ?? 0));

	const variantPrice = $derived(
		Number(data.variants.find((v) => v.variant === $orderForm.variant)?.price ?? priceValue)
	);
	const orderTotal = $derived(variantPrice * ($orderForm.quantity ?? 1));
	const maxCopies = $derived(Math.min(20, data.inStock || 20));

	function changeQuantity(delta: number) {
		const next = ($orderForm.quantity ?? 1) + delta;
		$orderForm.quantity = Math.min(maxCopies, Math.max(1, next));
	}

	function setRating(value: number) {
		$reviewForm.rating = value;
	}
</script>

{#snippet stars(average: number, size = 'h-4 w-4')}
	<span class="flex items-center gap-0.5" aria-label="{average} / 5">
		{#each [1, 2, 3, 4, 5] as step (step)}
			<StarIcon
				class="{size} {average >= step - 0.5
					? 'fill-primary text-primary'
					: 'text-muted-foreground/30'}"
			/>
		{/each}
	</span>
{/snippet}

<svelte:head>
	<title>{data.book.title} — Steward of Life</title>
	<meta name="description" content={data.book.description?.slice(0, 160) ?? ''} />
	<meta property="og:title" content={data.book.title} />
	<meta property="og:type" content="book" />
	{#if data.book.coverImage}
		<meta property="og:image" content="/files/{data.book.coverImage}" />
	{/if}
</svelte:head>

<div
	class="relative min-h-dvh w-full overflow-hidden bg-background px-4 py-20 text-foreground transition-colors duration-300 sm:px-6 lg:px-8"
>
	<div
		class="absolute top-0 left-1/4 -z-10 h-96 w-96 animate-pulse rounded-full bg-primary/10 opacity-70 blur-3xl duration-4000 dark:bg-primary/5"
	></div>
	<div
		class="absolute right-1/4 bottom-0 -z-10 h-96 w-96 animate-pulse rounded-full bg-primary/5 opacity-70 blur-3xl duration-6000 dark:bg-primary/10"
	></div>

	<main class="mx-auto max-w-6xl">
		<a
			href="/books"
			class="group mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
		>
			<ArrowLeftIcon class="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
			{m.book_back_to_books()}
		</a>

		<div class="grid gap-10 lg:grid-cols-12">
			<!-- ------------------------------------------------- cover rail -->
			<aside transition:fly={{ y: 20, duration: 600 }} class="lg:col-span-4">
				<div class="flex flex-col gap-5 lg:sticky lg:top-24">
					<div class="mx-auto w-full max-w-[280px]">
						{#if data.book.coverImage}
							<img
								src="/files/{data.book.coverImage}"
								alt={data.book.title}
								class="w-full rounded-xl border border-primary/10 shadow-2xl"
							/>
						{:else}
							<div
								class="flex aspect-[3/4] w-full items-center justify-center rounded-xl border border-primary/10 bg-primary/10 shadow-2xl"
							>
								<BookOpenIcon class="h-12 w-12 text-primary/40" />
							</div>
						{/if}
					</div>

					<!-- how to get it -->
					<Card
						class="border-primary/15 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md"
					>
						<CardContent class="flex flex-col gap-4 pt-6">
							<div class="flex items-baseline justify-between">
								<span class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
									{m.book_price_label()}
								</span>
								<span class="text-2xl font-extrabold {freeFormats.length ? 'text-primary' : ''}">
									{#if freeFormats.length && priceValue === 0}
										{m.books_free_label()}
									{:else if priceValue > 0}
										{currency}
										{priceValue.toLocaleString(locale)}
									{:else}
										{m.books_price_on_request()}
									{/if}
								</span>
							</div>

							<!-- free downloads -->
							{#each freeFormats as f (f.id)}
								{@const Icon = formatIcons[f.format]}
								<form method="POST" action="?/download">
									<input type="hidden" name="formatId" value={f.id} />
									<Button type="submit" class="w-full gap-2">
										<Icon class="h-4 w-4" />
										{m.book_download_format({ format: formatLabel(f.format) })}
									</Button>
								</form>
							{/each}

							<!-- on-site order -->
							{#if data.canOrderOnSite && !ordered}
								<form action="?/order" method="POST" use:orderEnhance class="flex flex-col gap-3">
									{#if data.variants.length > 1}
										<Select.Root
											type="single"
											bind:value={$orderForm.variant}
											onValueChange={(v) => ($orderForm.variant = v)}
										>
											<Select.Trigger class="border-primary/15 bg-primary/5">
												{$orderForm.variant}
											</Select.Trigger>
											<Select.Content>
												{#each data.variants as variant (variant.id)}
													<Select.Item value={variant.variant} label={variant.variant}>
														{variant.variant} — {currency}
														{Number(variant.price).toLocaleString(locale)}
													</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									{/if}

									<div class="flex items-center gap-3">
										<button
											type="button"
											onclick={() => changeQuantity(-1)}
											disabled={($orderForm.quantity ?? 1) <= 1}
											aria-label={m.book_quantity_decrease()}
											class="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
										>
											<MinusIcon class="h-4 w-4" />
										</button>
										<span class="w-8 text-center font-mono text-lg font-bold tabular-nums">
											{$orderForm.quantity ?? 1}
										</span>
										<button
											type="button"
											onclick={() => changeQuantity(1)}
											disabled={($orderForm.quantity ?? 1) >= maxCopies}
											aria-label={m.book_quantity_increase()}
											class="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
										>
											<PlusIcon class="h-4 w-4" />
										</button>
										<span class="ml-auto text-right">
											<span
												class="block text-[10px] tracking-widest text-muted-foreground uppercase"
											>
												{m.book_total_label()}
											</span>
											<span class="font-mono text-base font-extrabold">
												{currency}
												{orderTotal.toLocaleString(locale)}
											</span>
										</span>
									</div>

									<Button type="submit" class="w-full gap-2">
										{#if $orderDelayed}
											<LoadingBtn name={m.book_order_loading()} />
										{:else}
											<ShoppingBagIcon class="h-4 w-4" />
											{m.book_order_button()}
										{/if}
									</Button>

									{#if $orderErrors.quantity}
										<span class="text-xs text-destructive">{$orderErrors.quantity}</span>
									{/if}
									<p class="text-[11px] leading-relaxed text-muted-foreground">
										{m.book_order_note()}
									</p>
								</form>
							{:else if ordered}
								<div
									class="flex flex-col items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"
								>
									<CheckCircle2Icon class="h-7 w-7 text-primary" />
									<p class="text-sm font-bold">{m.book_order_placed_title()}</p>
									<p class="text-xs text-muted-foreground">{$orderMessage?.text}</p>
								</div>
							{:else if data.book.productId && data.inStock === 0}
								<p
									class="rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-center text-xs font-semibold text-muted-foreground"
								>
									{m.book_out_of_stock()}
								</p>
							{/if}

							<!-- external store -->
							{#if data.book.purchaseLink}
								<Button
									href={data.book.purchaseLink}
									target="_blank"
									rel="noopener noreferrer"
									variant="outline"
									class="w-full gap-2 border-primary/20 bg-primary/5"
								>
									<ExternalLinkIcon class="h-4 w-4" />
									{m.book_buy_external()}
								</Button>
							{/if}

							{#if data.book.previewFileUrl}
								<Button
									href="/files/{data.book.previewFileUrl}"
									target="_blank"
									rel="noopener noreferrer"
									variant="ghost"
									class="w-full gap-2"
								>
									<EyeIcon class="h-4 w-4" />
									{m.book_read_preview()}
								</Button>
							{/if}
						</CardContent>
					</Card>

					<!-- every format -->
					{#if data.formats.length}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardHeader class="pb-2">
								<CardTitle class="text-sm font-bold tracking-wide">
									{m.book_formats_title()}
								</CardTitle>
							</CardHeader>
							<CardContent class="flex flex-col gap-2">
								{#each data.formats as f (f.id)}
									{@const Icon = formatIcons[f.format]}
									<div
										class="flex items-center gap-3 rounded-xl border border-primary/5 bg-primary/5 p-3"
									>
										<Icon class="h-4 w-4 shrink-0 text-primary" />
										<span class="flex-1 text-sm font-semibold">{formatLabel(f.format)}</span>
										<span class="text-xs font-bold">
											{#if f.isFreeDownload}
												<span class="text-primary">{m.books_free_label()}</span>
											{:else if f.price}
												{currency}
												{Number(f.price).toLocaleString(locale)}
											{:else}
												—
											{/if}
										</span>
									</div>
								{/each}
							</CardContent>
						</Card>
					{/if}
				</div>
			</aside>

			<!-- ---------------------------------------------------- details -->
			<div
				transition:fly={{ y: 20, duration: 600, delay: 100 }}
				class="flex flex-col gap-12 lg:col-span-8"
			>
				<header class="flex flex-col gap-4">
					<div class="flex flex-wrap items-center gap-2">
						<Badge class="font-semibold">{languageLabel(data.book.language ?? 'english')}</Badge>
						{#if data.book.ministryAreaName}
							<a
								href="/books?area={data.book.ministryAreaId}"
								class="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
							>
								{data.book.ministryAreaName}
							</a>
						{/if}
					</div>

					<div>
						<h1
							class="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl"
						>
							{data.book.title}
						</h1>
						{#if data.book.subtitle}
							<p class="mt-2 text-lg text-muted-foreground">{data.book.subtitle}</p>
						{/if}
					</div>

					{#if data.book.authorName}
						<p class="text-sm">
							<span class="text-muted-foreground">{m.books_by()}</span>
							<span class="font-bold">{data.book.authorName}</span>
						</p>
					{/if}

					{#if data.book.reviewTotal > 0}
						<div class="flex items-center gap-2">
							{@render stars(data.book.ratingAverage)}
							<span class="text-sm font-bold">{data.book.ratingAverage}</span>
							<span class="text-sm text-muted-foreground">
								· {m.books_review_count({ count: data.book.reviewTotal })}
							</span>
						</div>
					{/if}

					<!-- facts -->
					<div class="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
						{#if data.book.publicationDate}
							<span>
								<span class="font-bold tracking-widest uppercase">{m.book_published_label()}</span>
								· {formatDate(data.book.publicationDate)}
							</span>
						{/if}
						{#if data.book.pages}
							<span>
								<span class="font-bold tracking-widest uppercase">{m.book_pages_label()}</span>
								· {data.book.pages}
							</span>
						{/if}
						{#if data.book.isbn}
							<span>
								<span class="font-bold tracking-widest uppercase">ISBN</span>
								· <span class="font-mono">{data.book.isbn}</span>
							</span>
						{/if}
					</div>
				</header>

				{#if data.book.description}
					<section>
						<h2 class="mb-3 text-xl font-bold tracking-tight">{m.book_about_title()}</h2>
						<p class="text-[1.0625rem] leading-relaxed whitespace-pre-line text-muted-foreground">
							{data.book.description}
						</p>
					</section>
				{/if}

				<!-- author -->
				{#if data.book.authorBio}
					<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
						<CardContent class="flex flex-col gap-4 pt-6 sm:flex-row sm:gap-5">
							{#if data.book.authorPhoto}
								<img
									src="/files/{data.book.authorPhoto}"
									alt={data.book.authorName ?? ''}
									class="h-20 w-20 shrink-0 rounded-2xl border border-primary/20 object-cover"
								/>
							{/if}
							<div class="flex flex-col gap-1.5">
								<p class="text-[11px] font-bold tracking-widest text-primary uppercase">
									{m.book_author_title()}
								</p>
								<p class="text-lg font-bold tracking-tight">{data.book.authorName}</p>
								{#if data.book.authorPosition}
									<p class="text-sm text-muted-foreground">{data.book.authorPosition}</p>
								{/if}
								<p class="text-sm leading-relaxed text-muted-foreground">{data.book.authorBio}</p>
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- related resources -->
				{#if data.resources.length}
					<section>
						<h2 class="mb-4 text-xl font-bold tracking-tight">{m.book_resources_title()}</h2>
						<div class="grid gap-4 sm:grid-cols-3">
							{#each data.resources as resource (resource.id)}
								<a href="/blog/{resource.slug}" class="group block h-full">
									<Card
										class="flex h-full flex-col overflow-hidden border-primary/10 bg-card/40 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/25"
									>
										{#if resource.featuredImage}
											<img
												src="/files/{resource.featuredImage}"
												alt={resource.title}
												loading="lazy"
												class="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
											/>
										{/if}
										<CardContent class="flex flex-1 flex-col gap-1.5 p-4">
											<span class="text-[11px] font-bold text-primary">
												{typeLabel(resource.resourceType ?? 'article')}
											</span>
											<h3
												class="line-clamp-2 text-sm leading-snug font-bold transition-colors group-hover:text-primary"
											>
												{resource.title}
											</h3>
										</CardContent>
									</Card>
								</a>
							{/each}
						</div>
					</section>
				{/if}

				<!-- reviews -->
				<section>
					<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
						<h2 class="text-xl font-bold tracking-tight">{m.book_reviews_title()}</h2>
						{#if !reviewSent}
							<Button
								variant="outline"
								size="sm"
								class="gap-1.5 border-primary/20 bg-primary/5"
								onclick={() => (showReviewForm = !showReviewForm)}
							>
								<PenLineIcon class="h-3.5 w-3.5" />
								{m.book_write_review()}
							</Button>
						{/if}
					</div>

					<!-- breakdown -->
					{#if data.book.reviewTotal > 0}
						<Card class="mb-6 border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardContent class="grid gap-6 pt-6 sm:grid-cols-3">
								<div class="flex flex-col items-center justify-center gap-1.5">
									<span class="text-4xl font-extrabold">{data.book.ratingAverage}</span>
									{@render stars(data.book.ratingAverage, 'h-4 w-4')}
									<span class="text-xs text-muted-foreground">
										{m.books_review_count({ count: data.book.reviewTotal })}
									</span>
								</div>
								<div class="flex flex-col justify-center gap-1.5 sm:col-span-2">
									{#each data.breakdown as row (row.star)}
										<div class="flex items-center gap-2.5">
											<span class="w-3 text-xs font-bold tabular-nums">{row.star}</span>
											<StarIcon class="h-3 w-3 fill-primary text-primary" />
											<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10">
												<div
													class="h-full rounded-full bg-primary transition-all duration-700"
													style="width: {row.percent}%"
												></div>
											</div>
											<span class="w-6 text-right text-xs text-muted-foreground tabular-nums">
												{row.total}
											</span>
										</div>
									{/each}
								</div>
							</CardContent>
						</Card>
					{/if}

					<!-- form -->
					{#if reviewSent}
						<Card class="mb-6 border-primary/25 bg-primary/5 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col items-center gap-2 py-10 text-center">
								<CheckCircle2Icon class="h-8 w-8 text-primary" />
								<p class="font-bold tracking-tight">{m.book_review_thanks_title()}</p>
								<p class="max-w-sm text-sm text-muted-foreground">{$reviewMessage?.text}</p>
							</CardContent>
						</Card>
					{:else if showReviewForm}
						<div transition:slide={{ duration: 300 }} class="mb-6">
							<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
								<CardHeader>
									<CardTitle class="text-lg font-bold tracking-tight">
										{m.book_review_form_title()}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<form class="space-y-5" action="?/review" method="POST" use:reviewEnhance>
										<div class="flex flex-col gap-1.5">
											<span class="text-sm font-medium">{m.book_review_rating_label()}</span>
											<div class="flex gap-1">
												{#each [1, 2, 3, 4, 5] as step (step)}
													<button
														type="button"
														onclick={() => setRating(step)}
														aria-label="{step} / 5"
														class="transition-transform duration-200 hover:scale-110"
													>
														<StarIcon
															class="h-7 w-7 {($reviewForm.rating ?? 0) >= step
																? 'fill-primary text-primary'
																: 'text-muted-foreground/30'}"
														/>
													</button>
												{/each}
											</div>
											{#if $reviewErrors.rating}
												<span class="text-xs text-destructive">{$reviewErrors.rating}</span>
											{/if}
										</div>

										<div class="grid gap-4 sm:grid-cols-2">
											<InputComp
												form={reviewForm}
												errors={reviewErrors}
												type="text"
												name="reviewerName"
												label={m.book_review_name_label()}
												placeholder={m.book_review_name_placeholder()}
											/>
											<InputComp
												form={reviewForm}
												errors={reviewErrors}
												type="email"
												name="reviewerEmail"
												label={m.book_review_email_label()}
												placeholder={m.book_review_email_placeholder()}
											/>
										</div>

										<InputComp
											form={reviewForm}
											errors={reviewErrors}
											type="text"
											name="title"
											label={m.book_review_headline_label()}
											placeholder={m.book_review_headline_placeholder()}
										/>

										<InputComp
											form={reviewForm}
											errors={reviewErrors}
											type="textarea"
											name="content"
											label={m.book_review_content_label()}
											placeholder={m.book_review_content_placeholder()}
										/>

										<Button type="submit" class="group w-full gap-2">
											{#if $reviewDelayed}
												<LoadingBtn name={m.book_review_loading()} />
											{:else}
												<SendIcon
													class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5"
												/>
												{m.book_review_submit()}
											{/if}
										</Button>

										<p class="text-[11px] text-muted-foreground">{m.book_review_moderation_note()}</p>
									</form>
								</CardContent>
							</Card>
						</div>
					{/if}

					<!-- list -->
					{#if data.reviews.length}
						<div class="flex flex-col gap-4">
							{#each data.reviews as review (review.id)}
								<Card class="border-primary/10 bg-card/40 shadow-sm backdrop-blur-md">
									<CardContent class="flex flex-col gap-2 pt-6">
										<div class="flex flex-wrap items-center gap-3">
											{@render stars(review.rating ?? 0, 'h-3.5 w-3.5')}
											<span class="text-sm font-bold">{review.reviewerName}</span>
											<span class="text-xs text-muted-foreground">
												{formatDate(review.createdAt)}
											</span>
										</div>
										{#if review.title}
											<p class="font-bold tracking-tight">{review.title}</p>
										{/if}
										<p class="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
											{review.content}
										</p>
									</CardContent>
								</Card>
							{/each}
						</div>
					{:else}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardContent class="flex flex-col items-center gap-2 py-14 text-center">
								<StarIcon class="h-7 w-7 text-primary/50" />
								<p class="font-bold tracking-tight">{m.book_no_reviews_title()}</p>
								<p class="max-w-xs text-sm text-muted-foreground">
									{m.book_no_reviews_description()}
								</p>
							</CardContent>
						</Card>
					{/if}
				</section>
			</div>
		</div>

		<!-- --------------------------------------------------------- also by -->
		{#if data.alsoBy.length}
			<section class="mt-16">
				<h2 class="mb-6 text-xl font-bold tracking-tight">{m.book_also_title()}</h2>
				<div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
					{#each data.alsoBy as other (other.id)}
						<a href="/books/{other.slug}" class="group flex flex-col gap-2.5">
							{#if other.coverImage}
								<img
									src="/files/{other.coverImage}"
									alt={other.title}
									loading="lazy"
									class="aspect-[3/4] w-full rounded-xl border border-primary/10 object-cover shadow-lg transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-2xl"
								/>
							{:else}
								<div
									class="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-primary/10 shadow-lg"
								>
									<BookOpenIcon class="h-8 w-8 text-primary/40" />
								</div>
							{/if}
							<h3
								class="line-clamp-2 text-sm leading-snug font-bold transition-colors group-hover:text-primary"
							>
								{other.title}
							</h3>
						</a>
					{/each}
				</div>

				<div class="mt-8 flex justify-center">
					<Button href="/books" variant="outline" class="group gap-2 border-primary/20 bg-primary/5">
						{m.book_see_all()}
						<ArrowRightIcon
							class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
						/>
					</Button>
				</div>
			</section>
		{/if}
	</main>
</div>