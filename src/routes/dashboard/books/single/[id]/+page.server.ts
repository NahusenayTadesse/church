import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setFlash } from 'sveltekit-flash-message/server';
import { eq, and } from 'drizzle-orm';

import { edit, addFormat, editFormat, reviewAction, linkResource } from './schema';

import { db } from '$lib/server/db';
import { books, bookFormats, bookReviews, bookResources } from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload';

import type { Actions } from './$types';

/* decimal columns come back as strings from MySQL, so write them as strings too. */
const money = (v: number | null | undefined) => (v === null || v === undefined ? null : String(v));

export const actions: Actions = {
	editBook: async ({ request, cookies, locals, params }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(edit));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return fail(400, { form });
		}

		const { cover, preview, price, ...values } = form.data;

		try {
			const patch = {
				...values,
				price: money(price),
				updatedBy: locals?.user?.id,
				...(cover ? { coverImage: await saveUploadedFile(cover) } : {}),
				...(preview ? { previewFileUrl: await saveUploadedFile(preview) } : {})
			};

			const [result] = await db.update(books).set(patch).where(eq(books.id, id));

			/* affectedRows is 0 when the id doesn't exist; changedRows is 0 on a no-op save. */
			if (result?.affectedRows === 0) {
				return message(form, { type: 'error', text: 'Book not found' }, { status: 404 });
			}

			return message(form, { type: 'success', text: 'Book updated' });
		} catch (err) {
			console.error('Error updating book:', err);

			/* slug is unique. */
			if (err?.code === 'ER_DUP_ENTRY') {
				return message(form, {
					type: 'error',
					text: 'That slug is already taken — pick another one.'
				});
			}

			return message(form, { type: 'error', text: `Book update failed: ${err?.message}` });
		}
	},

	delete: async ({ cookies, params }) => {
		const id = Number(params.id);

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Book id missing from the URL.' }, cookies);
			return fail(400);
		}

		try {
			/* book_formats, book_reviews and book_resources all cascade. */
			await db.delete(books).where(eq(books.id, id));

			setFlash({ type: 'success', message: 'Book deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting book:', err);
			setFlash({ type: 'error', message: `Delete failed: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── formats ─────────────────────────────────────────────────────────── */

	addFormat: async ({ request, params, cookies }) => {
		const bookId = Number(params.id);
		const form = await superValidate(request, zod4(addFormat));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the format details.' }, cookies);
			return fail(400, { form });
		}

		const { format, price, isFreeDownload, file } = form.data;

		try {
			const exists = await db
				.select({ id: bookFormats.id })
				.from(bookFormats)
				.where(and(eq(bookFormats.bookId, bookId), eq(bookFormats.format, format)))
				.limit(1)
				.then((rows) => rows[0]);

			if (exists) {
				setFlash({ type: 'error', message: `This book already has a ${format} format.` }, cookies);
				return fail(400, { form });
			}

			await db.insert(bookFormats).values({
				bookId,
				format,
				price: money(price),
				isFreeDownload,
				fileUrl: file ? await saveUploadedFile(file) : null
			});

			setFlash({ type: 'success', message: `${format} format added` }, cookies);
		} catch (err) {
			console.error('Error adding book format:', err);
			setFlash({ type: 'error', message: `Could not add format: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	editFormat: async ({ request, params, cookies }) => {
		const bookId = Number(params.id);
		const form = await superValidate(request, zod4(editFormat));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the format details.' }, cookies);
			return fail(400, { form });
		}

		const { id, format, price, isFreeDownload, file } = form.data;

		try {
			await db
				.update(bookFormats)
				.set({
					format,
					price: money(price),
					isFreeDownload,
					...(file ? { fileUrl: await saveUploadedFile(file) } : {})
				})
				.where(and(eq(bookFormats.id, id), eq(bookFormats.bookId, bookId)));

			setFlash({ type: 'success', message: 'Format updated' }, cookies);
		} catch (err) {
			console.error('Error updating book format:', err);
			setFlash({ type: 'error', message: `Could not update format: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	deleteFormat: async ({ request, params, cookies }) => {
		const bookId = Number(params.id);
		const id = Number((await request.formData()).get('id'));

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Format id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(bookFormats)
				.where(and(eq(bookFormats.id, id), eq(bookFormats.bookId, bookId)));

			setFlash({ type: 'success', message: 'Format removed' }, cookies);
		} catch (err) {
			console.error('Error deleting book format:', err);
			setFlash({ type: 'error', message: `Could not remove format: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── reviews ─────────────────────────────────────────────────────────── */

	setReviewApproval: async ({ request, params, cookies }) => {
		const bookId = Number(params.id);
		const form = await superValidate(request, zod4(reviewAction));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Review id missing.' }, cookies);
			return fail(400);
		}

		const { id, isApproved } = form.data;
		const approved = isApproved === true;

		try {
			await db
				.update(bookReviews)
				.set({ isApproved: approved })
				.where(and(eq(bookReviews.id, id), eq(bookReviews.bookId, bookId)));

			setFlash(
				{ type: 'success', message: approved ? 'Review published' : 'Review hidden' },
				cookies
			);
		} catch (err) {
			console.error('Error updating review:', err);
			setFlash({ type: 'error', message: `Could not update review: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	deleteReview: async ({ request, params, cookies }) => {
		const bookId = Number(params.id);
		const id = Number((await request.formData()).get('id'));

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Review id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(bookReviews)
				.where(and(eq(bookReviews.id, id), eq(bookReviews.bookId, bookId)));

			setFlash({ type: 'success', message: 'Review deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting review:', err);
			setFlash({ type: 'error', message: `Could not delete review: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── related resources ───────────────────────────────────────────────── */

	linkResource: async ({ request, params, cookies }) => {
		const bookId = Number(params.id);
		const form = await superValidate(request, zod4(linkResource));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Pick a resource first.' }, cookies);
			return fail(400);
		}

		try {
			await db.insert(bookResources).values({ bookId, resourceId: form.data.resourceId });

			setFlash({ type: 'success', message: 'Resource linked' }, cookies);
		} catch (err) {
			console.error('Error linking resource:', err);
			setFlash({ type: 'error', message: `Could not link resource: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	unlinkResource: async ({ request, params, cookies }) => {
		const bookId = Number(params.id);
		const id = Number((await request.formData()).get('id'));

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Link id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(bookResources)
				.where(and(eq(bookResources.id, id), eq(bookResources.bookId, bookId)));

			setFlash({ type: 'success', message: 'Resource unlinked' }, cookies);
		} catch (err) {
			console.error('Error unlinking resource:', err);
			setFlash({ type: 'error', message: `Could not unlink resource: ${err?.message}` }, cookies);
			return fail(400);
		}
	}
};