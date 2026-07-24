import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';

import { edit, addSocial } from './schema';

import { db } from '$lib/server/db';
import {
	teamMembers,
	teamMemberAreas,
	teamMemberSocials,
	ministryAreas,
	blog,
	books,
	events,
	eventSpeakers,
	projects,
	prayerRequests,
	user
} from '$lib/server/db/schema';
import { eq, and, ne, asc, desc, count, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import type { LayoutServerLoad } from './$types';

const account = alias(user, 'account');
const creator = alias(user, 'creator');
const editor = alias(user, 'editor');

export const load: LayoutServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!Number.isInteger(id)) error(400, 'Invalid team member id');

	const member = await db
		.select({
			...getTableColumns(teamMembers),
			accountName: account.name,
			accountEmail: account.email,
			createdByName: creator.name,
			updatedByName: editor.name
		})
		.from(teamMembers)
		.leftJoin(account, eq(teamMembers.userId, account.id))
		.leftJoin(creator, eq(teamMembers.createdBy, creator.id))
		.leftJoin(editor, eq(teamMembers.updatedBy, editor.id))
		.where(eq(teamMembers.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!member) error(404, 'Team member not found');

	const areas = await db
		.select({ id: ministryAreas.id, name: ministryAreas.name })
		.from(teamMemberAreas)
		.innerJoin(ministryAreas, eq(teamMemberAreas.ministryAreaId, ministryAreas.id))
		.where(eq(teamMemberAreas.teamMemberId, id))
		.orderBy(asc(ministryAreas.name));

	const allAreas = await db
		.select({ id: ministryAreas.id, name: ministryAreas.name })
		.from(ministryAreas)
		.orderBy(asc(ministryAreas.name));

	const socials = await db
		.select()
		.from(teamMemberSocials)
		.where(eq(teamMemberSocials.teamMemberId, id))
		.orderBy(asc(teamMemberSocials.sortOrder), asc(teamMemberSocials.id));

	/**
	 * Seven tables point at team_members with no onDelete rule, so MySQL will
	 * refuse the delete. Load what's attached so the page can say what's blocking
	 * it instead of surfacing a raw constraint error.
	 */
	const [authored, spoken, organized, speakingAt, led, wrote, prayer] = await Promise.all([
		db
			.select({ id: blog.id, title: blog.title, status: blog.status, kind: blog.resourceType })
			.from(blog)
			.where(eq(blog.authorId, id))
			.orderBy(desc(blog.publishedAt))
			.limit(50),
		db
			.select({ id: blog.id, title: blog.title, status: blog.status, kind: blog.resourceType })
			.from(blog)
			.where(and(eq(blog.speakerId, id), ne(blog.authorId, id)))
			.orderBy(desc(blog.publishedAt))
			.limit(50),
		db
			.select({ id: events.id, name: events.name, startsAt: events.startsAt, status: events.status })
			.from(events)
			.where(eq(events.organizerId, id))
			.orderBy(desc(events.startsAt))
			.limit(50),
		db
			.select({
				id: events.id,
				name: events.name,
				startsAt: events.startsAt,
				status: events.status,
				role: eventSpeakers.role
			})
			.from(eventSpeakers)
			.innerJoin(events, eq(eventSpeakers.eventId, events.id))
			.where(eq(eventSpeakers.teamMemberId, id))
			.orderBy(desc(events.startsAt))
			.limit(50),
		db
			.select({ id: projects.id, name: projects.name, status: projects.status })
			.from(projects)
			.where(eq(projects.leaderId, id))
			.orderBy(asc(projects.name))
			.limit(50),
		db
			.select({ id: books.id, title: books.title, status: books.status })
			.from(books)
			.where(eq(books.authorId, id))
			.orderBy(asc(books.title))
			.limit(50),
		db
			.select({ n: count() })
			.from(prayerRequests)
			.where(eq(prayerRequests.assignedToId, id))
			.then((r) => r[0]?.n ?? 0)
	]);

	const blockingCount =
		authored.length + spoken.length + organized.length + speakingAt.length + led.length + wrote.length + prayer;

	/* Accounts that aren't already claimed by another profile. */
	const accountOptions = await db
		.select({ value: user.id, name: user.name, email: user.email })
		.from(user)
		.orderBy(asc(user.name))
		.limit(500);

	const [form, socialForm] = await Promise.all([
		superValidate(member, zod4(edit)),
		superValidate(zod4(addSocial))
	]);

	return {
		member,
		areas,
		allAreas,
		socials,
		involvement: { authored, spoken, organized, speakingAt, led, wrote, prayerCount: prayer },
		blockingCount,
		accountOptions,
		form,
		socialForm
	};
};
