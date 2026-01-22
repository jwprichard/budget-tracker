# Feature Plan: Planned Transactions & Forecasting

## Milestone 6 Implementation

**Status**: Design Phase
**Dependencies**: Milestone 2 (Transactions), Milestone 5 (Budgets)
**Reference**: `/docs/budgets-planning-design.md`

---

## Overview

This feature introduces **Planned Transactions** - expected future money movements that drive cash flow forecasting. Combined with the existing budget system, this enables accurate balance predictions while maintaining clean separation of concerns.

### Core Principles (from design doc)

1. **Transactions are facts** - Money that has actually moved
2. **Planned Transactions are intent** - Expected future money movement
3. **Budgets are constraints** - Spending limits, never directly affect balances
4. **Only transactions and planned transactions move money**
5. **Forecasting must never double-count**
6. **Planned transactions do not require budgets**

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Budgets ↔ Planned Transactions | Hybrid implicit spend | Budgets track limits; forecast engine adds unplanned budget capacity as "implicit spend" without creating records |
| Recurrence model | Template + Virtual Instances | Consistent with budget architecture; efficient storage; easy series updates |
| Transaction matching | Auto-match with review + opt-out | High-confidence matches auto-link; medium-confidence queued for review; trusted items can skip review |
| When matched | Delete planned instance | Actual transaction is source of truth; template continues generating future instances |
| Implicit spend distribution | Configurable per budget | Daily spread vs end-of-period lump; different budgets have different patterns |
| Forecast range | On-demand with presets | Default 90 days; UI presets (30d, 90d, 6mo, 1yr); custom date range override |
| Planned transaction scope | Account-specific + transfers | Clear per-account forecasting; support for planned transfers between accounts |
| Timezone handling | UTC storage + user timezone | Store dates in UTC, convert using user's timezone preference on display |
| Floating day-of-month | Common options supported | LAST_DAY, FIRST/LAST_WEEKDAY, FIRST/LAST of specific weekday |
| Planned transfers | Two transactions | Creates expense from source + income to destination (like actual transfers) |

---

## User Model Update

Add timezone preference to User model:

```prisma
// Add to existing User model:
model User {
  // ... existing fields ...

  timezone              String    @default("UTC")  // IANA timezone (e.g., "Pacific/Auckland", "America/New_York")
}
```

---

## Data Model

### Enums

```prisma
enum DayOfMonthType {
  FIXED           // Use dayOfMonth field (1-31)
  LAST_DAY        // Last day of month
  FIRST_WEEKDAY   // First Monday-Friday of month
  LAST_WEEKDAY    // Last Monday-Friday of month
  FIRST_OF_WEEK   // First occurrence of dayOfWeek in month
  LAST_OF_WEEK    // Last occurrence of dayOfWeek in month
}

enum ImplicitSpendMode {
  DAILY           // Spread evenly across days in period
  END_OF_PERIOD   // Assume spent at end of period
  NONE            // Don't include in forecast (tracking only)
}

enum MatchMethod {
  AUTO            // System auto-matched, high confidence
  AUTO_REVIEWED   // System suggested, user confirmed
  MANUAL          // User manually linked
}
```

### PlannedTransactionTemplate

Defines a recurring pattern for planned transactions.

```prisma
model PlannedTransactionTemplate {
  id                    String    @id @default(uuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Transaction details
  accountId             String
  account               Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  categoryId            String?
  category              Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  // For transfers
  isTransfer            Boolean   @default(false)
  transferToAccountId   String?
  transferToAccount     Account?  @relation("TransferTo", fields: [transferToAccountId], references: [id], onDelete: SetNull)

  // Amount and type
  amount                Decimal   @db.Decimal(12, 2)  // Positive for income, negative for expense
  type                  TransactionType  // INCOME, EXPENSE, TRANSFER

  // Description
  name                  String    // e.g., "Monthly Rent", "Salary"
  description           String?   // Optional detailed description
  notes                 String?

  // Recurrence pattern
  periodType            BudgetPeriod  // DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, ANNUALLY
  interval              Int       @default(1)  // Every N periods
  firstOccurrence       DateTime  // When the pattern starts (stored in UTC)
  endDate               DateTime? // Optional end date (null = indefinite)

  // Day-of-period specification (for flexibility)
  dayOfMonth            Int?      // 1-31, null for non-monthly or when using dayOfMonthType
  dayOfMonthType        DayOfMonthType?  // For floating days (last day, first weekday, etc.)
  dayOfWeek             Int?      // 0-6 (Sunday-Saturday), for weekly or "first/last X of month"

  // Matching configuration
  autoMatchEnabled      Boolean   @default(true)   // Whether to auto-match actual transactions
  skipReview            Boolean   @default(false)  // Skip review queue for high-trust items
  matchTolerance        Decimal?  @db.Decimal(12, 2)  // Amount tolerance for matching (e.g., $5)
  matchWindowDays       Int       @default(7)      // Days before/after expected date to match

  // Budget linkage (optional)
  budgetId              String?   // Optional link to a budget for tracking
  budget                Budget?   @relation(fields: [budgetId], references: [id], onDelete: SetNull)

  // Status
  isActive              Boolean   @default(true)

  // Metadata
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  overrides             PlannedTransaction[]  // Customized instances

  @@map("planned_transaction_templates")
}
```

