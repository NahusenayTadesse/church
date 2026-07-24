import { z } from 'zod/v4';

export const eventTypes = [
	'conference',
	'workshop',
	'retreat',
	'training',
	'seminar',
	'other'
] as const;

export const eventStatuses = [
	'draft',
	'upcoming',
	'ongoing',
	'completed',
	'cancelled'
] as const;

export const currencies = ['ETB', 'USD', 'EUR', 'GBP'] as const;

/** Select options, kept here so the markup doesn't hardcode labels. */
export const eventTypeOptions = [
	{ value: 'conference', name: 'Conference' },
	{ value: 'workshop', name: 'Workshop' },
	{ value: 'retreat', name: 'Retreat' },
	{ value: 'training', name: 'Training' },
	{ value: 'seminar', name: 'Seminar' },
	{ value: 'other', name: 'Other' }
];

export const eventStatusOptions = [
	{ value: 'draft', name: 'Draft' },
	{ value: 'upcoming', name: 'Upcoming' },
	{ value: 'ongoing', name: 'Ongoing' },
	{ value: 'completed', name: 'Completed' },
	{ value: 'cancelled', name: 'Cancelled' }
];

export const currencyOptions = [
	{ value: 'ETB', name: 'ETB — Birr' },
	{ value: 'USD', name: 'USD — Dollar' },
	{ value: 'EUR', name: 'EUR — Euro' },
	{ value: 'GBP', name: 'GBP — Pound' }
];

/** Short list — extend as you need. The value is stored verbatim on the event. */
export const timezoneOptions = [
	{ value: 'Africa/Addis_Ababa', name: 'Addis Ababa (EAT)' },
	{ value: 'Africa/Nairobi', name: 'Nairobi (EAT)' },
	{ value: 'UTC', name: 'UTC' },
	{ value: 'Europe/London', name: 'London' },
	{ value: 'Europe/Berlin', name: 'Berlin' },
	{ value: 'America/New_York', name: 'New York' },
	{ value: 'America/Los_Angeles', name: 'Los Angeles' }
];

const MB = 1_000_000;

/**
 * `<input type="datetime-local">` submits `2026-09-14T09:00`, with seconds only
 * sometimes. `z.iso.datetime()` rejects both the missing offset and the missing
 * seconds, so validate the shape directly.
 */
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
const BAD_DATETIME = 'Pick a valid date and time';

const optionalDateTime = z
	.union([z.string().regex(LOCAL_DATETIME, BAD_DATETIME), z.literal('')])
	.optional();

/** An empty file input still submits a zero-byte File, so treat those as "not provided". */
const optionalFile = (maxBytes: number) =>
	z
		.file()
		.max(maxBytes)
		.optional()
		.transform((f) => (f && f.size > 0 ? f : undefined));

const before = (a?: string, b?: string) => !!a && !!b && new Date(a) < new Date(b);

export const add = z
	.object({
		name: z.string('Name is required').min(2).max(200),
		/** Unicode-aware, same as resources — Amharic titles must survive slugging. */
		slug: z
			.string('Slug is required')
			.min(2)
			.max(220)
			.regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, 'Use letters, numbers and single dashes only'),

		eventType: z.enum(eventTypes, 'Event type is required'),
		ministryArea: z.number().int().positive().optional(),

		shortDescription: z.string('A short description is required').min(1).max(255),
		fullDescription: z.string().default('').optional(),

		// Schedule
		startsAt: z.string('Start date and time is required').regex(LOCAL_DATETIME, BAD_DATETIME),
		endsAt: optionalDateTime,
		timezone: z.string().max(64).default('Africa/Addis_Ababa'),

		// Where
		isOnline: z.boolean().default(false),
		location: z.string().max(255).optional(),
		locationMapUrl: z.union([z.url('Enter a valid URL').max(500), z.literal('')]).optional(),
		onlineMeetingLink: z.union([z.url('Enter a valid URL').max(500), z.literal('')]).optional(),

		organizer: z.number().int().positive().optional(),
		/** Team member ids — guest speakers are added from the event's own page. */
		speakers: z.number().int().positive().array().optional().default([]),

		// Registration
		registrationRequired: z.boolean().default(false),
		registrationDeadline: optionalDateTime,
		maxAttendees: z.number().int().positive('Capacity must be at least 1').optional(),

		// Cost
		isFree: z.boolean().default(true),
		cost: z.number().positive('Enter an amount above zero').optional(),
		currency: z.enum(currencies).default('ETB'),

		status: z.enum(eventStatuses).default('draft'),
		isFeaturedOnHome: z.boolean().default(false),

		image: z.file('Featured Image is required').min(1, 'Featured Image is required').max(10 * MB),
		gallery: z
			.file()
			.max(10 * MB)
			.array()
			.optional(),
		/** Schedule, brochure or handout — becomes the first row in event downloads. */
		brochure: optionalFile(25 * MB)
	})
	.superRefine((data, ctx) => {
		if (data.endsAt && !before(data.startsAt, data.endsAt)) {
			ctx.addIssue({
				code: 'custom',
				path: ['endsAt'],
				message: 'The end time has to come after the start time'
			});
		}

		if (data.isOnline && !data.onlineMeetingLink) {
			ctx.addIssue({
				code: 'custom',
				path: ['onlineMeetingLink'],
				message: 'Online events need a meeting link'
			});
		}

		if (!data.isOnline && !data.location?.trim()) {
			ctx.addIssue({
				code: 'custom',
				path: ['location'],
				message: 'Add a venue, or mark the event as online'
			});
		}

		if (data.registrationRequired && data.registrationDeadline) {
			if (!before(data.registrationDeadline, data.startsAt)) {
				ctx.addIssue({
					code: 'custom',
					path: ['registrationDeadline'],
					message: 'Registration has to close before the event starts'
				});
			}
		}

		if (!data.registrationRequired && data.maxAttendees) {
			ctx.addIssue({
				code: 'custom',
				path: ['maxAttendees'],
				message: 'Turn on registration to cap attendance'
			});
		}

		if (!data.isFree && !data.cost) {
			ctx.addIssue({
				code: 'custom',
				path: ['cost'],
				message: 'Enter the cost, or mark the event as free'
			});
		}
	});