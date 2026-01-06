# Feature Plan: Akahu Personal App Integration

**Milestone**: 8.5 - Automatic Bank Data Synchronization (Personal Tier)
**Status**: 📋 PLANNING
**Created**: January 7, 2026
**Complexity**: High
**Priority**: High

---

## Overview

Integrate with Akahu Personal App to automatically synchronize bank transactions from a single connected account. This implementation is designed for the **personal app tier** (single account, no OAuth, no webhooks) but architected with clear abstraction layers to enable easy migration to multi-account tier in the future.

### Key Benefits
- **Zero Manual Entry**: Transactions automatically imported from bank
- **Always Accurate**: Balances sync with actual bank balance
- **Historical Backfill**: Import past transactions for complete history
- **Smart Duplicate Detection**: Avoid importing existing transactions
- **Manual Trigger**: On-demand sync when needed
- **Future-Proof Architecture**: Easy upgrade path to multi-account tier

### Architecture Principles

**🎯 Design for Migration**: The core application logic is completely decoupled from Akahu implementation details through abstraction layers. When upgrading to multi-account tier:
- ✅ Replace the `AkahuApiClient` implementation (personal → OAuth)
- ✅ Update database schema (add OAuth models)
- ✅ Add authentication UI flow
- ❌ **NO changes needed** to transaction sync logic, duplicate detection, or UI components

---

## Technical Architecture

### Abstraction Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                       │
│  (TransactionList, SyncButton, SyncStatus, AccountDetails)  │
└───────────────────────┬─────────────────────────────────────┘
                        │ Uses
┌───────────────────────▼─────────────────────────────────────┐
│              Frontend API Service Layer                      │
│                  (api/syncService.ts)                        │
│         Generic interface - no provider specifics            │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP
┌───────────────────────▼─────────────────────────────────────┐
│                 Backend API Endpoints                        │
│             POST /api/v1/sync/trigger                        │
│             GET  /api/v1/sync/status                         │
│             GET  /api/v1/sync/history                        │
└───────────────────────┬─────────────────────────────────────┘
                        │ Calls
┌───────────────────────▼─────────────────────────────────────┐
│                   SyncService                                │
│        Core business logic - provider agnostic               │
│   syncTransactions(), detectDuplicates(), etc.               │
└──────────┬────────────────────────────┬─────────────────────┘
           │ Uses Interface             │ Uses
┌──────────▼────────────────┐  ┌────────▼────────────────────┐
│  IBankingDataProvider     │  │   DuplicateDetectionService │
│  (Interface/Contract)     │  │   TransactionMappingService │
└──────────┬────────────────┘  └─────────────────────────────┘
           │ Implemented by
┌──────────▼────────────────┐
│   AkahuPersonalProvider   │◄─── SWAP THIS FOR MULTI-ACCOUNT
│  (Personal App Impl)      │     (AkahuOAuthProvider)
└──────────┬────────────────┘
           │ Uses
┌──────────▼────────────────┐
│   AkahuApiClient          │◄─── HTTP client wrapper
│   (axios + app token)     │
└───────────────────────────┘
```

**Key Insight**: By using the `IBankingDataProvider` interface, we can swap out the personal app implementation for OAuth implementation later **without touching any upstream code**.

---

## Database Schema

### Design Philosophy
- **Minimal for MVP**: Only what's needed for personal app
- **Extensible**: Clear migration path to multi-account
- **Clean Relations**: Proper foreign keys for data integrity

### New Models

#### 1. BankConnection (Future-Proof)

```prisma
model BankConnection {
  id              String    @id @default(uuid())
  provider        String    @default("AKAHU_PERSONAL") // AKAHU_PERSONAL, AKAHU_OAUTH, PLAID, etc.
  status          String    @default("ACTIVE") // ACTIVE, INACTIVE, ERROR
  lastSync        DateTime?
  lastError       String?

  // Personal App fields (used now)
  appToken        String?   @db.Text // Encrypted, nullable for future OAuth

  // OAuth fields (not used now, ready for future)
  accessToken     String?   @db.Text // Encrypted, null for personal app
  refreshToken    String?   @db.Text // Encrypted, null for personal app
  tokenExpiry     DateTime? // null for personal app

  metadata        Json?     // Flexible storage for provider-specific data
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  linkedAccounts  LinkedAccount[]
  syncHistory     SyncHistory[]

  @@index([provider])
  @@index([status])
}
```

**Migration Note**: When upgrading to OAuth, we:
1. Create new BankConnection with `provider = "AKAHU_OAUTH"`
2. Populate OAuth fields
3. Re-link accounts to new connection
4. Archive old personal connection

#### 2. LinkedAccount

```prisma
model LinkedAccount {
  id                String    @id @default(uuid())
  connectionId      String

  // External provider data
  externalAccountId String    // Akahu's account ID (_id from API)
  externalName      String    // Account name from Akahu
  externalType      String    // BANK, CARD, etc.
  institution       String    // Bank name
  accountNumber     String?   // Masked account number

  // Link to local account
  localAccountId    String?   @unique

  // Sync control
  syncEnabled       Boolean   @default(true)
  lastSync          DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  connection        BankConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  localAccount      Account?       @relation(fields: [localAccountId], references: [id], onDelete: SetNull)
  externalTransactions ExternalTransaction[]

  @@unique([connectionId, externalAccountId])
  @@index([connectionId])
  @@index([externalAccountId])
  @@index([localAccountId])
  @@index([syncEnabled])
}
```

**Why "LinkedAccount" not "AkahuAccount"?**
- Provider-agnostic naming supports future integrations (Plaid, TrueLayer, etc.)
- Clear conceptual model: external account → linked to → local account

#### 3. ExternalTransaction

```prisma
model ExternalTransaction {
  id                  String    @id @default(uuid())
  linkedAccountId     String

  // External provider data
  externalTransactionId String  @unique // Akahu's transaction ID
  date                DateTime
  amount              Decimal   @db.Decimal(15, 2)
  description         String
  merchant            String?
  category            String?   // Provider's category
  type                String    // Provider's type (DEBIT, CREDIT, etc.)
  balance             Decimal?  @db.Decimal(15, 2)

  // Link to local transaction
  localTransactionId  String?   @unique

  // Duplicate detection
  isDuplicate         Boolean   @default(false)
  duplicateConfidence Int?      // 0-100
  needsReview         Boolean   @default(false)

  // Raw data for debugging
  rawData             Json?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  linkedAccount       LinkedAccount @relation(fields: [linkedAccountId], references: [id], onDelete: Cascade)
  localTransaction    Transaction?  @relation(fields: [localTransactionId], references: [id], onDelete: SetNull)

  @@index([linkedAccountId])
  @@index([externalTransactionId])
  @@index([localTransactionId])
  @@index([date])
  @@index([isDuplicate])
  @@index([needsReview])
}
```

**Why "ExternalTransaction" not "AkahuTransaction"?**
- Works for any banking provider
- Clear distinction: external (from bank) vs local (in our system)

#### 4. SyncHistory

```prisma
model SyncHistory {
  id                  String    @id @default(uuid())
  connectionId        String
  type                String    // FULL, INCREMENTAL, MANUAL
  status              String    // PENDING, IN_PROGRESS, COMPLETED, FAILED

  startedAt           DateTime  @default(now())
  completedAt         DateTime?

  // Results
  accountsSynced      Int       @default(0)
  transactionsFetched Int       @default(0)
  transactionsImported Int      @default(0)
  duplicatesDetected  Int       @default(0)
  needsReview         Int       @default(0)

  errorMessage        String?
  errorDetails        Json?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  connection          BankConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@index([connectionId])
  @@index([status])
  @@index([startedAt])
}
```

#### 5. Updates to Existing Models

```prisma
model Account {
  // ... existing fields ...

  // Add reverse relation
  linkedAccount    LinkedAccount? // One-to-one with external account

  // Helper fields
  isLinkedToBank   Boolean   @default(false)
  lastBankSync     DateTime?
}

