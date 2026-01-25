import { PrismaClient, BudgetTemplate, Budget } from '@prisma/client';
import {
  CreateBudgetTemplateDto,
  UpdateBudgetTemplateDto,
} from '../schemas/budgetTemplate.schema';
import {
  BudgetTemplateWithStats,
} from '../types/budget.types';
import { AppError } from '../middlewares/errorHandler';
import {
  generateVirtualPeriods,
  getCurrentPeriod,
  getNextPeriod,
  TemplateWithCategory,
} from '../utils/virtualPeriods';

export class BudgetTemplateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new budget template
   * No longer generates budget instances - periods are calculated on-the-fly
   * @param data - Template creation data
   * @param userId - User UUID
   * @throws AppError if category not found, doesn't belong to user, or duplicate template name exists
   */
  async createTemplate(
    data: CreateBudgetTemplateDto,
    userId: string
  ): Promise<BudgetTemplate> {
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

    // Verify account exists and belongs to user
    const account = await this.prisma.account.findFirst({
      where: {
        id: data.accountId,
        userId,
      },
    });

    if (!account) {
      throw new AppError('Account not found or access denied', 404);
    }

    // Check for duplicate template name
    const existing = await this.prisma.budgetTemplate.findFirst({
      where: {
        userId,
        name: data.name,
      },
    });

    if (existing) {
      throw new AppError('A template with this name already exists', 400);
    }

    // Create template only - no budget instances generated
    const template = await this.prisma.budgetTemplate.create({
      data: {
        userId,
        categoryId: data.categoryId,
        accountId: data.accountId,
        amount: data.amount,
        type: data.type || 'EXPENSE',
        periodType: data.periodType,
        interval: data.interval,
        includeSubcategories: data.includeSubcategories,
        firstStartDate: new Date(data.firstStartDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: true,
        name: data.name,
        notes: data.notes,
      },
    });

    return template;
  }

  /**
   * Get all templates for a user with statistics
   * @param userId - User UUID
   */
  async getTemplates(userId: string): Promise<BudgetTemplateWithStats[]> {
    const templates = await this.prisma.budgetTemplate.findMany({
      where: { userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with statistics (calculated from virtual periods)
    return templates.map((template) => this.enrichTemplateWithStats(template));
  }

  /**
   * Get a single template by ID with statistics
   * @param id - Template UUID
   * @param userId - User UUID
   * @throws AppError if template not found or doesn't belong to user
   */
  async getTemplateById(
    id: string,
    userId: string
  ): Promise<BudgetTemplateWithStats> {
    const template = await this.prisma.budgetTemplate.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    return this.enrichTemplateWithStats(template);
  }

  /**
   * Update a budget template
   * Changes apply to all future virtual periods automatically
   * Existing overrides are not affected
   * @param id - Template UUID
   * @param data - Update data
   * @param userId - User UUID
   * @throws AppError if template not found or doesn't belong to user
   */
  async updateTemplate(
    id: string,
    data: UpdateBudgetTemplateDto,
    userId: string
  ): Promise<BudgetTemplate> {
    // Verify template exists and belongs to user
    const existing = await this.prisma.budgetTemplate.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Template not found or access denied', 404);
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.prisma.budgetTemplate.findFirst({
        where: {
          userId,
          name: data.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new AppError('A template with this name already exists', 400);
      }
    }

    // Verify account exists and belongs to user if being changed
    if (data.accountId) {
      const account = await this.prisma.account.findFirst({
        where: {
          id: data.accountId,
          userId,
        },
      });

      if (!account) {
        throw new AppError('Account not found or access denied', 404);
      }
    }

    // Update the template - no instance management needed
    // Virtual periods will automatically reflect the new values
    const template = await this.prisma.budgetTemplate.update({
      where: { id },
      data: {
        ...(data.accountId !== undefined && { accountId: data.accountId }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.interval !== undefined && { interval: data.interval }),
        ...(data.includeSubcategories !== undefined && {
          includeSubcategories: data.includeSubcategories,
        }),
        ...(data.firstStartDate !== undefined && {
          firstStartDate: new Date(data.firstStartDate),
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return template;
  }

  /**
   * Delete a template and all its override budgets
   * @param id - Template UUID
   * @param userId - User UUID
   * @throws AppError if template not found or doesn't belong to user
   */
  async deleteTemplate(id: string, userId: string): Promise<void> {
    // Verify template exists and belongs to user
    const template = await this.prisma.budgetTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete all override budgets linked to this template
      await tx.budget.deleteMany({
        where: { templateId: id },
      });

      // Delete the template
      await tx.budgetTemplate.delete({ where: { id } });
    });
  }

  /**
   * Create an override for a specific period of a template
   * Used when a user wants to customize a virtual period
   * @param templateId - Template UUID
   * @param periodStartDate - The start date of the period to override
   * @param data - Override customizations
   * @param userId - User UUID
   * @throws AppError if template not found or period doesn't exist
   */
  async createPeriodOverride(
    templateId: string,
    periodStartDate: Date,
    data: {
      amount?: number;
      name?: string;
      notes?: string | null;
      includeSubcategories?: boolean;
    },
    userId: string
  ): Promise<Budget> {
    // Get the template
    const template = await this.prisma.budgetTemplate.findFirst({
      where: { id: templateId, userId },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!template) {
      throw new AppError('Template not found or access denied', 404);
    }

    // Verify the period exists by generating virtual periods around this date
    const rangeStart = new Date(periodStartDate);
    rangeStart.setDate(rangeStart.getDate() - 1); // Day before
    const rangeEnd = new Date(periodStartDate);
    rangeEnd.setDate(rangeEnd.getDate() + 1); // Day after

    const virtualPeriods = generateVirtualPeriods(
      template as TemplateWithCategory,
      rangeStart,
      rangeEnd
    );

    // Find the period that matches the start date
    const matchingPeriod = virtualPeriods.find(
      (p) => p.startDate.getTime() === periodStartDate.getTime()
    );

    if (!matchingPeriod) {
      throw new AppError('No period exists for this date', 400);
    }

    // Check if an override already exists for this period
    const existingOverride = await this.prisma.budget.findFirst({
      where: {
        templateId,
        startDate: periodStartDate,
      },
    });

    if (existingOverride) {
      // Update existing override
      return this.prisma.budget.update({
        where: { id: existingOverride.id },
        data: {
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.includeSubcategories !== undefined && {
            includeSubcategories: data.includeSubcategories,
          }),
        },
      });
    }

    // Create new override budget
    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: template.categoryId,
        accountId: template.accountId,
        amount: data.amount ?? Number(template.amount),
        type: template.type,
        periodType: template.periodType,
        interval: template.interval,
        startDate: matchingPeriod.startDate,
        endDate: matchingPeriod.endDate,
        includeSubcategories: data.includeSubcategories ?? template.includeSubcategories,
        name: data.name ?? template.name,
        notes: data.notes ?? template.notes,
        templateId: template.id,
        isCustomized: true,
      },
    });
  }

  /**
   * Update an existing override budget
   * @param budgetId - Budget UUID (must be an override, i.e., has templateId)
   * @param data - Update data
   * @param userId - User UUID
   * @throws AppError if budget not found or is not an override
   */
  async updateOverride(
    budgetId: string,
    data: {
      amount?: number;
      name?: string;
      notes?: string | null;
      includeSubcategories?: boolean;
    },
    userId: string
  ): Promise<Budget> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new AppError('Budget not found or access denied', 404);
    }

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.includeSubcategories !== undefined && {
          includeSubcategories: data.includeSubcategories,
        }),
        isCustomized: true,
      },
    });
  }

  /**
   * Delete an override, returning the period to virtual status
   * @param budgetId - Budget UUID (must be an override)
   * @param userId - User UUID
   * @throws AppError if budget not found or is not an override
   */
  async deleteOverride(budgetId: string, userId: string): Promise<void> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId, templateId: { not: null } },
    });

    if (!budget) {
      throw new AppError('Override not found or access denied', 404);
    }

    await this.prisma.budget.delete({ where: { id: budgetId } });
  }

  /**
   * Get all overrides for a template
   * @param templateId - Template UUID
   * @param userId - User UUID
   */
  async getOverridesForTemplate(templateId: string, userId: string): Promise<Budget[]> {
    return this.prisma.budget.findMany({
      where: {
        templateId,
        userId,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Enrich template with calculated statistics
   * @private
   */
  private enrichTemplateWithStats(template: any): BudgetTemplateWithStats {
    // Calculate next period start from virtual periods
    let nextPeriodStart: string | null = null;

    if (template.isActive) {
      const nextPeriod = getNextPeriod(template as TemplateWithCategory);
      const currentPeriod = getCurrentPeriod(template as TemplateWithCategory);

      if (nextPeriod) {
        nextPeriodStart = nextPeriod.startDate.toISOString();
      } else if (currentPeriod) {
        // Current period exists but no next (template might be ending)
        nextPeriodStart = currentPeriod.startDate.toISOString();
      } else {
        // Template hasn't started yet
        nextPeriodStart = template.firstStartDate.toISOString();
      }
    }

    return {
      id: template.id,
      userId: template.userId,
      categoryId: template.categoryId,
      categoryName: template.category.name,
      categoryColor: template.category.color,
      accountId: template.accountId,
      accountName: template.account?.name || null,
      amount: template.amount.toNumber(),
      type: template.type,
      periodType: template.periodType,
      interval: template.interval,
      includeSubcategories: template.includeSubcategories,
      firstStartDate: template.firstStartDate.toISOString(),
      endDate: template.endDate ? template.endDate.toISOString() : null,
      isActive: template.isActive,
      name: template.name,
      notes: template.notes,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      // These are now less meaningful but kept for API compatibility
      // In future, could calculate number of periods in a time range
      totalInstances: 0,
      activeInstances: 0,
      nextPeriodStart,
    };
  }
}
