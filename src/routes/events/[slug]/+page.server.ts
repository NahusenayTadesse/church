import { error } from '@sveltejs/kit';
import { and, asc, desc, eq, ne, or, sql } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { db } from '$lib/server/db';
import {
	events,
	eventSpeakers,
	eventGallery,
	eventDownloads,
	eventRegistrations,
	ministryAreas,
	teamMembers,
	transactions,
	paymentAccounts,
	paymentMethods
} from '$lib/server/db/schema';
import { eventRegistrationSchema } from './schema';
import type { PageServerLoad, Actions } from './$types';

/** Naive datetimes are wall-clock in the event's own timezone — keep them as text. */
const wallClock = (column: unknown) => sql<string>`date_format(${column}, '%Y-%m-%dT%H:%i:%s')`;

/**
 * Registration is open when the event is running or still ahead, is not cancelled,
 * asks for registration, and the deadline has not passed. Evaluated in SQL so the
 * database clock decides, not the Node process.
 */
const registrationOpenSql = sql<number>`(
	${events.registrationRequired} = 1
	and ${events.status} <> 'cancelled'
	and coalesce(${events.endsAt}, ${events.startsAt}) >= now()
	and (${events.registrationDeadline} is null or ${events.registrationDeadline} >= now())
)`;

/** Seats held by everyone who has not cancelled or been marked a no-show. */
const seatsTakenFor = async (eventId: number) => {
	const [row] = await db
		.select({ seats: sql<number>`coalesce(sum(${eventRegistrations.seats}), 0)` })
		.from(eventRegistrations)
		.where(
			and(
				eq(eventRegistrations.eventId, eventId),
				sql`${eventRegistrations.status} in ('pending', 'confirmed', 'attended')`
			)
		);
	return Number(row?.seats ?? 0);
};

/* -------------------------------------------------------------------------- */
/* load                                                                        */
/* -------------------------------------------------------------------------- */

export const load: PageServerLoad = async ({ params }) => {
	const [row] = await db
		.select({
			id: events.id,
			name: events.name,
			slug: events.slug,
			shortDescription: events.shortDescription,
			fullDescription: events.fullDescription,
			eventType: events.eventType,
			featuredImage: events.featuredImage,
			startsAt: wallClock(events.startsAt),
			endsAt: wallClock(events.endsAt),
			registrationDeadline: wallClock(events.registrationDeadline),
			timezone: events.timezone,
			isOnline: events.isOnline,
			location: events.location,
			locationMapUrl: events.locationMapUrl,
			onlineMeetingLink: events.onlineMeetingLink,
			status: events.status,
			registrationRequired: events.registrationRequired,
			maxAttendees: events.maxAttendees,
			isFree: events.isFree,
			cost: events.cost,
			currency: events.currency,
			ministryAreaId: events.ministryAreaId,
			ministryAreaName: ministryAreas.name,
			organizerName: teamMembers.name,
			organizerPosition: teamMembers.position,
			organizerPhoto: teamMembers.photo,
			organizerEmail: teamMembers.email,
			registrationOpen: registrationOpenSql,
			hasEnded: sql<number>`(coalesce(${events.endsAt}, ${events.startsAt}) < now())`
		})
		.from(events)
		.leftJoin(ministryAreas, eq(ministryAreas.id, events.ministryAreaId))
		.leftJoin(teamMembers, eq(teamMembers.id, events.organizerId))
		.where(and(eq(events.slug, params.slug), ne(events.status, 'draft')))
		.limit(1);

	if (!row) error(404, 'That event does not exist, or is not published yet.');

	const [speakers, gallery, downloads, seatsTaken, accounts, related] = await Promise.all([
		db
			.select({
				id: eventSpeakers.id,
				name: sql<string>`coalesce(${teamMembers.name}, ${eventSpeakers.guestName})`,
				title: sql<
					string | null
				>`coalesce(${teamMembers.position}, ${eventSpeakers.guestTitle})`,
				photo: sql<string | null>`coalesce(${teamMembers.photo}, ${eventSpeakers.guestPhoto})`,
				bio: sql<string | null>`coalesce(${teamMembers.biography}, ${eventSpeakers.guestBio})`,
				role: eventSpeakers.role
			})
			.from(eventSpeakers)
			.leftJoin(teamMembers, eq(teamMembers.id, eventSpeakers.teamMemberId))
			.where(eq(eventSpeakers.eventId, row.id))
			.orderBy(asc(eventSpeakers.sortOrder)),

		db
			.select({ id: eventGallery.id, imageUrl: eventGallery.imageUrl, caption: eventGallery.caption })
			.from(eventGallery)
			.where(eq(eventGallery.eventId, row.id))
			.orderBy(asc(eventGallery.sortOrder)),

		db
			.select({
				id: eventDownloads.id,
				title: eventDownloads.title,
				fileUrl: eventDownloads.fileUrl,
				fileType: eventDownloads.fileType,
				fileSize: eventDownloads.fileSize
			})
			.from(eventDownloads)
			.where(eq(eventDownloads.eventId, row.id))
			.orderBy(asc(eventDownloads.sortOrder)),

		seatsTakenFor(row.id),

		row.isFree
			? Promise.resolve([])
			: db
					.select({
						id: paymentAccounts.id,
						accountName: paymentAccounts.accountName,
						accountNumber: paymentAccounts.accountNumber,
						bankName: paymentAccounts.bankName,
						branch: paymentAccounts.branch,
						swiftCode: paymentAccounts.swiftCode,
						currency: paymentAccounts.currency,
						instructions: paymentAccounts.instructions,
						methodId: paymentMethods.id,
						methodName: paymentMethods.name,
						methodLogo: paymentMethods.logo
					})
					.from(paymentAccounts)
					.innerJoin(paymentMethods, eq(paymentMethods.id, paymentAccounts.paymentMethodId))
					.orderBy(asc(paymentAccounts.sortOrder)),

		db
			.select({
				id: events.id,
				name: events.name,
				slug: events.slug,
				eventType: events.eventType,
				featuredImage: events.featuredImage,
				startsAt: wallClock(events.startsAt),
				isOnline: events.isOnline,
				location: events.location,
				isFree: events.isFree
			})
			.from(events)
			.where(
				and(
					ne(events.status, 'draft'),
					ne(events.id, row.id),
					sql`coalesce(${events.endsAt}, ${events.startsAt}) >= now()`,
					row.ministryAreaId
						? or(
								eq(events.ministryAreaId, row.ministryAreaId),
								eq(events.eventType, row.eventType)
							)
						: eq(events.eventType, row.eventType)
				)
			)
			.orderBy(asc(events.startsAt))
			.limit(3)
	]);

	const seatsLeft = row.maxAttendees ? Math.max(0, row.maxAttendees - seatsTaken) : null;

	const form = await superValidate(zod4(eventRegistrationSchema), {
		defaults: {
			name: '',
			email: '',
			phone: '',
			organization: '',
			seats: 1,
			paymentMethodId: accounts[0]?.methodId ?? null,
			notes: ''
		}
	});

	return {
		event: {
			...row,
			registrationOpen: Boolean(row.registrationOpen) && (seatsLeft === null || seatsLeft > 0),
			hasEnded: Boolean(row.hasEnded)
		},
		speakers,
		gallery,
		downloads,
		accounts,
		related,
		seatsTaken,
		seatsLeft,
		form
	};
};

