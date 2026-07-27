import { z } from 'zod/v4';

export const languages = ['english', 'amharic', 'other'] as const;
export const bookStatuses = ['draft', 'published'] as const;
export const currencies = ['ETB', 'USD', 'EUR', 'GBP'] as const;

export const languageOptions = [
	{ value: 'english', name: 'English' },
	{ value: 'amharic', name: 'Amharic' },
	{ value: 'other', name: 'Other' }
];

export const bookStatusOptions = [
	{ value: 'draft', name: 'Draft' },
	{ value: 'published', name: 'Published' }
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

const optionalPrice = z.number().nonnegative('Enter zero or more').optional();

export const add = z
	.object({
		title: z.string('Title is required').min(2).max(255),
		subtitle: z.string().max(255).optional(),
		/** Unicode-aware, same as resources — Amharic titles must survive slugging. */
		slug: z
			.string('Slug is required')
			.min(2)
			.max(280)
			.regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, 'Use letters, numbers and single dashes only'),

		/** Either a team member or a free-typed name — the table carries both. */
		author: z.number().int().positive().optional(),
		authorName: z.string().max(150).optional(),

		language: z.enum(languages).default('english'),
		ministryArea: z.number().int().positive().optional(),
		description: z.string().default('').optional(),

		publicationDate: z.union([z.iso.date(), z.literal('')]).optional(),
		pages: z.number().int().positive('Page count must be at least 1').optional(),
		isbn: z.string().max(20).optional(),


		// How readers get it
		price: optionalPrice,
		currency: z.enum(currencies).default('ETB'),
		purchaseLink: z.union([z.url('Enter a valid URL').max(500), z.literal('')]).optional(),
		/** Only set when the book is sold on-site — reuses stock, orders and prices. */

		// Formats. One block per value of the `format` enum; a row is written for
		// each one that's actually available.
		physicalAvailable: z.boolean().default(false),
		physicalPrice: optionalPrice,

		pdfFile: optionalFile(25 * MB),
		pdfPrice: optionalPrice,
		pdfFree: z.boolean().default(false),

		ebookFile: optionalFile(25 * MB),
		ebookPrice: optionalPrice,
		ebookFree: z.boolean().default(false),

		audiobookFile: optionalFile(150 * MB),
		audiobookPrice: optionalPrice,
		audiobookFree: z.boolean().default(false),

		cover: z.file('Cover image is required').min(1, 'Cover image is required').max(10 * MB),
		/** Sample chapter or preview — shown on the book page, not sold. */
		preview: optionalFile(25 * MB),

		status: z.enum(bookStatuses).default('draft'),
		isFeaturedOnHome: z.boolean().default(false)
	})
	.superRefine((data, ctx) => {
		if (!data.author && !data.authorName?.trim()) {
			ctx.addIssue({
				code: 'custom',
				path: ['authorName'],
				message: 'Pick a team member, or type the author name'
			});
		}

		// ISBNs are 10 or 13 digits once the hyphens come out; the last digit of an
		// ISBN-10 can be an X.
		if (data.isbn?.trim()) {
			const digits = data.isbn.replace(/[\s-]/g, '');
			if (!/^(?:\d{9}[\dXx]|\d{13})$/.test(digits)) {
				ctx.addIssue({
					code: 'custom',
					path: ['isbn'],
					message: 'An ISBN is 10 or 13 digits'
				});
			}
		}

		if (data.physicalAvailable && data.physicalPrice == null && data.price == null) {
			ctx.addIssue({
				code: 'custom',
				path: ['physicalPrice'],
				message: 'Set a price for the print edition, or a price for the book'
			});
		}

		const digital = [
			{ key: 'pdf', label: 'PDF', file: data.pdfFile, price: data.pdfPrice, free: data.pdfFree },
			{
				key: 'ebook',
				label: 'ebook',
				file: data.ebookFile,
				price: data.ebookPrice,
				free: data.ebookFree
			},
			{
				key: 'audiobook',
				label: 'audiobook',
				file: data.audiobookFile,
				price: data.audiobookPrice,
				free: data.audiobookFree
			}
		];

		for (const f of digital) {
			if (!f.file) {
				// A price on a format with no file would never be reachable.
				if (f.price != null || f.free) {
					ctx.addIssue({
						code: 'custom',
						path: [`${f.key}File`],
						message: `Upload the ${f.label} file, or clear its price`
					});
				}
				continue;
			}

			if (f.free && f.price) {
				ctx.addIssue({
					code: 'custom',
					path: [`${f.key}Price`],
					message: 'A free download cannot have a price'
				});
			}

			if (!f.free && f.price == null && data.price == null) {
				ctx.addIssue({
					code: 'custom',
					path: [`${f.key}Price`],
					message: `Set a price for the ${f.label}, or mark it as a free download`
				});
			}
		}
	}); 