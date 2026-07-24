import { and, asc, count, desc, eq, inArray, like, or, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	projects,
	projectPartners,
	partners,
	ministryAreas,
	teamMembers
} from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 9;

const STATUSES = ['planned', 'active', 'paused', 'completed'] as const;
const SUPPORT = ['all', 'donations', 'volunteers', 'prayer'] as const;
const SORTS = ['newest', 'name', 'funding', 'reach'] as const;

type Status = (typeof STATUSES)[number];
type Support = (typeof SUPPORT)[number];
type Sort = (typeof SORTS)[number];

export const load: PageServerLoad = async ({ url }) => {
	const p = url.searchParams;

	const q = (p.get('q') ?? '').trim().slice(0, 100);
	const area = Number(p.get('area')) || 0;

	const rawStatus = p.get('status') ?? 'all';
	const status: Status | 'all' = STATUSES.includes(rawStatus as Status)
		? (rawStatus as Status)
		: 'all';

	const rawSupport = p.get('support') ?? 'all';
	const support: Support = SUPPORT.includes(rawSupport as Support)
		? (rawSupport as Support)
		: 'all';

	const rawSort = p.get('sort') ?? 'newest';
	const sort: Sort = SORTS.includes(rawSort as Sort) ? (rawSort as Sort) : 'newest';

	const currentPage = Math.max(1, Number(p.get('page')) || 1);
	const offset = (currentPage - 1) * PAGE_SIZE;

	const hasFilters = Boolean(q || area || status !== 'all' || support !== 'all');

	/* ---------------------------------------------------------------- where */
	const base: (SQL | undefined)[] = [];

	if (q) {
		base.push(
			or(
				like(projects.name, `%${q}%`),
				like(projects.shortDescription, `%${q}%`),
				like(projects.location, `%${q}%`),
				like(projects.beneficiaries, `%${q}%`)
			)
		);
	}
	if (area) base.push(eq(projects.ministryAreaId, area));
	if (support === 'donations') base.push(eq(projects.acceptsDonations, true));
	if (support === 'volunteers') base.push(eq(projects.acceptsVolunteers, true));
	if (support === 'prayer') base.push(eq(projects.acceptsPrayer, true));

	const where = and(...base, status === 'all' ? undefined : eq(projects.status, status));

	const orderBy =
		sort === 'name'
			? asc(projects.name)
			: sort === 'funding'
				? desc(projects.fundingRaised)
				: sort === 'reach'
					? desc(projects.reachedBeneficiaries)
					: sql`${projects.startDate} is null, ${projects.startDate} desc`;

	/* ---------------------------------------------------------------- query */
	const selection = {
		id: projects.id,
		name: projects.name,
		slug: projects.slug,
		shortDescription: projects.shortDescription,
		featuredImage: projects.featuredImage,
		location: projects.location,
		startDate: projects.startDate,
		endDate: projects.endDate,
		status: projects.status,
		beneficiaries: projects.beneficiaries,
		targetBeneficiaries: projects.targetBeneficiaries,
		reachedBeneficiaries: projects.reachedBeneficiaries,
		fundingGoal: projects.fundingGoal,
		fundingRaised: projects.fundingRaised,
		currency: projects.currency,
		acceptsDonations: projects.acceptsDonations,
		acceptsVolunteers: projects.acceptsVolunteers,
		acceptsPrayer: projects.acceptsPrayer,
		ministryAreaId: projects.ministryAreaId,
		ministryAreaName: ministryAreas.name,
		leaderName: teamMembers.name,
		leaderPhoto: teamMembers.photo
	};

	const listQuery = () =>
		db
			.select(selection)
			.from(projects)
			.leftJoin(ministryAreas, eq(ministryAreas.id, projects.ministryAreaId))
			.leftJoin(teamMembers, eq(teamMembers.id, projects.leaderId));

	const [rows, [{ total }], areaOptions, statusCounts, [impact]] = await Promise.all([
		listQuery().where(where).orderBy(orderBy).limit(PAGE_SIZE).offset(offset),

		db.select({ total: count() }).from(projects).where(where),

		db
			.select({ id: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),

		db
			.select({ status: projects.status, total: count() })
			.from(projects)
			.where(and(...base))
			.groupBy(projects.status),

		/* Headline numbers across everything, not just the current page. */
		db
			.select({
				projectCount: count(),
				reached: sql<number>`coalesce(sum(${projects.reachedBeneficiaries}), 0)`,
				raised: sql<number>`coalesce(sum(${projects.fundingRaised}), 0)`,
				active: sql<number>`sum(case when ${projects.status} = 'active' then 1 else 0 end)`
			})
			.from(projects)
	]);

	/* Partner logos for the visible projects. */
	const ids = rows.map((row) => row.id);
	const partnerRows = ids.length
		? await db
				.select({
					projectId: projectPartners.projectId,
					id: partners.id,
					name: partners.name,
					logo: partners.logo
				})
				.from(projectPartners)
				.innerJoin(partners, eq(partners.id, projectPartners.partnerId))
				.where(inArray(projectPartners.projectId, ids))
		: [];

	const list = rows.map((row) => ({
		...row,
		partners: partnerRows
			.filter((partner) => partner.projectId === row.id)
			.slice(0, 4)
			.map(({ id, name, logo }) => ({ id, name, logo }))
	}));

	/* One project leads the page when nothing is filtered. */
	let featured: (typeof list)[number] | null = null;
	if (!hasFilters && currentPage === 1) {
		const [row] = await listQuery()
			.where(eq(projects.isFeaturedOnHome, true))
			.orderBy(sql`${projects.startDate} is null, ${projects.startDate} desc`)
			.limit(1);

		if (row) {
			featured = {
				...row,
				partners: partnerRows
					.filter((partner) => partner.projectId === row.id)
					.slice(0, 4)
					.map(({ id, name, logo }) => ({ id, name, logo }))
			};
		}
	}

	return {
		projects: featured ? list.filter((project) => project.id !== featured!.id) : list,
		featured,
		impact: {
			projectCount: Number(impact?.projectCount ?? 0),
			activeCount: Number(impact?.active ?? 0),
			reached: Number(impact?.reached ?? 0),
			raised: Number(impact?.raised ?? 0)
		},
		options: {
			areas: areaOptions,
			statuses: STATUSES.map((s) => ({
				value: s,
				total: statusCounts.find((c) => c.status === s)?.total ?? 0
			}))
		},
		filters: { q, status, support, area, sort, hasFilters },
		pagination: {
			page: currentPage,
			pageSize: PAGE_SIZE,
			total,
			pages: Math.max(1, Math.ceil(total / PAGE_SIZE))
		}
	};
};