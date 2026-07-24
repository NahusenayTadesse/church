import { db } from '$lib/server/db';
import { blog, blogCategories, ministryAreas, teamMembers } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// two joins onto the same table need aliases
const author = alias(teamMembers, 'author');
const speaker = alias(teamMembers, 'speaker');

export const load: PageServerLoad = async () => {
	const blogList = await db
		.select({
			id: blog.id,
			title: blog.title,
			slug: blog.slug,
			featuredImage: blog.featuredImage,
			excerpt: blog.excerpt,
			content: blog.content,

			category: blogCategories.name,
			categoryId: blog.categoryId,
			ministryArea: ministryAreas.name,
			resourceType: blog.resourceType,

			author: author.name,
			speaker: speaker.name,

			videoLink: blog.videoLink,
			audioUrl: blog.audioUrl,
			downloadUrl: blog.downloadUrl,
			bibleReferences: blog.bibleReferences,

			status: blog.status,
			publishedAt: blog.publishedAt,
			viewCount: blog.viewCount,
			allowComments: blog.allowComments,
			isFeaturedOnHome: blog.isFeaturedOnHome,
			createdAt: blog.createdAt
		})
		.from(blog)
		.leftJoin(blogCategories, eq(blog.categoryId, blogCategories.id))
		.leftJoin(ministryAreas, eq(blog.ministryAreaId, ministryAreas.id))
		.leftJoin(author, eq(blog.authorId, author.id))
		.leftJoin(speaker, eq(blog.speakerId, speaker.id))
		.orderBy(desc(blog.id));

	return { blogList };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing resource id' });

		try {
			await db.delete(blog).where(eq(blog.id, id));
			return { success: true, message: 'Resource deleted' };
		} catch {
			return fail(500, { message: 'Could not delete resource' });
		}
	},

	toggleFeatured: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing resource id' });

		await db.update(blog).set({ isFeaturedOnHome: !value }).where(eq(blog.id, id));
		return { success: true };
	},

	publish: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing resource id' });

		await db
			.update(blog)
			.set({ status: 'published', publishedAt: new Date() })
			.where(eq(blog.id, id));
		return { success: true, message: 'Resource published' };
	}
};