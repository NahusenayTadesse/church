import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { asc, eq, like, ne, and } from 'drizzle-orm';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { error } from '@sveltejs/kit';

import { add } from './schema';
import { db } from '$lib/server/db';
import {
	blog,
	blogGallery,
	blogCategories,
	ministryAreas,
	teamMembers,
	tags
} from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload.js';
import type { Actions, PageServerLoad } from './$types';

/**
 * Formats a stored blog row into the shape superForm's `data` expects.
 * `publishedAt` comes back from MySQL as a Date/timestamp; the form's date
 * input wants `YYYY-MM-DD`, so convert here rather than in the component.
 * File fields (image/gallery/audio/attachment) are never pre-filled — you
 * can't hand a <input type="file"> a value, so those stay empty on edit and
 * the action falls back to the existing DB value when nothing new is uploaded.
 */
const toFormShape = (row: typeof blog.$inferSelect) => ({
	title: row.title,
	slug: row.slug,
	category: row.categoryId,
	ministryArea: row.ministryAreaId ?? undefined,
	resourceType: row.resourceType ?? undefined,
	author: row.authorId ?? undefined,
	speaker: row.speakerId ?? undefined,
	excerpt: row.excerpt ?? '',
	content: row.content ?? '',
	bibleReferences: row.bibleReferences ?? '',
	videoLink: row.videoLink ?? '',
	status: row.status ?? 'draft',
	publishedAt: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : undefined,
	allowComments: row.allowComments ?? false,
	isFeaturedOnHome: row.isFeaturedOnHome ?? false
});

export const load: PageServerLoad = async ({ params }) => {
	const isEdit = !!params.id;
	let existing: typeof blog.$inferSelect | undefined;

	if (isEdit) {
		existing = await db.query.blog.findFirst({
			where: eq(blog.id, Number(params.id))
		});
		if (!existing) error(404, 'Resource not found');
	}

	const form = await superValidate(existing ? toFormShape(existing) : undefined, zod4(add));

	const [cats, areas, people, tagOptions] = await Promise.all([
		db
			.select({ value: blogCategories.id, name: blogCategories.name })
			.from(blogCategories)
			.orderBy(asc(blogCategories.name)),
		db.select({ value: ministryAreas.id, name: ministryAreas.name }).from(ministryAreas),
		db
			.select({ value: teamMembers.id, name: teamMembers.name })
			.from(teamMembers)
			.where(eq(teamMembers.isPublished, true))
			.orderBy(asc(teamMembers.name)),
		db.select({ value: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.name))
	]);

	// existingGallery lets the +page.svelte show current images with a
	// "remove" option — pass it through even if you don't wire that up yet.
	const existingGallery = isEdit
		? await db
				.select({ id: blogGallery.id, imageUrl: blogGallery.imageUrl })
				.from(blogGallery)
				.where(eq(blogGallery.blogId, Number(params.id)))
				.orderBy(asc(blogGallery.sortOrder))
		: [];

	return { form, isEdit, existingGallery, cats, areas, people, tagOptions };
};

/**
 * Excludes the row being edited from the slug-collision check, otherwise
 * saving an untouched post sees its own slug as "taken" and appends `-2`.
 */
const ensureUniqueSlug = async (base: string, excludeId?: number) => {
	const taken = await db
		.select({ slug: blog.slug })
		.from(blog)
		.where(
			excludeId
				? and(like(blog.slug, `${base}%`), ne(blog.id, excludeId))
				: like(blog.slug, `${base}%`)
		);

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
	addBlog: async ({ request, cookies, locals, params }) => {
		const form = await superValidate(request, zod4(add));
		const isEdit = !!params.id;
		const editId = isEdit ? Number(params.id) : undefined;

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
		let existing: typeof blog.$inferSelect | undefined;

		try {
			if (isEdit) {
				existing = await db.query.blog.findFirst({ where: eq(blog.id, editId!) });
				if (!existing) {
					return message(form, { type: 'error', text: 'Resource no longer exists.' }, { status: 404 });
				}
			}

			// Only touch storage for fields that actually received a new file.
			// `undefined` here is the signal to leave the DB column untouched.
			const [featuredImage, galleryImages, audioUrl, downloadUrl] = await Promise.all([
				image?.size ? saveUploadedFile(image) : Promise.resolve(undefined),
				uploadGallery(gallery),
				audio?.size ? saveUploadedFile(audio) : Promise.resolve(undefined),
				attachment?.size ? saveUploadedFile(attachment) : Promise.resolve(undefined)
			]);

			const newSlug = await ensureUniqueSlug(slug, editId);

			const publishDate =
				status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : null;

			const baseFields = {
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
				status,
				publishedAt: publishDate,
				allowComments,
				isFeaturedOnHome
			};

			resourceId = await db.transaction(async (tx) => {
			

				// Add path — unchanged from the original action.
				const [row] = await tx
					.insert(blog)
					.values({
						...baseFields,
						audioUrl,
						downloadUrl,
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

				return row.id;
			});
		} catch (err) {
			console.error(`Failed to ${isEdit ? 'update' : 'add'} resource:`, err);
			return message(
				form,
				{ type: 'error', text: `An error occurred while ${isEdit ? 'updating' : 'adding'} the resource.` },
				{ status: 500 }
			);
		}

		redirect(
			`/dashboard/blog/single/${resourceId}`,
			{
				type: 'success',
				message: `Resource successfully ${isEdit ? 'updated' : 'added'}`
			},
			cookies
		);
	}
};