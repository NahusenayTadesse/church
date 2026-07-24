import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { testimonials, ministryAreas, projects, events } from '$lib/server/db/schema';
import type { Testimonial } from '$lib/types/testimonials';

interface TestimonialQuery {
	/** Only stories tied to one ministry area. */
	ministryAreaId?: number | null;
	/** Only stories from one project. */
	projectId?: number | null;
	/** Only stories from one event. */
	eventId?: number | null;
	/** Only the ones staff flagged for the home page. */
	featuredOnly?: boolean;
	limit?: number;
	/** Shuffle instead of ordering by date — useful for a rotating home strip. */
	random?: boolean;
}

/**
 * `isPublished` and `permissionGiven` are enforced here rather than at the call
 * site, so no page can accidentally publish a story someone did not consent to.
 */
export async function getTestimonials(options: TestimonialQuery = {}): Promise<Testimonial[]> {
	const conditions = [
		eq(testimonials.isPublished, true),
		eq(testimonials.permissionGiven, true)
	];

	if (options.ministryAreaId) {
		conditions.push(eq(testimonials.ministryAreaId, options.ministryAreaId));
	}
	if (options.projectId) conditions.push(eq(testimonials.projectId, options.projectId));
	if (options.eventId) conditions.push(eq(testimonials.eventId, options.eventId));
	if (options.featuredOnly) conditions.push(eq(testimonials.isFeaturedOnHome, true));

	return db
		.select({
			id: testimonials.id,
			name: testimonials.name,
			position: testimonials.position,
			title: testimonials.title,
			message: testimonials.message,
			avatar: testimonials.avatar,
			storyDate: testimonials.storyDate,
			isFeaturedOnHome: testimonials.isFeaturedOnHome,
			ministryAreaId: testimonials.ministryAreaId,
			ministryAreaName: ministryAreas.name,
			projectId: testimonials.projectId,
			projectName: projects.name,
			projectSlug: projects.slug,
			eventId: testimonials.eventId,
			eventName: events.name,
			eventSlug: events.slug
		})
		.from(testimonials)
		.leftJoin(ministryAreas, eq(ministryAreas.id, testimonials.ministryAreaId))
		.leftJoin(projects, eq(projects.id, testimonials.projectId))
		.leftJoin(events, eq(events.id, testimonials.eventId))
		.where(and(...conditions))
		.orderBy(
			...(options.random
				? [sql`rand()`]
				: [
						desc(testimonials.isFeaturedOnHome),
						sql`${testimonials.storyDate} is null`,
						desc(testimonials.storyDate)
					])
		)
		.limit(options.limit ?? 50);
}