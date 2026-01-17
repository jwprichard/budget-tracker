# Custom Budget Periods - Implementation Plan

**Status**: Planning Phase
**Feature**: Replace calendar-based periods with custom start dates and intervals
**Type**: Major Refactoring (Breaking Change)
**Estimated Effort**: 16-20 hours (3-4 days)
**Date Created**: January 17, 2026

---

## Overview

Complete overhaul of the budget period system to support custom start dates and flexible intervals instead of fixed calendar periods.

### Current System (To Be Replaced)

**Period Types**: MONTHLY, WEEKLY, QUARTERLY, ANNUALLY
**Identification**: `periodYear` + `periodNumber` (e.g., 2026, period 1)
**Boundaries**: Fixed to calendar (Jan 1-31, Mon-Sun weeks, Q1-Q4, etc.)
**Limitation**: Cannot align budgets to personal pay cycles, billing dates, or custom schedules

### New System

**Period Types**: DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, ANNUALLY
**Identification**: `startDate` + calculated end date
**Boundaries**: Custom - user picks when budget period begins
**Flexibility**: Support any interval (every 2 weeks, every 3 months, etc.)

---

## Key Requirements

### 1. Period Types (5 total)

| Type | Base Duration | Example (Start: Jan 15, Interval: 2) |
|------|---------------|--------------------------------------|
| DAILY | 1 day | Every 2 days: Jan 15-16, Jan 17-18, Jan 19-20 |
| WEEKLY | 7 days | Every 2 weeks: Jan 15-28, Jan 29-Feb 11 |
| FORTNIGHTLY | 14 days | Every 2 fortnights: Jan 15-Feb 11, Feb 12-Mar 10 |
| MONTHLY | 1 calendar month | Every 2 months: Jan 15-Mar 14, Mar 15-May 14 |
| ANNUALLY | 1 calendar year | Every 2 years: Jan 15, 2026-2028, 2028-2030 |

### 2. One-Time Budgets

- **No period type or interval** - just a start date
- Budget runs indefinitely until spent
- Status becomes "Complete" when `spent >= amount`
- Display: "Starting [date]" (e.g., "Starting Jan 15, 2026")

### 3. Recurring Budgets

- **Start date** - when the first period begins
- **Period type** - DAILY/WEEKLY/FORTNIGHTLY/MONTHLY/ANNUALLY
- **Interval** - multiplier (1 = every period, 2 = every 2 periods, etc.)
- **Optional end date** - when to stop generating new instances
- Generates budget instances with calculated date ranges
- Display: "Starting [date]" for each instance

### 4. Period Boundary Calculations

**DAILY/WEEKLY/FORTNIGHTLY:**
- Simple day arithmetic
- Start date + (base days × interval) = end date (exclusive)
- Example: Weekly with interval 2 = start + 14 days

**MONTHLY:**
- Advance by `interval` calendar months
- Preserve day-of-month when possible
- Reset to original day when month allows
- Example: Start Jan 31 → Feb 28 (Feb has no 31st) → Mar 31 (reset to 31st)

**ANNUALLY:**
- Advance by `interval` calendar years
- Same month and day each year
- Handle Feb 29 leap year edge case

### 5. Breaking Changes

- ❌ Remove `periodYear` and `periodNumber` fields
- ❌ Remove QUARTERLY period type
- ❌ Delete all existing budgets (migration wipes budget tables)
- ✅ Add `startDate`, `interval`, and `endDate` fields
- ✅ Add DAILY and FORTNIGHTLY period types

---

## Database Schema Changes

### Phase 1.1: Update Budget Model

**File**: `backend/prisma/schema.prisma`

```prisma
model Budget {
  id              String      @id @default(uuid())
  userId          String

  // Budget configuration
  categoryId      String
  amount          Decimal     @db.Decimal(15, 2)
  includeSubcategories Boolean  @default(false)

  // NEW: Period configuration (replaces periodYear/periodNumber)
  periodType      BudgetPeriod?  // NULL for one-time budgets
  interval        Int?            // NULL for one-time budgets (e.g., 1 = every period, 2 = every 2 periods)
  startDate       DateTime        // When this budget period starts
  endDate         DateTime?       // Calculated end date (NULL for one-time budgets)

  // Template link (for recurring budgets)
  templateId      String?
  isCustomized    Boolean     @default(false)

  // Metadata
  name            String?
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  category        Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  template        BudgetTemplate? @relation("TemplateBudgets", fields: [templateId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([categoryId])
  @@index([templateId])
  @@index([startDate])
  @@map("budgets")
}

enum BudgetPeriod {
  DAILY
  WEEKLY
  FORTNIGHTLY
  MONTHLY
  ANNUALLY
}
```