### PlannedTransaction

Individual planned transaction instance. Only created when:
1. User customizes a specific occurrence (override)
2. A one-time (non-recurring) planned transaction is created

```prisma
model PlannedTransaction {
  id                    String    @id @default(uuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Link to template (null for one-time planned transactions)
  templateId            String?
  template              PlannedTransactionTemplate? @relation(fields: [templateId], references: [id], onDelete: Cascade)

  // Transaction details (can override template values)
  accountId             String
  account               Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  categoryId            String?
  category              Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  // For transfers
  isTransfer            Boolean   @default(false)
  transferToAccountId   String?
  transferToAccount     Account?  @relation("PlannedTransferTo", fields: [transferToAccountId], references: [id], onDelete: SetNull)

  // Amount and type
  amount                Decimal   @db.Decimal(12, 2)
  type                  TransactionType

  // Description
  name                  String
  description           String?
  notes                 String?

  // Timing
  expectedDate          DateTime  // When this transaction is expected

  // Override flag
  isOverride            Boolean   @default(false)  // True if this overrides a template instance

  // Matching (inherited from template or set directly)
  autoMatchEnabled      Boolean   @default(true)
  skipReview            Boolean   @default(false)
  matchTolerance        Decimal?  @db.Decimal(12, 2)
  matchWindowDays       Int       @default(7)

  // Budget linkage
  budgetId              String?
  budget                Budget?   @relation(fields: [budgetId], references: [id], onDelete: SetNull)

  // Metadata
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@map("planned_transactions")
}
```

### Budget Model Updates

Add implicit spend distribution configuration:

```prisma
// Add to existing Budget/BudgetTemplate model:
implicitSpendMode       ImplicitSpendMode @default(DAILY)

enum ImplicitSpendMode {
  DAILY           // Spread evenly across days in period
  END_OF_PERIOD   // Assume spent at end of period
  NONE            // Don't include in forecast (tracking only)
}
```

### MatchedTransaction (Join Table)

Track which actual transactions matched which planned transactions (for audit/history).

```prisma
model MatchedTransaction {
  id                      String    @id @default(uuid())

  transactionId           String
  transaction             Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  // Store the planned transaction details at time of match (since we delete the planned tx)
  plannedTemplateId       String?   // Template that generated the planned tx
  plannedExpectedDate     DateTime  // When it was expected
  plannedAmount           Decimal   @db.Decimal(12, 2)

  // Match metadata
  matchConfidence         Decimal   @db.Decimal(5, 2)  // 0-100%
  matchedAt               DateTime  @default(now())
  matchMethod             MatchMethod  // AUTO, MANUAL, AUTO_REVIEWED

  @@unique([transactionId])  // Each transaction can only match once
  @@map("matched_transactions")
}

enum MatchMethod {
  AUTO           // System auto-matched, high confidence
  AUTO_REVIEWED  // System suggested, user confirmed
  MANUAL         // User manually linked
}
```

---

## Virtual Period Generation

Similar to budget virtual periods, planned transactions generate virtual instances on-the-fly.

### VirtualPlannedTransaction

```typescript
interface VirtualPlannedTransaction {
  id: string;                    // "virtual_{templateId}_{expectedDateISO}"
  templateId: string;
  userId: string;

  // Transaction details
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;

  // Transfer details
  isTransfer: boolean;
  transferToAccountId: string | null;
  transferToAccountName: string | null;

  // Amount
  amount: number;
  type: TransactionType;

  // Description
  name: string;
  description: string | null;

  // Timing
  expectedDate: Date;

  // Matching config
  autoMatchEnabled: boolean;
  skipReview: boolean;
  matchTolerance: number | null;
  matchWindowDays: number;

  // Flags
  isVirtual: true;
  isOverride: false;
}
```

