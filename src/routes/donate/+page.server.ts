import { and, asc, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { db } from '$lib/server/db';
import {
	donationCauses,
	donationPresets,
	donations,
	paymentAccounts,
	paymentMethods,
	projects,
	ministryAreas,
	transactions
} from '$lib/server/db/schema';
import { donateSchema } from './schema';
import type { PageServerLoad, Actions } from './$types';

/* -------------------------------------------------------------------------- */
/* load                                                                        */
/* -------------------------------------------------------------------------- */

export const load: PageServerLoad = async ({ url }) => {
	const requestedCause = url.searchParams.get('cause');

	const [causes, presets, accounts, recentGifts, [totals]] = await Promise.all([
		db
			.select({
				id: donationCauses.id,
				name: donationCauses.name,
				slug: donationCauses.slug,
				description: donationCauses.description,
				details: donationCauses.details,
				image: donationCauses.image,
				goalAmount: donationCauses.goalAmount,
				raisedAmount: donationCauses.raisedAmount,
				currency: donationCauses.currency,
				ministryAreaName: ministryAreas.name,
				projectName: projects.name,
				projectSlug: projects.slug
			})
			.from(donationCauses)
			.leftJoin(ministryAreas, eq(ministryAreas.id, donationCauses.ministryAreaId))
			.leftJoin(projects, eq(projects.id, donationCauses.projectId))
			.orderBy(asc(donationCauses.sortOrder), asc(donationCauses.name)),

		/* Presets with no cause are the general ones — the $29 / $15 / $10 buttons. */
		db
			.select({
				id: donationPresets.id,
				causeId: donationPresets.causeId,
				amount: donationPresets.amount,
				currency: donationPresets.currency,
				label: donationPresets.label
			})
			.from(donationPresets)
			.orderBy(asc(donationPresets.sortOrder), asc(donationPresets.amount)),

		db
			.select({
				id: paymentAccounts.id,
				accountName: paymentAccounts.accountName,
				accountNumber: paymentAccounts.accountNumber,
				bankName: paymentAccounts.bankName,
				branch: paymentAccounts.branch,
				swiftCode: paymentAccounts.swiftCode,
				currency: paymentAccounts.currency,
				instructions: paymentAccounts.instructions,
				methodId: paymentMethods.id,
				methodName: paymentMethods.name,
				methodLogo: paymentMethods.logo,
				methodDescription: paymentMethods.description
			})
			.from(paymentAccounts)
			.innerJoin(paymentMethods, eq(paymentMethods.id, paymentAccounts.paymentMethodId))
			.orderBy(asc(paymentAccounts.sortOrder)),

		/* A quiet donor wall — anonymous gifts never appear. */
		db
			.select({
				id: donations.id,
				donorName: donations.donorName,
				amount: donations.amount,
				currency: donations.currency,
				message: donations.message,
				createdAt: donations.createdAt,
				causeName: donationCauses.name
			})
			.from(donations)
			.leftJoin(donationCauses, eq(donationCauses.id, donations.causeId))
			.where(and(eq(donations.status, 'completed'), eq(donations.isAnonymous, false)))
			.orderBy(desc(donations.createdAt))
			.limit(6),

		db
			.select({
				raised: sql<number>`coalesce(sum(${donations.amount}), 0)`,
				donors: sql<number>`count(distinct ${donations.donorEmail})`,
				recurring: sql<number>`sum(case when ${donations.isRecurring} = 1 then 1 else 0 end)`
			})
			.from(donations)
			.where(eq(donations.status, 'completed'))
	]);

	const selectedCause = requestedCause
		? (causes.find((cause) => cause.slug === requestedCause) ?? null)
		: null;

	const form = await superValidate(zod4(donateSchema), {
		defaults: {
			causeId: selectedCause?.id ?? null,
			amount: 0,
			frequency: 'once',
			donorName: '',
			donorEmail: '',
			donorPhone: '',
			isAnonymous: false,
			message: '',
			paymentAccountId: accounts[0]?.id ?? null
		}
	});

	return {
		causes,
		presets,
		accounts,
		recentGifts,
		totals: {
			raised: Number(totals?.raised ?? 0),
			donors: Number(totals?.donors ?? 0),
			recurring: Number(totals?.recurring ?? 0)
		},
		selectedCauseId: selectedCause?.id ?? null,
		form
	};
};

/* -------------------------------------------------------------------------- */
/* actions                                                                     */
/* -------------------------------------------------------------------------- */

/** Recurring gifts get a first charge date one interval out. */
function nextChargeDate(frequency: string) {
	const date = new Date();
	if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
	else if (frequency === 'quarterly') date.setMonth(date.getMonth() + 3);
	else if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1);
	else return null;
	return date;
}

export const actions: Actions = {
	donate: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(donateSchema));

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for errors' });
		}

		const {
			causeId,
			amount,
			frequency,
			donorName,
			donorEmail,
			donorPhone,
			isAnonymous,
			message: note,
			paymentAccountId
		} = form.data;

		/* Trust the database for the cause and its currency, not the posted form. */

		const [cause] = causeId
			? await db
					.select({
						id: donationCauses.id,
						currency: donationCauses.currency,
						projectId: donationCauses.projectId
					})
					.from(donationCauses)
					.where(eq(donationCauses.id, causeId))
					.limit(1)
			: [];

		const [account] = paymentAccountId
			? await db
					.select({
						id: paymentAccounts.id,
						currency: paymentAccounts.currency,
						account: paymentAccounts.accountNumber,
						paymentMethodId: paymentAccounts.paymentMethodId
					})
					.from(paymentAccounts)
					.where(eq(paymentAccounts.id, paymentAccountId))
					.limit(1)
			: [];

		const currency = account?.currency ?? cause?.currency ?? 'ETB';
		const userId = locals.user?.id ?? null;

		try {
			// `transactions` carries ...secureFields. If `createdBy` is NOT NULL on your
			// side, make it nullable for public writes or pass a service account id.
			const [result] = await db.insert(transactions).values({
				amount: amount.toFixed(2),
				currency,
				purpose: 'donation',
				paymentStatus: 'pending',
				paymentMethodId: account?.paymentMethodId ?? null,
				...(userId ? { createdBy: userId } : {})
			});

			await db.insert(donations).values({
				donorName,
				donorEmail,
				donorPhone: donorPhone || null,
				userId,
				causeId: cause?.id ?? null,
				projectId: cause?.projectId ?? null,
				amount: amount.toFixed(2),
				currency,
				isRecurring: frequency !== 'once',
				recurrenceInterval: frequency === 'once' ? null : frequency,
				nextChargeAt: nextChargeDate(frequency),
				isAnonymous,
				message: note || null,
				transactionId: Number(result.insertId),
				paymentAccountId: account?.id ?? null,
				paymentAccount: account?.account ?? null,
				status: 'pending'
			});

			/* `raisedAmount` is deliberately untouched — it moves when staff confirm
			   the transfer, so the progress bars never show money that has not landed. */

			// const adminMail = adminDonationTemplate(form.data);
			// sendEmail(SMTP_USER, adminMail.subject, adminMail.html);

			// const donorMail = donationPledgeTemplate(donorName, amount, currency);
			// sendEmail(donorEmail, donorMail.subject, donorMail.html);

			return message(form, {
				type: 'success',
				text: 'Thank you. Complete the transfer using the account details on this page and send us the receipt — we will confirm your gift'
			});
		} catch (err) {
			return message(form, {
				type: 'error',
				text: 'We could not record your gift: ' + (err as Error)?.message
			});
		}
	}
};