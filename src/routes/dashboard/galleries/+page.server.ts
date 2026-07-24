import { db } from '$lib/server/db';
import {
	galleries,
	galleryItems,
	ministryAreas,
	events,
	projects
} from '$lib/server/db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: galleries.id,
			title: galleries.title,
			description: galleries.description,
			coverImage: galleries.coverImage,

			ministryAreaId: galleries.ministryAreaId,
			ministryArea: ministryAreas.name,
			eventId: galleries.eventId,
			event: events.name,
			projectId: galleries.projectId,
			project: projects.name,

			capturedOn: galleries.capturedOn,
			isPublished: galleries.isPublished,
			isFeaturedOnHome: galleries.isFeaturedOnHome,
			createdAt: galleries.createdAt
		})
		.from(galleries)
		.leftJoin(ministryAreas, eq(galleries.ministryAreaId, ministryAreas.id))
		.leftJoin(events, eq(galleries.eventId, events.id))
		.leftJoin(projects, eq(galleries.projectId, projects.id))
		.orderBy(desc(galleries.capturedOn), desc(galleries.id));

	// Grouped separately so the counts don't get multiplied by the joins above.
	const itemRows = await db
		.select({
			galleryId: galleryItems.galleryId,
			items: count(galleryItems.id),
			images: sql<number>`sum(case when ${galleryItems.mediaType} = 'image' then 1 else 0 end)`,
			videos: sql<number>`sum(case when ${galleryItems.mediaType} = 'video' then 1 else 0 end)`,
			// a first image to fall back on when no cover was set
			firstUrl: sql<string>`min(${galleryItems.url})`
		})
		.from(galleryItems)
		.groupBy(galleryItems.galleryId);

	const itemMap = new Map(itemRows.map((i) => [i.galleryId, i]));

	const galleryList = rows.map((g) => {
		const i = itemMap.get(g.id);
		const items = Number(i?.items ?? 0);
		const videos = Number(i?.videos ?? 0);
		const images = Number(i?.images ?? 0);

		return {
			...g,
			items,
			images,
			videos,
			cover: g.coverImage ?? i?.firstUrl ?? null,
			isEmpty: items === 0,

			// Filter chips
			visibility: g.isPublished ? 'published' : 'hidden',
			mediaMix: items === 0 ? 'empty' : videos === 0 ? 'photos' : images === 0 ? 'videos' : 'mixed',
			// galleries can hang off an event, a project, or neither
			linkedTo: g.eventId ? 'event' : g.projectId ? 'project' : 'standalone',
			linkedName: g.event ?? g.project ?? null
		};
	});

	return { galleryList };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing gallery id' });

		try {
			// galleryItems cascade on delete
			await db.delete(galleries).where(eq(galleries.id, id));
			return { success: true, message: 'Gallery deleted' };
		} catch {
			return fail(500, { message: 'Could not delete gallery' });
		}
	},

	togglePublished: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing gallery id' });

		await db.update(galleries).set({ isPublished: !value }).where(eq(galleries.id, id));
		return { success: true };
	},

	toggleFeatured: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing gallery id' });

		await db.update(galleries).set({ isFeaturedOnHome: !value }).where(eq(galleries.id, id));
		return { success: true };
	},

	deleteItem: async ({ request }) => {
		const form = await request.formData();
		const itemId = Number(form.get('itemId'));
		if (!itemId) return fail(400, { message: 'Missing item id' });

		await db.delete(galleryItems).where(eq(galleryItems.id, itemId));
		return { success: true, message: 'Item removed' };
	}
};