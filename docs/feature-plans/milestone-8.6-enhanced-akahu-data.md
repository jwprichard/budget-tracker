# Milestone 8.6 - Enhanced Akahu Data Display

**Status:** Planning
**Priority:** Medium
**Estimated Effort:** Small (2-4 hours)
**Dependencies:** Milestone 8.5 (Akahu Sync) ✅ Complete

## Overview

Enhance the display of data already available from Akahu API to provide more value to users without requiring additional API calls or schema changes.

## Goals

- Display available balance (especially useful for credit cards)
- Show merchant names prominently in transaction lists
- Add visual indicators for account status
- Prepare foundation for balance trend charts (future)

## Current State

### What We Have ✅
- Akahu account data with `balance.current` and `balance.available`
- Merchant names stored in `ExternalTransaction.merchant`
- Account status from Akahu stored in database
- Transaction balance history in `ExternalTransaction.balance`
- All data stored in `rawData` JSON field for reference

### What We're Missing ❌
- UI doesn't show available balance
- Merchant names buried in notes field
- No visual account status indicators
- Balance history not visualized

## Implementation Plan

### Phase 1: Available Balance Display (Quick Win)

**Backend:** No changes needed - data already available

**Frontend Changes:**

1. **Update AccountCard Component**
   - Location: `frontend/src/components/accounts/AccountCard.tsx`
   - Show both current and available balance
   - Format:
     ```
     Current: $1,234.56
     Available: $8,765.44  (for credit cards)
     ```

2. **Update Account Detail Page**
   - Location: `frontend/src/pages/AccountDetail.tsx`
   - Show available balance in header
   - Add helper text explaining difference

**Acceptance Criteria:**
- ✅ Credit card accounts show available credit
- ✅ Bank accounts show available vs current (pending transactions)
- ✅ Clear labeling to avoid confusion

---

### Phase 2: Merchant Display Enhancement (Quick Win)

**Backend:** No changes needed - data already in `Transaction.notes`

**Frontend Changes:**

1. **Update Transaction List/Table**
   - Location: `frontend/src/components/transactions/TransactionList.tsx`
   - Extract merchant from notes if present
   - Display merchant as:
     - Primary: Merchant name (if available)
     - Secondary: Original bank description

2. **Add Merchant Badge/Chip**
   - Show merchant name as a colored chip/badge
   - Fallback to description if no merchant

3. **Transaction Detail View**
   - Prominent merchant display
   - Show bank description separately

**Acceptance Criteria:**
- ✅ Merchant names clearly visible in transaction lists
- ✅ Fallback to description when no merchant
- ✅ Original bank description still accessible

---

### Phase 3: Account Status Indicators (Quick Win)

**Backend:**
- Add account status to API response
- Location: `backend/src/controllers/accountController.ts`

**Frontend Changes:**

1. **AccountCard Component**
   - Show badge for non-active accounts
   - Status colors:
     - ACTIVE: No badge (default)
     - CLOSED: Red badge
     - DORMANT: Orange badge
     - ERROR: Red badge with warning icon

2. **Account List Filtering**
   - Option to show/hide closed accounts
   - Warning when trying to sync closed account

**Acceptance Criteria:**
- ✅ Clear visual indicators for account status
- ✅ Users can filter by status
- ✅ Helpful messages for problematic accounts

---

### Phase 4: Balance Trend Foundation (Future Enhancement)

**Note:** This is a larger feature - document for future implementation

**Requirements:**
- Chart library selection (Recharts already in project)
- Historical balance data query optimization
- Date range selection UI
- Mobile-responsive chart design

**Defer to:** Future milestone (after categories implemented)

---

## Technical Considerations

### Data Already Available

All data is already captured and stored:
```typescript
// ExternalTransaction model
{
  merchant: string;
  category: string;
  balance: Decimal;
  rawData: Json; // Full Akahu response
}

// LinkedAccount includes account status
```

### No Schema Changes Required ✅

All data already exists in database. This is purely a UI enhancement.

### API Changes Required

Minimal - just expose additional fields in responses:
- Add `availableBalance` to account API responses
- Include account status in responses

---

## Implementation Order

**Recommended sequence:**

1. **Available Balance** (30 mins)
   - Simplest change
   - High value for credit card users
   - No new API calls needed

2. **Merchant Display** (1-2 hours)
   - Medium complexity
   - High visibility improvement
   - Requires parsing notes field

3. **Account Status** (1 hour)
   - Simple badge logic
   - Useful edge case handling
   - Requires small API change

4. **Balance Trends** (Future - 4+ hours)
   - More complex visualization
   - Better with categories context
   - Save for separate milestone

---

## Testing Plan

### Manual Testing
- ✅ Credit card: verify available credit shows correctly
- ✅ Bank account: verify pending transactions affect available balance
- ✅ Merchant display: check transactions with/without merchant data
- ✅ Account status: test with closed/error accounts
- ✅ Mobile responsive: check on small screens

### Edge Cases
- Accounts without available balance data
- Transactions without merchant info
- Closed accounts that were previously synced
- Very long merchant names

---

## Future Enhancements

### After Categories (Milestone 3)
- Color-code merchants by category
- Merchant spending breakdown
- Top merchants report

### After Balance Trends
- Cash flow visualization
- Spending trends over time
- Budget vs actual comparison

---

## Notes

- **No breaking changes** - All enhancements are additive
- **No additional API calls** - Uses existing data
- **Quick wins first** - Start with high-value, low-effort items
- **Mobile-first** - Ensure all displays work on small screens
- **Graceful degradation** - Handle missing data elegantly

---

## Decision Log

### Why Not Display Everything?
- `meta` fields are provider-specific and unclear value
- Keep UI clean and focused on high-value data
- Can always add more later if users request

### Why Defer Balance Trends?
- Requires more complex UI work
- Better with categories for context
- Lower priority than other features

### Why Prioritize Available Balance?
- Unique data not available elsewhere
- Critical for credit card management
- Very simple to implement