model Transaction {
  // ... existing fields ...

  // Add reverse relation
  externalTransaction ExternalTransaction? // One-to-one with external transaction

  // Helper field
  isFromBank       Boolean   @default(false)
}
```

---

## Backend Implementation

### 1. Banking Data Provider Interface

**File**: `backend/src/interfaces/IBankingDataProvider.ts`

```typescript
/**
 * Generic interface for banking data providers
 * Implementations: Akahu (personal/OAuth), Plaid, TrueLayer, etc.
 */
export interface IBankingDataProvider {
  /**
   * Get provider name for logging/debugging
   */
  getProviderName(): string;

  /**
   * Test connection validity
   */
  testConnection(connectionId: string): Promise<ConnectionStatus>;

  /**
   * Fetch all accounts from provider
   */
  fetchAccounts(connectionId: string): Promise<ExternalAccount[]>;

  /**
   * Fetch transactions for an account
   * @param startDate - Fetch transactions from this date
   * @param endDate - Fetch transactions until this date
   */
  fetchTransactions(
    connectionId: string,
    externalAccountId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      cursor?: string; // For pagination
    }
  ): Promise<PaginatedTransactions>;

  /**
   * Fetch all transactions with automatic pagination
   */
  fetchAllTransactions(
    connectionId: string,
    externalAccountId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ExternalTransaction[]>;
}

// Common types
export interface ConnectionStatus {
  isValid: boolean;
  error?: string;
  lastChecked: Date;
}

export interface ExternalAccount {
  externalAccountId: string;
  name: string;
  type: string;
  institution: string;
  accountNumber?: string;
  balance?: {
    current: number;
    available?: number;
  };
  status: string;
}

export interface ExternalTransaction {
  externalTransactionId: string;
  date: Date;
  amount: number;
  description: string;
  merchant?: string;
  category?: string;
  type: string;
  balance?: number;
  rawData?: any;
}

export interface PaginatedTransactions {
  transactions: ExternalTransaction[];
  cursor?: string; // Next page cursor
  hasMore: boolean;
}
```

**Why This Matters**: This interface defines the contract. Any banking provider that implements this interface will work with our sync logic.

### 2. Akahu Personal Provider Implementation

**File**: `backend/src/services/akahu/AkahuPersonalProvider.ts`

```typescript
import { IBankingDataProvider, ExternalAccount, ExternalTransaction, PaginatedTransactions } from '../../interfaces/IBankingDataProvider';
import { AkahuApiClient } from './AkahuApiClient';
import { prisma } from '../../utils/prisma';
import { decrypt } from '../../utils/encryption';

/**
 * Akahu Personal App implementation
 * Uses app token (no OAuth)
 */
export class AkahuPersonalProvider implements IBankingDataProvider {
  private apiClient: AkahuApiClient;

  constructor() {
    this.apiClient = new AkahuApiClient();
  }

  getProviderName(): string {
    return 'AKAHU_PERSONAL';
  }