**Changes:**
- ❌ Remove: `periodYear`, `periodNumber`
- ❌ Remove from enum: `QUARTERLY`
- ✅ Add: `startDate` (DateTime, required)
- ✅ Add: `endDate` (DateTime, nullable - NULL for one-time budgets)
- ✅ Add: `interval` (Int, nullable - NULL for one-time budgets)
- ✅ Make `periodType` nullable (NULL for one-time budgets)
- ✅ Add to enum: `DAILY`, `FORTNIGHTLY`

### Phase 1.2: Update BudgetTemplate Model

**File**: `backend/prisma/schema.prisma`

```prisma
model BudgetTemplate {
  id              String      @id @default(uuid())
  userId          String
  categoryId      String

  // Template configuration
  amount          Decimal     @db.Decimal(15, 2)
  periodType      BudgetPeriod  // Required for templates
  interval        Int         @default(1)  // How often (1 = every period, 2 = every 2 periods)
  includeSubcategories Boolean  @default(false)

  // Recurrence settings (replaces startYear/startNumber)
  firstStartDate  DateTime    // When the first budget instance starts
  endDate         DateTime?   // Optional end date (null = never ending)

  // Status
  isActive        Boolean     @default(true)

  // Metadata
  name            String      // Template name (required for templates)
  notes           String?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  category        Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  budgets         Budget[]    @relation("TemplateBudgets")

  @@unique([userId, name])
  @@index([userId])
  @@index([categoryId])
  @@index([isActive])
  @@map("budget_templates")
}
```

**Changes:**
- ❌ Remove: `startYear`, `startNumber`
- ✅ Add: `firstStartDate` (DateTime) - when the first budget instance starts
- ✅ Add: `interval` (Int, default 1) - frequency multiplier
- `periodType` remains required (templates always have periods)
- `endDate` remains optional

### Phase 1.3: Migration Strategy

**BREAKING CHANGE - Data Loss Warning**

```sql
-- This migration DELETES all existing budgets and templates

-- Step 1: Drop existing budgets and templates (cascade handles related data)
TRUNCATE TABLE budgets CASCADE;
TRUNCATE TABLE budget_templates CASCADE;

-- Step 2: Alter Budget table
ALTER TABLE budgets
  DROP COLUMN period_year,
  DROP COLUMN period_number,
  ADD COLUMN start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN end_date TIMESTAMP,
  ADD COLUMN interval INTEGER,
  ALTER COLUMN period_type DROP NOT NULL;  -- Make nullable for one-time budgets

-- Step 3: Alter BudgetTemplate table
ALTER TABLE budget_templates
  DROP COLUMN start_year,
  DROP COLUMN start_number,
  ADD COLUMN first_start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN interval INTEGER NOT NULL DEFAULT 1;

-- Step 4: Update enum (drop and recreate)
ALTER TYPE "BudgetPeriod" RENAME TO "BudgetPeriod_old";
CREATE TYPE "BudgetPeriod" AS ENUM ('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'ANNUALLY');
ALTER TABLE budgets ALTER COLUMN period_type TYPE "BudgetPeriod" USING NULL;
ALTER TABLE budget_templates ALTER COLUMN period_type TYPE "BudgetPeriod" USING period_type::text::"BudgetPeriod";
DROP TYPE "BudgetPeriod_old";

-- Step 5: Add indexes
CREATE INDEX idx_budgets_start_date ON budgets(start_date);
```

**User Communication:**
- Display warning before running migration
- "⚠️ This update will delete all existing budgets. Please export or note your current budgets before proceeding."
- Migration name: `YYYYMMDD_budget_custom_periods_breaking_change`

---

## Backend Implementation

### Phase 2.1: Update Type Definitions

**File**: `backend/src/types/budget.types.ts`

