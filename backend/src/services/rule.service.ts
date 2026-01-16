import { PrismaClient } from '@prisma/client';
import { CreateRuleDto, UpdateRuleDto, CategoryRuleResponse } from '../types/rule.types';
import { AppError } from '../middlewares/errorHandler';

export class RuleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new categorization rule
   * @param data - Rule creation data
   * @param userId - User UUID
   * @throws AppError if category not found or access denied
   */
  async createRule(data: CreateRuleDto, userId: string): Promise<CategoryRuleResponse> {
    // Verify category exists and belongs to user (or is a system category)
    const category = await this.prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { userId: null }], // User's category or system category
      },
    });

    if (!category) {
      throw new AppError('Category not found or access denied', 404);
    }

    const rule = await this.prisma.categoryRule.create({
      data: {
        userId,
        name: data.name,
        categoryId: data.categoryId,
        conditions: data.conditions as object,
        priority: data.priority ?? 0,
        isEnabled: data.isEnabled ?? true,
        isSystem: false,
      },
    });

    return rule as unknown as CategoryRuleResponse;
  }

  /**
   * Get all rules for a user
   * @param userId - User UUID
   * @param options - Query options
   */
  async getRules(
    userId: string,
    options?: { includeDisabled?: boolean }
  ): Promise<CategoryRuleResponse[]> {
    const rules = await this.prisma.categoryRule.findMany({
      where: {
        userId,
        ...(options?.includeDisabled ? {} : { isEnabled: true }),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return rules as unknown as CategoryRuleResponse[];
  }

  /**
   * Get a single rule by ID
   * @param id - Rule UUID
   * @param userId - User UUID
   * @throws AppError if rule not found or access denied
   */
  async getRuleById(id: string, userId: string): Promise<CategoryRuleResponse> {
    const rule = await this.prisma.categoryRule.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!rule) {
      throw new AppError('Rule not found or access denied', 404);
    }

    return rule as unknown as CategoryRuleResponse;
  }

  /**
   * Update an existing rule
   * @param id - Rule UUID
   * @param data - Rule update data
   * @param userId - User UUID
   * @throws AppError if rule not found, access denied, or system rule modification attempted
   */
  async updateRule(id: string, data: UpdateRuleDto, userId: string): Promise<CategoryRuleResponse> {
    // Verify ownership
    const existing = await this.prisma.categoryRule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Rule not found or access denied', 404);
    }

    if (existing.isSystem) {
      throw new AppError('Cannot modify system rules', 403);
    }

    // If changing category, verify new category exists and belongs to user
    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [{ userId }, { userId: null }],
        },
      });

      if (!category) {
        throw new AppError('Category not found or access denied', 404);
      }
    }

    const rule = await this.prisma.categoryRule.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.conditions && { conditions: data.conditions as object }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return rule as unknown as CategoryRuleResponse;
  }

  /**
   * Delete a rule
   * @param id - Rule UUID
   * @param userId - User UUID
   * @throws AppError if rule not found, access denied, or system rule deletion attempted
   */
  async deleteRule(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.categoryRule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Rule not found or access denied', 404);
    }

    if (existing.isSystem) {
      throw new AppError('Cannot delete system rules', 403);
    }

    await this.prisma.categoryRule.delete({ where: { id } });
  }

  /**
   * Increment match count for a rule (called when rule matches a transaction)
   * @param ruleId - Rule UUID
   */
  async incrementMatchCount(ruleId: string): Promise<void> {
    await this.prisma.categoryRule.update({
      where: { id: ruleId },
      data: {
        matchCount: { increment: 1 },
        lastMatched: new Date(),
      },
    });
  }
}
