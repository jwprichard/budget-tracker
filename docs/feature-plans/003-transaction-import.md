# Feature Plan: Transaction Import from CSV

**Milestone**: Early implementation from Milestone 8
**Status**: 🚧 IN PROGRESS
**Started**: January 5, 2026
**Branch**: TBD

---

## Overview

Implement CSV transaction import functionality to allow users to upload transaction files from their banks and automatically populate their accounts. This feature is being implemented earlier than planned (Milestone 8) because it provides immediate value for users who want to bulk-import historical transaction data.

## Requirements

### Functional Requirements
- Upload CSV files containing transaction data
- Map CSV columns to transaction fields (date, description, amount, etc.)
- Preview parsed transactions before import
- Detect and skip duplicate transactions
- Validate transaction data and show errors
- Auto-suggest categories based on description (if categories exist)
- Import valid transactions, skip invalid ones
- Show import summary (success count, skipped count, error count)

### Technical Requirements
- Backend CSV parsing with papaparse or csv-parse
- Column mapping interface with drag-and-drop or dropdowns
- Preview table showing parsed data with validation status
- Duplicate detection based on date + amount + description
- Bulk transaction creation endpoint
- Error handling for invalid CSV data
- File size limits (e.g., 5MB max, 10,000 rows max)

### User Decisions
- ✅ CSV format only (simplest, covers 90% of use cases)
- ✅ Column mapping UI (works with any bank's CSV format)
- ✅ Preview before import (user reviews and confirms)
- ✅ Duplicate detection (skip existing transactions)
- ✅ Auto-category assignment (suggest based on description)
- ✅ Error handling & validation (skip bad rows, import good ones)

---

## Implementation Plan

### Phase 1: Backend CSV Parsing

**Commit 1**: Add CSV parsing library and create parse endpoint
- Install `csv-parse` or `papaparse` on backend
- Create `/api/v1/transactions/parse-csv` endpoint
- Accept file upload (multipart/form-data)
- Parse CSV and return array of raw row objects
- Add file size validation (max 5MB)
- Add row count validation (max 10,000 rows)

**Files to create/modify**:
- `/backend/package.json` - Add csv-parse dependency
- `/backend/src/controllers/transaction.controller.ts` - Add parseCSV handler
- `/backend/src/routes/transaction.routes.ts` - Add POST /parse-csv route
- `/backend/src/middlewares/upload.ts` - Add multer file upload middleware

### Phase 2: Backend Duplicate Detection

**Commit 2**: Implement duplicate detection service
- Add method to transaction service: `findDuplicates(accountId, transactions[])`
- Check for existing transactions with same date + amount + description
- Return array of transaction indices that are duplicates
- Consider fuzzy matching for descriptions (optional)

**Files to modify**:
- `/backend/src/services/transaction.service.ts` - Add findDuplicates method

### Phase 3: Backend Bulk Import

**Commit 3**: Create bulk transaction import endpoint
- Create `/api/v1/transactions/bulk-import` endpoint
- Accept array of transaction objects with accountId
- Validate each transaction (Zod schema)
- Check for duplicates
- Import valid transactions in database transaction
- Return summary: { imported: number, skipped: number, errors: { row, message }[] }

**Files to create/modify**:
- `/backend/src/schemas/transaction.schema.ts` - Add BulkImportSchema
- `/backend/src/controllers/transaction.controller.ts` - Add bulkImport handler
- `/backend/src/services/transaction.service.ts` - Add bulkImport method
- `/backend/src/routes/transaction.routes.ts` - Add POST /bulk-import route

### Phase 4: Frontend File Upload

**Commit 4**: Create file upload component
- Create `FileUpload.tsx` component
- Drag-and-drop zone with file selection
- Display selected file name and size
- Validate file type (.csv only)
- Validate file size (max 5MB)
- Upload file and call parse endpoint

**Files to create**:
- `/frontend/src/components/common/FileUpload.tsx`

### Phase 5: Frontend Column Mapping

**Commit 5**: Build column mapping interface
- Create `ColumnMapper.tsx` component
- Show CSV headers as detected columns
- Dropdowns to map columns to fields (date, description, amount, type, notes)
- Date format selection (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
- Amount sign convention (positive = income vs expense, or separate type column)
- Preview of first 3 rows with mapping applied

**Files to create**:
- `/frontend/src/components/transactions/ColumnMapper.tsx`

### Phase 6: Frontend Preview Table

**Commit 6**: Create preview table with validation
- Create `ImportPreviewTable.tsx` component
- Display parsed transactions in table
- Show validation status per row (valid, duplicate, error)
- Color-code rows (green = valid, yellow = duplicate, red = error)
- Display error messages for invalid rows
- Show statistics (total rows, valid, duplicates, errors)
- Checkbox to toggle "skip duplicates"

**Files to create**:
- `/frontend/src/components/transactions/ImportPreviewTable.tsx`

### Phase 7: Frontend Import Wizard

**Commit 7**: Build import wizard dialog
- Create `TransactionImportDialog.tsx` component
- Multi-step wizard (Upload → Map → Preview → Import → Results)
- Step 1: FileUpload component
- Step 2: ColumnMapper component
- Step 3: ImportPreviewTable component
- Step 4: Import progress indicator
- Step 5: Results summary (X imported, Y skipped, Z errors)
- Navigation between steps (Next, Back, Cancel)

**Files to create**:
- `/frontend/src/components/transactions/TransactionImportDialog.tsx`

### Phase 8: Integration

**Commit 8**: Add import button to Account Details page
- Add "Import Transactions" button to AccountDetails.tsx
- Open TransactionImportDialog with accountId pre-filled
- Refresh transactions list after successful import
- Show success toast notification

**Files to modify**:
- `/frontend/src/pages/AccountDetails.tsx`

### Phase 9: Services & Hooks

**Commit 9**: Create API services and hooks
- Add transaction import services to transaction.service.ts
- Create React Query hooks for CSV parsing and bulk import
- Handle loading states and errors

**Files to modify**:
- `/frontend/src/services/transaction.service.ts`
- `/frontend/src/hooks/useTransactions.ts`

### Phase 10: Testing & Polish

**Commit 10**: Manual testing and bug fixes
- Test with various CSV formats (bank exports)
- Test duplicate detection
- Test error handling (invalid dates, amounts, etc.)
- Test with large files (performance)
- Fix any bugs found

**Commit 11**: Documentation and cleanup
- Update feature plan with completion notes
- Update ROADMAP.md
- Add user guide for import feature

---

## CSV Format

### Expected Fields (after mapping)
- `date` (required) - Transaction date in various formats
- `description` (required) - Transaction description
- `amount` (required) - Transaction amount (positive or negative)
- `type` (optional) - Transaction type (income, expense) - if not provided, infer from amount sign
- `notes` (optional) - Additional notes
- `status` (optional) - Transaction status (pending, cleared, reconciled) - default: cleared

### Example CSV Formats

**Format 1: Simple (Date, Description, Amount)**
```csv
Date,Description,Amount
2026-01-01,Coffee Shop,-5.50
2026-01-02,Salary,3000.00
```

**Format 2: With Type Column**
```csv
Date,Description,Amount,Type
01/01/2026,Coffee Shop,5.50,Expense
01/02/2026,Salary,3000.00,Income
```

**Format 3: Bank Format (Chase example)**
```csv
Transaction Date,Post Date,Description,Category,Type,Amount
01/01/2026,01/02/2026,Coffee Shop,Food & Drink,Sale,-5.50
01/02/2026,01/02/2026,Employer Deposit,Income,Credit,3000.00
```

### Date Format Detection
Support common date formats:
- MM/DD/YYYY (US)
- DD/MM/YYYY (European)
- YYYY-MM-DD (ISO)
- MM-DD-YYYY
- DD-MM-YYYY
- M/D/YYYY (single digit month/day)

---

## Duplicate Detection Strategy

### Matching Criteria
Consider transactions duplicates if ALL match:
1. Same accountId
2. Same date (exact match)
3. Same amount (exact match to 2 decimals)
4. Same description (case-insensitive, trimmed)

### Handling Duplicates
- **Option 1 (Default)**: Skip duplicate transactions automatically
- **Option 2**: Show duplicates in preview, let user decide
- **Implementation**: Use checkbox "Skip duplicates" in preview (default: checked)

### Edge Cases
- Multiple transactions same day/amount but different descriptions → Not duplicates
- Same transaction imported twice → Duplicate (skip on second import)
- Similar descriptions (typos, extra spaces) → Not duplicates (unless we add fuzzy matching)

---

## Auto-Category Assignment (Future Enhancement)

### Strategy
- If categories exist (Milestone 3), suggest category based on description
- Use keyword matching (e.g., "coffee" → Food & Dining > Coffee)
- Learn from past manual categorizations
- User can override during preview

### Implementation (Phase 2 - after Milestone 3)
- Not included in initial implementation
- Will add after Category System is implemented
- Add category column to preview table
- Allow editing category in preview

---

## Validation Rules

### File Validation
- File type: .csv only
- File size: Max 5MB
- Row count: Max 10,000 rows
- Required columns: Must have at least date, description, amount (after mapping)

### Row Validation
- Date: Must be valid date in supported format
- Amount: Must be valid number (positive or negative)
- Description: Required, 1-255 characters
- Notes: Optional, max 1000 characters
- Type: Must be "income" or "expense" if provided

### Error Handling
- Invalid file: Show error, don't parse
- Invalid rows: Show in preview with error message, allow skipping
- Validation errors: Display per-row, import valid rows only
- Network errors: Retry option, clear error messages

---

## User Flow

### Step 1: Upload CSV
1. Click "Import Transactions" button on Account Details page
2. Drag & drop CSV file or click to browse
3. File is validated (type, size)
4. File is parsed, raw data is returned

### Step 2: Map Columns
1. CSV headers are displayed
2. User maps each header to a transaction field
3. User selects date format
4. User selects amount sign convention
5. Preview shows first 3 rows with mapping applied
6. Click "Next"

### Step 3: Preview & Validate
1. All rows are displayed in table
2. Rows are color-coded (valid, duplicate, error)
3. Statistics shown (X valid, Y duplicates, Z errors)
4. User can toggle "Skip duplicates"
5. User reviews and clicks "Import"

### Step 4: Import Progress
1. Loading indicator shown
2. Transactions are imported in bulk
3. Progress updates (optional for large imports)

### Step 5: Results
1. Summary displayed (X imported, Y skipped, Z errors)
2. Errors listed with row numbers and messages
3. Option to download error report
4. Click "Done" to close dialog
5. Transaction list refreshes with new data

---

## Technical Decisions

### CSV Parsing Library
**Backend**: `csv-parse` (part of csv package)
- Mature, well-tested
- Handles various CSV formats
- Streaming support for large files
- Error handling built-in

**Frontend**: `papaparse`
- Client-side parsing for preview
- Fast and lightweight
- Good error handling
- Used for validating file before upload

### File Upload
**Library**: `multer`
- Standard Express middleware for file uploads
- Handles multipart/form-data
- Built-in file size limits
- Temporary file storage

### Storage
**Approach**: Temporary in-memory storage
- Files are not persisted after parsing
- Parsed data is sent to frontend
- No file storage needed (stateless API)

### Performance Considerations
- Limit file size to 5MB
- Limit row count to 10,000
- Parse in chunks/streaming for large files
- Use database transaction for bulk import
- Batch inserts (e.g., 100 rows at a time) for better performance

---

## Database Changes

No schema changes required. Using existing Transaction model.

---

## Dependencies

### Backend
```bash
cd backend
npm install csv-parse multer @types/multer
```

### Frontend
```bash
cd frontend
npm install papaparse @types/papaparse
```

---

## API Endpoints

### POST /api/v1/transactions/parse-csv
Upload and parse CSV file.

**Request**: multipart/form-data
- `file`: CSV file

**Response**:
```json
{
  "success": true,
  "data": {
    "headers": ["Date", "Description", "Amount"],
    "rows": [
      ["2026-01-01", "Coffee", "-5.50"],
      ["2026-01-02", "Salary", "3000.00"]
    ],
    "rowCount": 2
  }
}
```

### POST /api/v1/transactions/bulk-import
Import multiple transactions.

**Request**:
```json
{
  "accountId": "uuid",
  "transactions": [
    {
      "date": "2026-01-01T00:00:00Z",
      "description": "Coffee",
      "amount": -5.50,
      "type": "EXPENSE",
      "status": "CLEARED"
    }
  ],
  "skipDuplicates": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "skipped": 5,
    "errors": [
      {
        "row": 10,
        "message": "Invalid date format"
      }
    ]
  }
}
```

---

## Testing Checklist

### Backend Tests
- [ ] Parse valid CSV file
- [ ] Reject non-CSV files
- [ ] Reject files over 5MB
- [ ] Handle malformed CSV
- [ ] Detect duplicates correctly
- [ ] Bulk import valid transactions
- [ ] Skip invalid transactions
- [ ] Return proper error messages

### Frontend Tests
- [ ] Upload CSV file
- [ ] Map columns to fields
- [ ] Preview parsed data
- [ ] Display validation errors
- [ ] Show duplicate warnings
- [ ] Import transactions
- [ ] Display import results
- [ ] Refresh transaction list

### Integration Tests
- [ ] End-to-end import flow
- [ ] Import with various CSV formats
- [ ] Import with duplicates
- [ ] Import with errors
- [ ] Large file import (performance)

---

## Success Criteria

✅ Users can upload CSV files
✅ Column mapping works with any CSV format
✅ Preview shows all transactions with validation
✅ Duplicate detection works correctly
✅ Invalid rows are skipped with clear errors
✅ Valid transactions are imported successfully
✅ Import results summary is accurate
✅ Transaction list refreshes after import
✅ Error handling is robust
✅ Performance is acceptable for large files

---

## Future Enhancements

1. **Auto-category assignment** (after Milestone 3)
   - Keyword matching based on description
   - Learning from past categorizations

2. **Template saving**
   - Save column mappings for specific banks
   - Quick import with saved templates

3. **Excel support**
   - Parse XLSX files
   - Multiple sheet support

4. **Export functionality**
   - Export transactions to CSV
   - Custom export templates

5. **Import history**
   - Track import operations
   - Re-import or rollback imports

6. **Advanced duplicate detection**
   - Fuzzy matching for descriptions
   - Confidence scores
   - User confirmation for likely duplicates

---

## Notes

- This feature is being implemented early (before Milestone 8) due to immediate user value
- Auto-category assignment will be added after Milestone 3 (Category System)
- Focus on CSV support first; other formats can be added later
- Performance should be tested with files up to 10,000 rows
- Consider streaming/chunking for very large files in future iterations

---

**Status**: Planning complete, ready for implementation
**Next Step**: Commit 1 - Add CSV parsing library and endpoint
