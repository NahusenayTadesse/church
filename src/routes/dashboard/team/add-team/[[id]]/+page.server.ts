import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { asc } from 'drizzle-orm';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

import { add, socialPlatforms } from './schema';
import { db } from '$lib/server/db';
import { teamMembers, teamMemberAreas, teamMemberSocials, ministryAreas, user } from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(add));

	const [areas, accounts] = await Promise.all([
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db.select({ value: user.id, name: user.email }).from(user).orderBy(asc(user.email))
	]);

	return { form, areas, accounts };
};

export const actions: Actions = {
	addTeamMember: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const {
			name,
			position,
			email,
			phone,
			biography,
			userId,
			ministryAreas: areaIds,
			isExecutive,
			isSpeaker,
			isPublished,
			sortOrder,
			photo
		} = form.data;

		// Pull the eight social URLs back off the flat form data.
		const socials = socialPlatforms
			.map((platform) => ({ platform, url: (form.data[platform] ?? '').trim() }))
			.filter((s) => s.url.length > 0)
			.map((s, i) => ({ ...s, sortOrder: i }));

		let memberId: number;

		try {
			// Upload before opening the transaction — no reason to hold a
			// connection while the file streams to disk.
			const photoUrl = await saveUploadedFile(photo);

			memberId = await db.transaction(async (tx) => {
				const [row] = await tx
					.insert(teamMembers)
					.values({
						name,
						position: position || null,
						email: email || null,
						phone: phone || null,
						biography: biography || null,
						userId: userId || null,
						photo: photoUrl,
						isExecutive,
						isSpeaker,
						isPublished,
						sortOrder,
						createdBy: locals?.user?.id
					})
					.$returningId();

				// Dedupe — a double-submitted checkbox would otherwise insert twice.
				const uniqueAreas = [...new Set(areaIds ?? [])];

				if (uniqueAreas.length > 0) {
					await tx.insert(teamMemberAreas).values(
						uniqueAreas.map((ministryAreaId) => ({
							teamMemberId: row.id,
							ministryAreaId
						}))
					);
				}

				if (socials.length > 0) {
					await tx
						.insert(teamMemberSocials)
						.values(socials.map((s) => ({ teamMemberId: row.id, ...s })));
				}

				return row.id;
			});
		} catch (err) {
			console.error('Failed to add team member:', err);
			return message(
				form,
				{ type: 'error', text: 'An error occurred while adding the team member.' },
				{ status: 500 }
			);
		}

		// `redirect` throws, so it stays outside the try block.
		redirect(
			`/dashboard/team/single/${memberId}`,
			{ type: 'success', message: 'New team member successfully added' },
			cookies
		);
	}
};