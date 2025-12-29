// API Response types

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
  version: string;
}

// Account types
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'INVESTMENT' | 'OTHER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  category?: string | null;
  currency: string;
  initialBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountWithBalance extends Account {
  currentBalance: number;
  transactionCount: number;
}

// Transaction types
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'CLEARED' | 'RECONCILED';

export interface Transaction {
  id: string;
  accountId: string;
  categoryId?: string | null;
  type: TransactionType;
  amount: number;
  date: Date;
  description: string;
  notes?: string | null;
  status: TransactionStatus;
  transferToAccountId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  account?: {
    id: string;
    name: string;
    type: string;
  };
  transferAccount?: {
    id: string;
    name: string;
    type: string;
  };
}