### Generation Algorithm

```typescript
function generateVirtualPlannedTransactions(
  template: PlannedTransactionTemplate,
  rangeStart: Date,
  rangeEnd: Date
): VirtualPlannedTransaction[] {
  const periods: VirtualPlannedTransaction[] = [];
  let currentDate = template.firstOccurrence;

  while (currentDate <= rangeEnd) {
    if (currentDate >= rangeStart) {
      // Check if there's an override for this date
      const hasOverride = checkForOverride(template.id, currentDate);

      if (!hasOverride) {
        periods.push(createVirtualInstance(template, currentDate));
      }
    }

    // Advance to next occurrence
    currentDate = calculateNextOccurrence(currentDate, template.periodType, template.interval);

    // Check end date
    if (template.endDate && currentDate > template.endDate) {
      break;
    }
  }

  return periods;
}
```

---

## Forecast Calculation

### Forecast Response Structure

```typescript
interface ForecastResponse {
  // Request parameters
  startDate: string;
  endDate: string;
  accountIds: string[] | null;  // null = all accounts

  // Current state
  currentBalances: {
    accountId: string;
    accountName: string;
    balance: number;
  }[];

  // Daily forecasts
  dailyForecasts: DailyForecast[];

  // Summary
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalTransfers: number;
    netChange: number;
    lowestBalance: number;
    lowestBalanceDate: string;
    lowestBalanceAccount: string;
  };
}

interface DailyForecast {
  date: string;

  // Per-account balances
  accountBalances: {
    accountId: string;
    accountName: string;
    openingBalance: number;
    closingBalance: number;
  }[];

  // Aggregated balance (all accounts)
  totalBalance: number;

  // Breakdown of what contributes to this day
  plannedTransactions: PlannedTransactionSummary[];
  implicitSpend: ImplicitSpendSummary[];

  // Flags
  hasLowBalance: boolean;  // Below user-defined threshold
}

interface PlannedTransactionSummary {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  categoryId: string | null;
  isVirtual: boolean;
}

interface ImplicitSpendSummary {
  budgetId: string;
  budgetName: string;
  categoryId: string;
  categoryName: string;
  amount: number;  // Portion of implicit spend for this day
  mode: ImplicitSpendMode;
}
```

### Calculation Algorithm

```typescript
async function calculateForecast(
  userId: string,
  startDate: Date,
  endDate: Date,
  accountIds?: string[]
): Promise<ForecastResponse> {

  // 1. Get current account balances
  const accounts = await getAccounts(userId, accountIds);
  const balances = new Map<string, number>();
  accounts.forEach(a => balances.set(a.id, a.currentBalance));

  // 2. Get all planned transactions in range
  const plannedTxs = await getPlannedTransactionsInRange(userId, startDate, endDate, accountIds);

  // 3. Get active budgets and calculate implicit spend
  const budgets = await getActiveBudgets(userId, accountIds);
  const implicitSpend = calculateImplicitSpend(budgets, plannedTxs, startDate, endDate);

  // 4. Build daily forecast
  const dailyForecasts: DailyForecast[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);

    // Get planned transactions for this day
    const dayPlanned = plannedTxs.filter(p => isSameDay(p.expectedDate, currentDate));

    // Get implicit spend for this day
    const dayImplicit = implicitSpend.filter(i => isSameDay(i.date, currentDate));

    // Calculate balance changes
    for (const pt of dayPlanned) {
      applyPlannedTransaction(balances, pt);
    }

    for (const is of dayImplicit) {
      applyImplicitSpend(balances, is);
    }

    // Record daily forecast
    dailyForecasts.push({
      date: dateStr,
      accountBalances: Array.from(balances.entries()).map(([id, bal]) => ({
        accountId: id,
        accountName: accounts.find(a => a.id === id)!.name,
        openingBalance: /* previous day closing */,
        closingBalance: bal,
      })),
      totalBalance: Array.from(balances.values()).reduce((a, b) => a + b, 0),
      plannedTransactions: dayPlanned,
      implicitSpend: dayImplicit,
      hasLowBalance: /* check threshold */,
    });

    currentDate = addDays(currentDate, 1);
  }

  return { /* ... */ };
}
```

### Implicit Spend Calculation

