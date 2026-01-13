import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryHierarchy,
  getCategoryStats,
} from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validation';
import { createCategorySchema, updateCategorySchema, categoryQuerySchema } from '../schemas/category.schema';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/v1/categories - Get all categories
router.get('/', validateQuery(categoryQuerySchema), getAllCategories);

// GET /api/v1/categories/hierarchy - Get full category hierarchy tree
router.get('/hierarchy', getCategoryHierarchy);

// POST /api/v1/categories - Create category
router.post('/', validateBody(createCategorySchema), createCategory);

// GET /api/v1/categories/:id - Get category by ID
router.get('/:id', getCategoryById);

// PUT /api/v1/categories/:id - Update category
router.put('/:id', validateBody(updateCategorySchema), updateCategory);

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', deleteCategory);

// GET /api/v1/categories/:id/stats - Get category with transaction count
router.get('/:id/stats', getCategoryStats);

export default router;
