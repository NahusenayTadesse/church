import { z } from 'zod/v4';

export const projectStatuses = ['planned', 'active', 'paused', 'completed'] as const;
export const documentTypes = ['pdf', 'doc', 'image', 'other'] as const;

/* ── helpers (fifth copy — please move these to $lib/schemaHelpers.ts) ───── */

const nullableId = z
	.union([z.number().int().positive(), z.literal(''), z.null(), z.undefined()])
	.transform((v) => (typeof v === 'number' ? v : null));

const nullableNumber = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.number()])
	.transform((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null));

const nullableInt = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)])
	.transform((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null));

const nullableText = (max: number) =>
	z
		.union([z.string().max(max), z.literal(''), z.null(), z.undefined()])
		.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

const nullableDate = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.date()])
	.transform((v) => (v instanceof Date ? v : null));

/* ── the project record ────────────────────────────────────────────────── */

export const edit = z
	.object({
		name: z.string('Name is required').min(2).max(200),
		slug: z
			.string('Slug is required')
			.min(2)
			.max(220)
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only'),
		shortDescription: nullableText(255),
		fullDescription: z.string('Description is required').min(2),
		ministryAreaId: nullableId,

		/* The three long-form blocks the public project page renders. */
		goal: nullableText(20000),
		activities: nullableText(20000),
		impactResults: nullableText(20000),

		location: nullableText(255),
		startDate: nullableDate,
		endDate: nullableDate,
		status: z.enum(projectStatuses).default('planned'),
		leaderId: nullableId,

		beneficiaries: nullableText(255),
		targetBeneficiaries: nullableInt,
		reachedBeneficiaries: z.coerce.number().int().min(0).default(0),

		fundingGoal: nullableNumber,
		currency: z.string().length(3).default('ETB'),

		/* "Ways to Support" on the public page. */
		acceptsDonations: z.boolean().default(false),
		acceptsVolunteers: z.boolean().default(false),
		acceptsPrayer: z.boolean().default(true),

		isFeaturedOnHome: z.boolean().default(false),

		image: z.file('Featured image is required').max(10000000).optional()
	})
	.refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
		message: 'The end date has to come on or after the start date',
		path: ['endDate']
	})
	.refine((d) => !d.acceptsDonations || (d.fundingGoal !== null && d.fundingGoal > 0), {
		message: 'Set a funding goal, or turn donations off',
		path: ['fundingGoal']
	});

/* `fundingRaised` is deliberately not in the edit form — it's a running total,
   not a description of the project. It has its own two actions below. */

export const setFunding = z.object({
	fundingRaised: z.coerce.number().min(0)
});

/* ── gallery ───────────────────────────────────────────────────────────── */

export const editGallery = z.object({
	existing: z.array(z.string()).default([]),
	gallery: z.file().max(10000000).array().optional()
});

/* ── documents ─────────────────────────────────────────────────────────── */

export const addDocument = z.object({
	title: z.string('Title is required').min(2).max(200),
	fileType: z.enum(documentTypes).default('pdf'),
	sortOrder: z.coerce.number().int().min(0).default(0),
	file: z.file('Pick a file to upload').max(50000000)
});

/* ── partners ──────────────────────────────────────────────────────────── */

export const linkPartner = z.object({
	partnerId: z.coerce.number().int().positive('Pick a partner'),
	role: nullableText(150)
});

export const updatePartnerRole = z.object({
	id: z.coerce.number().int().positive(),
	role: nullableText(150)
});

/* ── updates ───────────────────────────────────────────────────────────── */

export const addUpdate = z.object({
	title: z.string('Title is required').min(2).max(200),
	content: nullableText(20000),
	publishedAt: nullableDate,
	image: z.file().max(10000000).optional()
});

export const editUpdate = addUpdate.extend({
	id: z.coerce.number().int().positive()
});

/* ── shared ────────────────────────────────────────────────────────────── */

export const rowId = z.object({
	id: z.coerce.number().int().positive()
});

export type Edit = typeof edit;
export type EditGallery = typeof editGallery;
export type AddDocument = typeof addDocument;
export type AddUpdate = typeof addUpdate;