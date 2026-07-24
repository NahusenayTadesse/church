<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';

	const { text, html = false }: { text: string; html?: boolean } = $props();

	/**
	 * Truncate text to a maximum length
	 */
	const truncateText = (text: string | number, maxLength: number = 10): string => {
		const str = String(text);
		return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
	};
</script>

<div class="w-32">
	<Popover>
		<PopoverTrigger>
			{html ? 'View Full Text' : truncateText(text)}
		</PopoverTrigger>
		<PopoverContent class="max-w-sm p-3  text-sm wrap-break-word">
			{#if html}
				{@html text}
			{:else}
				{text}
			{/if}
		</PopoverContent>
	</Popover>
</div>