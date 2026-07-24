import { and, asc, count, desc, eq, inArray, like, or, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	galleries,
	galleryItems,
	ministryAreas,
	events,
	projects
} from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 12;
const SORTS = ['newest', 'oldest', 'title'] as const;

type Sort = (typeof SORTS)[number];

export const load: PageServerLoad = async ({ url }) => {
	const p = url.searchParams;

	const q = (p.get('q') ?? '').trim().slice(0, 100);
	const area = Number(p.get('area')) || 0;
	const year = Number(p.get('year')) || 0;
	const albumId = Number(p.get('album')) || 0;

	const rawSort = p.get('sort') ?? 'newest';
	const sort: Sort = SORTS.includes(rawSort as Sort) ? (rawSort as Sort) : 'newest';

	const currentPage = Math.max(1, Number(p.get('page')) || 1);
	const offset = (currentPage - 1) * PAGE_SIZE;

	const hasFilters = Boolean(q || area || year);

	/* Item counts per album, so the grid can show "24 photos". */
	const counts = db
		.select({
			galleryId: galleryItems.galleryId,
			total: sql<number>`count(*)`.as('item_total'),
			videos: sql<number>`sum(case when ${galleryItems.mediaType} = 'video' then 1 else 0 end)`.as(
				'video_total'
			)
		})
		.from(galleryItems)
		.groupBy(galleryItems.galleryId)
		.as('counts');

	const base: (SQL | undefined)[] = [eq(galleries.isPublished, true)];

	if (q) {
		base.push(or(like(galleries.title, `%${q}%`), like(galleries.description, `%${q}%`)));
	}
	if (area) base.push(eq(galleries.ministryAreaId, area));
	if (year) base.push(sql`year(${galleries.capturedOn}) = ${year}`);

	const where = and(...base);

	const orderBy =
		sort === 'oldest'
			? asc(galleries.capturedOn)
			: sort === 'title'
				? asc(galleries.title)
				: sql`${galleries.capturedOn} is null, ${galleries.capturedOn} desc`;

	const [albums, [{ total }], areaOptions, yearOptions] = await Promise.all([
		db
			.select({
				id: galleries.id,
				title: galleries.title,
				description: galleries.description,
				coverImage: galleries.coverImage,
				capturedOn: galleries.capturedOn,
				ministryAreaId: galleries.ministryAreaId,
				ministryAreaName: ministryAreas.name,
				eventId: galleries.eventId,
				eventName: events.name,
				eventSlug: events.slug,
				projectId: galleries.projectId,
				projectName: projects.name,
				projectSlug: projects.slug,
				itemCount: sql<number>`coalesce(${counts.total}, 0)`,
				videoCount: sql<number>`coalesce(${counts.videos}, 0)`
			})
			.from(galleries)
			.leftJoin(ministryAreas, eq(ministryAreas.id, galleries.ministryAreaId))
			.leftJoin(events, eq(events.id, galleries.eventId))
			.leftJoin(projects, eq(projects.id, galleries.projectId))
			.leftJoin(counts, eq(counts.galleryId, galleries.id))
			.where(where)
			.orderBy(orderBy)
			.limit(PAGE_SIZE)
			.offset(offset),

		db.select({ total: count() }).from(galleries).where(where),

		db
			.select({ id: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),

		db
			.selectDistinct({ year: sql<number>`year(${galleries.capturedOn})` })
			.from(galleries)
			.where(and(eq(galleries.isPublished, true), sql`${galleries.capturedOn} is not null`))
			.orderBy(desc(sql`year(${galleries.capturedOn})`))
	]);

	/* A few thumbnails per album for the stacked preview. */
	const ids = albums.map((album) => album.id);
	const previewRows = ids.length
		? await db
				.select({
					id: galleryItems.id,
					galleryId: galleryItems.galleryId,
					url: galleryItems.url,
					thumbnailUrl: galleryItems.thumbnailUrl,
					mediaType: galleryItems.mediaType
				})
				.from(galleryItems)
				.where(inArray(galleryItems.galleryId, ids))
				.orderBy(asc(galleryItems.sortOrder))
		: [];

	const list = albums.map((album) => ({
		...album,
		preview: previewRows.filter((item) => item.galleryId === album.id).slice(0, 4)
	}));

	/* ?album=12 opens the viewer — a real URL people can share. */
	let album: {
		id: number;
		title: string;
		description: string | null;
		capturedOn: Date | string | null;
		ministryAreaName: string | null;
		eventName: string | null;
		eventSlug: string | null;
		projectName: string | null;
		projectSlug: string | null;
		items: {
			id: number;
			mediaType: string | null;
			url: string;
			thumbnailUrl: string | null;
			caption: string | null;
		}[];
	} | null = null;

	if (albumId) {
		const [row] = await db
			.select({
				id: galleries.id,
				title: galleries.title,
				description: galleries.description,
				capturedOn: galleries.capturedOn,
				ministryAreaName: ministryAreas.name,
				eventName: events.name,
				eventSlug: events.slug,
				projectName: projects.name,
				projectSlug: projects.slug
			})
			.from(galleries)
			.leftJoin(ministryAreas, eq(ministryAreas.id, galleries.ministryAreaId))
			.leftJoin(events, eq(events.id, galleries.eventId))
			.leftJoin(projects, eq(projects.id, galleries.projectId))
			.where(and(eq(galleries.id, albumId), eq(galleries.isPublished, true)))
			.limit(1);

		if (row) {
			const items = await db
				.select({
					id: galleryItems.id,
					mediaType: galleryItems.mediaType,
					url: galleryItems.url,
					thumbnailUrl: galleryItems.thumbnailUrl,
					caption: galleryItems.caption
				})
				.from(galleryItems)
				.where(eq(galleryItems.galleryId, row.id))
				.orderBy(asc(galleryItems.sortOrder));

			album = { ...row, items };
		}
	}

	return {
		albums: list,
		album,
		options: {
			areas: areaOptions,
			years: yearOptions.map((row) => Number(row.year)).filter(Boolean)
		},
		filters: { q, area, year, sort, hasFilters },
		pagination: {
			page: currentPage,
			pageSize: PAGE_SIZE,
			total,
			pages: Math.max(1, Math.ceil(total / PAGE_SIZE))
		}
	};
};