import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setFlash } from 'sveltekit-flash-message/server';
import { eq } from 'drizzle-orm';

import { edit, setPublished, setFeatured, setPermission } from './schema';

import { db } from '$lib/server/db';
import { testimonials } from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload';

import type { Actions } from './$types';

export const actions: Actions = {
	editStory: async ({ request, cookies, locals, params }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(edit));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return fail(400, { form });
		}

		const { avatarUrl, ...values } = form.data;

			const [oldPhoto] =  await db.select({ photo: testimonials.avatar}).from(testimonials).where(eq(testimonials.id, id)).limit(1)
				const photo = avatarUrl ? await saveUploadedFile(avatarUrl) : oldPhoto.photo
		

		try {
			/* The zod refines already cover this, but the rule is important enough
			   that the write path enforces it too rather than trusting validation. */
			const gated = {
				...values,
				isPublished: values.permissionGiven ? values.isPublished : false,
				isFeaturedOnHome:
					values.permissionGiven && values.isPublished ? values.isFeaturedOnHome : false
			};

			await db
				.update(testimonials)
				.set({
					...gated,
					updatedBy: locals?.user?.id,
					avatar: photo,	
				})
				.where(eq(testimonials.id, id));

			return message(form, { type: 'success', text: 'Story updated' });
		} catch (err) {
			console.error('Error updating testimonial:', err);
			return message(form, { type: 'error', text: `Update failed: ${err?.message}` });
		}
	},

	delete: async ({ cookies, params }) => {
		const id = Number(params.id);

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Story id missing from the URL.' }, cookies);
			return fail(400);
		}

		try {
			/* Nothing references testimonials, so this one is a clean delete. */
			await db.delete(testimonials).where(eq(testimonials.id, id));

			setFlash({ type: 'success', message: 'Story deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting testimonial:', err);
			setFlash({ type: 'error', message: `Delete failed: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── moderation ──────────────────────────────────────────────────────── */

	/**
	 * Recording or withdrawing permission. Withdrawing takes the story off the
	 * site in the same write — leaving it up for even one more request would be
	 * the exact failure this column exists to prevent.
	 */
	setPermission: async ({ request, params, cookies, locals }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(setPermission));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Could not read that.' }, cookies);
			return fail(400);
		}

		const given = form.data.permissionGiven === true;

		try {
			await db
				.update(testimonials)
				.set({
					permissionGiven: given,
					...(given ? {} : { isPublished: false, isFeaturedOnHome: false }),
					updatedBy: locals?.user?.id
				})
				.where(eq(testimonials.id, id));

			setFlash(
				{
					type: 'success',
					message: given
						? 'Permission recorded — the story can be published now'
						: 'Permission withdrawn and the story taken off the site'
				},
				cookies
			);
		} catch (err) {
			console.error('Error updating permission:', err);
			setFlash({ type: 'error', message: `Could not update: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	setPublished: async ({ request, params, cookies, locals }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(setPublished));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Could not read that.' }, cookies);
			return fail(400);
		}

		const publish = form.data.isPublished === true;

		try {
			const current = await db
				.select({ permissionGiven: testimonials.permissionGiven })
				.from(testimonials)
				.where(eq(testimonials.id, id))
				.limit(1)
				.then((rows) => rows[0]);

			if (!current) {
				setFlash({ type: 'error', message: 'Story not found.' }, cookies);
				return fail(404);
			}

			if (publish && !current.permissionGiven) {
				setFlash(
					{
						type: 'error',
						message: "This story has no recorded permission, so it can't go on the site."
					},
					cookies
				);
				return fail(400);
			}

			await db
				.update(testimonials)
				.set({
					isPublished: publish,
					/* Unpublishing has to pull it off the home page too. */
					...(publish ? {} : { isFeaturedOnHome: false }),
					updatedBy: locals?.user?.id
				})
				.where(eq(testimonials.id, id));

			setFlash(
				{ type: 'success', message: publish ? 'Story published' : 'Story unpublished' },
				cookies
			);
		} catch (err) {
			console.error('Error publishing testimonial:', err);
			setFlash({ type: 'error', message: `Could not update: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	setFeatured: async ({ request, params, cookies, locals }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(setFeatured));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Could not read that.' }, cookies);
			return fail(400);
		}

		const feature = form.data.isFeaturedOnHome === true;

		try {
			const current = await db
				.select({
					permissionGiven: testimonials.permissionGiven,
					isPublished: testimonials.isPublished
				})
				.from(testimonials)
				.where(eq(testimonials.id, id))
				.limit(1)
				.then((rows) => rows[0]);

			if (!current) {
				setFlash({ type: 'error', message: 'Story not found.' }, cookies);
				return fail(404);
			}

			if (feature && !(current.permissionGiven && current.isPublished)) {
				setFlash(
					{ type: 'error', message: 'Publish the story before featuring it on the home page.' },
					cookies
				);
				return fail(400);
			}

			await db
				.update(testimonials)
				.set({ isFeaturedOnHome: feature, updatedBy: locals?.user?.id })
				.where(eq(testimonials.id, id));

			setFlash(
				{ type: 'success', message: feature ? 'Added to the home page' : 'Removed from the home page' },
				cookies
			);
		} catch (err) {
			console.error('Error featuring testimonial:', err);
			setFlash({ type: 'error', message: `Could not update: ${err?.message}` }, cookies);
			return fail(400);
		}
	}
};
