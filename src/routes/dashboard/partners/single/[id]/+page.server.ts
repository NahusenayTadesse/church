import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setFlash } from 'sveltekit-flash-message/server';
import { eq, and } from 'drizzle-orm';

import { edit, linkProject, updateProjectRole, linkId } from './schema';

import { db } from '$lib/server/db';
import { partners, projectPartners } from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload';

import type { Actions } from './$types';

export const actions: Actions = {
	editPartner: async ({ request, cookies, locals, params }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(edit));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return fail(400, { form });
		}

		const { logoUrl, ...values } = form.data;
        const [oldLogo] = await db.select({ logo: partners.logo }).from(partners).where(eq(partners.id, id)).limit(1);
        const logo = logoUrl ? await saveUploadedFile(logoUrl) : oldLogo.logo

		try {
			await db
				.update(partners)
				.set({
					...values,
                    logo,
					updatedBy: locals?.user?.id,
					
				})
				.where(eq(partners.id, id));

			return message(form, { type: 'success', text: 'Partner updated' });
		} catch (err) {
			console.error('Error updating partner:', err);

			/* partners.name is unique. */
			if (err?.code === 'ER_DUP_ENTRY') {
				return message(form, {
					type: 'error',
					text: 'Another partner already uses that name.'
				});
			}

			return message(form, { type: 'error', text: `Partner update failed: ${err?.message}` });
		}
	},

	delete: async ({ cookies, params }) => {
		const id = Number(params.id);

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Partner id missing from the URL.' }, cookies);
			return fail(400);
		}

		try {
			/* project_partners cascades — the projects themselves are untouched. */
			await db.delete(partners).where(eq(partners.id, id));

			setFlash({ type: 'success', message: 'Partner deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting partner:', err);
			setFlash({ type: 'error', message: `Delete failed: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── projects ────────────────────────────────────────────────────────── */

	linkProject: async ({ request, params, cookies }) => {
		const partnerId = Number(params.id);
		const form = await superValidate(request, zod4(linkProject));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Pick a project first.' }, cookies);
			return fail(400, { form });
		}

		const { projectId, role } = form.data;

		try {
			const exists = await db
				.select({ id: projectPartners.id })
				.from(projectPartners)
				.where(
					and(eq(projectPartners.partnerId, partnerId), eq(projectPartners.projectId, projectId))
				)
				.limit(1)
				.then((rows) => rows[0]);

			if (exists) {
				setFlash({ type: 'error', message: 'This partner is already on that project.' }, cookies);
				return fail(400, { form });
			}

			await db.insert(projectPartners).values({ partnerId, projectId, role });

			setFlash({ type: 'success', message: 'Project linked' }, cookies);
		} catch (err) {
			console.error('Error linking project:', err);
			setFlash({ type: 'error', message: `Could not link project: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	updateProjectRole: async ({ request, params, cookies }) => {
		const partnerId = Number(params.id);
		const form = await superValidate(request, zod4(updateProjectRole));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the role.' }, cookies);
			return fail(400);
		}

		const { id, role } = form.data;

		try {
			await db
				.update(projectPartners)
				.set({ role })
				.where(and(eq(projectPartners.id, id), eq(projectPartners.partnerId, partnerId)));

			setFlash({ type: 'success', message: 'Role updated' }, cookies);
		} catch (err) {
			console.error('Error updating partner role:', err);
			setFlash({ type: 'error', message: `Could not update role: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	unlinkProject: async ({ request, params, cookies }) => {
		const partnerId = Number(params.id);
		const form = await superValidate(request, zod4(linkId));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Link id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(projectPartners)
				.where(and(eq(projectPartners.id, form.data.id), eq(projectPartners.partnerId, partnerId)));

			setFlash({ type: 'success', message: 'Project unlinked' }, cookies);
		} catch (err) {
			console.error('Error unlinking project:', err);
			setFlash({ type: 'error', message: `Could not unlink project: ${err?.message}` }, cookies);
			return fail(400);
		}
	}
};