```typescript
interface DailyImplicitSpend {
  budgetId: string;
  budgetName: string;
  categoryId: string;
  categoryName: string;
  accountId: string;  // Default account or budget's linked account
  date: Date;
  amount: number;
  mode: ImplicitSpendMode;
}

function calculateImplicitSpend(
  budgets: BudgetWithStatus[],
  plannedTransactions: PlannedTransaction[],
  startDate: Date,
  endDate: Date
): DailyImplicitSpend[] {
  const result: DailyImplicitSpend[] = [];

  for (const budget of budgets) {
    if (budget.implicitSpendMode === 'NONE') continue;

    // Get budget periods that overlap with forecast range
    const periods = getBudgetPeriodsInRange(budget, startDate, endDate);

    for (const period of periods) {
      // Calculate planned spend in this period (from planned transactions matching this budget)
      const plannedSpend = plannedTransactions
        .filter(pt => matchesBudget(pt, budget) && isInPeriod(pt.expectedDate, period))
        .reduce((sum, pt) => sum + Math.abs(pt.amount), 0);

      // Calculate remaining budget capacity
      const remainingCapacity = Math.max(0, budget.amount - plannedSpend);

      if (remainingCapacity <= 0) continue;

      // Distribute implicit spend based on mode
      if (budget.implicitSpendMode === 'DAILY') {
        const daysInPeriod = getDaysBetween(period.startDate, period.endDate);
        const dailyAmount = remainingCapacity / daysInPeriod;

        let date = new Date(Math.max(period.startDate.getTime(), startDate.getTime()));
        const periodEnd = new Date(Math.min(period.endDate.getTime(), endDate.getTime()));

        while (date <= periodEnd) {
          result.push({
            budgetId: budget.id,
            budgetName: budget.name,
            categoryId: budget.categoryId,
            categoryName: budget.categoryName,
            accountId: budget.accountId || getDefaultAccount(userId),
            date: new Date(date),
            amount: -dailyAmount,  // Expenses are negative
            mode: 'DAILY',
          });
          date = addDays(date, 1);
        }
      } else if (budget.implicitSpendMode === 'END_OF_PERIOD') {
        const spendDate = period.endDate <= endDate ? period.endDate : null;
        if (spendDate && spendDate >= startDate) {
          result.push({
            budgetId: budget.id,
            budgetName: budget.name,
            categoryId: budget.categoryId,
            categoryName: budget.categoryName,
            accountId: budget.accountId || getDefaultAccount(userId),
            date: spendDate,
            amount: -remainingCapacity,
            mode: 'END_OF_PERIOD',
          });
        }
      }
    }
  }

  return result;
}
```

---

## Transaction Matching

### Matching Algorithm

```typescript
interface MatchCandidate {
  transaction: Transaction;
  plannedTransaction: PlannedTransaction | VirtualPlannedTransaction;
  confidence: number;  // 0-100
  reasons: string[];
}

async function findMatches(
  transaction: Transaction,
  plannedTransactions: (PlannedTransaction | VirtualPlannedTransaction)[]
): Promise<MatchCandidate[]> {
  const candidates: MatchCandidate[] = [];

  for (const planned of plannedTransactions) {
    if (!planned.autoMatchEnabled) continue;

    let confidence = 0;
    const reasons: string[] = [];

    // 1. Amount matching (40 points max)
    const amountDiff = Math.abs(transaction.amount - planned.amount);
    const tolerance = planned.matchTolerance || 0;

    if (amountDiff === 0) {
      confidence += 40;
      reasons.push('Exact amount match');
    } else if (amountDiff <= tolerance) {
      confidence += 30;
      reasons.push(`Amount within tolerance ($${amountDiff.toFixed(2)})`);
    } else if (amountDiff <= Math.abs(planned.amount) * 0.1) {
      confidence += 15;
      reasons.push('Amount within 10%');
    }

    // 2. Date proximity (30 points max)
    const daysDiff = Math.abs(getDaysBetween(transaction.date, planned.expectedDate));
    const windowDays = planned.matchWindowDays || 7;

    if (daysDiff === 0) {
      confidence += 30;
      reasons.push('Exact date match');
    } else if (daysDiff <= 1) {
      confidence += 25;
      reasons.push('Within 1 day');
    } else if (daysDiff <= 3) {
      confidence += 20;
      reasons.push('Within 3 days');
    } else if (daysDiff <= windowDays) {
      confidence += 10;
      reasons.push(`Within ${windowDays} day window`);
    }

    // 3. Category match (15 points)
    if (transaction.categoryId && planned.categoryId &&
        transaction.categoryId === planned.categoryId) {
      confidence += 15;
      reasons.push('Category match');
    }

    // 4. Account match (15 points)
    if (transaction.accountId === planned.accountId) {
      confidence += 15;
      reasons.push('Account match');
    }

    // Only include if reasonable confidence
    if (confidence >= 50) {
      candidates.push({
        transaction,
        plannedTransaction: planned,
        confidence,
        reasons,
      });
    }
  }

  // Sort by confidence descending
  return candidates.sort((a, b) => b.confidence - a.confidence);
}
```

