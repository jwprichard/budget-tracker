# Claude Code Context - Budget Tracker

## Project Overview

**Budget Tracker** - A self-hosted web-based budget tracking application that helps users monitor expenses, forecast future cash flow, and ensure sufficient funds are always available through expense estimation, trend analysis, and comprehensive financial visibility across multiple accounts.

### Key Goals
- Track expenses and income across multiple accounts
- Estimate and forecast future financial positions
- Identify spending patterns and trends
- Alert users to potential cash flow issues
- Provide comprehensive financial visualization

### Project Type
Full-Stack Web Application (Self-Hosted)

## Current Status

- **Current Branch**: `feature/planned-transactions-forecasting`
- **Phase**: Milestone 6 - Planned Transactions & Forecasting 🔄 IN PROGRESS
- **Last Feature Completed**: One-off planned transactions support (January 24, 2026)
- **Completed Milestones**:
  - Milestone 1 - Foundation & Core Setup ✅
  - Milestone 1.5 - Authentication & Multi-User Support ✅
  - Milestone 2 - Account & Transaction Management ✅
  - Milestone 8 (Partial) - CSV Import ✅
  - Milestone 8.5 - Akahu Bank Synchronization ✅
  - Milestone 8.6 - Enhanced Akahu Data Display ✅
  - Milestone 4 - Visualization & Analytics (Partial - Calendar, Category Charts, Trends) ✅
  - Milestone 3.5 - Smart Categorization & Rules Engine ✅
- **Current Milestone**: Milestone 6 - Planned Transactions & Forecasting
- **Current Focus**: Planned transactions, forecasting, and transaction matching
- **Tests**: Not yet implemented (testing infrastructure planned for Milestone 11)

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API + React Query for server state
- **Charts**: Recharts for data visualization
- **Calendar**: FullCalendar for calendar view
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Authentication**: JWT tokens with bcrypt (12 rounds minimum)
- **Validation**: Zod for request validation
- **API Documentation**: OpenAPI/Swagger

### Database
- **Primary Database**: PostgreSQL 16
- **Migration Tool**: Prisma Migrate
- **Abstraction**: Prisma ORM (supports switching to MySQL, SQLite, SQL Server, MongoDB)

### Deployment
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx (for production)

## Development Environment

- **OS**: Linux (WSL2 - Windows Subsystem for Linux)
- **Kernel**: 6.6.87.2-microsoft-standard-WSL2
- **IDE**: [To be determined - VS Code recommended]
- **Path Conventions**: WSL paths (e.g., `/mnt/c/vso/Other/budget-tracker`)
- **Repository Location**: `/mnt/c/vso/Other/budget-tracker`
- **Special Setup**: Requires Docker and Docker Compose

## Project Structure

```
budget-tracker/
├── backend/                 # Backend API (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic layer
│   │   ├── middlewares/    # Express middlewares (auth, validation, etc.)
│   │   ├── routes/         # API route definitions
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── app.ts          # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── migrations/     # Database migrations
│   │   └── seed.ts         # Seed data (default categories)
│   ├── tests/              # Backend tests
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Frontend app (React + TypeScript)
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── common/     # Reusable UI components
│   │   │   ├── layout/     # Layout components
│   │   │   ├── transactions/
│   │   │   ├── accounts/
│   │   │   ├── sync/       # Bank sync components
│   │   │   ├── categories/
│   │   │   ├── budgets/
│   │   │   ├── recurring/
│   │   │   ├── analytics/
│   │   │   └── notifications/
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── tests/              # Frontend tests
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docs/                   # Project documentation
│   ├── budget-tracker-solution-design.md
│   └── feature-plans/      # Individual feature planning docs (to be created)
├── docker-compose.yml      # Docker orchestration
├── .env.example            # Environment variable template
├── ROADMAP.md              # Development roadmap
├── README.md               # Project README
└── .gitignore
```

## Architecture & Design Principles

### Architecture Pattern
- **Three-Tier Architecture**: Presentation (React SPA) → Business Logic (Express API) → Data (PostgreSQL)
- **Containerized Deployment**: Each tier runs in its own Docker container
- **Service Layer Pattern**: Business logic separated from controllers
- **Repository Pattern**: Data access abstraction through Prisma

