import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setFlash } from 'sveltekit-flash-message/server';
import { eq, and, inArray } from 'drizzle-orm';

import {
	edit,
	editGallery,
	addSpeaker,
	editSpeaker,
	addDownload,
	addRegistration,
	setRegistrationStatus,
	HOLDS_A_SEAT
} from './schema';

import { db } from '$lib/server/db';
import {
	events,
	eventGallery,
	eventSpeakers,
	eventDownloads,
	eventRegistrations
} from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload';

import type { Actions } from './$types';

const money = (v: number | null | undefined) => (v === null || v === undefined ? null : String(v));

/**
 * Seats currently held for an event, optionally ignoring one registration
 * (so editing a row doesn't count that row against itself).
 */
const seatsHeld = async (eventId: number, excludeId?: number) => {
	const rows = await db
		.select({ id: eventRegistrations.id, seats: eventRegistrations.seats })
		.from(eventRegistrations)
		.where(
			and(
				eq(eventRegistrations.eventId, eventId),
				inArray(eventRegistrations.status, [...HOLDS_A_SEAT])
			)
		);

	return rows
		.filter((r) => r.id !== excludeId)
		.reduce((sum, r) => sum + (r.seats ?? 1), 0);
};

const capacityOf = async (eventId: number) =>
	db
		.select({ maxAttendees: events.maxAttendees })
		.from(events)
		.where(eq(events.id, eventId))
		.limit(1)
		.then((rows) => rows[0]?.maxAttendees ?? null);

