// API Response types (matching backend)

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
  category: string | null;
  currency: string;
  initialBalance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  category?: string;
  currency?: string;
  initialBalance: number;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  category?: string;
  currency?: string;
  initialBalance?: number;
}

export interface AccountBalance {
  accountId: string;
  currentBalance: number;
  transactionCount: number;
}

// Transaction types
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'CLEARED' | 'RECONCILED';

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: string;
  date: string;
  description: string;
  notes: string | null;
  status: TransactionStatus;
  transferToAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    name: string;
    type: AccountType;
  };
  transferAccount?: {
    id: string;
    name: string;
    type: AccountType;
  } | null;
}

export interface CreateTransactionDto {
  accountId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes?: string;
  status?: TransactionStatus;
}

export interface UpdateTransactionDto {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  amount?: number;
  date?: string;
  description?: string;
  notes?: string;
  status?: TransactionStatus;
}

export interface CreateTransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  description: string;
}

export interface TransferResult {
  fromTransaction: Transaction;
  toTransaction: Transaction;
}

export interface TransactionQuery {
  accountId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

// Category types
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: Category | null;
  children?: Category[];
  _count?: {
    transactions: number;
  };
}

export interface CreateCategoryDto {
  name: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
}

export interface CategoryQuery {
  includeChildren?: boolean;
  parentId?: string;
  includeRoot?: boolean;
}
