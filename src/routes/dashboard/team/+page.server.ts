import { db } from '$lib/server/db';
import {
	teamMembers,
	teamMemberAreas,
	teamMemberSocials,
	ministryAreas,
	blog,
	events,
	projects,
	books,
	prayerRequests
} from '$lib/server/db/schema';
import { eq, asc, sql, count } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: teamMembers.id,
			userId: teamMembers.userId,
			name: teamMembers.name,
			photo: teamMembers.photo,
			position: teamMembers.position,
			biography: teamMembers.biography,
			email: teamMembers.email,
			phone: teamMembers.phone,
			isExecutive: teamMembers.isExecutive,
			isSpeaker: teamMembers.isSpeaker,
			isPublished: teamMembers.isPublished,
			sortOrder: teamMembers.sortOrder,
			createdAt: teamMembers.createdAt
		})
		.from(teamMembers)
		// same order the public team page uses
		.orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name));

	// Areas and socials are many-per-member, so they're grouped on their own.
	const areaRows = await db
		.select({
			teamMemberId: teamMemberAreas.teamMemberId,
			areaCount: count(teamMemberAreas.id),
			areaNames: sql<string>`group_concat(distinct ${ministryAreas.name} separator ', ')`
		})
		.from(teamMemberAreas)
		.leftJoin(ministryAreas, eq(teamMemberAreas.ministryAreaId, ministryAreas.id))
		.groupBy(teamMemberAreas.teamMemberId);

	const socialRows = await db
		.select({
			teamMemberId: teamMemberSocials.teamMemberId,
			socialCount: count(teamMemberSocials.id),
			platforms: sql<string>`group_concat(distinct ${teamMemberSocials.platform} separator ', ')`
		})
		.from(teamMemberSocials)
		.groupBy(teamMemberSocials.teamMemberId);

	// Workload / attachment counts.
	const authoredRows = await db
		.select({ authorId: blog.authorId, authored: count(blog.id) })
		.from(blog)
		.groupBy(blog.authorId);

	const spokeRows = await db
		.select({ speakerId: blog.speakerId, spoke: count(blog.id) })
		.from(blog)
		.groupBy(blog.speakerId);

	const eventRows = await db
		.select({ organizerId: events.organizerId, organized: count(events.id) })
		.from(events)
		.groupBy(events.organizerId);

	const projectRows = await db
		.select({
			leaderId: projects.leaderId,
			led: count(projects.id),
			activeLed: sql<number>`sum(case when ${projects.status} = 'active' then 1 else 0 end)`
		})
		.from(projects)
		.groupBy(projects.leaderId);

	const bookRows = await db
		.select({ authorId: books.authorId, booksWritten: count(books.id) })
		.from(books)
		.groupBy(books.authorId);

	const prayerRows = await db
		.select({
			assignedToId: prayerRequests.assignedToId,
			assigned: count(prayerRequests.id),
			openPrayers: sql<number>`sum(case when ${prayerRequests.status} in ('new','reviewed') then 1 else 0 end)`
		})
		.from(prayerRequests)
		.groupBy(prayerRequests.assignedToId);

	const areaMap = new Map(areaRows.map((r) => [r.teamMemberId, r]));
	const socialMap = new Map(socialRows.map((r) => [r.teamMemberId, r]));
	const authoredMap = new Map(authoredRows.map((r) => [r.authorId, r.authored]));
	const spokeMap = new Map(spokeRows.map((r) => [r.speakerId, r.spoke]));
	const eventMap = new Map(eventRows.map((r) => [r.organizerId, r.organized]));
	const projectMap = new Map(projectRows.map((r) => [r.leaderId, r]));
	const bookMap = new Map(bookRows.map((r) => [r.authorId, r.booksWritten]));
	const prayerMap = new Map(prayerRows.map((r) => [r.assignedToId, r]));

	const teamList = rows.map((m) => {
		const a = areaMap.get(m.id);
		const s = socialMap.get(m.id);
		const p = projectMap.get(m.id);
		const pr = prayerMap.get(m.id);

		const authored = authoredMap.get(m.id) ?? 0;
		const spoke = spokeMap.get(m.id) ?? 0;
		const organized = eventMap.get(m.id) ?? 0;
		const booksWritten = bookMap.get(m.id) ?? 0;
		const led = Number(p?.led ?? 0);
		const assigned = Number(pr?.assigned ?? 0);

		const attachments = authored + spoke + organized + led + booksWritten + assigned;

		const roles = [
			m.isExecutive && 'executive',
			m.isSpeaker && 'speaker',
			!m.isExecutive && !m.isSpeaker && 'staff'
		].filter(Boolean) as string[];

		return {
			...m,
			areaCount: Number(a?.areaCount ?? 0),
			areaNames: a?.areaNames ?? null,
			socialCount: Number(s?.socialCount ?? 0),
			platforms: s?.platforms ?? null,

			authored,
			spoke,
			organized,
			booksWritten,
			projectsLed: led,
			activeProjectsLed: Number(p?.activeLed ?? 0),
			prayersAssigned: assigned,
			openPrayers: Number(pr?.openPrayers ?? 0),

			// nonzero means a delete will be blocked by a foreign key
			attachments,

			// Filter chips
			roles,
			roleLabel: roles.join(', '),
			visibility: m.isPublished ? 'published' : 'hidden',
			account: m.userId ? 'has login' : 'no login',
			hasPhoto: m.photo ? 'has photo' : 'no photo',
			// a published profile with nothing to show is worth spotting
			profileComplete: !!(m.photo && m.position && m.biography)
		};
	});

	return { teamList };
};

export const actions: Actions = {
	/**
	 * Most of the references to a team member are plain `references()` with no
	 * cascade or set-null, so this fails while any content still points here.
	 * Unpublishing is the usual move for someone who's left.
	 */
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { message: 'Missing team member id' });

		try {
			await db.delete(teamMembers).where(eq(teamMembers.id, id));
			return { success: true, message: 'Team member deleted' };
		} catch {
			return fail(500, {
				message:
					'Could not delete — this person is still attached to resources, events, projects or books. Hide the profile instead.'
			});
		}
	},

	togglePublished: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing team member id' });

		await db.update(teamMembers).set({ isPublished: !value }).where(eq(teamMembers.id, id));
		return { success: true };
	},

	toggleExecutive: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing team member id' });

		await db.update(teamMembers).set({ isExecutive: !value }).where(eq(teamMembers.id, id));
		return { success: true };
	},

	toggleSpeaker: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const value = form.get('value') === 'true';
		if (!id) return fail(400, { message: 'Missing team member id' });

		await db.update(teamMembers).set({ isSpeaker: !value }).where(eq(teamMembers.id, id));
		return { success: true };
	},

	updateSortOrder: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const sortOrder = Number(form.get('sortOrder'));
		if (!id) return fail(400, { message: 'Missing team member id' });
		if (!Number.isInteger(sortOrder)) return fail(400, { message: 'Sort order must be a number' });

		await db.update(teamMembers).set({ sortOrder }).where(eq(teamMembers.id, id));
		return { success: true, message: 'Order updated' };
	}
};