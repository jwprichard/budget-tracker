/**
 * PlannedTransaction Service
 * Business logic for managing one-time planned transactions and template overrides
 */

import { PrismaClient, PlannedTransaction, TransactionType } from '@prisma/client';
import {
  CreatePlannedTransactionDto,
  UpdatePlannedTransactionDto,
  PlannedTransactionQuery,
} from '../schemas/plannedTransaction.schema';
import { AppError } from '../middlewares/errorHandler';
import {
  generateVirtualPlannedTransactions,
  TemplateWithRelations,
  parseVirtualPlannedTransactionId,
  isVirtualPlannedTransactionId,
} from '../utils/virtualPlannedTransactions';

/**
 * Planned transaction with related data for API responses
 */
export interface PlannedTransactionWithRelations {
  id: string;
  userId: string;
  templateId: string | null;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  isTransfer: boolean;
  transferToAccountId: string | null;
  transferToAccountName: string | null;
  amount: number;
  type: TransactionType;
  name: string;
  description: string | null;
  notes: string | null;
  expectedDate: string;
  isOverride: boolean;
  autoMatchEnabled: boolean;
  skipReview: boolean;
  matchTolerance: number | null;
  matchWindowDays: number;
  budgetId: string | null;
  createdAt: string;
  updatedAt: string;
  isVirtual: boolean;
}

