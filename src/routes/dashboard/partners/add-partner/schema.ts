import { z } from 'zod/v4';

export const partnershipTypes = [
	'sponsor',
	'ministry_partner',
	'implementing_partner',
	'media_partner',
	'donor',
	'other'
] as const;

export const partnershipTypeOptions = [
	{ value: 'sponsor', name: 'Sponsor' },
	{ value: 'ministry_partner', name: 'Ministry Partner' },
	{ value: 'implementing_partner', name: 'Implementing Partner' },
	{ value: 'media_partner', name: 'Media Partner' },
	{ value: 'donor', name: 'Donor' },
	{ value: 'other', name: 'Other' }
];

const MB = 1_000_000;

/** An empty file input still submits a zero-byte File, so treat those as "not provided". */
const optionalFile = (maxBytes: number) =>
	z
		.file()
		.max(maxBytes)
		.optional()
		.transform((f) => (f && f.size > 0 ? f : undefined));

export const add = z
	.object({
		/**
		 * Unique in the database. Trim first so " Acme" and "Acme" don't both get
		 * past the check here only to collide at the index.
		 */
		name: z.string('Name is required').trim().min(2).max(200),

		partnershipType: z.enum(partnershipTypes, 'Partnership type is required'),

		description: z.string().trim().max(255).default('').optional(),
		about: z.string().default('').optional(),

		website: z.union([z.url('Enter a valid URL').max(500), z.literal('')]).optional(),

		logo: optionalFile(5 * MB),

		showOnHome: z.boolean().default(false),
		sortOrder: z.number().int().nonnegative('Enter zero or more').default(0)
	})
	.superRefine((data, ctx) => {
		// The homepage strip is a row of logos — a partner without one leaves a gap.
		if (data.showOnHome && !data.logo) {
			ctx.addIssue({
				code: 'custom',
				path: ['logo'],
				message: 'A partner shown on the homepage needs a logo'
			});
		}
	});