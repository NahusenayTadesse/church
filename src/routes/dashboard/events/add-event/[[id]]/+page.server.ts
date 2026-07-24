import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { and, asc, eq, like } from 'drizzle-orm';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

import { add } from './schema';
import { db } from '$lib/server/db';
import {
	events,
	eventSpeakers,
	eventGallery,
	eventDownloads,
	ministryAreas,
	teamMembers
} from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(add));

	const [areas, people, speakers] = await Promise.all([
		db
			.select({ value: ministryAreas.id, name: ministryAreas.name })
			.from(ministryAreas)
			.orderBy(asc(ministryAreas.name)),
		db
			.select({ value: teamMembers.id, name: teamMembers.name })
			.from(teamMembers)
			.where(eq(teamMembers.isPublished, true))
			.orderBy(asc(teamMembers.name)),
		// Only people flagged as speakers — guests are added from the event's own page.
		db
			.select({ value: teamMembers.id, name: teamMembers.name })
			.from(teamMembers)
			.where(and(eq(teamMembers.isPublished, true), eq(teamMembers.isSpeaker, true)))
			.orderBy(asc(teamMembers.name))
	]);

	return { form, areas, people, speakers };
};

/** Slug is unique, so walk until a free one turns up rather than always appending `-1`. */
const ensureUniqueSlug = async (base: string) => {
	const taken = await db
		.select({ slug: events.slug })
		.from(events)
		.where(like(events.slug, `${base}%`));

	const used = new Set(taken.map((r) => r.slug));
	if (!used.has(base)) return base;

	let n = 2;
	while (used.has(`${base}-${n}`)) n++;
	return `${base}-${n}`;
};

const uploadGallery = async (files: File[] | undefined) => {
	const valid = (files ?? []).filter((f) => f && f.size > 0);
	if (valid.length === 0) return [];

	return Promise.all(valid.map((file) => saveUploadedFile(file)));
};

/**
 * `starts_at` is a naive `datetime` column and the event carries its own
 * `timezone`, so the value stored should be the wall clock the admin typed.
 * `new Date('2026-09-14T09:00')` is parsed in the *server's* timezone — fine
 * while the server runs on Africa/Addis_Ababa, off by hours if it runs on UTC.
 * Switching the column to `datetime('starts_at', { mode: 'string' })` removes
 * the problem entirely; then pass `value` straight through instead.
 */
const toDateTime = (value: string) => new Date(value.length === 16 ? `${value}:00` : value);

const fileTypeFor = (name: string) => {
	const ext = name.split('.').pop()?.toLowerCase() ?? '';
	if (ext === 'pdf') return 'pdf' as const;
	if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'doc' as const;
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) return 'image' as const;
	if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) return 'audio' as const;
	if (['mp4', 'mov', 'webm', 'mkv'].includes(ext)) return 'video' as const;
	return 'other' as const;
};

export const actions: Actions = {
	addEvent: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const {
			name,
			slug,
			eventType,
			ministryArea,
			shortDescription,
			fullDescription,
			startsAt,
			endsAt,
			timezone,
			isOnline,
			location,
			locationMapUrl,
			onlineMeetingLink,
			organizer,
			speakers: speakerIds,
			registrationRequired,
			registrationDeadline,
			maxAttendees,
			isFree,
			cost,
			currency,
			status,
			isFeaturedOnHome,
			image,
			gallery,
			brochure
		} = form.data;

		let eventId: number;

		try {
			// Uploads run before the transaction opens — no point holding a DB
			// connection while files stream to disk.
			const [featuredImage, galleryImages, brochureUrl] = await Promise.all([
				saveUploadedFile(image),
				uploadGallery(gallery),
				brochure ? saveUploadedFile(brochure) : Promise.resolve(null)
			]);

			const newSlug = await ensureUniqueSlug(slug);

			eventId = await db.transaction(async (tx) => {
				const [row] = await tx
					.insert(events)
					.values({
						name,
						slug: newSlug,
						eventType,
						ministryAreaId: ministryArea ?? null,
						shortDescription,
						fullDescription: fullDescription || null,

						startsAt: toDateTime(startsAt),
						endsAt: endsAt ? toDateTime(endsAt) : null,
						timezone,

						isOnline,
						location: location || null,
						locationMapUrl: locationMapUrl || null,
						onlineMeetingLink: isOnline ? onlineMeetingLink || null : null,

						organizerId: organizer ?? null,

						registrationRequired,
						// A deadline or a cap on an event with registration turned off
						// would never be read, so don't store one.
						registrationDeadline:
							registrationRequired && registrationDeadline
								? toDateTime(registrationDeadline)
								: null,
						maxAttendees: registrationRequired ? (maxAttendees ?? null) : null,

						isFree,
						cost: isFree ? null : String(cost),
						currency,

						status,
						isFeaturedOnHome,
						featuredImage,
						createdBy: locals?.user?.id
					})
					.$returningId();

				if (galleryImages.length > 0) {
					await tx.insert(eventGallery).values(
						galleryImages.map((url, i) => ({
							eventId: row.id,
							imageUrl: url,
							sortOrder: i
						}))
					);
				}

				// Dedupe — a double-submitted checkbox would otherwise insert twice.
				const uniqueSpeakers = [...new Set(speakerIds ?? [])];

				if (uniqueSpeakers.length > 0) {
					await tx.insert(eventSpeakers).values(
						uniqueSpeakers.map((teamMemberId, i) => ({
							eventId: row.id,
							teamMemberId,
							role: 'speaker' as const,
							sortOrder: i
						}))
					);
				}

				if (brochureUrl && brochure) {
					await tx.insert(eventDownloads).values({
						eventId: row.id,
						// Filename minus extension reads better than "Attachment 1".
						title: brochure.name.replace(/\.[^.]+$/, '').slice(0, 200),
						fileUrl: brochureUrl,
						fileType: fileTypeFor(brochure.name),
						fileSize: brochure.size,
						sortOrder: 0
					});
				}

				return row.id;
			});
		} catch (err) {
			console.error('Failed to add event:', err);
			return message(
				form,
				{ type: 'error', text: 'An error occurred while adding the event.' },
				{ status: 500 }
			);
		}

		// `redirect` throws, so it stays outside the try block.
		redirect(
			`/dashboard/events/single/${eventId}`,
			{ type: 'success', message: 'New event successfully added' },
			cookies
		);
	}
};