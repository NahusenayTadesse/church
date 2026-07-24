<script>
	import * as Command from '$lib/components/ui/command/index.js';
	import { Disc, Search } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	let isOpen = $state(false);
	let list = [
		{ label: 'Dashboard', path: '/dashboard' },
		{ label: 'Messages', path: '/dashboard/messages' },
		{ label: 'Resources', path: '/dashboard/blog' },
		{ label: 'Add New Blog', path: '/dashboard/blog/add-blog' },
		{ label: 'Books', path: '/dashboard/books' },
		{ label: 'Add New Book', path: '/dashboard/books/add-book' },
		{ label: 'Events', path: '/dashboard/events' },
		{ label: 'Add New Event', path: '/dashboard/events/add-event' },
		{ label: 'Projects', path: '/dashboard/projects' },
		{ label: 'Add New Project', path: '/dashboard/projects/add-project' },
		{ label: 'Galleries', path: '/dashboard/galleries' },
		{ label: 'Add New Gallery', path: '/dashboard/galleries/add-gallery' },
		{ label: 'Team', path: '/dashboard/team' },
		{ label: 'Add Team Member', path: '/dashboard/team/add-team' },
		{ label: 'Partners', path: '/dashboard/partners' },
		{ label: 'Add Partner', path: '/dashboard/partners/add-partner' },
		{ label: 'Testimonials', path: '/dashboard/testimonials' },
		{ label: 'Add Testimonial', path: '/dashboard/testimonials/add-testimonial' },
		{ label: 'Admin Panel', path: '/dashboard/admin-panel' },
		{ label: 'Admin Panel — Users', path: '/dashboard/admin-panel/users' },
		{ label: 'Admin Panel — Roles', path: '/dashboard/admin-panel/roles' }
	];
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger class="w-auto px-4" title="Search for Pages"><Search /></Dialog.Trigger>
	<Dialog.Content class="w-full!">
		<Dialog.Header>
			<Dialog.Title>Search the whole site</Dialog.Title>
		</Dialog.Header>
		<ScrollArea class="h-auto rounded-md border p-2">
			<h5 class="text-center">Search Anything</h5>
			<Command.Root class="rounded-lg shadow-md">
				<Command.Input placeholder="Type a command or search..." type="search" />
				<Command.List>
					<Command.Empty>No results found.</Command.Empty>
					<Command.Group heading="Suggestions">
						{#each list as item (item.path)}
							<Command.Item>
								<Disc />
								<a href={item.path} onclick={() => (isOpen = false)}>{item.label}</a>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>