/* -------------------------------------------------------------------------- */
/* actions                                                                     */
/* -------------------------------------------------------------------------- */

export const actions: Actions = {
	register: async ({ request, params, locals }) => {
		const form = await superValidate(request, zod4(eventRegistrationSchema));

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for errors' });
		}

		/* Re-read the event: the page may have been open for a while. */
		const [event] = await db
			.select({
				id: events.id,
				name: events.name,
				isFree: events.isFree,
				cost: events.cost,
				currency: events.currency,
				maxAttendees: events.maxAttendees,
				registrationOpen: registrationOpenSql
			})
			.from(events)
			.where(and(eq(events.slug, params.slug), ne(events.status, 'draft')))
			.limit(1);

		if (!event) {
			return message(form, { type: 'error', text: 'This event is no longer available' });
		}

		if (!event.registrationOpen) {
			return message(form, { type: 'error', text: 'Registration for this event has closed' });
		}

		const { name, email, phone, organization, seats, notes, paymentMethodId } = form.data;

		/* One registration per email per event keeps the seat count honest. */
		const [existing] = await db
			.select({ id: eventRegistrations.id })
			.from(eventRegistrations)
			.where(
				and(
					eq(eventRegistrations.eventId, event.id),
					eq(eventRegistrations.email, email),
					ne(eventRegistrations.status, 'cancelled')
				)
			)
			.limit(1);

		if (existing) {
			return message(form, {
				type: 'error',
				text: 'This email is already registered for this event'
			});
		}

		if (event.maxAttendees) {
			const taken = await seatsTakenFor(event.id);
			if (taken + seats > event.maxAttendees) {
				const left = Math.max(0, event.maxAttendees - taken);
				return message(form, {
					type: 'error',
					text: left
						? `Only ${left} seat${left === 1 ? '' : 's'} left — please lower the number of seats`
						: 'This event is now fully booked'
				});
			}
		}

		// Adjust if your locals expose the session differently.
		const userId = locals.user?.id ?? null;

		try {
			let transactionId: number | null = null;

			if (!event.isFree) {
				const total = Number(event.cost ?? 0) * seats;

				// `transactions` carries ...secureFields. If `createdBy` is NOT NULL on your
				// side, make it nullable for public writes or pass a service account id.
				const [result] = await db.insert(transactions).values({
					amount: total.toFixed(2),
					currency: event.currency ?? 'ETB',
					purpose: 'event_registration',
					paymentStatus: 'pending',
					paymentMethodId: paymentMethodId ?? null,
					...(userId ? { createdBy: userId } : {})
				});

				transactionId = Number(result.insertId);
			}

			await db.insert(eventRegistrations).values({
				eventId: event.id,
				userId,
				name,
				email,
				phone,
				organization: organization || null,
				seats,
				status: 'pending',
				transactionId,
				notes: notes || null
			});

			// const adminMail = adminEventRegistrationTemplate(event.name, form.data);
			// sendEmail(SMTP_USER, adminMail.subject, adminMail.html);

			// const userMail = eventRegistrationTemplate(name, event.name);
			// sendEmail(email, userMail.subject, userMail.html);

			return message(form, {
				type: 'success',
				text: event.isFree
					? 'You are registered — check your email for the details'
					: 'Seat reserved. Complete the transfer using the bank details below and we will confirm it'
			});
		} catch (err) {
			return message(form, {
				type: 'error',
				text: 'We could not save your registration: ' + (err as Error)?.message
			});
		}
	}
};