### Design Principles
- **SOLID Principles**: Especially Single Responsibility and Dependency Inversion
- **DRY (Don't Repeat Yourself)**: Reusable components and utilities
- **KISS (Keep It Simple, Stupid)**: Avoid over-engineering
- **Separation of Concerns**: Clear boundaries between layers
- **Type Safety**: TypeScript across the entire stack

### Key Patterns
- **Repository Pattern**: Prisma provides database abstraction
- **Service Layer**: Business logic encapsulation
- **Middleware Pattern**: Express middlewares for cross-cutting concerns
- **Context API**: React state management
- **Server State Caching**: React Query for API data

### Code Organization
- **Frontend**: Component-based architecture with feature folders
- **Backend**: Controller → Service → Repository layering
- **Shared Types**: TypeScript interfaces shared between layers
- **User Isolation**: All queries filtered by userId for multi-tenant support

## Testing Strategy

**Current Project Approach:** Test After Implementation with Target Coverage

### Test Requirements
- **Backend**: Minimum 80% code coverage
  - Unit tests for service layer (Jest)
  - Integration tests for API endpoints (Supertest)
  - In-memory SQLite for fast testing
- **Frontend**: Minimum 70% code coverage
  - Unit tests for utilities and hooks (Vitest)
  - Component tests (React Testing Library)
  - E2E tests (Playwright - future enhancement)
- **Manual Testing**: Required for all user-facing features before merge
- **Edge Cases**: Must be identified and tested

### Testing Priorities
1. Business logic in service layer (critical)
2. API endpoint functionality (high)
3. Form validation and error handling (high)
4. UI components (medium)
5. Utility functions (medium)

## Development Workflow

### For Each Feature/Task

**This workflow is MANDATORY for all development work on this project.**

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/feature-name
   # or: git checkout -b bugfix/bug-name
   # or: git checkout -b refactor/refactor-name
   ```

2. **Create or Review Feature Plan**
   - Location: `/docs/feature-plans/`
   - Document should include:
     - Feature description and requirements
     - Implementation approach
     - Database schema changes (if applicable)
     - API endpoints (if applicable)
     - UI components (if applicable)
     - Acceptance criteria
     - Notes section for implementation progress

3. **Implement Feature Using Incremental Commits**

   **CRITICAL: Do NOT wait until the entire feature is complete to commit!**

   After completing each logical stage/step:

   **a. Update Documentation**
   - Update the feature plan with:
     - What was just completed
     - Any decisions made
     - Any deviations from original plan
     - Discoveries or learnings
     - Next steps
   - Keep a running history of progress

   **b. Commit Code + Documentation Together**
   - Each commit should include:
     - The code changes for that logical unit
     - Updated documentation reflecting those changes
   - Write clear, descriptive commit messages

   **c. Ensure Commit is Complete**
   - Code compiles/builds successfully (backend and frontend)
   - Tests pass (if tests exist)
   - No broken functionality
   - Represents a complete unit of work

   **Examples of Good Commit Points:**
   - After creating Prisma schema model
   - After implementing a service method with tests
   - After creating an API endpoint with validation
   - After implementing a React component
   - After adding a custom hook
   - After integrating frontend with backend API
   - After adding error handling to a feature
   - After completing a database migration

   **What Makes a Good Incremental Commit:**
   - ✅ Builds successfully (both backend and frontend if touched)
   - ✅ Tests pass (if tests exist)
   - ✅ Represents one logical change
   - ✅ Has descriptive commit message with type prefix
   - ✅ Includes updated documentation
   - ✅ Could be code reviewed independently
   - ✅ Doesn't break existing functionality

   **What is TOO SMALL for a commit:**
   - ❌ Changing a single variable name (unless it's a dedicated refactoring)
   - ❌ Adding a single import statement
   - ❌ Fixing a typo in a comment

   **What is TOO LARGE for a commit:**
   - ❌ "Implemented entire feature"
   - ❌ Multiple unrelated changes
   - ❌ Changes spanning frontend, backend, and database without logical grouping
   - ❌ More than 500 lines changed (usually a sign it should be broken up)

4. **Before Creating Pull Request**
   - Review all Quality Gates (see below)
   - Ensure feature plan is marked complete
   - Update ROADMAP.md checklist if applicable
   - Run final build and test suite
   - Check for any warnings or linting issues
   - Test manually in Docker containers

5. **Create Pull Request**
   - Title: Clear, descriptive summary with type prefix
   - Description: Link to feature plan, describe changes, note any special considerations
   - Include screenshots for UI changes
   - List any breaking changes
   - Request review from appropriate team members (if applicable)

6. **Address Review Feedback**
   - Make requested changes
   - Continue incremental commit pattern for review fixes
   - Update PR with responses to comments

7. **Merge After Approval**
   - Ensure all checks pass
   - Merge to main branch
   - Delete feature branch
   - Update project status in this claude.md file

### Commit Message Guidelines

**Format:**
```
[Type] Brief description

Optional detailed description if needed.
Includes information about database changes, API changes, or breaking changes.
```

**Types:**
- `[Feature]` - New functionality
- `[Fix]` - Bug fixes
- `[Test]` - Adding or updating tests
- `[Refactor]` - Code improvements without functionality change
- `[Docs]` - Documentation updates
- `[Setup]` - Project configuration changes
- `[Style]` - Formatting, UI/UX changes
- `[Migration]` - Database migration changes
- `[Security]` - Security-related changes

**Examples:**
```
[Feature] Add transaction CRUD API endpoints

Implemented POST, GET, PUT, DELETE endpoints for transactions.
Added Zod validation schemas for request bodies.
Includes JWT authentication middleware.
Tests pending for next commit.

[Migration] Create transactions and accounts tables

Added Prisma schema for Account and Transaction models.
Includes proper indexes and foreign key constraints.
Migration file: 20250101_create_transactions_accounts.

[Feature] Implement calendar view component

Created CalendarView component with daily balance display.
Integrated FullCalendar library with custom rendering.
Color-coded balance status (green/yellow/red thresholds).
```

## Quality Gates (Before Merge)

**All items must be checked before merging to main branch:**

### Code Quality
- [ ] All code builds/compiles without errors (backend and frontend)
- [ ] No compiler warnings or TypeScript errors
- [ ] Code follows project conventions and style guide
- [ ] No commented-out code or debugging statements (console.log, etc.)
- [ ] No hardcoded values that should be in environment variables
- [ ] ESLint and Prettier checks pass

### Testing
- [ ] All existing tests still pass
- [ ] New tests added for new functionality (unit tests for services, integration tests for APIs)
- [ ] Manual testing completed in Docker environment
- [ ] Edge cases considered and tested
- [ ] Error handling tested (invalid inputs, network failures, etc.)

### Documentation
- [ ] Code comments added for complex logic
- [ ] Public APIs documented with JSDoc/TSDoc
- [ ] README updated if setup process changed
- [ ] Feature plan marked complete with implementation notes
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] Postman collection updated if API endpoints added/changed (`docs/Budget-Tracker-API.postman_collection.json`)

### Architecture
- [ ] Design principles followed (SOLID, separation of concerns)
- [ ] No unnecessary dependencies introduced
- [ ] Proper error handling implemented
- [ ] Logging added appropriately (Winston for backend)
- [ ] Performance considerations addressed
- [ ] Security best practices followed (input validation, SQL injection prevention, XSS protection)

### Database
- [ ] Prisma schema updated if data model changed
- [ ] Migration created and tested
- [ ] Indexes added for frequently queried fields
- [ ] Foreign key constraints properly defined
- [ ] Seed data updated if needed

### Git Hygiene
- [ ] Commits are incremental and logical
- [ ] Commit messages are clear and descriptive with type prefixes
- [ ] No merge conflicts
- [ ] Feature branch is up to date with main
- [ ] No sensitive data committed (.env files, secrets, credentials)

## Working Principles

**How Claude Code Should Approach This Project:**

1. **Incremental Development**
   - Break work into small, testable units
   - Commit frequently with documentation updates
   - Each commit should represent a complete, working change
   - Never wait until a feature is "done" to commit
   - Backend and frontend can be committed separately or together depending on logical boundaries

2. **Documentation-Driven**
   - Update documentation with every commit
   - Document decisions and rationale
   - Keep feature plans up to date
   - Maintain this claude.md file
   - Update API documentation when endpoints change
   - Update Postman collection (`docs/Budget-Tracker-API.postman_collection.json`) when adding/modifying API endpoints

3. **Quality-Focused**
   - Follow quality gates before merging
   - Write clean, maintainable code
   - Consider edge cases and error scenarios
   - Test thoroughly (manual + automated)
   - Security-first mindset (authentication, authorization, input validation)

4. **Clear Communication**
   - Ask clarifying questions when requirements are ambiguous
   - Reference specific line numbers when discussing code
   - Explain technical decisions
   - Highlight potential issues or trade-offs
   - Document database schema changes clearly

5. **Architecture-Aware**
   - Follow three-tier architecture consistently
   - Respect separation of concerns (controller → service → repository)
   - Use Prisma for all database access (never raw SQL)
   - Ensure user-level data isolation (userId in all queries)
   - Consider maintainability and extensibility
   - Don't over-engineer for current requirements

6. **Context-Aware**
   - Read solution design document before implementing
   - Understand existing code patterns
   - Check for similar implementations elsewhere
   - Consider how changes affect the broader system
   - Review ROADMAP.md to understand current milestone

7. **Security-Conscious**
   - Always validate and sanitize user input (use Zod)
   - Use Prisma to prevent SQL injection
   - Hash passwords with bcrypt (12 rounds minimum)
   - Implement proper JWT token handling
   - Never expose sensitive data in API responses
   - Follow OWASP security best practices

## Anti-Patterns to Avoid

**Common Mistakes That Cause Problems:**

1. **Large, Monolithic Commits**
   - ❌ Implementing backend and frontend for entire feature in one commit
   - ✅ Break into logical chunks (model → API → UI component)

2. **Implementation Without Understanding**
   - ❌ Writing code without reading the solution design
   - ✅ Review design document and existing patterns first

3. **Skipping Documentation**
   - ❌ "I'll document it later" (it never happens)
   - ✅ Update docs with each commit

4. **Incomplete Error Handling**
   - ❌ Happy path only implementations
   - ✅ Consider and handle error scenarios (validation errors, network failures, database errors)

5. **Ignoring Quality Gates**
   - ❌ "Tests can wait" or "I'll fix warnings later"
   - ✅ Meet quality standards before merging

6. **Over-Engineering**
   - ❌ Building elaborate abstractions for simple requirements
   - ✅ Solve the current problem appropriately (follow KISS principle)

7. **Copy-Paste Without Understanding**
   - ❌ Copying code snippets without understanding them
   - ✅ Understand what code does before using it

8. **Making Assumptions**
   - ❌ Guessing at requirements or architectural decisions
   - ✅ Ask clarifying questions

9. **Bypassing Prisma**
   - ❌ Writing raw SQL queries
   - ✅ Always use Prisma for database access

10. **Forgetting User Isolation**
    - ❌ Queries without userId filtering
    - ✅ Always filter by userId for user-specific data

11. **Hardcoding Configuration**
    - ❌ Hardcoded database URLs, API keys, etc.
    - ✅ Use environment variables

12. **Skipping Input Validation**
    - ❌ Trusting user input
    - ✅ Validate all inputs with Zod schemas

## Important Files & Locations

### Documentation
- **Solution Design**: `/docs/budget-tracker-solution-design.md` - Comprehensive system design
- **Roadmap**: `/ROADMAP.md` - Development milestones and feature list
- **Feature Plans**: `/docs/feature-plans/` - Individual feature planning documents
- **Postman Collection**: `/docs/Budget-Tracker-API.postman_collection.json` - Complete API collection for testing (must be updated when API changes)
- **This File**: `/claude.md` - Project context for Claude Code

### Configuration
- **Docker Compose**: `/docker-compose.yml` - Container orchestration
- **Environment Template**: `/.env.example` - Environment variable template
- **Backend Config**: `/backend/tsconfig.json` - TypeScript configuration
- **Frontend Config**: `/frontend/vite.config.ts` - Vite build configuration
- **Database Schema**: `/backend/prisma/schema.prisma` - Prisma schema definition

### Key Code Files
- **Backend Entry**: `/backend/src/app.ts` - Express app initialization
- **Frontend Entry**: `/frontend/src/main.tsx` - React app initialization
- **Database Seed**: `/backend/prisma/seed.ts` - Default categories and test data

## Current Development Context

### What We're Working On
- **Phase**: Milestone 6 - Planned Transactions & Forecasting 🔄 IN PROGRESS (Jan 24, 2026)
- **Current Task**: Polishing UI and testing
- **Branch**: `feature/planned-transactions-forecasting`
- **Status**: Core features implemented, refining UI
- **Completed Features**:
  - Phase 1: Database models for PlannedTransactionTemplate, PlannedTransaction, TransactionMatch
  - Phase 2: Backend services (planned transactions, forecast, matching)
  - Phase 3: API endpoints for templates, one-offs, forecast, and matching
  - Phase 4: Transaction matching service with confidence scoring
  - Phase 5: Frontend UI (forms, list views, forecast charts, match review)
  - Calendar integration showing planned transactions on future dates
  - One-time and recurring planned transaction support
  - Visual distinction for projected balances (~prefix, blue tint, dashed borders)
  - Create Planned Transaction from existing transaction
- **Next Phase**: Merge to main, then Milestone 5 (Budget Management)

### Recent Decisions (Updated Jan 20, 2026)
- Chose PostgreSQL over MySQL for better ACID compliance and JSON support
- Selected Material-UI over other UI libraries for comprehensive component set
- Using Prisma ORM for database abstraction and future flexibility
- Containerized deployment approach for easier self-hosting
- Multi-stage Dockerfiles for development and production targets
- Nginx Alpine for production frontend serving
- Winston for backend logging with file and console transports
- React Query for server state management
- Vite polling enabled for Docker/WSL hot reload compatibility
- **Added tslib as runtime dependency** - Required by TypeScript's `importHelpers` feature
- **Added OpenSSL to Alpine base image** - Prisma requires OpenSSL for database connections
- **Configured Prisma binary targets** - Set `linux-musl-openssl-3.0.x` for Alpine Linux compatibility
- **ARCHITECTURAL DECISION REVERSED: Multi-User Mode (Jan 13, 2026)** - Implemented full JWT authentication with user data isolation. All data models now include userId foreign keys. Authentication middleware protects all API endpoints. Frontend includes login/register flows with protected routes.
- **Balance Calculation Strategy (Jan 5, 2026)** - On-the-fly calculation using aggregate queries instead of stored balance field. Formula: `currentBalance = initialBalance + sum(transactions.amount)`
- **Transfer Pattern (Jan 5, 2026)** - Two-transaction pattern with `transferToAccountId` linking. Creates expense from source + income to destination in a single database transaction.
- **Amount Storage Convention (Jan 5, 2026)** - INCOME stored as positive, EXPENSE as negative, simplifies balance calculation
- **Date Validation (Jan 5, 2026)** - Only past/current dates allowed for now, future dates will be enabled in Milestone 6 for forecasting
- **Category Field Preparation (Jan 5, 2026)** - Added nullable `categoryId` to Transaction model for Milestone 3 compatibility
- **Material-UI Theme (Jan 5, 2026)** - Custom Indigo/Pink theme with Inter font, gradient backgrounds, enhanced shadows
- **CSV Import Implementation (Jan 6, 2026)** - Implemented early from Milestone 8 due to immediate user value
  - Backend: multer for file upload, csv-parse for parsing
  - Frontend: Multi-step wizard (Upload → Map → Preview → Results)
  - Date format flexibility: 10 formats including 2-digit years (DD/MM/YY)
  - Duplicate detection: date + amount + description matching
  - Validation: Three-tier (file → field → duplicate)
- **Balance Adjustment Pattern (Jan 6, 2026)** - Edit account shows "Current Balance" instead of "Initial Balance"
  - Creates adjustment transaction for balance changes (maintains audit trail)
  - Never modifies historical data or initial balance
  - Transaction type: INCOME (increase) or EXPENSE (decrease)
- **Akahu Personal App Integration (Jan 6-12, 2026)** - Complete bank sync implementation
  - Provider abstraction layer (IBankingDataProvider) for future multi-provider support
  - AES-256-GCM encryption for secure token storage
  - Levenshtein distance algorithm for duplicate detection (98% exact, 70-94% review, <70% import)
  - Provider-agnostic sync service architecture
  - 10+ REST API endpoints for complete sync workflow
  - Database models: BankConnection, LinkedAccount, ExternalTransaction, SyncHistory
  - Postman collection created and updated for API testing
- **Frontend Akahu Integration (Jan 12, 2026)** - Complete UI for bank sync
  - 3-step setup wizard (Enter Tokens → Test → Link Accounts)
  - Real-time sync status with 5-second polling intervals
  - Transaction review workflow for duplicate resolution
  - Sync history view with pagination
  - Manual "Days Back" control (1-365 days)
  - Unlink account functionality with visual indicators
- **Polling Optimization (Jan 12, 2026)** - Fixed aggressive API polling
  - Reduced interval from 2s → 5s
  - Fixed React StrictMode double-mount issues
  - Stabilized callbacks with useCallback
  - Proper interval cleanup
- **Balance Reconciliation (Jan 12, 2026)** - Auto-adjust balance after sync
  - Updates initialBalance: externalBalance - sum(transactions)
  - Ensures local balance matches bank balance
  - Non-critical operation (won't fail sync)
- **Date Calculation Fix (Jan 12, 2026)** - Proper millisecond conversion
  - Fixed: `new Date(lastSync).getTime() - 1 day`
  - First sync: 7 days back
  - Subsequent: 1 day before last sync
- **Rate Limiting Strategy (Jan 12, 2026)** - Exponential backoff retry logic
  - Retry delays: 1s, 2s, 4s for 429/500 errors
  - 500ms delay between pagination requests
  - 1-second delay between different accounts
- **Enhanced Akahu Data Display (Jan 13, 2026)** - Improved visibility of bank sync data
  - Available balance display for credit cards
  - Account status indicators (ACTIVE/INACTIVE with visual badges)
  - Foundation for future balance trend charts
- **Development Tools (Jan 13, 2026)** - Database management interface for testing
  - Development page with database statistics dashboard
  - Granular reset operations (transactions, accounts, bank connections, or everything)
- **Analytics Backend (Jan 14, 2026)** - Complete analytics API implementation
  - Daily balances endpoint: `/api/v1/analytics/daily-balances` (aggregates transactions by date)
  - Category totals endpoint: `/api/v1/analytics/category-totals` (aggregates by category)
  - Spending trends endpoint: `/api/v1/analytics/spending-trends` (time-series grouping)
  - Income vs expense endpoint: `/api/v1/analytics/income-vs-expense` (comparison over time)
  - Array parameters passed as comma-separated strings in query params
  - All endpoints support date range filtering and account filtering
- **Calendar View (Jan 14, 2026)** - FullCalendar integration with custom rendering
  - Transaction bars display inside calendar cells (up to 4 transactions visible)
  - Color-coded transaction types (green=income, red=expense, blue=transfer)
  - Daily balance shown at bottom of each cell with color coding
  - Dialog view for full transaction details on date click
  - Dynamic month loading (fetches data only for displayed month)
  - Fixed timezone issue using local date values instead of UTC
  - Description truncation (20 characters max with ellipsis)
  - Fixed height cells (180px) with flex layout for consistent sizing
- **Calendar Navigation (Jan 14, 2026)** - Standalone page for calendar
  - Moved calendar from Analytics tabs to dedicated /calendar route
  - Added Calendar navigation link in AppBar with CalendarMonth icon
  - Simplified filters (account selection only, no date range needed)
  - Calendar manages its own date range based on month navigation
  - Analytics page now only has Categories and Trends tabs
- **Sync Transaction Debugging (Jan 14, 2026)** - View transactions fetched during sync
  - New endpoint: `GET /api/v1/sync/history/:syncHistoryId/transactions`
  - Clickable sync history rows open dialog with transaction list
  - Shows fetched transactions with status indicators (imported, duplicate, needs review)
  - Displays merchant names, account info, amounts, and dates
  - Useful for debugging sync operations and duplicate detection behavior
- **Authentication & Multi-User Support (Jan 13, 2026)** - Complete JWT authentication implementation
  - JWT tokens: 15-minute access tokens, 7-day refresh tokens
  - Password hashing with bcrypt (12 rounds minimum)
  - User data isolation: All queries filtered by userId at service layer
  - Authentication middleware on all protected API endpoints
  - Frontend: Login/register pages, protected routes, user menu with logout
  - Token management: Automatic refresh on 401 with request queuing
  - Critical fix: React Query cache clearing on login/logout prevents data leakage between users
  - User table mapping: Prisma model `User` → database table `users` (avoids SQL reserved keyword)
- **Smart Categorization & Rules Engine (Jan 16, 2026)** - Automatic transaction categorization
  - **Hierarchical Category Structure**: Store full Akahu category JSON in ExternalTransaction, parse on local transaction creation
  - **Auto-create Categories**: Bank sync automatically creates parent-child category relationships from Akahu data
  - **Priority-based Rule Evaluation**: User rules (highest priority) → Akahu mapping → Uncategorized (fallback)
  - **Text-based Rules**: Match on description, merchant, or notes fields with operators (contains, exact, startsWith, endsWith)
  - **Rule Conditions JSON**: Flexible JSON structure for conditions allows future extension (amount rules, composite rules, etc.)
  - **Batch Processing**: Bulk apply processes transactions in batches of 100 for performance
  - **Cache Management**: In-memory caching for rules and categories with invalidation on updates
  - **CategorySelect Component**: Reused existing TreeSelect component for hierarchical category selection in rule builder
  - **Match Statistics**: Track matchCount and lastMatched timestamp for each rule
  - **Database Models**: CategoryRule model with priority, isEnabled, isSystem fields for flexible rule management
- **Theme Switching (Jan 20, 2026)** - Multiple color theme support
  - 6 built-in themes: Default (Indigo/Pink), Ocean (Blue/Teal), Forest (Green/Lime), Sunset (Orange/Red), Purple (Purple/Pink), Midnight (Dark Blue/Cyan)
  - ThemeContext for global theme state management
  - ThemePicker component in AppBar for easy switching
  - Theme preference persisted in localStorage
  - Each theme includes custom primary/secondary colors, background shades, and shadows
- **Collapsible Sidebar Layout (Jan 20, 2026)** - Page-specific sidebar with tools and configuration
  - SidebarContext for managing sidebar content and collapse state
  - useSidebar hook for pages to register their sidebar content
  - Two sections: Tools (action buttons) and Config (filters/settings)
  - Collapsible with state persisted in localStorage
  - Mobile-responsive: temporary drawer on small screens
  - Auto-hides when page has no sidebar content
  - 300px width, smooth collapse animation
- **Navigation Reorganization (Jan 20, 2026)** - Streamlined navbar layout
  - New navbar order: Dashboard, Calendar, Transactions, Budgets, Categorisation, Analytics
  - Accounts moved to user menu (alongside Bank Sync, Development)
  - Categorisation dropdown: Categories, Rules
  - Analytics dropdown: Spending Analysis, Trends & Patterns
- **Pages with Sidebar Support (Jan 20, 2026)** - Migrated pages to use collapsible sidebar
  - Transactions: Add Transaction/Transfer buttons in Tools, filters in Config
  - Calendar: Navigation controls (prev/next/today, month/week toggle) in Tools, account filter in Config
  - Budgets: Create Budget button in Tools, period/status/sort filters in Config
  - Spending Analysis: Transaction type toggle in Tools, date/account filters in Config
  - Spending Trends: Date/account/category filters in Config
  - Trends & Patterns: Date/account/category filters in Config
  - Compact mode for AnalyticsFilters and DateRangePicker (vertical stacking in sidebar)
- **Planned Transactions & Forecasting (Jan 24, 2026)** - Milestone 6 implementation
  - **Database Models**: PlannedTransactionTemplate (recurring), PlannedTransaction (one-off/overrides), TransactionMatch
  - **Recurrence Engine**: Supports DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, ANNUALLY with intervals
  - **Day Selection Options**: Fixed day, last day of month, first/last weekday for monthly recurrences
  - **Virtual Transactions**: Generate future occurrences on-the-fly without storing in database
  - **Forecast Service**: Projects balances considering planned transactions and budget spending
  - **Transaction Matching**: Confidence-based matching (amount, date, description) with AUTO/AUTO_REVIEWED/MANUAL methods
  - **Match Review Queue**: Pending matches requiring user confirmation
  - **One-off Transactions**: Support for single planned transactions with expectedDate
  - **Schedule Toggle**: Form UI differentiates between one-time and recurring transactions
- **Calendar Forecast Integration (Jan 24, 2026)** - Visual forecasting in calendar view
  - Future dates show blue tint background for visual distinction
  - Planned transactions display with dashed borders and italic text
  - Projected balances prefixed with ~ symbol
  - Implicit budget spending aggregated as "Budget spending" item
  - Lazy loading: Forecast data only fetched when viewing future dates
  - Dialog shows planned transactions and budget breakdown for future dates
  - Legend updated with forecast indicators
  - Fixed timezone issues using local date formatting
- **Forecast Transfer Handling Fix (Jan 24, 2026)** - Correct transfer impact on account balances
  - Transfers now properly subtract from source account and add to destination
  - Account filter includes transfers where destination matches filter
  - Total balance calculation only sums filtered accounts
- **Match Dismiss Persistence (Jan 24, 2026)** - Dismissed matches now persist
  - Added DismissedMatch database model to store dismissed suggestions
  - Dismiss action uses upsert to prevent duplicates
  - getPendingMatches filters out previously dismissed transaction+planned pairs

### Known Issues
None - All Docker build, runtime, and CSV import issues resolved

### Recent Fixes (Dec 29, 2025)
1. **Package lockfiles** - Generated package-lock.json for reproducible Docker builds
2. **tslib missing** - Added to dependencies (required by ts-node-dev at runtime)
3. **OpenSSL missing** - Added to Dockerfile for Prisma compatibility
4. **Prisma binary mismatch** - Configured correct binary target for Alpine Linux + OpenSSL 3.0
5. **Stale Docker volumes** - Documented use of `docker compose down -v` to clear volumes

### Next Steps
1. ✅ Merge `feature/docker-project-scaffolding` to `main` branch (COMPLETE)
2. ✅ Implement Account & Transaction Management (Milestone 2) (COMPLETE - Jan 5, 2026)
3. ✅ Implement CSV Transaction Import (Milestone 8 - Partial) (COMPLETE - Jan 6, 2026)
4. ✅ Merge `feature/transaction-import` to `main` branch (COMPLETE - Jan 6, 2026)
5. ✅ Implement Akahu Bank Synchronization (Milestone 8.5) (COMPLETE - Jan 12, 2026)
6. ✅ Implement Enhanced Akahu Data Display (Milestone 8.6) (COMPLETE - Jan 13, 2026)
7. ✅ Implement Authentication & Multi-User Support (Milestone 1.5) (COMPLETE - Jan 13, 2026)
8. ✅ Merge `feature/authentication-multi-user` to `main` branch (COMPLETE - Jan 13, 2026)
9. ✅ Implement Analytics & Visualization (Milestone 4 - Partial) (COMPLETE - Jan 14, 2026)
   - ✅ Backend analytics API endpoints (daily balances, category totals, trends)
   - ✅ Calendar view with transaction display and dynamic month loading
   - ✅ Category pie charts and bar charts
   - ✅ Spending trends over time (line/area charts)
   - ✅ Income vs expense comparison charts
   - ✅ Standalone calendar page with navigation
   - ✅ Sync transaction debugging view
10. ✅ Implement Smart Categorization & Rules Engine (Milestone 3.5) (COMPLETE - Jan 16, 2026)
   - ✅ Phase 1: Akahu category mapping with hierarchical structure (parent → child)
   - ✅ Phase 2: Text-based categorization rules with CRUD operations
   - ✅ Phase 3: Bulk apply rules to existing uncategorized transactions
   - ✅ Auto-categorization during bank sync
   - ✅ Priority-based rule evaluation system
   - ✅ Rule management UI with category tree selection
11. 🔄 Implement Planned Transactions & Forecasting (Milestone 6) (IN PROGRESS - Jan 24, 2026)
   - ✅ Phase 1: Database models (PlannedTransactionTemplate, PlannedTransaction, TransactionMatch)
   - ✅ Phase 2: Backend services (planned transactions, forecast, matching)
   - ✅ Phase 3: API endpoints for templates, one-offs, forecast, and matching
   - ✅ Phase 4: Transaction matching service with confidence scoring
   - ✅ Phase 5: Frontend UI (forms, list views, forecast charts, match review)
   - ✅ Calendar integration with forecast data and visual styling
   - ✅ One-off planned transactions support (create, edit, delete)
   - 🔲 Final testing and polish
   - 🔲 Merge to main branch
12. NEXT: Implement Budget Management (Milestone 5)
    - Monthly/yearly budget setting per category
    - Budget vs actual spending comparison
    - Budget alerts and notifications
    - Budget rollover handling
    - Visual budget progress indicators
12. OPTION B: Implement Recurring Transactions (Milestone 6)
    - Recurring transaction templates
    - Automatic transaction generation
    - Recurrence patterns (daily, weekly, monthly, yearly, custom)
    - Edit series vs single occurrence
    - Skip/pause recurring transactions

## Project-Specific Notes

### Naming Conventions
- **Database**: snake_case for table and column names
- **TypeScript/JavaScript**: camelCase for variables and functions, PascalCase for classes and components
- **React Components**: PascalCase for component files (e.g., `TransactionList.tsx`)
- **API Endpoints**: kebab-case with plural nouns (e.g., `/api/v1/transactions`)
- **Environment Variables**: UPPER_SNAKE_CASE (e.g., `DATABASE_URL`)

### Code Style
- **Indentation**: 2 spaces (both backend and frontend)
- **Quotes**: Single quotes for TypeScript/JavaScript
- **Semicolons**: Required
- **Line Length**: 100 characters maximum
- **Imports**: Organized (external → internal → relative)

### Integration Points
- **Frontend ↔ Backend**: RESTful API over HTTP (JSON)
- **Backend ↔ Database**: Prisma ORM (type-safe queries)
- **Authentication**: JWT tokens in Authorization header
- **Future**: Banking API integration (Plaid), Email service (future), SMS service (Twilio - future)

### Performance Requirements
- API response time < 200ms (p95)
- Frontend load time < 2s
- Database query time < 50ms (p95)
- Support for thousands of transactions per user

### Security Considerations
- All passwords hashed with bcrypt (12 rounds minimum)
- JWT tokens with short expiration (15 minutes access, 7 days refresh)
- Input validation on all endpoints (Zod)
- CORS restricted to frontend domain
- Rate limiting on authentication endpoints
- HTTPS required in production
- User-level data isolation (all queries filtered by userId)
- No sensitive data in logs

## Configuration & Settings

### Environment Variables

**Backend (.env)**:
```bash
# Database
DATABASE_URL=postgresql://budget_user:password@database:5432/budget_tracker

# JWT Secrets
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>

# Node Environment
NODE_ENV=development  # or production

# API Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env)**:
```bash
VITE_API_URL=http://localhost:3000/api/v1
```

### Secrets Management
- Development: `.env` files (not committed to git)
- Production: Environment variables in Docker Compose or container orchestration
- Never commit `.env` files (use `.env.example` as template)

### Build Configuration
- **Backend**: TypeScript compiled to `dist/` folder
- **Frontend**: Vite production build to `dist/` folder
- **Docker**: Multi-stage builds for smaller production images

## Common Commands

### Development (Local)

```bash
# Backend development
cd backend
npm install                 # Install dependencies
npm run dev                 # Start dev server with hot reload
npm run build               # Compile TypeScript
npm run test                # Run tests
npm run lint                # Run ESLint
npx prisma studio           # Open Prisma Studio (database GUI)
npx prisma migrate dev      # Create and apply migration
npx prisma db seed          # Seed database with default data

# Frontend development
cd frontend
npm install                 # Install dependencies
npm run dev                 # Start Vite dev server
npm run build               # Production build
npm run test                # Run tests
npm run lint                # Run ESLint
npm run preview             # Preview production build

# Database operations
cd backend
npx prisma migrate dev --name migration_name  # Create new migration
npx prisma migrate reset    # Reset database (WARNING: deletes all data)
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema changes (dev only)
```

### Docker Operations

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f              # All services
docker-compose logs -f api          # Backend only
docker-compose logs -f app          # Frontend only
docker-compose logs -f database     # Database only

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Run database migrations in container
docker-compose exec api npx prisma migrate deploy

# Database backup
docker exec budget-tracker-db pg_dump -U budget_user budget_tracker > backup.sql

# Database restore
docker exec -i budget-tracker-db psql -U budget_user budget_tracker < backup.sql

# Access container shell
docker-compose exec api sh          # Backend container
docker-compose exec database sh     # Database container

# Remove all containers and volumes (DANGER)
docker-compose down -v
```

### Git Operations

```bash
# Create feature branch
git checkout -b feature/feature-name

# Check status
git status

# Stage and commit
git add .
git commit -m "[Type] Description"

# Push feature branch
git push -u origin feature/feature-name

# Update from main
git checkout main
git pull
git checkout feature/feature-name
git merge main

# Delete merged branch
git branch -d feature/feature-name
```

### Docker Troubleshooting

```bash
# Issue: "Cannot find module" errors (tslib, etc.)
# Solution: Clear Docker volumes and rebuild
docker compose down -v
docker compose build --no-cache
docker compose up -d

# Issue: Stale dependencies in containers
# Solution: Remove volumes to clear cached node_modules
docker compose down -v  # WARNING: Deletes database data too
docker compose up -d --build

# Issue: Prisma binary target mismatch
# Solution: Ensure schema.prisma has correct binaryTargets for Alpine Linux
# schema.prisma should include:
#   binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
# Then rebuild containers

# Issue: OpenSSL errors with Prisma
# Solution: Ensure Dockerfile includes OpenSSL
# Dockerfile should have: RUN apk add --no-cache wget openssl

# View specific container logs
docker compose logs -f api
docker compose logs -f app --tail 100

# Check container resource usage
docker stats

# Access container shell for debugging
docker compose exec api sh
docker compose exec api ls -la node_modules/tslib  # Check if package exists
docker compose exec api npx prisma --version        # Check Prisma version

# Prune all unused Docker resources (careful!)
docker system prune -a --volumes  # Removes all stopped containers, unused images, volumes
```

## Resources & References

### Official Documentation
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Node.js**: https://nodejs.org/
- **Express**: https://expressjs.com/
- **Prisma**: https://www.prisma.io/
- **PostgreSQL**: https://www.postgresql.org/
- **Material-UI**: https://mui.com/
- **Docker**: https://www.docker.com/
- **React Query**: https://tanstack.com/query/
- **FullCalendar**: https://fullcalendar.io/
- **Recharts**: https://recharts.org/
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/

### Project Repository
- **Location**: `/mnt/c/vso/Other/budget-tracker`
- **Git Remote**: [To be added when repository is created]

### Design Files
- Solution Design Document: `/docs/budget-tracker-solution-design.md`
- Architecture diagrams included in solution design

### API Documentation
- **Postman Collection**: `/docs/Budget-Tracker-API.postman_collection.json` - Complete API testing collection (40+ endpoints)
- OpenAPI/Swagger spec: [To be created at `/backend/docs/api-spec.yaml`]
- API will be documented at `/api/docs` endpoint (Swagger UI) [Future]

---

**Last Updated**: January 24, 2026
**Current Phase**: Milestone 6 - Planned Transactions & Forecasting
**Framework/Platform**: React + Node.js + PostgreSQL (Full-Stack TypeScript)
**Status**: Implemented planned transactions (recurring templates and one-off), forecasting service, transaction matching, and calendar integration showing projected balances. Features include: recurrence engine (daily/weekly/fortnightly/monthly/annually), virtual transaction generation, confidence-based matching, match review queue, and visual forecast indicators on calendar (blue tint, dashed borders, ~prefix for projections). Next: Final testing, merge to main, then Milestone 5 (Budget Management).
