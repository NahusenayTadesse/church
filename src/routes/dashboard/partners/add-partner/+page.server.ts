import { superValidate, message, setError } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { eq, max } from 'drizzle-orm';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

import { add } from './schema';
import { db } from '$lib/server/db';
import { partners } from '$lib/server/db/schema';
import { saveUploadedFile } from '$lib/server/upload.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Land new partners at the end of the list instead of stacking them all on 0,
	// where the order comes down to whatever the database feels like returning.
	const [{ highest } = { highest: null }] = await db
		.select({ highest: max(partners.sortOrder) })
		.from(partners);

	const form = await superValidate({ sortOrder: Number(highest ?? -1) + 1 }, zod4(add), {
		errors: false
	});

	return { form };
};

/** MySQL's duplicate-key error, for the gap between checking and inserting. */
const isDuplicate = (err: unknown) =>
	typeof err === 'object' && err !== null && (err as { errno?: number }).errno === 1062;

export const actions: Actions = {
	addPartner: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const { name, partnershipType, description, about, website, logo, showOnHome, sortOrder } =
			form.data;

		// Check before inserting so a repeated name reads as a form error rather
		// than a failed save. Under MySQL's default collation this comparison is
		// case-insensitive, which matches how the unique index behaves.
		const [existing] = await db
			.select({ id: partners.id })
			.from(partners)
			.where(eq(partners.name, name))
			.limit(1);

		if (existing) {
			return setError(form, 'name', 'A partner with this name already exists');
		}

		let partnerId: number;

		try {
			const logoUrl = logo ? await saveUploadedFile(logo) : null;

			const [row] = await db
				.insert(partners)
				.values({
					name,
					logo: logoUrl,
					description: description || null,
					about: about || null,
					website: website || null,
					partnershipType,
					showOnHome,
					sortOrder,
					createdBy: locals?.user?.id
				})
				.$returningId();

			partnerId = row.id;
		} catch (err) {
			// Two people can pass the check above at the same time; the index is
			// what actually settles it.
			if (isDuplicate(err)) {
				return setError(form, 'name', 'A partner with this name already exists');
			}

			console.error('Failed to add partner:', err);
			return message(
				form,
				{ type: 'error', text: 'An error occurred while adding the partner.' },
				{ status: 500 }
			);
		}

		// `redirect` throws, so it stays outside the try block.
		redirect(
			`/dashboard/partners/single/${partnerId}`,
			{ type: 'success', message: 'New partner successfully added' },
			cookies
		);
	}
};