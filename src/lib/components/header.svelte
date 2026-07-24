<script lang="ts">
	import {
		MenuIcon,
		XIcon,
		SearchIcon,
		House as HomeIcon,
		ShoppingBagIcon,
		InfoIcon,
		ContactIcon,
		LogInIcon,
		UserPlusIcon
	} from '@lucide/svelte';
	import DarkMode from './DarkMode.svelte';
	import AvatarSettings from './AvatarSettings.svelte';

	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
	import { page, navigating } from '$app/state';
	import Cart from '$lib/components/floating-cart/cart.svelte';
	import LanguageSelector from './LanguageSelector.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();
	let isOpen = $state(false);

	let searchQuery = $state(page.url.searchParams.get('search') ?? '');

	const handleMenuClick = () => {
		isOpen = false;
	};

	const menuItems = [
		{ label: m.header_nav_home, href: '/', icon: HomeIcon },
		{ label: m.header_nav_about_us, href: '/about', icon: InfoIcon },
		{ label: m.header_nav_books, href: '/books', icon: InfoIcon },
		{ label: m.header_nav_blog, href: '/blogs', icon: InfoIcon },
		{ label: m.header_nav_events, href: '/events', icon: InfoIcon },
		{ label: m.header_nav_gallery, href: '/gallery', icon: InfoIcon },
		{ label: m.header_nav_orders, href: '/donate', icon: InfoIcon },
		{ label: m.header_nav_contact_us, href: '/contact', icon: ContactIcon }
	];



	$effect(() => {
		if (navigating.to) {
			isOpen = false;
		}
	});
</script>

<header
	class="sticky top-0 z-50 w-full border-b border-border/80 bg-background/60 px-2 py-1.5 backdrop-blur-md transition-all duration-300 lg:px-12"
>
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
		<div class="flex shrink-0 items-center gap-6">
			<a href="/" class="transition-transform duration-200 active:scale-95">
				<img
					src="/logo.webp"
					class="h-12 w-auto object-contain dark:brightness-110"
					alt={m.header_logo_alt()}
					fetchpriority="high"
				/>
			</a>

			<nav class="hidden items-center gap-1 md:flex">
				{#each menuItems as item (item.href)}
					{@const isActive = page.url.pathname === item.href}
					<Button
						variant={isActive ? 'default' : 'ghost'}
						size="sm"
						href={item.href}
						class="h-9 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all"
					>
						{item.label()}
					</Button>
				{/each}
			</nav>
		</div>

		<div class="flex flex-row items-center gap-4">


			<div class="hidden flex-row items-center justify-end gap-2 lg:flex">
				<div class="ml-1 border-l border-border/60 pl-2">
					<DarkMode />
				</div>
				<div class="ml-1 border-l border-border/60 pl-2">
					<LanguageSelector />
				</div>

			</div>

			<div class="flex items-center gap-2 md:hidden">
				<DarkMode />
				<LanguageSelector />
				<Sheet bind:open={isOpen}>
					<SheetTrigger>
						{#snippet child({ props: triggerProps })}
							<Button
								variant="outline"
								size="icon"
								class="size-9 rounded-xl border-border bg-card/50"
								{...triggerProps}
							>
								{#if isOpen}
									<XIcon class="size-4 text-foreground transition-transform duration-200" />
								{:else}
									<MenuIcon class="size-4 text-foreground transition-transform duration-200" />
								{/if}
							</Button>
						{/snippet}
					</SheetTrigger>

					<SheetContent
						side="right"
						class="flex w-80 flex-col border-l border-border bg-background/95 p-0 backdrop-blur-md"
					>


						<nav class="flex flex-1 flex-col gap-1.5 p-4">
							{#each menuItems as item (item.href)}
								{@const isMobileActive = page.url.pathname === item.href}
								<Button
									variant={isMobileActive ? 'secondary' : 'ghost'}
									href={item.href}
									class="w-full justify-start gap-3.5 rounded-xl px-3.5 py-5.5 text-sm font-semibold tracking-wide transition-all active:scale-[0.98]"
									onclick={handleMenuClick}
								>
									<item.icon class="h-4 w-4 text-primary opacity-70" />
									{item.label()}
								</Button>
							{/each}
						</nav>

						<div class="space-y-4 border-t border-border bg-muted/10 p-5">
							<div class="flex w-auto flex-row gap-1">
								<DarkMode />
								<LanguageSelector />
							</div>

						</div>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	</div>
</header>
