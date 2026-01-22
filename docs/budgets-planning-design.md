# Design Document  
## Budgets, Planned Transactions, and Transactions

### Status
Approved concept

---

## Purpose

This document defines how **Budgets**, **Planned Transactions**, and **Transactions** work together to support:

- Accurate historical reporting  
- Predictable and realistic forecasting  
- Budget adherence without double-counting  
- Flexible planning (with or without budgets)

The goal is to clearly separate **facts**, **intent**, and **constraints**.

---

## Core Principles

1. **Transactions are facts**
   - They represent money that has actually moved.
2. **Planned Transactions are intent**
   - They represent expected future money movement.
3. **Budgets are constraints**
   - They define spending limits over time.
4. **Only transactions and planned transactions move money**
   - Budgets never directly affect balances.
5. **Forecasting must never double-count**
   - Every forecasted dollar has a single source.
6. **Planned transactions do not require budgets**
   - Planning and budgeting are independent concepts.

---

## Core Entities

### Transaction

A **Transaction** is a single, immutable record of money entering or leaving an account.

**Characteristics**
- Occurs at a specific date/time
- Has a final amount
- Represents posted or historical data
- Never recurring
- Never estimated

**Role**
- Source of truth for historical balances
- Consumes budget capacity (if applicable)
- Replaces planned transactions when matched

---

### Planned Transaction

A **Planned Transaction** represents an expected future transaction.

**Characteristics**
- Has a future date
- Has an expected amount (exact or estimated)
- May be recurring or one-off
- Exists independently of budgets
- Does not move real money

**Role**
- Drives forecasted balances
- Explains known future spending
- Optionally consumes budget capacity
- Reduces forecast uncertainty

**Lifecycle**
1. Created (manual or system-generated)
2. Included in forecasts
3. Optionally matched to an actual transaction
4. Retired or converted when matched

---

### Budget

A **Budget** defines a maximum amount that may be spent over a defined time period.

**Characteristics**
- Fixed amount
- Fixed period (weekly, monthly, etc.)
- Matching rules (category, tags, accounts, etc.)
- Passive (does not generate transactions)
- Optional participation in forecasting

**Role**
- Measures spending against limits
- Influences forecast assumptions for unplanned spend
- Provides user feedback and guardrails

---

## Relationships

### Planned Transactions ↔ Budgets

- Planned transactions may match a budget
- Matching is optional
- If matched, they consume budget capacity
- If unmatched, they still participate in forecasting

This allows:
- Rent without a rent budget
- Bills without discretionary limits
- Planning independent of budgeting

---

### Transactions ↔ Budgets

- Transactions are evaluated against budgets
- Budget usage is always derived
- A transaction may match zero, one, or multiple budgets

---

### Transactions ↔ Planned Transactions

- Planned transactions may be matched to transactions
- Matching preserves forecast continuity
- Matching does not change balances

---

## Forecasting Model

### Forecast Inputs

Only these contribute to future cash flow:
1. Actual transactions
2. Planned transactions

Budgets never directly contribute to cash flow.

---

## Budget Forecast Calculation

For each budget and budget period:

1. Identify planned transactions within the period that match the budget
2. Calculate planned spend  
   `plannedSpend = sum(planned transactions)`
3. Calculate remaining budget  
   `remainingBudget = budgetAmount - plannedSpend`
4. Calculate implicit spend  
   `implicitSpend = max(0, remainingBudget)`

---

## Implicit Spend (Forecast-Only)

Implicit spend represents expected but unspecified spending.

**Properties**
- Not stored as a transaction
- Not persisted
- Exists only in forecast calculations
- Gradually replaced by real transactions

**Purpose**
- Prevents optimistic forecasts
- Maintains realistic balance projections
- Avoids double-counting

---

## Examples

### Rent Without a Budget
- Planned rent: −$500 weekly
- No rent budget

Result:
- Forecast includes −$500 weekly
- No implicit spend
- No double-counting

### Groceries With a Budget
- Grocery budget: $200 weekly
- No planned grocery transactions

Result:
- Planned spend: $0
- Implicit spend: $200
- Forecast assumes full usage

---

## Budget Forecast Modes (Optional)

- **Strict**: Always assume full usage
- **Relaxed**: Only planned transactions count
- **Hybrid (default)**: Planned first, implicit remainder

---

## Invariants

1. Budgets never generate transactions
2. Forecast cash flow always has a source
3. Planned transactions take precedence over implicit spend
4. No forecasted dollar is counted twice
5. Budget usage is always derivable

---

## Benefits

- Clean separation of concerns
- Flexible planning without forced budgets
- Accurate forecasting
- Minimal special cases
- Scales well with automation and imports
