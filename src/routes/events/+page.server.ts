import { and, asc, count, desc, eq, inArray, like, lt, ne, or, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	events,
	eventSpeakers,
	eventRegistrations,
	ministryAreas,
	teamMembers
} from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 9;

const EVENT_TYPES = ['conference', 'workshop', 'retreat', 'training', 'seminar', 'other'] as const;
const WHEN = ['upcoming', 'past', 'all'] as const;
const FORMATS = ['all', 'in_person', 'online'] as const;
const SORTS = ['soonest', 'latest', 'name'] as const;

type EventType = (typeof EVENT_TYPES)[number];
type When = (typeof WHEN)[number];
type Format = (typeof FORMATS)[number];
type Sort = (typeof SORTS)[number];

/**
 * `starts_at` / `ends_at` are naive datetimes — wall-clock time in the event's own
 * timezone. Reading them as JS Dates would re-interpret them in the server's
 * timezone and shift the hours, so they come back as plain strings and the page
 * renders exactly what was typed in.
 */
const wallClock = (column: unknown) => sql<string>`date_format(${column}, '%Y-%m-%dT%H:%i:%s')`;

export const load: PageServerLoad = async ({ url }) => {
	const p = url.searchParams;

	const q = (p.get('q') ?? '').trim().slice(0, 100);
	const area = Number(p.get('area')) || 0;
	const freeOnly = p.get('free') === '1';

	const rawType = p.get('type') ?? 'all';
	const type: EventType | 'all' = EVENT_TYPES.includes(rawType as EventType)
		? (rawType as EventType)
		: 'all';

	const rawWhen = p.get('when') ?? 'upcoming';
	const when: When = WHEN.includes(rawWhen as When) ? (rawWhen as When) : 'upcoming';

	const rawFormat = p.get('format') ?? 'all';
	const format: Format = FORMATS.includes(rawFormat as Format) ? (rawFormat as Format) : 'all';

	const rawSort = p.get('sort') ?? '';
	const sort: Sort = SORTS.includes(rawSort as Sort)
		? (rawSort as Sort)
		: when === 'past'
			? 'latest'
			: 'soonest';

	const currentPage = Math.max(1, Number(p.get('page')) || 1);
	const offset = (currentPage - 1) * PAGE_SIZE;

	const hasFilters = Boolean(
		q || area || freeOnly || type !== 'all' || format !== 'all' || when !== 'upcoming'
	);

	/* An event counts as "on" until it ends — a three-day conference stays in the
	   upcoming list while it is running. */
	const finishesAt = sql`coalesce(${events.endsAt}, ${events.startsAt})`;

	const base: (SQL | undefined)[] = [ne(events.status, 'draft')];

	if (when === 'upcoming') base.push(sql`${finishesAt} >= now()`);
	if (when === 'past') base.push(lt(finishesAt, sql`now()`));

	if (q) {
		base.push(
			or(
				like(events.name, `%${q}%`),
				like(events.shortDescription, `%${q}%`),
				like(events.location, `%${q}%`)
			)
		);
	}
	if (area) base.push(eq(events.ministryAreaId, area));
	if (freeOnly) base.push(eq(events.isFree, true));
	if (format === 'online') base.push(eq(events.isOnline, true));
	if (format === 'in_person') base.push(eq(events.isOnline, false));

	const where = and(...base, type === 'all' ? undefined : eq(events.eventType, type));

	const orderBy =
		sort === 'latest'
			? desc(events.startsAt)
			: sort === 'name'
				? asc(events.name)
				: asc(events.startsAt);

	/* Seats already spoken for, so cards can show what is left. */
	const taken = db
		.select({
			eventId: eventRegistrations.eventId,
			seats: sql<number>`coalesce(sum(${eventRegistrations.seats}), 0)`.as('seats')
		})
		.from(eventRegistrations)
		.where(inArray(eventRegistrations.status, ['pending', 'confirmed', 'attended']))
		.groupBy(eventRegistrations.eventId)
		.as('taken');

	const selection = {
		id: events.id,
		name: events.name,
		slug: events.slug,
		shortDescription: events.shortDescription,
		eventType: events.eventType,
		featuredImage: events.featuredImage,
		startsAt: wallClock(events.startsAt),
		endsAt: wallClock(events.endsAt),
		registrationDeadline: wallClock(events.registrationDeadline),
		timezone: events.timezone,
		isOnline: events.isOnline,
		location: events.location,
		status: events.status,
		registrationRequired: events.registrationRequired,
		maxAttendees: events.maxAttendees,
		seatsTaken: sql<number>`coalesce(${taken.seats}, 0)`,
		isFree: events.isFree,
		cost: events.cost,
		currency: events.currency,
		ministryAreaId: events.ministryAreaId,
		ministryAreaName: ministryAreas.name,
		organizerName: teamMembers.name
	};

	const listQuery = () =>
		db
			.select(selection)
			.from(events)
			.leftJoin(ministryAreas, eq(ministryAreas.id, events.ministryAreaId))
			.leftJoin(teamMembers, eq(teamMembers.id, events.organizerId))
			.leftJoin(taken, eq(taken.eventId, events.id));

	const [rows, [{ total }], areaOptions, typeCounts] = await Promise.all([
		listQuery().where(where).orderBy(orderBy).limit(PAGE_SIZE).offset(offset),

		db.select({ total: count() }).from(events).where(where),

		db
			.select({ id: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),

		db
			.select({ type: events.eventType, total: count() })
			.from(events)
			.where(and(...base))
			.groupBy(events.eventType)
	]);

	/* Speakers for the cards — team members and guests come back as one shape. */
	const ids = rows.map((row) => row.id);
	const speakers = ids.length
		? await db
				.select({
					id: eventSpeakers.id,
					eventId: eventSpeakers.eventId,
					name: sql<string>`coalesce(${teamMembers.name}, ${eventSpeakers.guestName})`,
					photo: sql<string | null>`coalesce(${teamMembers.photo}, ${eventSpeakers.guestPhoto})`
				})
				.from(eventSpeakers)
				.leftJoin(teamMembers, eq(teamMembers.id, eventSpeakers.teamMemberId))
				.where(inArray(eventSpeakers.eventId, ids))
				.orderBy(asc(eventSpeakers.sortOrder))
		: [];

	const list = rows.map((row) => ({
		...row,
		speakers: speakers
			.filter((s) => s.eventId === row.id && s.name)
			.slice(0, 4)
			.map(({ id, name, photo }) => ({ id, name, photo }))
	}));

	/* The next event gets the spotlight, but only on an unfiltered first page. */
	let spotlight: (typeof list)[number] | null = null;
	if (!hasFilters && currentPage === 1) {
		const [row] = await listQuery()
			.where(and(ne(events.status, 'draft'), ne(events.status, 'cancelled'), sql`${finishesAt} >= now()`))
			.orderBy(asc(events.startsAt))
			.limit(1);

		if (row) {
			spotlight = {
				...row,
				speakers: speakers
					.filter((s) => s.eventId === row.id && s.name)
					.slice(0, 4)
					.map(({ id, name, photo }) => ({ id, name, photo }))
			};
		}
	}

	return {
		events: spotlight ? list.filter((e) => e.id !== spotlight!.id) : list,
		spotlight,
		options: {
			areas: areaOptions,
			types: EVENT_TYPES.map((t) => ({
				value: t,
				total: typeCounts.find((c) => c.type === t)?.total ?? 0
			}))
		},
		filters: { q, type, when, format, area, freeOnly, sort, hasFilters },
		pagination: {
			page: currentPage,
			pageSize: PAGE_SIZE,
			total,
			pages: Math.max(1, Math.ceil(total / PAGE_SIZE))
		}
	};
};