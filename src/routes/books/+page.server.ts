import {
	and,
	asc,
	count,
	desc,
	eq,
	inArray,
	isNotNull,
	like,
	notInArray,
	or,
	sql,
	type SQL
} from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	books,
	bookFormats,
	bookReviews,
	ministryAreas,
	teamMembers
} from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 12;

const LANGUAGES = ['english', 'amharic', 'other'] as const;
const FORMATS = ['physical', 'pdf', 'ebook', 'audiobook'] as const;
const ACCESS = ['all', 'free', 'paid'] as const;
const SORTS = ['newest', 'title', 'rating', 'price_low', 'price_high'] as const;

type Language = (typeof LANGUAGES)[number];
type Format = (typeof FORMATS)[number];
type Access = (typeof ACCESS)[number];
type Sort = (typeof SORTS)[number];

export const load: PageServerLoad = async ({ url }) => {
	const p = url.searchParams;

	const q = (p.get('q') ?? '').trim().slice(0, 100);
	const area = Number(p.get('area')) || 0;

	const rawLanguage = p.get('language') ?? 'all';
	const language: Language | 'all' = LANGUAGES.includes(rawLanguage as Language)
		? (rawLanguage as Language)
		: 'all';

	const rawFormat = p.get('format') ?? 'all';
	const format: Format | 'all' = FORMATS.includes(rawFormat as Format)
		? (rawFormat as Format)
		: 'all';

	const rawAccess = p.get('access') ?? 'all';
	const access: Access = ACCESS.includes(rawAccess as Access) ? (rawAccess as Access) : 'all';

	const rawSort = p.get('sort') ?? 'newest';
	const sort: Sort = SORTS.includes(rawSort as Sort) ? (rawSort as Sort) : 'newest';

	const currentPage = Math.max(1, Number(p.get('page')) || 1);
	const offset = (currentPage - 1) * PAGE_SIZE;

	const hasFilters = Boolean(
		q || area || language !== 'all' || format !== 'all' || access !== 'all'
	);

	/* Approved reviews only — a pending one-star should not move the average. */
	const ratings = db
		.select({
			bookId: bookReviews.bookId,
			average: sql<number>`avg(${bookReviews.rating})`.as('average'),
			total: sql<number>`count(*)`.as('review_total')
		})
		.from(bookReviews)
		.where(and(eq(bookReviews.isApproved, true), isNotNull(bookReviews.rating)))
		.groupBy(bookReviews.bookId)
		.as('ratings');

	/* ---------------------------------------------------------------- where */
	const base: (SQL | undefined)[] = [eq(books.status, 'published')];

	if (q) {
		base.push(
			or(
				like(books.title, `%${q}%`),
				like(books.subtitle, `%${q}%`),
				like(books.description, `%${q}%`),
				like(books.authorName, `%${q}%`)
			)
		);
	}
	if (area) base.push(eq(books.ministryAreaId, area));

	if (format !== 'all') {
		base.push(
			inArray(
				books.id,
				db
					.select({ id: bookFormats.bookId })
					.from(bookFormats)
					.where(eq(bookFormats.format, format))
			)
		);
	}

	const freeDownloadIds = db
		.select({ id: bookFormats.bookId })
		.from(bookFormats)
		.where(eq(bookFormats.isFreeDownload, true));

	if (access === 'free') base.push(inArray(books.id, freeDownloadIds));
	if (access === 'paid') base.push(notInArray(books.id, freeDownloadIds));

	const where = and(...base, language === 'all' ? undefined : eq(books.language, language));

	const orderBy =
		sort === 'title'
			? asc(books.title)
			: sort === 'rating'
				? desc(sql`coalesce(${ratings.average}, 0)`)
				: sort === 'price_low'
					? sql`${books.price} is null, ${books.price} asc`
					: sort === 'price_high'
						? sql`${books.price} desc`
						: desc(books.publicationDate);

	/* ---------------------------------------------------------------- query */
	const selection = {
		id: books.id,
		title: books.title,
		subtitle: books.subtitle,
		slug: books.slug,
		description: books.description,
		coverImage: books.coverImage,
		language: books.language,
		publicationDate: books.publicationDate,
		pages: books.pages,
		price: books.price,
		currency: books.currency,
		purchaseLink: books.purchaseLink,
		previewFileUrl: books.previewFileUrl,
		productId: books.productId,
		ministryAreaId: books.ministryAreaId,
		ministryAreaName: ministryAreas.name,
		authorName: sql<string | null>`coalesce(${teamMembers.name}, ${books.authorName})`,
		authorPhoto: teamMembers.photo,
		ratingAverage: sql<number>`round(coalesce(${ratings.average}, 0), 1)`,
		reviewCount: sql<number>`coalesce(${ratings.total}, 0)`
	};

	const listQuery = () =>
		db
			.select(selection)
			.from(books)
			.leftJoin(ministryAreas, eq(ministryAreas.id, books.ministryAreaId))
			.leftJoin(teamMembers, eq(teamMembers.id, books.authorId))
			.leftJoin(ratings, eq(ratings.bookId, books.id));

	const [rows, [{ total }], areaOptions, languageCounts, formatCounts] = await Promise.all([
		listQuery().where(where).orderBy(orderBy).limit(PAGE_SIZE).offset(offset),

		db.select({ total: count() }).from(books).where(where),

		db
			.select({ id: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),

		db
			.select({ language: books.language, total: count() })
			.from(books)
			.where(and(...base))
			.groupBy(books.language),

		db
			.select({ format: bookFormats.format, total: count() })
			.from(bookFormats)
			.innerJoin(books, eq(books.id, bookFormats.bookId))
			.where(eq(books.status, 'published'))
			.groupBy(bookFormats.format)
	]);

	/* Formats per book, so a card can show what you can actually get. */
	const ids = rows.map((row) => row.id);
	const formatRows = ids.length
		? await db
				.select({
					id: bookFormats.id,
					bookId: bookFormats.bookId,
					format: bookFormats.format,
					price: bookFormats.price,
					isFreeDownload: bookFormats.isFreeDownload,
					hasFile: sql<number>`(${bookFormats.fileUrl} is not null)`
				})
				.from(bookFormats)
				.where(inArray(bookFormats.bookId, ids))
		: [];

	const decorate = (row: (typeof rows)[number]) => {
		const formats = formatRows.filter((f) => f.bookId === row.id);
		return {
			...row,
			formats: formats.map(({ id, format, price, isFreeDownload, hasFile }) => ({
				id,
				format,
				price,
				isFreeDownload: Boolean(isFreeDownload),
				hasFile: Boolean(hasFile)
			})),
			hasFreeDownload: formats.some((f) => f.isFreeDownload)
		};
	};

	const list = rows.map(decorate);

	/* One book gets the shop window, on an unfiltered first page. */
	let featured: (typeof list)[number] | null = null;
	if (!hasFilters && currentPage === 1) {
		const [row] = await listQuery()
			.where(and(eq(books.status, 'published'), eq(books.isFeaturedOnHome, true)))
			.orderBy(desc(books.publicationDate))
			.limit(1);

		if (row) {
			const extraFormats = await db
				.select({
					id: bookFormats.id,
					bookId: bookFormats.bookId,
					format: bookFormats.format,
					price: bookFormats.price,
					isFreeDownload: bookFormats.isFreeDownload,
					hasFile: sql<number>`(${bookFormats.fileUrl} is not null)`
				})
				.from(bookFormats)
				.where(eq(bookFormats.bookId, row.id));

			featured = {
				...row,
				formats: extraFormats.map(({ id, format, price, isFreeDownload, hasFile }) => ({
					id,
					format,
					price,
					isFreeDownload: Boolean(isFreeDownload),
					hasFile: Boolean(hasFile)
				})),
				hasFreeDownload: extraFormats.some((f) => f.isFreeDownload)
			};
		}
	}

	return {
		books: featured ? list.filter((b) => b.id !== featured!.id) : list,
		featured,
		options: {
			areas: areaOptions,
			languages: LANGUAGES.map((l) => ({
				value: l,
				total: languageCounts.find((c) => c.language === l)?.total ?? 0
			})),
			formats: FORMATS.map((f) => ({
				value: f,
				total: formatCounts.find((c) => c.format === f)?.total ?? 0
			}))
		},
		filters: { q, language, format, access, area, sort, hasFilters },
		pagination: {
			page: currentPage,
			pageSize: PAGE_SIZE,
			total,
			pages: Math.max(1, Math.ceil(total / PAGE_SIZE))
		}
	};
};