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

/**
 * Videos come in as one URL per line rather than a repeatable field group —
 * nested arrays need `dataType: 'json'`, which would break the photo uploads.
 * Exported so the action splits them exactly the way validation did.
 */
export const parseVideoUrls = (value?: string) =>
	(value ?? '')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

const isUrl = (value: string) => {
	try {
		const u = new URL(value);
		return u.protocol === 'http:' || u.protocol === 'https:';
	} catch {
		return false;
	}
};

export const MAX_PHOTOS = 50;
export const MAX_VIDEOS = 20;

export const add = z
	.object({
		title: z.string('Title is required').min(2).max(200),
		description: z.string().max(255).optional(),

		ministryArea: z.coerce.number().optional(),
		event: z.coerce.number().optional(),
		project: z.coerce.number().optional(),

		capturedOn: z.union([z.iso.date(), z.literal('')]).optional(),

		/** Optional — falls back to the first photo, then to a video thumbnail. */
		cover: optionalFile(10 * MB),

		gallery: z
			.file()
			.max(10 * MB)
			.array()
			.max(MAX_PHOTOS, `Upload at most ${MAX_PHOTOS} photos at a time`)
			.optional(),

		videoUrls: z.string().max(4000).optional(),

		isPublished: z.boolean().default(true),
		isFeaturedOnHome: z.boolean().default(false)
	})
	.superRefine((data, ctx) => {
		const photos = (data.gallery ?? []).filter((f) => f && f.size > 0);
		const videos = parseVideoUrls(data.videoUrls);

		if (photos.length === 0 && videos.length === 0) {
			ctx.addIssue({
				code: 'custom',
				path: ['gallery'],
				message: 'Add at least one photo or video link'
			});
		}

		if (videos.length > MAX_VIDEOS) {
			ctx.addIssue({
				code: 'custom',
				path: ['videoUrls'],
				message: `Add at most ${MAX_VIDEOS} video links`
			});
		}

		// Point at the offending line — "one of these is wrong" is no help at 20 lines.
		const badLine = videos.findIndex((url) => !isUrl(url));
		if (badLine !== -1) {
			ctx.addIssue({
				code: 'custom',
				path: ['videoUrls'],
				message: `Line ${badLine + 1} is not a valid URL`
			});
		}

		if (data.capturedOn && data.capturedOn > today()) {
			ctx.addIssue({
				code: 'custom',
				path: ['capturedOn'],
				message: 'The capture date cannot be in the future'
			});
		}

		// Featuring an unpublished gallery does nothing, and reads as though it's live.
		if (data.isFeaturedOnHome && !data.isPublished) {
			ctx.addIssue({
				code: 'custom',
				path: ['isFeaturedOnHome'],
				message: 'Publish the gallery before featuring it on the homepage'
			});
		}
	});