/**
 * Budget Template Controller
 * Handles HTTP requests for budget template management endpoints
 *
 * With virtual periods architecture:
 * - Templates define the pattern (no instances pre-generated)
 * - Periods are calculated on-the-fly
 * - Overrides are created only when user customizes a period
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { BudgetTemplateService } from '../services/budgetTemplate.service';
import {
  createBudgetTemplateSchema,
  updateBudgetTemplateSchema,
  createOverrideSchema,
  updateOverrideSchema,
} from '../schemas/budgetTemplate.schema';

const prisma = new PrismaClient();
const templateService = new BudgetTemplateService(prisma);

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
 * Changes apply to all future virtual periods automatically
 * Existing overrides are not affected
 */
export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const validatedData = updateBudgetTemplateSchema.parse(req.body);

    const template = await templateService.updateTemplate(
      id!,
      validatedData,
      userId
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
 * Deletes template and all its override budgets
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
 * Get all overrides for a template
 * GET /api/v1/budget-templates/:id/overrides
 */
export const getTemplateOverrides = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Verify template exists and belongs to user
    await templateService.getTemplateById(id!, userId);

    // Get overrides for this template
    const overrides = await templateService.getOverridesForTemplate(id!, userId);

    res.status(200).json({
      success: true,
      data: overrides,
      message: 'Template overrides retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create an override for a specific period
 * POST /api/v1/budget-templates/:id/overrides
 * Body: { periodStartDate, amount?, name?, notes?, includeSubcategories? }
 */
export const createPeriodOverride = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const validatedData = createOverrideSchema.parse(req.body);

    const override = await templateService.createPeriodOverride(
      id!,
      new Date(validatedData.periodStartDate),
      {
        amount: validatedData.amount,
        name: validatedData.name,
        notes: validatedData.notes,
        includeSubcategories: validatedData.includeSubcategories,
      },
      userId
    );

    res.status(201).json({
      success: true,
      data: override,
      message: 'Period override created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing override
 * PUT /api/v1/budget-templates/overrides/:budgetId
 */
export const updateOverride = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { budgetId } = req.params;
    const validatedData = updateOverrideSchema.parse(req.body);

    const override = await templateService.updateOverride(
      budgetId!,
      validatedData,
      userId
    );

    res.status(200).json({
      success: true,
      data: override,
      message: 'Override updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an override (returns period to virtual status)
 * DELETE /api/v1/budget-templates/overrides/:budgetId
 */
export const deleteOverride = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { budgetId } = req.params;

    await templateService.deleteOverride(budgetId!, userId);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Override deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
