# Click-to-Edit Transactions

## Feature Description
Replace the Edit button in the transaction list with click-to-edit functionality, where clicking on a transaction row opens the edit dialog.

## Requirements
- Remove Edit button from transaction list
- Make transaction row clickable to trigger edit
- Maintain visual feedback (hover effects, cursor change)
- Preserve existing behavior: transfers cannot be edited

## Implementation Approach

### Frontend Changes

1. **TransactionListItem Component** (`frontend/src/components/transactions/TransactionListItem.tsx`)
   - ✅ Remove Edit and Delete icon buttons
   - ✅ Remove unused imports (DeleteIcon, EditIcon, IconButton)
   - ✅ Add onClick handler to TableRow
   - ✅ Add cursor pointer styling for clickable rows
   - ✅ Maintain disabled state for transfer transactions (cursor: default, no onClick)
   - ✅ Enhanced hover effect for non-transfer rows

2. **TransactionList Component** (`frontend/src/components/transactions/TransactionList.tsx`)
   - ✅ Remove "Actions" column header from table

### UI/UX Changes
- ✅ Cursor changes to pointer on hover (non-transfer rows only)
- ✅ Hover background color applied (non-transfer rows only)
- ✅ Transfer rows remain non-interactive (cursor: default)

## Acceptance Criteria
- ✅ Clicking on a transaction row opens the edit dialog
- ✅ Transfer transactions are not clickable (cursor remains default)
- ✅ Visual feedback indicates clickable vs non-clickable rows
- ✅ Edit and Delete buttons are removed from the table
- ✅ Actions column header is removed

## Known Issues / Future Work

### Delete Functionality
**Status**: TODO - Not yet re-implemented

**Problem**: Delete button was removed along with Edit button, but delete functionality needs to be accessible somewhere.

**Potential Solutions**:
1. Add delete button/option inside the edit transaction dialog
2. Add a context menu (right-click) on transaction rows
3. Add a multi-select mode with bulk actions
4. Add a swipe-to-delete gesture (mobile-friendly)
5. Add a delete icon that appears on hover in the row

**Recommendation**: Option 1 (delete in edit dialog) is the simplest and most intuitive - when users open a transaction to edit it, they can also delete it from there.

## Implementation Notes

### Date: February 5, 2026 - Initial Implementation
- Removed Edit and Delete icon buttons from TransactionListItem
- Added onClick handler to TableRow to trigger edit
- Applied conditional styling based on whether transaction is a transfer
- Transfer transactions cannot be edited (existing behavior preserved)
- Removed Actions column from table header
- Added TODO comment for onDelete prop (will be removed once delete is re-implemented)

### Date: February 5, 2026 - Event Propagation Fix
- Added stopPropagation to Type and Status table cells to prevent clicks from triggering edit
- Added stopPropagation to Bank chip onClick handler
- Fixes issue where clicking on chips/badges was opening the edit dialog

### Date: February 5, 2026 - Transfer View Support
- Enabled clicking on transfer transaction rows to view details
- All form fields disabled when viewing a transfer (read-only mode)
- Dialog title changes to "View Transaction (Read-Only)" for transfers
- Save button hidden for transfers
- Create Budget and Create Planned buttons hidden for transfers
- Cancel button text changes to "Close" for transfers
- Removed conditional styling that blocked transfer clicks

### Date: February 5, 2026 - Partial Edit for Bank Transactions
- Bank-synced transactions now support partial editing
- **Read-only fields** (for bank transactions): Account, Type, Status, Amount, Date
- **Editable fields** (for bank transactions): Description, Category, Notes
- Transfer transactions remain fully read-only
- Save button visible for bank transactions (allows saving Description, Category, Notes changes)
- Create Budget and Create Planned buttons visible for bank transactions
- Dialog title shows "Edit Transaction" for bank transactions (not "Read-Only")

### Breaking Changes
None - the edit functionality works the same way, just triggered differently.

### Testing Notes
- Manual testing required: click on regular transactions to verify edit dialog opens
- Verify transfer transactions are not clickable
- Check hover effects work correctly
- Verify cursor changes appropriately

## Status
✅ **COMPLETE** - Implementation finished, ready for testing and merge.

Delete functionality documented as future work.
