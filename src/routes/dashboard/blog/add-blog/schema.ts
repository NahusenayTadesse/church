import { z } from 'zod/v4';

export const resourceTypes = [
	'article',
	'sermon',
	'teaching',
	'video',
	'audio',
	'bible_study'
] as const;

export const resourceStatuses = ['draft', 'published', 'archived'] as const;

/** Select options, kept here so the markup doesn't hardcode labels. */
export const resourceTypeOptions = [
	{ value: 'article', name: 'Article' },
	{ value: 'sermon', name: 'Sermon' },
	{ value: 'teaching', name: 'Teaching' },
	{ value: 'video', name: 'Video' },
	{ value: 'audio', name: 'Audio' },
	{ value: 'bible_study', name: 'Bible Study' }
];

export const resourceStatusOptions = [
	{ value: 'draft', name: 'Draft' },
	{ value: 'published', name: 'Published' },
	{ value: 'archived', name: 'Archived' }
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
		title: z.string('Title is required').min(2).max(255),
		/**
		 * Unicode-aware: Amharic titles must survive slugging.
		 * `\w` would have stripped ደስተኛ ሕዝቦች down to an empty string.
		 */
		slug: z
			.string('Slug is required')
			.min(2)
			.max(255)
			.regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, 'Use letters, numbers and single dashes only'),
		category: z
			.number('Category is required')
			.int('Category is required')
			.positive('Category is required'),
		ministryArea: z.number().int().positive().optional(),

		resourceType: z.enum(resourceTypes, 'Resource type is required').default('article'),

		author: z.number().int().positive().optional(),
		speaker: z.number().int().positive().optional(),

		excerpt: z.string('Excerpt is required').min(1).max(500),
		content: z.string('Content is required').min(1),
		bibleReferences: z.string().max(255).optional(),

		videoLink: z.union([z.url('Enter a valid URL').max(500), z.literal('')]).optional(),

		// tags: z.number().array().optional().default([]),

		status: z.enum(resourceStatuses).default('draft'),
		/** Blank means "now" when publishing; ignored while the resource is a draft. */
		publishedAt: z.union([z.iso.date(), z.literal('')]).optional(),

		allowComments: z.boolean().default(false),
		isFeaturedOnHome: z.boolean().default(false),

		image: z.file('Featured Image is required').min(1, 'Featured Image is required').max(10 * MB),
		gallery: z
			.file()
			.max(10 * MB)
			.array()
			.optional(),
		audio: optionalFile(50 * MB),
		attachment: optionalFile(25 * MB)
	})
	.superRefine((data, ctx) => {
		if (data.resourceType === 'video' && !data.videoLink) {
			ctx.addIssue({
				code: 'custom',
				path: ['videoLink'],
				message: 'A video link is required for video resources'
			});
		}

		if (
			(data.resourceType === 'audio' || data.resourceType === 'sermon') &&
			!data.audio &&
			!data.videoLink
		) {
			ctx.addIssue({
				code: 'custom',
				path: ['audio'],
				message: 'Upload an audio file or provide a video link'
			});
		}

		if (data.resourceType === 'sermon' && !data.speaker) {
			ctx.addIssue({
				code: 'custom',
				path: ['speaker'],
				message: 'Select the speaker for this sermon'
			});
		}
	});