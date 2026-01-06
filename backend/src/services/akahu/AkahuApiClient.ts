import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from '../../utils/logger';

/**
 * Akahu API response types
 * These match the structure returned by Akahu's REST API
 */

export interface AkahuAccount {
  _id: string;
  name: string;
  type: string; // BANK, CARD, etc.
  connection: {
    _id: string;
    name: string; // Bank name
  };
  formatted_account?: string;
  balance?: {
    current: number;
    available: number;
  };
  status: string;
  meta?: Record<string, any>;
}

export interface AkahuTransaction {
  _id: string;
  date: string;
  description: string;
  amount: number;
  balance?: number;
  type: string; // DEBIT, CREDIT
  merchant?: {
    name: string;
    category?: string;
  };
  meta?: Record<string, any>;
}

export interface AkahuPaginatedResponse<T> {
  items: T[];
  cursor?: {
    next?: string;
  };
}

/**
 * Low-level HTTP client for Akahu API
 *
 * This class handles:
 * - HTTP requests to Akahu API
 * - Request/response formatting
 * - Error handling and logging
 * - Rate limiting and retries
 *
 * It does NOT handle:
 * - Database operations
 * - Business logic
 * - Provider interface implementation (see AkahuPersonalProvider)
 */
export class AkahuApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env['AKAHU_BASE_URL'] || 'https://api.akahu.nz';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all accounts (personal app token)
   *
   * @param appToken - Unencrypted app token
   * @returns Array of Akahu accounts
   */
  async getAccounts(appToken: string): Promise<AkahuAccount[]> {
    try {
      logger.info('[AkahuApiClient] Fetching accounts');

      const response = await this.client.get<AkahuPaginatedResponse<AkahuAccount>>(
        '/api/v1/accounts',
        {
          headers: {
            'X-Akahu-ID': appToken,
          },
        }
      );

      logger.info(`[AkahuApiClient] Fetched ${response.data.items.length} accounts`);
      return response.data.items;
    } catch (error) {
      logger.error('[AkahuApiClient] Failed to fetch accounts', { error });
      throw error;
    }
  }

  /**
   * Get transactions for an account with pagination
   *
   * @param appToken - Unencrypted app token
   * @param accountId - Akahu account ID
   * @param options - Filter and pagination options
   * @returns Paginated transaction response
   */
  async getTransactions(
    appToken: string,
    accountId: string,
    options?: {
      start?: Date;
      end?: Date;
      cursor?: string;
    }
  ): Promise<AkahuPaginatedResponse<AkahuTransaction>> {
    try {
      logger.info('[AkahuApiClient] Fetching transactions', { accountId, options });

      const params = new URLSearchParams();
      if (options?.start) {
        const startDate = options.start.toISOString().split('T')[0];
        if (startDate) {
          params.append('start', startDate);
        }
      }
      if (options?.end) {
        const endDate = options.end.toISOString().split('T')[0];
        if (endDate) {
          params.append('end', endDate);
        }
      }
      if (options?.cursor) {
        params.append('cursor', options.cursor);
      }

      const url = `/api/v1/accounts/${accountId}/transactions${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const response = await this.client.get<AkahuPaginatedResponse<AkahuTransaction>>(url, {
        headers: {
          'X-Akahu-ID': appToken,
        },
      });

      logger.info(`[AkahuApiClient] Fetched ${response.data.items.length} transactions`);
      return response.data;
    } catch (error) {
      logger.error('[AkahuApiClient] Failed to fetch transactions', { accountId, error });
      throw error;
    }
  }

  /**
   * Fetch all transactions with automatic pagination
   *
   * @param appToken - Unencrypted app token
   * @param accountId - Akahu account ID
   * @param options - Filter options
   * @returns Array of all transactions
   */
  async getAllTransactions(
    appToken: string,
    accountId: string,
    options?: {
      start?: Date;
      end?: Date;
    }
  ): Promise<AkahuTransaction[]> {
    const allTransactions: AkahuTransaction[] = [];
    let cursor: string | undefined;
    let pageCount = 0;
    const maxPages = 100; // Safety limit

    do {
      const response = await this.getTransactions(appToken, accountId, {
        ...options,
        cursor,
      });

      allTransactions.push(...response.items);
      cursor = response.cursor?.next;
      pageCount++;

      // Rate limiting: small delay between requests
      if (cursor && pageCount < maxPages) {
        await this.delay(100);
      }

      if (pageCount >= maxPages) {
        logger.warn('[AkahuApiClient] Reached max page limit', { accountId, pageCount });
        break;
      }
    } while (cursor);

    logger.info(
      `[AkahuApiClient] Fetched total of ${allTransactions.length} transactions in ${pageCount} pages`
    );
    return allTransactions;
  }

  /**
   * Handle API errors with appropriate error messages
   *
   * @param error - Axios error object
   */
  private handleApiError(error: AxiosError): void {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      logger.error('[AkahuApiClient] API error', {
        status,
        message: data?.message || data?.error,
        path: error.config?.url,
      });

      switch (status) {
        case 401:
          throw new Error('Invalid or expired app token');
        case 403:
          throw new Error('Access forbidden - check permissions');
        case 404:
          throw new Error('Resource not found');
        case 429:
          throw new Error('Rate limit exceeded - please try again later');
        case 500:
        case 502:
        case 503:
          throw new Error('Akahu service temporarily unavailable');
        default:
          throw new Error(`Akahu API error: ${data?.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      logger.error('[AkahuApiClient] No response from API', { error: error.message });
      throw new Error('Unable to connect to Akahu API');
    } else {
      logger.error('[AkahuApiClient] Error setting up request', { error: error.message });
      throw new Error('Internal error communicating with Akahu');
    }
  }

  /**
   * Utility: delay execution
   *
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
