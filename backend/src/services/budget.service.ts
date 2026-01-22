import { PrismaClient, Budget, BudgetType, Prisma } from '@prisma/client';
import { CreateBudgetDto, UpdateBudgetDto, BudgetQueryDto } from '../schemas/budget.schema';
import {
  BudgetWithStatus,
  BudgetSummaryResponse,
  BudgetHistoricalResponse,
  HistoricalComparisonType,
  CategoryBudgetSummary,
  TrendPeriod,
  BudgetStatus,
} from '../types/budget.types';
import { AppError } from '../middlewares/errorHandler';
import { calculateBudgetStatus } from '../utils/budgetHelpers';
import { calculatePeriodEndDate } from '../utils/periodCalculations';
import {
  generateVirtualPeriods,
  VirtualPeriod,
  TemplateWithCategory,
} from '../utils/virtualPeriods';

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
   * Get all budgets for a date range with virtual period expansion
   * This is the main query method for the virtual periods architecture:
   * 1. Fetch templates and expand to virtual periods in range
   * 2. Fetch one-time budgets in range
   * 3. Fetch override budgets in range
   * 4. Merge (overrides replace matching virtual periods)
   * 5. Calculate spent/remaining/status for each
   *
   * @param userId - User UUID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param options - Optional filters (categoryId, type)
   */
  async getBudgetsForDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      categoryId?: string;
      type?: BudgetType;
    }
  ): Promise<BudgetWithStatus[]> {
    // 1. Fetch all active templates for user
    const templates = await this.prisma.budgetTemplate.findMany({
      where: {
        userId,
        isActive: true,
        ...(options?.categoryId && { categoryId: options.categoryId }),
        ...(options?.type && { type: options.type }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // 2. Generate virtual periods for each template
    const virtualPeriods: VirtualPeriod[] = [];
    for (const template of templates) {
      const periods = generateVirtualPeriods(
        template as TemplateWithCategory,
        startDate,
        endDate
      );
      virtualPeriods.push(...periods);
    }

    // 3. Fetch override budgets in range (budgets with templateId)
    const overrides = await this.prisma.budget.findMany({
      where: {
        userId,
        templateId: { not: null },
        startDate: { gte: startDate },
        endDate: { lte: endDate },
        ...(options?.categoryId && { categoryId: options.categoryId }),
        ...(options?.type && { type: options.type }),
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
    });

    // 4. Fetch one-time budgets in range (budgets without templateId)
    const oneTimeBudgets = await this.prisma.budget.findMany({
      where: {
        userId,
        templateId: null,
        startDate: { gte: startDate },
        OR: [
          { endDate: null },
          { endDate: { lte: endDate } },
        ],
        ...(options?.categoryId && { categoryId: options.categoryId }),
        ...(options?.type && { type: options.type }),
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
    });

    // 5. Build override lookup map (templateId + startDate -> override)
    const overrideMap = new Map<string, Budget & { category: any }>();
    for (const override of overrides) {
      const key = `${override.templateId}_${override.startDate.toISOString()}`;
      overrideMap.set(key, override);
    }

    // 6. Merge virtual periods with overrides
    const allBudgets: Array<{
      budget: Budget & { category: any };
      isVirtual: boolean;
    }> = [];

    // Add virtual periods (replaced by overrides if they exist)
    for (const vp of virtualPeriods) {
      const key = `${vp.templateId}_${vp.startDate.toISOString()}`;
      const override = overrideMap.get(key);

      if (override) {
        // Use the override instead of virtual period
        allBudgets.push({ budget: override, isVirtual: false });
        // Remove from map so we don't add it again
        overrideMap.delete(key);
      } else {
        // Convert virtual period to Budget-like object
        const template = templates.find((t) => t.id === vp.templateId);
        if (template) {
          const virtualBudget: Budget & { category: any } = {
            id: vp.id,
            userId: vp.userId,
            categoryId: vp.categoryId,
            amount: new Prisma.Decimal(vp.amount),
            type: vp.type,
            periodType: vp.periodType,
            interval: vp.interval,
            startDate: vp.startDate,
            endDate: vp.endDate,
            includeSubcategories: vp.includeSubcategories,
            implicitSpendMode: template.implicitSpendMode,
            name: vp.name,
            notes: vp.notes,
            templateId: vp.templateId,
            isCustomized: false,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            category: template.category,
          };
          allBudgets.push({ budget: virtualBudget, isVirtual: true });
        }
      }
    }

    // Add any overrides that weren't matched (shouldn't happen normally)
    for (const override of overrideMap.values()) {
      allBudgets.push({ budget: override, isVirtual: false });
    }

    // Add one-time budgets
    for (const budget of oneTimeBudgets) {
      allBudgets.push({ budget, isVirtual: false });
    }

    // 7. Calculate status for each budget
    const budgetsWithStatus = await Promise.all(
      allBudgets.map(async ({ budget, isVirtual }) => {
        const enriched = await this.enrichBudgetWithStatus(budget, userId);
        return {
          ...enriched,
          isVirtual,
        };
      })
    );

    // Sort by start date descending
    budgetsWithStatus.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    return budgetsWithStatus;
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
   * Get historical comparison data for budgets
   * @param userId - User UUID
   * @param type - Comparison type: 'previous', 'trend', or 'yoy'
   * @param periodType - Period granularity for comparison (defaults to 'MONTHLY')
   */
  async getBudgetHistoricalComparison(
    userId: string,
    type: HistoricalComparisonType,
    periodType: 'WEEKLY' | 'MONTHLY' = 'MONTHLY'
  ): Promise<BudgetHistoricalResponse> {
    const now = new Date();

    // Calculate current period boundaries
    const { startDate: currentStart, endDate: currentEnd, periodLabel: currentLabel } =
      this.getPeriodBoundaries(now, periodType);

    // Get current period data
    const currentData = await this.getPeriodBudgetData(userId, currentStart, currentEnd);

    // Build response based on comparison type
    const response: BudgetHistoricalResponse = {
      type,
      current: {
        period: currentLabel,
        startDate: currentStart.toISOString(),
        endDate: currentEnd.toISOString(),
        totalBudgeted: currentData.totalBudgeted,
        totalSpent: currentData.totalSpent,
        percentage: currentData.totalBudgeted > 0
          ? Math.round((currentData.totalSpent / currentData.totalBudgeted) * 10000) / 100
          : 0,
        status: this.calculateOverallStatus(currentData.totalSpent, currentData.totalBudgeted),
        categories: currentData.categories,
      },
      comparison: null,
    };

    if (type === 'previous') {
      // Get previous period
      const prevDate = this.subtractPeriod(currentStart, periodType, 1);
      const { startDate: prevStart, endDate: prevEnd, periodLabel: prevLabel } =
        this.getPeriodBoundaries(prevDate, periodType);

      const prevData = await this.getPeriodBudgetData(userId, prevStart, prevEnd);

      response.comparison = {
        period: prevLabel,
        startDate: prevStart.toISOString(),
        endDate: prevEnd.toISOString(),
        totalBudgeted: prevData.totalBudgeted,
        totalSpent: prevData.totalSpent,
        percentage: prevData.totalBudgeted > 0
          ? Math.round((prevData.totalSpent / prevData.totalBudgeted) * 10000) / 100
          : 0,
        budgetedChange: this.calculatePercentageChange(prevData.totalBudgeted, currentData.totalBudgeted),
        spentChange: this.calculatePercentageChange(prevData.totalSpent, currentData.totalSpent),
      };
    } else if (type === 'trend') {
      // Get last 6 periods including current
      const trendPeriods: TrendPeriod[] = [];

      for (let i = 5; i >= 0; i--) {
        const periodDate = this.subtractPeriod(currentStart, periodType, i);
        const { startDate, endDate, periodLabel } = this.getPeriodBoundaries(periodDate, periodType);
        const periodData = await this.getPeriodBudgetData(userId, startDate, endDate);

        const percentage = periodData.totalBudgeted > 0
          ? Math.round((periodData.totalSpent / periodData.totalBudgeted) * 10000) / 100
          : 0;

        trendPeriods.push({
          period: periodLabel,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalBudgeted: periodData.totalBudgeted,
          totalSpent: periodData.totalSpent,
          percentage,
          status: this.calculateOverallStatus(periodData.totalSpent, periodData.totalBudgeted),
        });
      }

      response.trend = trendPeriods;

      // Set comparison to the previous period (index 4, since current is index 5)
      if (trendPeriods.length >= 2) {
        const prevPeriod = trendPeriods[trendPeriods.length - 2]!;
        response.comparison = {
          period: prevPeriod.period,
          startDate: prevPeriod.startDate,
          endDate: prevPeriod.endDate,
          totalBudgeted: prevPeriod.totalBudgeted,
          totalSpent: prevPeriod.totalSpent,
          percentage: prevPeriod.percentage,
          budgetedChange: this.calculatePercentageChange(prevPeriod.totalBudgeted, currentData.totalBudgeted),
          spentChange: this.calculatePercentageChange(prevPeriod.totalSpent, currentData.totalSpent),
        };
      }
    } else if (type === 'yoy') {
      // Get same period from previous year
      const yoyDate = new Date(currentStart);
      yoyDate.setFullYear(yoyDate.getFullYear() - 1);
      const { startDate: yoyStart, endDate: yoyEnd, periodLabel: yoyLabel } =
        this.getPeriodBoundaries(yoyDate, periodType);

      const yoyData = await this.getPeriodBudgetData(userId, yoyStart, yoyEnd);

      response.comparison = {
        period: yoyLabel,
        startDate: yoyStart.toISOString(),
        endDate: yoyEnd.toISOString(),
        totalBudgeted: yoyData.totalBudgeted,
        totalSpent: yoyData.totalSpent,
        percentage: yoyData.totalBudgeted > 0
          ? Math.round((yoyData.totalSpent / yoyData.totalBudgeted) * 10000) / 100
          : 0,
        budgetedChange: this.calculatePercentageChange(yoyData.totalBudgeted, currentData.totalBudgeted),
        spentChange: this.calculatePercentageChange(yoyData.totalSpent, currentData.totalSpent),
      };
    }

    return response;
  }

  /**
   * Get period boundaries and label
   * @private
   */
  private getPeriodBoundaries(
    date: Date,
    periodType: 'WEEKLY' | 'MONTHLY'
  ): { startDate: Date; endDate: Date; periodLabel: string } {
    if (periodType === 'WEEKLY') {
      // Get Monday of the week
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const startDate = new Date(date);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      // Week number calculation
      const weekNum = Math.ceil((((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7);
      const periodLabel = `Week ${weekNum} ${date.getFullYear()}`;

      return { startDate, endDate, periodLabel };
    } else {
      // Monthly
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const periodLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      return { startDate, endDate, periodLabel };
    }
  }

  /**
   * Subtract periods from a date
   * @private
   */
  private subtractPeriod(date: Date, periodType: 'WEEKLY' | 'MONTHLY', count: number): Date {
    const result = new Date(date);
    if (periodType === 'WEEKLY') {
      result.setDate(result.getDate() - (count * 7));
    } else {
      result.setMonth(result.getMonth() - count);
    }
    return result;
  }

  /**
   * Get budget data for a specific period
   * @private
   */
  private async getPeriodBudgetData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBudgeted: number;
    totalSpent: number;
    categories: CategoryBudgetSummary[];
  }> {
    // Get all budgets that overlap with this period
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: endDate },
        OR: [
          { endDate: null },
          { endDate: { gte: startDate } },
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Calculate spent for each budget/category
    const categoryMap = new Map<string, CategoryBudgetSummary>();
    let totalBudgeted = 0;
    let totalSpent = 0;

    for (const budget of budgets) {
      // Get category IDs (include descendants if flag is set)
      const categoryIds = budget.includeSubcategories
        ? [
            budget.categoryId,
            ...(await this.getDescendantCategoryIds(budget.categoryId, userId)),
          ]
        : [budget.categoryId];

      // Determine transaction type based on budget type
      const transactionType = budget.type === 'INCOME' ? 'INCOME' : 'EXPENSE';

      // Get spent amount for this period
      const result = await this.prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: { in: categoryIds },
          date: { gte: startDate, lte: endDate },
          type: transactionType,
        },
        _sum: { amount: true },
      });

      const spent = budget.type === 'INCOME'
        ? (result._sum.amount?.toNumber() || 0)
        : Math.abs(result._sum.amount?.toNumber() || 0);
      const budgetAmount = budget.amount.toNumber();
      const percentage = budgetAmount > 0
        ? Math.round((spent / budgetAmount) * 10000) / 100
        : 0;

      // Only include expense budgets in the summary (for dashboard clarity)
      if (budget.type === 'EXPENSE') {
        totalBudgeted += budgetAmount;
        totalSpent += spent;

        // Aggregate by category (merge if same category appears multiple times)
        const existing = categoryMap.get(budget.categoryId);
        if (existing) {
          existing.budgeted += budgetAmount;
          existing.spent += spent;
          existing.percentage = existing.budgeted > 0
            ? Math.round((existing.spent / existing.budgeted) * 10000) / 100
            : 0;
          existing.status = this.calculateOverallStatus(existing.spent, existing.budgeted);
        } else {
          categoryMap.set(budget.categoryId, {
            categoryId: budget.categoryId,
            categoryName: budget.category.name,
            categoryColor: budget.category.color,
            budgeted: budgetAmount,
            spent,
            percentage,
            status: this.calculateOverallStatus(spent, budgetAmount),
          });
        }
      }
    }

    return {
      totalBudgeted,
      totalSpent,
      categories: Array.from(categoryMap.values()),
    };
  }

  /**
   * Calculate overall budget status
   * @private
   */
  private calculateOverallStatus(spent: number, budgeted: number): BudgetStatus {
    if (budgeted <= 0) return 'ON_TRACK';
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return 'EXCEEDED';
    if (percentage >= 80) return 'WARNING';
    if (percentage >= 50) return 'ON_TRACK';
    return 'UNDER_BUDGET';
  }

  /**
   * Calculate percentage change between two values
   * @private
   */
  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) {
      return newValue === 0 ? 0 : 100;
    }
    return Math.round(((newValue - oldValue) / oldValue) * 10000) / 100;
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
