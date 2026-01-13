import { Router } from 'express';
import {
  getDailyBalances,
  getCategoryTotals,
  getSpendingTrends,
  getIncomeVsExpense,
} from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateQuery } from '../middlewares/validation';
import {
  dailyBalancesQuerySchema,
  categoryTotalsQuerySchema,
  spendingTrendsQuerySchema,
  incomeVsExpenseQuerySchema,
} from '../schemas/analytics.schema';

const router = Router();

// Apply authentication to all analytics routes
router.use(authenticate);

// GET /api/v1/analytics/daily-balances
router.get(
  '/daily-balances',
  validateQuery(dailyBalancesQuerySchema),
  getDailyBalances
);

// GET /api/v1/analytics/category-totals
router.get(
  '/category-totals',
  validateQuery(categoryTotalsQuerySchema),
  getCategoryTotals
);

// GET /api/v1/analytics/spending-trends
router.get(
  '/spending-trends',
  validateQuery(spendingTrendsQuerySchema),
  getSpendingTrends
);

// GET /api/v1/analytics/income-vs-expense
router.get(
  '/income-vs-expense',
  validateQuery(incomeVsExpenseQuerySchema),
  getIncomeVsExpense
);

export default router;
