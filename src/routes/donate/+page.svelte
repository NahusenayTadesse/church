<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';

	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';

	import {
		HeartIcon,
		HandCoinsIcon,
		CopyIcon,
		CheckIcon,
		CheckCircle2Icon,
		BanknoteIcon,
		UsersIcon,
		RepeatIcon,
		SendIcon,
		EyeOffIcon,
		ArrowRightIcon,
		SparklesIcon,
		ScrollTextIcon,
		HandshakeIcon
	} from '@lucide/svelte';

	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props();

	const { form, errors, enhance, delayed, message } = superForm(data.form, { dataType: 'json' });

	$effect(() => {
		if ($message) {
			if ($message.type === 'error') toast.error($message.text);
			else toast.success($message.text);
		}
	});

	const pledged = $derived($message?.type === 'success');
	const locale = $derived(getLocale() === 'am' ? 'am-ET' : 'en-US');

	/* ------------------------------------------------------------- copying */
	let copiedId = $state<number | null>(null);

	async function chooseAccount(account: (typeof data.accounts)[number]) {
		$form.paymentAccountId = account.id;

		try {
			await navigator.clipboard.writeText(account.accountNumber);
			copiedId = account.id;
			toast.success(m.donate_account_copied({ bank: account.bankName ?? account.methodName }));
			setTimeout(() => {
				if (copiedId === account.id) copiedId = null;
			}, 2500);
		} catch {
			toast.error(m.donate_account_copy_failed());
		}
	}

	/* -------------------------------------------------------------- amounts */
	const selectedCause = $derived(data.causes.find((cause) => cause.id === $form.causeId) ?? null);

	const activePresets = $derived(
		data.presets.filter((preset) => preset.causeId === ($form.causeId ?? null))
	);

	const fallbackPresets = $derived(
		activePresets.length ? activePresets : data.presets.filter((preset) => !preset.causeId)
	);

	const currency = $derived(
		data.accounts.find((account) => account.id === $form.paymentAccountId)?.currency ??
			selectedCause?.currency ??
			'ETB'
	);

	const selectedAccount = $derived(
		data.accounts.find((account) => account.id === $form.paymentAccountId) ?? null
	);

	const money = (value: number) => `${currency} ${value.toLocaleString(locale)}`;

	const compact = (value: number) =>
		new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);

	function causeProgress(cause: (typeof data.causes)[number]) {
		const goal = Number(cause.goalAmount ?? 0);
		if (!goal) return null;
		return Math.min(100, Math.round((Number(cause.raisedAmount ?? 0) / goal) * 100));
	}

	function frequencyLabel(value: string) {
		const labels: Record<string, string> = {
			once: m.donate_frequency_once(),
			monthly: m.donate_frequency_monthly(),
			quarterly: m.donate_frequency_quarterly(),
			yearly: m.donate_frequency_yearly()
		};
		return labels[value] ?? value;
	}

	const formatDate = (value: string | Date | null) =>
		value
			? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(value))
			: '';
</script>