```typescript
export type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'ANNUALLY';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  includeSubcategories: boolean;

  // Period configuration (NULL for one-time budgets)
  periodType: BudgetPeriod | null;
  interval: number | null;
  startDate: string; // ISO datetime
  endDate: string | null; // ISO datetime, NULL for one-time budgets

  // Template link
  templateId: string | null;
  isCustomized: boolean;

  // Metadata
  name: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithStatus extends Budget {
  categoryName: string;
  categoryColor: string;

  // Calculated fields
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  isComplete: boolean; // NEW: true when one-time budget is fully spent
}

export interface BudgetTemplate {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  periodType: BudgetPeriod;
  interval: number;
  includeSubcategories: boolean;
  firstStartDate: string; // ISO datetime
  endDate: string | null;
  isActive: boolean;
  name: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  categoryId: string;
  amount: number;
  includeSubcategories?: boolean;
  name?: string;
  notes?: string;

  // For one-time budgets: startDate only
  // For recurring budgets: all three
  startDate: string; // ISO datetime
  periodType?: BudgetPeriod; // NULL = one-time budget
  interval?: number; // NULL = one-time budget
}

export interface CreateBudgetTemplateDto {
  categoryId: string;
  amount: number;
  periodType: BudgetPeriod;
  interval: number; // Default 1
  includeSubcategories?: boolean;
  firstStartDate: string; // ISO datetime
  endDate?: string; // ISO datetime, optional
  name: string; // Required
  notes?: string;
}
```

### Phase 2.2: Period Calculation Utilities

**File**: `backend/src/utils/periodCalculations.ts` (NEW)

```typescript
import { BudgetPeriod } from '../types/budget.types';
import { addDays, addWeeks, addMonths, addYears, setDate, getDaysInMonth } from 'date-fns';

/**
 * Calculate end date for a budget period
 * @param startDate - Period start date
 * @param periodType - Type of period
 * @param interval - Multiplier (e.g., 2 = every 2 periods)
 * @returns End date (exclusive) or null for one-time budgets
 */
export function calculatePeriodEndDate(
  startDate: Date,
  periodType: BudgetPeriod | null,
  interval: number | null
): Date | null {
  if (!periodType || !interval) {
    // One-time budget - no end date
    return null;
  }

  switch (periodType) {
    case 'DAILY':
      return addDays(startDate, interval);

    case 'WEEKLY':
      return addWeeks(startDate, interval);

    case 'FORTNIGHTLY':
      return addWeeks(startDate, interval * 2);

    case 'MONTHLY':
      return calculateMonthlyEndDate(startDate, interval);

    case 'ANNUALLY':
      return addYears(startDate, interval);

    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

/**
 * Calculate end date for monthly periods with day-reset logic
 * Preserves original day-of-month when possible
 */
function calculateMonthlyEndDate(startDate: Date, intervalMonths: number): Date {
  const originalDay = startDate.getDate();

  // Add months
  let endDate = addMonths(startDate, intervalMonths);

  // Try to reset to original day if current month allows
  const daysInEndMonth = getDaysInMonth(endDate);
  const targetDay = Math.min(originalDay, daysInEndMonth);

  endDate = setDate(endDate, targetDay);

  return endDate;
}

/**
 * Calculate the next period start date from a given date
 * Used for generating recurring budget instances
 */
export function calculateNextPeriodStart(
  currentStart: Date,
  periodType: BudgetPeriod,
  interval: number
): Date {
  // For most periods, next start = current end
  const endDate = calculatePeriodEndDate(currentStart, periodType, interval);
  return endDate!;
}

/**
 * Check if a date falls within a budget period
 */
export function isDateInBudgetPeriod(
  date: Date,
  budgetStart: Date,
  budgetEnd: Date | null
): boolean {
  if (!budgetEnd) {
    // One-time budget - always active from start date onward
    return date >= budgetStart;
  }

  return date >= budgetStart && date < budgetEnd;
}

/**
 * Format period display string
 */
export function formatBudgetPeriod(
  startDate: Date,
  periodType: BudgetPeriod | null
): string {
  const dateStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (!periodType) {
    return `Starting ${dateStr}`;
  }

  return `Starting ${dateStr}`;
}
```

### Phase 2.3: Update BudgetService

**File**: `backend/src/services/budget.service.ts`

**Key Changes:**

1. **createBudget** - Calculate endDate from startDate + periodType + interval
2. **getBudgetsWithStatus** - Filter by date range instead of periodYear/periodNumber
3. **enrichBudgetWithStatus** - Add `isComplete` flag for one-time budgets
4. **calculateSpentAmount** - Use startDate/endDate instead of period boundaries
5. **Query methods** - Update to filter by date ranges

Example implementation:

