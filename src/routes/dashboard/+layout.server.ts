import { db } from '$lib/server/db';
import {  redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import { orders, contactMessages } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	if (!locals.user) {
	
		return redirect(302, '/login');
	}

	depends('app:messages');
	const name = locals?.user?.name;

	const ordersNumber = await db
		.select({ count: count(orders.id) })
		.from(orders)
		.where(eq(orders.status, 'pending'))
		.then((rows) => rows[0]?.count ?? 0);

	const messageNumber = await db
		.select({ count: count() })
		.from(contactMessages)
		.where(eq(contactMessages.seen, false))
		.then((rows) => rows[0]?.count ?? 0);

	return {
		name,
		ordersNumber,
		messageNumber
	};
};
