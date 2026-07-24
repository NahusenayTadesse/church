<script lang="ts">
    import { Cross, HandHeart, ShieldCheck, Sprout, Gem, Flame, Eye, Compass } from '@lucide/svelte';
    import { Badge } from '$lib/components/ui/badge';
    import { Separator } from '$lib/components/ui/separator';
    import * as m from '$lib/paraglide/messages.js';
    import { getLocale } from '$lib/paraglide/runtime.js';

    // Ge'ez has no case and reads badly with tracking, so the type asks the locale first.
    const isAmharic = $derived(getLocale() === 'am');
    const eyebrow = $derived(
        isAmharic ? 'text-sm font-semibold' : 'text-xs font-semibold uppercase tracking-[0.18em]'
    );

    const values = [
        { id: 'christ', icon: Cross, title: m.vmv_value_christ_title, body: m.vmv_value_christ_body },
        {
            id: 'servant',
            icon: HandHeart,
            title: m.vmv_value_servant_title,
            body: m.vmv_value_servant_body
        },
        {
            id: 'integrity',
            icon: ShieldCheck,
            title: m.vmv_value_integrity_title,
            body: m.vmv_value_integrity_body
        },
        {
            id: 'steward',
            icon: Sprout,
            title: m.vmv_value_steward_title,
            body: m.vmv_value_steward_body
        },
        {
            id: 'excellence',
            icon: Gem,
            title: m.vmv_value_excellence_title,
            body: m.vmv_value_excellence_body
        },
        {
            id: 'transform',
            icon: Flame,
            title: m.vmv_value_transform_title,
            body: m.vmv_value_transform_body
        }
    ];

    const chips = [
        m.vmv_mission_chip_leaders,
        m.vmv_mission_chip_youth,
        m.vmv_mission_chip_families,
        m.vmv_mission_chip_enterprise
    ];
</script>

<!--
    Signature motif: "harag" — the interlaced vine that frames the margins of Ge'ez
    manuscripts. One motif at three scales: a rule under the heading, a watermark
    behind the vision panel, and a roundel around every value icon.
-->
<svg width="0" height="0" class="absolute" aria-hidden="true" focusable="false">
    <defs>
        <pattern id="harag-braid" width="48" height="24" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round">
                <path d="M0 12C8 -1 16 -1 24 12S40 25 48 12" />
                <path d="M0 12C8 25 16 25 24 12S40 -1 48 12" />
            </g>
            <circle cx="24" cy="12" r="1.6" fill="currentColor" />
        </pattern>
        <g id="harag-roundel">
            <circle cx="28" cy="28" r="26" />
            <circle cx="28" cy="28" r="22" stroke-dasharray="2 5" />
            <circle cx="28" cy="18" r="10" />
            <circle cx="28" cy="38" r="10" />
            <circle cx="18" cy="28" r="10" />
            <circle cx="38" cy="28" r="10" />
        </g>
    </defs>
</svg>

<section
    class="vmv relative w-full overflow-hidden bg-background py-24 font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground sm:py-32"
