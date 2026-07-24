import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setFlash } from 'sveltekit-flash-message/server';
import { eq } from 'drizzle-orm';

import { edit, editGallery } from './schema';

import { db } from '$lib/server/db';
import { blog, blogGallery } from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload';

import type { Actions } from './$types';

export const actions: Actions = {
	editProduct: async ({ request, cookies, locals, params }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(edit));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return fail(400, { form });
		}

		const { image, ...values } = form.data;

		try {
			const current = await db
				.select({ status: blog.status, publishedAt: blog.publishedAt })
				.from(blog)
				.where(eq(blog.id, id))
				.limit(1)
				.then((rows) => rows[0]);

			if (!current) {
				return message(form, { type: 'error', text: 'Blog post not found' }, { status: 404 });
			}

			/* Stamp publishedAt the first time it goes live, and leave it alone after that. */
			const publishedAt =
				values.status === 'published' ? (current.publishedAt ?? new Date()) : current.publishedAt;

			const patch = {
				...values,
				publishedAt,
				updatedBy: locals?.user?.id,
				...(image ? { featuredImage: await saveUploadedFile(image) } : {})
			};

			await db.update(blog).set(patch).where(eq(blog.id, id));

			return message(form, { type: 'success', text: 'Blog updated' });
		} catch (err) {
			console.error('Error updating blog:', err);

			/* Slug and title both carry unique indexes. */
			if (err?.code === 'ER_DUP_ENTRY') {
				return message(form, {
					type: 'error',
					text: 'That slug is already taken — pick another one.'
				});
			}

			return message(form, { type: 'error', text: `Blog update failed: ${err?.message}` });
		}
	},

	delete: async ({ cookies, params }) => {
		const id = Number(params.id);

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Blog id missing from the URL.' }, cookies);
			return fail(400);
		}

		try {
			/* blog_gallery, resource_tags and related_resources all cascade. */
			await db.delete(blog).where(eq(blog.id, id));

			setFlash({ type: 'success', message: 'Blog deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting blog:', err);
			setFlash({ type: 'error', message: `Delete failed: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	editGallery: async ({ params, request }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(editGallery));

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check your form data.' }, { status: 400 });
		}

		const { existing, gallery } = form.data;

		try {
			const uploaded = gallery?.length ? await uploadGallery(gallery) : [];

			/* Kept images first, in the order shown, then anything new. */
			const finalList = [...new Set([...existing, ...uploaded])]
				.map((url) => url?.trim())
				.filter((url): url is string => !!url);

			await db.transaction(async (tx) => {
				await tx.delete(blogGallery).where(eq(blogGallery.blogId, id));

				if (finalList.length > 0) {
					await tx.insert(blogGallery).values(
						finalList.map((imageUrl, sortOrder) => ({ blogId: id, imageUrl, sortOrder }))
					);
				}
			});

			return message(form, { type: 'success', text: 'Gallery saved' });
		} catch (err) {
			console.error('Error saving blog gallery:', err);
			return message(form, { type: 'error', text: `Gallery save failed: ${err?.message}` }, { status: 500 });
		}
	}
};

const uploadGallery = async (gallery: File[]) => {
	const uploaded = await Promise.all(gallery.map((file) => saveUploadedFile(file)));
	return uploaded as string[];
};