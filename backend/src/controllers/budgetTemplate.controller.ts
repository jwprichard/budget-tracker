/**
 * Budget Template Controller
 * Handles HTTP requests for budget template management endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { BudgetTemplateService } from '../services/budgetTemplate.service';
import { BudgetService } from '../services/budget.service';
import {
  createBudgetTemplateSchema,
  updateBudgetTemplateSchema,
  updateBudgetInstanceSchema,
} from '../schemas/budgetTemplate.schema';
import { z } from 'zod';

const prisma = new PrismaClient();
const templateService = new BudgetTemplateService(prisma);
const budgetService = new BudgetService(prisma);

/**
 * Create a new budget template
 * POST /api/v1/budget-templates
 */
export const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const validatedData = createBudgetTemplateSchema.parse(req.body);

    const template = await templateService.createTemplate(validatedData, userId);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Budget template created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all budget templates for the authenticated user
 * GET /api/v1/budget-templates
 */
export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const templates = await templateService.getTemplates(userId);

    res.status(200).json({
      success: true,
      data: templates,
      message: 'Budget templates retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single budget template by ID
 * GET /api/v1/budget-templates/:id
 */
export const getTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const template = await templateService.getTemplateById(id!, userId);

    res.status(200).json({
      success: true,
      data: template,
      message: 'Budget template retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a budget template
 * PUT /api/v1/budget-templates/:id
 * Query params: ?updateInstances=true (default) to also update linked budgets
 */
export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updateInstances = (req.query['updateInstances'] as string) !== 'false'; // Default true
    const validatedData = updateBudgetTemplateSchema.parse(req.body);

    const template = await templateService.updateTemplate(
      id!,
      validatedData,
      userId,
      updateInstances
    );

    res.status(200).json({
      success: true,
      data: template,
      message: 'Budget template updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a budget template
 * DELETE /api/v1/budget-templates/:id
 * Deletes template and future instances, preserves past/current budgets
 */
export const deleteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await templateService.deleteTemplate(id!, userId);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Budget template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all budget instances for a template
 * GET /api/v1/budget-templates/:id/budgets
 */
export const getTemplateBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Verify template exists and belongs to user
    await templateService.getTemplateById(id!, userId);

    // Get budgets for this template
    const budgets = await budgetService.getBudgetsByTemplate(id!, userId);

    res.status(200).json({
      success: true,
      data: budgets,
      message: 'Template budgets retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate additional budget instances for a template
 * POST /api/v1/budget-templates/:id/generate
 * Body: { count?: number } (default 12)
 */
export const generateBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Validate count parameter
    const countSchema = z.object({
      count: z.number().int().min(1).max(52).optional().default(12),
    });
    const { count } = countSchema.parse(req.body);

    // Verify template exists and belongs to user
    await templateService.getTemplateById(id!, userId);

    // Generate budgets
    const budgets = await templateService.generateBudgets(id!, count);

    res.status(201).json({
      success: true,
      data: budgets,
      message: `Generated ${budgets.length} budget instances successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a budget instance with scope
 * PUT /api/v1/budget-templates/budgets/:budgetId
 * Body must include scope: 'THIS_ONLY' | 'THIS_AND_FUTURE' | 'ALL'
 */
export const updateBudgetInstance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { budgetId } = req.params;
    const validatedData = updateBudgetInstanceSchema.parse(req.body);

    const budget = await templateService.updateBudgetInstance(
      budgetId!,
      validatedData,
      userId
    );

    res.status(200).json({
      success: true,
      data: budget,
      message: 'Budget instance updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
