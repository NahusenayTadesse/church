import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { asc, eq, like } from 'drizzle-orm';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

import { add } from './schema';
import { db } from '$lib/server/db';
import {
	projects,
	projectGallery,
	projectDocuments,
	projectPartners,
	ministryAreas,
	teamMembers,
	partners
} from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(add));

	const [areas, people, partnerOptions] = await Promise.all([
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db
			.select({ value: teamMembers.id, name: teamMembers.name })
			.from(teamMembers)
			.where(eq(teamMembers.isPublished, true))
			.orderBy(asc(teamMembers.name)),
		db.select({ value: partners.id, name: partners.name }).from(partners).orderBy(asc(partners.name))
	]);

	return { form, areas, people, partnerOptions };
};

/** Slug is unique, so walk until a free one turns up rather than always appending `-1`. */
const ensureUniqueSlug = async (base: string) => {
	const taken = await db
		.select({ slug: projects.slug })
		.from(projects)
		.where(like(projects.slug, `${base}%`));

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

/** Drizzle takes decimals as strings — keep the conversion in one place. */
const money = (value: number | null | undefined) => (value == null ? null : value.toFixed(2));

/** `project_documents.file_type` has no audio or video members. */
const fileTypeFor = (name: string) => {
	const ext = name.split('.').pop()?.toLowerCase() ?? '';
	if (ext === 'pdf') return 'pdf' as const;
	if (['doc', 'docx', 'odt', 'rtf', 'xls', 'xlsx'].includes(ext)) return 'doc' as const;
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) return 'image' as const;
	return 'other' as const;
};

export const actions: Actions = {
	addProject: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const {
			name,
			slug,
			ministryArea,
			shortDescription,
			fullDescription,
			status,
			startDate,
			endDate,
			location,
			goal,
			activities,
			impactResults,
			leader,
			partners: partnerIds,
			beneficiaries,
			targetBeneficiaries,
			reachedBeneficiaries,
			fundingGoal,
			fundingRaised,
			currency,
			acceptsDonations,
			acceptsVolunteers,
			acceptsPrayer,
			image,
			gallery,
			proposal,
			isFeaturedOnHome
		} = form.data;

		let projectId: number;

		try {
			// Uploads run before the transaction opens — no point holding a DB
			// connection while files stream to disk.
			const [featuredImage, galleryImages, proposalUrl] = await Promise.all([
				saveUploadedFile(image),
				uploadGallery(gallery),
				proposal ? saveUploadedFile(proposal) : Promise.resolve(null)
			]);

			const newSlug = await ensureUniqueSlug(slug);

			projectId = await db.transaction(async (tx) => {
				const [row] = await tx
					.insert(projects)
					.values({
						name,
						slug: newSlug,
						shortDescription,
						fullDescription: fullDescription || null,
						ministryAreaId: ministryArea === 0 ? null : ministryArea,
						featuredImage,

						goal: goal || null,
						activities: activities || null,
						// Results only mean something once the work has started.
						impactResults: status === 'planned' ? null : impactResults || null,

						location: location || null,
						// Requires `date(..., { mode: 'string' })` on the column — see the
						// note on the events form about naive date columns.
						startDate: startDate || null,
						endDate: endDate || null,
						status,
						leaderId: leader  === 0 ? null: leader,

						beneficiaries: beneficiaries || null,
						targetBeneficiaries: targetBeneficiaries ?? null,
						reachedBeneficiaries,

						fundingGoal: money(fundingGoal),
						fundingRaised: money(fundingRaised) ?? '0.00',
						currency,

						acceptsDonations,
						acceptsVolunteers,
						acceptsPrayer,

						isFeaturedOnHome,
						createdBy: locals?.user?.id
					})
					.$returningId();

				if (galleryImages.length > 0) {
					await tx.insert(projectGallery).values(
						galleryImages.map((url, i) => ({
							projectId: row.id,
							imageUrl: url,
							sortOrder: i
						}))
					);
				}

				// Dedupe — a double-submitted checkbox would otherwise insert twice.
				const uniquePartners = [...new Set(partnerIds ?? [])];

				if (uniquePartners.length > 0) {
					await tx.insert(projectPartners).values(
						uniquePartners.map((partnerId) => ({
							projectId: row.id,
							partnerId
						}))
					);
				}

				if (proposalUrl && proposal) {
					await tx.insert(projectDocuments).values({
						projectId: row.id,
						// Filename minus extension reads better than "Document 1".
						title: proposal.name.replace(/\.[^.]+$/, '').slice(0, 200),
						fileUrl: proposalUrl,
						fileType: fileTypeFor(proposal.name),
						fileSize: proposal.size,
						sortOrder: 0
					});
				}

				return row.id;
			});
		} catch (err) {
			console.error('Failed to add project:', err);
			return message(
				form,
				{ type: 'error', text: 'An error occurred while adding the project.' },
				{ status: 500 }
			);
		}

		// `redirect` throws, so it stays outside the try block.
		redirect(
			`/dashboard/projects/single/${projectId}`,
			{ type: 'success', message: 'New project successfully added' },
			cookies
		);
	}
};