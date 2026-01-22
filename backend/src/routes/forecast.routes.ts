/**
 * Forecast Routes
 * Defines API routes for cash flow forecasting
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getForecast,
  getForecastSummary,
  getLowBalanceWarnings,
} from '../controllers/forecast.controller';

const router = Router();

/**
 * All forecast routes require authentication
 */
router.use(authenticate);

/**
 * Forecast endpoints
 * Base path: /api/v1/forecast
 */

// Get full forecast with daily breakdowns
router.get('/', getForecast);

// Get summary statistics only (faster, less data)
router.get('/summary', getForecastSummary);

// Get low balance warnings
router.get('/low-balance-warnings', getLowBalanceWarnings);

export default router;
