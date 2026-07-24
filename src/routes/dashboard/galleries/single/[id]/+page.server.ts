import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setFlash } from 'sveltekit-flash-message/server';
import { eq, and, asc, sql } from 'drizzle-orm';

import { edit, addImages, addVideo, editItem, moveItem, itemId } from './schema';

import { db } from '$lib/server/db';
import { galleries, galleryItems } from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload';

import type { Actions } from './$types';

/** Items are appended, so new uploads keep the order the user picked them in. */
const nextSortOrder = async (galleryId: number) =>
	db
		.select({ max: sql<number>`coalesce(max(${galleryItems.sortOrder}), -1)` })
		.from(galleryItems)
		.where(eq(galleryItems.galleryId, galleryId))
		.then((rows) => (rows[0]?.max ?? -1) + 1);

/** Rewrites sortOrder to 0..n-1 so gaps from deletes don't accumulate. */
const normalizeOrder = async (galleryId: number, tx = db) => {
	const rows = await tx
		.select({ id: galleryItems.id })
		.from(galleryItems)
		.where(eq(galleryItems.galleryId, galleryId))
		.orderBy(asc(galleryItems.sortOrder), asc(galleryItems.id));

	for (const [sortOrder, row] of rows.entries()) {
		await tx.update(galleryItems).set({ sortOrder }).where(eq(galleryItems.id, row.id));
	}
};

