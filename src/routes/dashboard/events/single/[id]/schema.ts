import { z } from 'zod/v4';

/* Mirrors the mysqlEnum values on the events tables. */
export const eventTypes = [
	'conference',
	'workshop',
	'retreat',
	'training',
	'seminar',
	'other'
] as const;

export const eventStatuses = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'] as const;
export const speakerRoles = ['speaker', 'host', 'panelist', 'facilitator'] as const;
export const downloadTypes = ['pdf', 'doc', 'image', 'audio', 'video', 'other'] as const;
export const registrationStatuses = [
	'pending',
	'confirmed',
	'waitlisted',
	'cancelled',
	'attended',
	'no_show'
] as const;

/* Statuses that hold a seat. Used for the capacity maths on both sides. */
export const HOLDS_A_SEAT = ['pending', 'confirmed', 'attended'] as const;

/* ── helpers (same set as blog/books — worth moving to $lib/schemaHelpers.ts) ── */

const nullableId = z
	.union([z.number().int().positive(), z.literal(''), z.null(), z.undefined()])
	.transform((v) => (typeof v === 'number' ? v : null));

const nullableNumber = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.number()])
	.transform((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null));

const nullableInt = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(1)])
	.transform((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null));

const nullableText = (max: number) =>
	z
		.union([z.string().max(max), z.literal(''), z.null(), z.undefined()])
		.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

const nullableUrl = (max: number) =>
	z
		.union([
			z.url('Enter a full URL, including https://').max(max),
			z.literal(''),
			z.null(),
			z.undefined()
		])
		.transform((v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null));

const nullableDate = z
	.union([z.literal(''), z.null(), z.undefined(), z.coerce.date()])
	.transform((v) => (v instanceof Date ? v : null));

/* ── event ─────────────────────────────────────────────────────────────── */

export const edit = z
	.object({
		name: z.string('Name is required').min(2).max(200),
		slug: z
			.string('Slug is required')
			.min(2)
			.max(220)
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only'),
		shortDescription: nullableText(255),
		fullDescription: z.string('Description is required').min(2),
		eventType: z.enum(eventTypes),
		ministryAreaId: nullableId,

		startsAt: z.coerce.date('Start date is required'),
		endsAt: nullableDate,
		timezone: z.string().max(64).default('Africa/Addis_Ababa'),

		isOnline: z.boolean().default(false),
		location: nullableText(255),
		locationMapUrl: nullableUrl(500),
		onlineMeetingLink: nullableUrl(500),

		organizerId: nullableId,

		registrationRequired: z.boolean().default(false),
		registrationDeadline: nullableDate,
		maxAttendees: nullableInt,

		isFree: z.boolean().default(true),
		cost: nullableNumber,
		currency: z.string().length(3).default('ETB'),

		status: z.enum(eventStatuses).default('draft'),
		isFeaturedOnHome: z.boolean().default(false),

		image: z.file('Featured image is required').max(10000000).optional()
	})
	.refine((d) => !d.endsAt || d.endsAt > d.startsAt, {
		message: 'The end time has to come after the start time',
		path: ['endsAt']
	})
	.refine((d) => !d.registrationDeadline || d.registrationDeadline <= d.startsAt, {
		message: 'Registration has to close on or before the event starts',
		path: ['registrationDeadline']
	})
	.refine((d) => d.isFree || (d.cost !== null && d.cost > 0), {
		message: 'Set a cost, or mark the event free',
		path: ['cost']
	})
	.refine((d) => !d.isOnline || !!d.onlineMeetingLink, {
		message: 'Online events need a meeting link',
		path: ['onlineMeetingLink']
	})
	.refine((d) => d.isOnline || !!d.location, {
		message: 'In-person events need a location',
		path: ['location']
	});

/* ── gallery ───────────────────────────────────────────────────────────── */

export const editGallery = z.object({
	existing: z.array(z.string()).default([]),
	gallery: z.file().max(10000000).array().optional()
});

/* ── speakers ──────────────────────────────────────────────────────────── */

export const addSpeaker = z
	.object({
		teamMemberId: nullableId,
		guestName: nullableText(150),
		guestTitle: nullableText(150),
		guestBio: nullableText(500),
		role: z.enum(speakerRoles).default('speaker'),
		sortOrder: z.coerce.number().int().min(0).default(0),
		photo: z.file().max(10000000).optional()
	})
	.refine((d) => !!d.teamMemberId || !!d.guestName, {
		message: 'Pick a team member, or type a guest name',
		path: ['guestName']
	});

export const editSpeaker = z
	.object({
		id: z.coerce.number().int().positive(),
		teamMemberId: nullableId,
		guestName: nullableText(150),
		guestTitle: nullableText(150),
		guestBio: nullableText(500),
		role: z.enum(speakerRoles).default('speaker'),
		sortOrder: z.coerce.number().int().min(0).default(0),
		photo: z.file().max(10000000).optional()
	})
	.refine((d) => !!d.teamMemberId || !!d.guestName, {
		message: 'Pick a team member, or type a guest name',
		path: ['guestName']
	});

/* ── downloads ─────────────────────────────────────────────────────────── */

export const addDownload = z.object({
	title: z.string('Title is required').min(2).max(200),
	fileType: z.enum(downloadTypes).default('pdf'),
	sortOrder: z.coerce.number().int().min(0).default(0),
	file: z.file('Pick a file to upload').max(50000000)
});

/* ── registrations ─────────────────────────────────────────────────────── */

export const addRegistration = z.object({
	name: z.string('Name is required').min(2).max(150),
	email: z.email('Enter a valid email').max(100),
	phone: nullableText(20),
	organization: nullableText(150),
	seats: z.coerce.number().int().min(1).default(1),
	status: z.enum(registrationStatuses).default('confirmed'),
	notes: nullableText(255)
});

export const setRegistrationStatus = z.object({
	id: z.coerce.number().int().positive(),
	status: z.enum(registrationStatuses)
});

export type Edit = typeof edit;
export type EditGallery = typeof editGallery;
export type AddSpeaker = typeof addSpeaker;
export type AddDownload = typeof addDownload;
export type AddRegistration = typeof addRegistration;