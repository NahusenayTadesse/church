import { db } from '$lib/server/db';
import { testimonials, ministryAreas, projects, events } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: testimonials.id,
			name: testimonials.name,
			position: testimonials.position,
			title: testimonials.title,
			message: testimonials.message,
			avatar: testimonials.avatar,

			ministryAreaId: testimonials.ministryAreaId,
			ministryArea: ministryAreas.name,
			projectId: testimonials.projectId,
			project: projects.name,
			eventId: testimonials.eventId,
			event: events.name,

			storyDate: testimonials.storyDate,
			permissionGiven: testimonials.permissionGiven,
			isPublished: testimonials.isPublished,
			isFeaturedOnHome: testimonials.isFeaturedOnHome,
			createdAt: testimonials.createdAt
		})
		.from(testimonials)
		.leftJoin(ministryAreas, eq(testimonials.ministryAreaId, ministryAreas.id))
		.leftJoin(projects, eq(testimonials.projectId, projects.id))
		.leftJoin(events, eq(testimonials.eventId, events.id))
		.orderBy(desc(testimonials.storyDate), desc(testimonials.id));

	const testimonialList = rows.map((t) => {
		// A published story with no permission on file is the one thing worth
		// surfacing loudly — it shouldn't be live at all.
		const needsAttention = t.isPublished && !t.permissionGiven;

		return {
			...t,
			needsAttention,
			// Filter chips
			consent: t.permissionGiven ? 'permission given' : 'no permission',
			visibility: needsAttention
				? 'published without consent'
				: t.isPublished
					? 'published'
					: t.permissionGiven
						? 'ready to publish'
						: 'awaiting permission',
			linkedTo: t.projectId ? 'project' : t.eventId ? 'event' : 'standalone',
			linkedName: t.project ?? t.event ?? null,
			hasAvatar: t.avatar ? 'has photo' : 'no photo'
		};
	});

	return { testimonialList };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing testimonial id' });

		try {
			await db.delete(testimonials).where(eq(testimonials.id, id));
			return { success: true, message: 'Story deleted' };
		} catch {
			return fail(500, { message: 'Could not delete story' });
		}
	},

	/**
	 * Publishing is gated on permission. Unpublishing always goes through —
	 * taking a story down should never be blocked.
	 */
	togglePublished: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing testimonial id' });

		const next = !value;

		if (next) {
			const [row] = await db
				.select({ permissionGiven: testimonials.permissionGiven })
				.from(testimonials)
				.where(eq(testimonials.id, id));

			if (!row) return fail(404, { message: 'Story not found' });
			if (!row.permissionGiven) {
				return fail(400, {
					message: 'This story has no permission on file and cannot be published'
				});
			}
		}

		await db.update(testimonials).set({ isPublished: next }).where(eq(testimonials.id, id));
		return { success: true, message: next ? 'Story published' : 'Story unpublished' };
	},

	/** Featuring implies publishing, so it's gated the same way. */
	toggleFeatured: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing testimonial id' });

		const next = !value;

		if (next) {
			const [row] = await db
				.select({ permissionGiven: testimonials.permissionGiven })
				.from(testimonials)
				.where(eq(testimonials.id, id));

			if (!row) return fail(404, { message: 'Story not found' });
			if (!row.permissionGiven) {
				return fail(400, {
					message: 'This story has no permission on file and cannot be featured'
				});
			}
		}

		await db.update(testimonials).set({ isFeaturedOnHome: next }).where(eq(testimonials.id, id));
		return { success: true };
	},

	/**
	 * Recording permission is a separate deliberate step. Withdrawing it also
	 * pulls the story down, which is the whole point of tracking consent.
	 */
	setPermission: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const given = form.get('given') === 'true';
		if (!id) return fail(400, { message: 'Missing testimonial id' });

		await db
			.update(testimonials)
			.set(
				given
					? { permissionGiven: true }
					: { permissionGiven: false, isPublished: false, isFeaturedOnHome: false }
			)
			.where(eq(testimonials.id, id));

		return {
			success: true,
			message: given ? 'Permission recorded' : 'Permission withdrawn — story taken down'
		};
	}
};