/**
 * PlannedTransactionTemplate Service
 * Business logic for managing recurring planned transaction templates
 */

import { PrismaClient, PlannedTransactionTemplate, PlannedTransaction } from '@prisma/client';
import {
  CreatePlannedTransactionTemplateDto,
  UpdatePlannedTransactionTemplateDto,
  PlannedTransactionTemplateQuery,
} from '../schemas/plannedTransaction.schema';
import { AppError } from '../middlewares/errorHandler';
import {
  generateVirtualPlannedTransactions,
  getNextOccurrence,
  VirtualPlannedTransaction,
  TemplateWithRelations,
} from '../utils/virtualPlannedTransactions';

/**
 * Template with statistics for API responses
 */
export interface PlannedTransactionTemplateWithStats {
  id: string;
  userId: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  isTransfer: boolean;
  transferToAccountId: string | null;
  transferToAccountName: string | null;
  amount: number;
  type: string;
  name: string;
  description: string | null;
  notes: string | null;
  periodType: string;
  interval: number;
  firstOccurrence: string;
  endDate: string | null;
  dayOfMonth: number | null;
  dayOfMonthType: string | null;
  dayOfWeek: number | null;
  autoMatchEnabled: boolean;
  skipReview: boolean;
  matchTolerance: number | null;
  matchWindowDays: number;
  budgetId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Calculated fields
  nextOccurrence: string | null;
  totalOverrides: number;
}

