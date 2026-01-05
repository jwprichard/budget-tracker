import { z } from 'zod';

export const transactionTypeEnum = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);
export const transactionStatusEnum = z.enum(['PENDING', 'CLEARED', 'RECONCILED']);

// Custom date validator - only allow past or current dates
const pastOrPresentDate = z
  .string()
  .datetime({ message: 'Date must be a valid ISO datetime string' })
  .or(z.date())
  .refine(
    (date) => {
      const inputDate = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      // Set time to end of today to allow today's date
      now.setHours(23, 59, 59, 999);
      return inputDate <= now;
    },
    { message: 'Date cannot be in the future' }
  );

export const createTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  type: transactionTypeEnum,
  amount: z.number().positive('Amount must be positive').finite('Amount must be a valid number'),
  date: pastOrPresentDate,
  description: z.string().min(1, 'Description is required').max(255, 'Description must be at most 255 characters'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
  status: transactionStatusEnum.default('CLEARED'),
});

export const createTransferSchema = z
  .object({
    fromAccountId: z.string().uuid('Invalid source account ID'),
    toAccountId: z.string().uuid('Invalid destination account ID'),
    amount: z.number().positive('Amount must be positive').finite('Amount must be a valid number'),
    date: pastOrPresentDate,
    description: z.string().min(1, 'Description is required').max(255, 'Description must be at most 255 characters'),
    notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Cannot transfer to the same account',
    path: ['toAccountId'],
  });

export const updateTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
  type: transactionTypeEnum.optional(),
  amount: z.number().positive('Amount must be positive').finite('Amount must be a valid number').optional(),
  date: pastOrPresentDate.optional(),
  description: z.string().min(1, 'Description is required').max(255, 'Description must be at most 255 characters').optional(),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional().nullable(),
  status: transactionStatusEnum.optional(),
});

export const transactionQuerySchema = z.object({
  accountId: z.string().uuid('Invalid account ID').optional(),
  type: transactionTypeEnum.optional(),
  status: transactionStatusEnum.optional(),
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO datetime string' }).optional(),
  endDate: z.string().datetime({ message: 'End date must be a valid ISO datetime string' }).optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .default('1'),
  pageSize: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100, 'Page size cannot exceed 100'))
    .default('50'),
  sortBy: z.enum(['date', 'amount', 'description']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const bulkImportSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  transactions: z
    .array(
      z.object({
        type: transactionTypeEnum,
        amount: z.number().finite('Amount must be a valid number'),
        date: z.string().datetime({ message: 'Date must be a valid ISO datetime string' }).or(z.date()),
        description: z.string().min(1, 'Description is required').max(255, 'Description must be at most 255 characters'),
        notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
        status: transactionStatusEnum.default('CLEARED'),
      })
    )
    .min(1, 'At least one transaction is required')
    .max(10000, 'Cannot import more than 10,000 transactions at once'),
  skipDuplicates: z.boolean().default(true),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type CreateTransferDto = z.infer<typeof createTransferSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type BulkImportDto = z.infer<typeof bulkImportSchema>;
