# Feature Plan: Automatic Data Synchronization (Akahu Integration)

**Milestone**: 8.5 - Automatic Data Synchronization
**Status**: 📋 PLANNING
**Created**: January 6, 2026
**Complexity**: Very High (largest feature to date)
**Priority**: High

---

## Important Note: Webhooks Status

**⚠️ Webhooks are Future Enhancements**

This feature plan includes comprehensive webhook support documentation. However, webhooks are **not available** in Akahu's single account mode (current tier). Webhook functionality will be moved to **Future Enhancements** and implemented only if/when upgrading to Akahu's multi-account tier.

**Current Implementation (MVP)**:
- Scheduled sync jobs (hourly, daily, manual trigger)
- Polling-based synchronization
- Manual refresh capability

**Future Enhancement** (requires Akahu multi-account tier):
- Real-time webhook notifications
- Instant transaction updates
- WebSocket/SSE for live UI updates

All webhook-related sections in this document are marked for future implementation and should be **excluded from the MVP scope**.

---

## Overview

Integrate with [Akahu](https://www.akahu.nz/) (New Zealand's leading personal finance API) to enable automatic synchronization of bank account data and transactions. This feature will eliminate manual data entry and provide real-time financial tracking by connecting directly to users' bank accounts via open banking APIs.

### Key Benefits
- **Zero Manual Entry**: Transactions automatically imported from connected banks
- **Real-Time Updates**: Balance and transaction updates via webhooks
- **Historical Data**: Backfill past transactions for complete history
- **Smart Categorization**: Leverage Akahu's merchant data for auto-categorization
- **Multi-Bank Support**: Connect multiple accounts across different banks
- **Always Accurate**: Balances always match actual bank balances

---

## Requirements

### Functional Requirements

**Authentication & Authorization**:
- OAuth 2.0 flow to connect Akahu
- Secure token storage (encrypted)
- Token refresh mechanism
- User consent management
- Connection status monitoring
- Easy disconnection process

**Account Synchronization**:
- Fetch all connected accounts from Akahu
- Map Akahu accounts to local accounts (automatic or manual)
- Sync account metadata (name, type, institution, account number)
- Update account balances automatically
- Support multiple accounts per connection
- Handle account status changes (active, closed)

**Transaction Synchronization**:
- Fetch historical transactions (configurable date range)
- Incremental sync (only new transactions)
- Duplicate detection and prevention
- Pending vs. cleared transaction handling
- Automatic category assignment from merchant data
- Transaction metadata sync (merchant, location, etc.)
- Handle transaction updates and corrections
- Scheduled sync jobs (hourly, daily, or manual trigger)

**User Interface**:
- "Connect Bank Account" wizard
- Connected accounts management page
- Sync status indicators
- Manual sync trigger
- Last sync timestamp display
- Sync history and error logs
- Account linking interface
- Transaction review/approval workflow

**Security & Privacy**:
- Encrypted token storage (AES-256)
- HTTPS-only communication
- Webhook signature verification
- User consent flow with clear permissions
- Data deletion on disconnection (optional)
- Audit logging
- Rate limiting and abuse prevention

### Non-Functional Requirements

**Performance**:
- Sync 1000 transactions in < 60 seconds
- Webhook processing < 30 seconds
- API response time < 500ms
- Support 100k+ transactions per user
- Efficient duplicate detection at scale

**Reliability**:
- 99.9% uptime for sync service
- Automatic retry with exponential backoff
- Graceful degradation if Akahu unavailable
- Transaction queue persistence (no data loss)

**Security**:
- Zero sensitive data in logs
- Encrypted credentials at rest
- Secure token transmission
- Compliance with NZ Privacy Act

**Scalability**:
- Support multiple concurrent sync jobs
- Queue-based processing for high volume
- Database indexing for fast lookups
- Horizontal scaling capability

---

## Technical Architecture

### Database Schema

#### New Models

```prisma
model AkahuConnection {
  id              String    @id @default(uuid())
  userId          String    // For future multi-user support
  accessToken     String    @db.Text // Encrypted
  refreshToken    String    @db.Text // Encrypted
  tokenExpiry     DateTime
  consentId       String    // Akahu consent ID
  isActive        Boolean   @default(true)
  lastSync        DateTime?
  lastError       String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  accounts        AkahuAccount[]

  @@index([userId])
  @@index([consentId])
  @@index([isActive])
}

model AkahuAccount {
  id                String    @id @default(uuid())
  connectionId      String
  akahuAccountId    String    @unique // Akahu's account ID
  localAccountId    String?   @unique // Link to local Account model
  name              String
  type              String    // Akahu account type (BANK, CARD, etc.)
  institution       String
  accountNumber     String?
  status            String    @default("ACTIVE")
  lastSync          DateTime?
  syncEnabled       Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  connection        AkahuConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  localAccount      Account?        @relation(fields: [localAccountId], references: [id], onDelete: SetNull)
  transactions      AkahuTransaction[]

  @@index([connectionId])
  @@index([akahuAccountId])
  @@index([localAccountId])
  @@index([syncEnabled])
}

model AkahuTransaction {
  id                String    @id @default(uuid())
  akahuAccountId    String
  akahuTransactionId String   @unique // Akahu's transaction ID
  localTransactionId String?  @unique // Link to local Transaction model
  date              DateTime
  amount            Decimal   @db.Decimal(15, 2)
  description       String
  merchant          String?
  category          String?   // Akahu's category
  type              String    // Akahu transaction type
  status            String    // PENDING, POSTED
  balance           Decimal?  @db.Decimal(15, 2)
  rawData           Json?     // Store full Akahu response
  isDuplicate       Boolean   @default(false)
  duplicateOfId     String?   // Link to duplicate local transaction
  needsReview       Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  akahuAccount      AkahuAccount  @relation(fields: [akahuAccountId], references: [id], onDelete: Cascade)
  localTransaction  Transaction?  @relation(fields: [localTransactionId], references: [id], onDelete: SetNull)

  @@index([akahuAccountId])
  @@index([akahuTransactionId])
  @@index([localTransactionId])
  @@index([date])
  @@index([isDuplicate])
  @@index([needsReview])
}

model WebhookEvent {
  id              String    @id @default(uuid())
  eventType       String    // transaction.created, account.updated, etc.
  payload         Json
  signature       String
  processed       Boolean   @default(false)
  processedAt     DateTime?
  error           String?
  retryCount      Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([eventType])
  @@index([processed])
  @@index([createdAt])
}

model SyncJob {
  id              String    @id @default(uuid())
  connectionId    String
  type            String    // FULL, INCREMENTAL, ACCOUNT_ONLY, TRANSACTION_ONLY
  status          String    // PENDING, IN_PROGRESS, COMPLETED, FAILED
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  accountsSynced  Int       @default(0)
  transactionsSynced Int    @default(0)
  duplicatesFound Int       @default(0)
  errors          Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([connectionId])
  @@index([status])
  @@index([startedAt])
}
```

#### Updates to Existing Models

```prisma
model Account {
  // ... existing fields ...
  akahuAccount    AkahuAccount? // Reverse relation
  isAkahuLinked   Boolean       @default(false)
  lastAkahuSync   DateTime?
}

model Transaction {
  // ... existing fields ...
  akahuTransaction AkahuTransaction? // Reverse relation
  isFromAkahu      Boolean           @default(false)
  akahuMerchant    String?
}
```

---

## API Endpoints

### Backend API Routes

**Base Path**: `/api/v1/akahu`

#### Authentication Routes
- `POST /auth/connect` - Initiate OAuth flow
  - Returns: OAuth authorization URL
- `GET /auth/callback` - OAuth callback handler
  - Query params: `code`, `state`
  - Returns: Success message, redirects to app
- `POST /auth/disconnect/:id` - Disconnect Akahu connection
  - Returns: Success confirmation
- `POST /auth/refresh/:id` - Manually refresh token
  - Returns: Updated connection status

#### Connection Routes
- `GET /connections` - Get all user connections
  - Returns: Array of AkahuConnection
- `GET /connections/:id` - Get single connection
  - Returns: AkahuConnection with accounts
- `GET /connections/:id/status` - Get connection status
  - Returns: Status, last sync, error info

#### Account Routes
- `GET /accounts` - Get all Akahu accounts
  - Query params: `connectionId` (optional)
  - Returns: Array of AkahuAccount
- `GET /accounts/:id` - Get single Akahu account
  - Returns: AkahuAccount with sync status
- `POST /accounts/:id/link` - Link Akahu account to local account
  - Body: `{ localAccountId: string }`
  - Returns: Updated AkahuAccount
- `POST /accounts/:id/unlink` - Unlink Akahu account
  - Returns: Updated AkahuAccount
- `POST /accounts/:id/sync` - Trigger account sync
  - Returns: SyncJob

#### Transaction Routes
- `GET /transactions` - Get synced transactions
  - Query params: `accountId`, `startDate`, `endDate`, `needsReview`
  - Returns: Paginated AkahuTransaction list
- `GET /transactions/:id` - Get single transaction
  - Returns: AkahuTransaction with details
- `POST /transactions/:id/approve` - Approve and import transaction
  - Returns: Created local Transaction
- `POST /transactions/:id/reject` - Reject transaction (mark as duplicate)
  - Returns: Success confirmation
- `POST /transactions/:id/merge` - Merge with existing transaction
  - Body: `{ localTransactionId: string }`
  - Returns: Updated linkage

#### Sync Routes
- `POST /sync` - Trigger full sync
  - Body: `{ connectionId: string, full?: boolean }`
  - Returns: SyncJob
- `GET /sync/status` - Get sync status
  - Query params: `connectionId`
  - Returns: Current sync status, progress
- `GET /sync/history` - Get sync history
  - Query params: `connectionId`, `page`, `pageSize`
  - Returns: Paginated SyncJob list

#### Webhook Routes
- `POST /webhooks` - Webhook receiver endpoint
  - Headers: `X-Akahu-Signature`
  - Body: Webhook payload
  - Returns: 200 OK (processed asynchronously)

---

## Backend Services

### 1. AkahuApiService

Wrapper around Akahu API with error handling and retry logic.

**Methods**:
```typescript
class AkahuApiService {
  // Authentication
  getAuthorizationUrl(state: string): string
  exchangeCodeForToken(code: string): Promise<TokenResponse>
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>

  // Accounts
  getAccounts(accessToken: string): Promise<AkahuAccount[]>
  getAccount(accessToken: string, accountId: string): Promise<AkahuAccount>

  // Transactions
  getTransactions(
    accessToken: string,
    accountId: string,
    options?: { start?: Date, end?: Date }
  ): Promise<AkahuTransaction[]>

  // Webhooks
  verifyWebhookSignature(payload: string, signature: string): boolean
}
```

### 2. AkahuAuthService

Manages OAuth flow and token lifecycle.

**Methods**:
```typescript
class AkahuAuthService {
  initiateConnection(): Promise<{ url: string, state: string }>
  handleCallback(code: string, state: string): Promise<AkahuConnection>
  refreshToken(connectionId: string): Promise<AkahuConnection>
  disconnectConnection(connectionId: string): Promise<void>
  encryptToken(token: string): string
  decryptToken(encryptedToken: string): string
}
```

### 3. AkahuSyncService

Handles account and transaction synchronization.

**Methods**:
```typescript
class AkahuSyncService {
  // Full sync
  syncConnection(connectionId: string, options?: SyncOptions): Promise<SyncJob>

  // Account sync
  syncAccounts(connectionId: string): Promise<AkahuAccount[]>
  linkAccount(akahuAccountId: string, localAccountId: string): Promise<void>

  // Transaction sync
  syncTransactions(
    akahuAccountId: string,
    options?: { startDate?: Date, endDate?: Date }
  ): Promise<AkahuTransaction[]>

  // Incremental sync
  syncNewTransactions(akahuAccountId: string): Promise<AkahuTransaction[]>
}
```

### 4. DuplicateDetectionService

Intelligent duplicate detection algorithm.

**Methods**:
```typescript
class DuplicateDetectionService {
  findDuplicates(
    akahuTransaction: AkahuTransaction,
    localAccountId: string
  ): Promise<DuplicateMatch[]>

  calculateConfidence(
    akahu: AkahuTransaction,
    local: Transaction
  ): number // 0-100

  autoMergeDuplicates(
    akahuTransactionId: string,
    localTransactionId: string
  ): Promise<void>
}
```

**Matching Algorithm**:
1. **Exact Match** (100% confidence):
   - Same Akahu transaction ID already linked
   - Auto-merge

2. **High Confidence** (90-99%):
   - Date: Exact match
   - Amount: Exact match
   - Description: Fuzzy match >90% (Levenshtein distance)
   - Account: Same account
   - Action: Auto-link or suggest merge

3. **Medium Confidence** (70-89%):
   - Date: ±2 days
   - Amount: Exact match
   - Description: Fuzzy match >80%
   - Account: Same account
   - Action: Flag for review, suggest merge

4. **Low Confidence** (50-69%):
   - Date: ±7 days
   - Amount: ±2% difference
   - Description: Fuzzy match >70%
   - Action: Flag for manual review

5. **No Match** (<50%):
   - Create new transaction

### 5. WebhookService

Processes Akahu webhook events.

**Methods**:
```typescript
class WebhookService {
  receiveWebhook(payload: any, signature: string): Promise<void>
  verifySignature(payload: string, signature: string): boolean
  processEvent(event: WebhookEvent): Promise<void>
  retryFailedEvents(): Promise<void>
}
```

**Event Types**:
- `transaction.created`: New transaction detected
- `transaction.updated`: Transaction details changed
- `account.updated`: Account details changed
- `connection.revoked`: User revoked consent

### 6. BackgroundJobService

Manages scheduled and queued jobs.

**Jobs**:
- `scheduled-sync`: Run every hour (configurable)
- `webhook-processor`: Process webhook events
- `token-refresh`: Refresh expiring tokens
- `cleanup-orphaned`: Clean up unlinked data

**Using Bull/BullMQ**:
```typescript
// Scheduled sync job
Queue.add('scheduled-sync', {}, {
  repeat: { cron: '0 * * * *' } // Every hour
});

// Webhook processing job
Queue.add('webhook-processor', {
  eventId: 'uuid'
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});
```

---

## Frontend Components

### Pages

#### 1. Banking Settings Page (`/settings/banking`)

**Purpose**: Manage Akahu connections and linked accounts

**Components**:
- List of connected banks
- Connection status indicators
- Manual sync trigger buttons
- Last sync timestamps
- Account linking interface
- Connection deletion

**Features**:
- Add new bank connection
- View connection details
- Disconnect banks
- View sync history
- Manage account links

#### 2. Connect Bank Wizard (`/settings/banking/connect`)

**Purpose**: Guide user through Akahu connection flow

**Steps**:
1. Introduction and consent
2. Redirect to Akahu OAuth
3. Account selection and linking
4. Initial sync configuration
5. Completion and redirect

### Components

#### 1. BankConnectionCard

Display single Akahu connection with status.

**Props**:
```typescript
interface BankConnectionCardProps {
  connection: AkahuConnection;
  onSync: (id: string) => void;
  onDisconnect: (id: string) => void;
}
```

**Features**:
- Show bank logo/name
- Connection status badge
- Last sync timestamp
- Manual sync button
- Disconnect button
- Account count

#### 2. AccountLinkDialog

Link Akahu account to local account.

**Props**:
```typescript
interface AccountLinkDialogProps {
  akahuAccount: AkahuAccount;
  localAccounts: Account[];
  onLink: (akahuId: string, localId: string) => void;
  onCreateNew: (akahuAccount: AkahuAccount) => void;
}
```

**Features**:
- Show Akahu account details
- Dropdown to select local account
- Option to create new account
- Auto-suggest matching accounts

#### 3. SyncStatusIndicator

Show real-time sync status.

**Props**:
```typescript
interface SyncStatusIndicatorProps {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync?: Date;
  error?: string;
}
```

**Features**:
- Animated spinner during sync
- Success/error icons
- Relative time display
- Error tooltip

#### 4. TransactionReviewList

Review and approve synced transactions.

**Props**:
```typescript
interface TransactionReviewListProps {
  transactions: AkahuTransaction[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMerge: (akahuId: string, localId: string) => void;
}
```

**Features**:
- List of transactions needing review
- Approve/reject buttons
- Merge suggestions
- Bulk actions

#### 5. DuplicateTransactionDialog

Resolve potential duplicate detections.

**Props**:
```typescript
interface DuplicateTransactionDialogProps {
  akahuTransaction: AkahuTransaction;
  potentialDuplicates: Transaction[];
  onMerge: (localId: string) => void;
  onCreateNew: () => void;
}
```

**Features**:
- Side-by-side comparison
- Confidence score display
- Merge button per match
- Create as new option

#### 6. ConnectBankButton

Initiate Akahu connection flow.

**Props**:
```typescript
interface ConnectBankButtonProps {
  variant?: 'text' | 'contained' | 'outlined';
  onConnect: () => void;
}
```

**Features**:
- Clear call-to-action
- Loading state during OAuth redirect
- Error handling

---

## Akahu API Integration

### Authentication Flow

**OAuth 2.0 Authorization Code Flow**:

1. **Initiate Connection**:
   ```
   GET /oauth/authorize
   ?client_id=your_client_id
   &response_type=code
   &redirect_uri=https://your-app.com/api/v1/akahu/auth/callback
   &scope=ACCOUNTS TRANSACTIONS IDENTITY
   &state=random_state_token
   ```

2. **User Authorization**:
   - User redirected to Akahu login
   - User selects bank and authenticates
   - User grants permissions

3. **Authorization Callback**:
   ```
   GET /api/v1/akahu/auth/callback?code=AUTH_CODE&state=STATE_TOKEN
   ```

4. **Exchange Code for Token**:
   ```
   POST https://api.akahu.nz/oauth/token
   {
     "grant_type": "authorization_code",
     "code": "AUTH_CODE",
     "client_id": "your_client_id",
     "client_secret": "your_client_secret",
     "redirect_uri": "https://your-app.com/api/v1/akahu/auth/callback"
   }
   ```

5. **Store Tokens**:
   - Encrypt access_token and refresh_token
   - Store in database with expiry

### API Requests

**Headers**:
```
Authorization: Bearer {access_token}
X-Akahu-ID: {app_token}
```

**Fetching Accounts**:
```
GET https://api.akahu.nz/api/v1/accounts
```

**Response**:
```json
{
  "items": [
    {
      "_id": "acc_123456",
      "name": "Everyday Account",
      "type": "BANK",
      "connection": {
        "name": "ANZ Bank New Zealand"
      },
      "formatted_account": "01-0242-0100194-00",
      "balance": {
        "current": 1234.56,
        "available": 1234.56
      },
      "status": "ACTIVE"
    }
  ]
}
```

**Fetching Transactions**:
```
GET https://api.akahu.nz/api/v1/accounts/{account_id}/transactions
?start=2024-01-01
&end=2024-12-31
```

**Response**:
```json
{
  "items": [
    {
      "_id": "trans_789012",
      "date": "2024-01-15T00:00:00Z",
      "description": "Coffee Shop",
      "amount": -5.50,
      "balance": 1229.06,
      "type": "DEBIT",
      "merchant": {
        "name": "Coffee Shop",
        "category": "FOOD_AND_DRINK"
      },
      "meta": {
        "particulars": "EFTPOS",
        "reference": "1234"
      }
    }
  ],
  "cursor": {
    "next": "cursor_token_for_pagination"
  }
}
```

### Webhook Configuration

**Setup**:
```
POST https://api.akahu.nz/api/v1/webhooks
{
  "url": "https://your-app.com/api/v1/akahu/webhooks",
  "events": [
    "transaction.created",
    "transaction.updated",
    "account.updated"
  ]
}
```

**Webhook Payload Example**:
```json
{
  "type": "transaction.created",
  "item_id": "trans_new123",
  "account_id": "acc_123456",
  "webhook_id": "webhook_id",
  "created_at": "2024-01-15T12:34:56Z"
}
```

**Signature Verification**:
```typescript
const crypto = require('crypto');

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

---

## User Experience Flows

### Flow 1: Connect First Bank Account

```
1. User navigates to Settings → Banking
2. User clicks "Connect Bank Account"
3. System displays consent screen:
   "Connect your bank account to automatically sync transactions"
   - What data will be accessed (read-only)
   - Security information
   - Privacy policy link
4. User clicks "Continue"
5. System redirects to Akahu OAuth
6. User selects their bank (e.g., ANZ, BNZ, Westpac)
7. User logs into bank's website
8. User grants permissions
9. Akahu redirects back to app with auth code
10. System exchanges code for tokens
11. System fetches connected accounts from Akahu
12. System displays account linking dialog:
    "We found 2 accounts. Link them to your existing accounts or create new ones."
    [Akahu Account 1] → [Dropdown: Select account or Create New]
    [Akahu Account 2] → [Dropdown: Select account or Create New]
13. User links or creates accounts
14. User clicks "Start Sync"
15. System begins initial sync in background
16. System shows progress: "Syncing transactions... 50/500 imported"
17. Sync completes
18. System shows summary: "500 transactions imported, 5 need review"
19. User clicks "Review Transactions"
20. System shows duplicate detection UI
21. User approves/merges/rejects flagged transactions
22. Complete! User redirected to Dashboard
```

### Flow 2: Automatic Sync (Background Job)

```
1. Cron job triggers hourly sync
2. System fetches all active Akahu connections
3. For each connection:
   a. Check if token needs refresh
   b. Refresh token if needed
   c. Fetch new transactions since last sync
   d. For each transaction:
      - Run duplicate detection
      - If high confidence match: Auto-link
      - If medium confidence: Flag for review
      - If no match: Create new transaction
   e. Update account balances
   f. Update last sync timestamp
4. If any transactions need review:
   a. Create in-app notification
   b. Optionally send email/push notification
5. Log sync results to SyncJob table
6. If errors occurred:
   a. Log errors
   b. Send alert to monitoring system
   c. Retry with exponential backoff
```

### Flow 3: Webhook Real-Time Update

```
1. User makes purchase with debit card
2. Bank posts transaction
3. Akahu detects new transaction
4. Akahu sends webhook to app:
   POST /api/v1/akahu/webhooks
   {
     "type": "transaction.created",
     "item_id": "trans_abc123",
     "account_id": "acc_xyz789"
   }
5. System verifies webhook signature
6. System queues webhook event for processing
7. Background job processes event:
   a. Fetch full transaction details from Akahu
   b. Run duplicate detection
   c. If high confidence match: Auto-link
   d. If medium confidence: Flag for review
   e. If no match: Create new transaction
8. If UI is open:
   a. Send real-time update via WebSocket
   b. Update transaction list in UI
   c. Show toast notification: "New transaction: Coffee Shop -$5.50"
9. Mark webhook as processed
```

---

## Security Considerations

### Token Security

**Encryption at Rest**:
- Use AES-256-GCM for token encryption
- Store encryption key in environment variable (never in code)
- Rotate encryption keys periodically
- Use unique IV for each encryption

**Example**:
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.AKAHU_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Webhook Security

**Signature Verification**:
- Verify HMAC-SHA256 signature on every webhook
- Reject webhooks with invalid signatures
- Use timing-safe comparison to prevent timing attacks
- Log all verification attempts

**Idempotency**:
- Store webhook event IDs
- Detect and ignore duplicate webhooks
- Process each event exactly once

**Rate Limiting**:
- Limit webhook endpoint to prevent abuse
- Use IP whitelisting for Akahu servers

### Data Protection

**Logging**:
- NEVER log access tokens or refresh tokens
- NEVER log full account numbers
- Redact sensitive data in error logs
- Use structured logging with severity levels

**Database Security**:
- Encrypted connections to database (TLS)
- Principle of least privilege for database user
- Regular security audits of database access
- Backup encryption

**API Security**:
- HTTPS only (no HTTP)
- CORS restricted to app domain
- Rate limiting on all endpoints
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- XSS prevention (React escaping)

---

## Performance Optimization

### Database Indexing

**Critical Indexes**:
```prisma
// Fast duplicate detection
@@index([date, amount, accountId]) // Composite index

// Fast account lookups
@@index([akahuAccountId])
@@index([localAccountId])

// Fast transaction queries
@@index([akahuTransactionId])
@@index([needsReview])
@@index([isDuplicate])

// Fast webhook processing
@@index([eventType, processed])
```

### Caching Strategy

**Redis Caching**:
- Cache Akahu account list (TTL: 1 hour)
- Cache active connections (TTL: 30 minutes)
- Cache duplicate detection results (TTL: 5 minutes)
- Invalidate cache on sync completion

**Example**:
```typescript
async function getCachedAccounts(connectionId: string): Promise<AkahuAccount[]> {
  const cacheKey = `akahu:accounts:${connectionId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const accounts = await fetchAccountsFromAkahu(connectionId);
  await redis.setex(cacheKey, 3600, JSON.stringify(accounts));

  return accounts;
}
```

### Batch Processing

**Transaction Import**:
- Process 1000 transactions per batch
- Use database transactions for atomicity
- Parallelize duplicate detection (Promise.all)
- Commit in batches to reduce lock time

**Example**:
```typescript
async function importTransactionsBatch(
  transactions: AkahuTransaction[],
  batchSize: number = 1000
): Promise<void> {
  const batches = chunk(transactions, batchSize);

  for (const batch of batches) {
    await prisma.$transaction(async (tx) => {
      const results = await Promise.all(
        batch.map(t => duplicateDetection.findDuplicates(t))
      );

      // Process results...
    });
  }
}
```

---

## Testing Strategy

### Unit Tests

**Services**:
- `AkahuApiService` - Mock HTTP responses
- `DuplicateDetectionService` - Test matching algorithm
- `WebhookService` - Test signature verification
- Encryption/decryption functions

**Example**:
```typescript
describe('DuplicateDetectionService', () => {
  it('should detect exact duplicate with 100% confidence', async () => {
    const akahu = createMockAkahuTransaction();
    const local = createMatchingLocalTransaction();

    const confidence = await service.calculateConfidence(akahu, local);

    expect(confidence).toBe(100);
  });

  it('should detect near duplicate with 85% confidence', async () => {
    const akahu = createMockAkahuTransaction({
      description: 'Coffee Shop Auckland'
    });
    const local = createMatchingLocalTransaction({
      description: 'Coffee Shop'
    });

    const confidence = await service.calculateConfidence(akahu, local);

    expect(confidence).toBeGreaterThan(80);
    expect(confidence).toBeLessThan(90);
  });
});
```

### Integration Tests

**API Endpoints**:
- OAuth callback handling
- Account sync endpoint
- Transaction sync endpoint
- Webhook receiver

**Database Operations**:
- Token encryption/decryption roundtrip
- Duplicate detection queries
- Account linking

**Example**:
```typescript
describe('POST /api/v1/akahu/sync', () => {
  it('should trigger sync and return job ID', async () => {
    const connection = await createTestConnection();

    const response = await request(app)
      .post('/api/v1/akahu/sync')
      .send({ connectionId: connection.id })
      .expect(200);

    expect(response.body.jobId).toBeDefined();
    expect(response.body.status).toBe('PENDING');
  });
});
```

### End-to-End Tests

**Akahu Sandbox**:
- Test full OAuth flow with sandbox
- Test account fetching
- Test transaction sync
- Test webhook delivery

**Manual Testing Checklist**:
- [ ] Connect bank account via OAuth
- [ ] Verify accounts synced correctly
- [ ] Link Akahu account to existing account
- [ ] Trigger manual sync
- [ ] Verify transactions imported
- [ ] Test duplicate detection accuracy
- [ ] Approve/reject flagged transactions
- [ ] Disconnect bank account
- [ ] Verify data cleanup on disconnect
- [ ] Test webhook processing
- [ ] Test error handling (expired token, API error)

---

## Deployment Considerations

### Environment Variables

**Required**:
```bash
# Akahu API Credentials
AKAHU_APP_TOKEN=your_app_token
AKAHU_CLIENT_ID=your_client_id
AKAHU_CLIENT_SECRET=your_client_secret
AKAHU_WEBHOOK_SECRET=your_webhook_secret

# OAuth Configuration
AKAHU_REDIRECT_URI=https://your-app.com/api/v1/akahu/auth/callback
AKAHU_BASE_URL=https://api.akahu.nz

# Encryption
AKAHU_ENCRYPTION_KEY=32-byte-hex-key

# Sync Configuration
SYNC_INTERVAL=0 * * * * # Hourly (cron)
SYNC_LOOKBACK_DAYS=90   # How far back to sync on first connection

# Rate Limiting
AKAHU_RATE_LIMIT_PER_SECOND=10
AKAHU_RETRY_MAX_ATTEMPTS=3
AKAHU_RETRY_BACKOFF_MS=2000

# Redis (for job queue)
REDIS_URL=redis://localhost:6379
```

### Infrastructure Requirements

**Additional Services**:
- Redis (for Bull queue and caching)
- Background worker process (for job processing)

**Docker Compose Update**:
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  worker:
    build: ./backend
    command: npm run worker
    depends_on:
      - redis
      - database
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379

volumes:
  redis_data:
```

### Monitoring & Alerting

**Metrics to Track**:
- Sync job success rate
- Sync job duration
- Webhook processing time
- API error rate
- Token refresh failures
- Duplicate detection accuracy

**Alerts**:
- Sync failures > 5% in 1 hour
- Webhook processing lag > 5 minutes
- Token refresh failures
- API rate limit exceeded

**Logging**:
```typescript
logger.info('Sync started', {
  connectionId,
  type: 'FULL',
  timestamp: new Date()
});

logger.error('Sync failed', {
  connectionId,
  error: error.message,
  stack: error.stack,
  timestamp: new Date()
});
```

---

## Dependencies

### Backend Packages

```json
{
  "axios": "^1.6.0",              // HTTP client for Akahu API
  "bull": "^4.12.0",              // Job queue
  "crypto": "built-in",           // Encryption
  "node-cron": "^3.0.3",          // Scheduled jobs
  "ioredis": "^5.3.0",            // Redis client
  "string-similarity": "^4.0.4"   // Fuzzy string matching
}
```

### Frontend Packages

```json
{
  "date-fns": "^3.0.0",           // Already installed
  "socket.io-client": "^4.6.0"    // Optional: real-time updates
}
```

---

## Rollout Strategy

### Phase 1: Development & Testing (Weeks 1-3)
- Set up Akahu developer account
- Implement OAuth flow
- Implement account sync
- Implement transaction sync
- Implement duplicate detection
- Test with Akahu sandbox

### Phase 2: Internal Beta (Week 4)
- Deploy to staging environment
- Test with real bank accounts (team members only)
- Refine duplicate detection algorithm
- Monitor sync performance
- Fix bugs

### Phase 3: Private Beta (Weeks 5-6)
- Invite 10-20 users
- Collect feedback
- Monitor error rates
- Optimize performance
- Document common issues

### Phase 4: Public Release (Week 7+)
- Feature flag rollout (10% → 50% → 100%)
- Monitor system load
- Scale infrastructure as needed
- Support user inquiries
- Iterate based on feedback

---

## Success Metrics

**Technical Metrics**:
- ✅ OAuth flow success rate > 98%
- ✅ Sync completion rate > 99%
- ✅ Duplicate detection accuracy > 95%
- ✅ Webhook processing time < 30 seconds
- ✅ API response time < 500ms (p95)
- ✅ Zero security vulnerabilities

**User Metrics**:
- ✅ 50%+ of users connect at least one bank account
- ✅ Average of 2+ accounts connected per user
- ✅ 80%+ of transactions imported automatically
- ✅ <5% transactions flagged for review
- ✅ User satisfaction rating > 4.5/5

**Business Metrics**:
- ✅ 50% reduction in manual transaction entry time
- ✅ 90% of active users using Akahu sync
- ✅ <1% disconnection rate per month
- ✅ Positive NPS score for feature

---

## Future Enhancements

**Post-MVP Features**:
- Multi-bank support (expand beyond Akahu's network)
- International banking APIs (Plaid, TrueLayer, Open Banking UK)
- Investment account synchronization
- Credit card rewards tracking
- Bill prediction from recurring patterns
- Smart alerts for unusual spending
- Merchant categorization improvements
- Tax preparation export
- Integration with accounting software (Xero, MYOB)
- Mobile app support for OAuth flow
- Biometric authentication for re-consent
- Multi-currency support

**Advanced Features**:
- Machine learning for better duplicate detection
- Anomaly detection for fraud prevention
- Spending pattern analysis
- Cash flow forecasting with ML
- Account aggregation across platforms
- Shared household accounts
- Business account support
- Cryptocurrency exchange integration

---

## Open Questions & Decisions Needed

1. **Sync Frequency**: Hourly or user-configurable (hourly, daily, manual)?
2. **Historical Sync Depth**: 90 days, 1 year, or unlimited?
3. **Duplicate Review**: Auto-approve high confidence or always require review?
4. **Data Retention**: Keep Akahu transaction data indefinitely or purge after linking?
5. **Real-Time Updates**: Implement WebSocket for instant UI updates or polling?
6. **Multiple Connections**: Allow multiple Akahu connections per user?
7. **Account Unlinking**: What happens to transactions when account is unlinked?
8. **Webhook Failures**: How many retries before manual intervention required?
9. **Offline Mode**: Cache transactions locally if Akahu unavailable?
10. **Consent Renewal**: How to handle when Akahu consent expires?

---

**Feature Plan Status**: 📋 PLANNING COMPLETE
**Ready for**: User decisions and implementation planning

**Estimated Effort**:
- Complexity: Very High
- Commits: 40-50
- Duration: 6-8 weeks
- Team Size: 1-2 developers recommended

**Next Steps**:
1. Review and approve feature plan
2. Set up Akahu developer account
3. Decide on open questions
4. Create implementation branch
5. Begin Phase 1 (OAuth + Authentication)
