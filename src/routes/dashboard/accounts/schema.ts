import { z } from 'zod';

export const paymentAccount = z.object({
	paymentMethodId: z.coerce.number().int().positive('Payment method is required'),
	accountName: z.string().min(1, 'Account name is required').max(150),
	accountNumber: z.string().min(1, 'Account number is required').max(100),
	bankName: z.string().max(150).optional(),
	branch: z.string().max(150).optional(),
	swiftCode: z.string().max(20).optional(),
	currency: z.string().max(3).default('ETB'),
	instructions: z.string().max(500).optional(),
	sortOrder: z.coerce.number().int().default(0)
});

export const editPaymentAccount = paymentAccount.extend({
	id: z.coerce.number().int().positive()
});

export const deletePaymentAccount = z.object({
	id: z.coerce.number().int().positive()
});

export type PaymentAccount = typeof paymentAccount;
export type EditPaymentAccount = typeof editPaymentAccount;