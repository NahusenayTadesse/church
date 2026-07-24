import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';

import { edit, editGallery, addSpeaker, addDownload, addRegistration, HOLDS_A_SEAT } from './schema';

import { db } from '$lib/server/db';
import {
	events,
	eventGallery,
	eventSpeakers,
	eventDownloads,
	eventRegistrations,
	ministryAreas,
	teamMembers,
	transactions,
	user
} from '$lib/server/db/schema';
import { eq, asc, desc, sql, inArray, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import type { LayoutServerLoad } from './$types';

const organizer = alias(teamMembers, 'organizer');
const speaker = alias(teamMembers, 'speaker');
const creator = alias(user, 'creator');
const editor = alias(user, 'editor');

export const load: LayoutServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!Number.isInteger(id)) error(400, 'Invalid event id');

	const event = await db
		.select({
			...getTableColumns(events),
			ministryAreaName: ministryAreas.name,
			organizerName: organizer.name,
			createdByName: creator.name,
			updatedByName: editor.name
		})
		.from(events)
		.leftJoin(ministryAreas, eq(events.ministryAreaId, ministryAreas.id))
		.leftJoin(organizer, eq(events.organizerId, organizer.id))
		.leftJoin(creator, eq(events.createdBy, creator.id))
		.leftJoin(editor, eq(events.updatedBy, editor.id))
		.where(eq(events.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!event) error(404, 'Event not found');

	const images = await db
		.select({ url: eventGallery.imageUrl })
		.from(eventGallery)
		.where(eq(eventGallery.eventId, id))
		.orderBy(asc(eventGallery.sortOrder), asc(eventGallery.id))
		.then((rows) => rows.map((r) => r.url).filter((u): u is string => !!u));

	const speakers = await db
		.select({
			...getTableColumns(eventSpeakers),
			memberName: speaker.name,
			memberPhoto: speaker.photo,
			memberPosition: speaker.position
		})
		.from(eventSpeakers)
		.leftJoin(speaker, eq(eventSpeakers.teamMemberId, speaker.id))
		.where(eq(eventSpeakers.eventId, id))
		.orderBy(asc(eventSpeakers.sortOrder), asc(eventSpeakers.id));

	const downloads = await db
		.select()
		.from(eventDownloads)
		.where(eq(eventDownloads.eventId, id))
		.orderBy(asc(eventDownloads.sortOrder), asc(eventDownloads.id));

	const registrations = await db
		.select({
			...getTableColumns(eventRegistrations),
			paymentStatus: transactions.paymentStatus,
			amountPaid: transactions.amount,
			paidCurrency: transactions.currency
		})
		.from(eventRegistrations)
		.leftJoin(transactions, eq(eventRegistrations.transactionId, transactions.id))
		.where(eq(eventRegistrations.eventId, id))
		.orderBy(desc(eventRegistrations.createdAt));

	/* Seats held vs seats sold — pending registrations still occupy the room. */
	const seatsTaken = registrations
		.filter((r) => HOLDS_A_SEAT.includes(r.status as (typeof HOLDS_A_SEAT)[number]))
		.reduce((sum, r) => sum + (r.seats ?? 1), 0);

	const seatsLeft =
		typeof event.maxAttendees === 'number' ? Math.max(event.maxAttendees - seatsTaken, 0) : null;

	const counts = registrations.reduce<Record<string, number>>((acc, r) => {
		const key = r.status ?? 'pending';
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});

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

	const [form, galleryEdit, speakerForm, downloadForm, registrationForm] = await Promise.all([
		superValidate(event, zod4(edit)),
		superValidate({ existing: images }, zod4(editGallery)),
		superValidate(zod4(addSpeaker)),
		superValidate(zod4(addDownload)),
		superValidate(zod4(addRegistration))
	]);

	return {
		event,
		form,
		galleryEdit,
		speakerForm,
		downloadForm,
		registrationForm,
		images,
		speakers,
		downloads,
		registrations,
		seatsTaken,
		seatsLeft,
		counts,
		areas,
		people
	};
};