export const actions: Actions = {
	editEvent: async ({ request, cookies, locals, params }) => {
		const id = Number(params.id);
		const form = await superValidate(request, zod4(edit));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return fail(400, { form });
		}

		const { image, cost, ...values } = form.data;

		try {
			const patch = {
				...values,
				cost: values.isFree ? null : money(cost),
				updatedBy: locals?.user?.id,
				...(image ? { featuredImage: await saveUploadedFile(image) } : {})
			};

			await db.update(events).set(patch).where(eq(events.id, id));

			return message(form, { type: 'success', text: 'Event updated' });
		} catch (err) {
			console.error('Error updating event:', err);

			if (err?.code === 'ER_DUP_ENTRY') {
				return message(form, {
					type: 'error',
					text: 'That slug is already taken — pick another one.'
				});
			}

			return message(form, { type: 'error', text: `Event update failed: ${err?.message}` });
		}
	},

	delete: async ({ cookies, params }) => {
		const id = Number(params.id);

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Event id missing from the URL.' }, cookies);
			return fail(400);
		}

		try {
			/* Speakers, gallery, downloads and registrations all cascade.
			   Transactions do not — receipts outlive the event on purpose. */
			await db.delete(events).where(eq(events.id, id));

			setFlash({ type: 'success', message: 'Event deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting event:', err);
			setFlash({ type: 'error', message: `Delete failed: ${err?.message}` }, cookies);
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

			/* Captions are keyed to the URL so re-saving the gallery doesn't wipe them. */
			const captions = await db
				.select({ imageUrl: eventGallery.imageUrl, caption: eventGallery.caption })
				.from(eventGallery)
				.where(eq(eventGallery.eventId, id))
				.then((rows) => new Map(rows.map((r) => [r.imageUrl, r.caption])));

			await db.transaction(async (tx) => {
				await tx.delete(eventGallery).where(eq(eventGallery.eventId, id));

				if (finalList.length > 0) {
					await tx.insert(eventGallery).values(
						finalList.map((imageUrl, sortOrder) => ({
							eventId: id,
							imageUrl,
							caption: captions.get(imageUrl) ?? null,
							sortOrder
						}))
					);
				}
			});

			return message(form, { type: 'success', text: 'Gallery saved' });
		} catch (err) {
			console.error('Error saving event gallery:', err);
			return message(
				form,
				{ type: 'error', text: `Gallery save failed: ${err?.message}` },
				{ status: 500 }
			);
		}
	},

	/* ── speakers ────────────────────────────────────────────────────────── */

	addSpeaker: async ({ request, params, cookies }) => {
		const eventId = Number(params.id);
		const form = await superValidate(request, zod4(addSpeaker));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the speaker details.' }, cookies);
			return fail(400, { form });
		}

		const { photo, ...values } = form.data;

		try {
			await db.insert(eventSpeakers).values({
				eventId,
				...values,
				guestPhoto: photo ? await saveUploadedFile(photo) : null
			});

			setFlash({ type: 'success', message: 'Speaker added' }, cookies);
		} catch (err) {
			console.error('Error adding speaker:', err);
			setFlash({ type: 'error', message: `Could not add speaker: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	editSpeaker: async ({ request, params, cookies }) => {
		const eventId = Number(params.id);
		const form = await superValidate(request, zod4(editSpeaker));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the speaker details.' }, cookies);
			return fail(400, { form });
		}

		const { id, photo, ...values } = form.data;

		try {
			await db
				.update(eventSpeakers)
				.set({
					...values,
					...(photo ? { guestPhoto: await saveUploadedFile(photo) } : {})
				})
				.where(and(eq(eventSpeakers.id, id), eq(eventSpeakers.eventId, eventId)));

			setFlash({ type: 'success', message: 'Speaker updated' }, cookies);
		} catch (err) {
			console.error('Error updating speaker:', err);
			setFlash({ type: 'error', message: `Could not update speaker: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	deleteSpeaker: async ({ request, params, cookies }) => {
		const eventId = Number(params.id);
		const id = Number((await request.formData()).get('id'));

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Speaker id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(eventSpeakers)
				.where(and(eq(eventSpeakers.id, id), eq(eventSpeakers.eventId, eventId)));

			setFlash({ type: 'success', message: 'Speaker removed' }, cookies);
		} catch (err) {
			console.error('Error deleting speaker:', err);
			setFlash({ type: 'error', message: `Could not remove speaker: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── downloads ───────────────────────────────────────────────────────── */

	addDownload: async ({ request, params, cookies }) => {
		const eventId = Number(params.id);
		const form = await superValidate(request, zod4(addDownload));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the file details.' }, cookies);
			return fail(400, { form });
		}

		const { file, ...values } = form.data;

		try {
			await db.insert(eventDownloads).values({
				eventId,
				...values,
				fileUrl: await saveUploadedFile(file),
				fileSize: file.size /* bytes, matches the int column */
			});

			setFlash({ type: 'success', message: 'File added' }, cookies);
		} catch (err) {
			console.error('Error adding download:', err);
			setFlash({ type: 'error', message: `Could not add file: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	deleteDownload: async ({ request, params, cookies }) => {
		const eventId = Number(params.id);
		const id = Number((await request.formData()).get('id'));

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'File id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(eventDownloads)
				.where(and(eq(eventDownloads.id, id), eq(eventDownloads.eventId, eventId)));

			setFlash({ type: 'success', message: 'File removed' }, cookies);
		} catch (err) {
			console.error('Error deleting download:', err);
			setFlash({ type: 'error', message: `Could not remove file: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	/* ── registrations ───────────────────────────────────────────────────── */

	addRegistration: async ({ request, params, cookies }) => {
		const eventId = Number(params.id);
		const form = await superValidate(request, zod4(addRegistration));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the registration details.' }, cookies);
			return fail(400, { form });
		}

		const values = form.data;

		try {
			if (HOLDS_A_SEAT.includes(values.status as (typeof HOLDS_A_SEAT)[number])) {
				const max = await capacityOf(eventId);
				const held = await seatsHeld(eventId);

				if (typeof max === 'number' && held + values.seats > max) {
					setFlash(
						{
							type: 'error',
							message: `Only ${Math.max(max - held, 0)} seat(s) left. Add this one to the waitlist instead.`
						},
						cookies
					);
					return fail(400, { form });
				}
			}

			await db.insert(eventRegistrations).values({ eventId, ...values });

			setFlash({ type: 'success', message: `${values.name} registered` }, cookies);
		} catch (err) {
			console.error('Error adding registration:', err);
			setFlash({ type: 'error', message: `Could not register: ${err?.message}` }, cookies);
			return fail(400, { form });
		}
	},

	setRegistrationStatus: async ({ request, params, cookies }) => {
		const eventId = Number(params.id);
		const form = await superValidate(request, zod4(setRegistrationStatus));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Registration id or status missing.' }, cookies);
			return fail(400);
		}

		const { id, status } = form.data;

		try {
			const row = await db
				.select({ seats: eventRegistrations.seats, status: eventRegistrations.status })
				.from(eventRegistrations)
				.where(and(eq(eventRegistrations.id, id), eq(eventRegistrations.eventId, eventId)))
				.limit(1)
				.then((rows) => rows[0]);

			if (!row) {
				setFlash({ type: 'error', message: 'Registration not found.' }, cookies);
				return fail(404);
			}

			/* Moving someone off the waitlist can overfill the room, so check first. */
			if (HOLDS_A_SEAT.includes(status as (typeof HOLDS_A_SEAT)[number])) {
				const max = await capacityOf(eventId);
				const held = await seatsHeld(eventId, id);

				if (typeof max === 'number' && held + (row.seats ?? 1) > max) {
					setFlash(
						{ type: 'error', message: `That would put the event ${held + (row.seats ?? 1) - max} seat(s) over capacity.` },
						cookies
					);
					return fail(400);
				}
			}

			await db
				.update(eventRegistrations)
				.set({ status })
				.where(and(eq(eventRegistrations.id, id), eq(eventRegistrations.eventId, eventId)));

			setFlash({ type: 'success', message: `Marked as ${status.replaceAll('_', ' ')}` }, cookies);
		} catch (err) {
			console.error('Error updating registration:', err);
			setFlash({ type: 'error', message: `Could not update: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	checkIn: async ({ request, params, cookies }) => {
		const eventId = Number(params.id);
		const id = Number((await request.formData()).get('id'));

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Registration id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.update(eventRegistrations)
				.set({ status: 'attended', checkedInAt: new Date() })
				.where(and(eq(eventRegistrations.id, id), eq(eventRegistrations.eventId, eventId)));

			setFlash({ type: 'success', message: 'Checked in' }, cookies);
		} catch (err) {
			console.error('Error checking in:', err);
			setFlash({ type: 'error', message: `Could not check in: ${err?.message}` }, cookies);
			return fail(400);
		}
	},

	deleteRegistration: async ({ request, params, cookies }) => {
		const eventId = Number(params.id);
		const id = Number((await request.formData()).get('id'));

		if (!Number.isInteger(id)) {
			setFlash({ type: 'error', message: 'Registration id missing.' }, cookies);
			return fail(400);
		}

		try {
			await db
				.delete(eventRegistrations)
				.where(and(eq(eventRegistrations.id, id), eq(eventRegistrations.eventId, eventId)));

			setFlash({ type: 'success', message: 'Registration deleted' }, cookies);
		} catch (err) {
			console.error('Error deleting registration:', err);
			setFlash({ type: 'error', message: `Could not delete: ${err?.message}` }, cookies);
			return fail(400);
		}
	}
};