export const actions: Actions = {
	editGallery: async ({ request, cookies, locals, params }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(edit));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return fail(400, { form });
		}

		const { cover, ...values } = form.data;

		try {
			await db
				.update(galleries)
				.set({
					...values,
					updatedBy: locals?.user?.id,
					...(cover ? { coverImage: await saveUploadedFile(cover) } : {})
				})
				.where(eq(galleries.id, id));

			return message(form, { type: 'success', text: 'Gallery updated' });
		} catch (err) {
			console.error('Error updating gallery:', err);
			return message(form, { type: 'error', text: `Gallery update failed: ${err?.message}` });
		}
	},

	delete: async ({ cookies, params }) => {
		const id = Number(params.id);

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Gallery id missing from the URL.' }, cookies);
			return fail(400);
		}

		try {
			/* gallery_items cascades. */
			await db.delete(galleries).where(eq(galleries.id, id));

			setFlash({ type: 'success', message: 'Gallery deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting gallery:', err);
			setFlash({ type: 'error', message: `Delete failed: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── items ───────────────────────────────────────────────────────────── */

	addImages: async ({ request, params, cookies }) => {
		const galleryId = Number(params.id);
		const form = await superValidate(request, zod4(addImages));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Pick at least one image to upload.' }, cookies);
			return fail(400, { form });
		}

		try {
			const start = await nextSortOrder(galleryId);
			const urls = await Promise.all(form.data.images.map((file) => saveUploadedFile(file)));

			await db.insert(galleryItems).values(
				urls.map((url, i) => ({
					galleryId,
					mediaType: 'image' as const,
					url,
					sortOrder: start + i
				}))
			);

			setFlash(
				{ type: 'success', message: `${urls.length} image(s) added` },
				cookies
			);
		} catch (err) {
			console.error('Error adding gallery images:', err);
			setFlash({ type: 'error', message: `Upload failed: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	addVideo: async ({ request, params, cookies }) => {
		const galleryId = Number(params.id);
		const form = await superValidate(request, zod4(addVideo));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the video details.' }, cookies);
			return fail(400, { form });
		}

		const { url, caption, thumbnail } = form.data;

		try {
			await db.insert(galleryItems).values({
				galleryId,
				mediaType: 'video',
				url,
				caption,
				thumbnailUrl: thumbnail ? await saveUploadedFile(thumbnail) : null,
				sortOrder: await nextSortOrder(galleryId)
			});

			setFlash({ type: 'success', message: 'Video added' }, cookies);
		} catch (err) {
			console.error('Error adding gallery video:', err);
			setFlash({ type: 'error', message: `Could not add video: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	editItem: async ({ request, params, cookies }) => {
		const galleryId = Number(params.id);
		const form = await superValidate(request, zod4(editItem));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the item details.' }, cookies);
			return fail(400, { form });
		}

		const { id, caption, url, file } = form.data;

		try {
			const item = await db
				.select({ mediaType: galleryItems.mediaType })
				.from(galleryItems)
				.where(and(eq(galleryItems.id, id), eq(galleryItems.galleryId, galleryId)))
				.limit(1)
				.then((rows) => rows[0]);

			if (!item) {
				setFlash({ type: 'error', message: 'Item not found.' }, cookies);
				return fail(404);
			}

			const uploaded = file ? await saveUploadedFile(file) : null;

			/* On a video the file is the poster frame; on an image it's the image. */
			const patch =
				item.mediaType === 'video'
					? { caption, ...(url ? { url } : {}), ...(uploaded ? { thumbnailUrl: uploaded } : {}) }
					: { caption, ...(uploaded ? { url: uploaded } : {}) };

			await db.update(galleryItems).set(patch).where(eq(galleryItems.id, id));

			setFlash({ type: 'success', message: 'Item updated' }, cookies);
		} catch (err) {
			console.error('Error updating gallery item:', err);
			setFlash({ type: 'error', message: `Could not update item: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	deleteItem: async ({ request, params, cookies }) => {
		const galleryId = Number(params.id);
		const form = await superValidate(request, zod4(itemId));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Item id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(galleryItems)
				.where(and(eq(galleryItems.id, form.data.id), eq(galleryItems.galleryId, galleryId)));

			await normalizeOrder(galleryId);

			setFlash({ type: 'success', message: 'Item removed' }, cookies);
		} catch (err) {
			console.error('Error deleting gallery item:', err);
			setFlash({ type: 'error', message: `Could not remove item: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	moveItem: async ({ request, params, cookies }) => {
		const galleryId = Number(params.id);
		const form = await superValidate(request, zod4(moveItem));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Item id or direction missing.' }, cookies);
			return fail(400);
		}

		const { id, direction } = form.data;

		try {
			const rows = await db
				.select({ id: galleryItems.id })
				.from(galleryItems)
				.where(eq(galleryItems.galleryId, galleryId))
				.orderBy(asc(galleryItems.sortOrder), asc(galleryItems.id));

			const index = rows.findIndex((r) => r.id === id);
			const target = direction === 'up' ? index - 1 : index + 1;

			if (index === -1 || target < 0 || target >= rows.length) {
				/* Already at the end of the row — nothing to do, and nothing worth saying. */
				return;
			}

			[rows[index], rows[target]] = [rows[target], rows[index]];

			await db.transaction(async (tx) => {
				for (const [sortOrder, row] of rows.entries()) {
					await tx.update(galleryItems).set({ sortOrder }).where(eq(galleryItems.id, row.id));
				}
			});
		} catch (err) {
			console.error('Error reordering gallery:', err);
			setFlash({ type: 'error', message: `Could not reorder: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	setCover: async ({ request, params, cookies, locals }) => {
		const galleryId = Number(params.id);
		const form = await superValidate(request, zod4(itemId));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Item id missing.' }, cookies);
			return fail(400);
		}

		try {
			const item = await db
				.select({
					url: galleryItems.url,
					thumbnailUrl: galleryItems.thumbnailUrl,
					mediaType: galleryItems.mediaType
				})
				.from(galleryItems)
				.where(and(eq(galleryItems.id, form.data.id), eq(galleryItems.galleryId, galleryId)))
				.limit(1)
				.then((rows) => rows[0]);

			if (!item) {
				setFlash({ type: 'error', message: 'Item not found.' }, cookies);
				return fail(404);
			}

			/* A video's own URL isn't an image, so the poster frame is the only option. */
			const cover = item.mediaType === 'video' ? item.thumbnailUrl : item.url;

			if (!cover) {
				setFlash(
					{ type: 'error', message: 'That video has no poster frame yet — add one first.' },
					cookies
				);
				return fail(400);
			}

			/* galleries.coverImage is varchar(255) while galleryItems.url is varchar(500). */
			if (cover.length > 255) {
				setFlash(
					{ type: 'error', message: 'That URL is too long to store as a cover. Upload a cover image instead.' },
					cookies
				);
				return fail(400);
			}

			await db
				.update(galleries)
				.set({ coverImage: cover, updatedBy: locals?.user?.id })
				.where(eq(galleries.id, galleryId));

			setFlash({ type: 'success', message: 'Cover updated' }, cookies);
		} catch (err) {
			console.error('Error setting gallery cover:', err);
			setFlash({ type: 'error', message: `Could not set cover: ${err?.message}` }, cookies);
			return fail(400);
		}
	}
};