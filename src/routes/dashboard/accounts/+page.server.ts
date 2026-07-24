import { setError, superValidate, message, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';

import {
	paymentAccount as schema,
	editPaymentAccount as editSchema,
	deletePaymentAccount
} from './schema.js';
import { db } from '$lib/server/db';
import { paymentAccounts, paymentMethods, user } from '$lib/server/db/schema';
import type { Actions } from './$types.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(schema));
	const editForm = await superValidate(zod4(editSchema));
	const deleteForm = await superValidate(zod4(deletePaymentAccount));

	const allPaymentAccounts = await db
		.select({
			id: paymentAccounts.id,
			paymentMethodId: paymentAccounts.paymentMethodId,
			paymentMethodName: paymentMethods.name,
			accountName: paymentAccounts.accountName,
			accountNumber: paymentAccounts.accountNumber,
			bankName: paymentAccounts.bankName,
			branch: paymentAccounts.branch,
			swiftCode: paymentAccounts.swiftCode,
			currency: paymentAccounts.currency,
			instructions: paymentAccounts.instructions,
			sortOrder: paymentAccounts.sortOrder,
			isActive: paymentAccounts.isActive,
			createdBy: user.name,
			createdById: paymentAccounts.createdBy
		})
		.from(paymentAccounts)
		.leftJoin(paymentMethods, eq(paymentMethods.id, paymentAccounts.paymentMethodId))
		.leftJoin(user, eq(user.id, paymentAccounts.createdBy));

	const allPaymentMethodOptions = await db
		.select({ id: paymentMethods.id, name: paymentMethods.name })
		.from(paymentMethods);

	return {
		form,
		editForm,
		deleteForm,
		allPaymentAccounts,
		allPaymentMethodOptions
	};
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(schema));

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for Errors' });
		}

		const {
			paymentMethodId,
			accountName,
			accountNumber,
			bankName,
			branch,
			swiftCode,
			currency,
			instructions,
			sortOrder
		} = form.data;

		try {
			await db.insert(paymentAccounts).values({
				paymentMethodId,
				accountName,
				accountNumber,
				bankName,
				branch,
				swiftCode,
				currency,
				instructions,
				sortOrder,
				createdBy: locals.user?.id
			});

			return message(form, { type: 'success', text: 'Payment Account Successfully Created' });
		} catch (err: any) {
			return message(
				form,
				{ type: 'error', text: 'Error while creating payment account.' },
				{ status: 500 }
			);
		}
	},
	edit: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(editSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const {
			id,
			paymentMethodId,
			accountName,
			accountNumber,
			bankName,
			branch,
			swiftCode,
			currency,
			instructions,
			sortOrder
		} = form.data;

		try {
			await db
				.update(paymentAccounts)
				.set({
					paymentMethodId,
					accountName,
					accountNumber,
					bankName,
					branch,
					swiftCode,
					currency,
					instructions,
					sortOrder,
					updatedBy: locals?.user?.id
				})
				.where(eq(paymentAccounts.id, id));
			return message(form, { type: 'success', text: 'Payment Account Successfully Updated' });
		} catch (err: any) {
			return message(
				form,
				{ type: 'error', text: 'Error while updating payment account.' },
				{ status: 500 }
			);
		}
	},
	delete: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(deletePaymentAccount));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { id } = form.data;

		try {
			await db.delete(paymentAccounts).where(eq(paymentAccounts.id, id));
			return message(form, { type: 'success', text: 'Payment Account Successfully Deleted' });
		} catch (err: any) {
			return message(
				form,
				{ type: 'error', text: 'Error while deleting payment account.' },
				{ status: 500 }
			);
		}
	}
};