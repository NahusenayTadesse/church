import { z } from 'zod/v4';

/* Mirrors the mysqlEnum values on the `blog` table. */
export const resourceTypes = [
	'article',
	'sermon',
	'teaching',
	'video',
	'audio',
	'bible_study'
] as const;

export const blogStatuses = ['draft', 'published', 'archived'] as const;

/** Empty select / empty text box should land in the DB as NULL, not '' or 0. */
const nullableId = z
	.union([z.number().int().positive(), z.literal(''), z.null(), z.undefined()])
	.transform((v) => (typeof v === 'number' ? v : null));

const nullableText = (max: number) =>
	z
		.union([z.string().max(max), z.literal(''), z.null(), z.undefined()])
		.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

const nullableUrl = (max: number) =>
	z
		.union([z.url('Enter a full URL, including https://').max(max), z.literal(''), z.null(), z.undefined()])
		.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)).optional();

export const edit = z.object({
	title: z.string('Title is required').min(2).max(255),
	slug: z
		.string('Slug is required')
		.min(2)
		.max(255)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only'),

	categoryId: z.number('Category is required').int().positive(),
	ministryAreaId: nullableId,
	resourceType: z.enum(resourceTypes).default('article'),

	authorId: nullableId,
	speakerId: nullableId,

	excerpt: z.string('Excerpt is required').min(2),
	content: z.string('Content is required').min(2),

	bibleReferences: nullableText(255),
	videoLink: nullableUrl(500),
	audioUrl: nullableUrl(500),
	downloadUrl: nullableUrl(500),

	status: z.enum(blogStatuses).default('draft'),
	allowComments: z.boolean().default(false),
	isFeaturedOnHome: z.boolean().default(false),

	image: z.file('Featured Image is required').max(10000000).optional()
});

export const editGallery = z.object({
	/** URLs the user kept, in display order. */
	existing: z.array(z.string()).default([]),
	gallery: z.file().max(10000000).array().optional()
});

/* `Infer<T>` expects the *schema*, not the inferred value — so export the schema type. */
export type Edit = typeof edit;
export type EditGallery = typeof editGallery;