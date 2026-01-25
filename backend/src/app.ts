import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import categoryRoutes from './routes/category.routes';
import budgetRoutes from './routes/budget.routes';
import budgetTemplateRoutes from './routes/budgetTemplate.routes';
import plannedTransactionRoutes from './routes/plannedTransaction.routes';
import forecastRoutes from './routes/forecast.routes';
import matchingRoutes from './routes/matching.routes';
import syncRoutes from './routes/syncRoutes';
import analyticsRoutes from './routes/analytics.routes';
import devRoutes from './routes/dev.routes';
import ruleRoutes from './routes/rule.routes';
import potentialTransferRoutes from './routes/potentialTransfer.routes';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
// In production, allow requests from the same host on port 80
// In development, allow localhost:5173 (Vite dev server)
const corsOrigin = process.env['CORS_ORIGIN'] ||
  (process.env['NODE_ENV'] === 'production' ? true : 'http://localhost:5173');

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Rate limiting - relaxed for self-hosted app, strict only for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit auth attempts to prevent brute force
  message: 'Too many authentication attempts, please try again later',
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute - generous for single-user app
  message: 'Too many requests, please try again later',
});

app.use('/api/v1/auth', authLimiter);
app.use('/api', generalLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// API routes
const API_VERSION = process.env['API_VERSION'] || 'v1';
app.use(`/api/${API_VERSION}/auth`, authRoutes); // Auth routes (public)
app.use(`/api/${API_VERSION}`, healthRoutes);
app.use(`/api/${API_VERSION}/accounts`, accountRoutes);
app.use(`/api/${API_VERSION}/transactions`, transactionRoutes);
app.use(`/api/${API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${API_VERSION}/budgets`, budgetRoutes);
app.use(`/api/${API_VERSION}/budget-templates`, budgetTemplateRoutes);
app.use(`/api/${API_VERSION}/planned-transactions`, plannedTransactionRoutes);
app.use(`/api/${API_VERSION}/forecast`, forecastRoutes);
app.use(`/api/${API_VERSION}/matching`, matchingRoutes);
app.use(`/api/${API_VERSION}/sync`, syncRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/rules`, ruleRoutes);
app.use(`/api/${API_VERSION}/potential-transfers`, potentialTransferRoutes);
app.use(`/api/${API_VERSION}/dev`, devRoutes);
app.use('/api', healthRoutes); // Also mount at /api for backwards compatibility

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
