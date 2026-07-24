import { z } from 'zod/v4';

export const mediaTypes = ['image', 'video'] as const;

/* ── helpers (same set as blog/books/events — time to move these to
   $lib/schemaHelpers.ts and import from there) ──────────────────────────── */

const nullableId = z
	.union([z.number().int().positive(), z.literal(''), z.null(), z.undefined()])
	.transform((v) => (typeof v === 'number' ? v : null));

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

const nullableDate = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.date()])
	.transform((v) => (v instanceof Date ? v : null));

/* ── the gallery record ────────────────────────────────────────────────── */

export const edit = z.object({
	title: z.string('Title is required').min(2).max(200),
	description: nullableText(255),

	/* A gallery can hang off a ministry area, an event, a project, or nothing. */
	ministryAreaId: nullableId,
	eventId: nullableId,
	projectId: nullableId,

	capturedOn: nullableDate,
	isPublished: z.boolean().default(true),
	isFeaturedOnHome: z.boolean().default(false),

	cover: z.file('Cover image is required').max(10000000).optional()
});

/* ── items ─────────────────────────────────────────────────────────────── */

/** Bulk image upload. New items land at the end of the current order. */
export const addImages = z.object({
	images: z.file().max(10000000).array().min(1, 'Pick at least one image')
});

/** Videos are linked, not uploaded — only the poster frame is a file. */
export const addVideo = z.object({
	url: z.url('Enter the full video URL').max(500),
	caption: nullableText(255),
	thumbnail: z.file().max(10000000).optional()
});

/**
 * One edit form for both media types. The action branches on the item's stored
 * mediaType: for a video `file` replaces the thumbnail, for an image it replaces
 * the image itself, and `url` is only read for videos.
 */
export const editItem = z.object({
	id: z.coerce.number().int().positive(),
	caption: nullableText(255),
	url: nullableUrl(500),
	file: z.file().max(10000000).optional()
});

export const moveItem = z.object({
	id: z.coerce.number().int().positive(),
	direction: z.enum(['up', 'down'])
});

export const itemId = z.object({
	id: z.coerce.number().int().positive()
});

export type Edit = typeof edit;
export type AddImages = typeof addImages;
export type AddVideo = typeof addVideo;