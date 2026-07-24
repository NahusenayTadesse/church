import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';

import { edit, editGallery, addDocument, linkPartner, addUpdate } from './schema';

import { db } from '$lib/server/db';
import {
	projects,
	projectGallery,
	projectDocuments,
	projectPartners,
	projectUpdates,
	partners,
	donations,
	donationCauses,
	testimonials,
	galleries,
	ministryAreas,
	teamMembers,
	user
} from '$lib/server/db/schema';
import { eq, and, asc, desc, sql, notInArray, count, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import type { LayoutServerLoad } from './$types';

const leader = alias(teamMembers, 'leader');
const creator = alias(user, 'creator');
const editor = alias(user, 'editor');

export const load: LayoutServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!Number.isInteger(id)) error(400, 'Invalid project id');

	const project = await db
		.select({
			...getTableColumns(projects),
			ministryAreaName: ministryAreas.name,
			leaderName: leader.name,
			createdByName: creator.name,
			updatedByName: editor.name
		})
		.from(projects)
		.leftJoin(ministryAreas, eq(projects.ministryAreaId, ministryAreas.id))
		.leftJoin(leader, eq(projects.leaderId, leader.id))
		.leftJoin(creator, eq(projects.createdBy, creator.id))
		.leftJoin(editor, eq(projects.updatedBy, editor.id))
		.where(eq(projects.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!project) error(404, 'Project not found');

	const images = await db
		.select({ url: projectGallery.imageUrl })
		.from(projectGallery)
		.where(eq(projectGallery.projectId, id))
		.orderBy(asc(projectGallery.sortOrder), asc(projectGallery.id))
		.then((rows) => rows.map((r) => r.url).filter((u): u is string => !!u));

	const documents = await db
		.select()
		.from(projectDocuments)
		.where(eq(projectDocuments.projectId, id))
		.orderBy(asc(projectDocuments.sortOrder), asc(projectDocuments.id));

	const linkedPartners = await db
		.select({
			linkId: projectPartners.id,
			role: projectPartners.role,
			id: partners.id,
			name: partners.name,
			logo: partners.logo,
			partnershipType: partners.partnershipType
		})
		.from(projectPartners)
		.innerJoin(partners, eq(projectPartners.partnerId, partners.id))
		.where(eq(projectPartners.projectId, id))
		.orderBy(asc(partners.name));

	const linkedPartnerIds = linkedPartners.map((p) => p.id);

	const partnerOptions = await db
		.select({ value: partners.id, name: partners.name })
		.from(partners)
		.where(linkedPartnerIds.length ? notInArray(partners.id, linkedPartnerIds) : undefined)
		.orderBy(asc(partners.name))
		.limit(200);

	const updates = await db
		.select({
			...getTableColumns(projectUpdates),
			createdByName: creator.name
		})
		.from(projectUpdates)
		.leftJoin(creator, eq(projectUpdates.createdBy, creator.id))
		.where(eq(projectUpdates.projectId, id))
		.orderBy(desc(projectUpdates.publishedAt), desc(projectUpdates.id));

	/**
	 * `fundingRaised` on the project is a stored total, while `donations` is the
	 * source of truth. Pull both so the page can show a mismatch instead of
	 * quietly disagreeing with itself.
	 */
	const donationTotals = await db
		.select({
			currency: donations.currency,
			status: donations.status,
			total: sql<string>`coalesce(sum(${donations.amount}), 0)`,
			count: count()
		})
		.from(donations)
		.where(eq(donations.projectId, id))
		.groupBy(donations.currency, donations.status);

	const projectCurrency = project.currency ?? 'ETB';

	const completedInCurrency = donationTotals
		.filter((r) => r.status === 'completed' && r.currency === projectCurrency)
		.reduce((sum, r) => sum + Number(r.total), 0);

	/* Donations in another currency can't be added up here — flag them instead. */
	const otherCurrencies = donationTotals
		.filter((r) => r.status === 'completed' && r.currency !== projectCurrency)
		.map((r) => ({ currency: r.currency, total: Number(r.total), count: r.count }));

	const pendingDonations = donationTotals
		.filter((r) => r.status === 'pending')
		.reduce((sum, r) => sum + r.count, 0);

	const causes = await db
		.select({
			id: donationCauses.id,
			name: donationCauses.name,
			goalAmount: donationCauses.goalAmount,
			raisedAmount: donationCauses.raisedAmount,
			currency: donationCauses.currency
		})
		.from(donationCauses)
		.where(eq(donationCauses.projectId, id))
		.orderBy(asc(donationCauses.sortOrder), asc(donationCauses.name));

	/* Read-only counts so nobody deletes a project without knowing what hangs off it. */
	const [storyCount, galleryCount] = await Promise.all([
		db
			.select({ n: count() })
			.from(testimonials)
			.where(eq(testimonials.projectId, id))
			.then((r) => r[0]?.n ?? 0),
		db
			.select({ n: count() })
			.from(galleries)
			.where(eq(galleries.projectId, id))
			.then((r) => r[0]?.n ?? 0)
	]);

	const [areas, people] = await Promise.all([
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db
			.select({ value: teamMembers.id, name: teamMembers.name })
			.from(teamMembers)
			.where(eq(teamMembers.isPublished, true))
			.orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name))
	]);

	const [form, galleryEdit, documentForm, partnerForm, updateForm] = await Promise.all([
		superValidate(project, zod4(edit)),
		superValidate({ existing: images }, zod4(editGallery)),
		superValidate(zod4(addDocument)),
		superValidate(zod4(linkPartner)),
		superValidate(zod4(addUpdate))
	]);

	return {
		project,
		images,
		documents,
		linkedPartners,
		partnerOptions,
		updates,
		causes,
		funding: {
			recorded: Number(project.fundingRaised ?? 0),
			fromDonations: completedInCurrency,
			currency: projectCurrency,
			otherCurrencies,
			pendingDonations
		},
		storyCount,
		galleryCount,
		areas,
		people,
		form,
		galleryEdit,
		documentForm,
		partnerForm,
		updateForm
	};
};