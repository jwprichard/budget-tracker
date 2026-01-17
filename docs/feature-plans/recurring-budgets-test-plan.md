# Recurring Budgets - Testing Plan

**Feature**: Recurring Budget Templates with Automatic Instance Generation
**Status**: Implementation Complete - Ready for Testing
**Date**: January 17, 2026

---

## Test Environment

**Access Points**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Database: PostgreSQL (via Docker)

**Test User**: Use existing account or create new via registration

---

## Test Scenarios

### Scenario 1: Create One-Time Budget (Baseline)

**Purpose**: Verify existing functionality still works

**Steps**:
1. Navigate to Budgets page
2. Click "Create Budget" button
3. Fill in form WITHOUT checking "Make this recurring"
   - Category: Select any category
   - Period: MONTHLY
   - Year/Period: Current month
   - Amount: $500
   - Name: "Test One-Time Budget" (optional)
4. Click "Create Budget"

**Expected Results**:
- ✅ Budget created successfully
- ✅ Shows as regular card in "One-Time Budgets" section
- ✅ No template created

---

### Scenario 2: Create Recurring Budget with End Date

**Purpose**: Test recurring budget template creation with finite duration

**Steps**:
1. Navigate to Budgets page
2. Click "Create Budget" button
3. Check "Make this recurring" checkbox
4. Fill in form:
   - Category: "Groceries" (or any category)
   - Period: MONTHLY
   - Year/Period: January 2026
   - Amount: $500
   - Template Name: "Monthly Groceries" (REQUIRED)
   - End Date: June 30, 2026
   - Notes: "Test recurring budget" (optional)
5. Click "Create Recurring Budget"

**Expected Results**:
- ✅ Template created successfully
- ✅ 6 budget instances created (Jan-Jun 2026)
- ✅ Template shows in "Recurring Budgets" section as collapsible card
- ✅ Template card shows:
  - Name: "Monthly Groceries"
  - Status badge: "Active"
  - Category badge with correct color
  - Period type: "Monthly Template"
  - Amount: $500
  - Instance count: "6 budgets created"
  - Next period info (if applicable)
- ✅ Can expand to see all 6 budget instances
- ✅ Each instance shows period, amount, progress bar

---

### Scenario 3: Create Ongoing Recurring Budget

**Purpose**: Test infinite recurring budget (no end date)

**Steps**:
1. Click "Create Budget"
2. Check "Make this recurring"
3. Fill in form:
   - Category: "Rent"
   - Period: MONTHLY
   - Year/Period: January 2026
   - Amount: $1200
   - Template Name: "Monthly Rent"
   - End Date: Leave empty
4. Click "Create Recurring Budget"

**Expected Results**:
- ✅ Template created successfully
- ✅ 12 budget instances created (Jan 2026 - Dec 2026)
- ✅ Template shows as active
- ✅ No end date displayed

---

### Scenario 4: Edit Single Budget Instance (THIS_ONLY)

**Purpose**: Test customizing individual budget without affecting template

**Steps**:
1. Expand "Monthly Groceries" template
2. Click Edit icon on March 2026 budget
3. Change amount to $550
4. Dialog appears: "Update Budget"
5. Select "Update only this period"
6. Click "Update"

**Expected Results**:
- ✅ UpdateScopeDialog displays with 3 options
- ✅ March budget updated to $550
- ✅ March budget shows "Customized" badge
- ✅ Other months remain $500
- ✅ Template still shows $500
- ✅ Alert shown: "This budget will be marked as customized..."

---

### Scenario 5: Edit Budget Instance (THIS_AND_FUTURE)

**Purpose**: Test updating current and future instances

**Steps**:
1. Expand "Monthly Groceries" template
2. Click Edit on April 2026 budget
3. Change amount to $600
4. Select "Update this and future periods (Recommended)"
5. Click "Update"

**Expected Results**:
- ✅ April-June budgets updated to $600
- ✅ Jan-Feb remain $500
- ✅ March remains $550 (customized, not affected)
- ✅ Template amount still $500

---

### Scenario 6: Edit Budget Instance (ALL)

**Purpose**: Test updating all instances from template

**Steps**:
1. Create new recurring budget: "Utilities" - $150/month (Jan-Dec)
2. Expand template
3. Click Edit on any budget
4. Change amount to $175
5. Select "Update all periods"
6. Click "Update"

**Expected Results**:
- ✅ All 12 budgets updated to $175
- ✅ Template amount updated to $175
- ✅ Applies to past, current, and future periods

---

### Scenario 7: Edit Template Directly

**Purpose**: Test template editing affects non-customized instances

