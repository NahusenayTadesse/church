import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { asc, desc } from 'drizzle-orm';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

import { add, parseVideoUrls } from './schema';
import { db } from '$lib/server/db';
import { galleries, galleryItems, ministryAreas, projects, events } from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(add));

	const [areas, projectOptions, eventOptions] = await Promise.all([
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db.select({ value: projects.id, name: projects.name }).from(projects).orderBy(asc(projects.name)),
		// Newest first — photos almost always come from a recent event.
		db.select({ value: events.id, name: events.name }).from(events).orderBy(desc(events.startsAt))
	]);

	return { form, areas, projectOptions, eventOptions };
};

const uploadGallery = async (files: File[] | undefined) => {
	const valid = (files ?? []).filter((f) => f && f.size > 0);
	if (valid.length === 0) return [];

	return Promise.all(valid.map((file) => saveUploadedFile(file)));
};

/**
 * A video item with no thumbnail renders as a blank tile. YouTube exposes one at
 * a predictable path, so derive it; anything else is left for the gallery page.
 */
const youtubeId = (url: string) => {
	try {
		const u = new URL(url);
		const host = u.hostname.replace(/^www\./, '');

		if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;

		if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
			if (u.pathname === '/watch') return u.searchParams.get('v');
			const match = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/);
			if (match) return match[1];
		}

		return null;
	} catch {
		return null;
	}
};

const thumbnailFor = (url: string) => {
	const id = youtubeId(url);
	return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

export const actions: Actions = {
	addGallery: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const {
			title,
			description,
			ministryArea,
			event,
			project,
			capturedOn,
			cover,
			gallery,
			videoUrls,
			isPublished,
			isFeaturedOnHome
		} = form.data;

		let galleryId: number;

		try {
			// Uploads run before the transaction opens — no point holding a DB
			// connection while fifty photos stream to disk.
			const [photoUrls, coverUrl] = await Promise.all([
				uploadGallery(gallery),
				cover ? saveUploadedFile(cover) : Promise.resolve(null)
			]);

			const videos = parseVideoUrls(videoUrls).map((url) => ({
				url,
				thumbnailUrl: thumbnailFor(url)
			}));

			// Fall back through the material that's already here rather than
			// leaving the gallery card blank.
			const coverImage =
				coverUrl ?? photoUrls[0] ?? videos.find((v) => v.thumbnailUrl)?.thumbnailUrl ?? null;

			// Photos first, then videos — captions and reordering happen on the
			// gallery's own page, where you can see what you're arranging.
			const items = [
				...photoUrls.map((url, i) => ({
					mediaType: 'image' as const,
					url,
					thumbnailUrl: null,
					sortOrder: i
				})),
				...videos.map((v, i) => ({
					mediaType: 'video' as const,
					url: v.url,
					thumbnailUrl: v.thumbnailUrl,
					sortOrder: photoUrls.length + i
				}))
			];

			galleryId = await db.transaction(async (tx) => {
				const [row] = await tx
					.insert(galleries)
					.values({
						title,
						description: description || null,
						coverImage,
						ministryAreaId: ministryArea === 0 ? null : ministryArea,
						eventId: event === 0 ? null : event,
						projectId: project === 0 ? null : project,
						capturedOn: capturedOn || null,
						isPublished,
						isFeaturedOnHome: isPublished && isFeaturedOnHome,
						createdBy: locals?.user?.id
					})
					.$returningId();

				if (items.length > 0) {
					await tx.insert(galleryItems).values(items.map((i) => ({ galleryId: row.id, ...i })));
				}

				return row.id;
			});
		} catch (err) {
			console.error('Failed to add gallery:', err);
			return message(
				form,
				{ type: 'error', text: 'An error occurred while adding the gallery.' },
				{ status: 500 }
			);
		}

		// `redirect` throws, so it stays outside the try block.
		redirect(
			`/dashboard/galleries/single/${galleryId}`,
			{ type: 'success', message: 'New gallery successfully added' },
			cookies
		);
	}
};