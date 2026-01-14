import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import logger from '../utils/logger';

/**
 * Validation middleware factory
 *
 * Creates Express middleware that validates request data using Zod schemas.
 * Validates params, query, and body based on schema definition.
 *
 * @param schema - Zod schema (supports all Zod types including ZodEffects from .refine()/.transform())
 * @returns Express middleware function
 */
export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('[Validation] Request validation failed', {
          path: req.path,
          errors,
        });

        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      } else {
        // Unexpected error
        logger.error('[Validation] Unexpected validation error', { error });
        next(error);
      }
    }
  };
};
