/**
 * Planned Transaction Controller
 * Handles HTTP requests for planned transaction management endpoints
 *
 * Supports:
 * - Planned transaction templates (recurring patterns)
 * - One-time planned transactions
 * - Virtual occurrences (generated on-the-fly from templates)
 * - Override instances (customized occurrences)
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PlannedTransactionTemplateService } from '../services/plannedTransactionTemplate.service';
import { PlannedTransactionService } from '../services/plannedTransaction.service';
import {
  createPlannedTransactionTemplateSchema,
  updatePlannedTransactionTemplateSchema,
  createPlannedTransactionSchema,
  updatePlannedTransactionSchema,
  plannedTransactionTemplateQuerySchema,
  plannedTransactionQuerySchema,
  templateOccurrencesQuerySchema,
} from '../schemas/plannedTransaction.schema';

const prisma = new PrismaClient();
const templateService = new PlannedTransactionTemplateService(prisma);
const plannedTransactionService = new PlannedTransactionService(prisma);

// ============================================================================
// Template Endpoints
// ============================================================================

/**
 * Create a new planned transaction template
 * POST /api/v1/planned-transactions/templates
 */
export const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const validatedData = createPlannedTransactionTemplateSchema.parse(req.body);

    const template = await templateService.createTemplate(validatedData, userId);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Planned transaction template created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all planned transaction templates for the authenticated user
 * GET /api/v1/planned-transactions/templates
 */
export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = plannedTransactionTemplateQuerySchema.parse(req.query);

    const templates = await templateService.getTemplates(userId, query);

    res.status(200).json({
      success: true,
      data: templates,
      message: 'Planned transaction templates retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single planned transaction template by ID
 * GET /api/v1/planned-transactions/templates/:id
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
      message: 'Planned transaction template retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a planned transaction template
 * PUT /api/v1/planned-transactions/templates/:id
 */
export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const validatedData = updatePlannedTransactionTemplateSchema.parse(req.body);

    const template = await templateService.updateTemplate(id!, validatedData, userId);

    res.status(200).json({
      success: true,
      data: template,
      message: 'Planned transaction template updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a planned transaction template
 * DELETE /api/v1/planned-transactions/templates/:id
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
      message: 'Planned transaction template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get occurrences for a template within a date range
 * GET /api/v1/planned-transactions/templates/:id/occurrences
 * Query params: startDate, endDate
 */
export const getTemplateOccurrences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const query = templateOccurrencesQuerySchema.parse(req.query);

    const occurrences = await templateService.getOccurrences(
      id!,
      new Date(query.startDate),
      new Date(query.endDate),
      userId
    );

    res.status(200).json({
      success: true,
      data: occurrences,
      message: 'Template occurrences retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Planned Transaction Endpoints (One-time & Overrides)
// ============================================================================

/**
 * Create a new planned transaction (one-time or override)
 * POST /api/v1/planned-transactions
 */
export const createPlannedTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const validatedData = createPlannedTransactionSchema.parse(req.body);

    const plannedTransaction = await plannedTransactionService.create(validatedData, userId);

    res.status(201).json({
      success: true,
      data: plannedTransaction,
      message: 'Planned transaction created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get planned transactions for the authenticated user
 * GET /api/v1/planned-transactions
 * Query params: startDate, endDate, accountId, categoryId, type, templateId, includeVirtual
 */
export const getPlannedTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = plannedTransactionQuerySchema.parse(req.query);

    const plannedTransactions = await plannedTransactionService.getPlannedTransactions(userId, query);

    res.status(200).json({
      success: true,
      data: plannedTransactions,
      message: 'Planned transactions retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single planned transaction by ID
 * GET /api/v1/planned-transactions/:id
 * Note: ID can be a real UUID or a virtual ID (virtual_{templateId}_{date})
 */
export const getPlannedTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const plannedTransaction = await plannedTransactionService.getById(id!, userId);

    res.status(200).json({
      success: true,
      data: plannedTransaction,
      message: 'Planned transaction retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a planned transaction
 * PUT /api/v1/planned-transactions/:id
 * Note: If ID is virtual, creates an override instead
 */
export const updatePlannedTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const validatedData = updatePlannedTransactionSchema.parse(req.body);

    const plannedTransaction = await plannedTransactionService.update(id!, validatedData, userId);

    res.status(200).json({
      success: true,
      data: plannedTransaction,
      message: 'Planned transaction updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a planned transaction
 * DELETE /api/v1/planned-transactions/:id
 * Note: Virtual occurrences cannot be deleted directly
 */
export const deletePlannedTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await plannedTransactionService.delete(id!, userId);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Planned transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
