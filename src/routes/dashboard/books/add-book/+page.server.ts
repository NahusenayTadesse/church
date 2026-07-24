import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { asc, eq, like } from 'drizzle-orm';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

import { add } from './schema';
import { db } from '$lib/server/db';
import {
	books,
	bookFormats,
	ministryAreas,
	teamMembers,
	products
} from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(add));

	const [areas, people, productOptions] = await Promise.all([
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db
			.select({ value: teamMembers.id, name: teamMembers.name })
			.from(teamMembers)
			.where(eq(teamMembers.isPublished, true))
			.orderBy(asc(teamMembers.name)),
		db.select({ value: products.id, name: products.name }).from(products).orderBy(asc(products.name))
	]);

	return { form, areas, people, productOptions };
};

/** Slug is unique, so walk until a free one turns up rather than always appending `-1`. */
const ensureUniqueSlug = async (base: string) => {
	const taken = await db
		.select({ slug: books.slug })
		.from(books)
		.where(like(books.slug, `${base}%`));

	const used = new Set(taken.map((r) => r.slug));
	if (!used.has(base)) return base;

	let n = 2;
	while (used.has(`${base}-${n}`)) n++;
	return `${base}-${n}`;
};

/** Drizzle takes decimals as strings — keep the conversion in one place. */
const money = (value: number | null | undefined) => (value == null ? null : String(value));

export const actions: Actions = {
	addBook: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const {
			title,
			subtitle,
			slug,
			author,
			authorName,
			language,
			ministryArea,
			description,
			publicationDate,
			pages,
			isbn,
			price,
			currency,
			purchaseLink,
			physicalAvailable,
			physicalPrice,
			pdfFile,
			pdfPrice,
			pdfFree,
			ebookFile,
			ebookPrice,
			ebookFree,
			audiobookFile,
			audiobookPrice,
			audiobookFree,
			cover,
			preview,
			status,
			isFeaturedOnHome
		} = form.data;

		let bookId: number;

		try {
			// Uploads run before the transaction opens — no point holding a DB
			// connection while files stream to disk.
			const [coverImage, previewFileUrl, pdfUrl, ebookUrl, audiobookUrl] = await Promise.all([
				saveUploadedFile(cover),
				preview ? saveUploadedFile(preview) : Promise.resolve(null),
				pdfFile ? saveUploadedFile(pdfFile) : Promise.resolve(null),
				ebookFile ? saveUploadedFile(ebookFile) : Promise.resolve(null),
				audiobookFile ? saveUploadedFile(audiobookFile) : Promise.resolve(null)
			]);

			const newSlug = await ensureUniqueSlug(slug);

			// A format falls back to the book's own price when it doesn't set one.
			const formatRows = [
				physicalAvailable && {
					format: 'physical' as const,
					fileUrl: null,
					price: money(physicalPrice ?? price),
					isFreeDownload: false
				},
				pdfUrl && {
					format: 'pdf' as const,
					fileUrl: pdfUrl,
					price: pdfFree ? null : money(pdfPrice ?? price),
					isFreeDownload: pdfFree
				},
				ebookUrl && {
					format: 'ebook' as const,
					fileUrl: ebookUrl,
					price: ebookFree ? null : money(ebookPrice ?? price),
					isFreeDownload: ebookFree
				},
				audiobookUrl && {
					format: 'audiobook' as const,
					fileUrl: audiobookUrl,
					price: audiobookFree ? null : money(audiobookPrice ?? price),
					isFreeDownload: audiobookFree
				}
			].filter(Boolean) as {
				format: 'physical' | 'pdf' | 'ebook' | 'audiobook';
				fileUrl: string | null;
				price: string | null;
				isFreeDownload: boolean;
			}[];

			bookId = await db.transaction(async (tx) => {
				const [row] = await tx
					.insert(books)
					.values({
						title,
						subtitle: subtitle || null,
						slug: newSlug,
						description: description || null,
						coverImage,

						authorId: author ?? null,
						// Only keep the typed name when it isn't already covered by the
						// linked team member, otherwise the two drift apart on edit.
						authorName: author ? null : authorName?.trim() || null,

						language,
						publicationDate: publicationDate || null,
						ministryAreaId: ministryArea ?? null,
						pages: pages ?? null,
						isbn: isbn?.trim() || null,

						purchaseLink: purchaseLink || null,
						price: money(price),
						currency,
						previewFileUrl,
						status,
						isFeaturedOnHome,
						createdBy: locals?.user?.id
					})
					.$returningId();

				if (formatRows.length > 0) {
					await tx.insert(bookFormats).values(formatRows.map((f) => ({ bookId: row.id, ...f })));
				}

				return row.id;
			});
		} catch (err) {
			console.error('Failed to add book:', err);
			return message(
				form,
				{ type: 'error', text: 'An error occurred while adding the book.' },
				{ status: 500 }
			);
		}

		// `redirect` throws, so it stays outside the try block.
		redirect(
			`/dashboard/books/single/${bookId}`,
			{ type: 'success', message: 'New book successfully added' },
			cookies
		);
	}
};