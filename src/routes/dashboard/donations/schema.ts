import { z } from 'zod/v4';

/** Matches the `status` enum on the donations table. */
export const donationStatuses = [
	'pending',
	'completed',
	'failed',
	'refunded',
	'cancelled'
] as const;

export const updateDonationStatus = z.object({
	id: z.coerce.number(),
	status: z.enum(donationStatuses)
});

export type UpdateDonationStatus = z.infer<typeof updateDonationStatus>;

/** Stamps `receiptSentAt` — same shape as your markRead. */
export const markReceiptSent = z.object({
	id: z.coerce.number()
});

export type MarkReceiptSent = z.infer<typeof markReceiptSent>;

export const deleteDonation = z.object({
	id: z.coerce.number()
});

export type DeleteDonation = z.infer<typeof deleteDonation>;