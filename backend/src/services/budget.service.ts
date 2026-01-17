import { PrismaClient, Budget } from '@prisma/client';
import { CreateBudgetDto, UpdateBudgetDto, BudgetQueryDto } from '../schemas/budget.schema';
import { BudgetWithStatus, BudgetSummaryResponse } from '../types/budget.types';
import { AppError } from '../middlewares/errorHandler';
import {
  getPeriodBoundaries,
  calculateBudgetStatus,
  getCurrentPeriod,
} from '../utils/budgetHelpers';

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

    // Check for duplicate budget (same category + period)
    const existing = await this.prisma.budget.findFirst({
      where: {
        userId,
        categoryId: data.categoryId,
        periodType: data.periodType,
        periodYear: data.periodYear,
        periodNumber: data.periodNumber,
      },
    });

    if (existing) {
      throw new AppError(
        'A budget already exists for this category and period',
        400
      );
    }

    // Create budget
    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        periodType: data.periodType,
        periodYear: data.periodYear,
        periodNumber: data.periodNumber,
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
    return this.prisma.budget.findMany({
      where: {
        userId,
        ...(query?.categoryId && { categoryId: query.categoryId }),
        ...(query?.periodType && { periodType: query.periodType }),
        ...(query?.periodYear && { periodYear: query.periodYear }),
        ...(query?.periodNumber && { periodNumber: query.periodNumber }),
        ...(query?.templateId !== undefined && { templateId: query.templateId }),
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
      orderBy: [{ periodYear: 'desc' }, { periodNumber: 'desc' }],
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
   * Only allows updating amount, includeSubcategories, name, and notes
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
      orderBy: [{ periodYear: 'asc' }, { periodNumber: 'asc' }],
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
   * Get budget summary for current period
   * @param userId - User UUID
   */
  async getBudgetSummary(userId: string): Promise<BudgetSummaryResponse> {
    // Get current month budgets (most common case)
    const currentPeriod = getCurrentPeriod('MONTHLY');
    const budgets = await this.getBudgetsWithStatus(userId, {
      periodType: 'MONTHLY',
      periodYear: currentPeriod.year,
      periodNumber: currentPeriod.periodNumber,
      includeStatus: true,
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

    // Get period boundaries
    const { startDate, endDate } = getPeriodBoundaries(
      budget.periodType,
      budget.periodYear,
      budget.periodNumber
    );

    return {
      id: budget.id,
      userId: budget.userId,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      categoryColor: budget.category.color,
      amount: budget.amount.toNumber(),
      periodType: budget.periodType,
      periodYear: budget.periodYear,
      periodNumber: budget.periodNumber,
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
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
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

    // Calculate period boundaries
    const { startDate, endDate } = getPeriodBoundaries(
      budget.periodType,
      budget.periodYear,
      budget.periodNumber
    );

    // Aggregate transaction amounts (expenses only)
    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: { in: categoryIds },
        date: { gte: startDate, lte: endDate },
        type: 'EXPENSE',
      },
      _sum: { amount: true },
    });

    // Return absolute value (amounts are negative for expenses)
    return Math.abs(result._sum.amount?.toNumber() || 0);
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
