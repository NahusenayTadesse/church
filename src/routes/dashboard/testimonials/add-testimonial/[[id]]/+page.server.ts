import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { asc, desc } from 'drizzle-orm';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

import { add } from './schema';
import { db } from '$lib/server/db';
import { testimonials, ministryAreas, projects, events } from '$lib/server/db/schema';
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
		// Newest first — a story almost always comes from a recent event.
		db.select({ value: events.id, name: events.name }).from(events).orderBy(desc(events.startsAt))
	]);

	return { form, areas, projectOptions, eventOptions };
};

export const actions: Actions = {
	addTestimonial: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod4(add));


		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const {
			name,
			position,
			title,
			message: story,
			avatar,
			ministryArea,
			project,
			event,
			storyDate,
			permissionGiven,
			isPublished,
			isFeaturedOnHome
		} = form.data;

		let testimonialId: number;

		try {
			const avatarUrl = avatar ? await saveUploadedFile(avatar) : null;

			const [row] = await db
				.insert(testimonials)
				.values({
					name,
					position: position || null,
					title: title || null,
					message: story,
					avatar: avatarUrl,

					ministryAreaId: ministryArea === 0 ? null : ministryArea,
					projectId: project === 0 ? null : project,
					eventId: event === 0 ? null : event,
					storyDate: storyDate || null,

					permissionGiven,
					// Belt and braces: the schema rejects this combination already, but
					// nothing published should ever depend on a single check.
					isPublished: permissionGiven && isPublished,
					isFeaturedOnHome: permissionGiven && isPublished && isFeaturedOnHome,
					createdBy: locals?.user?.id
				})
				.$returningId();

			testimonialId = row.id;
		} catch (err) {
			console.error('Failed to add testimonial:', err);
			return message(
				form,
				{ type: 'error', text: 'An error occurred while adding the testimonial.' },
				{ status: 500 }
			);
		}

		// `redirect` throws, so it stays outside the try block.
		redirect(
			`/dashboard/testimonials/single/${testimonialId}`,
			{ type: 'success', message: 'New testimonial successfully added' },
			cookies
		);
	}
};