  async testConnection(connectionId: string): Promise<ConnectionStatus> {
    try {
      const connection = await prisma.bankConnection.findUnique({
        where: { id: connectionId }
      });

      if (!connection || !connection.appToken) {
        return { isValid: false, error: 'Connection not found', lastChecked: new Date() };
      }

      const appToken = decrypt(connection.appToken);

      // Test by fetching accounts
      await this.apiClient.getAccounts(appToken);

      return { isValid: true, lastChecked: new Date() };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      };
    }
  }

  async fetchAccounts(connectionId: string): Promise<ExternalAccount[]> {
    const connection = await this.getConnection(connectionId);
    const appToken = decrypt(connection.appToken!);

    const akahuAccounts = await this.apiClient.getAccounts(appToken);

    return akahuAccounts.map(acc => ({
      externalAccountId: acc._id,
      name: acc.name,
      type: acc.type,
      institution: acc.connection.name,
      accountNumber: acc.formatted_account,
      balance: acc.balance ? {
        current: acc.balance.current,
        available: acc.balance.available
      } : undefined,
      status: acc.status
    }));
  }

  async fetchTransactions(
    connectionId: string,
    externalAccountId: string,
    options?: { startDate?: Date; endDate?: Date; cursor?: string }
  ): Promise<PaginatedTransactions> {
    const connection = await this.getConnection(connectionId);
    const appToken = decrypt(connection.appToken!);

    const result = await this.apiClient.getTransactions(
      appToken,
      externalAccountId,
      options
    );

    return {
      transactions: result.items.map(this.mapAkahuTransaction),
      cursor: result.cursor?.next,
      hasMore: !!result.cursor?.next
    };
  }

  async fetchAllTransactions(
    connectionId: string,
    externalAccountId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<ExternalTransaction[]> {
    const connection = await this.getConnection(connectionId);
    const appToken = decrypt(connection.appToken!);

    const allTransactions = await this.apiClient.getAllTransactions(
      appToken,
      externalAccountId,
      options
    );

    return allTransactions.map(this.mapAkahuTransaction);
  }

  // Helper methods
  private async getConnection(connectionId: string) {
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      throw new Error('Bank connection not found');
    }

    return connection;
  }

  private mapAkahuTransaction(akahuTx: any): ExternalTransaction {
    return {
      externalTransactionId: akahuTx._id,
      date: new Date(akahuTx.date),
      amount: akahuTx.amount,
      description: akahuTx.description,
      merchant: akahuTx.merchant?.name,
      category: akahuTx.merchant?.category,
      type: akahuTx.type,
      balance: akahuTx.balance,
      rawData: akahuTx
    };
  }
}
```

**Migration Note**: When upgrading to OAuth:
1. Create `AkahuOAuthProvider` that implements `IBankingDataProvider`
2. Use `accessToken` instead of `appToken`
3. Add token refresh logic
4. Everything else stays the same!

### 3. Akahu API Client (HTTP Wrapper)

**File**: `backend/src/services/akahu/AkahuApiClient.ts`

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../../utils/logger';

// Akahu API response types
interface AkahuAccount {
  _id: string;
  name: string;
  type: string;
  connection: {
    _id: string;
    name: string;
  };
  formatted_account?: string;
  balance?: {
    current: number;
    available: number;
  };
  status: string;
  meta?: Record<string, any>;
}

interface AkahuTransaction {
  _id: string;
  date: string;
  description: string;
  amount: number;
  balance?: number;
  type: string;
  merchant?: {
    name: string;
    category?: string;
  };
  meta?: Record<string, any>;
}

interface AkahuPaginatedResponse<T> {
  items: T[];
  cursor?: {
    next?: string;
  };
}

/**
 * Low-level HTTP client for Akahu API
 * Handles request/response, errors, and retries
 */
export class AkahuApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AKAHU_BASE_URL || 'https://api.akahu.nz';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
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
   */
  async getAccounts(appToken: string): Promise<AkahuAccount[]> {
    try {
      logger.info('[Akahu] Fetching accounts');

      const response = await this.client.get<AkahuPaginatedResponse<AkahuAccount>>(
        '/api/v1/accounts',
        {
          headers: {
            'X-Akahu-ID': appToken,
          },
        }
      );

      logger.info(`[Akahu] Fetched ${response.data.items.length} accounts`);
      return response.data.items;
    } catch (error) {
      logger.error('[Akahu] Failed to fetch accounts', { error });
      throw new Error('Failed to fetch accounts from Akahu');
    }
  }

  /**
   * Get transactions for an account with pagination
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
      logger.info('[Akahu] Fetching transactions', { accountId, options });

      const params = new URLSearchParams();
      if (options?.start) {
        params.append('start', options.start.toISOString().split('T')[0]);
      }
      if (options?.end) {
        params.append('end', options.end.toISOString().split('T')[0]);
      }
      if (options?.cursor) {
        params.append('cursor', options.cursor);
      }

      const response = await this.client.get<AkahuPaginatedResponse<AkahuTransaction>>(
        `/api/v1/accounts/${accountId}/transactions?${params.toString()}`,
        {
          headers: {
            'X-Akahu-ID': appToken,
          },
        }
      );

      logger.info(`[Akahu] Fetched ${response.data.items.length} transactions`);
      return response.data;
    } catch (error) {
      logger.error('[Akahu] Failed to fetch transactions', { accountId, error });
      throw new Error('Failed to fetch transactions from Akahu');
    }
  }

  /**
   * Fetch all transactions with automatic pagination
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
        logger.warn('[Akahu] Reached max page limit', { accountId, pageCount });
        break;
      }
    } while (cursor);

    logger.info(`[Akahu] Fetched total of ${allTransactions.length} transactions in ${pageCount} pages`);
    return allTransactions;
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: AxiosError): void {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      logger.error('[Akahu] API error', {
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
      logger.error('[Akahu] No response from API', { error: error.message });
      throw new Error('Unable to connect to Akahu API');
    } else {
      logger.error('[Akahu] Error setting up request', { error: error.message });
      throw new Error('Internal error communicating with Akahu');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 4. Sync Service (Provider-Agnostic)

**File**: `backend/src/services/SyncService.ts`

```typescript
import { IBankingDataProvider } from '../interfaces/IBankingDataProvider';
import { DuplicateDetectionService } from './DuplicateDetectionService';
import { TransactionMappingService } from './TransactionMappingService';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface SyncOptions {
  startDate?: Date;
  endDate?: Date;
  forceFull?: boolean;
}

interface SyncResult {
  syncHistoryId: string;
  accountsSynced: number;
  transactionsFetched: number;
  transactionsImported: number;
  duplicatesDetected: number;
  needsReview: number;
  errors: string[];
}

/**
 * Core sync orchestration service
 * Provider-agnostic - works with any IBankingDataProvider implementation
 */
export class SyncService {
  constructor(
    private provider: IBankingDataProvider,
    private duplicateDetection: DuplicateDetectionService,
    private transactionMapping: TransactionMappingService
  ) {}