export class PlannedTransactionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new planned transaction (one-time or override)
   * @param data - Planned transaction creation data
   * @param userId - User UUID
   */
  async create(
    data: CreatePlannedTransactionDto,
    userId: string
  ): Promise<PlannedTransaction> {
    // Verify account exists and belongs to user
    const account = await this.prisma.account.findFirst({
      where: { id: data.accountId, userId, isActive: true },
    });

    if (!account) {
      throw new AppError('Account not found or not active', 404);
    }

    // Verify transfer destination account if transfer
    if (data.isTransfer && data.transferToAccountId) {
      const transferAccount = await this.prisma.account.findFirst({
        where: { id: data.transferToAccountId, userId, isActive: true },
      });

      if (!transferAccount) {
        throw new AppError('Transfer destination account not found or not active', 404);
      }
    }

    // Verify category if provided
    if (data.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [{ userId: null }, { userId }],
        },
      });

      if (!category) {
        throw new AppError('Category not found or access denied', 404);
      }
    }

    // Verify template if this is an override
    if (data.templateId) {
      const template = await this.prisma.plannedTransactionTemplate.findFirst({
        where: { id: data.templateId, userId },
      });

      if (!template) {
        throw new AppError('Template not found or access denied', 404);
      }
    }

    // Verify budget if provided
    if (data.budgetId) {
      const budget = await this.prisma.budget.findFirst({
        where: { id: data.budgetId, userId },
      });

      if (!budget) {
        throw new AppError('Budget not found or access denied', 404);
      }
    }

    // Create the planned transaction
    const plannedTransaction = await this.prisma.plannedTransaction.create({
      data: {
        userId,
        templateId: data.templateId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        isTransfer: data.isTransfer ?? false,
        transferToAccountId: data.transferToAccountId,
        amount: data.amount,
        type: data.type,
        name: data.name,
        description: data.description,
        notes: data.notes,
        expectedDate: new Date(data.expectedDate),
        isOverride: data.isOverride ?? false,
        autoMatchEnabled: data.autoMatchEnabled ?? true,
        skipReview: data.skipReview ?? false,
        matchTolerance: data.matchTolerance,
        matchWindowDays: data.matchWindowDays ?? 7,
        budgetId: data.budgetId,
      },
    });

    return plannedTransaction;
  }

  /**
   * Get planned transactions for a user within an optional date range
   * Combines one-time, overrides, and virtual occurrences
   * @param userId - User UUID
   * @param query - Query parameters
   */
  async getPlannedTransactions(
    userId: string,
    query?: PlannedTransactionQuery
  ): Promise<PlannedTransactionWithRelations[]> {
    const includeVirtual = query?.includeVirtual ?? true;

    // Get stored planned transactions (one-time and overrides)
    // For account filter, include transfers where account is source OR destination
    const storedTransactions = await this.prisma.plannedTransaction.findMany({
      where: {
        userId,
        ...(query?.accountId && {
          OR: [
            { accountId: query.accountId },
            { transferToAccountId: query.accountId },
          ],
        }),
        ...(query?.categoryId && { categoryId: query.categoryId }),
        ...(query?.type && { type: query.type as TransactionType }),
        ...(query?.templateId && { templateId: query.templateId }),
        ...(query?.startDate || query?.endDate
          ? {
              expectedDate: {
                ...(query.startDate && { gte: new Date(query.startDate) }),
                ...(query.endDate && { lte: new Date(query.endDate) }),
              },
            }
          : {}),
      },
      include: {
        account: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, color: true },
        },
        transferToAccount: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expectedDate: 'asc' },
    });

    const result: PlannedTransactionWithRelations[] = storedTransactions.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      templateId: tx.templateId,
      accountId: tx.accountId,
      accountName: tx.account?.name ?? '',
      categoryId: tx.categoryId,
      categoryName: tx.category?.name ?? null,
      categoryColor: tx.category?.color ?? null,
      isTransfer: tx.isTransfer,
      transferToAccountId: tx.transferToAccountId,
      transferToAccountName: tx.transferToAccount?.name ?? null,
      amount: Number(tx.amount),
      type: tx.type,
      name: tx.name,
      description: tx.description,
      notes: tx.notes,
      expectedDate: tx.expectedDate.toISOString(),
      isOverride: tx.isOverride,
      autoMatchEnabled: tx.autoMatchEnabled,
      skipReview: tx.skipReview,
      matchTolerance: tx.matchTolerance ? Number(tx.matchTolerance) : null,
      matchWindowDays: tx.matchWindowDays,
      budgetId: tx.budgetId,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
      isVirtual: false,
    }));

    // Include virtual occurrences if requested and date range is provided
    if (includeVirtual && query?.startDate && query?.endDate) {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      // Get all active templates
      // For account filter, include transfers where account is source OR destination
      const templates = await this.prisma.plannedTransactionTemplate.findMany({
        where: {
          userId,
          isActive: true,
          ...(query?.accountId && {
            OR: [
              { accountId: query.accountId },
              { transferToAccountId: query.accountId },
            ],
          }),
          ...(query?.categoryId && { categoryId: query.categoryId }),
          ...(query?.type && { type: query.type as TransactionType }),
          ...(query?.templateId && { id: query.templateId }),
        },
        include: {
          account: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true, color: true },
          },
          transferToAccount: {
            select: { id: true, name: true },
          },
        },
      });

      // Get override dates to filter out
      const overrideDates = new Set(
        storedTransactions
          .filter((tx) => tx.isOverride && tx.templateId)
          .map((tx) => `${tx.templateId}_${tx.expectedDate.toISOString()}`)
      );

      // Generate virtual occurrences for each template
      for (const template of templates) {
        const templateWithRelations: TemplateWithRelations = {
          ...template,
          amount: Number(template.amount),
          matchTolerance: template.matchTolerance ? Number(template.matchTolerance) : null,
        };

        const virtualOccurrences = generateVirtualPlannedTransactions(
          templateWithRelations,
          startDate,
          endDate
        );

        // Filter out occurrences that have overrides
        for (const virtual of virtualOccurrences) {
          const key = `${virtual.templateId}_${virtual.expectedDate.toISOString()}`;
          if (!overrideDates.has(key)) {
            result.push({
              id: virtual.id,
              userId: virtual.userId,
              templateId: virtual.templateId,
              accountId: virtual.accountId,
              accountName: virtual.accountName,
              categoryId: virtual.categoryId,
              categoryName: virtual.categoryName,
              categoryColor: virtual.categoryColor,
              isTransfer: virtual.isTransfer,
              transferToAccountId: virtual.transferToAccountId,
              transferToAccountName: virtual.transferToAccountName,
              amount: virtual.amount,
              type: virtual.type,
              name: virtual.name,
              description: virtual.description,
              notes: virtual.notes,
              expectedDate: virtual.expectedDate.toISOString(),
              isOverride: false,
              autoMatchEnabled: virtual.autoMatchEnabled,
              skipReview: virtual.skipReview,
              matchTolerance: virtual.matchTolerance,
              matchWindowDays: virtual.matchWindowDays,
              budgetId: virtual.budgetId,
              createdAt: '', // Virtual occurrences don't have createdAt
              updatedAt: '', // Virtual occurrences don't have updatedAt
              isVirtual: true,
            });
          }
        }
      }

      // Sort by expected date
      result.sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());
    }

    return result;
  }

  /**
   * Get a single planned transaction by ID
   * Supports both real IDs and virtual IDs
   * @param id - Planned transaction ID (can be virtual)
   * @param userId - User UUID
   */
  async getById(
    id: string,
    userId: string
  ): Promise<PlannedTransactionWithRelations> {
    // Check if this is a virtual ID
    if (isVirtualPlannedTransactionId(id)) {
      const parsed = parseVirtualPlannedTransactionId(id);
      if (!parsed) {
        throw new AppError('Invalid planned transaction ID', 400);
      }

      // Get the template
      const template = await this.prisma.plannedTransactionTemplate.findFirst({
        where: { id: parsed.templateId, userId },
        include: {
          account: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true, color: true },
          },
          transferToAccount: {
            select: { id: true, name: true },
          },
        },
      });

      if (!template) {
        throw new AppError('Planned transaction not found or access denied', 404);
      }

      // Check if there's an override for this date
      const override = await this.prisma.plannedTransaction.findFirst({
        where: {
          templateId: parsed.templateId,
          expectedDate: parsed.expectedDate,
          userId,
        },
        include: {
          account: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true, color: true },
          },
          transferToAccount: {
            select: { id: true, name: true },
          },
        },
      });

      if (override) {
        // Return the override instead
        return {
          id: override.id,
          userId: override.userId,
          templateId: override.templateId,
          accountId: override.accountId,
          accountName: override.account?.name ?? '',
          categoryId: override.categoryId,
          categoryName: override.category?.name ?? null,
          categoryColor: override.category?.color ?? null,
          isTransfer: override.isTransfer,
          transferToAccountId: override.transferToAccountId,
          transferToAccountName: override.transferToAccount?.name ?? null,
          amount: Number(override.amount),
          type: override.type,
          name: override.name,
          description: override.description,
          notes: override.notes,
          expectedDate: override.expectedDate.toISOString(),
          isOverride: override.isOverride,
          autoMatchEnabled: override.autoMatchEnabled,
          skipReview: override.skipReview,
          matchTolerance: override.matchTolerance ? Number(override.matchTolerance) : null,
          matchWindowDays: override.matchWindowDays,
          budgetId: override.budgetId,
          createdAt: override.createdAt.toISOString(),
          updatedAt: override.updatedAt.toISOString(),
          isVirtual: false,
        };
      }

      // Return virtual occurrence
      return {
        id,
        userId: template.userId,
        templateId: template.id,
        accountId: template.accountId,
        accountName: template.account?.name ?? '',
        categoryId: template.categoryId,
        categoryName: template.category?.name ?? null,
        categoryColor: template.category?.color ?? null,
        isTransfer: template.isTransfer,
        transferToAccountId: template.transferToAccountId,
        transferToAccountName: template.transferToAccount?.name ?? null,
        amount: Number(template.amount),
        type: template.type,
        name: template.name,
        description: template.description,
        notes: template.notes,
        expectedDate: parsed.expectedDate.toISOString(),
        isOverride: false,
        autoMatchEnabled: template.autoMatchEnabled,
        skipReview: template.skipReview,
        matchTolerance: template.matchTolerance ? Number(template.matchTolerance) : null,
        matchWindowDays: template.matchWindowDays,
        budgetId: template.budgetId,
        createdAt: '',
        updatedAt: '',
        isVirtual: true,
      };
    }

    // Get real planned transaction
    const plannedTransaction = await this.prisma.plannedTransaction.findFirst({
      where: { id, userId },
      include: {
        account: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, color: true },
        },
        transferToAccount: {
          select: { id: true, name: true },
        },
      },
    });

    if (!plannedTransaction) {
      throw new AppError('Planned transaction not found or access denied', 404);
    }

    return {
      id: plannedTransaction.id,
      userId: plannedTransaction.userId,
      templateId: plannedTransaction.templateId,
      accountId: plannedTransaction.accountId,
      accountName: plannedTransaction.account?.name ?? '',
      categoryId: plannedTransaction.categoryId,
      categoryName: plannedTransaction.category?.name ?? null,
      categoryColor: plannedTransaction.category?.color ?? null,
      isTransfer: plannedTransaction.isTransfer,
      transferToAccountId: plannedTransaction.transferToAccountId,
      transferToAccountName: plannedTransaction.transferToAccount?.name ?? null,
      amount: Number(plannedTransaction.amount),
      type: plannedTransaction.type,
      name: plannedTransaction.name,
      description: plannedTransaction.description,
      notes: plannedTransaction.notes,
      expectedDate: plannedTransaction.expectedDate.toISOString(),
      isOverride: plannedTransaction.isOverride,
      autoMatchEnabled: plannedTransaction.autoMatchEnabled,
      skipReview: plannedTransaction.skipReview,
      matchTolerance: plannedTransaction.matchTolerance ? Number(plannedTransaction.matchTolerance) : null,
      matchWindowDays: plannedTransaction.matchWindowDays,
      budgetId: plannedTransaction.budgetId,
      createdAt: plannedTransaction.createdAt.toISOString(),
      updatedAt: plannedTransaction.updatedAt.toISOString(),
      isVirtual: false,
    };
  }

  /**
   * Update a planned transaction
   * If the ID is virtual, creates an override instead
   * @param id - Planned transaction ID (can be virtual)
   * @param data - Update data
   * @param userId - User UUID
   */
  async update(
    id: string,
    data: UpdatePlannedTransactionDto,
    userId: string
  ): Promise<PlannedTransaction> {
    // Check if this is a virtual ID - if so, create an override
    if (isVirtualPlannedTransactionId(id)) {
      const parsed = parseVirtualPlannedTransactionId(id);
      if (!parsed) {
        throw new AppError('Invalid planned transaction ID', 400);
      }

      // Get the template to use as base
      const template = await this.prisma.plannedTransactionTemplate.findFirst({
        where: { id: parsed.templateId, userId },
      });

      if (!template) {
        throw new AppError('Template not found or access denied', 404);
      }

      // Create an override
      return this.create(
        {
          templateId: parsed.templateId,
          accountId: data.accountId ?? template.accountId,
          categoryId: data.categoryId ?? template.categoryId ?? undefined,
          isTransfer: data.isTransfer ?? template.isTransfer,
          transferToAccountId: data.transferToAccountId ?? template.transferToAccountId ?? undefined,
          amount: data.amount ?? Number(template.amount),
          type: data.type ?? template.type,
          name: data.name ?? template.name,
          description: data.description ?? template.description ?? undefined,
          notes: data.notes ?? template.notes ?? undefined,
          expectedDate: parsed.expectedDate.toISOString(),
          isOverride: true,
          autoMatchEnabled: data.autoMatchEnabled ?? template.autoMatchEnabled,
          skipReview: data.skipReview ?? template.skipReview,
          matchTolerance: data.matchTolerance ?? (template.matchTolerance ? Number(template.matchTolerance) : undefined),
          matchWindowDays: data.matchWindowDays ?? template.matchWindowDays,
          budgetId: data.budgetId ?? template.budgetId ?? undefined,
        },
        userId
      );
    }

    // Verify the planned transaction exists and belongs to user
    const existing = await this.prisma.plannedTransaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Planned transaction not found or access denied', 404);
    }

    // Verify new account if provided
    if (data.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: data.accountId, userId, isActive: true },
      });

      if (!account) {
        throw new AppError('Account not found or not active', 404);
      }
    }

    // Verify new transfer destination if provided
    if (data.transferToAccountId) {
      const transferAccount = await this.prisma.account.findFirst({
        where: { id: data.transferToAccountId, userId, isActive: true },
      });

      if (!transferAccount) {
        throw new AppError('Transfer destination account not found or not active', 404);
      }
    }

    // Verify new category if provided
    if (data.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [{ userId: null }, { userId }],
        },
      });

      if (!category) {
        throw new AppError('Category not found or access denied', 404);
      }
    }

    // Verify new budget if provided
    if (data.budgetId) {
      const budget = await this.prisma.budget.findFirst({
        where: { id: data.budgetId, userId },
      });

      if (!budget) {
        throw new AppError('Budget not found or access denied', 404);
      }
    }

    // Update the planned transaction
    const updated = await this.prisma.plannedTransaction.update({
      where: { id },
      data: {
        ...(data.accountId !== undefined && { accountId: data.accountId }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.isTransfer !== undefined && { isTransfer: data.isTransfer }),
        ...(data.transferToAccountId !== undefined && { transferToAccountId: data.transferToAccountId }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.expectedDate !== undefined && { expectedDate: new Date(data.expectedDate) }),
        ...(data.autoMatchEnabled !== undefined && { autoMatchEnabled: data.autoMatchEnabled }),
        ...(data.skipReview !== undefined && { skipReview: data.skipReview }),
        ...(data.matchTolerance !== undefined && { matchTolerance: data.matchTolerance }),
        ...(data.matchWindowDays !== undefined && { matchWindowDays: data.matchWindowDays }),
        ...(data.budgetId !== undefined && { budgetId: data.budgetId }),
      },
    });

    return updated;
  }

  /**
   * Delete a planned transaction
   * If the ID is virtual, this is a no-op (virtual occurrences cannot be deleted directly)
   * @param id - Planned transaction ID (can be virtual)
   * @param userId - User UUID
   */
  async delete(id: string, userId: string): Promise<void> {
    // Check if this is a virtual ID
    if (isVirtualPlannedTransactionId(id)) {
      throw new AppError(
        'Cannot delete a virtual occurrence. Edit the template to adjust the schedule, or create an override.',
        400
      );
    }

    const plannedTransaction = await this.prisma.plannedTransaction.findFirst({
      where: { id, userId },
    });

    if (!plannedTransaction) {
      throw new AppError('Planned transaction not found or access denied', 404);
    }

    await this.prisma.plannedTransaction.delete({ where: { id } });
  }

  /**
   * Create an override for a virtual occurrence
   * Convenience method that wraps create with the override flag
   * @param templateId - Template UUID
   * @param expectedDate - The expected date of the occurrence to override
   * @param data - Override data
   * @param userId - User UUID
   */
  async createOverride(
    templateId: string,
    expectedDate: Date,
    data: Partial<CreatePlannedTransactionDto>,
    userId: string
  ): Promise<PlannedTransaction> {
    // Get the template to use as base
    const template = await this.prisma.plannedTransactionTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    // Check if an override already exists
    const existingOverride = await this.prisma.plannedTransaction.findFirst({
      where: {
        templateId,
        expectedDate,
        userId,
      },
    });

    if (existingOverride) {
      // Update existing override
      return this.prisma.plannedTransaction.update({
        where: { id: existingOverride.id },
        data: {
          ...(data.accountId !== undefined && { accountId: data.accountId }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.isTransfer !== undefined && { isTransfer: data.isTransfer }),
          ...(data.transferToAccountId !== undefined && { transferToAccountId: data.transferToAccountId }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.autoMatchEnabled !== undefined && { autoMatchEnabled: data.autoMatchEnabled }),
          ...(data.skipReview !== undefined && { skipReview: data.skipReview }),
          ...(data.matchTolerance !== undefined && { matchTolerance: data.matchTolerance }),
          ...(data.matchWindowDays !== undefined && { matchWindowDays: data.matchWindowDays }),
          ...(data.budgetId !== undefined && { budgetId: data.budgetId }),
        },
      });
    }

    // Create new override
    return this.create(
      {
        templateId,
        accountId: data.accountId ?? template.accountId,
        categoryId: data.categoryId ?? template.categoryId ?? undefined,
        isTransfer: data.isTransfer ?? template.isTransfer,
        transferToAccountId: data.transferToAccountId ?? template.transferToAccountId ?? undefined,
        amount: data.amount ?? Number(template.amount),
        type: data.type ?? template.type,
        name: data.name ?? template.name,
        description: data.description ?? template.description ?? undefined,
        notes: data.notes ?? template.notes ?? undefined,
        expectedDate: expectedDate.toISOString(),
        isOverride: true,
        autoMatchEnabled: data.autoMatchEnabled ?? template.autoMatchEnabled,
        skipReview: data.skipReview ?? template.skipReview,
        matchTolerance: data.matchTolerance ?? (template.matchTolerance ? Number(template.matchTolerance) : undefined),
        matchWindowDays: data.matchWindowDays ?? template.matchWindowDays,
        budgetId: data.budgetId ?? template.budgetId ?? undefined,
      },
      userId
    );
  }
}
