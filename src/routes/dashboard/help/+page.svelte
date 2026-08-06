<script lang="ts">
	import { allHelp } from '$lib/Registry';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import {
		Search,
		ArrowUpDown,
		SlidersHorizontal,
		ChartArea,
		Download,
		ChevronDown,
		ListOrdered,
		ArrowRight,
		Coins,
		Mail,
		Banknote,
		BanknoteArrowDown,
		Building2,
		PanelsTopLeft,
		Book,
		BookOpen,
		CalendarDays,
		FolderKanban,
		Images,
		UsersRound,
		UserRoundCog,
		ListOrdered as OrdersIcon,
		Users,
		ChartArea as ReportsIcon,
		LayoutDashboard
	} from '@lucide/svelte';

	type Language = 'en' | 'am';
	let language = $state<Language>('en');
	let query = $state('');
	let activeCategory = $state('all');
	let openTopics = $state<string[]>([]);

	// ── "Where to find things" directory ──────────────────────────────────────
	// Not a copy of the sidebar: it also lists the Orders / Customers / Reports
	// pages, which exist and work but aren't linked from the sidebar yet.
	const directory = [
		{
			section: 'Overview',
			items: [
				{
					title: 'Dashboard Home',
					url: '/dashboard',
					icon: LayoutDashboard,
					description: 'The starting map — click any icon to jump to that section.'
				}
			]
		},
		{
			section: 'Money & Giving',
			items: [
				{
					title: 'Donations',
					url: '/dashboard/donations',
					icon: Coins,
					description: 'Every gift that has been recorded, who gave it, and its status.'
				},
				{
					title: 'Donation Causes',
					url: '/dashboard/donations/causes',
					icon: Coins,
					description: 'The campaigns or funds donors can choose to give toward.'
				},
				{
					title: 'Payment Methods',
					url: '/dashboard/payment-methods',
					icon: BanknoteArrowDown,
					description: 'The general types of payment accepted, like Bank Transfer or Telebirr.'
				},
				{
					title: 'Payment Accounts',
					url: '/dashboard/accounts',
					icon: Banknote,
					description: 'The specific bank/mobile-money account numbers donors send money to.'
				}
			]
		},
		{
			section: 'Sales, Orders & Customers',
			items: [
				{
					title: 'Orders',
					url: '/dashboard/orders',
					icon: OrdersIcon,
					description: 'Pending, All, Delivered, and Cancelled orders for anything sold on-site.'
				},
				{
					title: 'Customers',
					url: '/dashboard/customers',
					icon: Users,
					description: 'Everyone who has placed an order, and each person’s order history.'
				},
				{
					title: 'Sales Reports',
					url: '/dashboard/reports',
					icon: ReportsIcon,
					description: 'What sold, when, and for how much, across any date range you pick.'
				}
			]
		},
		{
			section: 'Contact & Messages',
			items: [
				{
					title: 'Messages',
					url: '/dashboard/messages',
					icon: Mail,
					description: 'Messages people sent through the website’s Contact form.'
				}
			]
		},
		{
			section: 'Website Content',
			items: [
				{
					title: 'Resources / Blog',
					url: '/dashboard/blog',
					icon: Book,
					description: 'Articles, sermons, teachings and studies published on the website.'
				},
				{
					title: 'Books',
					url: '/dashboard/books',
					icon: BookOpen,
					description: 'Titles and formats (print, PDF, ebook, audiobook) available to readers.'
				},
				{
					title: 'Events',
					url: '/dashboard/events',
					icon: CalendarDays,
					description: 'Conferences, workshops, retreats, trainings and their registrations.'
				},
				{
					title: 'Projects',
					url: '/dashboard/projects',
					icon: FolderKanban,
					description: 'Fieldwork initiatives, their progress, and their funding.'
				},
				{
					title: 'Galleries',
					url: '/dashboard/galleries',
					icon: Images,
					description: 'Photo and video collections shown on the public website.'
				},
				{
					title: 'Team',
					url: '/dashboard/team',
					icon: UsersRound,
					description: 'Staff, leadership and speaker profiles.'
				},
				{
					title: 'Partners',
					url: '/dashboard/partners',
					icon: Building2,
					description: 'Sponsor and partner organizations that support the work.'
				},
				{
					title: 'Testimonials',
					url: '/dashboard/testimonials',
					icon: PanelsTopLeft,
					description: 'Stories and quotes shared by people the ministry has touched.'
				}
			]
		},
		{
			section: 'Administration',
			items: [
				{
					title: 'Admin Panel',
					url: '/dashboard/admin-panel',
					icon: UserRoundCog,
					description: 'Manage dashboard user accounts and the roles/permissions they hold.'
				}
			]
		}
	];

	// ── Table mechanics reference cards ───────────────────────────────────────
	const tableFeatures = [
		{
			icon: Search,
			title: 'Search box',
			body: "Type into the search box above almost any table and it filters the rows instantly, checking every visible column at once — you don't need to know which column has the word you're looking for."
		},
		{
			icon: ArrowUpDown,
			title: 'Sorting a column',
			body: 'Column headings with a little up/down arrow icon next to them can be clicked to sort. Click once to sort one way, click again to reverse it, and click a third time to go back to the original order.'
		},
		{
			icon: ChevronDown,
			title: '"Columns" button',
			body: "Opens a checklist of every column in the table. Untick the ones you don't need right now — handy on a small screen, or when a table has a lot of columns and you only care about a few."
		},
		{
			icon: ListOrdered,
			title: '"Pages" button',
			body: 'Lets you choose how many rows are shown at once, in steps of 10, up to showing everything on one page. A smaller number loads faster; a bigger number means less clicking through pages.'
		},
		{
			icon: ListOrdered,
			title: 'Results counter',
			body: 'The button with a number on it (for example, "42 Results") always shows how many rows currently match your search — it updates live as you type.'
		},
		{
			icon: Download,
			title: 'Download button',
			body: 'The download icon opens two choices: "Print" opens a clean, formatted, printer-ready version of exactly what’s in the table right now (respecting your search and filters); "Export to CSV" downloads a spreadsheet file you can open in Excel or Google Sheets.'
		},
		{
			icon: ArrowRight,
			title: 'Previous / Next',
			body: "If a table has more rows than fit on one page, \"Previous\" and \"Next\" buttons appear at the bottom-right so you can page through the rest."
		},
		{
			icon: SlidersHorizontal,
			title: '"Table Filters" panel',
			body: 'On list pages like Resources, Events or Donations, a separate "Table Filters" button opens a panel with a dropdown per field (like Status or Category). Each option shows how many records match it in brackets. Tick as many as you like to narrow the list, and use "Reset" to clear everything. A line at the top reads "Showing X of Y records" so you always know how much filtering is active.'
		},
		{
			icon: ChartArea,
			title: '"Chart" button',
			body: "On the same list pages, the \"Chart\" button turns any filterable field into a bar, line, pie, doughnut, polar-area or radar chart. Switch which field you're looking at using the tabs above the chart, and pick a different chart shape from the dropdown. The handy shortcut: click directly on a bar or a pie slice and it turns that value into a filter for the table below, without opening the Filters panel at all."
		}
	];

	// ── Search across the help library ────────────────────────────────────────
	function categoryOf(entry: (typeof allHelp)[number]): string {
		const route = entry.path ?? entry.match ?? '';
		const segment = route.split('/')[2];
		return segment ?? 'overview';
	}

	const categories = $derived.by(() => {
		const seen = new Map<string, number>();
		for (const entry of allHelp) {
			const cat = categoryOf(entry);
			seen.set(cat, (seen.get(cat) ?? 0) + 1);
		}
		return Array.from(seen.entries()).sort((a, b) => a[0].localeCompare(b[0]));
	});

	function entryText(entry: (typeof allHelp)[number]): string {
		const parts: string[] = [entry.title, entry.summary ?? ''];
		for (const lang of ['en', 'am'] as const) {
			const content = entry.languages?.[lang];
			if (!content) continue;
			parts.push(content.title, content.summary ?? '');
			for (const section of content.sections ?? []) {
				parts.push(section.heading, section.body);
			}
		}
		return parts.join(' \n ').toLowerCase();
	}

	const filteredHelp = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return allHelp.filter((entry) => {
			if (activeCategory !== 'all' && categoryOf(entry) !== activeCategory) return false;
			if (!q) return true;
			return entryText(entry).includes(q);
		});
	});

	function displayContent(entry: (typeof allHelp)[number]) {
		return entry.languages?.[language] ?? entry;
	}

	function linkFor(entry: (typeof allHelp)[number]): string | undefined {
		return entry.path ?? entry.match;
	}
