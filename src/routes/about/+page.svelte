<script lang="ts">
    import {
        ArrowRightIcon,
        BookOpenIcon,
        CheckIcon,
        ChurchIcon,
        CrossIcon,
        FlameIcon,
        HandHeartIcon,
        HeartIcon,
        ShieldIcon,
        SparklesIcon,
        UsersIcon
    } from '@lucide/svelte';

    import { Button } from '$lib/components/ui/button';
    import { Separator } from '$lib/components/ui/separator';

    import Faq from '$lib/components/faq.svelte';
    import Testimonial from '$lib/components/testimonial.svelte';
    import Slider from '$lib/components/slider.svelte';
    import ImgSeparator from '$lib/components/imgSeparator.svelte';
    import Mission from '$lib/components/mission.svelte';
    import * as m from '$lib/paraglide/messages.js';
	import Teammembers from '$lib/components/Teammembers.svelte';
	import Partners from '$lib/components/partners.svelte';

    let { data } = $props();

    // Was a three-tab switcher. Now all three are on the page at once.
    const pillars = [
        {
            icon: ShieldIcon,
            label: m.about_page_tab_quality_label,
            title: m.about_page_tab_quality_title,
            text: m.about_page_tab_quality_text,
            points: [
                m.about_page_tab_quality_point_selected,
                m.about_page_tab_quality_point_performance,
                m.about_page_tab_quality_point_reliable
            ]
        },
        {
            icon: BookOpenIcon,
            label: m.about_page_tab_products_label,
            title: m.about_page_tab_products_title,
            text: m.about_page_tab_products_text,
            points: [
                m.about_page_tab_products_point_mobile,
                m.about_page_tab_products_point_storage,
                m.about_page_tab_products_point_audio
            ]
        },
        {
            icon: HandHeartIcon,
            label: m.about_page_tab_support_label,
            title: m.about_page_tab_support_title,
            text: m.about_page_tab_support_text,
            points: [
                m.about_page_tab_support_point_warranty,
                m.about_page_tab_support_point_technical,
                m.about_page_tab_support_point_replacement
            ]
        }
    ];

    const benefits = [
        {
            icon: ShieldIcon,
            title: m.about_page_benefit_quality_title,
            text: m.about_page_benefit_quality_text
        },
        {
            icon: FlameIcon,
            title: m.about_page_benefit_pricing_title,
            text: m.about_page_benefit_pricing_text
        },
        {
            icon: UsersIcon,
            title: m.about_page_benefit_availability_title,
            text: m.about_page_benefit_availability_text
        },
        {
            icon: HeartIcon,
            title: m.about_page_benefit_support_title,
            text: m.about_page_benefit_support_text
        }
    ];

    const stats = [
        {
            value: '5+',
            label: m.about_page_stat_categories_label,
            detail: m.about_page_stat_categories_detail
        },
        {
            value: '100%',
            label: m.about_page_stat_quality_label,
            detail: m.about_page_stat_quality_detail
        },
        {
            value: '24/7',
            label: m.about_page_stat_commitment_label,
            detail: m.about_page_stat_commitment_detail
        },
        {
            value: 'ET',
            label: m.about_page_stat_market_label,
            detail: m.about_page_stat_market_detail
        }
    ];

    const focusAreas = [
        {
            icon: CrossIcon,
            title: m.about_page_layer_power_title,
            text: m.about_page_layer_power_text,
            image: '/image2.webp'
        },
        {
            icon: HeartIcon,
            title: m.about_page_layer_mobile_title,
            text: m.about_page_layer_mobile_text,
            image: '/image3.webp'
        },
        {
            icon: UsersIcon,
            title: m.about_page_layer_storage_title,
            text: m.about_page_layer_storage_text,
            image: '/image4.webp'
        },
        {
            icon: BookOpenIcon,
            title: m.about_page_layer_audio_title,
            text: m.about_page_layer_audio_text,
            image: '/image5.webp'
        }
    ];

    const journey = [
        {
            icon: ChurchIcon,
            title: m.about_page_journey_explore_title,
            text: m.about_page_journey_explore_text,
            image: '/image6.webp'
        },
        {
            icon: BookOpenIcon,
            title: m.about_page_journey_choose_title,
            text: m.about_page_journey_choose_text,
            image: '/image7.webp'
        },
        {
            icon: HandHeartIcon,
            title: m.about_page_journey_support_title,
            text: m.about_page_journey_support_text,
            image: '/image8.webp'
        }
    ];
</script>

<svelte:head>
    <title>{m.about_page_meta_title()}</title>
    <meta name="description" content={m.about_page_meta_description()} />
    <meta name="keywords" content={m.about_page_meta_keywords()} />
    <meta property="og:title" content={m.about_page_meta_title()} />
    <meta property="og:description" content={m.about_page_meta_description()} />
    <meta property="og:image" content="https://stewardoflife.et/og-about.jpg" />
</svelte:head>

