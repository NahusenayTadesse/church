import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';

import { edit, addFormat } from './schema';

import { db } from '$lib/server/db';
import {
	books,
	bookFormats,
	bookReviews,
	bookResources,
	blog,
	ministryAreas,
	teamMembers,
	products,
	user
} from '$lib/server/db/schema';
import { eq, and, asc, desc, getTableColumns, notInArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import type { LayoutServerLoad } from './$types';

const creator = alias(user, 'creator');
const editor = alias(user, 'editor');
const reviewer = alias(user, 'reviewer');

export const load: LayoutServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!Number.isInteger(id)) error(400, 'Invalid book id');

	const book = await db
		.select({
			...getTableColumns(books),
			ministryAreaName: ministryAreas.name,
			teamAuthorName: teamMembers.name,
			productName: products.name,
			productQuantity: products.quantity,
			createdByName: creator.name,
			updatedByName: editor.name
		})
		.from(books)
		.leftJoin(ministryAreas, eq(books.ministryAreaId, ministryAreas.id))
		.leftJoin(teamMembers, eq(books.authorId, teamMembers.id))
		.leftJoin(products, eq(books.productId, products.id))
		.leftJoin(creator, eq(books.createdBy, creator.id))
		.leftJoin(editor, eq(books.updatedBy, editor.id))
		.where(eq(books.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!book) error(404, 'Book not found');

	const formats = await db
		.select()
		.from(bookFormats)
		.where(eq(bookFormats.bookId, id))
		.orderBy(asc(bookFormats.format));

	const reviews = await db
		.select({
			...getTableColumns(bookReviews),
			accountName: reviewer.name
		})
		.from(bookReviews)
		.leftJoin(reviewer, eq(bookReviews.userId, reviewer.id))
		.where(eq(bookReviews.bookId, id))
		.orderBy(desc(bookReviews.createdAt));

	const linked = await db
		.select({
			linkId: bookResources.id,
			id: blog.id,
			title: blog.title,
			slug: blog.slug,
			resourceType: blog.resourceType
		})
		.from(bookResources)
		.innerJoin(blog, eq(bookResources.resourceId, blog.id))
		.where(eq(bookResources.bookId, id))
		.orderBy(asc(blog.title));

	const linkedIds = linked.map((r) => r.id);

	const [areas, people, productList, resourceOptions] = await Promise.all([
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db
			.select({ value: teamMembers.id, name: teamMembers.name })
			.from(teamMembers)
			.where(eq(teamMembers.isPublished, true))
			.orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name)),
		db
			.select({ value: products.id, name: products.name })
			.from(products)
			.orderBy(asc(products.name)),
		/* Only offer resources that aren't already attached. */
		db
			.select({ value: blog.id, name: blog.title })
			.from(blog)
			.where(
				linkedIds.length
					? and(eq(blog.status, 'published'), notInArray(blog.id, linkedIds))
					: eq(blog.status, 'published')
			)
			.orderBy(asc(blog.title))
			.limit(200)
	]);

	/* Formats already on the book can't be added twice. */
	const usedFormats = formats.map((f) => f.format);

	const form = await superValidate(book, zod4(edit));
	const formatForm = await superValidate(zod4(addFormat));

	return {
		book,
		form,
		formatForm,
		formats,
		usedFormats,
		reviews,
		linked,
		areas,
		people,
		products: productList,
		resourceOptions
	};
};