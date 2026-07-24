import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';

import { edit } from './schema';

import { db } from '$lib/server/db';
import { testimonials, ministryAreas, projects, events, user } from '$lib/server/db/schema';
import { eq, and, asc, desc, count, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import type { LayoutServerLoad } from './$types';

const creator = alias(user, 'creator');
const editor = alias(user, 'editor');

export const load: LayoutServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!Number.isInteger(id)) error(400, 'Invalid testimonial id');

	const story = await db
		.select({
			...getTableColumns(testimonials),
			ministryAreaName: ministryAreas.name,
			projectName: projects.name,
			eventName: events.name,
			createdByName: creator.name,
			updatedByName: editor.name
		})
		.from(testimonials)
		.leftJoin(ministryAreas, eq(testimonials.ministryAreaId, ministryAreas.id))
		.leftJoin(projects, eq(testimonials.projectId, projects.id))
		.leftJoin(events, eq(testimonials.eventId, events.id))
		.leftJoin(creator, eq(testimonials.createdBy, creator.id))
		.leftJoin(editor, eq(testimonials.updatedBy, editor.id))
		.where(eq(testimonials.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!story) error(404, 'Testimonial not found');

	/* How many stories are already on the home page, so featuring one more is an
	   informed decision rather than a guess. */
	const featuredCount = await db
		.select({ n: count() })
		.from(testimonials)
		.where(and(eq(testimonials.isFeaturedOnHome, true), eq(testimonials.isPublished, true)))
		.then((r) => r[0]?.n ?? 0);

	const [areas, projectOptions, eventOptions] = await Promise.all([
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db
			.select({ value: projects.id, name: projects.name })
			.from(projects)
			.orderBy(asc(projects.name))
			.limit(200),
		db
			.select({ value: events.id, name: events.name })
			.from(events)
			.orderBy(desc(events.startsAt))
			.limit(200)
	]);

	const form = await superValidate(story, zod4(edit));

	return { story, featuredCount, areas, projectOptions, eventOptions, form };
};
