import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { RuleService } from '../services/rule.service';
import { CategorizationService } from '../services/CategorizationService';
import { createRuleSchema, updateRuleSchema, getRulesQuerySchema } from '../schemas/rule.schema';

const prisma = new PrismaClient();
const ruleService = new RuleService(prisma);
const categorizationService = new CategorizationService(prisma);

/**
 * Create a new categorization rule
 * POST /api/v1/rules
 */
export const createRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Validate request body
    const validatedData = createRuleSchema.parse(req.body);

    // Create rule
    const rule = await ruleService.createRule(validatedData, userId);

    // Invalidate categorization cache for this user
    categorizationService.invalidateRuleCache(userId);

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all rules for current user
 * GET /api/v1/rules
 */
export const getRules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Validate query params
    const validatedQuery = getRulesQuerySchema.parse(req.query);

    // Get rules
    const rules = await ruleService.getRules(userId, {
      includeDisabled: validatedQuery.includeDisabled,
    });

    res.status(200).json({
      success: true,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single rule by ID
 * GET /api/v1/rules/:id
 */
export const getRuleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: 'Rule ID is required' });
      return;
    }

    const rule = await ruleService.getRuleById(id, userId);

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a rule
 * PUT /api/v1/rules/:id
 */
export const updateRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: 'Rule ID is required' });
      return;
    }

    // Validate request body
    const validatedData = updateRuleSchema.parse(req.body);

    // Update rule
    const rule = await ruleService.updateRule(id, validatedData, userId);

    // Invalidate categorization cache for this user
    categorizationService.invalidateRuleCache(userId);

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a rule
 * DELETE /api/v1/rules/:id
 */
export const deleteRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: 'Rule ID is required' });
      return;
    }

    await ruleService.deleteRule(id, userId);

    // Invalidate categorization cache for this user
    categorizationService.invalidateRuleCache(userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
