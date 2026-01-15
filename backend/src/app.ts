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
import syncRoutes from './routes/syncRoutes';
import analyticsRoutes from './routes/analytics.routes';
import devRoutes from './routes/dev.routes';

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);

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
app.use(`/api/${API_VERSION}/sync`, syncRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/dev`, devRoutes);
app.use('/api', healthRoutes); // Also mount at /api for backwards compatibility

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