>
    <div
        class="pointer-events-none absolute -top-40 left-1/2 h-[26rem] w-[52rem] max-w-[140vw] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
    ></div>

    <div class="relative mx-auto w-full max-w-7xl px-6 md:px-8 lg:px-12">
        <!-- Masthead -->
        <header class="mx-auto max-w-2xl text-center">
            <p class="{eyebrow} text-primary">{m.vmv_eyebrow()}</p>

            <h2
                class="vmv-display mt-5 text-3xl leading-[1.15] text-balance md:text-5xl"
                class:tracking-tight={!isAmharic}
            >
                {m.vmv_heading()}
            </h2>

            <div class="mt-7 flex items-center justify-center gap-3 text-primary/45">
                <span class="h-px w-10 bg-current"></span>
                <svg class="h-6 w-40 shrink-0" viewBox="0 0 160 24" aria-hidden="true">
                    <rect width="160" height="24" fill="url(#harag-braid)" />
                </svg>
                <span class="h-px w-10 bg-current"></span>
            </div>

            <p
                class="mt-7 text-sm leading-relaxed font-medium text-balance text-muted-foreground md:text-base"
            >
                {m.vmv_intro()}
            </p>
        </header>

        <!-- Vision + Mission -->
        <div class="mt-16 grid grid-cols-1 items-stretch gap-6 lg:mt-20 lg:grid-cols-12">
            <div
                class="relative isolate overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-md md:p-12 lg:col-span-7 lg:p-14"
            >
                <svg
                    class="pointer-events-none absolute -top-10 -right-16 h-[130%] w-[70%] text-primary-foreground opacity-[0.13]"
                    viewBox="0 0 320 320"
                    aria-hidden="true"
                >
                    <g
                        transform="rotate(-24 160 160) scale(2.6)"
                        stroke="currentColor"
                        stroke-width="0.5"
                        fill="none"
                    >
                        <use href="#harag-roundel" x="20" y="20" />
                        <use href="#harag-roundel" x="20" y="76" />
                        <use href="#harag-roundel" x="76" y="48" />
                    </g>
                </svg>

                <div class="relative flex h-full flex-col gap-8">
                    <div class="flex items-center gap-3">
                        <span
                            class="grid size-10 place-items-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 ring-inset"
                        >
                            <Eye class="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </span>
                        <span class="{eyebrow} text-primary-foreground/85">{m.vmv_vision_label()}</span>
                    </div>

                    <p
                        class="vmv-display max-w-2xl text-[1.7rem] leading-[1.35] text-balance md:text-[2.15rem] md:leading-[1.3]"
                        class:tracking-tight={!isAmharic}
                    >
                        {m.vmv_vision_body()}
                    </p>

                    <div class="mt-auto flex items-end justify-between gap-6 pt-4">
                        <blockquote class="max-w-xs text-sm leading-relaxed text-primary-foreground/75">
                            {m.vmv_anchor_text()}
                            <footer class="mt-1.5 text-xs font-semibold text-primary-foreground/60">
                                {m.vmv_anchor_ref()}
                            </footer>
                        </blockquote>
                        <svg
                            class="hidden h-5 w-24 shrink-0 text-primary-foreground/35 sm:block"
                            viewBox="0 0 96 24"
                            aria-hidden="true"
                        >
                            <rect width="96" height="24" fill="url(#harag-braid)" />
                        </svg>
                    </div>
                </div>
            </div>

            <div
                class="relative flex flex-col gap-7 rounded-[2rem] border border-primary/10 bg-card p-8 text-card-foreground shadow-sm md:p-12 lg:col-span-5 lg:p-14"
            >
                <div class="flex items-center gap-3">
                    <span
                        class="grid size-10 place-items-center rounded-full bg-secondary text-primary ring-1 ring-primary/20 ring-inset"
                    >
                        <Compass class="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </span>
                    <span class="{eyebrow} text-muted-foreground">{m.vmv_mission_label()}</span>
                </div>

                <p class="text-sm leading-[1.8] font-medium text-balance md:text-base">
                    {m.vmv_mission_body()}
                </p>

                <div class="mt-auto flex flex-wrap gap-2 pt-1">
                    {#each chips as chip}
                        <Badge variant="secondary" class="rounded-full px-3.5 py-1.5 font-semibold">
                            {chip()}
                        </Badge>
                    {/each}
                </div>
            </div>
        </div>

        <!-- Values -->
        <div class="mt-20 sm:mt-24">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p class="{eyebrow} text-primary">{m.vmv_values_label()}</p>
                    <h3 class="vmv-display mt-3 text-2xl md:text-3xl" class:tracking-tight={!isAmharic}>
                        {m.vmv_values_heading()}
                    </h3>
                </div>
                <p class="max-w-sm text-sm leading-relaxed font-medium text-muted-foreground">
                    {m.vmv_values_intro()}
                </p>
            </div>

            <Separator class="mt-8" />

            <ul class="mt-8 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                {#each values as value (value.id)}
                    {@const Icon = value.icon}
                    <li
                        class="vmv-value group flex gap-5 rounded-[1.25rem] border border-transparent p-5 transition-colors duration-300 hover:border-primary/10 hover:bg-card"
                    >
                        <span class="relative mt-0.5 grid size-14 shrink-0 place-items-center">
                            <svg
                                class="vmv-roundel absolute inset-0 h-14 w-14 text-primary/35 transition-[transform,color] duration-500 group-hover:text-primary/70"
                                viewBox="0 0 56 56"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1"
                                aria-hidden="true"
                            >
                                <use href="#harag-roundel" />
                            </svg>
                            <Icon class="relative h-5 w-5 text-primary" strokeWidth={1.75} />
                        </span>

                        <div class="min-w-0">
                            <h4 class="text-base font-bold tracking-tight">{value.title()}</h4>
                            <p class="mt-1.5 text-sm leading-relaxed font-medium text-muted-foreground">
                                {value.body()}
                            </p>
                        </div>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</section>

<style>
    /*
        One serif family across both scripts so the bilingual display type matches
        instead of collides. Add to app.html:
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Ethiopic:wght@400;500;600&family=Noto+Serif:wght@400;500;600&display=swap" rel="stylesheet" />
    */
    .vmv {
        --vmv-display: 'Noto Serif Ethiopic', 'Noto Serif', ui-serif, Georgia, serif;
    }

    :global(.vmv-display) {
        font-family: var(--vmv-display);
        font-weight: 600;
    }

    /* the roundel unwinds a quarter turn on hover — the only motion that moves */
    .vmv-value:hover .vmv-roundel {
        transform: rotate(45deg);
    }

    @media (prefers-reduced-motion: reduce) {
        .vmv-roundel {
            transition: none;
        }

        .vmv-value:hover .vmv-roundel {
            transform: none;
        }
    }
</style>