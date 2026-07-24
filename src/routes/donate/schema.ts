import { z } from 'zod';

export const donateSchema = z.object({
	causeId: z.number().int().nullable().optional(),
	amount: z
		.number({ message: 'Enter an amount' })
		.min(1, 'Enter an amount')
		.max(10_000_000, 'For a gift this size, please contact us directly'),
	frequency: z.enum(['once', 'monthly', 'quarterly', 'yearly']),
	donorName: z.string().trim().min(2, 'Enter your name').max(150, 'That name is too long'),
	donorEmail: z.string().trim().email('Enter a valid email address').max(100),
	donorPhone: z.string().trim().max(20, 'That phone number is too long').optional().or(z.literal('')),
	isAnonymous: z.boolean().default(false),
	message: z.string().trim().max(500, 'Keep this under 500 characters').optional().or(z.literal('')),
	paymentAccountId: z.number().int().nullable().optional()
});

export type DonateSchema = typeof donateSchema;