import { z } from 'zod/v4';

const MB = 1_000_000;

/** An empty file input still submits a zero-byte File, so treat those as "not provided". */
const optionalFile = (maxBytes: number) =>
	z
		.file()
		.max(maxBytes)
		.optional()
		.transform((f) => (f && f.size > 0 ? f : undefined));

/** `YYYY-MM-DD` sorts lexicographically, so a plain string compare is enough. */
const today = () => new Date().toISOString().slice(0, 10);

export const add = z
	.object({
		name: z.string('Name is required').min(2).max(255),
		position: z.string().max(255).optional(),
		/** Story headline — optional, since a short quote doesn't need one. */
		title: z.string().max(255).optional(),

		message: z
			.string('The testimonial is required')
			.min(10, 'Add a little more of the story')
			.max(5000),

		avatar: optionalFile(5 * MB),

		ministryArea: z.coerce.number().optional(),
		project: z.coerce.number().optional(),
		event: z.coerce.number().optional(),

		storyDate: z.union([z.iso.date(), z.literal('')]).optional(),

		/**
		 * The consent flag. Nothing here reaches the public site without it, and
		 * the table's own comment says to enforce that in the query layer too.
		 */
		permissionGiven: z.boolean().default(false),
		isPublished: z.boolean().default(false),
		isFeaturedOnHome: z.boolean().default(false)
	})
	.superRefine((data, ctx) => {
		if (data.isPublished && !data.permissionGiven) {
			ctx.addIssue({
				code: 'custom',
				path: ['permissionGiven'],
				message: 'Confirm this person agreed to have their story shared before publishing it'
			});
		}

		// Featuring an unpublished story does nothing, and reads as though it's live.
		if (data.isFeaturedOnHome && !data.isPublished) {
			ctx.addIssue({
				code: 'custom',
				path: ['isFeaturedOnHome'],
				message: 'Publish the story before featuring it on the homepage'
			});
		}

		if (data.storyDate && data.storyDate > today()) {
			ctx.addIssue({
				code: 'custom',
				path: ['storyDate'],
				message: 'The story date cannot be in the future'
			});
		}
	});