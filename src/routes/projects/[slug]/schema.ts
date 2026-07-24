import { z } from 'zod';

export const supportSchema = z.object({
	purpose: z.enum(['volunteer', 'pray', 'partner', 'question'], {
		message: 'Choose how you would like to help'
	}),
	name: z.string().trim().min(2, 'Enter your full name').max(150, 'That name is too long'),
	email: z.string().trim().email('Enter a valid email address').max(100),
	phone: z.string().trim().max(20, 'That phone number is too long').optional().or(z.literal('')),
	message: z
		.string()
		.trim()
		.min(10, 'Tell us a little more')
		.max(4000, 'That message is too long')
});

export type SupportSchema = typeof supportSchema;