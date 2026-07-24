<script lang="ts">
	import { setLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';

	import { useCart } from '$lib/hooks/cart.svelte.js';

	import ProductCard from '$lib/components/product-card.svelte';

	// Set app and cart hooks
	useCart();
	let { data } = $props();

	import * as Carousel from '$lib/components/ui/carousel/index.js';

	import Hero from '$lib/components/hero.svelte';
	import About from '$lib/components/about.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ArrowBigRight } from '@lucide/svelte';
	import Faq from '$lib/components/faq.svelte';
	import Slider from '$lib/components/slider.svelte';
	import Testimonial from '$lib/components/testimonial.svelte';
	import ImgSeparator from '$lib/components/imgSeparator.svelte';
	import BlogCard from '$lib/components/blogs/portfolio-card.svelte';
	import ProductSeparator from '$lib/components/productSeparator.svelte';
	import WaneSection from '$lib/components/waneSection.svelte';

	// Keeps setLocale available without changing this page UI.
	void setLocale;
</script>

<svelte:head>
	<title>{m.home_meta_title()}</title>
</svelte:head>

<Hero />

<About />



{#if data?.blogItems.length}
	<section class="w-full space-y-8 py-12">
		<div class="flex flex-col items-center space-y-2 text-center">
			<h2 class="text-3xl font-bold tracking-tight text-foreground">{m.home_blogs_title()}</h2>
			<p class="max-w-150 text-muted-foreground">
				{m.home_blogs_description()}
			</p>
		</div>

		<div class="relative px-12">
			<Carousel.Root opts={{ align: 'start', loop: true }} class="w-full">
				<Carousel.Content class="-ml-4">
					{#each data.blogItems as item (item.id)}
						<Carousel.Item class="basis-full pl-4 md:basis-1/2 lg:basis-1/3">
							<div class="h-full transition-all hover:scale-[1.01]">
								<BlogCard {item} />
							</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>

				<Carousel.Previous
					class="hidden border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground md:flex"
				/>
				<Carousel.Next
					class="hidden border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground md:flex"
				/>
			</Carousel.Root>
		</div>
	</section>
{/if}
  
<WaneSection />

{#if data?.imagesList?.length > 0}
	<Slider imagesList={data?.imagesList} />
{/if}
{#if data?.testimonialList.length > 0}
	<main class="flex flex-col items-center justify-center px-4 py-12 md:py-20">
		<div class="mb-12 max-w-2xl text-center">
			<h2 class="mb-4 text-3xl font-bold text-foreground md:text-4xl">
				{m.home_testimonials_title()}
			</h2>
			<p class="text-lg text-muted-foreground">
				{m.home_testimonials_description()}
			</p>
		</div>

		<Testimonial testimonials={data.testimonialList} />
	</main>
{/if}
<Faq />