### Auto-Match Thresholds

- **≥95% confidence + skipReview=true**: Auto-match immediately, no review
- **≥95% confidence**: Auto-match, record in match history
- **70-94% confidence**: Queue for user review
- **<70% confidence**: No match suggested

---

## Planned Transfers

Planned transfers create **two linked planned transactions** (consistent with actual transfers):

1. **Outgoing**: EXPENSE from source account
2. **Incoming**: INCOME to destination account

### Transfer Template Structure

When creating a planned transfer template:
- User specifies source account, destination account, amount, and recurrence
- System creates a single template record with `isTransfer=true` and `transferToAccountId` set
- Virtual period generation creates **two** virtual planned transactions per occurrence

### Transfer Generation

```typescript
function generateTransferOccurrences(
  template: PlannedTransactionTemplate,
  rangeStart: Date,
  rangeEnd: Date
): VirtualPlannedTransaction[] {
  if (!template.isTransfer || !template.transferToAccountId) {
    return generateRegularOccurrences(template, rangeStart, rangeEnd);
  }

  const occurrences: VirtualPlannedTransaction[] = [];
  const dates = calculateOccurrenceDates(template, rangeStart, rangeEnd);

  for (const date of dates) {
    // Outgoing (from source account)
    occurrences.push({
      id: `virtual_${template.id}_${date.toISOString()}_out`,
      templateId: template.id,
      accountId: template.accountId,
      amount: -Math.abs(template.amount),  // Negative (expense)
      type: 'TRANSFER',
      name: `${template.name} → ${template.transferToAccount.name}`,
      expectedDate: date,
      isTransferPart: 'OUTGOING',
      linkedTransferId: `virtual_${template.id}_${date.toISOString()}_in`,
      // ... other fields
    });

    // Incoming (to destination account)
    occurrences.push({
      id: `virtual_${template.id}_${date.toISOString()}_in`,
      templateId: template.id,
      accountId: template.transferToAccountId,
      amount: Math.abs(template.amount),  // Positive (income)
      type: 'TRANSFER',
      name: `${template.name} ← ${template.account.name}`,
      expectedDate: date,
      isTransferPart: 'INCOMING',
      linkedTransferId: `virtual_${template.id}_${date.toISOString()}_out`,
      // ... other fields
    });
  }

  return occurrences;
}
```

### Transfer Matching

When an actual transfer is matched:
- Both the outgoing and incoming planned transactions are deleted
- The actual transfer (which also has two transaction records) serves as source of truth

---

## API Endpoints

### Planned Transaction Templates

```
POST   /api/v1/planned-transactions/templates
GET    /api/v1/planned-transactions/templates
GET    /api/v1/planned-transactions/templates/:id
PUT    /api/v1/planned-transactions/templates/:id
DELETE /api/v1/planned-transactions/templates/:id
GET    /api/v1/planned-transactions/templates/:id/occurrences?startDate&endDate
POST   /api/v1/planned-transactions/templates/:id/skip/:date  // Skip a specific occurrence
```

### Planned Transactions (One-time & Overrides)

```
POST   /api/v1/planned-transactions
GET    /api/v1/planned-transactions?startDate&endDate&accountId
GET    /api/v1/planned-transactions/:id
PUT    /api/v1/planned-transactions/:id
DELETE /api/v1/planned-transactions/:id
```

### Forecasting

```
GET    /api/v1/forecast?startDate&endDate&accountIds
GET    /api/v1/forecast/summary?days=90
GET    /api/v1/forecast/low-balance-warnings?threshold&days
```

### Transaction Matching

