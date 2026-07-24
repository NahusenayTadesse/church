import { error, redirect } from '@sveltejs/kit';
import { and, asc, count, desc, eq, isNotNull, ne, or, sql } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

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
	prices,
	customers,
	orders,
	orderItems,
	productAdjustments,
	transactions
} from '$lib/server/db/schema';
import { reviewSchema, orderSchema } from './schema';
import type { PageServerLoad, Actions } from './$types';

const REVIEW_PAGE_SIZE = 8;

/* -------------------------------------------------------------------------- */
/* load                                                                        */
/* -------------------------------------------------------------------------- */

export const load: PageServerLoad = async ({ params }) => {
	const [book] = await db
		.select({
			id: books.id,
			title: books.title,
			subtitle: books.subtitle,
			slug: books.slug,
			description: books.description,
			coverImage: books.coverImage,
			language: books.language,
			publicationDate: books.publicationDate,
			pages: books.pages,
			isbn: books.isbn,
			price: books.price,
			currency: books.currency,
			purchaseLink: books.purchaseLink,
			previewFileUrl: books.previewFileUrl,
			productId: books.productId,
			ministryAreaId: books.ministryAreaId,
			ministryAreaName: ministryAreas.name,
			authorId: books.authorId,
			authorName: sql<string | null>`coalesce(${teamMembers.name}, ${books.authorName})`,
			authorPhoto: teamMembers.photo,
			authorPosition: teamMembers.position,
			authorBio: teamMembers.biography
		})
		.from(books)
		.leftJoin(ministryAreas, eq(ministryAreas.id, books.ministryAreaId))
		.leftJoin(teamMembers, eq(teamMembers.id, books.authorId))
		.where(and(eq(books.slug, params.slug), eq(books.status, 'published')))
		.limit(1);

	if (!book) error(404, 'That book does not exist, or is not published yet.');

	const [formats, reviews, ratingRows, resources, stock, variants, alsoBy] = await Promise.all([
		db
			.select({
				id: bookFormats.id,
				format: bookFormats.format,
				price: bookFormats.price,
				isFreeDownload: bookFormats.isFreeDownload,
				downloadCount: bookFormats.downloadCount,
				hasFile: sql<number>`(${bookFormats.fileUrl} is not null)`
			})
			.from(bookFormats)
			.where(eq(bookFormats.bookId, book.id)),

		db
			.select({
				id: bookReviews.id,
				reviewerName: bookReviews.reviewerName,
				rating: bookReviews.rating,
				title: bookReviews.title,
				content: bookReviews.content,
				createdAt: bookReviews.createdAt
			})
			.from(bookReviews)
			.where(and(eq(bookReviews.bookId, book.id), eq(bookReviews.isApproved, true)))
			.orderBy(desc(bookReviews.createdAt))
			.limit(REVIEW_PAGE_SIZE),

		db
			.select({ rating: bookReviews.rating, total: count() })
			.from(bookReviews)
			.where(
				and(
					eq(bookReviews.bookId, book.id),
					eq(bookReviews.isApproved, true),
					isNotNull(bookReviews.rating)
				)
			)
			.groupBy(bookReviews.rating),

		db
			.select({
				id: blog.id,
				title: blog.title,
				slug: blog.slug,
				excerpt: blog.excerpt,
				resourceType: blog.resourceType,
				featuredImage: blog.featuredImage
			})
			.from(bookResources)
			.innerJoin(blog, eq(blog.id, bookResources.resourceId))
			.where(and(eq(bookResources.bookId, book.id), eq(blog.status, 'published')))
			.limit(3),

		book.productId
			? db
					.select({ id: products.id, quantity: products.quantity })
					.from(products)
					.where(eq(products.id, book.productId))
					.limit(1)
			: Promise.resolve([]),

		book.productId
			? db
					.select({ id: prices.id, variant: prices.variant, price: prices.price })
					.from(prices)
					.where(eq(prices.productId, book.productId))
					.orderBy(asc(prices.price))
			: Promise.resolve([]),

		db
			.select({
				id: books.id,
				title: books.title,
				slug: books.slug,
				coverImage: books.coverImage,
				price: books.price,
				currency: books.currency
			})
			.from(books)
			.where(
				and(
					eq(books.status, 'published'),
					ne(books.id, book.id),
					book.authorId
						? or(
								eq(books.authorId, book.authorId),
								book.ministryAreaId ? eq(books.ministryAreaId, book.ministryAreaId) : undefined
							)
						: book.ministryAreaId
							? eq(books.ministryAreaId, book.ministryAreaId)
							: undefined
				)
			)
			.orderBy(desc(books.publicationDate))
			.limit(4)
	]);

	const reviewTotal = ratingRows.reduce((sum, row) => sum + row.total, 0);
	const ratingSum = ratingRows.reduce((sum, row) => sum + (row.rating ?? 0) * row.total, 0);

	const breakdown = [5, 4, 3, 2, 1].map((star) => {
		const total = ratingRows.find((row) => row.rating === star)?.total ?? 0;
		return { star, total, percent: reviewTotal ? Math.round((total / reviewTotal) * 100) : 0 };
	});

	const inStock = stock[0]?.quantity ?? 0;

	const [reviewForm, orderForm] = await Promise.all([
		superValidate(zod4(reviewSchema), { id: 'review' }),
		superValidate(zod4(orderSchema), {
			id: 'order',
			defaults: { quantity: 1, variant: variants[0]?.variant ?? 'default' }
		})
	]);

	return {
		book: {
			...book,
			ratingAverage: reviewTotal ? Math.round((ratingSum / reviewTotal) * 10) / 10 : 0,
			reviewTotal
		},
		formats: formats.map((f) => ({
			...f,
			isFreeDownload: Boolean(f.isFreeDownload),
			hasFile: Boolean(f.hasFile)
		})),
		reviews,
		breakdown,
		resources,
		variants,
		inStock,
		canOrderOnSite: Boolean(book.productId) && inStock > 0,
		alsoBy,
		reviewForm,
		orderForm
	};
};

