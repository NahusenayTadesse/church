import { z } from 'zod';

export const eventRegistrationSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, 'Enter your full name')
		.max(150, 'That name is too long'),
	email: z.string().trim().email('Enter a valid email address').max(100),
	phone: z
		.string()
		.trim()
		.min(9, 'Enter a phone number we can reach you on')
		.max(20, 'That phone number is too long'),
	organization: z.string().trim().max(150).optional().or(z.literal('')),
	seats: z
		.number({ message: 'Choose how many seats you need' })
		.int()
		.min(1, 'Register at least one seat')
		.max(10, 'For more than 10 seats, contact us directly'),
	paymentMethodId: z.number().int().optional().nullable(),
	notes: z.string().trim().max(255, 'Keep this under 255 characters').optional().or(z.literal(''))
});

export type EventRegistrationSchema = typeof eventRegistrationSchema;