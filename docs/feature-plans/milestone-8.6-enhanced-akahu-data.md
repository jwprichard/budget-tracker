# Milestone 8.6 - Enhanced Akahu Data Display

**Status:** ✅ Complete (January 13, 2026)
**Priority:** Medium
**Estimated Effort:** Small (6-7 hours actual + 2 hours for dev tools)
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
- **No additional API calls** - Uses existing data (except Phase 1 on-demand fetching)
- **Quick wins first** - Start with high-value, low-effort items
- **Mobile-first** - Ensure all displays work on small screens
- **Graceful degradation** - Handle missing data elegantly

---

## Implementation Summary (January 12, 2026)

All three phases successfully implemented and committed to `feature/milestone-8.6-enhanced-akahu-data` branch.

### Phase 1: Available Balance Display ✅
**Implementation:**
- Backend: Added getAvailableBalance endpoint (GET /api/v1/accounts/:id/available-balance)
- Service method queries Akahu API in real-time for linked accounts
- Frontend: useAvailableBalance hook with 30s stale time, 60s auto-refresh
- Display in AccountCard with border separator and "Credit Available" label
- Display in AccountDetails page below initial balance
- Graceful handling: only shows for linked accounts with available data

**Commits:**
- `17cf4eb` [Feature] Add available balance endpoint for linked accounts
- `924d0b1` [Feature] Display available balance for linked accounts

### Phase 2: Merchant Display Enhancement ✅
**Implementation:**
- Database: Added merchant field to Transaction model (nullable string)
- Migration: 20260112164055_add_merchant_to_transactions
- Backend: Updated TransactionMappingService to preserve both merchant and description
- Frontend: Enhanced TransactionListItem with prominent merchant display (bold text)
- Added "Bank" badge chip for synced transactions
- Shows merchant as primary, description as secondary text
- Fallback to description when no merchant available

**Commits:**
- `e88b0de` [Migration] Add merchant field to Transaction model
- `cad038c` [Feature] Map merchant data to separate field in transactions
- `a711f77` [Feature] Enhanced merchant display in transaction list

### Phase 3: Account Status Indicators ✅
**Implementation:**
- Database: Added status field to LinkedAccount model (nullable string)
- Migration: 20260112164421_add_status_to_linked_accounts
- Backend: Updated SyncService to store account status during sync
- Frontend: Enhanced AccountCard with color-coded status badges
  - CLOSED: Red chip
  - DORMANT: Orange/warning chip
  - ERROR: Red chip with error icon
  - ACTIVE: No badge (clean UI)
- Added flexWrap for proper mobile layout

**Commits:**
- `381f974` [Migration] Add status field to LinkedAccount model
- `ec18ec1` [Feature] Store account status during bank sync
- `9884aad` [Feature] Display account status indicators

### Files Modified:
**Backend (6 files):**
- backend/prisma/schema.prisma (merchant + status fields)
- backend/src/services/account.service.ts (getAvailableBalance method)
- backend/src/controllers/account.controller.ts (available balance controller)
- backend/src/routes/account.routes.ts (new route)
- backend/src/services/TransactionMappingService.ts (separate merchant field)
- backend/src/services/SyncService.ts (store status)

**Frontend (7 files):**
- frontend/src/types/index.ts (Account + Transaction interfaces)
- frontend/src/services/account.service.ts (getAvailableBalance API call)
- frontend/src/hooks/useAccounts.ts (useAvailableBalance hook)
- frontend/src/components/accounts/AccountCard.tsx (all three enhancements)
- frontend/src/components/transactions/TransactionListItem.tsx (merchant display)
- frontend/src/pages/AccountDetails.tsx (available balance)

### Success Metrics:
- ✅ All acceptance criteria met for all three phases
- ✅ Mobile responsive across all components
- ✅ Graceful degradation for missing data
- ✅ No breaking changes to existing functionality
- ✅ Database migrations applied successfully (2 migrations)
- ✅ 8 logical commits following project conventions

### Testing Notes:
- Manual testing completed in Docker environment
- All edge cases handled (null checks, missing data, non-linked accounts)
- Available balance auto-refreshes every 60 seconds
- Status badges display correctly for all status types
- Merchant display falls back gracefully when no merchant data

### Next Steps:
- Merge feature branch to main
- Test with real Akahu data (multiple account types)
- Monitor API performance for available balance fetching
- Consider caching strategy if API calls become frequent

---

## Bonus Feature: Development Tools (January 13, 2026)

After completing the main milestone deliverables, a development tools interface was added to facilitate testing and debugging.

### Implementation:
**Backend (3 files):**
- backend/src/controllers/dev.controller.ts - Reset endpoints and database statistics
- backend/src/routes/dev.routes.ts - Development API routes
- backend/src/app.ts - Registered dev routes

**Frontend (3 files):**
- frontend/src/pages/Development.tsx - Development tools page
- frontend/src/App.tsx - Added development route
- frontend/src/components/layout/AppBar.tsx - Added development nav item

### Features:
- **Database Statistics Dashboard**: Real-time counts of all entities
- **Granular Reset Operations**:
  - Reset transactions only (preserves accounts and connections)
  - Reset accounts (cascades to transactions)
  - Reset bank connections (preserves manual data)
  - Nuclear reset everything (preserves categories only)
- **Safety Features**: Confirmation dialogs for all destructive operations
- **Auto-refresh**: Statistics update automatically after resets
- **Query Invalidation**: UI refreshes across the app after data deletion

### Commits:
- `773ab8b` [Feature] Add development tools page for database management

### Value:
- Speeds up testing by allowing quick database resets
- Provides visibility into database state during development
- Reduces need for manual database operations
- Safe destruction with confirmation dialogs
- Categories always preserved (seed data)

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
