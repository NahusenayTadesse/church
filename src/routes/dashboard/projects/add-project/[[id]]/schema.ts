import { z } from 'zod/v4';

export const projectStatuses = ['planned', 'active', 'paused', 'completed'] as const;
export const currencies = ['ETB', 'USD', 'EUR', 'GBP'] as const;

export const projectStatusOptions = [
	{ value: 'planned', name: 'Planned' },
	{ value: 'active', name: 'Active' },
	{ value: 'paused', name: 'Paused' },
	{ value: 'completed', name: 'Completed' }
];

export const currencyOptions = [
	{ value: 'ETB', name: 'ETB — Birr' },
	{ value: 'USD', name: 'USD — Dollar' },
	{ value: 'EUR', name: 'EUR — Euro' },
	{ value: 'GBP', name: 'GBP — Pound' }
];

const MB = 1_000_000;

/** An empty file input still submits a zero-byte File, so treat those as "not provided". */
const optionalFile = (maxBytes: number) =>
	z
		.file()
		.max(maxBytes)
		.optional()
		.transform((f) => (f && f.size > 0 ? f : undefined));

const optionalDate = z.union([z.iso.date(), z.literal('')]).optional();

export const add = z
	.object({
		name: z.string('Name is required').min(2).max(200),
		/** Unicode-aware, same as resources — Amharic names must survive slugging. */
		slug: z
			.string('Slug is required')
			.min(2)
			.max(220)
			.regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, 'Use letters, numbers and single dashes only'),

		ministryArea: z.coerce.number().optional(),
		shortDescription: z.string('A short description is required').min(1).max(255),
		fullDescription: z.string().default('').optional(),

		// Timeline
		status: z.enum(projectStatuses).default('planned'),
		startDate: optionalDate,
		endDate: optionalDate,
		location: z.string().max(255).optional(),

		// The work
		goal: z.string().optional(),
		activities: z.string().default('').optional(),
		impactResults: z.string().default('').optional(),

		// People
		leader: z.coerce.number().optional(),
		/** Partner ids — each partner's role is set on the project's own page. */
		partners: z.number().int().positive().array().optional().default([]),

		// Reach
		beneficiaries: z.string().max(255).optional(),
		targetBeneficiaries: z.number().int().positive('Enter one or more').optional(),
		reachedBeneficiaries: z.number().int().nonnegative('Enter zero or more').default(0),

		// Funding
		fundingGoal: z.number().nonnegative('Enter zero or more').optional(),
		fundingRaised: z.number().nonnegative('Enter zero or more').default(0),
		currency: z.enum(currencies).default('ETB'),

		// Ways to support
		acceptsDonations: z.boolean().default(false),
		acceptsVolunteers: z.boolean().default(false),
		acceptsPrayer: z.boolean().default(true),

		image: z.file('Featured Image is required').min(1, 'Featured Image is required').max(10 * MB),
		gallery: z
			.file()
			.max(10 * MB)
			.array()
			.optional(),
		/** Proposal, budget or report — becomes the first project document. */
		proposal: optionalFile(25 * MB),

		isFeaturedOnHome: z.boolean().default(false)
	})
	.superRefine((data, ctx) => {
		if (data.startDate && data.endDate && data.endDate <= data.startDate) {
			ctx.addIssue({
				code: 'custom',
				path: ['endDate'],
				message: 'The end date has to come after the start date'
			});
		}

		if (data.status === 'active' && !data.startDate) {
			ctx.addIssue({
				code: 'custom',
				path: ['startDate'],
				message: 'An active project needs a start date'
			});
		}

		if (data.status === 'completed' && !data.endDate) {
			ctx.addIssue({
				code: 'custom',
				path: ['endDate'],
				message: 'A completed project needs an end date'
			});
		}

		// The progress bar reads raised against goal, so raised alone renders as
		// a full bar or none at all depending on how you divide by nothing.
		if (data.fundingRaised > 0 && data.fundingGoal == null) {
			ctx.addIssue({
				code: 'custom',
				path: ['fundingGoal'],
				message: 'Set a funding goal so the progress bar has something to measure against'
			});
		}
	});