<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeftIcon, FileSearchIcon } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';
</script>

<svelte:head>
	<title>{m.post_error_title()}</title>
</svelte:head>

<div
	class="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background px-4 text-foreground"
>
	<div
		class="absolute top-1/4 left-1/4 -z-10 h-96 w-96 animate-pulse rounded-full bg-primary/10 opacity-70 blur-3xl duration-4000 dark:bg-primary/5"
	></div>

	<div class="flex max-w-md flex-col items-center gap-4 text-center">
		<div
			class="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5"
		>
			<FileSearchIcon class="h-7 w-7 text-primary" />
		</div>

		<span class="font-mono text-sm font-bold tracking-widest text-primary">{page.status}</span>

		<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{m.post_error_title()}</h1>

		<p class="text-sm leading-relaxed text-muted-foreground">
			{page.error?.message ?? m.post_error_description()}
		</p>

		<Button href="/blog" class="mt-2 gap-2">
			<ArrowLeftIcon class="h-4 w-4" />
			{m.post_error_back()}
		</Button>
	</div>
</div>