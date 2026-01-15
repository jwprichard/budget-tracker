import { z } from 'zod';

/**
 * Zod validation schemas for rule endpoints
 */

// Text match schema
const textMatchSchema = z.object({
  field: z.enum(['description', 'merchant', 'notes']),
  operator: z.enum(['contains', 'exact', 'startsWith', 'endsWith']),
  value: z.string().min(1).max(255),
  caseSensitive: z.boolean().default(false),
});

// Text rule conditions schema
const textRuleConditionsSchema = z.object({
  type: z.literal('text'),
  textMatch: textMatchSchema,
});

// Rule conditions union schema
const conditionsSchema = textRuleConditionsSchema;

// Create rule schema
export const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
  conditions: conditionsSchema,
  priority: z.number().int().default(0),
  isEnabled: z.boolean().default(true),
});

// Update rule schema (all fields optional)
export const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  categoryId: z.string().uuid().optional(),
  conditions: conditionsSchema.optional(),
  priority: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

// Query params schema
export const getRulesQuerySchema = z.object({
  includeDisabled: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});
