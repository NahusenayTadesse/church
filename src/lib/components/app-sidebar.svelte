<script lang="ts">
	import {
		Users,
		UserRoundCog,
		ChartArea,
		LayoutDashboard,
		Container,
		Mail,
		ListOrdered,
		Star,
		Building2,
		Book,

		PanelsTopLeft

	} from '@lucide/svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { bgGradient } from '$lib/global.svelte';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import NavMain from './NavMain.svelte';

	let { messageNumber, ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const navigation = [
		{
			section: null,
			items: [
				{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
			]
		},
		{
			section: 'Operations',
			items: [
	
				{
					title: 'Messages',
					url: '/dashboard/messages',
					icon: Mail,
					counter: messageNumber
				}
			]
		},
		{
			section: 'Content',
			items: [
				{ title: 'Partner Logos', url: '/dashboard/logos', icon: Building2 },
				{ title: 'Testimonial', url: '/dashboard/testimonials', icon: PanelsTopLeft },
				{
					title: 'Blogs',
					url: '/dashboard/blog',
					icon: Book,
					items: [
						{ title: 'Add New Blog', url: '/dashboard/blog/add-blog' },
						{ title: 'View All Blogs', url: '/dashboard/blog' }
					]
				}
			]
		},
		{
			section: 'Analytics',
			items: [
				{ title: 'Reports', url: '/dashboard/reports', icon: ChartArea },
				{
					title: 'Admin Panel',
					url: '/dashboard/admin-panel',
					icon: UserRoundCog,
					items: [
					
						{ title: 'Users', url: '/dashboard/admin-panel/users' },
						{ title: 'Roles', url: '/dashboard/admin-panel/roles' }
					]
				}
			]
		}
	];

	const sidebar = useSidebar();
	function closeSidebar() {
		if (sidebar.isMobile) sidebar.setOpenMobile(false);
	}
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Content
		class="z-[9999] flex h-full [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent] flex-col
      overflow-y-scroll
      pt-0
      [&::-webkit-scrollbar]:w-1.5
      [&::-webkit-scrollbar-thumb]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-border
      [&::-webkit-scrollbar-track]:bg-transparent
      {bgGradient}"
	>
		<!-- Logo header -->
		<div class="sticky top-0 z-10 border-b border-border/60 bg-sidebar px-4 py-4">
			<a
				href="/"
				title="Go to Website Home Page"
				class="flex flex-row flex-wrap gap-2"
				target="_blank"
			>
				<img src="/logo.webp" alt="Logo" class="h-4 rounded-[1px]" />

				<div>
					<div class="text-[13px] font-medium tracking-tight text-foreground">Admin Panel</div>
					<div class="text-[10px] tracking-widest text-muted-foreground uppercase">Dashboard</div>
				</div>
			</a>
		</div>

		<!-- Nav sections -->
		<div class="flex-1 py-2">
			<NavMain {closeSidebar} sections={navigation} />
		</div>
	</Sidebar.Content>

	<Sidebar.Footer class="border-t border-border/60 bg-sidebar px-4 py-3">
		<p class="text-[10px] text-muted-foreground">
			Powered by{' '}
			<a
				href="https://digitalconstruct.com"
				target="_blank"
				class="font-medium text-foreground no-underline hover:underline"
			>
				Digital Construct
			</a>
		</p>
	</Sidebar.Footer>
</Sidebar.Root>
