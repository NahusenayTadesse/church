import { db } from '$lib/server/db';
import {
	projects,
	projectGallery,
	projectDocuments,
	projectPartners,
	projectUpdates,
	donations,
	ministryAreas,
	teamMembers
} from '$lib/server/db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: projects.id,
			name: projects.name,
			slug: projects.slug,
			shortDescription: projects.shortDescription,
			fullDescription: projects.fullDescription,
			ministryArea: ministryAreas.name,
			featuredImage: projects.featuredImage,

			goal: projects.goal,
			activities: projects.activities,
			impactResults: projects.impactResults,

			location: projects.location,
			startDate: projects.startDate,
			endDate: projects.endDate,
			status: projects.status,
			leader: teamMembers.name,

			beneficiaries: projects.beneficiaries,
			targetBeneficiaries: projects.targetBeneficiaries,
			reachedBeneficiaries: projects.reachedBeneficiaries,

			fundingGoal: projects.fundingGoal,
			fundingRaised: projects.fundingRaised,
			currency: projects.currency,

			acceptsDonations: projects.acceptsDonations,
			acceptsVolunteers: projects.acceptsVolunteers,
			acceptsPrayer: projects.acceptsPrayer,

			isFeaturedOnHome: projects.isFeaturedOnHome,
			createdAt: projects.createdAt
		})
		.from(projects)
		.leftJoin(ministryAreas, eq(projects.ministryAreaId, ministryAreas.id))
		.leftJoin(teamMembers, eq(projects.leaderId, teamMembers.id))
		.orderBy(desc(projects.startDate), desc(projects.id));

	// Each of these is grouped on its own — rolling them into the query above
	// would multiply rows and inflate every count.
	const galleryRows = await db
		.select({ projectId: projectGallery.projectId, photos: count(projectGallery.id) })
		.from(projectGallery)
		.groupBy(projectGallery.projectId);

	const documentRows = await db
		.select({ projectId: projectDocuments.projectId, files: count(projectDocuments.id) })
		.from(projectDocuments)
		.groupBy(projectDocuments.projectId);

	const partnerRows = await db
		.select({ projectId: projectPartners.projectId, partners: count(projectPartners.id) })
		.from(projectPartners)
		.groupBy(projectPartners.projectId);

	const updateRows = await db
		.select({
			projectId: projectUpdates.projectId,
			updates: count(projectUpdates.id),
			lastUpdateAt: sql<string>`max(${projectUpdates.publishedAt})`
		})
		.from(projectUpdates)
		.groupBy(projectUpdates.projectId);

	// Actual completed donations, so staff can spot a stale `fundingRaised`.
	const donationRows = await db
		.select({
			projectId: donations.projectId,
			donationCount: count(donations.id),
			donated: sql<string>`sum(case when ${donations.status} = 'completed' then ${donations.amount} else 0 end)`
		})
		.from(donations)
		.groupBy(donations.projectId);

	const galleryMap = new Map(galleryRows.map((r) => [r.projectId, r.photos]));
	const documentMap = new Map(documentRows.map((r) => [r.projectId, r.files]));
	const partnerMap = new Map(partnerRows.map((r) => [r.projectId, r.partners]));
	const updateMap = new Map(updateRows.map((r) => [r.projectId, r]));
	const donationMap = new Map(donationRows.map((r) => [r.projectId, r]));

	const now = new Date();

	const projectList = rows.map((p) => {
		const u = updateMap.get(p.id);
		const d = donationMap.get(p.id);

		const goalAmount = Number(p.fundingGoal ?? 0);
		const raised = Number(p.fundingRaised ?? 0);
		const donated = Number(d?.donated ?? 0);

		const start = p.startDate ? new Date(p.startDate) : null;
		const end = p.endDate ? new Date(p.endDate) : null;

		const target = p.targetBeneficiaries ?? 0;
		const reached = p.reachedBeneficiaries ?? 0;

		const ways = [
			p.acceptsDonations && 'donations',
			p.acceptsVolunteers && 'volunteers',
			p.acceptsPrayer && 'prayer'
		].filter(Boolean) as string[];

		return {
			...p,
			photoCount: galleryMap.get(p.id) ?? 0,
			fileCount: documentMap.get(p.id) ?? 0,
			partnerCount: partnerMap.get(p.id) ?? 0,
			updateCount: u?.updates ?? 0,
			lastUpdateAt: u?.lastUpdateAt ?? null,

			donationCount: Number(d?.donationCount ?? 0),
			donatedTotal: donated,
			// flags a project whose fundingRaised hasn't been reconciled with donations
			fundingMismatch: goalAmount > 0 && Math.abs(donated - raised) >= 1,

			fundingPercent: goalAmount > 0 ? Math.round((raised / goalAmount) * 100) : null,
			beneficiaryPercent: target > 0 ? Math.round((reached / target) * 100) : null,

			ways,
			waysLabel: ways.length ? ways.join(', ') : 'none',

			// Filter chips
			timing: !start
				? 'unscheduled'
				: end && end < now
					? 'ended'
					: start > now
						? 'not started'
						: 'running',
			funding:
				goalAmount === 0
					? 'no goal'
					: raised >= goalAmount
						? 'funded'
						: raised > 0
							? 'partly funded'
							: 'unfunded',
			support: p.acceptsDonations ? 'accepts donations' : 'not fundraising'
		};
	});

	return { projectList };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing project id' });

		try {
			// gallery, documents, partner links and updates cascade;
			// donations and testimonials point at the project without a cascade,
			// so this will fail while any of those still reference it.
			await db.delete(projects).where(eq(projects.id, id));
			return { success: true, message: 'Project deleted' };
		} catch {
			return fail(500, {
				message: 'Could not delete project — it may still have donations or stories attached'
			});
		}
	},

	toggleFeatured: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing project id' });

		await db.update(projects).set({ isFeaturedOnHome: !value }).where(eq(projects.id, id));
		return { success: true };
	},

	setStatus: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const status = String(form.get('status'));
		const allowed = ['planned', 'active', 'paused', 'completed'] as const;

		if (!id) return fail(400, { message: 'Missing project id' });
		if (!allowed.includes(status as (typeof allowed)[number])) {
			return fail(400, { message: 'Invalid status' });
		}

		await db
			.update(projects)
			.set({ status: status as (typeof allowed)[number] })
			.where(eq(projects.id, id));
		return { success: true, message: `Project marked ${status}` };
	},

	/** Recalculate fundingRaised from completed donations. */
	syncFunding: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing project id' });

		const [row] = await db
			.select({
				total: sql<string>`sum(case when ${donations.status} = 'completed' then ${donations.amount} else 0 end)`
			})
			.from(donations)
			.where(eq(donations.projectId, id));

		await db
			.update(projects)
			.set({ fundingRaised: String(Number(row?.total ?? 0).toFixed(2)) })
			.where(eq(projects.id, id));

		return { success: true, message: 'Funding total recalculated' };
	}
};