import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';

import { edit, linkProject } from './schema';

import { db } from '$lib/server/db';
import { partners, projectPartners, projects, user } from '$lib/server/db/schema';
import { eq, and, asc, notInArray, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import type { LayoutServerLoad } from './$types';

const creator = alias(user, 'creator');
const editor = alias(user, 'editor');

export const load: LayoutServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!Number.isInteger(id)) error(400, 'Invalid partner id');

	const partner = await db
		.select({
			...getTableColumns(partners),
			createdByName: creator.name,
			updatedByName: editor.name
		})
		.from(partners)
		.leftJoin(creator, eq(partners.createdBy, creator.id))
		.leftJoin(editor, eq(partners.updatedBy, editor.id))
		.where(eq(partners.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!partner) error(404, 'Partner not found');

	const linked = await db
		.select({
			linkId: projectPartners.id,
			role: projectPartners.role,
			id: projects.id,
			name: projects.name,
			status: projects.status,
			location: projects.location,
			featuredImage: projects.featuredImage
		})
		.from(projectPartners)
		.innerJoin(projects, eq(projectPartners.projectId, projects.id))
		.where(eq(projectPartners.partnerId, id))
		.orderBy(asc(projects.name));

	const linkedIds = linked.map((r) => r.id);

	const projectOptions = await db
		.select({ value: projects.id, name: projects.name })
		.from(projects)
		.where(linkedIds.length ? notInArray(projects.id, linkedIds) : undefined)
		.orderBy(asc(projects.name))
		.limit(200);

	/* Where this partner sits in the home page strip, so sortOrder means something
	   to whoever is editing it. */
	const homeStrip = await db
		.select({ id: partners.id })
		.from(partners)
		.where(eq(partners.showOnHome, true))
		.orderBy(asc(partners.sortOrder), asc(partners.name));

	const homePosition = homeStrip.findIndex((p) => p.id === id) + 1;

	const [form, projectForm] = await Promise.all([
		superValidate(partner, zod4(edit)),
		superValidate(zod4(linkProject))
	]);

	return {
		partner,
		linked,
		projectOptions,
		homePosition,
		homeCount: homeStrip.length,
		form,
		projectForm
	};
};