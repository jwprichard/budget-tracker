import { z } from 'zod';

export const accountTypeEnum = z.enum([
  'CHECKING',
  'SAVINGS',
  'CREDIT_CARD',
  'CASH',
  'INVESTMENT',
  'OTHER',
]);

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  type: accountTypeEnum,
  category: z.string().max(50, 'Category must be at most 50 characters').optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
  initialBalance: z.number().finite('Initial balance must be a valid number'),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').optional(),
  type: accountTypeEnum.optional(),
  category: z.string().max(50, 'Category must be at most 50 characters').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const accountQuerySchema = z.object({
  includeInactive: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

export type CreateAccountDto = z.infer<typeof createAccountSchema>;
export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;
export type AccountQuery = z.infer<typeof accountQuerySchema>;
