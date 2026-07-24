import { z } from 'zod/v4';

/* Mirrors the mysqlEnum values on the books tables. */
export const languages = ['english', 'amharic', 'other'] as const;
export const bookStatuses = ['draft', 'published'] as const;
export const formatTypes = ['physical', 'pdf', 'ebook', 'audiobook'] as const;

/* ── helpers ───────────────────────────────────────────────────────────────
   Empty selects and empty text boxes should reach the DB as NULL, never as
   '' or 0. Worth lifting into $lib/schemaHelpers.ts once a third route wants them. */

const nullableId = z
	.union([z.number().int().positive(), z.literal(''), z.null(), z.undefined()])
	.transform((v) => (typeof v === 'number' ? v : null));

const nullableNumber = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.number()])
	.transform((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null));

const nullableInt = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(1)])
	.transform((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null));

const nullableText = (max: number) =>
	z
		.union([z.string().max(max), z.literal(''), z.null(), z.undefined()])
		.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

const nullableUrl = (max: number) =>
	z
		.union([
			z.url('Enter a full URL, including https://').max(max),
			z.literal(''),
			z.null(),
			z.undefined()
		])
		.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

/* ── book ──────────────────────────────────────────────────────────────── */

export const edit = z.object({
	title: z.string('Title is required').min(2).max(255),
	subtitle: nullableText(255),
	slug: z
		.string('Slug is required')
		.min(2)
		.max(280)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only'),
	description: z.string('Description is required').min(2),

	/* Either point at a team member or type an outside author's name. */
	authorId: nullableId,
	authorName: nullableText(150),

	ministryAreaId: nullableId,
	language: z.enum(languages).default('english'),
	publicationDate: z.coerce.date().nullish(),
	pages: nullableInt,
	isbn: nullableText(20),

	/* Off-site store link. Leave empty when the book is sold on-site. */
	purchaseLink: nullableUrl(500),
	price: nullableNumber,
	currency: z.string().length(3).default('ETB'),

	/* Set this to reuse products/stock/orders instead of a second inventory. */
	productId: nullableId,

	status: z.enum(bookStatuses).default('draft'),
	isFeaturedOnHome: z.boolean().default(false),

	cover: z.file('Cover image is required').max(10000000).optional(),
	preview: z.file('Preview file is required').max(20000000).optional()
});

/* ── formats ───────────────────────────────────────────────────────────── */

export const addFormat = z.object({
	format: z.enum(formatTypes),
	price: nullableNumber,
	isFreeDownload: z.boolean().default(false),
	file: z.file().max(50000000).optional()
});

export const editFormat = addFormat.extend({
	id: z.coerce.number().int().positive()
});

/* ── reviews & related resources ───────────────────────────────────────── */

export const reviewAction = z.object({
	id: z.coerce.number().int().positive(),
	isApproved: z.coerce.boolean().optional()
});

export const linkResource = z.object({
	resourceId: z.coerce.number().int().positive()
});

export type Edit = typeof edit;
export type AddFormat = typeof addFormat;
export type EditFormat = typeof editFormat;