import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, ne } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { db } from '$lib/server/db';
import {
	projects,
	projectGallery,
	projectDocuments,
	projectPartners,
	projectUpdates,
	partners,
	ministryAreas,
	teamMembers,
	donationCauses,
	testimonials,
	contactMessages
} from '$lib/server/db/schema';
import { supportSchema } from './schema';
import type { PageServerLoad, Actions } from './$types';

/* -------------------------------------------------------------------------- */
/* load                                                                        */
/* -------------------------------------------------------------------------- */

export const load: PageServerLoad = async ({ params }) => {
	const [project] = await db
		.select({
			id: projects.id,
			name: projects.name,
			slug: projects.slug,
			shortDescription: projects.shortDescription,
			fullDescription: projects.fullDescription,
			featuredImage: projects.featuredImage,
			goal: projects.goal,
			activities: projects.activities,
			impactResults: projects.impactResults,
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
			leaderPosition: teamMembers.position,
			leaderPhoto: teamMembers.photo,
			leaderEmail: teamMembers.email
		})
		.from(projects)
		.leftJoin(ministryAreas, eq(ministryAreas.id, projects.ministryAreaId))
		.leftJoin(teamMembers, eq(teamMembers.id, projects.leaderId))
		.where(eq(projects.slug, params.slug))
		.limit(1);

	if (!project) error(404, 'That project does not exist.');

	const [gallery, documents, projectPartnerRows, updates, cause, stories, otherProjects] =
		await Promise.all([
			db
				.select({
					id: projectGallery.id,
					imageUrl: projectGallery.imageUrl,
					caption: projectGallery.caption
				})
				.from(projectGallery)
				.where(eq(projectGallery.projectId, project.id))
				.orderBy(asc(projectGallery.sortOrder)),

			db
				.select({
					id: projectDocuments.id,
					title: projectDocuments.title,
					fileUrl: projectDocuments.fileUrl,
					fileType: projectDocuments.fileType,
					fileSize: projectDocuments.fileSize
				})
				.from(projectDocuments)
				.where(eq(projectDocuments.projectId, project.id))
				.orderBy(asc(projectDocuments.sortOrder)),

			db
				.select({
					id: partners.id,
					name: partners.name,
					logo: partners.logo,
					website: partners.website,
					partnershipType: partners.partnershipType,
					role: projectPartners.role
				})
				.from(projectPartners)
				.innerJoin(partners, eq(partners.id, projectPartners.partnerId))
				.where(eq(projectPartners.projectId, project.id)),

			db
				.select({
					id: projectUpdates.id,
					title: projectUpdates.title,
					content: projectUpdates.content,
					image: projectUpdates.image,
					publishedAt: projectUpdates.publishedAt
				})
				.from(projectUpdates)
				.where(eq(projectUpdates.projectId, project.id))
				.orderBy(desc(projectUpdates.publishedAt)),

			db
				.select({
					id: donationCauses.id,
					name: donationCauses.name,
					slug: donationCauses.slug,
					goalAmount: donationCauses.goalAmount,
					raisedAmount: donationCauses.raisedAmount,
					currency: donationCauses.currency
				})
				.from(donationCauses)
				.where(eq(donationCauses.projectId, project.id))
				.limit(1),

			/* Stories are only ever shown when permission was given. */
			db
				.select({
					id: testimonials.id,
					name: testimonials.name,
					position: testimonials.position,
					title: testimonials.title,
					message: testimonials.message,
					avatar: testimonials.avatar,
					storyDate: testimonials.storyDate
				})
				.from(testimonials)
				.where(
					and(
						eq(testimonials.projectId, project.id),
						eq(testimonials.isPublished, true),
						eq(testimonials.permissionGiven, true)
					)
				)
				.limit(3),

			db
				.select({
					id: projects.id,
					name: projects.name,
					slug: projects.slug,
					shortDescription: projects.shortDescription,
					featuredImage: projects.featuredImage,
					status: projects.status,
					fundingGoal: projects.fundingGoal,
					fundingRaised: projects.fundingRaised,
					currency: projects.currency
				})
				.from(projects)
				.where(
					and(
						ne(projects.id, project.id),
						project.ministryAreaId
							? eq(projects.ministryAreaId, project.ministryAreaId)
							: undefined
					)
				)
				.orderBy(desc(projects.startDate))
				.limit(3)
		]);

	const form = await superValidate(zod4(supportSchema), {
		defaults: {
			purpose: project.acceptsVolunteers ? 'volunteer' : 'question',
			name: '',
			email: '',
			phone: '',
			message: ''
		}
	});

	return {
		project,
		gallery,
		documents,
		partners: projectPartnerRows,
		updates,
		cause: cause[0] ?? null,
		stories,
		otherProjects,
		form
	};
};

/* -------------------------------------------------------------------------- */
/* actions                                                                     */
/* -------------------------------------------------------------------------- */

const PURPOSE_SUBJECTS: Record<string, string> = {
	volunteer: 'Volunteer',
	pray: 'Prayer',
	partner: 'Partnership',
	question: 'Question'
};

export const actions: Actions = {
	/**
	 * There is no volunteers table, so interest lands in `contactMessages` with a
	 * subject staff can filter on. Give it its own table when the volume justifies it.
	 */
	support: async ({ request, params }) => {
		const form = await superValidate(request, zod4(supportSchema));

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for errors' });
		}

		const [project] = await db
			.select({ id: projects.id, name: projects.name })
			.from(projects)
			.where(eq(projects.slug, params.slug))
			.limit(1);

		if (!project) {
			return message(form, { type: 'error', text: 'This project is no longer available' });
		}

		const { purpose, name, email, phone, message: body } = form.data;

		try {
			await db.insert(contactMessages).values({
				name,
				email,
				phone: phone || null,
				subject: `${PURPOSE_SUBJECTS[purpose] ?? 'Project'} — ${project.name}`,
				message: body
			});

			// const adminMail = adminProjectSupportTemplate(project.name, form.data);
			// sendEmail(SMTP_USER, adminMail.subject, adminMail.html);

			return message(form, {
				type: 'success',
				text: 'Thank you — someone from the team will be in touch'
			});
		} catch (err) {
			return message(form, {
				type: 'error',
				text: 'We could not send your message: ' + (err as Error)?.message
			});
		}
	}
};