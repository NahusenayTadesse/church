import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setFlash } from 'sveltekit-flash-message/server';
import { eq, and, count } from 'drizzle-orm';

import { edit, setAreas, addSocial, editSocial, rowId } from './schema';

import { db } from '$lib/server/db';
import {
	teamMembers,
	teamMemberAreas,
	teamMemberSocials,
	blog,
	books,
	events,
	eventSpeakers,
	projects,
	prayerRequests
} from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload';

import type { Actions } from './$types';

/**
 * Everything that points at team_members without an onDelete rule. MySQL
 * restricts by default, so a delete with any of these present throws
 * ER_ROW_IS_REFERENCED_2 — better to check first and explain.
 */
const countReferences = async (id: number) => {
	const one = async (query: Promise<{ n: number }[]>) => (await query)[0]?.n ?? 0;

	const [authored, spoken, organized, speakingAt, led, wrote, prayer] = await Promise.all([
		one(db.select({ n: count() }).from(blog).where(eq(blog.authorId, id))),
		one(db.select({ n: count() }).from(blog).where(eq(blog.speakerId, id))),
		one(db.select({ n: count() }).from(events).where(eq(events.organizerId, id))),
		one(db.select({ n: count() }).from(eventSpeakers).where(eq(eventSpeakers.teamMemberId, id))),
		one(db.select({ n: count() }).from(projects).where(eq(projects.leaderId, id))),
		one(db.select({ n: count() }).from(books).where(eq(books.authorId, id))),
		one(db.select({ n: count() }).from(prayerRequests).where(eq(prayerRequests.assignedToId, id)))
	]);

	const parts = [
		authored && `${authored} resource(s) authored`,
		spoken && `${spoken} resource(s) as speaker`,
		organized && `${organized} event(s) organized`,
		speakingAt && `${speakingAt} event speaking slot(s)`,
		led && `${led} project(s) led`,
		wrote && `${wrote} book(s)`,
		prayer && `${prayer} prayer request(s) assigned`
	].filter(Boolean) as string[];

	return { total: parts.length ? 1 : 0, parts };
};

export const actions: Actions = {
	editMember: async ({ request, cookies, locals, params }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(edit));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return fail(400, { form });
		}

		const { photoUrl, ...values } = form.data;
		const [oldPhoto] =  await db.select({ photo: teamMembers.photo}).from(teamMembers).where(eq(teamMembers.id, id)).limit(1)
		const photo = photoUrl ? await saveUploadedFile(photoUrl) : oldPhoto.photo

		try {
			await db
				.update(teamMembers)
				.set({
					...values,
					updatedBy: locals?.user?.id,
					photo
				})
				.where(eq(teamMembers.id, id));

			return message(form, { type: 'success', text: 'Profile updated' });
		} catch (err) {
			console.error('Error updating team member:', err);
			return message(form, { type: 'error', text: `Update failed: ${err?.message}` });
		}
	},

	/** Faster than opening the edit form when someone leaves the team. */
	unpublish: async ({ params, cookies, locals }) => {
		const id = Number(params.id);

		try {
			await db
				.update(teamMembers)
				.set({ isPublished: false, updatedBy: locals?.user?.id })
				.where(eq(teamMembers.id, id));

			setFlash({ type: 'success', message: 'Profile hidden from the public site' }, cookies);
		} catch (err) {
			console.error('Error unpublishing team member:', err);
			setFlash({ type: 'error', message: `Could not unpublish: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	delete: async ({ cookies, params }) => {
		const id = Number(params.id);

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Team member id missing from the URL.' }, cookies);
			return fail(400);
		}

		try {
			const refs = await countReferences(id);

			if (refs.parts.length > 0) {
				setFlash(
					{
						type: 'error',
						message: `Still attached to ${refs.parts.join(', ')}. Reassign those first, or hide the profile instead of deleting it.`
					},
					cookies
				);
				return fail(400);
			}

			/* Areas and socials cascade. */
			await db.delete(teamMembers).where(eq(teamMembers.id, id));

			setFlash({ type: 'success', message: 'Team member deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting team member:', err);

			/* Belt and braces, in case something was created between the check and here. */
			if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
				setFlash(
					{
						type: 'error',
						message: 'Other records still point at this person. Reassign them first.'
					},
					cookies
				);
				return fail(400);
			}

			setFlash({ type: 'error', message: `Delete failed: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── areas of expertise ──────────────────────────────────────────────── */

	setAreas: async ({ request, params, cookies }) => {
		const teamMemberId = Number(params.id);

		/* Checkboxes share a name, so read them with getAll rather than trusting
		   FormData's single-value default. */
		const formData = await request.formData();
		const parsed = setAreas.safeParse({
			ministryAreaIds: formData.getAll('ministryAreaIds')
		});

		if (!parsed.success) {
			setFlash({ type: 'error', message: 'Could not read the selected areas.' }, cookies);
			return fail(400);
		}

		const ids = [...new Set(parsed.data.ministryAreaIds)];

		try {
			await db.transaction(async (tx) => {
				await tx.delete(teamMemberAreas).where(eq(teamMemberAreas.teamMemberId, teamMemberId));

				if (ids.length > 0) {
					await tx
						.insert(teamMemberAreas)
						.values(ids.map((ministryAreaId) => ({ teamMemberId, ministryAreaId })));
				}
			});

			setFlash({ type: 'success', message: 'Areas saved' }, cookies);
		} catch (err) {
			console.error('Error saving areas:', err);
			setFlash({ type: 'error', message: `Could not save areas: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── social links ────────────────────────────────────────────────────── */

	addSocial: async ({ request, params, cookies }) => {
		const teamMemberId = Number(params.id);
		const form = await superValidate(request, zod4(addSocial));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Check the platform and URL.' }, cookies);
			return fail(400, { form });
		}

		try {
			await db.insert(teamMemberSocials).values({ teamMemberId, ...form.data });

			setFlash({ type: 'success', message: 'Link added' }, cookies);
		} catch (err) {
			console.error('Error adding social link:', err);
			setFlash({ type: 'error', message: `Could not add link: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	editSocial: async ({ request, params, cookies }) => {
		const teamMemberId = Number(params.id);
		const form = await superValidate(request, zod4(editSocial));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Check the platform and URL.' }, cookies);
			return fail(400, { form });
		}

		const { id, ...values } = form.data;

		try {
			await db
				.update(teamMemberSocials)
				.set(values)
				.where(
					and(eq(teamMemberSocials.id, id), eq(teamMemberSocials.teamMemberId, teamMemberId))
				);

			setFlash({ type: 'success', message: 'Link updated' }, cookies);
		} catch (err) {
			console.error('Error updating social link:', err);
			setFlash({ type: 'error', message: `Could not update link: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	deleteSocial: async ({ request, params, cookies }) => {
		const teamMemberId = Number(params.id);
		const form = await superValidate(request, zod4(rowId));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Link id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(teamMemberSocials)
				.where(
					and(
						eq(teamMemberSocials.id, form.data.id),
						eq(teamMemberSocials.teamMemberId, teamMemberId)
					)
				);

			setFlash({ type: 'success', message: 'Link removed' }, cookies);
		} catch (err) {
			console.error('Error deleting social link:', err);
			setFlash({ type: 'error', message: `Could not remove link: ${err?.message}` }, cookies);
			return fail(400);
		}
	}
};
