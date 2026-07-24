import { and, asc, count, desc, eq, inArray, like, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '$lib/server/db';
import {
	blog,
	blogCategories,
	ministryAreas,
	teamMembers,
	tags,
	resourceTags
} from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 9;

const RESOURCE_TYPES = ['article', 'sermon', 'teaching', 'video', 'audio', 'bible_study'] as const;
const SORTS = ['newest', 'oldest', 'popular', 'title'] as const;

type ResourceType = (typeof RESOURCE_TYPES)[number];
type Sort = (typeof SORTS)[number];

export const load: PageServerLoad = async ({ url }) => {
	const p = url.searchParams;

	const q = (p.get('q') ?? '').trim().slice(0, 100);
	const category = Number(p.get('category')) || 0;
	const area = Number(p.get('area')) || 0;
	const tag = Number(p.get('tag')) || 0;

	const rawType = p.get('type') ?? 'all';
	const type: ResourceType | 'all' = RESOURCE_TYPES.includes(rawType as ResourceType)
		? (rawType as ResourceType)
		: 'all';

	const rawSort = p.get('sort') ?? 'newest';
	const sort: Sort = SORTS.includes(rawSort as Sort) ? (rawSort as Sort) : 'newest';

	const currentPage = Math.max(1, Number(p.get('page')) || 1);
	const offset = (currentPage - 1) * PAGE_SIZE;

	const hasFilters = Boolean(q || category || area || tag || type !== 'all');

	/* ---------------------------------------------------------------- where */
	const conditions: (SQL | undefined)[] = [eq(blog.status, 'published')];

	if (q) {
		conditions.push(
			or(
				like(blog.title, `%${q}%`),
				like(blog.excerpt, `%${q}%`),
				like(blog.bibleReferences, `%${q}%`)
			)
		);
	}
	if (category) conditions.push(eq(blog.categoryId, category));
	if (area) conditions.push(eq(blog.ministryAreaId, area));
	if (type !== 'all') conditions.push(eq(blog.resourceType, type));
	if (tag) {
		conditions.push(
			inArray(
				blog.id,
				db
					.select({ id: resourceTags.resourceId })
					.from(resourceTags)
					.where(eq(resourceTags.tagId, tag))
			)
		);
	}

	const where = and(...conditions);

	const orderBy =
		sort === 'oldest'
			? asc(blog.publishedAt)
			: sort === 'popular'
				? desc(blog.viewCount)
				: sort === 'title'
					? asc(blog.title)
					: desc(blog.publishedAt);

	/* ---------------------------------------------------------------- query */
	const author = alias(teamMembers, 'author');
	const speaker = alias(teamMembers, 'speaker');

	const listSelection = {
		id: blog.id,
		title: blog.title,
		slug: blog.slug,
		excerpt: blog.excerpt,
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
		authorName: author.name,
		authorPhoto: author.photo,
		speakerName: speaker.name,
		readMinutes: sql<number>`greatest(1, round(char_length(coalesce(${blog.content}, '')) / 1100))`
	};

	const [posts, [{ total }], categoryOptions, areaOptions, tagOptions, typeCounts] =
		await Promise.all([
			db
				.select(listSelection)
				.from(blog)
				.leftJoin(blogCategories, eq(blogCategories.id, blog.categoryId))
				.leftJoin(ministryAreas, eq(ministryAreas.id, blog.ministryAreaId))
				.leftJoin(author, eq(author.id, blog.authorId))
				.leftJoin(speaker, eq(speaker.id, blog.speakerId))
				.where(where)
				.orderBy(orderBy)
				.limit(PAGE_SIZE)
				.offset(offset),

			db.select({ total: count() }).from(blog).where(where),

			db
				.select({ id: blogCategories.id, name: blogCategories.name })
				.from(blogCategories)
				.orderBy(asc(blogCategories.name)),

			db
				.select({ id: ministryAreas.id, name: ministryAreas.name })
				.from(ministryAreas)
				.orderBy(asc(ministryAreas.name)),

			db
				.selectDistinct({ id: tags.id, name: tags.name })
				.from(tags)
				.innerJoin(resourceTags, eq(resourceTags.tagId, tags.id))
				.orderBy(asc(tags.name)),

			db
				.select({ type: blog.resourceType, total: count() })
				.from(blog)
				.where(eq(blog.status, 'published'))
				.groupBy(blog.resourceType)
		]);

	/* ------------------------------------------------- tags for these posts */
	const ids = posts.map((post) => post.id);
	const postTags = ids.length
		? await db
				.select({ resourceId: resourceTags.resourceId, id: tags.id, name: tags.name })
				.from(resourceTags)
				.innerJoin(tags, eq(tags.id, resourceTags.tagId))
				.where(inArray(resourceTags.resourceId, ids))
		: [];

	const resources = posts.map((post) => ({
		...post,
		tags: postTags.filter((t) => t.resourceId === post.id).map(({ id, name }) => ({ id, name }))
	}));

	/* ------------------------------------- one featured item on a clean page */
	let featured: (typeof resources)[number] | null = null;
	if (!hasFilters && currentPage === 1) {
		const [row] = await db
			.select(listSelection)
			.from(blog)
			.leftJoin(blogCategories, eq(blogCategories.id, blog.categoryId))
			.leftJoin(ministryAreas, eq(ministryAreas.id, blog.ministryAreaId))
			.leftJoin(author, eq(author.id, blog.authorId))
			.leftJoin(speaker, eq(speaker.id, blog.speakerId))
			.where(and(eq(blog.status, 'published'), eq(blog.isFeaturedOnHome, true)))
			.orderBy(desc(blog.publishedAt))
			.limit(1);

		if (row) featured = { ...row, tags: [] };
	}

	return {
		resources: featured ? resources.filter((r) => r.id !== featured!.id) : resources,
		featured,
		options: {
			categories: categoryOptions,
			areas: areaOptions,
			tags: tagOptions,
			types: RESOURCE_TYPES.map((t) => ({
				value: t,
				total: typeCounts.find((c) => c.type === t)?.total ?? 0
			}))
		},
		filters: { q, category, area, tag, type, sort, hasFilters },
		pagination: {
			page: currentPage,
			pageSize: PAGE_SIZE,
			total,
			pages: Math.max(1, Math.ceil(total / PAGE_SIZE))
		}
	};
};