<svelte:head>
	<title>{m.donate_meta_title()}</title>
	<meta name="description" content={m.donate_meta_description()} />
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

	<main class="mx-auto max-w-5xl">
		<!-- ------------------------------------------------------------ hero -->
		<div
			transition:fly={{ y: 30, duration: 800 }}
			class="mb-10 flex flex-col items-center gap-3 text-center"
		>
			<span
				class="rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-[11px] font-bold tracking-widest text-primary uppercase backdrop-blur-sm"
			>
				{m.donate_badge()}
			</span>
			<h1
				class="bg-linear-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl"
			>
				{m.donate_heading()}
			</h1>
			<p class="max-w-2xl text-base text-muted-foreground">{m.donate_description()}</p>
		</div>

		{#if data.totals.donors > 0}
			<div transition:fly={{ y: 20, duration: 600, delay: 80 }} class="mb-12">
				<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
					<CardContent class="grid grid-cols-3 divide-x divide-primary/10 py-6">
						<div class="flex flex-col items-center gap-1 px-2 text-center">
							<span class="text-2xl font-extrabold text-primary tabular-nums sm:text-3xl">
								{compact(data.totals.raised)}
							</span>
							<span class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
								{m.donate_stat_raised()}
							</span>
						</div>
						<div class="flex flex-col items-center gap-1 px-2 text-center">
							<span class="text-2xl font-extrabold tabular-nums sm:text-3xl">
								{data.totals.donors}
							</span>
							<span class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
								{m.donate_stat_donors()}
							</span>
						</div>
						<div class="flex flex-col items-center gap-1 px-2 text-center">
							<span class="text-2xl font-extrabold tabular-nums sm:text-3xl">
								{data.totals.recurring}
							</span>
							<span class="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
								{m.donate_stat_recurring()}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		{/if}

		<!-- ------------------------------------------------- accounts showcase -->
		{#if data.accounts.length}
			<section transition:fly={{ y: 20, duration: 600, delay: 120 }} class="mb-14">
				<div class="mb-5 flex flex-col gap-1">
					<h2 class="flex items-center gap-2 text-xl font-bold tracking-tight">
						<BanknoteIcon class="h-5 w-5 text-primary" />
						{m.donate_accounts_title()}
					</h2>
					<p class="text-sm text-muted-foreground">{m.donate_accounts_description()}</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
            
					{#each data.accounts as account (account.id)}
						{@const isCopied = copiedId === account.id}
						{@const isSelected = $form.paymentAccountId === account.id}
						<button
							type="button"
							onclick={() => chooseAccount(account)}
							class="group relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-300 {isSelected
								? 'border-primary bg-primary/10 shadow-lg'
								: 'border-primary/10 bg-card/40 shadow-md hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg'} backdrop-blur-md"
						>
							<div class="flex items-center gap-3">
								{#if account.methodLogo}
									<img
										src="/files/{account.methodLogo}"
										alt={account.methodName}
										class="h-10 w-10 shrink-0 rounded-lg bg-background object-contain p-1"
									/>
								{:else}
									<span
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
									>
										<BanknoteIcon class="h-5 w-5" />
									</span>
								{/if}
								<div class="min-w-0 flex-1">
									<p class="truncate font-bold tracking-tight">
										{account.bankName ?? account.methodName}
									</p>
									<p class="truncate text-xs text-muted-foreground">{account.accountName}</p>
								</div>

								<span
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 {isCopied
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-primary/15 bg-primary/5 text-primary group-hover:bg-primary/10'}"
								>
									{#if isCopied}
										<CheckIcon class="h-4 w-4" />
									{:else}
										<CopyIcon class="h-4 w-4" />
									{/if}
								</span>
							</div>

							<div
								class="rounded-xl border border-primary/10 bg-background/60 px-4 py-3 transition-colors group-hover:border-primary/20"
							>
								<span class="block text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
									{m.donate_account_number_label()}
								</span>
								<span class="font-mono text-lg font-extrabold tracking-wider tabular-nums">
									{account.accountNumber}
								</span>
							</div>

							<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
								{#if account.branch}
									<span>{account.branch}</span>
								{/if}
								{#if account.swiftCode}
									<span class="font-mono">SWIFT {account.swiftCode}</span>
								{/if}
								{#if account.currency}
									<span class="font-bold text-primary">{account.currency}</span>
								{/if}
							</div>

							{#if account.instructions}
								<p class="text-[11px] leading-relaxed text-muted-foreground">
									{account.instructions}
								</p>
							{/if}

							<span
								class="text-[11px] font-bold tracking-wide {isCopied
									? 'text-primary'
									: 'text-muted-foreground'}"
							>
								{isCopied ? m.donate_copied_hint() : m.donate_copy_hint()}
							</span>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<!-- ------------------------------------------------------------ form -->
		<section id="give" class="scroll-mt-24">
			{#if pledged}
				<div transition:fly={{ y: 20, duration: 500 }}>
					<Card class="border-primary/25 bg-primary/5 shadow-xl backdrop-blur-md">
						<CardContent class="flex flex-col items-center gap-4 px-6 py-14 text-center">
							<CheckCircle2Icon class="h-12 w-12 text-primary" />
							<h2 class="text-2xl font-extrabold tracking-tight">{m.donate_thanks_title()}</h2>
							<p class="max-w-lg text-sm leading-relaxed text-muted-foreground">
								{$message?.text}
							</p>

							{#if selectedAccount}
								<div
									class="mt-2 flex w-full max-w-sm flex-col gap-2 rounded-2xl border border-primary/20 bg-background/60 p-5"
								>
									<span class="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
										{selectedAccount.bankName ?? selectedAccount.methodName}
									</span>
									<span class="font-mono text-xl font-extrabold tracking-wider">
										{selectedAccount.accountNumber}
									</span>
									<span class="text-xs text-muted-foreground">{selectedAccount.accountName}</span>
									<Button
										variant="outline"
										size="sm"
										class="mt-1 gap-1.5 border-primary/20"
										onclick={() => chooseAccount(selectedAccount)}
									>
										<CopyIcon class="h-3.5 w-3.5" />
										{m.donate_copy_number()}
									</Button>
								</div>
							{/if}

							<Button href="/projects" variant="ghost" class="group mt-2 gap-2">
								{m.donate_see_work()}
								<ArrowRightIcon
									class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
								/>
							</Button>
						</CardContent>
					</Card>
				</div>
			{:else}
				<form action="?/donate" method="POST" use:enhance class="flex flex-col gap-8">
					<!-- cause -->
					{#if data.causes.length}
						<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
							<CardHeader>
								<CardTitle class="text-lg font-bold tracking-tight">
									{m.donate_cause_title()}
								</CardTitle>
							</CardHeader>
							<CardContent class="grid gap-3 sm:grid-cols-2">
								<button
									type="button"
									onclick={() => ($form.causeId = null)}
									class="flex flex-col gap-1 rounded-2xl border p-4 text-left transition-all duration-300 {$form.causeId ===
									null
										? 'border-primary bg-primary/10'
										: 'border-primary/10 bg-primary/5 hover:border-primary/30'}"
								>
									<span class="flex items-center gap-2 font-bold tracking-tight">
										<SparklesIcon class="h-4 w-4 text-primary" />
										{m.donate_cause_any()}
									</span>
									<span class="text-xs text-muted-foreground">{m.donate_cause_any_note()}</span>
								</button>

								{#each data.causes as cause (cause.id)}
									{@const percent = causeProgress(cause)}
									<button
										type="button"
										onclick={() => ($form.causeId = cause.id)}
										class="flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all duration-300 {$form.causeId ===
										cause.id
											? 'border-primary bg-primary/10'
											: 'border-primary/10 bg-primary/5 hover:border-primary/30'}"
									>
										<div class="flex items-center gap-3">
											{#if cause.image}
												<img
													src="/files/{cause.image}"
													alt={cause.name}
													class="h-10 w-10 shrink-0 rounded-lg object-cover"
												/>
											{/if}
											<span class="min-w-0">
												<span class="block truncate font-bold tracking-tight">{cause.name}</span>
												{#if cause.description}
													<span class="block truncate text-xs text-muted-foreground">
														{cause.description}
													</span>
												{/if}
											</span>
										</div>

										{#if percent !== null}
											<div class="flex flex-col gap-1">
												<div class="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
													<div
														class="h-full rounded-full bg-primary transition-all duration-700"
														style="width: {percent}%"
													></div>
												</div>
												<span class="text-[11px] text-muted-foreground">
													{cause.currency ?? 'ETB'}
													{Number(cause.raisedAmount ?? 0).toLocaleString(locale)} · {percent}%
												</span>
											</div>
										{/if}
									</button>
								{/each}
							</CardContent>
						</Card>
					{/if}

					<!-- amount -->
					<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
						<CardHeader>
							<CardTitle class="text-lg font-bold tracking-tight">
								{m.donate_amount_title()}
							</CardTitle>
						</CardHeader>
						<CardContent class="flex flex-col gap-5">
							<!-- frequency -->
							<div class="flex flex-wrap gap-2">
								{#each ['once', 'monthly', 'quarterly', 'yearly'] as option (option)}
									<button
										type="button"
										onclick={() => ($form.frequency = option as typeof $form.frequency)}
										class="flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold tracking-wide transition-all duration-300 {$form.frequency ===
										option
											? 'border-primary bg-primary text-primary-foreground shadow-sm'
											: 'border-primary/10 bg-primary/5 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
									>
										{#if option !== 'once'}
											<RepeatIcon class="h-3.5 w-3.5" />
										{/if}
										{frequencyLabel(option)}
									</button>
								{/each}
							</div>

							<!-- presets -->
							{#if fallbackPresets.length}
								<div class="grid grid-cols-3 gap-3">
									{#each fallbackPresets as preset (preset.id)}
										{@const value = Number(preset.amount)}
										<button
											type="button"
											onclick={() => ($form.amount = value)}
											class="flex flex-col items-center gap-0.5 rounded-2xl border px-3 py-4 transition-all duration-300 {$form.amount ===
											value
												? 'border-primary bg-primary/10 shadow-sm'
												: 'border-primary/10 bg-primary/5 hover:-translate-y-0.5 hover:border-primary/30'}"
										>
											<span class="font-mono text-xl font-extrabold">
												{preset.currency ?? 'ETB'}
												{value.toLocaleString(locale)}
											</span>
											{#if preset.label}
												<span class="text-center text-[11px] leading-tight text-muted-foreground">
													{preset.label}
												</span>
											{/if}
										</button>
									{/each}
								</div>
							{/if}

							<!-- custom amount -->
							<div class="flex flex-col gap-1.5">
								<label for="amount" class="text-sm font-medium">{m.donate_custom_amount()}</label>
								<div class="relative">
									<span
										class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-bold text-muted-foreground"
									>
										{currency}
									</span>
									<input
										id="amount"
										type="number"
										min="1"
										step="1"
										bind:value={$form.amount}
										placeholder="0"
										class="h-14 w-full rounded-xl border border-primary/15 bg-primary/5 pr-4 pl-16 font-mono text-xl font-extrabold tabular-nums transition-colors outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
									/>
								</div>
								{#if $errors.amount}
									<span class="text-xs text-destructive">{$errors.amount}</span>
								{/if}
								{#if $form.frequency !== 'once' && $form.amount > 0}
									<span class="text-xs text-muted-foreground">
										{m.donate_recurring_note({
											amount: money(Number($form.amount)),
											frequency: frequencyLabel($form.frequency).toLowerCase()
										})}
									</span>
								{/if}
							</div>
						</CardContent>
					</Card>

					<!-- donor -->
					<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
						<CardHeader>
							<CardTitle class="text-lg font-bold tracking-tight">{m.donate_you_title()}</CardTitle>
						</CardHeader>
						<CardContent class="flex flex-col gap-5">
							<InputComp
								{form}
								{errors}
								type="text"
								name="donorName"
								label={m.donate_form_name_label()}
								placeholder={m.donate_form_name_placeholder()}
							/>

							<div class="grid gap-4 sm:grid-cols-2">
								<InputComp
									{form}
									{errors}
									type="email"
									name="donorEmail"
									label={m.donate_form_email_label()}
									placeholder={m.donate_form_email_placeholder()}
								/>
								<InputComp
									{form}
									{errors}
									type="tel"
									name="donorPhone"
									label={m.donate_form_phone_label()}
									placeholder={m.donate_form_phone_placeholder()}
								/>
							</div>

							<InputComp
								{form}
								{errors}
								type="textarea"
								name="message"
								label={m.donate_form_message_label()}
								placeholder={m.donate_form_message_placeholder()}
							/>

							<button
								type="button"
								onclick={() => ($form.isAnonymous = !$form.isAnonymous)}
								class="flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-300 {$form.isAnonymous
									? 'border-primary bg-primary/10'
									: 'border-primary/10 bg-primary/5 hover:border-primary/25'}"
							>
								<span
									class="flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors {$form.isAnonymous
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-primary/30'}"
								>
									{#if $form.isAnonymous}
										<CheckIcon class="h-3.5 w-3.5" />
									{/if}
								</span>
								<span class="flex-1">
									<span class="flex items-center gap-1.5 text-sm font-bold">
										<EyeOffIcon class="h-3.5 w-3.5 text-primary" />
										{m.donate_anonymous_label()}
									</span>
									<span class="text-xs text-muted-foreground">{m.donate_anonymous_note()}</span>
								</span>
							</button>
						</CardContent>
					</Card>

					<!-- submit -->
					<Card
						class="border-primary/15 bg-gradient-to-br from-card/60 via-card/40 to-primary/5 shadow-xl backdrop-blur-md"
					>
						<CardContent class="flex flex-col gap-4 pt-6">
							<div class="flex flex-wrap items-baseline justify-between gap-2">
								<span class="text-sm text-muted-foreground">
									{selectedCause ? selectedCause.name : m.donate_cause_any()}
									· {frequencyLabel($form.frequency)}
								</span>
								<span class="font-mono text-2xl font-extrabold">
									{money(Number($form.amount || 0))}
								</span>
							</div>

							{#if selectedAccount}
								<p class="rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
									{m.donate_transfer_to({
										bank: selectedAccount.bankName ?? selectedAccount.methodName,
										number: selectedAccount.accountNumber
									})}
								</p>
							{/if}

							<Button type="submit" class="group h-12 w-full gap-2 text-base">
								{#if $delayed}
									<LoadingBtn name={m.donate_form_loading()} />
								{:else}
									<HeartIcon class="h-4 w-4" />
									{m.donate_form_submit()}
									<SendIcon
										class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5"
									/>
								{/if}
							</Button>

							<p class="text-center text-[11px] leading-relaxed text-muted-foreground">
								{m.donate_submit_note()}
							</p>
						</CardContent>
					</Card>
				</form>
			{/if}
		</section>

		<!-- ------------------------------------------------ other ways to give -->
		<section transition:fly={{ y: 20, duration: 600, delay: 200 }} class="mt-16">
			<h2 class="mb-5 text-xl font-bold tracking-tight">{m.donate_other_ways_title()}</h2>
			<div class="grid gap-4 sm:grid-cols-3">
				{#each [{ icon: HandshakeIcon, title: m.donate_way_match_title(), body: m.donate_way_match_body() }, { icon: ScrollTextIcon, title: m.donate_way_legacy_title(), body: m.donate_way_legacy_body() }, { icon: HandCoinsIcon, title: m.donate_way_pledge_title(), body: m.donate_way_pledge_body() }] as way (way.title)}
					<Card class="border-primary/10 bg-card/40 shadow-md backdrop-blur-md">
						<CardContent class="flex flex-col gap-2 pt-6">
							<span
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
							>
								<way.icon class="h-5 w-5" />
							</span>
							<p class="font-bold tracking-tight">{way.title}</p>
							<p class="text-sm leading-relaxed text-muted-foreground">{way.body}</p>
						</CardContent>
					</Card>
				{/each}
			</div>
			<p class="mt-4 text-sm text-muted-foreground">
				{m.donate_other_ways_contact()}
				<a href="/contact" class="font-bold text-primary underline underline-offset-4">
					{m.donate_other_ways_contact_link()}
				</a>
			</p>
		</section>

		<!-- ---------------------------------------------------------- donors -->
		{#if data.recentGifts.length}
			<section transition:fly={{ y: 20, duration: 600, delay: 250 }} class="mt-16">
				<h2 class="mb-5 flex items-center gap-2 text-xl font-bold tracking-tight">
					<UsersIcon class="h-5 w-5 text-primary" />
					{m.donate_recent_title()}
				</h2>
				<div class="grid gap-3 sm:grid-cols-2">
					{#each data.recentGifts as gift (gift.id)}
						<div
							class="flex items-start gap-3 rounded-2xl border border-primary/10 bg-card/40 p-4 backdrop-blur-md"
						>
							<span
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
							>
								{gift.donorName?.charAt(0) ?? '·'}
							</span>
							<div class="min-w-0 flex-1">
								<p class="flex flex-wrap items-baseline gap-x-2">
									<span class="text-sm font-bold">{gift.donorName}</span>
									<span class="text-[11px] text-muted-foreground">{formatDate(gift.createdAt)}</span>
								</p>
								{#if gift.causeName}
									<p class="text-xs text-primary">{gift.causeName}</p>
								{/if}
								{#if gift.message}
									<p class="mt-1 line-clamp-2 text-xs text-muted-foreground">"{gift.message}"</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</main>
</div>