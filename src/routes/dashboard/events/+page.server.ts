import { db } from '$lib/server/db';
import {
	events,
	eventRegistrations,
	eventGallery,
	eventDownloads,
	eventSpeakers,
	ministryAreas,
	teamMembers
} from '$lib/server/db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: events.id,
			name: events.name,
			slug: events.slug,
			shortDescription: events.shortDescription,
			fullDescription: events.fullDescription,
			eventType: events.eventType,
			ministryArea: ministryAreas.name,
			featuredImage: events.featuredImage,

			startsAt: events.startsAt,
			endsAt: events.endsAt,
			timezone: events.timezone,

			isOnline: events.isOnline,
			location: events.location,
			onlineMeetingLink: events.onlineMeetingLink,

			organizer: teamMembers.name,

			registrationRequired: events.registrationRequired,
			registrationDeadline: events.registrationDeadline,
			maxAttendees: events.maxAttendees,

			isFree: events.isFree,
			cost: events.cost,
			currency: events.currency,

			status: events.status,
			isFeaturedOnHome: events.isFeaturedOnHome,
			createdAt: events.createdAt
		})
		.from(events)
		.leftJoin(ministryAreas, eq(events.ministryAreaId, ministryAreas.id))
		.leftJoin(teamMembers, eq(events.organizerId, teamMembers.id))
		.orderBy(desc(events.startsAt));

	// Grouped separately — joining these onto the query above would multiply
	// rows and blow up every count.
	const regRows = await db
		.select({
			eventId: eventRegistrations.eventId,
			registrations: count(eventRegistrations.id),
			seatsTaken: sql<number>`sum(case when ${eventRegistrations.status} in ('confirmed','attended') then ${eventRegistrations.seats} else 0 end)`,
			pending: sql<number>`sum(case when ${eventRegistrations.status} = 'pending' then 1 else 0 end)`,
			waitlisted: sql<number>`sum(case when ${eventRegistrations.status} = 'waitlisted' then 1 else 0 end)`,
			attended: sql<number>`sum(case when ${eventRegistrations.status} = 'attended' then 1 else 0 end)`
		})
		.from(eventRegistrations)
		.groupBy(eventRegistrations.eventId);

	const speakerRows = await db
		.select({ eventId: eventSpeakers.eventId, speakers: count(eventSpeakers.id) })
		.from(eventSpeakers)
		.groupBy(eventSpeakers.eventId);

	const galleryRows = await db
		.select({ eventId: eventGallery.eventId, photos: count(eventGallery.id) })
		.from(eventGallery)
		.groupBy(eventGallery.eventId);

	const downloadRows = await db
		.select({ eventId: eventDownloads.eventId, files: count(eventDownloads.id) })
		.from(eventDownloads)
		.groupBy(eventDownloads.eventId);

	const regMap = new Map(regRows.map((r) => [r.eventId, r]));
	const speakerMap = new Map(speakerRows.map((r) => [r.eventId, r.speakers]));
	const galleryMap = new Map(galleryRows.map((r) => [r.eventId, r.photos]));
	const downloadMap = new Map(downloadRows.map((r) => [r.eventId, r.files]));

	const now = new Date();

	const eventList = rows.map((e) => {
		const r = regMap.get(e.id);
		const seatsTaken = Number(r?.seatsTaken ?? 0);
		const start = e.startsAt ? new Date(e.startsAt) : null;
		const end = e.endsAt ? new Date(e.endsAt) : null;
		const deadline = e.registrationDeadline ? new Date(e.registrationDeadline) : null;

		return {
			...e,
			registrations: Number(r?.registrations ?? 0),
			seatsTaken,
			pending: Number(r?.pending ?? 0),
			waitlisted: Number(r?.waitlisted ?? 0),
			attended: Number(r?.attended ?? 0),
			seatsLeft: e.maxAttendees != null ? e.maxAttendees - seatsTaken : null,
			isFull: e.maxAttendees != null && seatsTaken >= e.maxAttendees,

			speakerCount: speakerMap.get(e.id) ?? 0,
			photoCount: galleryMap.get(e.id) ?? 0,
			fileCount: downloadMap.get(e.id) ?? 0,

			// Filter chips. `status` is whatever staff set; these are computed from
			// the clock, so a stale 'upcoming' on last month's event still reads right.
			timing: !start ? 'unscheduled' : end && end < now ? 'past' : start > now ? 'upcoming' : 'ongoing',
			format: e.isOnline ? 'online' : 'in person',
			pricing: e.isFree ? 'free' : 'paid',
			registrationOpen:
				!!e.registrationRequired &&
				(!deadline || deadline > now) &&
				!(e.maxAttendees != null && seatsTaken >= e.maxAttendees)
		};
	});

	return { eventList };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing event id' });

		try {
			await db.delete(events).where(eq(events.id, id));
			return { success: true, message: 'Event deleted' };
		} catch {
			return fail(500, { message: 'Could not delete event' });
		}
	},

	toggleFeatured: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing event id' });

		await db.update(events).set({ isFeaturedOnHome: !value }).where(eq(events.id, id));
		return { success: true };
	},

	setStatus: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const status = String(form.get('status'));
		const allowed = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'] as const;

		if (!id) return fail(400, { message: 'Missing event id' });
		if (!allowed.includes(status as (typeof allowed)[number])) {
			return fail(400, { message: 'Invalid status' });
		}

		await db
			.update(events)
			.set({ status: status as (typeof allowed)[number] })
			.where(eq(events.id, id));
		return { success: true, message: `Event marked ${status}` };
	}
};