```typescript
async createBudget(data: CreateBudgetDto, userId: string): Promise<Budget> {
  // Validate category ownership
  const category = await this.prisma.category.findFirst({
    where: {
      id: data.categoryId,
      OR: [{ userId: null }, { userId }],
    },
  });

  if (!category) {
    throw new AppError('Category not found or access denied', 404);
  }

  // Calculate end date
  const startDate = new Date(data.startDate);
  const endDate = calculatePeriodEndDate(
    startDate,
    data.periodType || null,
    data.interval || null
  );

  // Create budget
  return this.prisma.budget.create({
    data: {
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      includeSubcategories: data.includeSubcategories || false,
      periodType: data.periodType || null,
      interval: data.interval || null,
      startDate,
      endDate,
      name: data.name || null,
      notes: data.notes || null,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });
}
```

### Phase 2.4: Update BudgetTemplateService

**File**: `backend/src/services/budgetTemplate.service.ts`

**Key Changes:**

1. **createTemplate** - Store firstStartDate instead of startYear/startNumber
2. **generateBudgetsForTemplate** - Calculate successive start dates
3. **maintainTemplates** - Check if new periods need generation based on dates

Example:

```typescript
async generateBudgetsForTemplate(
  template: BudgetTemplate,
  count: number,
  tx: any
): Promise<Budget[]> {
  // Find last generated budget
  const lastBudget = await tx.budget.findFirst({
    where: { templateId: template.id },
    orderBy: { startDate: 'desc' },
  });

  // Determine starting point
  let currentStart: Date;
  if (lastBudget) {
    // Next period starts when last one ends
    currentStart = new Date(lastBudget.endDate);
  } else {
    // First budget
    currentStart = new Date(template.firstStartDate);
  }

  const budgetsToCreate: any[] = [];

  for (let i = 0; i < count; i++) {
    // Check if we've exceeded template end date
    if (template.endDate && currentStart >= new Date(template.endDate)) {
      break;
    }

    // Calculate period end
    const endDate = calculatePeriodEndDate(
      currentStart,
      template.periodType,
      template.interval
    );

    // Check for duplicates
    const existing = await tx.budget.findFirst({
      where: {
        userId: template.userId,
        categoryId: template.categoryId,
        startDate: currentStart,
      },
    });

    if (!existing) {
      budgetsToCreate.push({
        userId: template.userId,
        categoryId: template.categoryId,
        amount: template.amount,
        periodType: template.periodType,
        interval: template.interval,
        startDate: currentStart,
        endDate,
        includeSubcategories: template.includeSubcategories,
        name: template.name,
        notes: template.notes,
        templateId: template.id,
        isCustomized: false,
      });
    }

    // Move to next period
    currentStart = calculateNextPeriodStart(
      currentStart,
      template.periodType,
      template.interval
    );
  }

  if (budgetsToCreate.length > 0) {
    await tx.budget.createMany({
      data: budgetsToCreate,
      skipDuplicates: true,
    });
  }

  return budgetsToCreate;
}
```

### Phase 2.5: Update Validation Schemas

**File**: `backend/src/schemas/budget.schema.ts`

```typescript
export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive().max(1000000000),
  includeSubcategories: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),

  // Required
  startDate: z.string().datetime(),

  // Optional - both must be present or both absent (recurring vs one-time)
  periodType: budgetPeriodSchema.optional(),
  interval: z.number().int().min(1).max(365).optional(),
}).refine(
  (data) => {
    // Both periodType and interval must be present, or both absent
    const hasPeriod = !!data.periodType;
    const hasInterval = !!data.interval;
    return hasPeriod === hasInterval;
  },
  {
    message: 'periodType and interval must both be provided for recurring budgets, or both omitted for one-time budgets',
  }
);

export const budgetPeriodSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'FORTNIGHTLY',
  'MONTHLY',
  'ANNUALLY',
]);
```

### Phase 2.6: Update API Endpoints

**No changes to endpoint URLs**, but update query parameters:

```typescript
// OLD: GET /api/v1/budgets?periodType=MONTHLY&periodYear=2026&periodNumber=1
// NEW: GET /api/v1/budgets?startDate=2026-01-01&endDate=2026-01-31

// Add new query params to BudgetQueryDto
export interface BudgetQueryDto {
  categoryId?: string;
  templateId?: string;

  // NEW: Filter by date range
  startDate?: string; // ISO datetime
  endDate?: string;   // ISO datetime

  // NEW: Filter one-time vs recurring
  isRecurring?: boolean; // true = has periodType, false = no periodType
}
```

