import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';

import { edit, addImages, addVideo } from './schema';

import { db } from '$lib/server/db';
import {
	galleries,
	galleryItems,
	ministryAreas,
	events,
	projects,
	user
} from '$lib/server/db/schema';
import { eq, asc, desc, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import type { LayoutServerLoad } from './$types';

const creator = alias(user, 'creator');
const editor = alias(user, 'editor');

export const load: LayoutServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!Number.isInteger(id)) error(400, 'Invalid gallery id');

	const gallery = await db
		.select({
			...getTableColumns(galleries),
			ministryAreaName: ministryAreas.name,
			eventName: events.name,
			projectName: projects.name,
			createdByName: creator.name,
			updatedByName: editor.name
		})
		.from(galleries)
		.leftJoin(ministryAreas, eq(galleries.ministryAreaId, ministryAreas.id))
		.leftJoin(events, eq(galleries.eventId, events.id))
		.leftJoin(projects, eq(galleries.projectId, projects.id))
		.leftJoin(creator, eq(galleries.createdBy, creator.id))
		.leftJoin(editor, eq(galleries.updatedBy, editor.id))
		.where(eq(galleries.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!gallery) error(404, 'Gallery not found');

	const items = await db
		.select()
		.from(galleryItems)
		.where(eq(galleryItems.galleryId, id))
		.orderBy(asc(galleryItems.sortOrder), asc(galleryItems.id));

	const [areas, eventOptions, projectOptions] = await Promise.all([
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db
			.select({ value: events.id, name: events.name })
			.from(events)
			.orderBy(desc(events.startsAt))
			.limit(200),
		db
			.select({ value: projects.id, name: projects.name })
			.from(projects)
			.orderBy(asc(projects.name))
			.limit(200)
	]);

	const [form, imagesForm, videoForm] = await Promise.all([
		superValidate(gallery, zod4(edit)),
		superValidate(zod4(addImages)),
		superValidate(zod4(addVideo))
	]);

	return {
		gallery,
		items,
		form,
		imagesForm,
		videoForm,
		areas,
		eventOptions,
		projectOptions
	};
};