<script lang="ts">
	import { MailIcon, PhoneIcon, MapPinIcon, GlobeIcon, Send, Phone } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages.js';

	import { IconBrandFacebook, IconBrandInstagram, IconBrandTiktok } from '@tabler/icons-svelte';

	const socialLinks = [
		{
			name: m.footer_social_phone,
			url: 'tel:+251911234567',
			icon: Phone,
			color: 'hover:text-pink-500 hover:border-pink-500/30'
		},
		{
			name: m.footer_social_instagram,
			url: 'https://www.instagram.com/stewardoflife/',
			icon: IconBrandInstagram,
			color: 'hover:text-pink-500 hover:border-pink-500/30'
		},
		{
			name: m.footer_social_tiktok,
			url: 'https://www.tiktok.com/@stewardoflife',
			icon: IconBrandTiktok,
			color: 'hover:text-foreground hover:border-foreground/30'
		},
		{
			name: m.footer_social_facebook,
			url: 'https://www.facebook.com/stewardoflife',
			icon: IconBrandFacebook,
			color: 'hover:text-blue-600 hover:border-blue-600/30'
		},
		{
			name: m.footer_social_telegram,
			url: 'https://t.me/stewardoflife',
			icon: Send,
			color: 'hover:text-red-600 hover:border-red-600/30'
		}
	];
	const menuItems = [
		{ label: m.header_nav_home, href: '/' },
		{ label: m.header_nav_about_us, href: '/about' },
		{ label: m.header_nav_books, href: '/books' },
		{ label: m.header_nav_blog, href: '/blogs' },
		{ label: m.header_nav_events, href: '/events' },
		{ label: m.header_nav_gallery, href: '/gallery' },
		{ label: m.header_nav_orders, href: '/donate' },
		{ label: m.header_nav_contact_us, href: '/contact' }
	];
</script>

<footer
	class="relative overflow-hidden border-t border-border bg-card/60 text-card-foreground backdrop-blur-md"
>
	<div
		class="pointer-events-none absolute -top-24 -left-24 -z-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
	></div>

	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-10 pb-8 md:grid-cols-3">
			<div class="flex flex-col gap-4">
				<div class="flex items-center gap-2">
					<img src="/logo.webp" class="w-30" alt={m.footer_logo_alt()} />
		
				</div>
				<p class="text-sm leading-relaxed text-muted-foreground">
					{m.footer_company_description()}
				</p>

				<div class="mt-2 flex flex-col gap-3 text-sm">
					<a
						href="https://maps.app.goo.gl/mFLb36gXCfzPZ6jAA"
						target="_blank"
						rel="noopener noreferrer"
						class="group flex items-start gap-3 text-muted-foreground transition-colors hover:text-foreground"
					>
						<MapPinIcon class="mt-0.5 size-4 shrink-0 text-primary" />
						<span>{m.footer_address()}</span>
					</a>
					<a
						href="tel:+251 911623708"
						target="_blank"
						class="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
					>
						<PhoneIcon class="size-4 shrink-0 text-primary" />
						<span>+251 9 11 62 37 08</span>
					</a>
					<a
						href="mailto:info@stewardoflife.org"
						target="_blank"
						class="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
					>
						<MailIcon class="size-4 shrink-0 text-primary" />
						<span>info@stewardoflife.org</span>
					</a>
					<a
						href="https://stewardoflife.org"
						class="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
					>
						<GlobeIcon class="size-4 shrink-0 text-primary" />
						<span>stewardoflife.org</span>
					</a>
				</div>
			</div>

			<div class="md:justify-self-center">
				<h4 class="mb-4 text-sm font-semibold tracking-wider text-foreground uppercase">
					{m.footer_quick_links()}
				</h4>
				<ul class="flex flex-col gap-2.5 text-sm">
					{#each menuItems as menu (menu.href)}
						<li>
							<a
								href={menu.href}
								class="text-muted-foreground transition-colors hover:text-foreground"
							>
								{menu.label()}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<div class="flex flex-col">
				<h4
					class="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider text-foreground uppercase"
				>
					<MapPinIcon class="size-4 text-primary" />
					{m.footer_store_location()}
				</h4>
				<div class="relative h-36 w-full overflow-hidden rounded-xl border border-border bg-muted">
					<iframe
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31525.882341021457!2d38.71339480468071!3d8.996487415928225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b87279cf9d1c7%3A0xa52f6dc421c8a900!2sMekanisa%20Kore!5e0!3m2!1sen!2set!4v1785221629407!5m2!1sen!2set"
						style="border:0;"
						class="absolute inset-0 h-full w-full opacity-80 contrast-125 grayscale invert dark:invert-0"
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						title={m.footer_map_title()}
					></iframe>
				
				</div>
			</div>
		</div>

		<div
			class="flex flex-col items-center justify-between gap-6 border-t border-border pt-8 md:flex-row"
		>
			<div class="flex flex-col items-center gap-1 md:items-start">
				<p class="text-sm font-medium text-foreground">{m.footer_connect_with_us()}</p>
				<p class="text-xs text-muted-foreground">{m.footer_social_description()}</p>
			</div>

			<div class="flex gap-3">
				{#each socialLinks as social (social.url)}
					<a
						href={social.url}
						target="_blank"
						rel="noopener noreferrer"
						class={[
							'flex items-center justify-center rounded-lg border border-border bg-card/40 p-2.5 text-muted-foreground transition-all duration-300 hover:scale-105 hover:bg-background hover:shadow-md',
							social.color
						]}
						title={social.name()}
					>
						<social.icon class="h-5 w-5" />
					</a>
				{/each}
			</div>
		</div>

		<div
			class="mt-8 flex flex-col items-center justify-center gap-4 pt-4 text-center text-muted-foreground/60"
		>
			<p class="text-sm">{m.footer_copyright({ year: new Date().getFullYear() })}</p>
			<p class="flex flex-row gap-3 text-[8px]">
				{m.footer_powered_by()}
				<a
					href="https://nahusenaytadesse.vercel.com"
					class="text-primary hover:underline"
					target="_blank"
					rel="noopener noreferrer"
					>NT
				</a>
			</p>
		</div>
	</div>
</footer>
