import { z } from 'zod/v4';

/** Mirrors the `platform` enum on `team_member_socials`. */
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

export type SocialPlatform = (typeof socialPlatforms)[number];

export const socialLabels: Record<SocialPlatform, string> = {
	facebook: 'Facebook',
	x: 'X (Twitter)',
	instagram: 'Instagram',
	linkedin: 'LinkedIn',
	youtube: 'YouTube',
	telegram: 'Telegram',
	tiktok: 'TikTok',
	website: 'Personal Website'
};

export const socialPlaceholders: Record<SocialPlatform, string> = {
	facebook: 'https://facebook.com/username',
	x: 'https://x.com/username',
	instagram: 'https://instagram.com/username',
	linkedin: 'https://linkedin.com/in/username',
	youtube: 'https://youtube.com/@channel',
	telegram: 'https://t.me/username',
	tiktok: 'https://tiktok.com/@username',
	website: 'https://example.com'
};

const MB = 1_000_000;

/** An empty URL input submits '', which is not a valid URL — allow it through as "not provided". */
const optionalUrl = z.union([z.url('Enter a valid URL').max(500), z.literal('')]).optional();

/** Build the eight social URL fields without writing them out one by one. */
const socialFields = Object.fromEntries(socialPlatforms.map((p) => [p, optionalUrl])) as Record<
	SocialPlatform,
	typeof optionalUrl
>;

export const add = z
	.object({
		name: z.string('Name is required').min(2).max(150),
		position: z.string().max(150).optional(),

		email: z.union([z.email('Enter a valid email').max(100), z.literal('')]).optional(),
		phone: z.string().max(20).optional(),

		biography: z.string().default('').optional(),

		/**
		 * Optional link to a login account, so authors and organizers can be
		 * matched to the person who actually signs in.
		 */
		userId: z.string().max(255).optional(),

		/** Areas of expertise — ids from `ministry_areas`. */
		ministryAreas: z.number().int().positive().array().optional().default([]),

		isExecutive: z.boolean().default(false),
		isSpeaker: z.boolean().default(false),
		isPublished: z.boolean().default(true),

		sortOrder: z.number().int().min(0).default(0),

		photo: z.file('Photo is required').min(1, 'Photo is required').max(5 * MB),

		...socialFields
	})
	.superRefine((data, ctx) => {
		// A speaker card without a bio renders as a name and nothing else.
		if (data.isSpeaker && !data.biography?.trim()) {
			ctx.addIssue({
				code: 'custom',
				path: ['biography'],
				message: 'Speakers need a biography'
			});
		}

		// Executives are the contact points on the About page.
		if (data.isExecutive && !data.email && !data.phone) {
			ctx.addIssue({
				code: 'custom',
				path: ['email'],
				message: 'Add an email or a phone number for an executive'
			});
		}
	});