/* -------------------------------------------------------------------------- */
/* actions                                                                     */
/* -------------------------------------------------------------------------- */

export const actions: Actions = {
	/** Reviews land unapproved — staff publish them from the dashboard. */
	review: async ({ request, params, locals }) => {
		const form = await superValidate(request, zod4(reviewSchema), { id: 'review' });

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for errors' });
		}

		const [book] = await db
			.select({ id: books.id })
			.from(books)
			.where(and(eq(books.slug, params.slug), eq(books.status, 'published')))
			.limit(1);

		if (!book) {
			return message(form, { type: 'error', text: 'This book is no longer available' });
		}

		const userId = locals.user?.id ?? null;
		const { reviewerName, reviewerEmail, rating, title, content } = form.data;

		try {
			await db.insert(bookReviews).values({
				bookId: book.id,
				userId,
				reviewerName,
				reviewerEmail: reviewerEmail || null,
				rating,
				title: title || null,
				content,
				isApproved: false
			});

			return message(form, {
				type: 'success',
				text: 'Thank you — your review is with our team and appears once approved'
			});
		} catch (err) {
			return message(form, {
				type: 'error',
				text: 'We could not save your review: ' + (err as Error)?.message
			});
		}
	},

	/** Counts the download, then hands the file over. */
	download: async ({ request, params }) => {
		const data = await request.formData();
		const formatId = Number(data.get('formatId'));

		const [format] = await db
			.select({
				id: bookFormats.id,
				fileUrl: bookFormats.fileUrl,
				isFreeDownload: bookFormats.isFreeDownload
			})
			.from(bookFormats)
			.innerJoin(books, eq(books.id, bookFormats.bookId))
			.where(
				and(
					eq(bookFormats.id, formatId),
					eq(books.slug, params.slug),
					eq(books.status, 'published')
				)
			)
			.limit(1);

		if (!format?.fileUrl || !format.isFreeDownload) {
			error(404, 'That download is not available.');
		}

		await db
			.update(bookFormats)
			.set({ downloadCount: sql`${bookFormats.downloadCount} + 1` })
			.where(eq(bookFormats.id, format.id));

		redirect(303, `/files/${format.fileUrl}`);
	},

	/**
	 * On-site purchase. `customers.userId` is NOT NULL, so an order needs a signed-in
	 * user — guests get pointed at the external purchase link instead.
	 */
	order: async ({ request, params, locals }) => {
		const form = await superValidate(request, zod4(orderSchema), { id: 'order' });

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for errors' });
		}

		const user = locals.user;
		if (!user) {
			return message(form, { type: 'error', text: 'Please sign in to order this book' });
		}

		const [book] = await db
			.select({
				id: books.id,
				title: books.title,
				productId: books.productId,
				price: books.price,
				currency: books.currency
			})
			.from(books)
			.where(and(eq(books.slug, params.slug), eq(books.status, 'published')))
			.limit(1);

		if (!book?.productId) {
			return message(form, { type: 'error', text: 'This book is not sold on this site' });
		}

		const { quantity, variant } = form.data;

		const [product] = await db
			.select({ id: products.id, quantity: products.quantity })
			.from(products)
			.where(eq(products.id, book.productId))
			.limit(1);

		if (!product || product.quantity < quantity) {
			return message(form, {
				type: 'error',
				text: product?.quantity
					? `Only ${product.quantity} copies left`
					: 'This book is out of stock'
			});
		}

		/* Price comes from the variant row when there is one. */
		const [variantPrice] = await db
			.select({ price: prices.price })
			.from(prices)
			.where(and(eq(prices.productId, product.id), eq(prices.variant, variant)))
			.limit(1);

		const unitPrice = Number(variantPrice?.price ?? book.price ?? 0);
		const totalPrice = unitPrice * quantity;

		try {
			/* A customer row per user — created on the first order. */
			let [customer] = await db
				.select({ id: customers.id })
				.from(customers)
				.where(eq(customers.userId, user.id))
				.limit(1);

			if (!customer) {
				const [inserted] = await db.insert(customers).values({
					name: user.name ?? user.email,
					email: user.email,
					userId: user.id,
					createdBy: user.id
				});
				customer = { id: Number(inserted.insertId) };
			}

			const [txn] = await db.insert(transactions).values({
				amount: totalPrice.toFixed(2),
				currency: book.currency ?? 'ETB',
				purpose: 'book_purchase',
				paymentStatus: 'pending',
				createdBy: user.id
			});
			const transactionId = Number(txn.insertId);

			const [order] = await db.insert(orders).values({
				customerId: customer.id,
				status: 'pending',
				transactionId,
				createdBy: user.id
			});

			await db.insert(orderItems).values({
				orderId: Number(order.insertId),
				productId: product.id,
				quantity,
				price: unitPrice.toFixed(2),
				variant,
				createdBy: user.id
			});

			/* Stock moves through the adjustment ledger, then the cached column. */
			await db.insert(productAdjustments).values({
				productsId: product.id,
				adjustment: -quantity,
				reason: `Book order: ${book.title}`,
				transactionId,
				createdBy: user.id
			});

			await db
				.update(products)
				.set({ quantity: sql`${products.quantity} - ${quantity}` })
				.where(eq(products.id, product.id));

			return message(form, {
				type: 'success',
				text: 'Order placed. We will contact you to arrange payment and delivery'
			});
		} catch (err) {
			return message(form, {
				type: 'error',
				text: 'We could not place your order: ' + (err as Error)?.message
			});
		}
	}
};