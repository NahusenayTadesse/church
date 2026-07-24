import { z } from 'zod/v4';

export const socialPlatforms = [
	'facebook',
	'x',
	'instagram',
	'linkedin',
	'youtube',
	'telegram',
	'tiktok',
	'website'
] as const;

/* ── helpers (sixth copy — $lib/schemaHelpers.ts, seriously) ────────────── */

const nullableText = (max: number) =>
	z
		.union([z.string().max(max), z.literal(''), z.null(), z.undefined()])
		.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

const nullableEmail = z
	.union([z.email('Enter a valid email').max(100), z.literal(''), z.null(), z.undefined()])
	.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

/** better-auth user ids are varchar, not ints — so this one isn't nullableId. */
const nullableUserId = z
	.union([z.string().max(255), z.literal(''), z.null(), z.undefined()])
	.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

/* ── the team member record ────────────────────────────────────────────── */

export const edit = z.object({
	name: z.string('Name is required').min(2).max(150),
	position: nullableText(150),
	biography: nullableText(20000),

	email: nullableEmail,
	phone: nullableText(20),

	/* Links this public profile to a login account, for authors and organizers. */
	userId: nullableUserId,

	isExecutive: z.boolean().default(false),
	isSpeaker: z.boolean().default(false),
	isPublished: z.boolean().default(true),
	sortOrder: z.coerce.number().int().min(0).default(0),

	photoUrl: z.file('Photo is required').max(10000000).optional()
});

/* ── areas of expertise ────────────────────────────────────────────────── */

/** The whole set is replaced on save, so this is a sync rather than an add. */
export const setAreas = z.object({
	ministryAreaIds: z.array(z.coerce.number().int().positive()).default([])
});

/* ── social links ──────────────────────────────────────────────────────── */

export const addSocial = z.object({
	platform: z.enum(socialPlatforms),
	url: z.url('Enter the full URL, including https://').max(500),
	sortOrder: z.coerce.number().int().min(0).default(0)
});

export const editSocial = addSocial.extend({
	id: z.coerce.number().int().positive()
});

export const rowId = z.object({
	id: z.coerce.number().int().positive()
});

export type Edit = typeof edit;
export type AddSocial = typeof addSocial;
