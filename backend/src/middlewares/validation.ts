import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

/**
 * Validation middleware for validating request body, query, and params
 * Uses Zod schemas to validate and parse incoming requests
 */
export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      // Global error handler will format Zod errors
      next(error);
    }
  };
};

/**
 * Simplified validator for just the request body
 * Parses and replaces req.body with validated data
 */
export const validateBody = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Simplified validator for just the query parameters
 * Parses and replaces req.query with validated data
 */
export const validateQuery = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Simplified validator for just the route params
 * Parses and replaces req.params with validated data
 */
export const validateParams = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};