<div class="bg-background text-foreground">
    <!-- Hero -->
    <section class="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-32">
        <div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div class="lg:col-span-6">
                <div
                    class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-[0.15em] text-primary uppercase"
                >
                    <ChurchIcon class="size-3.5" />
                    {m.about_page_hero_badge()}
                </div>

                <h1 class="mt-6 text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                    {m.about_page_hero_heading()}
                </h1>

                <p class="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                    {m.about_page_hero_description()}
                </p>

                <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button size="lg" href="/about" class="group gap-2">
                        {m.about_page_shop_now()}
                        <ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-1" />
                    </Button>

                    <Button size="lg" href="/contact" variant="outline">
                        {m.about_page_contact_us()}
                    </Button>
                </div>
            </div>

            <div class="lg:col-span-6">
                <div class="overflow-hidden rounded-3xl border border-border bg-muted">
                    <img
                        src="/image1.webp"
                        alt={m.about_page_hero_heading()}
                        class="aspect-[4/3] h-full w-full object-cover"
                    />
                </div>
            </div>
        </div>
    </section>

   

    <!-- What you can count on -->
    <section class="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {#each benefits as item (item.title)}
                {@const Icon = item.icon}
                <div
                    class="rounded-2xl border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/30"
                >
                    <div class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon class="size-5" />
                    </div>
                    <h3 class="mt-4 text-base font-semibold">{item.title()}</h3>
                    <p class="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text()}</p>
                </div>
            {/each}
        </div>
    </section>

     <Mission />
    <!-- Three pillars (previously tabbed — now all visible) -->
    <section class="border-y border-border bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
            <div class="mx-auto max-w-2xl text-center">
                <p class="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                    {m.about_page_why_label()}
                </p>
                <h2 class="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                    {m.about_page_why_heading()}
                </h2>
            </div>

            <div class="mt-12 grid gap-6 lg:grid-cols-3">
                {#each pillars as pillar (pillar.title)}
                    {@const Icon = pillar.icon}
                    <article class="flex flex-col rounded-2xl border border-border bg-card p-7">
                        <div class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon class="size-6" />
                        </div>

                        <p class="mt-5 text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                            {pillar.label()}
                        </p>
                        <h3 class="mt-2 text-xl font-bold tracking-tight">{pillar.title()}</h3>
                        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.text()}</p>

                        <Separator class="my-6" />

                        <ul class="space-y-3">
                            {#each pillar.points as point}
                                <li class="flex items-start gap-3">
                                    <span class="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                                        <CheckIcon class="size-3" />
                                    </span>
                                    <span class="text-sm font-medium">{point()}</span>
                                </li>
                            {/each}
                        </ul>
                    </article>
                {/each}
            </div>
        </div>
    </section>

    <!-- Stats -->
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div
            class="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
        >
            {#each stats as stat (stat.value)}
                <div class="bg-card p-7">
                    <p class="text-4xl font-bold tracking-tight text-primary">{stat.value}</p>
                    <h3 class="mt-3 text-sm font-semibold tracking-wide uppercase">{stat.label()}</h3>
                    <p class="mt-2 text-sm leading-relaxed text-muted-foreground">{stat.detail()}</p>
                </div>
            {/each}
        </div>
    </section>

    <!-- Focus areas -->
    <section class="border-y border-border bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
            <div class="mx-auto max-w-2xl text-center">
                <p class="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                    {m.about_page_product_categories_label()}
                </p>
                <h2 class="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                    {m.about_page_product_categories_title()}
                </h2>
                <p class="mt-4 text-base leading-relaxed text-muted-foreground">
                    {m.about_page_product_categories_description()}
                </p>
            </div>

            <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {#each focusAreas as area (area.title)}
                    {@const Icon = area.icon}
                    <article
                        class="group overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 hover:border-primary/30"
                    >
                        <img
                            src={area.image}
                            alt={area.title()}
                            class="aspect-[3/2] w-full object-cover"
                        />
                        <div class="p-6">
                            <div class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Icon class="size-5" />
                            </div>
                            <h3 class="mt-4 text-lg font-semibold">{area.title()}</h3>
                            <p class="mt-2 text-sm leading-relaxed text-muted-foreground">{area.text()}</p>
                        </div>
                    </article>
                {/each}
            </div>
        </div>
    </section>

    <!-- How it works — numbered because it is an actual sequence -->
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
            <p class="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                {m.about_page_buying_flow_label()}
            </p>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {m.about_page_buying_flow_title()}
            </h2>
        </div>

        <div class="mt-12 grid gap-6 lg:grid-cols-3">
            {#each journey as step, i (step.title)}
                {@const Icon = step.icon}
                <article class="overflow-hidden rounded-2xl border border-border bg-card">
                    <img src={step.image} alt={step.title()} class="aspect-[3/2] w-full object-cover" />
                    <div class="p-6">
                        <div class="flex items-center gap-3">
                            <span
                                class="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                            >
                                <Icon class="size-5" />
                            </span>
                            <span class="text-sm font-semibold tracking-wide text-muted-foreground">
                                {m.about_page_step_label({ number: i + 1 })}
                            </span>
                        </div>
                        <h3 class="mt-4 text-lg font-semibold">{step.title()}</h3>
                        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text()}</p>
                    </div>
                </article>
            {/each}
        </div>
    </section>




    <!-- Closing call to action -->
    <section class="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div class="rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
            <div
                class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-[0.15em] text-primary uppercase"
            >
                <SparklesIcon class="size-3.5" />
                {m.about_page_cta_badge()}
            </div>

            <h2 class="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {m.about_page_cta_title()}
            </h2>

            <p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                {m.about_page_cta_description()}
            </p>

            <div class="mt-8">
                <Button href="/blogs" size="lg" class="group gap-2">
                    {m.about_page_shop_now()}
                    <ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>
        </div>
    </section>
</div>

<div class="flex flex-col my-6  justify-center items-center">
<div class="w-full lg:w-9/10 flex flex-col gap-16">


<Teammembers
  members={data.executives}
  eyebrow={m.team_eyebrow()}
  variant="full"
  title={m.team_executive_title()}
  description={m.team_executive_description()}
  />
  <span id="testimonial"></span>
<Testimonial testimonials={data.stories} variant="grid"
  title={m.testimonial_title()} ctaLabel={m.testimonial_see_all()} />



<Partners partners={data.allPartners} />
  </div>
</div>


<!-- {#if data?.imagesList?.length}
    <Slider imagesList={data.imagesList} />
{/if} -->



<Faq />