---

## Frontend Implementation

### Phase 3.1: Update Type Definitions

**File**: `frontend/src/types/budget.types.ts`

```typescript
export type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'ANNUALLY';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  includeSubcategories: boolean;

  // Period configuration
  periodType: BudgetPeriod | null;
  interval: number | null;
  startDate: string;
  endDate: string | null;

  // Template link
  templateId: string | null;
  isCustomized: boolean;

  // Metadata
  name: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithStatus extends Budget {
  categoryName: string;
  categoryColor: string;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  isComplete: boolean; // NEW
}

export interface CreateBudgetDto {
  categoryId: string;
  amount: number;
  includeSubcategories?: boolean;
  name?: string;
  notes?: string;
  startDate: string;
  periodType?: BudgetPeriod;
  interval?: number;
}

export interface CreateBudgetTemplateDto {
  categoryId: string;
  amount: number;
  periodType: BudgetPeriod;
  interval: number;
  includeSubcategories?: boolean;
  firstStartDate: string;
  endDate?: string;
  name: string;
  notes?: string;
}
```

### Phase 3.2: Update BudgetForm Component

**File**: `frontend/src/components/budgets/BudgetForm.tsx`

**Major Changes:**

1. **Remove**: Period selector (year/month/quarter dropdowns)
2. **Add**: Start date picker (always visible)
3. **Add**: Period type selector (only for recurring)
4. **Add**: Interval input (only for recurring)
5. **Update**: Recurring toggle logic

```tsx
// State variables
const [startDate, setStartDate] = useState<Date>(new Date());
const [periodType, setPeriodType] = useState<BudgetPeriod>('MONTHLY');
const [interval, setInterval] = useState<number>(1);
const [isRecurring, setIsRecurring] = useState<boolean>(false);

// UI Layout
<Grid container spacing={2}>
  {/* Start Date (always visible) */}
  <Grid item xs={12}>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label="Start Date"
        value={startDate}
        onChange={(newValue: Date | null) => setStartDate(newValue || new Date())}
        slotProps={{
          textField: {
            fullWidth: true,
            required: true,
            helperText: isRecurring
              ? 'When the first budget period begins'
              : 'When this budget begins'
          }
        }}
      />
    </LocalizationProvider>
  </Grid>

  {/* Recurring Toggle */}
  <Grid item xs={12}>
    <FormControlLabel
      control={
        <Checkbox
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
        />
      }
      label="Make this recurring"
    />
  </Grid>

  {/* Period Type (only for recurring) */}
  {isRecurring && (
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Period Type</InputLabel>
        <Select
          value={periodType}
          label="Period Type"
          onChange={(e) => setPeriodType(e.target.value as BudgetPeriod)}
        >
          <MenuItem value="DAILY">Daily</MenuItem>
          <MenuItem value="WEEKLY">Weekly</MenuItem>
          <MenuItem value="FORTNIGHTLY">Fortnightly</MenuItem>
          <MenuItem value="MONTHLY">Monthly</MenuItem>
          <MenuItem value="ANNUALLY">Annually</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  )}

  {/* Interval (only for recurring) */}
  {isRecurring && (
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Repeat Every"
        type="number"
        value={interval}
        onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
        required
        inputProps={{ min: 1, max: 365 }}
        helperText={`Budget repeats every ${interval} ${getPeriodLabel(periodType, interval)}`}
      />
    </Grid>
  )}

  {/* Amount, Category, etc. remain the same */}
</Grid>
```

### Phase 3.3: Update BudgetCard Component

**File**: `frontend/src/components/budgets/BudgetCard.tsx`

**Display Changes:**

```tsx
// Period display (remove year/month/quarter)
<Typography variant="body2" color="text.secondary">
  Starting {new Date(budget.startDate).toLocaleDateString()}
</Typography>

// For recurring budgets, show interval info
{budget.periodType && (
  <Chip
    label={`Every ${budget.interval} ${getPeriodLabel(budget.periodType, budget.interval)}`}
    size="small"
    variant="outlined"
  />
)}

// For one-time budgets, show "Complete" badge if fully spent
{!budget.periodType && budget.isComplete && (
  <Chip label="Complete" color="success" size="small" />
)}
```

### Phase 3.4: Update BudgetList Component

**File**: `frontend/src/components/budgets/BudgetList.tsx`

**Filtering Changes:**