  /**
   * Trigger sync for a bank connection
   */
  async syncConnection(
    connectionId: string,
    options?: SyncOptions
  ): Promise<SyncResult> {
    // Create sync history record
    const syncHistory = await prisma.syncHistory.create({
      data: {
        connectionId,
        type: options?.forceFull ? 'FULL' : 'INCREMENTAL',
        status: 'IN_PROGRESS',
      },
    });

    const result: SyncResult = {
      syncHistoryId: syncHistory.id,
      accountsSynced: 0,
      transactionsFetched: 0,
      transactionsImported: 0,
      duplicatesDetected: 0,
      needsReview: 0,
      errors: [],
    };

    try {
      logger.info('[SyncService] Starting sync', {
        connectionId,
        provider: this.provider.getProviderName()
      });

      // Step 1: Test connection
      const connectionStatus = await this.provider.testConnection(connectionId);
      if (!connectionStatus.isValid) {
        throw new Error(`Connection test failed: ${connectionStatus.error}`);
      }

      // Step 2: Fetch and sync accounts
      await this.syncAccounts(connectionId, result);

      // Step 3: Fetch and sync transactions for each linked account
      const linkedAccounts = await prisma.linkedAccount.findMany({
        where: {
          connectionId,
          syncEnabled: true,
          localAccountId: { not: null }
        },
      });

      for (const linkedAccount of linkedAccounts) {
        try {
          await this.syncAccountTransactions(linkedAccount, options, result);
        } catch (error) {
          logger.error('[SyncService] Failed to sync account', {
            linkedAccountId: linkedAccount.id,
            error,
          });
          result.errors.push(`Account ${linkedAccount.externalName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 4: Update sync history
      await prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          accountsSynced: result.accountsSynced,
          transactionsFetched: result.transactionsFetched,
          transactionsImported: result.transactionsImported,
          duplicatesDetected: result.duplicatesDetected,
          needsReview: result.needsReview,
        },
      });

      // Step 5: Update connection last sync
      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          lastSync: new Date(),
          lastError: result.errors.length > 0 ? result.errors.join('; ') : null,
        },
      });

      logger.info('[SyncService] Sync completed', result);
      return result;

    } catch (error) {
      logger.error('[SyncService] Sync failed', { connectionId, error });

      await prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorDetails: error,
        },
      });

      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Sync accounts from provider
   */
  private async syncAccounts(connectionId: string, result: SyncResult): Promise<void> {
    logger.info('[SyncService] Syncing accounts', { connectionId });

    const externalAccounts = await this.provider.fetchAccounts(connectionId);

    for (const extAccount of externalAccounts) {
      // Upsert linked account
      await prisma.linkedAccount.upsert({
        where: {
          connectionId_externalAccountId: {
            connectionId,
            externalAccountId: extAccount.externalAccountId,
          },
        },
        update: {
          externalName: extAccount.name,
          externalType: extAccount.type,
          institution: extAccount.institution,
          accountNumber: extAccount.accountNumber,
          lastSync: new Date(),
        },
        create: {
          connectionId,
          externalAccountId: extAccount.externalAccountId,
          externalName: extAccount.name,
          externalType: extAccount.type,
          institution: extAccount.institution,
          accountNumber: extAccount.accountNumber,
          syncEnabled: true,
        },
      });

      result.accountsSynced++;
    }

    logger.info('[SyncService] Accounts synced', { count: result.accountsSynced });
  }

  /**
   * Sync transactions for a specific linked account
   */
  private async syncAccountTransactions(
    linkedAccount: any,
    options: SyncOptions | undefined,
    result: SyncResult
  ): Promise<void> {
    logger.info('[SyncService] Syncing transactions', {
      linkedAccountId: linkedAccount.id,
      externalAccountId: linkedAccount.externalAccountId
    });

    // Determine date range
    const startDate = options?.startDate ||
      linkedAccount.lastSync ||
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: 90 days ago

    const endDate = options?.endDate || new Date();

    // Fetch transactions from provider
    const externalTransactions = await this.provider.fetchAllTransactions(
      linkedAccount.connectionId,
      linkedAccount.externalAccountId,
      { startDate, endDate }
    );

    result.transactionsFetched += externalTransactions.length;

    // Process each transaction
    for (const extTx of externalTransactions) {
      try {
        await this.processTransaction(linkedAccount, extTx, result);
      } catch (error) {
        logger.error('[SyncService] Failed to process transaction', {
          externalTransactionId: extTx.externalTransactionId,
          error,
        });
        result.errors.push(`Transaction ${extTx.externalTransactionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update linked account last sync
    await prisma.linkedAccount.update({
      where: { id: linkedAccount.id },
      data: { lastSync: new Date() },
    });

    logger.info('[SyncService] Transactions synced for account', {
      linkedAccountId: linkedAccount.id,
      fetched: externalTransactions.length,
    });
  }

  /**
   * Process a single external transaction
   */
  private async processTransaction(
    linkedAccount: any,
    extTx: any,
    result: SyncResult
  ): Promise<void> {
    // Check if already imported
    const existing = await prisma.externalTransaction.findUnique({
      where: { externalTransactionId: extTx.externalTransactionId },
    });

    if (existing) {
      // Already imported, skip
      return;
    }

    // Create external transaction record
    const externalTransaction = await prisma.externalTransaction.create({
      data: {
        linkedAccountId: linkedAccount.id,
        externalTransactionId: extTx.externalTransactionId,
        date: extTx.date,
        amount: extTx.amount,
        description: extTx.description,
        merchant: extTx.merchant,
        category: extTx.category,
        type: extTx.type,
        balance: extTx.balance,
        rawData: extTx.rawData,
      },
    });

    // Duplicate detection
    const duplicates = await this.duplicateDetection.findDuplicates(
      externalTransaction,
      linkedAccount.localAccountId
    );

    if (duplicates.length > 0) {
      const bestMatch = duplicates[0];

      if (bestMatch.confidence >= 95) {
        // High confidence - auto-link
        await this.linkTransaction(externalTransaction.id, bestMatch.transactionId);
        result.transactionsImported++;
      } else if (bestMatch.confidence >= 70) {
        // Medium confidence - flag for review
        await prisma.externalTransaction.update({
          where: { id: externalTransaction.id },
          data: {
            isDuplicate: true,
            duplicateOfId: bestMatch.transactionId,
            duplicateConfidence: bestMatch.confidence,
            needsReview: true,
          },
        });
        result.needsReview++;
      } else {
        // Low confidence - create new transaction
        await this.importAsNewTransaction(linkedAccount, externalTransaction);
        result.transactionsImported++;
      }

      result.duplicatesDetected++;
    } else {
      // No duplicates - import as new transaction
      await this.importAsNewTransaction(linkedAccount, externalTransaction);
      result.transactionsImported++;
    }
  }

  /**
   * Link external transaction to existing local transaction
   */
  private async linkTransaction(
    externalTransactionId: string,
    localTransactionId: string
  ): Promise<void> {
    await prisma.externalTransaction.update({
      where: { id: externalTransactionId },
      data: {
        localTransactionId,
        isDuplicate: true,
      },
    });

    await prisma.transaction.update({
      where: { id: localTransactionId },
      data: { isFromBank: true },
    });

    logger.info('[SyncService] Linked transactions', {
      externalTransactionId,
      localTransactionId,
    });
  }

  /**
   * Import external transaction as new local transaction
   */
  private async importAsNewTransaction(
    linkedAccount: any,
    externalTransaction: any
  ): Promise<void> {
    // Map external transaction to local transaction format
    const mappedTransaction = this.transactionMapping.mapToLocalTransaction(
      externalTransaction,
      linkedAccount.localAccountId
    );

    // Create local transaction
    const localTransaction = await prisma.transaction.create({
      data: {
        ...mappedTransaction,
        isFromBank: true,
      },
    });

    // Link external transaction to local transaction
    await prisma.externalTransaction.update({
      where: { id: externalTransaction.id },
      data: { localTransactionId: localTransaction.id },
    });

    logger.info('[SyncService] Imported new transaction', {
      externalTransactionId: externalTransaction.id,
      localTransactionId: localTransaction.id,
    });
  }
}
```

**Key Points**:
- ✅ No Akahu-specific code - uses `IBankingDataProvider` interface
- ✅ Works with any provider implementation
- ✅ Comprehensive error handling
- ✅ Detailed logging for debugging
- ✅ Transaction-safe database operations

### 5. Duplicate Detection Service

**File**: `backend/src/services/DuplicateDetectionService.ts`

```typescript
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface DuplicateMatch {
  transactionId: string;
  confidence: number; // 0-100
  reason: string;
}

/**
 * Intelligent duplicate detection using multiple strategies
 */
export class DuplicateDetectionService {
  /**
   * Find potential duplicate transactions
   * Returns matches sorted by confidence (highest first)
   */
  async findDuplicates(
    externalTransaction: any,
    localAccountId: string
  ): Promise<DuplicateMatch[]> {
    const matches: DuplicateMatch[] = [];

    // Strategy 1: Exact match (date + amount + description)
    const exactMatches = await this.findExactMatches(externalTransaction, localAccountId);
    matches.push(...exactMatches);

    // Strategy 2: Near match (date ±2 days + amount + fuzzy description)
    if (matches.length === 0) {
      const nearMatches = await this.findNearMatches(externalTransaction, localAccountId);
      matches.push(...nearMatches);
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    logger.debug('[DuplicateDetection] Found matches', {
      externalTransactionId: externalTransaction.externalTransactionId,
      matchCount: matches.length,
    });

    return matches;
  }

  /**
   * Exact match: same date, amount, and description
   */
  private async findExactMatches(
    externalTransaction: any,
    localAccountId: string
  ): Promise<DuplicateMatch[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: localAccountId,
        date: externalTransaction.date,
        amount: externalTransaction.amount,
        description: {
          contains: externalTransaction.description,
          mode: 'insensitive',
        },
        isFromBank: false, // Don't match against already-imported transactions
      },
      take: 5,
    });

    return transactions.map(tx => ({
      transactionId: tx.id,
      confidence: 98, // Very high confidence
      reason: 'Exact match: date, amount, and description',
    }));
  }

  /**
   * Near match: date ±2 days, exact amount, similar description
   */
  private async findNearMatches(
    externalTransaction: any,
    localAccountId: string
  ): Promise<DuplicateMatch[]> {
    const dateFrom = new Date(externalTransaction.date);
    dateFrom.setDate(dateFrom.getDate() - 2);

    const dateTo = new Date(externalTransaction.date);
    dateTo.setDate(dateTo.getDate() + 2);

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: localAccountId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
        amount: externalTransaction.amount,
        isFromBank: false,
      },
      take: 10,
    });

    const matches: DuplicateMatch[] = [];

    for (const tx of transactions) {
      const similarity = this.calculateStringSimilarity(
        externalTransaction.description.toLowerCase(),
        tx.description.toLowerCase()
      );

      if (similarity > 0.7) {
        const confidence = Math.floor(similarity * 85); // Max 85% for near matches
        matches.push({
          transactionId: tx.id,
          confidence,
          reason: `Near match: date ±${Math.abs(this.daysDifference(tx.date, externalTransaction.date))} days, exact amount, ${Math.floor(similarity * 100)}% description similarity`,
        });
      }
    }

    return matches;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * Returns value between 0 (no match) and 1 (perfect match)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate days difference between two dates
   */
  private daysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
```

### 6. Transaction Mapping Service

**File**: `backend/src/services/TransactionMappingService.ts`

```typescript
import { TransactionType } from '@prisma/client';

/**
 * Maps external transactions to local transaction format
 */
export class TransactionMappingService {
  /**
   * Map external transaction to local transaction create input
   */
  mapToLocalTransaction(externalTransaction: any, localAccountId: string) {
    // Determine transaction type based on amount
    const type: TransactionType = externalTransaction.amount >= 0
      ? TransactionType.INCOME
      : TransactionType.EXPENSE;

    return {
      accountId: localAccountId,
      type,
      amount: externalTransaction.amount,
      date: externalTransaction.date,
      description: this.cleanDescription(externalTransaction),
      notes: this.buildNotes(externalTransaction),
      status: 'CLEARED', // Bank transactions are already cleared
      categoryId: null, // Will be assigned by categorization rules later
    };
  }

  /**
   * Clean and format transaction description
   */
  private cleanDescription(externalTransaction: any): string {
    // Use merchant name if available, otherwise use description
    if (externalTransaction.merchant) {
      return externalTransaction.merchant;
    }

    // Clean up description (remove extra whitespace, trim)
    return externalTransaction.description
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Build notes field with additional metadata
   */
  private buildNotes(externalTransaction: any): string | null {
    const notes: string[] = [];

    if (externalTransaction.merchant && externalTransaction.merchant !== externalTransaction.description) {
      notes.push(`Bank description: ${externalTransaction.description}`);
    }

    if (externalTransaction.category) {
      notes.push(`Bank category: ${externalTransaction.category}`);
    }

    if (externalTransaction.balance !== undefined && externalTransaction.balance !== null) {
      notes.push(`Balance after: $${externalTransaction.balance.toFixed(2)}`);
    }

    return notes.length > 0 ? notes.join('\n') : null;
  }
}
```

### 7. Provider Factory (Dependency Injection)

**File**: `backend/src/services/BankingProviderFactory.ts`

```typescript
import { IBankingDataProvider } from '../interfaces/IBankingDataProvider';
import { AkahuPersonalProvider } from './akahu/AkahuPersonalProvider';
import { prisma } from '../utils/prisma';

/**
 * Factory to create appropriate banking provider based on connection type
 * Makes it easy to support multiple providers
 */
export class BankingProviderFactory {
  static async createProvider(connectionId: string): Promise<IBankingDataProvider> {
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Bank connection not found');
    }

    switch (connection.provider) {
      case 'AKAHU_PERSONAL':
        return new AkahuPersonalProvider();

      // Future providers
      case 'AKAHU_OAUTH':
        // return new AkahuOAuthProvider();
        throw new Error('Akahu OAuth provider not yet implemented');

      case 'PLAID':
        // return new PlaidProvider();
        throw new Error('Plaid provider not yet implemented');

      default:
        throw new Error(`Unsupported provider: ${connection.provider}`);
    }
  }
}
```

---

## API Endpoints

### Base Path: `/api/v1/sync`

#### 1. Setup Connection

```typescript
POST /api/v1/sync/setup
```

**Request Body**:
```json
{
  "provider": "AKAHU_PERSONAL",
  "appToken": "your_encrypted_app_token"
}
```

**Response**:
```json
{
  "connectionId": "uuid",
  "provider": "AKAHU_PERSONAL",
  "status": "ACTIVE",
  "createdAt": "2026-01-07T..."
}
```

#### 2. Link Account

```typescript
POST /api/v1/sync/link-account
```

**Request Body**:
```json
{
  "linkedAccountId": "uuid",
  "localAccountId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "linkedAccount": {
    "id": "uuid",
    "externalName": "Everyday Account",
    "localAccountId": "uuid",
    "syncEnabled": true
  }
}
```

#### 3. Trigger Sync

```typescript
POST /api/v1/sync/trigger
```

**Request Body**:
```json
{
  "connectionId": "uuid",
  "options": {
    "startDate": "2025-01-01",
    "endDate": "2026-01-07",
    "forceFull": false
  }
}
```

**Response**:
```json
{
  "syncHistoryId": "uuid",
  "status": "IN_PROGRESS",
  "startedAt": "2026-01-07T..."
}
```

#### 4. Get Sync Status

```typescript
GET /api/v1/sync/status/:syncHistoryId
```

**Response**:
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "startedAt": "2026-01-07T...",
  "completedAt": "2026-01-07T...",
  "accountsSynced": 1,
  "transactionsFetched": 150,
  "transactionsImported": 145,
  "duplicatesDetected": 5,
  "needsReview": 2
}
```

#### 5. Get Sync History

```typescript
GET /api/v1/sync/history?connectionId=uuid&page=1&pageSize=20
```

**Response**:
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "MANUAL",
      "status": "COMPLETED",
      "startedAt": "2026-01-07T...",
      "transactionsFetched": 150,
      "transactionsImported": 145
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

#### 6. Get Transactions Needing Review

```typescript
GET /api/v1/sync/review?connectionId=uuid
```

**Response**:
```json
{
  "items": [
    {
      "id": "uuid",
      "externalTransactionId": "trans_123",
      "date": "2026-01-05",
      "amount": -25.50,
      "description": "Coffee Shop",
      "potentialDuplicate": {
        "id": "local_tx_uuid",
        "description": "Cafe",
        "confidence": 75
      }
    }
  ]
}
```

#### 7. Approve/Reject Transaction

```typescript
POST /api/v1/sync/review/:externalTransactionId/approve
POST /api/v1/sync/review/:externalTransactionId/reject
POST /api/v1/sync/review/:externalTransactionId/link
```

**For link, request body**:
```json
{
  "localTransactionId": "uuid"
}
```

#### 8. Get Connected Accounts

```typescript
GET /api/v1/sync/accounts?connectionId=uuid
```

**Response**:
```json
{
  "items": [
    {
      "id": "uuid",
      "externalAccountId": "acc_123",
      "externalName": "Everyday Account",
      "institution": "ANZ",
      "localAccount": {
        "id": "uuid",
        "name": "Main Checking"
      },
      "syncEnabled": true,
      "lastSync": "2026-01-07T..."
    }
  ]
}
```

---

## Frontend Implementation

### 1. API Service Layer

**File**: `frontend/src/services/syncService.ts`

```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;

export interface SyncTriggerRequest {
  connectionId: string;
  options?: {
    startDate?: string;
    endDate?: string;
    forceFull?: boolean;
  };
}

export interface SyncStatusResponse {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  accountsSynced: number;
  transactionsFetched: number;
  transactionsImported: number;
  duplicatesDetected: number;
  needsReview: number;
  errorMessage?: string;
}

/**
 * Generic sync API service
 * No provider-specific code
 */
export const syncService = {
  /**
   * Trigger sync for a connection
   */
  async triggerSync(request: SyncTriggerRequest): Promise<{ syncHistoryId: string }> {
    const response = await axios.post(`${API_BASE}/sync/trigger`, request);
    return response.data;
  },

  /**
   * Get sync status
   */
  async getSyncStatus(syncHistoryId: string): Promise<SyncStatusResponse> {
    const response = await axios.get(`${API_BASE}/sync/status/${syncHistoryId}`);
    return response.data;
  },

  /**
   * Get sync history
   */
  async getSyncHistory(connectionId: string, page = 1, pageSize = 20) {
    const response = await axios.get(`${API_BASE}/sync/history`, {
      params: { connectionId, page, pageSize },
    });
    return response.data;
  },

  /**
   * Get transactions needing review
   */
  async getTransactionsNeedingReview(connectionId: string) {
    const response = await axios.get(`${API_BASE}/sync/review`, {
      params: { connectionId },
    });
    return response.data;
  },

  /**
   * Approve a transaction (import as new)
   */
  async approveTransaction(externalTransactionId: string) {
    const response = await axios.post(
      `${API_BASE}/sync/review/${externalTransactionId}/approve`
    );
    return response.data;
  },

  /**
   * Reject a transaction (mark as duplicate, don't import)
   */
  async rejectTransaction(externalTransactionId: string) {
    const response = await axios.post(
      `${API_BASE}/sync/review/${externalTransactionId}/reject`
    );
    return response.data;
  },

  /**
   * Link to existing transaction
   */
  async linkTransaction(externalTransactionId: string, localTransactionId: string) {
    const response = await axios.post(
      `${API_BASE}/sync/review/${externalTransactionId}/link`,
      { localTransactionId }
    );
    return response.data;
  },

  /**
   * Get connected accounts
   */
  async getConnectedAccounts(connectionId: string) {
    const response = await axios.get(`${API_BASE}/sync/accounts`, {
      params: { connectionId },
    });
    return response.data;
  },
};
```

### 2. Sync Button Component

**File**: `frontend/src/components/sync/SyncButton.tsx`

```typescript
import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { Sync as SyncIcon } from '@mui/icons-material';
import { syncService } from '../../services/syncService';
import { useSnackbar } from 'notistack';

interface SyncButtonProps {
  connectionId: string;
  onSyncComplete?: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  connectionId,
  onSyncComplete,
  variant = 'contained',
  size = 'medium',
}) => {
  const [syncing, setSyncing] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleSync = async () => {
    try {
      setSyncing(true);

      // Trigger sync
      const { syncHistoryId } = await syncService.triggerSync({ connectionId });

      enqueueSnackbar('Sync started', { variant: 'info' });

      // Poll for completion
      let status = await syncService.getSyncStatus(syncHistoryId);

      while (status.status === 'PENDING' || status.status === 'IN_PROGRESS') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
        status = await syncService.getSyncStatus(syncHistoryId);
      }

      if (status.status === 'COMPLETED') {
        enqueueSnackbar(
          `Sync completed: ${status.transactionsImported} transactions imported`,
          { variant: 'success' }
        );

        if (status.needsReview > 0) {
          enqueueSnackbar(
            `${status.needsReview} transactions need review`,
            { variant: 'warning' }
          );
        }

        onSyncComplete?.();
      } else {
        enqueueSnackbar(
          `Sync failed: ${status.errorMessage || 'Unknown error'}`,
          { variant: 'error' }
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
      enqueueSnackbar('Failed to sync transactions', { variant: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Tooltip title="Sync transactions from bank">
      <Button
        variant={variant}
        size={size}
        onClick={handleSync}
        disabled={syncing}
        startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
      >
        {syncing ? 'Syncing...' : 'Sync'}
      </Button>
    </Tooltip>
  );
};
```

### 3. Sync Status Indicator

**File**: `frontend/src/components/sync/SyncStatusIndicator.tsx`

```typescript
import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatusIndicatorProps {
  lastSync?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastError?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  lastSync,
  status,
  lastError,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'ERROR': return 'error';
      case 'INACTIVE': return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ACTIVE': return <SuccessIcon fontSize="small" />;
      case 'ERROR': return <ErrorIcon fontSize="small" />;
      case 'INACTIVE': return <PendingIcon fontSize="small" />;
    }
  };

  const getStatusText = () => {
    if (status === 'ERROR' && lastError) {
      return lastError;
    }
    if (lastSync) {
      return `Last synced ${formatDistanceToNow(new Date(lastSync), { addSuffix: true })}`;
    }
    return 'Never synced';
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title={getStatusText()}>
        <Chip
          icon={getStatusIcon()}
          label={status}
          color={getStatusColor()}
          size="small"
        />
      </Tooltip>
      {lastSync && (
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
        </Typography>
      )}
    </Box>
  );
};
```

### 4. Transaction Review Dialog

**File**: `frontend/src/components/sync/TransactionReviewDialog.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { syncService } from '../../services/syncService';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

interface TransactionReviewDialogProps {
  open: boolean;
  connectionId: string;
  onClose: () => void;
}

export const TransactionReviewDialog: React.FC<TransactionReviewDialogProps> = ({
  open,
  connectionId,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      loadTransactions();
    }
  }, [open]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await syncService.getTransactionsNeedingReview(connectionId);
      setTransactions(response.items);
    } catch (error) {
      enqueueSnackbar('Failed to load transactions', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (externalTransactionId: string) => {
    try {
      await syncService.approveTransaction(externalTransactionId);
      enqueueSnackbar('Transaction imported', { variant: 'success' });
      loadTransactions(); // Reload list
    } catch (error) {
      enqueueSnackbar('Failed to approve transaction', { variant: 'error' });
    }
  };

  const handleReject = async (externalTransactionId: string) => {
    try {
      await syncService.rejectTransaction(externalTransactionId);
      enqueueSnackbar('Transaction rejected', { variant: 'info' });
      loadTransactions(); // Reload list
    } catch (error) {
      enqueueSnackbar('Failed to reject transaction', { variant: 'error' });
    }
  };

  const handleLink = async (externalTransactionId: string, localTransactionId: string) => {
    try {
      await syncService.linkTransaction(externalTransactionId, localTransactionId);
      enqueueSnackbar('Transaction linked', { variant: 'success' });
      loadTransactions(); // Reload list
    } catch (error) {
      enqueueSnackbar('Failed to link transaction', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Review Transactions</DialogTitle>
      <DialogContent>
        {transactions.length === 0 ? (
          <Typography color="text.secondary">
            No transactions need review
          </Typography>
        ) : (
          <List>
            {transactions.map((tx, index) => (
              <React.Fragment key={tx.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <Box sx={{ width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Box>
                        <Typography variant="subtitle1">
                          {tx.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(tx.date), 'MMM d, yyyy')}
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        color={tx.amount >= 0 ? 'success.main' : 'error.main'}
                      >
                        ${Math.abs(tx.amount).toFixed(2)}
                      </Typography>
                    </Box>

                    {tx.potentialDuplicate && (
                      <Box sx={{ bgcolor: 'warning.light', p: 1, borderRadius: 1, mb: 1 }}>
                        <Typography variant="caption" display="block">
                          Potential duplicate:
                        </Typography>
                        <Typography variant="body2">
                          {tx.potentialDuplicate.description}
                        </Typography>
                        <Chip
                          label={`${tx.potentialDuplicate.confidence}% match`}
                          size="small"
                          color="warning"
                        />
                      </Box>
                    )}

                    <Box display="flex" gap={1} mt={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleApprove(tx.id)}
                      >
                        Import as New
                      </Button>
                      {tx.potentialDuplicate && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleLink(tx.id, tx.potentialDuplicate.id)}
                        >
                          Link to Existing
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleReject(tx.id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
```

---

## Implementation Phases

### Phase 1: Database & Core Services (Week 1)

**Deliverables**:
- ✅ Database schema migration
- ✅ Encryption utilities
- ✅ Provider interface definition
- ✅ Akahu API client
- ✅ Akahu personal provider implementation

**Acceptance Criteria**:
- Can connect to Akahu API with app token
- Can fetch accounts and transactions
- All data encrypted at rest

### Phase 2: Sync Logic (Week 2)

**Deliverables**:
- ✅ Sync service implementation
- ✅ Duplicate detection service
- ✅ Transaction mapping service
- ✅ Provider factory
- ✅ Unit tests for core logic

**Acceptance Criteria**:
- Can sync transactions from Akahu
- Duplicate detection working (>90% accuracy)
- Transactions mapped correctly to local format
- Error handling robust

### Phase 3: API Endpoints (Week 3)

**Deliverables**:
- ✅ Setup connection endpoint
- ✅ Link account endpoint
- ✅ Trigger sync endpoint
- ✅ Get sync status endpoint
- ✅ Review transactions endpoints
- ✅ API validation and error handling

**Acceptance Criteria**:
- All endpoints functional
- Proper error responses
- Request validation working
- API documentation updated

### Phase 4: Frontend Integration (Week 4)

**Deliverables**:
- ✅ Sync button component
- ✅ Sync status indicator
- ✅ Transaction review dialog
- ✅ Sync history view
- ✅ Integration with account details page

**Acceptance Criteria**:
- Can trigger sync from UI
- Can see sync status
- Can review and approve transactions
- User experience smooth and intuitive

### Phase 5: Testing & Polish (Week 5)

**Deliverables**:
- ✅ Integration tests
- ✅ End-to-end testing with real Akahu account
- ✅ Bug fixes
- ✅ Performance optimization
- ✅ Documentation updates

**Acceptance Criteria**:
- All tests passing
- No critical bugs
- Sync completes in <60s for 500 transactions
- Documentation complete

---

## Migration Strategy: Personal → Multi-Account OAuth

### When You're Ready to Upgrade

**Step 1: Create OAuth Provider**
```typescript
// backend/src/services/akahu/AkahuOAuthProvider.ts
export class AkahuOAuthProvider implements IBankingDataProvider {
  // Uses accessToken instead of appToken
  // Implements token refresh logic
  // Otherwise identical interface
}
```

**Step 2: Add OAuth Models**
```prisma
// Add to existing BankConnection model
model BankConnection {
  // ... existing fields ...

  // OAuth-specific fields (already there, just populate them)
  accessToken     String?   @db.Text // NOW USED
  refreshToken    String?   @db.Text // NOW USED
  tokenExpiry     DateTime? // NOW USED
}
```

**Step 3: Update Factory**
```typescript
// backend/src/services/BankingProviderFactory.ts
case 'AKAHU_OAUTH':
  return new AkahuOAuthProvider(); // NEW
```

**Step 4: Add OAuth Flow UI**
- Add OAuth initiation button
- Handle OAuth callback
- Token storage UI

**What DOESN'T Change**:
- ✅ SyncService - stays exactly the same
- ✅ DuplicateDetectionService - stays exactly the same
- ✅ TransactionMappingService - stays exactly the same
- ✅ API endpoints - stay exactly the same
- ✅ Frontend components - stay exactly the same (except setup flow)

**Migration for Existing Users**:
1. Keep personal app connection as-is
2. Offer "Upgrade to OAuth" button
3. OAuth flow creates new connection
4. Re-link accounts to new connection
5. Archive old connection

---

## Environment Variables

```bash
# Akahu Configuration
AKAHU_BASE_URL=https://api.akahu.nz
AKAHU_APP_TOKEN=your_personal_app_token # Used for initial setup only

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
ENCRYPTION_ALGORITHM=aes-256-gcm

# Sync Configuration
SYNC_DEFAULT_LOOKBACK_DAYS=90
SYNC_MAX_TRANSACTIONS_PER_BATCH=1000

# Rate Limiting
AKAHU_RATE_LIMIT_PER_SECOND=10
AKAHU_REQUEST_DELAY_MS=100
```

---

## Security Considerations

### Token Storage
- ✅ All tokens encrypted with AES-256-GCM
- ✅ Encryption key in environment variable
- ✅ Never log tokens
- ✅ Use timing-safe comparison for token verification

### API Security
- ✅ HTTPS only
- ✅ CORS restricted to frontend domain
- ✅ Rate limiting on sync endpoints
- ✅ Input validation with Zod
- ✅ SQL injection prevented (Prisma ORM)

### Data Privacy
- ✅ User can disconnect anytime
- ✅ Option to delete synced data on disconnect
- ✅ Audit logging for all sync operations
- ✅ Raw transaction data optional (can be disabled)

---

## Testing Strategy

### Unit Tests
- Provider implementations
- Duplicate detection algorithms
- Transaction mapping logic
- Encryption/decryption utilities

### Integration Tests
- API endpoints
- Database operations
- Provider factory
- End-to-end sync flow

### Manual Testing Checklist
- [ ] Connect personal Akahu account
- [ ] Fetch accounts successfully
- [ ] Link account to local account
- [ ] Trigger manual sync
- [ ] Verify transactions imported
- [ ] Test duplicate detection accuracy
- [ ] Review and approve flagged transactions
- [ ] Verify balance matches bank balance
- [ ] Test sync history display
- [ ] Test error handling (invalid token, network failure)

---

## Success Metrics

**Technical**:
- ✅ Sync completion rate > 99%
- ✅ Duplicate detection accuracy > 90%
- ✅ API response time < 500ms (p95)
- ✅ Zero token leaks in logs
- ✅ Sync 500 transactions in < 60 seconds

**User Experience**:
- ✅ One-click sync from UI
- ✅ Clear sync status visibility
- ✅ Easy transaction review workflow
- ✅ <5% transactions need manual review

**Business**:
- ✅ 80% reduction in manual transaction entry
- ✅ Balance accuracy 100%
- ✅ User satisfaction > 4.5/5

---

## Future Enhancements (Post-MVP)

**Once Multi-Account Tier is Available**:
- OAuth 2.0 authentication flow
- Multiple bank connections
- Real-time webhook support
- Instant transaction updates
- WebSocket/SSE for live UI updates

**Additional Providers**:
- Plaid integration (US/Canada)
- TrueLayer (UK/EU)
- Open Banking UK
- Yodlee

**Advanced Features**:
- ML-based duplicate detection
- Automatic categorization from merchant data
- Spending pattern detection
- Bill prediction
- Balance forecasting
- Fraud detection

---

## Dependencies

### Backend Packages

```json
{
  "axios": "^1.6.0",              // HTTP client
  "crypto": "built-in"            // Encryption
}
```

**No new dependencies needed!** Uses existing packages.

### Database

```bash
npx prisma migrate dev --name add_bank_sync_models
```

---

## Open Questions & Decisions

1. **Token Storage**: Encrypt app token or store in plain text?
   - **Decision**: Encrypt with AES-256-GCM for security

2. **Sync Frequency**: Manual only or scheduled?
   - **Decision**: Manual only for MVP, scheduled in future enhancement

3. **Historical Sync Depth**: 90 days, 1 year, or unlimited?
   - **Decision**: Default 90 days, configurable by user

4. **Duplicate Threshold**: Auto-import at what confidence level?
   - **Decision**: ≥95% auto-import, 70-94% review, <70% import as new

5. **Account Linking**: Automatic or manual?
   - **Decision**: Manual for MVP (user selects which account to link)

6. **Transaction Review**: Required or optional?
   - **Decision**: Only for medium-confidence duplicates (70-94%)

7. **Data Retention**: Keep external transaction records indefinitely?
   - **Decision**: Yes, for audit trail and debugging

8. **Error Handling**: Retry failed syncs automatically?
   - **Decision**: No auto-retry for MVP, user must trigger manually

---

**Feature Plan Status**: 📋 PLANNING COMPLETE
**Ready for**: Implementation

**Estimated Effort**:
- Complexity: High
- Duration: 5 weeks
- Commits: 25-30
- Team Size: 1 developer

**Next Steps**:
1. ✅ Review and approve feature plan
2. Create implementation branch
3. Begin Phase 1 (Database & Core Services)
4. Set up Akahu personal app credentials
5. Configure encryption key

---

**Created**: January 7, 2026
**Author**: Budget Tracker Development Team
**Document Version**: 1.0