**Steps**:
1. Click Edit icon on "Monthly Rent" template card (not instance)
2. Change amount to $1300
3. Check "Update all instances" checkbox (should be default)
4. Click "Update Template"

**Expected Results**:
- ✅ Template updated to $1300
- ✅ All non-customized budget instances updated to $1300
- ✅ Any customized instances remain unchanged

---

### Scenario 8: Delete Single Budget Instance

**Purpose**: Test deleting one period without affecting template

**Steps**:
1. Expand "Monthly Groceries" template
2. Click Delete icon on May 2026 budget
3. Dialog appears: "Delete Budget"
4. Select "Delete only this period"
5. Click "Delete"

**Expected Results**:
- ✅ DeleteScopeDialog displays with 2 options
- ✅ May budget deleted
- ✅ Template remains active
- ✅ Other budgets (Jan-Apr, Jun) remain
- ✅ Instance count updates: "5 budgets created"

---

### Scenario 9: Delete Entire Recurring Budget (Template)

**Purpose**: Test deleting template and all future instances

**Steps**:
1. Click Delete icon on "Utilities" template card
2. Dialog appears: "Delete Budget"
3. Select "Delete entire recurring budget"
4. Warning shown: "This will delete the template and all future budgets..."
5. Click "Delete"

**Expected Results**:
- ✅ Template deleted
- ✅ All future budget instances deleted (after current date)
- ✅ Past and current period budgets preserved as one-time budgets
- ✅ Template no longer appears in "Recurring Budgets" section
- ✅ Past budgets appear in "One-Time Budgets" section

---

### Scenario 10: Weekly Recurring Budget

**Purpose**: Test different period types

**Steps**:
1. Create recurring budget:
   - Category: "Coffee Budget"
   - Period: WEEKLY
   - Year/Period: Current week
   - Amount: $50
   - Template Name: "Weekly Coffee"
   - End Date: 12 weeks from now
2. Save

**Expected Results**:
- ✅ Template created for WEEKLY period
- ✅ 12 weekly budget instances created
- ✅ Period type badge shows "Weekly Template"
- ✅ Each instance shows correct week number

---

### Scenario 11: Quarterly Recurring Budget

**Purpose**: Test quarterly period type

**Steps**:
1. Create recurring budget:
   - Category: "Marketing"
   - Period: QUARTERLY
   - Year/Period: Q1 2026
   - Amount: $5000
   - Template Name: "Quarterly Marketing"
   - End Date: Empty (ongoing)
2. Save

**Expected Results**:
- ✅ Template created for QUARTERLY period
- ✅ 12 quarterly instances created (Q1 2026 - Q4 2028)
- ✅ Period type badge shows "Quarterly Template"

---

### Scenario 12: Template Status - Inactive

**Purpose**: Test pausing a template without deletion

**Steps**:
1. Use API or database to set template isActive = false
2. Refresh Budgets page

**Expected Results**:
- ✅ Template shows "Inactive" badge
- ✅ Template still visible but styled differently
- ✅ Existing budgets remain
- ✅ No new budgets generated

---

### Scenario 13: Budget List Grouping

**Purpose**: Verify budgets are properly organized

**Steps**:
1. Create multiple recurring budgets (2-3)
2. Create multiple one-time budgets (2-3)
3. View Budgets page

**Expected Results**:
- ✅ Page divided into two sections:
  - "Recurring Budgets" section at top
  - Divider line
  - "One-Time Budgets" section at bottom
- ✅ Recurring budgets show as collapsible template cards
- ✅ One-time budgets show as regular budget cards (Grid layout)
- ✅ Each section only shows if it has budgets

---

### Scenario 14: Form Validation - Recurring

**Purpose**: Test validation for recurring budget specific fields

**Test Cases**:

**A. Missing Template Name**:
1. Check "Make this recurring"
2. Fill all fields EXCEPT Template Name
3. Click "Create Recurring Budget"
- ✅ Error: "Template name is required for recurring budgets"

**B. Template Name Too Long**:
1. Enter 101+ character template name
2. Submit
- ✅ Error: "Template name must be 100 characters or less"

**C. Invalid End Date**:
1. Set end date before start date
2. Submit
- ✅ Error or validation prevents submission

---

### Scenario 15: Budget Instance Progress Bars

**Purpose**: Verify visual indicators work correctly

**Steps**:
1. Expand a recurring budget template
2. Add some transactions to different budget periods
3. Check progress bars

**Expected Results**:
- ✅ Progress bar shows correct percentage
- ✅ Color coding:
  - Green: UNDER_BUDGET (< 75%)
  - Blue: ON_TRACK (75-90%)
  - Yellow: WARNING (90-100%)
  - Red: EXCEEDED (> 100%)
