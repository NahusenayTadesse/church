import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { asc, eq, like } from 'drizzle-orm';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

import { add } from './schema';
import { db } from '$lib/server/db';
import {
	blog,
	blogGallery,
	blogCategories,
	ministryAreas,
	teamMembers,
	tags,
	resourceTags
} from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(add));

	const [cats, areas, people, tagOptions] = await Promise.all([
		db
			.select({ value: blogCategories.id, name: blogCategories.name })
			.from(blogCategories)
			.orderBy(asc(blogCategories.name)),
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas),
		db
			.select({ value: teamMembers.id, name: teamMembers.name })
			.from(teamMembers)
			.where(eq(teamMembers.isPublished, true))
			.orderBy(asc(teamMembers.name)),
		db.select({ value: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.name))
	]);

	return { form, cats, areas, people, tagOptions };
};

/**
 * `slug` is unique in the database now, so a naive `slug + '-1'` would still
 * collide on the third post with the same title. Walk until we find a free one.
 */
const ensureUniqueSlug = async (base: string) => {
	const taken = await db
		.select({ slug: blog.slug })
		.from(blog)
		.where(like(blog.slug, `${base}%`));

	const used = new Set(taken.map((r) => r.slug));
	if (!used.has(base)) return base;

	let n = 2;
	while (used.has(`${base}-${n}`)) n++;
	return `${base}-${n}`;
};

const uploadGallery = async (files: File[] | undefined) => {
	const valid = (files ?? []).filter((f) => f && f.size > 0);
	if (valid.length === 0) return [];

	return Promise.all(valid.map((file) => saveUploadedFile(file)));
};

export const actions: Actions = {
	addBlog: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const {
			title,
			slug,
			category,
			ministryArea,
			resourceType,
			author,
			speaker,
			excerpt,
			content,
			bibleReferences,
			videoLink,
			status,
			publishedAt,
			allowComments,
			isFeaturedOnHome,
			image,
			gallery,
			audio,
			attachment
		} = form.data;

		let resourceId: number;

		try {
			// Uploads run before the transaction opens — no point holding a DB
			// connection while files stream to disk.
			const [featuredImage, galleryImages, audioUrl, downloadUrl] = await Promise.all([
				saveUploadedFile(image),
				uploadGallery(gallery),
				audio ? saveUploadedFile(audio) : Promise.resolve(null),
				attachment ? saveUploadedFile(attachment) : Promise.resolve(null)
			]);

			const newSlug = await ensureUniqueSlug(slug);

			// Only stamp a publish date when it's actually published.
			const publishDate =
				status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : null;

			resourceId = await db.transaction(async (tx) => {
				const [row] = await tx
					.insert(blog)
					.values({
						title,
						slug: newSlug,
						categoryId: category,
						ministryAreaId: ministryArea ?? null,
						resourceType,
						authorId: author ?? null,
						speakerId: speaker ?? null,
						excerpt,
						content,
						bibleReferences: bibleReferences || null,
						videoLink: videoLink || null,
						audioUrl,
						downloadUrl,
						status,
						publishedAt: publishDate,
						allowComments,
						isFeaturedOnHome,
						featuredImage,
						createdBy: locals?.user?.id
					})
					.$returningId();

				if (galleryImages.length > 0) {
					await tx.insert(blogGallery).values(
						galleryImages.map((url, i) => ({
							blogId: row.id,
							imageUrl: url,
							sortOrder: i
						}))
					);
				}

				// if (tagIds?.length) {
				// 	await tx.insert(resourceTags).values(
				// 		tagIds.map((tagId) => ({
				// 			resourceId: row.id,
				// 			tagId
				// 		}))
				// 	);
				// }

				return row.id;
			});
		} catch (err) {
			console.error('Failed to add resource:', err);
			return message(
				form,
				{ type: 'error', text: 'An error occurred while adding the resource.' },
				{ status: 500 }
			);
		}

		// `redirect` from sveltekit-flash-message throws, so it must be the last
		// statement and outside the try block — otherwise the catch swallows it.
		redirect(
			`/dashboard/blog/single/${resourceId}`,
			{ type: 'success', message: 'New resource successfully added' },
			cookies
		);
	}
};