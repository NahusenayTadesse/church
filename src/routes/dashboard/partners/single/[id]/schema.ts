import { z } from 'zod/v4';

export const partnershipTypes = [
	'sponsor',
	'ministry_partner',
	'implementing_partner',
	'media_partner',
	'donor',
	'other'
] as const;

/* ── helpers (fourth copy — these really do belong in $lib/schemaHelpers.ts) ── */

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

/* ── the partner record ────────────────────────────────────────────────── */

export const edit = z.object({
	name: z.string('Name is required').min(2).max(200),
	description: nullableText(255),
	about: nullableText(20000),
	website: nullableUrl(500),
	partnershipType: z.enum(partnershipTypes),

	/* Together these drive the home page partner strip. */
	showOnHome: z.boolean().default(false),
	sortOrder: z.coerce.number().int().min(0).default(0),

	logoUrl: z.file().max(10000000).optional(),
});

/* ── projects this partner works on ────────────────────────────────────── */

export const linkProject = z.object({
	projectId: z.coerce.number().int().positive('Pick a project'),
	role: nullableText(150)
});

export const updateProjectRole = z.object({
	id: z.coerce.number().int().positive(),
	role: nullableText(150)
});

export const linkId = z.object({
	id: z.coerce.number().int().positive()
});

export type Edit = typeof edit;
export type LinkProject = typeof linkProject;