</script>

<svelte:head>
	<title>Help Center — Dashboard</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col gap-10 pb-16">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">Help Center</h1>
		<p class="text-muted-foreground max-w-2xl text-sm leading-relaxed">
			Everything on this page is written for someone who has never used the dashboard before.
			Use the sections below to learn how the tables work, find out where a particular task lives,
			or search every help topic in one place. You can also press <kbd
				class="bg-muted rounded border px-1 font-mono">?</kbd
			> on any page to open that page's own quick-help panel.
		</p>
		<nav class="flex flex-wrap gap-2 pt-2 text-sm">
			<a href="#tables" class="text-primary hover:underline">How the tables work</a>
			<span class="text-muted-foreground">·</span>
			<a href="#directory" class="text-primary hover:underline">Where to find things</a>
			<span class="text-muted-foreground">·</span>
			<a href="#topics" class="text-primary hover:underline">Browse all help topics</a>
		</nav>
	</header>

	<!-- ── How the tables work ─────────────────────────────────────────────── -->
	<section id="tables" class="scroll-mt-24 space-y-4">
		<div>
			<h2 class="text-lg font-semibold">How the tables work</h2>
			<p class="text-muted-foreground text-sm">
				Nearly every list page in the dashboard (Resources, Orders, Customers, Donations, Events
				and so on) uses the same table, with the same controls. Learn these once and you'll know
				your way around every list in the app.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each tableFeatures as feature (feature.title)}
				<Card.Root class="gap-2">
					<Card.Header class="flex flex-row items-center gap-2 space-y-0">
						<feature.icon class="text-primary size-4 shrink-0" />
						<Card.Title class="text-sm">{feature.title}</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-muted-foreground text-sm leading-relaxed">{feature.body}</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>

	<!-- ── Where to find things ────────────────────────────────────────────── -->
	<section id="directory" class="scroll-mt-24 space-y-4">
		<div>
			<h2 class="text-lg font-semibold">Where to find things</h2>
			<p class="text-muted-foreground text-sm">
				A directory of every section in the dashboard, grouped by what it's used for. Click any
				item to go straight there.
			</p>
		</div>
		<Accordion.Root type="multiple" class="space-y-2">
			{#each directory as group (group.section)}
				<Accordion.Item
					value={group.section}
					class="rounded-lg border px-4 not-last:border-b-0"
				>
					<Accordion.Trigger class="text-sm font-medium">{group.section}</Accordion.Trigger>
					<Accordion.Content>
						<ul class="grid grid-cols-1 gap-2 pt-1 pb-3 sm:grid-cols-2">
							{#each group.items as item (item.url)}
								<li>
									<a
										href={item.url}
										class="hover:bg-muted flex items-start gap-2.5 rounded-md border p-2.5 text-sm transition-colors"
									>
										<item.icon class="text-primary mt-0.5 size-4 shrink-0" />
										<span>
											<span class="block font-medium">{item.title}</span>
											<span class="text-muted-foreground block text-xs leading-relaxed"
												>{item.description}</span
											>
										</span>
									</a>
								</li>
							{/each}
						</ul>
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</section>

	<!-- ── Browse all help topics ──────────────────────────────────────────── -->
	<section id="topics" class="scroll-mt-24 space-y-4">
		<div>
			<h2 class="text-lg font-semibold">Browse all help topics</h2>
			<p class="text-muted-foreground text-sm">
				This searches the full text of every page's help panel at once — the same content you'd
				see by pressing <kbd class="bg-muted rounded border px-1 font-mono">?</kbd> on that page.
			</p>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative flex-1">
				<Search class="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
				<Input
					type="search"
					placeholder="Search help topics, e.g. &quot;delete&quot;, &quot;publish&quot;, &quot;role&quot;..."
					class="pl-8"
					bind:value={query}
				/>
			</div>
			<div class="flex gap-1">
				<button
					onclick={() => (language = 'en')}
					class="rounded px-2 py-1 text-xs font-medium transition-colors {language === 'en'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
				>
					EN
				</button>
				<button
					onclick={() => (language = 'am')}
					class="rounded px-2 py-1 text-xs font-medium transition-colors {language === 'am'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
				>
					አ
				</button>
			</div>
		</div>

		<div class="flex flex-wrap gap-1.5">
			<button
				onclick={() => (activeCategory = 'all')}
				class={buttonVariants({
					variant: activeCategory === 'all' ? 'default' : 'outline',
					size: 'sm'
				})}
			>
				All ({allHelp.length})
			</button>
			{#each categories as [cat, count] (cat)}
				<button
					onclick={() => (activeCategory = cat)}
					class={buttonVariants({
						variant: activeCategory === cat ? 'default' : 'outline',
						size: 'sm'
					})}
				>
					{cat.replace(/-/g, ' ')} ({count})
				</button>
			{/each}
		</div>

		<p class="text-muted-foreground text-xs">
			Showing {filteredHelp.length} of {allHelp.length} topics
		</p>

		{#if filteredHelp.length === 0}
			<Card.Root>
				<Card.Content class="text-muted-foreground py-8 text-center text-sm">
					No help topics match "{query}". Try a different word, or clear the category filter.
				</Card.Content>
			</Card.Root>
		{:else}
			<Accordion.Root type="multiple" bind:value={openTopics} class="space-y-2">
				{#each filteredHelp as entry (entry.path ?? entry.match)}
					{@const content = displayContent(entry)}
					<Accordion.Item value={entry.path ?? entry.match ?? entry.title} class="rounded-lg border px-4">
						<Accordion.Trigger class="text-left text-sm font-medium">
							<span class="flex flex-1 flex-col items-start gap-0.5 text-left">
								<span>{content.title}</span>
								{#if content.summary}
									<span class="text-muted-foreground text-xs font-normal"
										>{content.summary}</span
									>
								{/if}
							</span>
						</Accordion.Trigger>
						<Accordion.Content class="space-y-4 pb-4">
							<div class="flex items-center gap-2">
								<Badge variant="secondary">{categoryOf(entry).replace(/-/g, ' ')}</Badge>
								{#if linkFor(entry)}
									<a
										href={linkFor(entry)}
										class="text-primary flex items-center gap-1 text-xs hover:underline"
									>
										Open this page <ArrowRight class="size-3" />
									</a>
								{/if}
							</div>
							{#each content.sections ?? [] as section (section.heading)}
								<div class="space-y-1">
									<h4 class="text-sm font-medium">{section.heading}</h4>
									<p class="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
										{section.body}
									</p>
								</div>
							{/each}
						</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		{/if}
	</section>
</div>
