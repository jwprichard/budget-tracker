/**
 * Generic interface for banking data providers
 * Implementations: Akahu (personal/OAuth), Plaid, TrueLayer, etc.
 *
 * This interface defines the contract that any banking provider must implement.
 * It ensures that the core sync logic remains provider-agnostic and can work
 * with any banking API by swapping implementations.
 */

/**
 * Connection status information
 */
export interface ConnectionStatus {
  isValid: boolean;
  error?: string;
  lastChecked: Date;
}

/**
 * External account from banking provider
 */
export interface ExternalAccount {
  externalAccountId: string; // Provider's unique account ID
  name: string; // Account name (e.g., "Everyday Account")
  type: string; // Account type (e.g., "BANK", "CARD", "SAVINGS")
  institution: string; // Bank/institution name
  accountNumber?: string; // Masked account number (optional)
  balance?: {
    current: number;
    available?: number;
  };
  status: string; // Account status (e.g., "ACTIVE", "CLOSED")
  metadata?: Record<string, any>; // Provider-specific additional data
}

/**
 * External transaction from banking provider
 */
export interface ExternalTransaction {
  externalTransactionId: string; // Provider's unique transaction ID
  date: Date; // Transaction date
  amount: number; // Transaction amount (positive = credit, negative = debit)
  description: string; // Transaction description
  merchant?: string; // Merchant name (if available)
  category?: string; // Provider's category (if available)
  type: string; // Transaction type (provider-specific, e.g., "DEBIT", "CREDIT")
  balance?: number; // Account balance after transaction (optional)
  rawData?: any; // Full raw response from provider (for debugging)
}

/**
 * Paginated response for transactions
 */
export interface PaginatedTransactions {
  transactions: ExternalTransaction[];
  cursor?: string; // Pagination cursor for next page
  hasMore: boolean; // Whether more pages are available
}

/**
 * Options for fetching transactions
 */
export interface FetchTransactionsOptions {
  startDate?: Date; // Fetch transactions from this date
  endDate?: Date; // Fetch transactions until this date
  cursor?: string; // Pagination cursor
}

/**
 * Banking Data Provider Interface
 *
 * All banking providers (Akahu, Plaid, TrueLayer, etc.) must implement this interface.
 * This ensures that the sync logic can work with any provider without modification.
 */
export interface IBankingDataProvider {
  /**
   * Get provider name for logging and identification
   *
   * @returns Provider name (e.g., "AKAHU_PERSONAL", "PLAID", "TRUELAYER")
   */
  getProviderName(): string;

  /**
   * Test if connection is valid and working
   *
   * @param connectionId - Database ID of the BankConnection
   * @returns Connection status with validity and error info
   */
  testConnection(connectionId: string): Promise<ConnectionStatus>;

  /**
   * Fetch all accounts from the provider
   *
   * @param connectionId - Database ID of the BankConnection
   * @returns Array of external accounts
   */
  fetchAccounts(connectionId: string): Promise<ExternalAccount[]>;

  /**
   * Fetch transactions for a specific account with pagination
   *
   * @param connectionId - Database ID of the BankConnection
   * @param externalAccountId - Provider's account ID
   * @param options - Optional filters and pagination
   * @returns Paginated transaction response
   */
  fetchTransactions(
    connectionId: string,
    externalAccountId: string,
    options?: FetchTransactionsOptions
  ): Promise<PaginatedTransactions>;

  /**
   * Fetch all transactions for an account (handles pagination automatically)
   *
   * This is a convenience method that fetches all pages and returns all transactions.
   * Useful for initial sync or full refresh.
   *
   * @param connectionId - Database ID of the BankConnection
   * @param externalAccountId - Provider's account ID
   * @param options - Optional filters (startDate, endDate)
   * @returns Array of all transactions
   */
  fetchAllTransactions(
    connectionId: string,
    externalAccountId: string,
    options?: Pick<FetchTransactionsOptions, 'startDate' | 'endDate'>
  ): Promise<ExternalTransaction[]>;
}
