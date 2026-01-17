import { PrismaClient, BudgetTemplate, Budget } from '@prisma/client';
import {
  CreateBudgetTemplateDto,
  UpdateBudgetTemplateDto,
  UpdateBudgetInstanceDto,
} from '../schemas/budgetTemplate.schema';
import {
  BudgetTemplateWithStats,
} from '../types/budget.types';
import { AppError } from '../middlewares/errorHandler';
import {
  calculatePeriodEndDate,
  calculateNextPeriodStart,
} from '../utils/periodCalculations';

export class BudgetTemplateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new budget template and generate initial budget instances
   * Creates template + next 12 periods of budgets automatically
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

    // Create template and generate initial budgets in a transaction
    const template = await this.prisma.$transaction(async (tx) => {
      // Create the template
      const newTemplate = await tx.budgetTemplate.create({
        data: {
          userId,
          categoryId: data.categoryId,
          amount: data.amount,
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

      // Generate next 12 periods of budgets
      await this.generateBudgetsForTemplate(newTemplate, 12, tx);

      return newTemplate;
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
        budgets: {
          select: {
            id: true,
            startDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with statistics
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
        budgets: {
          select: {
            id: true,
            startDate: true,
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
   * Update a budget template and optionally update linked instances
   * @param id - Template UUID
   * @param data - Update data
   * @param userId - User UUID
   * @param updateInstances - Whether to update non-customized future instances
   * @throws AppError if template not found or doesn't belong to user
   */
  async updateTemplate(
    id: string,
    data: UpdateBudgetTemplateDto,
    userId: string,
    updateInstances: boolean = true
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

    // Update template and optionally update instances in a transaction
    const template = await this.prisma.$transaction(async (tx) => {
      // Update the template
      const updated = await tx.budgetTemplate.update({
        where: { id },
        data: {
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.includeSubcategories !== undefined && {
            includeSubcategories: data.includeSubcategories,
          }),
          ...(data.endDate !== undefined && {
            endDate: data.endDate ? new Date(data.endDate) : null,
          }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      // Update non-customized future instances if requested
      if (updateInstances) {
        const now = new Date();
        const updateData: any = {};

        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.includeSubcategories !== undefined)
          updateData.includeSubcategories = data.includeSubcategories;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.notes !== undefined) updateData.notes = data.notes;

        // Add interval if provided
        if (data.interval !== undefined) updateData.interval = data.interval;

        // Only update if there's something to update
        if (Object.keys(updateData).length > 0) {
          await tx.budget.updateMany({
            where: {
              templateId: id,
              isCustomized: false,
              startDate: { gte: now }, // Future budgets only
            },
            data: updateData,
          });
        }
      }

      return updated;
    });

    return template;
  }

  /**
   * Delete a template and all future budget instances
   * Preserves past and current period budgets by detaching them from template
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
      const now = new Date();

      // Delete future budget instances (start date after today)
      await tx.budget.deleteMany({
        where: {
          templateId: id,
          startDate: { gt: now },
        },
      });

      // Detach past/current budgets (set templateId to null, mark as customized)
      await tx.budget.updateMany({
        where: {
          templateId: id,
          startDate: { lte: now },
        },
        data: {
          templateId: null,
          isCustomized: true,
        },
      });

      // Delete the template
      await tx.budgetTemplate.delete({ where: { id } });
    });
  }

  /**
   * Generate next N periods of budgets for a template
   * Used for rolling window maintenance
   * @param templateId - Template UUID
   * @param count - Number of periods to generate (default: 12)
   * @throws AppError if template not found
   */
  async generateBudgets(templateId: string, count: number = 12): Promise<Budget[]> {
    const template = await this.prisma.budgetTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    return this.prisma.$transaction(async (tx) => {
      return this.generateBudgetsForTemplate(template, count, tx);
    });
  }

  /**
   * Update a specific budget instance with update scope
   * @param budgetId - Budget UUID
   * @param data - Update data with scope
   * @param userId - User UUID
   * @throws AppError if budget not found or doesn't belong to user
   */
  async updateBudgetInstance(
    budgetId: string,
    data: UpdateBudgetInstanceDto,
    userId: string
  ): Promise<Budget> {
    // Get the budget with its template
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: { template: true },
    });

    if (!budget) {
      throw new AppError('Budget not found or access denied', 404);
    }

    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.includeSubcategories !== undefined)
      updateData.includeSubcategories = data.includeSubcategories;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.notes !== undefined) updateData.notes = data.notes;

    switch (data.scope) {
      case 'THIS_ONLY':
        // Update only this budget and mark as customized
        return this.prisma.budget.update({
          where: { id: budgetId },
          data: {
            ...updateData,
            isCustomized: true,
          },
        });

      case 'THIS_AND_FUTURE':
        // Update this and all future non-customized budgets
        if (!budget.templateId) {
          // If no template, just update this one
          return this.prisma.budget.update({
            where: { id: budgetId },
            data: updateData,
          });
        }

        await this.prisma.budget.updateMany({
          where: {
            templateId: budget.templateId,
            isCustomized: false,
            startDate: { gte: budget.startDate },
          },
          data: updateData,
        });

        // Return the updated budget
        return this.prisma.budget.findUniqueOrThrow({ where: { id: budgetId } });

      case 'ALL':
        // Update all budgets from template (regardless of customization)
        if (!budget.templateId) {
          // If no template, just update this one
          return this.prisma.budget.update({
            where: { id: budgetId },
            data: updateData,
          });
        }

        await this.prisma.budget.updateMany({
          where: { templateId: budget.templateId },
          data: {
            ...updateData,
            isCustomized: false, // Reset customization flag
          },
        });

        // Also update the template if we have one
        if (budget.template) {
          const templateUpdateData: any = {};
          if (data.amount !== undefined) templateUpdateData.amount = data.amount;
          if (data.includeSubcategories !== undefined)
            templateUpdateData.includeSubcategories = data.includeSubcategories;
          if (data.name !== undefined) templateUpdateData.name = data.name;
          if (data.notes !== undefined) templateUpdateData.notes = data.notes;

          await this.prisma.budgetTemplate.update({
            where: { id: budget.templateId },
            data: templateUpdateData,
          });
        }

        // Return the updated budget
        return this.prisma.budget.findUniqueOrThrow({ where: { id: budgetId } });

      default:
        throw new AppError('Invalid update scope', 400);
    }
  }

  /**
   * Maintenance job: Ensure all active templates have 12 future periods generated
   * Should be run periodically (e.g., daily cron job)
   */
  async maintainTemplates(): Promise<void> {
    const templates = await this.prisma.budgetTemplate.findMany({
      where: { isActive: true },
      include: {
        budgets: {
          select: {
            startDate: true,
          },
          orderBy: [{ startDate: 'desc' }],
        },
      },
    });

    const now = new Date();

    for (const template of templates) {
      try {
        // Check how many future periods exist
        const futureBudgets = template.budgets.filter((b) => b.startDate >= now);

        // Generate more if needed to maintain 12 future periods
        const needed = 12 - futureBudgets.length;
        if (needed > 0) {
          await this.generateBudgets(template.id, needed);
        }
      } catch (error) {
        console.error(`Error maintaining template ${template.id}:`, error);
        // Continue with other templates even if one fails
      }
    }
  }

  /**
   * Generate budget instances for a template
   * Internal helper used during template creation and maintenance
   * @private
   */
  private async generateBudgetsForTemplate(
    template: BudgetTemplate,
    count: number,
    tx: any // Prisma transaction client
  ): Promise<Budget[]> {
    // Find the last generated budget
    const lastBudget = await tx.budget.findFirst({
      where: { templateId: template.id },
      orderBy: [{ startDate: 'desc' }],
    });

    // Start from the next period after last budget, or from template start
    let currentStartDate: Date;

    if (lastBudget) {
      // Calculate next period start from last budget
      currentStartDate = calculateNextPeriodStart(
        lastBudget.startDate,
        template.periodType,
        template.interval
      );
    } else {
      // Start from template's first start date
      currentStartDate = new Date(template.firstStartDate);
    }

    const budgetsToCreate: any[] = [];

    // Generate up to count periods
    for (let i = 0; i < count; i++) {
      // Check if we've reached the end date
      if (template.endDate && currentStartDate >= template.endDate) {
        break;
      }

      // Calculate end date for this period
      const endDate = calculatePeriodEndDate(
        currentStartDate,
        template.periodType,
        template.interval
      );

      // Check if budget already exists (prevent duplicates)
      const existing = await tx.budget.findFirst({
        where: {
          userId: template.userId,
          categoryId: template.categoryId,
          startDate: currentStartDate,
        },
      });

      if (!existing) {
        budgetsToCreate.push({
          userId: template.userId,
          categoryId: template.categoryId,
          amount: template.amount,
          periodType: template.periodType,
          interval: template.interval,
          startDate: currentStartDate,
          endDate,
          includeSubcategories: template.includeSubcategories,
          name: template.name,
          notes: template.notes,
          templateId: template.id,
          isCustomized: false,
        });
      }

      // Move to next period
      currentStartDate = calculateNextPeriodStart(
        currentStartDate,
        template.periodType,
        template.interval
      );
    }

    // Create all budgets at once
    if (budgetsToCreate.length > 0) {
      await tx.budget.createMany({
        data: budgetsToCreate,
        skipDuplicates: true,
      });

      // Fetch and return created budgets
      return tx.budget.findMany({
        where: {
          templateId: template.id,
          startDate: { in: budgetsToCreate.map((b) => b.startDate) },
        },
      });
    }

    return [];
  }

  /**
   * Enrich template with calculated statistics
   * @private
   */
  private enrichTemplateWithStats(template: any): BudgetTemplateWithStats {
    const now = new Date();
    const futureBudgets = template.budgets.filter((b: any) => b.startDate >= now);

    // Calculate next period start date
    let nextPeriodStart: string | null = null;
    if (template.isActive && template.budgets.length > 0) {
      const lastBudget = template.budgets[0]; // Already sorted by desc startDate
      const next = calculateNextPeriodStart(
        lastBudget.startDate,
        template.periodType,
        template.interval
      );
      nextPeriodStart = next.toISOString();
    } else if (template.isActive) {
      nextPeriodStart = template.firstStartDate.toISOString();
    }

    return {
      id: template.id,
      userId: template.userId,
      categoryId: template.categoryId,
      categoryName: template.category.name,
      categoryColor: template.category.color,
      amount: template.amount.toNumber(),
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
      totalInstances: template.budgets.length,
      activeInstances: futureBudgets.length,
      nextPeriodStart,
    };
  }
}
