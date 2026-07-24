import { z } from 'zod/v4';

export const paymentMethod = z.object({
	name: z.string('Name of Payment Method is required').min(2).max(50),
	logo: z.file("Logo is required").max(10000000)
});

export const editPaymentMethod = z.object({
	id: z.coerce.string(),
	name: z.string('Name of Payment Method is required').min(2).max(50),
		logo: z.file("Logo is required").max(10000000).optional()

});
export type EditPaymentMethod = z.infer<typeof editPaymentMethod>;
