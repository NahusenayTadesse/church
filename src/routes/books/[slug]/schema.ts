import { z } from 'zod';

export const reviewSchema = z.object({
	reviewerName: z
		.string()
		.trim()
		.min(2, 'Tell us who is writing')
		.max(150, 'That name is too long'),
	reviewerEmail: z
		.string()
		.trim()
		.email('Enter a valid email address')
		.max(100)
		.optional()
		.or(z.literal('')),
	rating: z
		.number({ message: 'Choose a rating' })
		.int()
		.min(1, 'Choose a rating')
		.max(5, 'Choose a rating'),
	title: z.string().trim().max(200, 'Keep the headline under 200 characters').optional().or(z.literal('')),
	content: z
		.string()
		.trim()
		.min(10, 'Write at least a sentence')
		.max(4000, 'That review is too long')
});

export const orderSchema = z.object({
	quantity: z.number().int().min(1, 'Order at least one copy').max(20, 'For bulk orders, contact us'),
	variant: z.string().trim().min(1).max(255)
});

export type ReviewSchema = typeof reviewSchema;
export type OrderSchema = typeof orderSchema;