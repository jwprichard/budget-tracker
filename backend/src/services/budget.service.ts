import { PrismaClient, Budget } from '@prisma/client';
import { CreateBudgetDto, UpdateBudgetDto, BudgetQueryDto } from '../schemas/budget.schema';
import { BudgetWithStatus, BudgetSummaryResponse } from '../types/budget.types';
import { AppError } from '../middlewares/errorHandler';
import { calculateBudgetStatus } from '../utils/budgetHelpers';
import { calculatePeriodEndDate } from '../utils/periodCalculations';

export class BudgetService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new budget
   * @param data - Budget creation data
   * @param userId - User UUID
   * @throws AppError if category not found, doesn't belong to user, or duplicate budget exists
   */
  async createBudget(data: CreateBudgetDto, userId: string): Promise<Budget> {
    // Verify category exists and belongs to user (or is a system category)
    const category = await this.prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId: null }, { userId }], // System or user's own category
      },
    });

    if (!category) {
      throw new AppError('Category not found or access denied', 404);
    }

    // Calculate end date for recurring budgets
    const startDate = new Date(data.startDate);
    const endDate = calculatePeriodEndDate(
      startDate,
      data.periodType || null,
      data.interval || null
    );

    // Check for duplicate budget (same category + start date + period type)
    // For recurring budgets, check if another budget with same category and overlapping period exists
    // For one-time budgets, allow multiple (user might want multiple one-time budgets for same category)
    if (data.periodType) {
      const existing = await this.prisma.budget.findFirst({
        where: {
          userId,
          categoryId: data.categoryId,
          periodType: data.periodType,
          startDate,
        },
      });

      if (existing) {
        throw new AppError(
          'A budget already exists for this category and period',
          400
        );
      }
    }

    // Create budget
    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        type: data.type || 'EXPENSE',
        periodType: data.periodType || null,
        interval: data.interval || null,
        startDate,
        endDate,
        includeSubcategories: data.includeSubcategories,
        name: data.name,
        notes: data.notes,
      },
    });
  }

  /**
   * Get all budgets for a user with optional filters
   * @param userId - User UUID
   * @param query - Optional filters
   */
  async getBudgets(userId: string, query?: BudgetQueryDto): Promise<Budget[]> {
    // Build where clause
    const where: any = {
      userId,
      ...(query?.categoryId && { categoryId: query.categoryId }),
      ...(query?.templateId !== undefined && { templateId: query.templateId }),
    };

    // Filter by date range
    if (query?.startDate || query?.endDate) {
      where.startDate = {};
      if (query.startDate) {
        where.startDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.startDate.lte = new Date(query.endDate);
      }
    }

    // Filter by recurring vs one-time
    if (query?.isRecurring !== undefined) {
      if (query.isRecurring) {
        where.periodType = { not: null };
      } else {
        where.periodType = null;
      }
    }

    return this.prisma.budget.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            parentId: true,
          },
        },
      },
      orderBy: [{ startDate: 'desc' }],
    });
  }

  /**
   * Get a single budget by ID
   * @param id - Budget UUID
   * @param userId - User UUID
   * @throws AppError if budget not found or doesn't belong to user
   */
  async getBudgetById(id: string, userId: string): Promise<Budget> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            parentId: true,
          },
        },
      },
    });

    if (!budget) {
      throw new AppError('Budget not found or access denied', 404);
    }

    return budget;
  }

  /**
   * Update an existing budget
   * Only allows updating amount, type, includeSubcategories, name, and notes
   * @param id - Budget UUID
   * @param data - Update data
   * @param userId - User UUID
   * @throws AppError if budget not found or doesn't belong to user
   */
  async updateBudget(
    id: string,
    data: UpdateBudgetDto,
    userId: string
  ): Promise<Budget> {
    // Verify budget exists and belongs to user
    await this.getBudgetById(id, userId);

    return this.prisma.budget.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.includeSubcategories !== undefined && {
          includeSubcategories: data.includeSubcategories,
        }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  /**
   * Delete a budget with optional scope (instance only or entire template)
   * @param id - Budget UUID
   * @param userId - User UUID
   * @param deleteScope - 'INSTANCE' (default) deletes only this budget, 'TEMPLATE' deletes entire template
   * @throws AppError if budget not found or doesn't belong to user
   */
  async deleteBudget(
    id: string,
    userId: string,
    deleteScope: 'INSTANCE' | 'TEMPLATE' = 'INSTANCE'
  ): Promise<void> {
    // Get budget with its template
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: { template: true },
    });

    if (!budget) {
      throw new AppError('Budget not found or access denied', 404);
    }

    if (deleteScope === 'TEMPLATE' && budget.templateId) {
      // Delete entire template (will be handled by BudgetTemplateService)
      // Import is circular, so we'll need to handle this in the controller
      throw new AppError(
        'Use DELETE /api/v1/budget-templates/:id to delete template',
        400
      );
    } else {
      // Delete single budget instance
      await this.prisma.budget.delete({ where: { id } });
    }
  }

  /**
   * Get all budgets for a specific template
   * @param templateId - Template UUID
   * @param userId - User UUID
   */
  async getBudgetsByTemplate(templateId: string, userId: string): Promise<Budget[]> {
    return this.prisma.budget.findMany({
      where: {
        userId,
        templateId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            parentId: true,
          },
        },
      },
      orderBy: [{ startDate: 'asc' }],
    });
  }

  /**
   * Get a budget with calculated status and spent amount
   * @param id - Budget UUID
   * @param userId - User UUID
   * @throws AppError if budget not found
   */
  async getBudgetWithStatus(
    id: string,
    userId: string
  ): Promise<BudgetWithStatus> {
    const budget = await this.getBudgetById(id, userId);
    return this.enrichBudgetWithStatus(budget as any, userId);
  }

  /**
   * Get all budgets with status for a user
   * @param userId - User UUID
   * @param query - Optional filters
   */
  async getBudgetsWithStatus(
    userId: string,
    query?: BudgetQueryDto
  ): Promise<BudgetWithStatus[]> {
    const budgets = await this.getBudgets(userId, query);

    // Calculate status for each budget in parallel
    return Promise.all(
      budgets.map((budget) => this.enrichBudgetWithStatus(budget as any, userId))
    );
  }

  /**
   * Get budget summary for active budgets
   * Returns all budgets that are currently active (one-time budgets or recurring budgets covering today)
   * @param userId - User UUID
   */
  async getBudgetSummary(userId: string): Promise<BudgetSummaryResponse> {
    const now = new Date();

    // Get all budgets with status
    const allBudgets = await this.getBudgetsWithStatus(userId, {
      includeStatus: true,
    });

    // Filter to active budgets only:
    // - Recurring budgets: startDate <= now < endDate
    // - One-time budgets: startDate <= now and not complete
    const budgets = allBudgets.filter((budget) => {
      const startDate = new Date(budget.startDate);

      if (budget.periodType) {
        // Recurring budget - check if current date is in range
        const endDate = budget.endDate ? new Date(budget.endDate) : null;
        return startDate <= now && (!endDate || now < endDate);
      } else {
        // One-time budget - active if started and not complete
        return startDate <= now && !budget.isComplete;
      }
    });

    // Calculate totals
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remaining, 0);

    return {
      budgets,
      totalBudgeted,
      totalSpent,
      totalRemaining,
    };
  }

  /**
   * Enrich a budget with calculated status information
   * @private
   */
  private async enrichBudgetWithStatus(
    budget: Budget & { category: any },
    userId: string
  ): Promise<BudgetWithStatus> {
    // Calculate spent amount
    const spent = await this.calculateSpentAmount(budget, userId);

    // Calculate status
    const { status, percentage, remaining } = calculateBudgetStatus(
      spent,
      budget.amount.toNumber()
    );

    // Calculate isComplete for one-time budgets (>= 100% spent)
    const isComplete = !budget.periodType && percentage >= 100;

    return {
      id: budget.id,
      userId: budget.userId,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      categoryColor: budget.category.color,
      amount: budget.amount.toNumber(),
      type: budget.type, // NEW - include budget type in API response
      periodType: budget.periodType,
      interval: budget.interval,
      startDate: budget.startDate.toISOString(),
      endDate: budget.endDate ? budget.endDate.toISOString() : null,
      includeSubcategories: budget.includeSubcategories,
      name: budget.name || undefined,
      notes: budget.notes || undefined,
      templateId: budget.templateId || undefined,
      isCustomized: budget.isCustomized || false,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
      spent,
      remaining,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      status,
      isComplete,
    };
  }

  /**
   * Calculate spent amount for a budget period
   * @private
   */
  private async calculateSpentAmount(
    budget: Budget,
    userId: string
  ): Promise<number> {
    // Get category IDs (include descendants if flag is set)
    const categoryIds = budget.includeSubcategories
      ? [
          budget.categoryId,
          ...(await this.getDescendantCategoryIds(budget.categoryId, userId)),
        ]
      : [budget.categoryId];

    // Build date filter
    // For recurring budgets: use startDate and endDate
    // For one-time budgets: startDate to now (no endDate)
    const dateFilter: any = { gte: budget.startDate };
    if (budget.endDate) {
      dateFilter.lte = budget.endDate;
    }

    // Determine transaction type based on budget type
    const transactionType = budget.type === 'INCOME' ? 'INCOME' : 'EXPENSE';

    // Aggregate transaction amounts
    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: { in: categoryIds },
        date: dateFilter,
        type: transactionType,
      },
      _sum: { amount: true },
    });

    // For EXPENSE budgets: amounts are negative, return absolute value
    // For INCOME budgets: amounts are positive, return as-is
    const total = result._sum.amount?.toNumber() || 0;
    return budget.type === 'INCOME' ? total : Math.abs(total);
  }

  /**
   * Get all descendant category IDs recursively
   * @private
   */
  private async getDescendantCategoryIds(
    categoryId: string,
    userId: string
  ): Promise<string[]> {
    const descendants: string[] = [];

    const children = await this.prisma.category.findMany({
      where: {
        parentId: categoryId,
        OR: [
          { userId: null }, // System categories
          { userId }, // User's own categories
        ],
      },
      select: { id: true },
    });

    for (const child of children) {
      descendants.push(child.id);
      const childDescendants = await this.getDescendantCategoryIds(
        child.id,
        userId
      );
      descendants.push(...childDescendants);
    }

    return descendants;
  }
}
