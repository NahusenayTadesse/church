import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';

import { edit, editGallery } from './schema';

import { db } from '$lib/server/db';
import {
	blog,
	blogGallery,
	blogCategories,
	ministryAreas,
	teamMembers,
	user
} from '$lib/server/db/schema';
import { eq, asc, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import type { LayoutServerLoad } from './$types';

/* teamMembers and user are each joined twice, so they need aliases. */
const author = alias(teamMembers, 'author');
const speaker = alias(teamMembers, 'speaker');
const creator = alias(user, 'creator');
const editor = alias(user, 'editor');

export const load: LayoutServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!Number.isInteger(id)) error(400, 'Invalid blog id');

	const product = await db
		.select({
			...getTableColumns(blog),
			categoryName: blogCategories.name,
			ministryAreaName: ministryAreas.name,
			authorName: author.name,
			speakerName: speaker.name,
			createdByName: creator.name,
			updatedByName: editor.name
		})
		.from(blog)
		.leftJoin(blogCategories, eq(blog.categoryId, blogCategories.id))
		.leftJoin(ministryAreas, eq(blog.ministryAreaId, ministryAreas.id))
		.leftJoin(author, eq(blog.authorId, author.id))
		.leftJoin(speaker, eq(blog.speakerId, speaker.id))
		.leftJoin(creator, eq(blog.createdBy, creator.id))
		.leftJoin(editor, eq(blog.updatedBy, editor.id))
		.where(eq(blog.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!product) error(404, 'Blog post not found');

	const images = await db
		.select({ url: blogGallery.imageUrl })
		.from(blogGallery)
		.where(eq(blogGallery.blogId, id))
		.orderBy(asc(blogGallery.sortOrder), asc(blogGallery.id))
		.then((rows) => rows.map((r) => r.url).filter((u): u is string => !!u));

	const [cats, areas, people] = await Promise.all([
		db
			.select({ value: blogCategories.id, name: blogCategories.name })
			.from(blogCategories)
			.orderBy(asc(blogCategories.name)),
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db
			.select({ value: teamMembers.id, name: teamMembers.name })
			.from(teamMembers)
			.where(eq(teamMembers.isPublished, true))
			.orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name))
	]);

	const form = await superValidate(product, zod4(edit));
	const galleryEdit = await superValidate({ existing: images }, zod4(editGallery));

	return { product, form, images, galleryEdit, cats, areas, people };
};