```tsx
// Remove period type filter dropdown (MONTHLY/WEEKLY/etc.)
// Add date range filter
<Grid item xs={12} sm={6}>
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <DatePicker
      label="Filter by Start Date"
      value={filterStartDate}
      onChange={setFilterStartDate}
      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
    />
  </LocalizationProvider>
</Grid>

// Add budget type filter
<Grid item xs={12} sm={6}>
  <FormControl fullWidth size="small">
    <InputLabel>Budget Type</InputLabel>
    <Select value={budgetTypeFilter} onChange={...}>
      <MenuItem value="ALL">All Budgets</MenuItem>
      <MenuItem value="RECURRING">Recurring Only</MenuItem>
      <MenuItem value="ONE_TIME">One-Time Only</MenuItem>
    </Select>
  </FormControl>
</Grid>
```

**Sorting Changes:**

```tsx
// Remove period-based sort
// Update to date-based sort
const sortedBudgets = [...budgets].sort((a, b) => {
  switch (sortBy) {
    case 'date':
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    // ... other sort options
  }
});
```

### Phase 3.5: Update TemplateCard Component

**File**: `frontend/src/components/budgets/TemplateCard.tsx`

**Display Changes:**

```tsx
// Show interval information
<Chip
  label={`Every ${template.interval} ${getPeriodLabel(template.periodType, template.interval)}`}
  variant="outlined"
  size="small"
/>

// Show first start date
<Typography variant="body2" color="text.secondary">
  First budget: {new Date(template.firstStartDate).toLocaleDateString()}
</Typography>

// Budget instances list - show start dates
{budgets.map((budget) => (
  <ListItemText
    primary={`Starting ${new Date(budget.startDate).toLocaleDateString()}`}
    secondary={`${formatCurrency(budget.amount)} ${budget.isCustomized ? '(Customized)' : ''}`}
  />
))}
```

### Phase 3.6: Utility Functions

**File**: `frontend/src/utils/budgetHelpers.ts` (NEW)

```typescript
import { BudgetPeriod } from '../types/budget.types';

/**
 * Get human-readable label for period type
 */
export function getPeriodLabel(periodType: BudgetPeriod, interval: number): string {
  const labels = {
    DAILY: interval === 1 ? 'day' : 'days',
    WEEKLY: interval === 1 ? 'week' : 'weeks',
    FORTNIGHTLY: interval === 1 ? 'fortnight' : 'fortnights',
    MONTHLY: interval === 1 ? 'month' : 'months',
    ANNUALLY: interval === 1 ? 'year' : 'years',
  };

  return labels[periodType];
}

/**
 * Format budget period display
 */
export function formatBudgetPeriod(
  startDate: string,
  endDate: string | null,
  periodType: BudgetPeriod | null
): string {
  const start = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (!periodType) {
    return `Starting ${start}`;
  }

  return `Starting ${start}`;
}

/**
 * Check if one-time budget is complete
 */
export function isBudgetComplete(budget: BudgetWithStatus): boolean {
  return !budget.periodType && budget.percentage >= 100;
}
```

---

## Testing Strategy

### Phase 4.1: Backend Unit Tests

**File**: `backend/src/utils/periodCalculations.test.ts`

Test cases:
1. ✅ Calculate daily period end dates
2. ✅ Calculate weekly period end dates
3. ✅ Calculate fortnightly period end dates
4. ✅ Calculate monthly period end dates (with day reset logic)
5. ✅ Calculate annual period end dates
6. ✅ Handle leap years (Feb 29)
7. ✅ Handle month-end edge cases (Jan 31 → Feb)
8. ✅ Test various intervals (1, 2, 3, 7, 12, etc.)

### Phase 4.2: API Integration Tests

Test scenarios:
1. Create one-time budget
2. Create recurring budget (all period types)
3. Query budgets by date range
4. Create template and generate instances
5. Update budget (should recalculate endDate if startDate/interval changes)
6. Filter budgets by isRecurring

### Phase 4.3: Frontend Component Tests

Test components:
1. BudgetForm - one-time vs recurring logic
2. BudgetCard - display start date correctly
3. TemplateCard - show interval information
4. Period calculation utilities

### Phase 4.4: End-to-End Manual Testing

**Test Plan Document**: See separate test plan file

