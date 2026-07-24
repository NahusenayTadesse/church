import { db } from '$lib/server/db';
import {
	user,
	roles,
	blog,
	blogCategories,

	testimonials
} from '$lib/server/db/schema';
import { eq, getTableColumns } from 'drizzle-orm';
import { loadFlash } from 'sveltekit-flash-message/server';

export const load = loadFlash(async ({locals}) => {
	const currentUser = locals?.user;
	let roleName = ''; // Initialize with a default value

	// 1. Fetch the role name if a user exists
	if (currentUser) {
		const roleData = await db
			.select({ name: roles.name })
			.from(user)
			.leftJoin(roles, eq(user.roleId, roles.id))
			.where(eq(user.id, currentUser.id))
			.then((rows) => rows[0]);

		roleName = roleData?.name ?? '';
	}


	




	

	const blogItems = await db
		.select({
			...getTableColumns(blog),
			category: blogCategories.name
		})
		.from(blog)
		.leftJoin(blogCategories, eq(blog.categoryId, blogCategories.id));

	return {
		roleName,
		blogItems,

	}
});
