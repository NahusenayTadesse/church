import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setFlash } from 'sveltekit-flash-message/server';
import { eq, and, sql } from 'drizzle-orm';

import {
	edit,
	setFunding,
	editGallery,
	addDocument,
	linkPartner,
	updatePartnerRole,
	addUpdate,
	editUpdate,
	rowId
} from './schema';

import { db } from '$lib/server/db';
import {
	projects,
	projectGallery,
	projectDocuments,
	projectPartners,
	projectUpdates,
	donations
} from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload';

import type { Actions } from './$types';

const money = (v: number | null | undefined) => (v === null || v === undefined ? null : String(v));

export const actions: Actions = {
	editProject: async ({ request, cookies, locals, params }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(edit));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return fail(400, { form });
		}

		const { image, fundingGoal, ...values } = form.data;

		try {
			await db
				.update(projects)
				.set({
					...values,
					fundingGoal: money(fundingGoal),
					updatedBy: locals?.user?.id,
					...(image ? { featuredImage: await saveUploadedFile(image) } : {})
				})
				.where(eq(projects.id, id));

			return message(form, { type: 'success', text: 'Project updated' });
		} catch (err) {
			console.error('Error updating project:', err);

			if (err?.code === 'ER_DUP_ENTRY') {
				return message(form, {
					type: 'error',
					text: 'That slug is already taken — pick another one.'
				});
			}

			return message(form, { type: 'error', text: `Project update failed: ${err?.message}` });
		}
	},

	delete: async ({ cookies, params }) => {
		const id = Number(params.id);

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Project id missing from the URL.' }, cookies);
			return fail(400);
		}

		try {
			/* Gallery, documents, partners and updates cascade. Testimonials,
			   galleries, donation causes and donations hold nullable references
			   and will be left pointing at nothing — clear them first if that
			   matters to your reporting. */
			await db.delete(projects).where(eq(projects.id, id));

			setFlash({ type: 'success', message: 'Project deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting project:', err);
			setFlash({ type: 'error', message: `Delete failed: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── funding ─────────────────────────────────────────────────────────── */

	setFunding: async ({ request, params, cookies, locals }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(setFunding));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Enter a number for the amount raised.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.update(projects)
				.set({ fundingRaised: String(form.data.fundingRaised), updatedBy: locals?.user?.id })
				.where(eq(projects.id, id));

			setFlash({ type: 'success', message: 'Amount raised updated' }, cookies);
		} catch (err) {
			console.error('Error setting funding:', err);
			setFlash({ type: 'error', message: `Could not update: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/**
	 * Recomputes fundingRaised from completed donations in the project's own
	 * currency. Donations recorded in another currency are ignored on purpose —
	 * converting them needs a rate this app doesn't store.
	 */
	recalculateFunding: async ({ params, cookies, locals }) => {
		const id = Number(params.id);

		try {
			const project = await db
				.select({ currency: projects.currency })
				.from(projects)
				.where(eq(projects.id, id))
				.limit(1)
				.then((rows) => rows[0]);

			if (!project) {
				setFlash({ type: 'error', message: 'Project not found.' }, cookies);
				return fail(404);
			}

			const currency = project.currency ?? 'ETB';

			const total = await db
				.select({ total: sql<string>`coalesce(sum(${donations.amount}), 0)` })
				.from(donations)
				.where(
					and(
						eq(donations.projectId, id),
						eq(donations.status, 'completed'),
						eq(donations.currency, currency)
					)
				)
				.then((rows) => rows[0]?.total ?? '0');

			await db
				.update(projects)
				.set({ fundingRaised: total, updatedBy: locals?.user?.id })
				.where(eq(projects.id, id));

			setFlash(
				{ type: 'success', message: `Amount raised set to ${total} ${currency} from donations` },
				cookies
			);
		} catch (err) {
			console.error('Error recalculating funding:', err);
			setFlash({ type: 'error', message: `Could not recalculate: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── gallery ─────────────────────────────────────────────────────────── */

	editGallery: async ({ params, request }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(editGallery));

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check your form data.' }, { status: 400 });
		}

		const { existing, gallery } = form.data;

		try {
			const uploaded = gallery?.length
				? await Promise.all(gallery.map((file) => saveUploadedFile(file)))
				: [];

			const finalList = [...new Set([...existing, ...uploaded])]
				.map((url) => url?.trim())
				.filter((url): url is string => !!url);

			/* Captions are keyed to the URL so re-saving doesn't wipe them. */
			const captions = await db
				.select({ imageUrl: projectGallery.imageUrl, caption: projectGallery.caption })
				.from(projectGallery)
				.where(eq(projectGallery.projectId, id))
				.then((rows) => new Map(rows.map((r) => [r.imageUrl, r.caption])));

			await db.transaction(async (tx) => {
				await tx.delete(projectGallery).where(eq(projectGallery.projectId, id));

				if (finalList.length > 0) {
					await tx.insert(projectGallery).values(
						finalList.map((imageUrl, sortOrder) => ({
							projectId: id,
							imageUrl,
							caption: captions.get(imageUrl) ?? null,
							sortOrder
						}))
					);
				}
			});

			return message(form, { type: 'success', text: 'Gallery saved' });
		} catch (err) {
			console.error('Error saving project gallery:', err);
			return message(
				form,
				{ type: 'error', text: `Gallery save failed: ${err?.message}` },
				{ status: 500 }
			);
		}
	},

	/* ── documents ───────────────────────────────────────────────────────── */

	addDocument: async ({ request, params, cookies }) => {
		const projectId = Number(params.id);
		const form = await superValidate(request, zod4(addDocument));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the file details.' }, cookies);
			return fail(400, { form });
		}

		const { file, ...values } = form.data;

		try {
			await db.insert(projectDocuments).values({
				projectId,
				...values,
				fileUrl: await saveUploadedFile(file),
				fileSize: file.size /* bytes, matches the int column */
			});

			setFlash({ type: 'success', message: 'Document added' }, cookies);
		} catch (err) {
			console.error('Error adding document:', err);
			setFlash({ type: 'error', message: `Could not add document: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	deleteDocument: async ({ request, params, cookies }) => {
		const projectId = Number(params.id);
		const form = await superValidate(request, zod4(rowId));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Document id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(projectDocuments)
				.where(
					and(eq(projectDocuments.id, form.data.id), eq(projectDocuments.projectId, projectId))
				);

			setFlash({ type: 'success', message: 'Document removed' }, cookies);
		} catch (err) {
			console.error('Error deleting document:', err);
			setFlash({ type: 'error', message: `Could not remove document: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── partners ────────────────────────────────────────────────────────── */

	linkPartner: async ({ request, params, cookies }) => {
		const projectId = Number(params.id);
		const form = await superValidate(request, zod4(linkPartner));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Pick a partner first.' }, cookies);
			return fail(400, { form });
		}

		const { partnerId, role } = form.data;

		try {
			const exists = await db
				.select({ id: projectPartners.id })
				.from(projectPartners)
				.where(
					and(eq(projectPartners.projectId, projectId), eq(projectPartners.partnerId, partnerId))
				)
				.limit(1)
				.then((rows) => rows[0]);

			if (exists) {
				setFlash({ type: 'error', message: 'That partner is already on this project.' }, cookies);
				return fail(400, { form });
			}

			await db.insert(projectPartners).values({ projectId, partnerId, role });

			setFlash({ type: 'success', message: 'Partner linked' }, cookies);
		} catch (err) {
			console.error('Error linking partner:', err);
			setFlash({ type: 'error', message: `Could not link partner: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	updatePartnerRole: async ({ request, params, cookies }) => {
		const projectId = Number(params.id);
		const form = await superValidate(request, zod4(updatePartnerRole));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the role.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.update(projectPartners)
				.set({ role: form.data.role })
				.where(
					and(eq(projectPartners.id, form.data.id), eq(projectPartners.projectId, projectId))
				);

			setFlash({ type: 'success', message: 'Role updated' }, cookies);
		} catch (err) {
			console.error('Error updating partner role:', err);
			setFlash({ type: 'error', message: `Could not update role: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	unlinkPartner: async ({ request, params, cookies }) => {
		const projectId = Number(params.id);
		const form = await superValidate(request, zod4(rowId));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Link id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(projectPartners)
				.where(
					and(eq(projectPartners.id, form.data.id), eq(projectPartners.projectId, projectId))
				);

			setFlash({ type: 'success', message: 'Partner unlinked' }, cookies);
		} catch (err) {
			console.error('Error unlinking partner:', err);
			setFlash({ type: 'error', message: `Could not unlink partner: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── updates ─────────────────────────────────────────────────────────── */

	addUpdate: async ({ request, params, cookies, locals }) => {
		const projectId = Number(params.id);
		const form = await superValidate(request, zod4(addUpdate));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the update.' }, cookies);
			return fail(400, { form });
		}

		const { image, publishedAt, ...values } = form.data;

		try {
			await db.insert(projectUpdates).values({
				projectId,
				...values,
				/* An update with no date is published today. */
				publishedAt: publishedAt ?? new Date(),
				image: image ? await saveUploadedFile(image) : null,
				createdBy: locals?.user?.id
			});

			setFlash({ type: 'success', message: 'Update posted' }, cookies);
		} catch (err) {
			console.error('Error adding update:', err);
			setFlash({ type: 'error', message: `Could not post update: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	editUpdate: async ({ request, params, cookies, locals }) => {
		const projectId = Number(params.id);
		const form = await superValidate(request, zod4(editUpdate));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the update.' }, cookies);
			return fail(400, { form });
		}

		const { id, image, ...values } = form.data;

		try {
			await db
				.update(projectUpdates)
				.set({
					...values,
					updatedBy: locals?.user?.id,
					...(image ? { image: await saveUploadedFile(image) } : {})
				})
				.where(and(eq(projectUpdates.id, id), eq(projectUpdates.projectId, projectId)));

			setFlash({ type: 'success', message: 'Update saved' }, cookies);
		} catch (err) {
			console.error('Error editing update:', err);
			setFlash({ type: 'error', message: `Could not save update: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	deleteUpdate: async ({ request, params, cookies }) => {
		const projectId = Number(params.id);
		const form = await superValidate(request, zod4(rowId));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Update id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(projectUpdates)
				.where(and(eq(projectUpdates.id, form.data.id), eq(projectUpdates.projectId, projectId)));

			setFlash({ type: 'success', message: 'Update deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting update:', err);
			setFlash({ type: 'error', message: `Could not delete update: ${err?.message}` }, cookies);
			return fail(400);
		}
	}
};