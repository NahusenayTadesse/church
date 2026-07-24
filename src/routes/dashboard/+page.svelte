<script lang="ts">
	import {
		Mail,
		Book,
		BookOpen,
		CalendarDays,
		FolderKanban,
		Images,
		UsersRound,
		Building2,
		PanelsTopLeft,
		ChartArea,
		UserRoundCog,
		LayoutDashboard,

		BanknoteArrowDown,

		Banknote


	} from '@lucide/svelte';

	type Stop = {
		title: string;
		href: string;
		icon: typeof LayoutDashboard;
		description: string;
		count?: number;
		countLabel?: string;
	};

	type Line = {
		name: string;
		/** HSL triplet, e.g. "199 89% 48%" — fed into hsl(var(--line)) below */
		hsl: string;
		stops: Stop[];
	};


	const lines: Line[] = [
		{
			name: 'Operations',
			hsl: '199 89% 48%',
			stops: [
				{
					title: 'Messages',
					href: '/dashboard/messages',
					icon: Mail,
					description: 'What visitors send you',
					countLabel: 'unread'
				},
				{
					title: 'Bank Accounts',
					href: 'dashboard/accounts',
					icon: Banknote,
					description: "Control What accounts are seen"
				},
				{
					title: 'Payment Methods',
					href: '/dashboard/payment-methods',
					icon: BanknoteArrowDown,
					description: "Insert and Update payment methods"

				},
			]
		},
		{
			name: 'Content',
			hsl: '38 92% 50%',
			stops: [
				{ title: 'Resources', href: '/dashboard/blog', icon: Book, description: 'Articles, sermons & teaching' },
				{ title: 'Books', href: '/dashboard/books', icon: BookOpen, description: 'Titles & formats' },
				{
					title: 'Events',
					href: '/dashboard/events',
					icon: CalendarDays,
					description: 'Conferences & registrations'
				},
				{
					title: 'Projects',
					href: '/dashboard/projects',
					icon: FolderKanban,
					description: 'Fieldwork & funding'
				},
				{ title: 'Galleries', href: '/dashboard/galleries', icon: Images, description: 'Photos & video' },
				{ title: 'Team', href: '/dashboard/team', icon: UsersRound, description: 'Staff & speakers' },
				{ title: 'Partners', href: '/dashboard/partners', icon: Building2, description: 'Sponsors & donors' },
				{
					title: 'Testimonials',
					href: '/dashboard/testimonials',
					icon: PanelsTopLeft,
					description: 'Stories from the field'
				}
			]
		},
		{
			name: 'Analytics',
			hsl: '262 83% 58%',
			stops: [
				{
					title: 'Admin Panel',
					href: '/dashboard/admin-panel',
					icon: UserRoundCog,
					description: 'Users & roles'
				}
			]
		}
	];
</script>

<div class="relative overflow-hidden rounded-2xl border border-border bg-card/40 p-6 md:p-10">
	<div class="mb-8 flex flex-col items-center gap-1 text-center">
		<span class="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
			Dashboard Map
		</span>
		<h2 class="text-lg font-semibold text-foreground md:text-xl">Where do you want to go?</h2>
		<p class="max-w-md text-xs text-muted-foreground md:text-sm">
			Every part of the site you manage, laid out as one route.
		</p>
	</div>

	<!-- Hub -->
	<div class="relative z-10 mb-8 flex flex-col items-center">
		<div
			class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground/20 bg-background shadow-sm"
		>
			<LayoutDashboard class="h-6 w-6 text-foreground" />
		</div>
		<span class="mt-2 text-[11px] font-medium text-muted-foreground">You are here</span>
		<div class="mt-2 h-8 w-px bg-border"></div>
	</div>

	<div class="flex flex-col gap-10">
		{#each lines as line (line.name)}
			<section style={`--line: ${line.hsl};`} class="relative">
				<div class="mb-5 flex items-center gap-3">
					<span class="h-2.5 w-2.5 shrink-0 rounded-full bg-[hsl(var(--line))]"></span>
					<h3 class="shrink-0 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
						{line.name} line
					</h3>
					<div class="route-rule relative h-px flex-1 bg-[hsl(var(--line))]/25">
						<span class="signal-dot"></span>
					</div>
				</div>

				<div class="flex flex-wrap gap-x-6 gap-y-5">
					{#each line.stops as stop (stop.title)}
						<a
							href={stop.href}
							class="group flex w-[132px] flex-col items-center gap-2 text-center md:w-[150px]"
						>
							<div class="h-3 w-px bg-[hsl(var(--line))]/40"></div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[hsl(var(--line))]/35 bg-background text-[hsl(var(--line))] transition-all duration-200 group-hover:scale-110 group-hover:border-[hsl(var(--line))] group-hover:shadow-md"
							>
								<svelte:component this={stop.icon} class="h-5 w-5" />
							</div>
							<div>
								<p class="text-sm font-medium text-foreground">{stop.title}</p>
								<p class="mt-0.5 text-[11px] leading-snug text-muted-foreground">
									{stop.description}
								</p>
								{#if stop.count !== undefined && stop.count > 0}
									<span
										class="mt-1 inline-block rounded-full bg-[hsl(var(--line))]/10 px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--line))]"
									>
										{stop.count} {stop.countLabel}
									</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</div>

<style>
	.signal-dot {
		position: absolute;
		top: 50%;
		left: 0;
		height: 5px;
		width: 5px;
		border-radius: 9999px;
		background: hsl(var(--line));
		transform: translateY(-50%);
		opacity: 0;
	}

	@media (prefers-reduced-motion: no-preference) {
		.signal-dot {
			animation: travel 5s linear infinite;
		}
	}

	@keyframes travel {
		0% {
			left: 0%;
			opacity: 0;
		}
		10% {
			opacity: 0.9;
		}
		90% {
			opacity: 0.9;
		}
		100% {
			left: 100%;
			opacity: 0;
		}
	}
</style>