- ✅ Shows amount spent vs budgeted

---

### Scenario 16: Customized Badge Display

**Purpose**: Verify customized instances are visually indicated

**Steps**:
1. Edit a single budget instance (THIS_ONLY scope)
2. Expand template to view instances

**Expected Results**:
- ✅ Customized instance shows "Customized" badge/chip
- ✅ Badge visually distinct (different color/style)
- ✅ Non-customized instances don't show badge

---

### Scenario 17: Template Card Actions

**Purpose**: Test all template card interactions

**Steps**:
1. Hover over template card
2. Test expand/collapse
3. Test edit template button
4. Test delete template button
5. Test individual budget edit/delete

**Expected Results**:
- ✅ Expand icon rotates on click
- ✅ Budget instances list slides into view
- ✅ Edit template icon opens template edit form
- ✅ Delete template icon opens delete scope dialog
- ✅ Individual budget actions work within expanded view

---

### Scenario 18: Period Selector in Create Form

**Purpose**: Verify period selection works with recurring toggle

**Steps**:
1. Open create form
2. Check "Make this recurring"
3. Change period type (MONTHLY → WEEKLY → QUARTERLY)

**Expected Results**:
- ✅ Period selector adjusts to period type
- ✅ Year and period number update correctly
- ✅ Defaults to current period
- ✅ Form still works with recurring checked

---

## API Endpoint Testing (Optional)

Use Postman collection to test backend directly:

**Endpoints to Test**:
1. `POST /api/v1/budget-templates` - Create template
2. `GET /api/v1/budget-templates` - List templates
3. `GET /api/v1/budget-templates/:id` - Get template details
4. `PUT /api/v1/budget-templates/:id` - Update template
5. `DELETE /api/v1/budget-templates/:id` - Delete template
6. `GET /api/v1/budget-templates/:id/budgets` - Get template instances
7. `POST /api/v1/budget-templates/:id/generate` - Generate budgets
8. `PUT /api/v1/budgets/:id/instance` - Update budget with scope

---

## Performance Testing

**Test Case**: Large number of budgets
1. Create 10+ recurring budget templates
2. Verify page loads within 2 seconds
3. Check that grouping and sorting performs well

---

## Edge Cases

### Edge Case 1: Overlapping Budgets
- Create recurring budget for category "Food"
- Create one-time budget for same category and period
- Verify both show correctly

### Edge Case 2: End Date in Past
- Try to create template with end date before start date
- Should be prevented or show error

### Edge Case 3: Template with No Future Periods
- Create template with end date = current date
- Should create minimal instances or handle gracefully

### Edge Case 4: Deleting Customized Budget
- Customize a budget (THIS_ONLY)
- Try to update template (ALL scope)
- Verify customized budget NOT affected

---

## Known Limitations

1. **Backend Job**: Rolling window maintenance job not yet implemented
   - Templates won't auto-generate new periods
   - Manual generation available via API

2. **Background Generation**: Currently generates 12 periods on creation
   - May need adjustment for weekly budgets (52 weeks = 1 year)

3. **UI Refinements**: Some visual polish may be needed
   - Template card styling
   - Badge colors
   - Loading states

---

## Success Criteria

Feature is considered fully functional when:

- ✅ All 18 test scenarios pass
- ✅ No console errors in browser
- ✅ No backend API errors
- ✅ All database queries execute correctly
- ✅ UI responsive and intuitive
- ✅ Edge cases handled gracefully
- ✅ Both recurring and one-time budgets work correctly

---

## Test Results

**Tester**: _________________
**Date**: _________________

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1. Create One-Time | ☐ | |
| 2. Recurring with End Date | ☐ | |
| 3. Ongoing Recurring | ☐ | |
| 4. Edit (THIS_ONLY) | ☐ | |
| 5. Edit (THIS_AND_FUTURE) | ☐ | |
| 6. Edit (ALL) | ☐ | |
| 7. Edit Template | ☐ | |
| 8. Delete Instance | ☐ | |
| 9. Delete Template | ☐ | |
| 10. Weekly Budget | ☐ | |
| 11. Quarterly Budget | ☐ | |
| 12. Inactive Template | ☐ | |
| 13. List Grouping | ☐ | |
| 14. Form Validation | ☐ | |
| 15. Progress Bars | ☐ | |
| 16. Customized Badge | ☐ | |
| 17. Template Actions | ☐ | |
| 18. Period Selector | ☐ | |

**Overall Status**: ☐ PASS  ☐ FAIL

**Issues Found**:
-
-
-

**Next Steps**:
-
-
-
