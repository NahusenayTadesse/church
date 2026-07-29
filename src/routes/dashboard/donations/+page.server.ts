import { fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { eq, desc, sql } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { donations, donationCauses, projects, transactions, paymentAccounts } from '$lib/server/db/schema';

import { markReceiptSent, updateDonationStatus, deleteDonation } from './schema';

import type { PageServerLoad, Actions } from './$types';

/** Statuses that count toward a cause/project raised total. */
const COUNTS_AS_RAISED = ['completed'];

export const load: PageServerLoad = async () => {
	const allDonations = await db
		.select({
			id: donations.id,
			donorName: donations.donorName,
			donorEmail: donations.donorEmail,
			donorPhone: donations.donorPhone,
			isAnonymous: donations.isAnonymous,

			amount: donations.amount,
			currency: donations.currency,

			causeId: donations.causeId,
			causeName: donationCauses.name,
			projectId: donations.projectId,
			projectName: projects.name,

			isRecurring: donations.isRecurring,
			recurrenceInterval: donations.recurrenceInterval,
			nextChargeAt: donations.nextChargeAt,

			message: donations.message,
			status: donations.status,
			receiptSentAt: donations.receiptSentAt,
			createdAt: donations.createdAt,
			paymentAccount: donations.paymentAccount,
			paymentAccountId: donations.paymentAccountId,
			bank: paymentAccounts.bankName,
			currentAccount: paymentAccounts.accountNumber,


			transactionId: donations.transactionId,
			txnRef: transactions.txnRef,
			paymentStatus: transactions.paymentStatus
		})
		.from(donations)
		.leftJoin(donationCauses, eq(donations.causeId, donationCauses.id))
		.leftJoin(paymentAccounts, eq(donations.paymentAccountId, paymentAccounts.id))
		.leftJoin(projects, eq(donations.projectId, projects.id))
		.leftJoin(transactions, eq(donations.transactionId, transactions.id))
		.orderBy(desc(donations.createdAt));

	return {
		allDonations,
		receiptForm: await superValidate(zod4(markReceiptSent)),
		statusForm: await superValidate(zod4(updateDonationStatus)),
		deleteForm: await superValidate(zod4(deleteDonation))
	};
};

export const actions: Actions = {
	/** Stamps receiptSentAt. Hook your mailer in where marked. */
	receipt: async ({ request }) => {
		const form = await superValidate(request, zod4(markReceiptSent));
		if (!form.valid) return fail(400, { form });

		const [donation] = await db
			.select({
				id: donations.id,
				donorEmail: donations.donorEmail,
				receiptSentAt: donations.receiptSentAt
			})
			.from(donations)
			.where(eq(donations.id, form.data.id))
			.limit(1);

		if (!donation) return message(form, { type: 'error', text: 'Donation not found' }, { status: 404 });
		if (!donation.donorEmail)
			return message(form, { type: 'error', text: 'This donation has no donor email' }, { status: 400 });
		if (donation.receiptSentAt)
			return message(form, { type: 'error', text: 'Receipt already sent' }, { status: 400 });

		try {
			// await sendReceiptEmail(donation);  <-- your mailer here

			await db
				.update(donations)
				.set({ receiptSentAt: new Date() })
				.where(eq(donations.id, form.data.id));
		} catch (e) {
			console.error(e);
			return message(form, { type: 'error', text: 'Could not send the receipt' }, { status: 500 });
		}

		return message(form, { type: 'success', text: 'Receipt sent' });
	},

	/**
	 * Updates the donation status and keeps the cause / project running totals
	 * in step. Delete the totals block if you'd rather recompute those with a
	 * SUM() query on read.
	 */
	updateStatus: async ({ request }) => {
		const form = await superValidate(request, zod4(updateDonationStatus));
		if (!form.valid) return fail(400, { form });

		const [donation] = await db
			.select({
				id: donations.id,
				amount: donations.amount,
				status: donations.status,
				causeId: donations.causeId,
				projectId: donations.projectId,
				transactionId: donations.transactionId
			})
			.from(donations)
			.where(eq(donations.id, form.data.id))
			.limit(1);

		if (!donation) return message(form, { type: 'error', text: 'Donation not found' }, { status: 404 });
		if (donation.status === form.data.status)
			return message(form, { type: 'error', text: 'Status unchanged' }, { status: 400 });

		const wasCounted = COUNTS_AS_RAISED.includes(donation.status ?? '');
		const isCounted = COUNTS_AS_RAISED.includes(form.data.status);
		// +1 when it starts counting, -1 when it stops, 0 when nothing changes.
		const direction = Number(isCounted) - Number(wasCounted);

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(donations)
					.set({ status: form.data.status })
					.where(eq(donations.id, donation.id));

				// Mirror onto the transaction row so receipts/reports agree.
				if (donation.transactionId) {
					const paymentStatus =
						form.data.status === 'completed'
							? 'paid'
							: form.data.status === 'refunded'
								? 'refunded'
								: form.data.status === 'pending'
									? 'pending'
									: 'unpaid';

					await tx
						.update(transactions)
						.set({ paymentStatus })
						.where(eq(transactions.id, donation.transactionId));
				}

				if (direction !== 0) {
					const delta = sql`${direction} * ${donation.amount}`;

					if (donation.causeId) {
						await tx
							.update(donationCauses)
							.set({ raisedAmount: sql`GREATEST(${donationCauses.raisedAmount} + ${delta}, 0)` })
							.where(eq(donationCauses.id, donation.causeId));
					}

					if (donation.projectId) {
						await tx
							.update(projects)
							.set({ fundingRaised: sql`GREATEST(${projects.fundingRaised} + ${delta}, 0)` })
							.where(eq(projects.id, donation.projectId));
					}
				}
			});
		} catch (e) {
			console.error(e);
			return message(form, { type: 'error', text: 'Could not update the status' }, { status: 500 });
		}

		return message(form, { type: 'success', text: `Marked as ${form.data.status}` });
	},

	delete: async ({ request }) => {
		const form = await superValidate(request, zod4(deleteDonation));
		if (!form.valid) return fail(400, { form });

		const [donation] = await db
			.select({
				id: donations.id,
				amount: donations.amount,
				status: donations.status,
				causeId: donations.causeId,
				projectId: donations.projectId
			})
			.from(donations)
			.where(eq(donations.id, form.data.id))
			.limit(1);

		if (!donation) return message(form, { type: 'error', text: 'Donation not found' }, { status: 404 });

		try {
			await db.transaction(async (tx) => {
				// Wind back the totals if this one was counting toward them.
				if (COUNTS_AS_RAISED.includes(donation.status ?? '')) {
					if (donation.causeId) {
						await tx
							.update(donationCauses)
							.set({
								raisedAmount: sql`GREATEST(${donationCauses.raisedAmount} - ${donation.amount}, 0)`
							})
							.where(eq(donationCauses.id, donation.causeId));
					}

					if (donation.projectId) {
						await tx
							.update(projects)
							.set({
								fundingRaised: sql`GREATEST(${projects.fundingRaised} - ${donation.amount}, 0)`
							})
							.where(eq(projects.id, donation.projectId));
					}
				}

				await tx.delete(donations).where(eq(donations.id, donation.id));
			});
		} catch (e) {
			console.error(e);
			return message(form, { type: 'error', text: 'Could not delete the donation' }, { status: 500 });
		}

		return message(form, { type: 'success', text: 'Donation deleted' });
	}
};