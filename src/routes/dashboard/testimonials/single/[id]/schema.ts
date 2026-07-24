import { z } from 'zod/v4';

/* ── helpers (seventh copy — extract these already) ─────────────────────── */

const nullableId = z
	.union([z.number().int().positive(), z.literal(''), z.null(), z.undefined()])
	.transform((v) => (typeof v === 'number' ? v : null));

const nullableText = (max: number) =>
	z
		.union([z.string().max(max), z.literal(''), z.null(), z.undefined()])
		.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

const nullableDate = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.date()])
	.transform((v) => (v instanceof Date ? v : null));

/* ── the testimonial record ────────────────────────────────────────────── */

export const edit = z
	.object({
		name: z.string('Name is required').min(2).max(255),
		position: nullableText(255),

		/* The headline the story is listed under, separate from the quote itself. */
		title: nullableText(255),
		message: z.string('The story is required').min(2),

		ministryAreaId: nullableId,
		projectId: nullableId,
		eventId: nullableId,
		storyDate: nullableDate,

		/**
		 * The schema comment on this column is the whole point of this page: a story
		 * without recorded permission must never reach the public site. The refines
		 * below enforce it, and the action re-checks server-side.
		 */
		permissionGiven: z.boolean().default(false),
		isPublished: z.boolean().default(false),
		isFeaturedOnHome: z.boolean().default(false),

		avatarUrl: z.file('Photo is required').max(10000000).optional()
	})
	.refine((d) => !d.isPublished || d.permissionGiven, {
		message: 'Record permission before publishing this story',
		path: ['isPublished']
	})
	.refine((d) => !d.isFeaturedOnHome || d.isPublished, {
		message: 'Only published stories can be featured on the home page',
		path: ['isFeaturedOnHome']
	});

/* ── moderation quick actions ──────────────────────────────────────────── */

export const setPublished = z.object({
	isPublished: z.coerce.boolean().optional()
});

export const setFeatured = z.object({
	isFeaturedOnHome: z.coerce.boolean().optional()
});

export const setPermission = z.object({
	permissionGiven: z.coerce.boolean().optional()
});

export type Edit = typeof edit;
