import { db } from '$lib/server/db';
import { partners, projectPartners, projects } from '$lib/server/db/schema';
import { eq, asc, sql, count } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: partners.id,
			name: partners.name,
			logo: partners.logo,
			description: partners.description,
			about: partners.about,
			website: partners.website,
			partnershipType: partners.partnershipType,
			showOnHome: partners.showOnHome,
			sortOrder: partners.sortOrder,
			createdAt: partners.createdAt
		})
		.from(partners)
		// sortOrder is what the public site orders by, so show it in that order here too
		.orderBy(asc(partners.sortOrder), asc(partners.name));

	// Grouped separately — a partner on five projects would otherwise appear five times.
	const projectRows = await db
		.select({
			partnerId: projectPartners.partnerId,
			projectCount: count(projectPartners.id),
			activeProjects: sql<number>`sum(case when ${projects.status} = 'active' then 1 else 0 end)`,
			projectNames: sql<string>`group_concat(distinct ${projects.name} separator ', ')`,
			roles: sql<string>`group_concat(distinct ${projectPartners.role} separator ', ')`
		})
		.from(projectPartners)
		.leftJoin(projects, eq(projectPartners.projectId, projects.id))
		.groupBy(projectPartners.partnerId);

	const projectMap = new Map(projectRows.map((p) => [p.partnerId, p]));

	const partnerList = rows.map((p) => {
		const proj = projectMap.get(p.id);
		const projectCount = Number(proj?.projectCount ?? 0);

		return {
			...p,
			projectCount,
			activeProjects: Number(proj?.activeProjects ?? 0),
			projectNames: proj?.projectNames ?? null,
			roles: proj?.roles ?? null,

			// Filter chips
			homepage: p.showOnHome ? 'on home' : 'hidden',
			engagement: projectCount === 0 ? 'unlinked' : Number(proj?.activeProjects ?? 0) > 0 ? 'active' : 'past',
			hasLogo: p.logo ? 'has logo' : 'no logo'
		};
	});

	return { partnerList };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing partner id' });

		try {
			// projectPartners rows cascade; the projects themselves are untouched
			await db.delete(partners).where(eq(partners.id, id));
			return { success: true, message: 'Partner deleted' };
		} catch {
			return fail(500, { message: 'Could not delete partner' });
		}
	},

	toggleHome: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing partner id' });

		await db.update(partners).set({ showOnHome: !value }).where(eq(partners.id, id));
		return { success: true };
	},

	updateSortOrder: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const sortOrder = Number(form.get('sortOrder'));
		if (!id) return fail(400, { message: 'Missing partner id' });
		if (!Number.isInteger(sortOrder)) return fail(400, { message: 'Sort order must be a number' });

		await db.update(partners).set({ sortOrder }).where(eq(partners.id, id));
		return { success: true, message: 'Order updated' };
	}
};