Scenarios:
1. Create one-time budget, spend money, verify "Complete" status
2. Create daily recurring budget (interval 1)
3. Create weekly recurring budget (interval 2 = bi-weekly)
4. Create fortnightly recurring budget
5. Create monthly recurring budget starting on 31st (edge case)
6. Create annual recurring budget
7. Edit template interval, verify instances update
8. Delete template, verify cleanup
9. Filter and sort by date ranges
10. Verify calendar view uses new date boundaries

---

## Migration Plan

### Pre-Migration Checklist

- [ ] Create database backup
- [ ] Export current budget data (optional - for user reference)
- [ ] Test migration on development environment
- [ ] Update API documentation
- [ ] Prepare user communication

### Migration Steps

```bash
# 1. Create migration file
npx prisma migrate dev --name budget_custom_periods_breaking_change --create-only

# 2. Review generated SQL (should match Phase 1.3)

# 3. Apply migration
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Verify schema
npx prisma db pull
```

### Post-Migration Verification

- [ ] Verify budget table structure
- [ ] Verify budget_template table structure
- [ ] Verify enum values (DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, ANNUALLY)
- [ ] Verify indexes exist
- [ ] Run seed script to create test data
- [ ] Test API endpoints manually
- [ ] Test frontend forms

### Rollback Plan

If migration fails or critical issues discovered:

```bash
# 1. Restore database from backup
pg_restore -U budget_user -d budget_tracker backup.sql

# 2. Revert code changes
git revert <migration-commit-hash>

# 3. Rebuild containers
docker compose down && docker compose up -d --build
```

---

## Implementation Phases

### Phase 1: Database & Backend (8-10 hours)

1. ✅ Update Prisma schema (1 hour)
2. ✅ Create and test migration (1 hour)
3. ✅ Create period calculation utilities (2 hours)
4. ✅ Update BudgetService (2 hours)
5. ✅ Update BudgetTemplateService (2 hours)
6. ✅ Update validation schemas (1 hour)
7. ✅ Write backend tests (1 hour)

### Phase 2: Frontend (6-8 hours)

1. ✅ Update type definitions (0.5 hours)
2. ✅ Create utility functions (1 hour)
3. ✅ Update BudgetForm component (2 hours)
4. ✅ Update BudgetCard component (1 hour)
5. ✅ Update BudgetList component (1.5 hours)
6. ✅ Update TemplateCard component (1 hour)
7. ✅ Update TemplateEditDialog (0.5 hours)
8. ✅ Write frontend tests (0.5 hours)

### Phase 3: Testing & Documentation (2 hours)

1. ✅ Manual end-to-end testing (1 hour)
2. ✅ Update API documentation (0.5 hours)
3. ✅ Update user documentation (0.5 hours)

**Total Estimated Effort**: 16-20 hours

---

## Success Criteria

Feature is complete when:

- ✅ All 5 period types work (DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, ANNUALLY)
- ✅ One-time budgets work (no period, runs until spent)
- ✅ Recurring budgets support custom intervals (1-365)
- ✅ Monthly budgets handle day-reset logic correctly
- ✅ Templates generate instances with correct date ranges
- ✅ UI displays "Starting [date]" format
- ✅ Filtering and sorting by date works
- ✅ Migration runs successfully (deletes old budgets)
- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ Docker containers build and run

---

## Known Risks & Mitigations

### Risk 1: Data Loss
**Risk**: Users lose all existing budgets
**Mitigation**:
- Clear warning message before migration
- Provide export functionality (future enhancement)
- Document in release notes

### Risk 2: Date Calculation Bugs
**Risk**: Edge cases in month-end calculations
**Mitigation**:
- Comprehensive unit tests
- Use date-fns library (well-tested)
- Manual testing of all edge cases

### Risk 3: Performance Issues
**Risk**: Date-based queries slower than indexed periodYear/periodNumber
**Mitigation**:
- Add index on startDate
- Consider adding computed endDate index
- Monitor query performance

### Risk 4: UI Confusion
**Risk**: Users confused by removal of period selector
**Mitigation**:
- Clear labels and help text
- Show calculated period info in real-time
- Provide examples in UI

---

## Future Enhancements (Out of Scope)

- Budget export/import functionality
- Recurring budget preview (show next 12 periods before creating)
- Budget analytics by custom date ranges
- Calendar view with custom period boundaries
- Budget templates for common pay schedules (bi-weekly paycheck, etc.)

---

**Plan Status**: Ready for Review
**Next Step**: Get approval, then begin Phase 1 implementation
**Questions/Concerns**: None at this time
