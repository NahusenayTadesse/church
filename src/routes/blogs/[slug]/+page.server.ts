import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, gt, lt, ne, sql, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '$lib/server/db';
import {
	blog,
	blogCategories,
	blogGallery,
	ministryAreas,
	teamMembers,
	teamMemberSocials,
	tags,
	resourceTags,
	relatedResources,
	bookResources,
	books
} from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Turns a YouTube / Vimeo watch link into an embeddable one. Anything else passes through. */
function toEmbedUrl(link: string | null) {
	if (!link) return null;
	const yt = link.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
	if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
	const vimeo = link.match(/vimeo\.com\/(\d+)/);
	if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
	return link;
}

function slugifyHeading(text: string, index: number) {
	const base = text
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '');
	return base ? `${base}-${index}` : `section-${index}`;
}

/**
 * Adds ids to h2/h3 elements so the outline in the sidebar can jump to them,
 * and returns the outline itself. Content comes from staff, so it is rendered
 * as-is — sanitise at the editor if that ever stops being true.
 */
function buildOutline(html: string | null) {
	if (!html) return { html: '', outline: [] as { id: string; text: string; level: number }[] };

	const outline: { id: string; text: string; level: number }[] = [];

	const withIds = html.replace(
		/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
		(match, level: string, attrs: string, inner: string) => {
			const text = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
			if (!text) return match;

			const existing = attrs.match(/id=["']([^"']+)["']/i);
			const id = existing ? existing[1] : slugifyHeading(text, outline.length);
			outline.push({ id, text, level: Number(level) });

			return existing
				? match
				: `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
		}
	);

	return { html: withIds, outline };
}

/* -------------------------------------------------------------------------- */
/* load                                                                        */
/* -------------------------------------------------------------------------- */

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const author = alias(teamMembers, 'author');
	const speaker = alias(teamMembers, 'speaker');

	const [post] = await db
		.select({
			id: blog.id,
			title: blog.title,
			slug: blog.slug,
			excerpt: blog.excerpt,
			content: blog.content,
			resourceType: blog.resourceType,
			featuredImage: blog.featuredImage,
			publishedAt: blog.publishedAt,
			viewCount: blog.viewCount,
			videoLink: blog.videoLink,
			audioUrl: blog.audioUrl,
			downloadUrl: blog.downloadUrl,
			bibleReferences: blog.bibleReferences,
			categoryId: blog.categoryId,
			categoryName: blogCategories.name,
			ministryAreaId: blog.ministryAreaId,
			ministryAreaName: ministryAreas.name,
			authorId: author.id,
			authorName: author.name,
			authorPhoto: author.photo,
			authorPosition: author.position,
			authorBio: author.biography,
			speakerId: speaker.id,
			speakerName: speaker.name,
			speakerPhoto: speaker.photo,
			speakerPosition: speaker.position,
			readMinutes: sql<number>`greatest(1, round(char_length(coalesce(${blog.content}, '')) / 1100))`
		})
		.from(blog)
		.leftJoin(blogCategories, eq(blogCategories.id, blog.categoryId))
		.leftJoin(ministryAreas, eq(ministryAreas.id, blog.ministryAreaId))
		.leftJoin(author, eq(author.id, blog.authorId))
		.leftJoin(speaker, eq(speaker.id, blog.speakerId))
		.where(and(eq(blog.slug, params.slug), eq(blog.status, 'published')))
		.limit(1);

	if (!post) error(404, 'That resource does not exist, or is not published yet.');

	const { html, outline } = buildOutline(post.content);

	const [postTags, gallery, authorSocials, manualRelated, relatedBooks, previous, next] =
		await Promise.all([
			db
				.select({ id: tags.id, name: tags.name })
				.from(resourceTags)
				.innerJoin(tags, eq(tags.id, resourceTags.tagId))
				.where(eq(resourceTags.resourceId, post.id)),

			db
				.select({
					id: blogGallery.id,
					imageUrl: blogGallery.imageUrl,
					caption: blogGallery.caption
				})
				.from(blogGallery)
				.where(eq(blogGallery.blogId, post.id))
				.orderBy(asc(blogGallery.sortOrder)),

			post.authorId
				? db
						.select({
							id: teamMemberSocials.id,
							platform: teamMemberSocials.platform,
							url: teamMemberSocials.url
						})
						.from(teamMemberSocials)
						.where(eq(teamMemberSocials.teamMemberId, post.authorId))
						.orderBy(asc(teamMemberSocials.sortOrder))
				: Promise.resolve([]),

			db
				.select({
					id: blog.id,
					title: blog.title,
					slug: blog.slug,
					excerpt: blog.excerpt,
					featuredImage: blog.featuredImage,
					resourceType: blog.resourceType,
					publishedAt: blog.publishedAt
				})
				.from(relatedResources)
				.innerJoin(blog, eq(blog.id, relatedResources.relatedResourceId))
				.where(and(eq(relatedResources.resourceId, post.id), eq(blog.status, 'published')))
				.orderBy(asc(relatedResources.sortOrder))
				.limit(3),

			db
				.select({
					id: books.id,
					title: books.title,
					subtitle: books.subtitle,
					slug: books.slug,
					coverImage: books.coverImage,
					authorName: books.authorName
				})
				.from(bookResources)
				.innerJoin(books, eq(books.id, bookResources.bookId))
				.where(and(eq(bookResources.resourceId, post.id), eq(books.status, 'published')))
				.limit(3),

			post.publishedAt
				? db
						.select({ title: blog.title, slug: blog.slug })
						.from(blog)
						.where(
							and(
								eq(blog.status, 'published'),
								lt(blog.publishedAt, post.publishedAt),
								ne(blog.id, post.id)
							)
						)
						.orderBy(desc(blog.publishedAt))
						.limit(1)
				: Promise.resolve([]),

			post.publishedAt
				? db
						.select({ title: blog.title, slug: blog.slug })
						.from(blog)
						.where(
							and(
								eq(blog.status, 'published'),
								gt(blog.publishedAt, post.publishedAt),
								ne(blog.id, post.id)
							)
						)
						.orderBy(asc(blog.publishedAt))
						.limit(1)
				: Promise.resolve([])
		]);

	/* No manual links? Fall back to the same category, then the same ministry area. */
	let related = manualRelated;
	if (!related.length) {
		const conditions = [eq(blog.status, 'published'), ne(blog.id, post.id)];
		if (post.categoryId) conditions.push(eq(blog.categoryId, post.categoryId));
		else if (post.ministryAreaId) conditions.push(eq(blog.ministryAreaId, post.ministryAreaId));

		related = await db
			.select({
				id: blog.id,
				title: blog.title,
				slug: blog.slug,
				excerpt: blog.excerpt,
				featuredImage: blog.featuredImage,
				resourceType: blog.resourceType,
				publishedAt: blog.publishedAt
			})
			.from(blog)
			.where(and(...conditions))
			.orderBy(desc(blog.publishedAt))
			.limit(3);
	}

	/* Cheap view counter. Swap for a queued job if this page ever gets hot. */
	await db
		.update(blog)
		.set({ viewCount: sql`${blog.viewCount} + 1` })
		.where(eq(blog.id, post.id));

	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60' });

	return {
		post: { ...post, content: html, videoEmbed: toEmbedUrl(post.videoLink) },
		outline,
		tags: postTags,
		gallery,
		authorSocials,
		related,
		relatedBooks,
		previous: previous[0] ?? null,
		next: next[0] ?? null
	};
};