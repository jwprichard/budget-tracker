# Income vs Expense Budget Types Implementation

**Status**: ✅ COMPLETE - Fully Implemented
**Feature**: Differentiate between income and expense budgets
**Branch**: `feature/recurring-budgets`
**Estimated Effort**: 4-6 hours
**Actual Effort**: ~5 hours
**Date Implemented**: January 18, 2026

---

## Overview

Successfully implemented the ability to create both **income budgets** (track expected income) and **expense budgets** (track spending limits) with appropriate visual distinction and calculation logic.

## User Requirements

1. **Budget Types**:
   - **EXPENSE budgets**: Track spending limits against categories
   - **INCOME budgets**: Track expected income vs actual income received

2. **Calculation Logic**:
   - **Expense budgets**: `spent` = sum of EXPENSE transactions
   - **Income budgets**: `received` = sum of INCOME transactions (actual income received)
   - **Status thresholds**: Same for both (UNDER_BUDGET < 50%, EXCEEDED ≥ 100%)

3. **Calendar Balance Impact**:
   - **Expense budgets**: Subtracted from balance
   - **Income budgets**: Added to balance (show expected funds including future income)

4. **Visual Distinction**:
   - **Expense budgets**: Purple color (#9c27b0)
   - **Income budgets**: Green color (#4caf50)

5. **UI Control**: Radio buttons for selecting budget type

6. **Backward Compatibility**:
   - All existing budgets default to EXPENSE type
   - New budgets default to EXPENSE type

---

## Implementation Summary

### Database Changes

**Migration**: `20260117212842_add_budget_type`

Added `BudgetType` enum:
```sql
CREATE TYPE "BudgetType" AS ENUM ('INCOME', 'EXPENSE');
```

Added `type` field to tables:
- `budgets.type` - Default: `EXPENSE`
- `budget_templates.type` - Default: `EXPENSE`

### Backend Changes

**Files Modified**:
1. `backend/prisma/schema.prisma` - Added BudgetType enum and type fields
2. `backend/src/types/budget.types.ts` - Added BudgetType type definition
3. `backend/src/schemas/budget.schema.ts` - Added budgetTypeSchema validation
4. `backend/src/schemas/budgetTemplate.schema.ts` - Added type validation and firstStartDate field
5. `backend/src/services/budget.service.ts` - Modified calculateSpentAmount() for dynamic transaction types
6. `backend/src/services/budgetTemplate.service.ts` - Template creation, enrichment, and date regeneration

**Key Logic Changes**:

1. **Dynamic Transaction Type Querying** (`budget.service.ts:385-402`):
   ```typescript
   const transactionType = budget.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
   const total = result._sum.amount?.toNumber() || 0;
   return budget.type === 'INCOME' ? total : Math.abs(total);
   ```

2. **Template Type Enrichment** (`budgetTemplate.service.ts:573`):
   ```typescript
   type: template.type, // Include budget type in API response
   ```

3. **Budget Regeneration on Date Changes** (`budgetTemplate.service.ts:188-231`):
   - Detects when firstStartDate or interval changes
   - Deletes future non-customized budget instances
   - Regenerates 12 periods with new calculated dates

### Frontend Changes

**Files Modified**:
1. `frontend/src/types/budget.types.ts` - Added BudgetType and updated DTOs
2. `frontend/src/components/budgets/BudgetForm.tsx` - Radio button selector for type
3. `frontend/src/components/budgets/BudgetCard.tsx` - Color-coded borders and type chips
4. `frontend/src/components/budgets/TemplateCard.tsx` - Visual distinction for templates
5. `frontend/src/components/budgets/TemplateEditDialog.tsx` - Read-only type display and start date editor
6. `frontend/src/components/analytics/CalendarView.tsx` - Updated balance calculations and colors

**Visual Enhancements**:
- Color-coded left border (4px) on budget and template cards
- Type chip badges with matching background colors
- Calendar legend explaining both budget types
- Dynamic labels: "Received" for income, "Spent" for expense
- Budget amount prefix on calendar: `+` for income, `-` for expense

**Calendar Balance Formula**:
```typescript
budgets.forEach((budget) => {
  if (budget.type === 'INCOME') {
    cumulativeBudgetAmount -= budget.amount; // Add to balance
  } else {
    cumulativeBudgetAmount += budget.amount; // Subtract from balance
  }
});
const adjustedBalance = balance.balance - cumulativeBudgetAmount;
```

---

## Commits

1. **40df0d9** - `[Feature] Add income vs expense budget types`
   - Core implementation of budget type differentiation
   - 12 files changed, 191 insertions(+), 28 deletions(-)

2. **1de4fdc** - `[Fix] Include budget type in template API response`
   - Fixed missing type field in enrichTemplateWithStats
   - 1 file changed, 1 insertion(+)

3. **01cc064** - `[Feature] Regenerate budget dates when template start date changes`
   - Added firstStartDate editing to templates
   - Automatic budget regeneration when dates/intervals change
   - 4 files changed, 57 insertions(+), 5 deletions(-)

---

## Issues Fixed During Implementation

1. **Missing type field in API responses**
   - Problem: Backend was storing type correctly but not returning it in API
   - Solution: Added `type: budget.type` to enrichBudgetWithStatus and enrichTemplateWithStats

2. **RadioGroup disabled prop error**
   - Problem: TypeScript error - RadioGroup doesn't support disabled prop
   - Solution: Moved disabled prop to individual Radio controls

3. **Template type not displaying**
   - Problem: enrichTemplateWithStats wasn't including type field
   - Solution: Added type field to template response object

4. **Missing template start date editor**
   - Problem: No UI to edit template's firstStartDate
   - Solution: Added DatePicker field and backend support

5. **Budget dates not updating when template changed**
   - Problem: Changing template start date didn't update existing budget instances
   - Solution: Implemented regeneration logic that deletes and recreates future budgets

---

## Additional Features Added

Beyond the original scope:

1. **Template Start Date Editing**
   - Can now edit the firstStartDate of a budget template
   - Backend schema and validation updated

2. **Automatic Budget Regeneration**
   - When template start date or interval changes
   - Deletes future non-customized budget instances
   - Regenerates 12 periods with correct dates
   - Preserves past/current budgets and customized instances

3. **Interval Field Updates**
   - Template interval can now be updated (was missing)
   - Triggers budget regeneration when changed

---

## Testing

### Manual Testing Completed

✅ **Create Expense Budget**
- Created one-time expense budget for $500 Groceries
- Purple color displayed correctly
- "Spent" label showing
- Budget subtracted from calendar balance

✅ **Create Income Budget**
- Created recurring income budget for $2540.26 Salary (fortnightly)
- Green color displayed correctly
- "Received" label showing
- Budget added to calendar balance
- 12 budget instances created

✅ **Calendar Balance Calculation**
- Mixed income and expense budgets display correctly
- Balance shows: actual - expenses + income
- Legend explains both colors

✅ **Recurring Income Budget**
- Created fortnightly recurring income budget
- All instances show green color
- Type inherited from template

✅ **Template Editing**
- Budget type displays correctly (read-only)
- Can edit start date
- Budget instances regenerate with new dates
- Non-customized future budgets updated

✅ **Backward Compatibility**
- Existing budgets default to EXPENSE
- Purple color on existing budgets
- No breaking changes

---

## Success Metrics

All planned features successfully implemented:

- ✅ Can create EXPENSE budgets (spending limit)
- ✅ Can create INCOME budgets (expected income)
- ✅ EXPENSE budgets track EXPENSE transactions
- ✅ INCOME budgets track INCOME transactions
- ✅ Calendar subtracts EXPENSE budgets from balance
- ✅ Calendar adds INCOME budgets to balance
- ✅ Visual distinction: green for INCOME, purple for EXPENSE
- ✅ Type selector in budget form (radio buttons)
- ✅ All existing budgets default to EXPENSE
- ✅ New budgets default to EXPENSE
- ✅ Status thresholds work correctly for both types
- ✅ Budget cards show type badge with color
- ✅ Template cards show type badge with color
- ✅ Calendar legend explains both colors
- ✅ Dynamic labels ("Received" vs "Spent")
- ✅ Template start date can be edited
- ✅ Budget dates regenerate when template changes

---

## Migration Notes

### Database Migration
- Enum creation: `BudgetType` with INCOME | EXPENSE
- Column addition: `type` column with default 'EXPENSE'
- Backfill: All existing records automatically set to 'EXPENSE'

### API Compatibility
- `type` field optional in create requests (defaults to 'EXPENSE')
- Responses include `type` field
- No breaking changes to existing API contracts

### Frontend Rollout
- Type selector visible for all new budget creation
- Existing budgets display with EXPENSE type
- Color coding applied retroactively based on type

---

## Known Limitations

None identified. Feature is fully functional.

---

## Future Enhancements (Not in Scope)

Potential improvements for future consideration:

1. **Different status thresholds for income vs expense**
   - Currently use same thresholds (50%, 80%, 100%)
   - Could customize for each type

2. **Income budget forecast trends**
   - Show trend of income received vs expected over time
   - Predict future income based on historical data

3. **Budget type conversion**
   - Allow changing budget type after creation
   - Would require careful handling of transactions

---

## Notes

- Status thresholds (UNDER_BUDGET, ON_TRACK, WARNING, EXCEEDED) work semantically for both types
- For INCOME budgets: UNDER_BUDGET means you haven't received enough income (appropriate)
- For EXPENSE budgets: UNDER_BUDGET means you haven't spent much (appropriate)
- Template type cannot be changed after creation (prevents confusion with generated instances)
- Individual budget type can be changed if needed (will mark as customized)
- Budget regeneration only affects future non-customized budgets
- Past and current budgets are preserved
- Customized budgets are never overwritten by regeneration

---

**Implementation completed successfully on January 18, 2026**
