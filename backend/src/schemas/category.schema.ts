import { z } from 'zod';

// Hex color validator
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be at most 50 characters')
    .trim(),
  color: z
    .string()
    .regex(hexColorRegex, 'Color must be a valid hex color code (e.g., #FF5733 or #F57)')
    .default('#757575'),
  icon: z
    .string()
    .max(50, 'Icon name must be at most 50 characters')
    .optional(),
  parentId: z
    .string()
    .uuid('Invalid parent category ID')
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be at most 50 characters')
    .trim()
    .optional(),
  color: z
    .string()
    .regex(hexColorRegex, 'Color must be a valid hex color code (e.g., #FF5733 or #F57)')
    .optional(),
  icon: z
    .string()
    .max(50, 'Icon name must be at most 50 characters')
    .optional()
    .nullable(),
  parentId: z
    .string()
    .uuid('Invalid parent category ID')
    .optional()
    .nullable(),
});

export const categoryQuerySchema = z.object({
  includeChildren: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  parentId: z
    .string()
    .uuid('Invalid parent category ID')
    .optional(),
  includeRoot: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