```
GET    /api/v1/matching/pending                    // Get pending match suggestions
POST   /api/v1/matching/confirm/:matchId           // Confirm a suggested match
POST   /api/v1/matching/dismiss/:matchId           // Dismiss a suggestion
POST   /api/v1/matching/manual                     // Manually link transaction to planned
GET    /api/v1/matching/history?startDate&endDate  // View match history
```

---

## UI Components

### Pages

1. **Planned Transactions Page** (`/planned`)
   - List of templates and one-time planned transactions
   - Create/edit planned transaction dialog
   - Calendar view showing expected transactions

2. **Forecast Page** (`/forecast`)
   - Balance projection chart
   - Daily/weekly/monthly breakdown
   - Low balance warnings
   - Preset buttons (30d, 90d, 6mo, 1yr) + custom date range

3. **Match Review Page** (`/matching/review`)
   - Queue of pending match suggestions
   - Confirm/dismiss actions
   - Manual matching interface

### Components

```
components/
  planned/
    PlannedTransactionList.tsx
    PlannedTransactionForm.tsx
    PlannedTransactionCard.tsx
    TemplateCard.tsx
    RecurrenceSelector.tsx
    MatchingConfigForm.tsx
  forecast/
    ForecastChart.tsx
    ForecastTable.tsx
    DailyForecastCard.tsx
    LowBalanceWarning.tsx
    ForecastPresets.tsx
    ImplicitSpendBreakdown.tsx
  matching/
    MatchReviewQueue.tsx
    MatchSuggestionCard.tsx
    ManualMatchDialog.tsx
    MatchHistoryTable.tsx
```

---

## Implementation Phases

### Phase 1: Data Model & Basic CRUD
- [ ] Create Prisma schema for PlannedTransactionTemplate, PlannedTransaction
- [ ] Add implicitSpendMode to Budget model
- [ ] Create migration
- [ ] Implement template CRUD service and API
- [ ] Implement one-time planned transaction CRUD
- [ ] Basic UI for creating/viewing planned transactions

### Phase 2: Virtual Period Generation
- [ ] Implement virtual planned transaction generation
- [ ] Port logic from budget virtual periods
- [ ] API for fetching occurrences in date range
- [ ] Merge virtual + override instances

### Phase 3: Forecasting Engine
- [ ] Implement forecast calculation service
- [ ] Implicit spend calculation based on budget mode
- [ ] Forecast API endpoints
- [ ] Forecast UI with charts and tables
- [ ] Preset range buttons + custom date picker

### Phase 4: Transaction Matching
- [ ] Implement matching algorithm
- [ ] Auto-match during transaction creation/sync
- [ ] Match review queue API and UI
- [ ] Manual matching interface
- [ ] Match history tracking

### Phase 5: Integration & Polish
- [ ] Integrate with bank sync (suggest matches for new transactions)
- [ ] Calendar view integration (show planned transactions)
- [ ] Low balance warnings
- [ ] Performance optimization
- [ ] Testing

---

## Success Metrics

- Forecast accuracy: Predicted balance within 10% of actual after 30 days
- Match accuracy: >90% of auto-matches are correct
- User engagement: >50% of users create at least 3 planned transactions
- Time saved: Reduce manual transaction review by 60%

---

## Resolved Design Questions

1. **Should planned transfers create two planned transactions (like actual transfers) or one?**
   - **Answer**: Create 2 transactions, one for each account (consistent with actual transfers)

2. **How to handle timezone edge cases for recurring transactions?**
   - **Answer**: Store UTC + user timezone preference, convert on display
   - Store `firstOccurrence` and `expectedDate` in UTC
   - Add `timezone` field to User model (e.g., "Pacific/Auckland")
   - All date calculations and display use user's timezone
   - Matching algorithm considers timezone when comparing dates

3. **Should we support "floating" day-of-month (e.g., "last day of month")?**
   - **Answer**: Yes, support common floating options:
     - `LAST_DAY` - Last day of month
     - `FIRST_WEEKDAY` - First Monday-Friday
     - `LAST_WEEKDAY` - Last Monday-Friday
     - `FIRST_MONDAY`, `FIRST_TUESDAY`, etc. - First specific weekday
     - `LAST_MONDAY`, `LAST_TUESDAY`, etc. - Last specific weekday
   - Add `dayOfMonthType` enum field to template model

4. **Integration with budget alerts when forecast shows overspending?**
   - **Answer**: Yes, integrate with budget alert system

---

**Created**: January 2026
**Author**: Claude + User collaboration
**Status**: Design approved, ready for Phase 1
