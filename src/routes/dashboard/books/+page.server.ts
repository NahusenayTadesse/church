import { db } from '$lib/server/db';
import { books, bookFormats, bookReviews, ministryAreas, teamMembers } from '$lib/server/db/schema';
import { eq, desc, sql, count, avg } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: books.id,
			title: books.title,
			subtitle: books.subtitle,
			slug: books.slug,
			description: books.description,
			coverImage: books.coverImage,

			authorId: books.authorId,
			teamAuthor: teamMembers.name,
			authorName: books.authorName,

			language: books.language,
			publicationDate: books.publicationDate,
			ministryArea: ministryAreas.name,
			pages: books.pages,
			isbn: books.isbn,

			purchaseLink: books.purchaseLink,
			price: books.price,
			currency: books.currency,
			productId: books.productId,
			previewFileUrl: books.previewFileUrl,

			status: books.status,
			isFeaturedOnHome: books.isFeaturedOnHome,
			createdAt: books.createdAt
		})
		.from(books)
		.leftJoin(teamMembers, eq(books.authorId, teamMembers.id))
		.leftJoin(ministryAreas, eq(books.ministryAreaId, ministryAreas.id))
		.orderBy(desc(books.id));

	// Aggregates kept as separate grouped queries — joining them into the query
	// above would multiply rows and inflate the counts.
	const formatRows = await db
		.select({
			bookId: bookFormats.bookId,
			formats: sql<string>`group_concat(distinct ${bookFormats.format})`,
			downloads: sql<number>`sum(${bookFormats.downloadCount})`
		})
		.from(bookFormats)
		.groupBy(bookFormats.bookId);

	const reviewRows = await db
		.select({
			bookId: bookReviews.bookId,
			reviewCount: count(bookReviews.id),
			avgRating: avg(bookReviews.rating),
			pendingReviews: sql<number>`sum(case when ${bookReviews.isApproved} = 0 then 1 else 0 end)`
		})
		.from(bookReviews)
		.groupBy(bookReviews.bookId);

	const formatMap = new Map(formatRows.map((f) => [f.bookId, f]));
	const reviewMap = new Map(reviewRows.map((r) => [r.bookId, r]));

	const bookList = rows.map((b) => {
		const f = formatMap.get(b.id);
		const r = reviewMap.get(b.id);
		return {
			...b,
			// external authors have no team member row
			author: b.teamAuthor ?? b.authorName ?? null,
			formats: f?.formats ? f.formats.split(',') : [],
			downloads: Number(f?.downloads ?? 0),
			reviewCount: Number(r?.reviewCount ?? 0),
			pendingReviews: Number(r?.pendingReviews ?? 0),
			avgRating: r?.avgRating ? Number(Number(r.avgRating).toFixed(1)) : null,
			// handy for a filter chip: on-site vs external vs not for sale
			sellsVia: b.productId ? 'on-site' : b.purchaseLink ? 'external' : 'not for sale'
		};
	});

	return { bookList };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing book id' });

		try {
			await db.delete(books).where(eq(books.id, id));
			return { success: true, message: 'Book deleted' };
		} catch {
			return fail(500, { message: 'Could not delete book' });
		}
	},

	toggleFeatured: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing book id' });

		await db.update(books).set({ isFeaturedOnHome: !value }).where(eq(books.id, id));
		return { success: true };
	},

	publish: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing book id' });

		await db.update(books).set({ status: 'published' }).where(eq(books.id, id));
		return { success: true, message: 'Book published' };
	}
};