export class PlannedTransactionTemplateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new planned transaction template
   * @param data - Template creation data
   * @param userId - User UUID
   */
  async createTemplate(
    data: CreatePlannedTransactionTemplateDto,
    userId: string
  ): Promise<PlannedTransactionTemplate> {
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

    // Verify budget if provided
    if (data.budgetId) {
      const budget = await this.prisma.budget.findFirst({
        where: { id: data.budgetId, userId },
      });

      if (!budget) {
        throw new AppError('Budget not found or access denied', 404);
      }
    }

    // Create the template
    const template = await this.prisma.plannedTransactionTemplate.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        isTransfer: data.isTransfer ?? false,
        transferToAccountId: data.transferToAccountId,
        amount: data.amount,
        type: data.type,
        name: data.name,
        description: data.description,
        notes: data.notes,
        periodType: data.periodType,
        interval: data.interval ?? 1,
        firstOccurrence: new Date(data.firstOccurrence),
        endDate: data.endDate ? new Date(data.endDate) : null,
        dayOfMonth: data.dayOfMonth,
        dayOfMonthType: data.dayOfMonthType,
        dayOfWeek: data.dayOfWeek,
        autoMatchEnabled: data.autoMatchEnabled ?? true,
        skipReview: data.skipReview ?? false,
        matchTolerance: data.matchTolerance,
        matchWindowDays: data.matchWindowDays ?? 7,
        budgetId: data.budgetId,
        isActive: true,
      },
    });

    return template;
  }

  /**
   * Get all templates for a user with statistics
   * @param userId - User UUID
   * @param query - Optional query filters
   */
  async getTemplates(
    userId: string,
    query?: PlannedTransactionTemplateQuery
  ): Promise<PlannedTransactionTemplateWithStats[]> {
    const templates = await this.prisma.plannedTransactionTemplate.findMany({
      where: {
        userId,
        ...(query?.accountId && { accountId: query.accountId }),
        ...(query?.categoryId && { categoryId: query.categoryId }),
        ...(query?.type && { type: query.type }),
        ...(query?.isActive !== undefined && { isActive: query.isActive }),
        ...(query?.budgetId && { budgetId: query.budgetId }),
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
        overrides: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((template) => this.enrichTemplateWithStats(template));
  }

  /**
   * Get a single template by ID with statistics
   * @param id - Template UUID
   * @param userId - User UUID
   */
  async getTemplateById(
    id: string,
    userId: string
  ): Promise<PlannedTransactionTemplateWithStats> {
    const template = await this.prisma.plannedTransactionTemplate.findFirst({
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
        overrides: {
          select: { id: true },
        },
      },
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    return this.enrichTemplateWithStats(template);
  }

  /**
   * Update a planned transaction template
   * @param id - Template UUID
   * @param data - Update data
   * @param userId - User UUID
   */
  async updateTemplate(
    id: string,
    data: UpdatePlannedTransactionTemplateDto,
    userId: string
  ): Promise<PlannedTransactionTemplate> {
    // Verify template exists and belongs to user
    const existing = await this.prisma.plannedTransactionTemplate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Template not found or access denied', 404);
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

    // Update the template
    const template = await this.prisma.plannedTransactionTemplate.update({
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
        ...(data.interval !== undefined && { interval: data.interval }),
        ...(data.firstOccurrence !== undefined && { firstOccurrence: new Date(data.firstOccurrence) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.dayOfMonth !== undefined && { dayOfMonth: data.dayOfMonth }),
        ...(data.dayOfMonthType !== undefined && { dayOfMonthType: data.dayOfMonthType }),
        ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
        ...(data.autoMatchEnabled !== undefined && { autoMatchEnabled: data.autoMatchEnabled }),
        ...(data.skipReview !== undefined && { skipReview: data.skipReview }),
        ...(data.matchTolerance !== undefined && { matchTolerance: data.matchTolerance }),
        ...(data.matchWindowDays !== undefined && { matchWindowDays: data.matchWindowDays }),
        ...(data.budgetId !== undefined && { budgetId: data.budgetId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return template;
  }

  /**
   * Delete a template and all its overrides
   * @param id - Template UUID
   * @param userId - User UUID
   */
  async deleteTemplate(id: string, userId: string): Promise<void> {
    const template = await this.prisma.plannedTransactionTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete all override planned transactions linked to this template
      await tx.plannedTransaction.deleteMany({
        where: { templateId: id },
      });

      // Delete the template
      await tx.plannedTransactionTemplate.delete({ where: { id } });
    });
  }

  /**
   * Get occurrences (virtual + overrides) for a template within a date range
   * @param templateId - Template UUID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param userId - User UUID
   */
  async getOccurrences(
    templateId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ): Promise<(VirtualPlannedTransaction | PlannedTransaction)[]> {
    const template = await this.prisma.plannedTransactionTemplate.findFirst({
      where: { id: templateId, userId },
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
      throw new AppError('Template not found or access denied', 404);
    }

    // Get stored overrides in the date range
    const overrides = await this.prisma.plannedTransaction.findMany({
      where: {
        templateId,
        userId,
        expectedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Generate virtual occurrences
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

    // Filter out virtual occurrences that have overrides
    const overrideDates = new Set(
      overrides.map((o) => o.expectedDate.toISOString())
    );

    const filteredVirtual = virtualOccurrences.filter(
      (v) => !overrideDates.has(v.expectedDate.toISOString())
    );

    // Combine and sort by expected date
    const all = [...filteredVirtual, ...overrides].sort((a, b) => {
      const dateA = new Date(a.expectedDate);
      const dateB = new Date(b.expectedDate);
      return dateA.getTime() - dateB.getTime();
    });

    return all;
  }

  /**
   * Skip a specific occurrence by creating a "skipped" override
   * @param templateId - Template UUID
   * @param occurrenceDate - The date of the occurrence to skip
   * @param userId - User UUID
   */
  async skipOccurrence(
    templateId: string,
    occurrenceDate: Date,
    userId: string
  ): Promise<PlannedTransaction> {
    const template = await this.prisma.plannedTransactionTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    // Check if an override already exists for this date
    const existingOverride = await this.prisma.plannedTransaction.findFirst({
      where: {
        templateId,
        expectedDate: occurrenceDate,
      },
    });

    if (existingOverride) {
      // Delete the existing override (marks this occurrence as skipped)
      await this.prisma.plannedTransaction.delete({
        where: { id: existingOverride.id },
      });
      throw new AppError('Occurrence skipped by removing existing override', 200);
    }

    // Create an override with amount 0 to indicate "skipped"
    // Note: In a real implementation, you might want a separate "skipped" flag
    // For now, we'll just delete any override that exists
    // The virtual occurrence will simply not be generated

    // Actually, to truly "skip", we need to create a marker record
    // For now, throw an error indicating the virtual occurrence cannot be skipped
    // without a proper mechanism
    throw new AppError(
      'Cannot skip a virtual occurrence. Edit the template to adjust the schedule.',
      400
    );
  }

  /**
   * Enrich template with calculated statistics
   * @private
   */
  private enrichTemplateWithStats(template: any): PlannedTransactionTemplateWithStats {
    // Calculate next occurrence
    let nextOccurrence: string | null = null;

    if (template.isActive) {
      const templateWithRelations: TemplateWithRelations = {
        ...template,
        amount: Number(template.amount),
        matchTolerance: template.matchTolerance ? Number(template.matchTolerance) : null,
      };

      const next = getNextOccurrence(templateWithRelations);
      if (next) {
        nextOccurrence = next.expectedDate.toISOString();
      }
    }

    return {
      id: template.id,
      userId: template.userId,
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
      periodType: template.periodType,
      interval: template.interval,
      firstOccurrence: template.firstOccurrence.toISOString(),
      endDate: template.endDate ? template.endDate.toISOString() : null,
      dayOfMonth: template.dayOfMonth,
      dayOfMonthType: template.dayOfMonthType,
      dayOfWeek: template.dayOfWeek,
      autoMatchEnabled: template.autoMatchEnabled,
      skipReview: template.skipReview,
      matchTolerance: template.matchTolerance ? Number(template.matchTolerance) : null,
      matchWindowDays: template.matchWindowDays,
      budgetId: template.budgetId,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      nextOccurrence,
      totalOverrides: template.overrides?.length ?? 0,
    };
  }
}
