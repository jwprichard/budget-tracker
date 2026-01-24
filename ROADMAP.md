# Budget Tracker - Development Roadmap

This roadmap outlines the development milestones for the Budget Tracker application. Each phase builds upon the previous one, with clear deliverables and objectives.

---

## Milestone 1: Foundation & Core Setup

**Objective**: Establish the foundational infrastructure and basic application framework.

### Deliverables
- [x] Docker containerization setup (PostgreSQL, Backend, Frontend) ✓
- [x] Database schema design and Prisma configuration ✓
- [x] Backend API structure with Express.js and TypeScript ✓
- [x] Frontend React application with TypeScript and Vite ✓
- [x] Development environment configuration ✓
- [x] Environment variables and configuration management ✓
- ~~Basic authentication system (JWT-based login)~~ *Deferred - Single user deployment*
- ~~User model and authentication endpoints~~ *Deferred - Single user deployment*
- ~~Initial database migrations~~ *Will be created as needed per feature*

### Technical Components
- Docker Compose configuration
- Prisma schema with core models (Account, Transaction, Category)
- Basic API security (CORS, rate limiting, input validation)
- React Router setup
- Material-UI integration

### Architectural Decision
**Single-User Mode**: Authentication has been deferred to future enhancements. The application will initially be designed for single-user deployment (local/personal use). Multi-user support and authentication will be added later when needed.

---

## Milestone 2: Account & Transaction Management ✅

**Objective**: Enable users to manage accounts and manually enter transactions.

**Status**: COMPLETE (January 5, 2026)
**Branch**: Merged to `main`
**Feature Plan**: `/docs/feature-plans/002-account-transaction-management.md`

### Deliverables
- [x] Account CRUD operations (API + UI) ✓
- [x] Account types (checking, savings, credit card, cash, investment, other) ✓
- [x] Account listing and details views ✓
- [x] Transaction CRUD operations (API + UI) ✓
- [x] Transaction types (income, expense, transfer) ✓
- [x] Transaction entry form with validation ✓
- [x] Transaction listing with filtering and sorting ✓
- [x] Account balance calculation and tracking ✓
- [x] Basic dashboard with account overview ✓
- [x] Responsive layout foundation ✓

### Features
- Create, read, update, delete accounts
- Set initial balance and track current balance
- **Balance adjustment with audit trail** *(Added January 6, 2026)*
- Manual transaction entry (quick add form)
- Transaction status (pending, cleared, reconciled)
- Per-account transaction history
- Consolidated view across all accounts
- Transfer functionality between accounts
- Modern UI with Material-UI theme (Indigo/Pink)
- Date validation (prevents future dates)
- **CSV transaction import** *(Added January 6, 2026 - See Milestone 8)*

---

## Milestone 3: Category System ✅

**Objective**: Implement hierarchical category management for transaction organization.

**Status**: COMPLETE (January 6, 2026)
**Branch**: `feature/category-system` (ready to merge)
**Feature Plan**: `/docs/feature-plans/004-category-system.md`

### Deliverables
- [x] Hierarchical category data model ✓
- [x] Default category seed data (65 categories) ✓
- [x] Category CRUD operations (API + UI) ✓
- [x] Category management interface ✓
- [x] Parent-child category relationships ✓
- [x] Category assignment to transactions ✓
- [x] Category colors and visual identification ✓
- [x] Tree view and grid view for categories ✓
- [x] Subcategory breakdown views ✓

### Features
- Unlimited category hierarchy depth
- Predefined category set (11 parent categories, 54 subcategories)
- Custom user-created categories
- Category editing and reorganization with circular reference prevention
- Visual category indicators (colors/icons)
- CategorySelect component for transaction forms
- Grid and tree view toggle

---

## Milestone 3.5: Smart Categorization & Rules Engine ✅

**Objective**: Implement intelligent automatic category assignment based on configurable rules and bank data.

**Status**: COMPLETE (January 16, 2026)
**Branch**: `main` (merged)
**Dependencies**: Milestone 3 (Category System)

### Deliverables
- [x] Category rule data model and API ✓
- [x] Rule engine architecture (extensible pattern matching with JSON conditions) ✓
- [x] Rule CRUD operations and management UI ✓
- [x] Text-based rule type implementation ✓
- [x] Rule priority and conflict resolution ✓
- [x] Auto-apply rules to new transactions ✓
- [x] Bulk apply rules to existing transactions ✓
- [ ] Amount-based rules *(deferred)*
- [ ] Context-based rules *(deferred)*
- [ ] Rule testing and validation interface *(deferred)*
- [ ] Category suggestions based on transaction history *(deferred)*
- [ ] Rule import/export functionality *(deferred)*
- [x] Performance optimization (batch processing, in-memory caching) ✓

### Implemented Rule Types
1. **Text-Based Rules** ✓
   - [x] Description/merchant/notes contains keyword (case-insensitive/sensitive)
   - [x] Exact match
   - [x] Starts with pattern
   - [x] Ends with pattern
   - Extensible JSON conditions structure for future rule types

2. **Akahu Bank Category Mapping** ✓
   - [x] Automatic category creation from bank data with hierarchical structure
   - [x] Parent-child category relationships from Akahu groups
   - [x] Full category JSON stored in ExternalTransaction for flexibility

### Future Rule Types *(Deferred)*
3. **Amount-Based Rules**
   - Amount range (e.g., $0-$20 → Fast Food)
   - Amount threshold (e.g., >$500 → Rent)
   - Specific amount match

4. **Context-Based Rules**
   - Transaction type (income/expense)
   - Account type
   - Day of week/month
   - Combination rules (AND/OR logic)

5. **Smart Learning Rules**
   - Pattern detection from manual categorizations
   - Suggested rules based on user behavior
   - Confidence scoring

### Implemented Features ✓
- **Rule Management Interface**
  - [x] Visual rule builder (no code required) ✓
  - [x] Priority-based ordering (numeric priority field) ✓
  - [x] Enable/disable individual rules ✓
  - [x] Category selection with hierarchical tree view ✓
  - [x] Rule list with match statistics ✓
  - [ ] Drag-and-drop priority reordering *(deferred)*
  - [ ] Rule testing against sample transactions *(deferred)*

- **Automatic Application**
  - [x] Real-time categorization during transaction entry ✓
  - [x] Automatic categorization during bank sync ✓
  - [x] Batch processing for CSV imports ✓
  - [x] Bulk apply to existing uncategorized transactions ✓
  - [x] Priority-based evaluation (user rules → bank mapping → uncategorized) ✓
  - [ ] Manual review workflow for low-confidence matches *(deferred)*

- **Performance & Architecture**
  - [x] In-memory rule caching with invalidation ✓
  - [x] Batch processing (100 transactions at a time) ✓
  - [x] Extensible JSON conditions structure ✓
  - [x] Match count tracking ✓

### Future Features *(Deferred)*
- **Rule Templates**
  - Pre-built rule sets (common merchants, bills, subscriptions)
  - Community-shared rule templates
  - Rule import/export functionality
  - Industry-standard categorization rules

- **Advanced Features**
  - Rule effectiveness analytics
  - Conflict detection and resolution UI
  - Rule versioning and history
  - A/B testing for rule improvements
  - Suggestion engine for new rules based on patterns

### User Experience
- **First-Time Setup**: Wizard to select common rule templates
- **Quick Add**: Right-click transaction → "Create rule from this"
- **Smart Suggestions**: "We noticed 15 similar transactions. Create a rule?"
- **Bulk Operations**: "Apply all rules to 342 uncategorized transactions"
- **Confidence Indicators**: Visual feedback on rule match certainty

### Technical Implementation
- Rule evaluation engine with caching for performance
- PostgreSQL pattern matching (LIKE, ILIKE, regex)
- Transaction queue for async rule processing
- Redis caching for frequently-used rules (optional)
- Webhook support for external categorization services

### Success Metrics
- 80%+ automatic categorization rate after rule setup
- <100ms rule evaluation time (p95)
- <5% false positive rate
- User satisfaction with suggested categories

---

## Milestone 4: Visualization & Basic Analytics ✅

**Objective**: Provide visual insights into spending patterns and account balances.

**Status**: COMPLETE (January 20, 2026)
**Branch**: Merged to `main`

### Deliverables
- [x] Calendar view with daily balances ✓
- [x] Transaction display on calendar ✓
- [x] Balance status color coding (green/yellow/red) ✓
- [x] Pie charts for category breakdown ✓
- [x] Line/bar charts for trends over time ✓
- [x] Chart customization options (date range, filters) ✓
- [x] Enhanced dashboard with visualizations ✓ (dedicated analytics pages)
- [x] Category totals and percentage calculations ✓
- [x] Spending trends by category ✓

### Features
- Interactive calendar navigation (standalone Calendar page)
- Click-through from calendar to transaction details
- Multi-account view toggle (account filter in sidebar)
- Spending by category pie charts (Spending Analysis page)
- Income vs. expense charts (Trends & Patterns page)
- Balance trend visualization (Trends & Patterns page)
- Date range selection for all charts (sidebar filters)

### Implementation Notes
- Calendar: Standalone page with FullCalendar integration, daily balance display, transaction bars
- Spending Analysis: Tabbed interface with pie chart, bar chart, and detailed table views
- Trends & Patterns: Tabbed interface with spending trends, income vs expense, and balance trend charts
- All analytics pages use collapsible sidebar for filters (date range, accounts, categories)

---

## Milestone 5: Budget Management (Partial)

**Objective**: Enable budget creation and track spending against budgets.

**Status**: PARTIALLY COMPLETE (January 2026)
**Branch**: Merged to `main`

### Deliverables
- [x] Budget data model and API ✓
- [x] Budget CRUD operations ✓
- [x] Budget creation UI for categories ✓
- [x] Budget periods (daily, weekly, fortnightly, monthly, quarterly, annually) ✓
- [x] Budget vs. actual spending comparison ✓
- [x] Budget progress indicators ✓
- [x] Budget performance visualization ✓
- [ ] Budget alerts at configurable thresholds (50%, 80%, 100%)
- [ ] Historical budget comparison
- [ ] Rollover budget options

### Features
- Category-specific budgets ✓
- Per-period budget limits ✓
- Real-time budget tracking ✓
- Variance analysis (spent vs budget vs remaining) ✓
- Budget performance trends (deferred)
- Visual budget progress bars ✓

### Bonus Features Implemented
- Income AND expense budget types
- Budget templates for recurring budgets
- Include subcategories option
- One-time budgets (non-recurring)
- Template-based budget instance generation

---

## Milestone 6: Planned Transactions & Forecasting ✅

**Objective**: Enable planned transactions (recurring and one-off) and provide future balance predictions.

**Status**: COMPLETE (January 2026)
**Branch**: `feature/planned-transactions-forecasting`

### Deliverables
- [x] Planned transaction data models (templates + instances) ✓
- [x] Recurrence pattern engine (daily, weekly, fortnightly, monthly, annually) ✓
- [x] Planned transaction CRUD operations and UI ✓
- [x] One-off planned transactions support ✓
- [x] Virtual transaction generation (on-the-fly future occurrences) ✓
- [x] Day-of-month options (fixed, last day, first/last weekday) ✓
- [x] Balance prediction algorithm ✓
- [x] Cash flow forecasting page ✓
- [x] Future balance projections on calendar ✓
- [x] Transaction matching system (auto, reviewed, manual) ✓
- [x] Match review queue ✓
- [x] Planned transfers support ✓
- [x] Low balance warnings ✓

### Features
- Flexible recurrence patterns with interval support (every N periods)
- Recurring and one-off planned transactions
- Virtual transactions generated without database storage
- Scheduled income, expense, and transfer tracking
- Balance prediction with budget spending integration
- 30, 60, 90, 180, and 365 day forecasts
- Low balance threshold warnings
- Calendar integration with forecast data
- Transaction matching with confidence scoring
- Match dismiss persistence

### Nice-to-Have (Deferred)
- [ ] Skip/pause individual occurrences
- [ ] Edit series vs single occurrence options
- [ ] Automatic pending transaction creation (currently forecast-only)
- [ ] Recurring payment detection from transaction history
- [ ] Confidence intervals on balance predictions
- [ ] Email/push notifications for upcoming bills

---

## Milestone 7: Advanced Analytics & Insights

**Objective**: Provide deeper insights through trend analysis and pattern detection.

### Deliverables
- [ ] Recurring payment detection algorithm
- [ ] Spending trend analysis by category
- [ ] Spending pattern analysis (time-based)
- [ ] Seasonal spending pattern detection
- [ ] Anomaly detection for unusual spending
- [ ] Historical average calculations
- [ ] Category spending velocity metrics
- [ ] Trend projection algorithms
- [ ] Comprehensive analytics dashboard
- [ ] Custom date range analysis

### Features
- Automatic detection of recurring payments from history
- User confirmation workflow for detected patterns
- Month-over-month spending comparisons
- Weekday vs. weekend spending analysis
- Top spending categories identification
- Unusual spending alerts
- Spending heatmaps

---

## Milestone 8: Data Import & Export (Partially Complete)

**Objective**: Enable bulk data entry and data portability.

**Status**: CSV Import completed early (January 6, 2026)
**Branch**: `feature/transaction-import` (ready to merge)
**Feature Plan**: `/docs/feature-plans/003-transaction-import.md`

### Deliverables
- [x] CSV import functionality ✓ *Completed early*
- [x] Column mapping interface ✓ *Completed early*
- [x] Import preview and validation ✓ *Completed early*
- [x] Duplicate transaction detection ✓ *Completed early*
- [ ] Automatic category assignment during import *Pending Milestone 3.5 (Smart Categorization)*
- [ ] Bulk transaction entry interface
- [ ] Transaction duplicate feature
- [ ] Data export functionality (CSV, JSON)
- [ ] Backup/restore capabilities

### CSV Import Features (Completed)
- Multi-step wizard: Upload → Map → Preview → Results
- Smart column auto-detection
- Support for 10 date formats (including 2-digit years)
- Flexible amount sign convention (negative=expense or all positive)
- Duplicate detection based on date + amount + description
- Error handling with detailed validation messages
- Bulk import up to 10,000 transactions
- File size limit: 5MB
- Integration with Account Details page

### Remaining Features
- Data export functionality (CSV, JSON)
- Backup/restore capabilities
- Automatic category assignment during import (requires Milestone 3.5)

---

## Milestone 8.5: Bank Synchronization (Akahu Personal App)

**Objective**: Automate transaction synchronization using Akahu Personal App tier (single account, no OAuth).

**Status**: ✅ COMPLETE (January 7, 2026)
**Dependencies**: Milestone 2 (Accounts & Transactions), Milestone 3 (Categories)
**Feature Plan**: `/docs/feature-plans/005-akahu-personal-app-integration.md`
**Priority**: High - Major time-saver for daily transaction tracking
**Duration**: 5 weeks (actual: 3 weeks)

### Deliverables
- [x] Provider abstraction layer (IBankingDataProvider interface)
- [x] Akahu API client wrapper
- [x] Akahu Personal Provider implementation
- [x] Bank connection and linked account models
- [x] External transaction tracking
- [x] Sync orchestration service
- [x] Intelligent duplicate detection (>90% accuracy)
- [x] Transaction mapping service
- [x] Sync API endpoints
- [x] Sync button and status UI
- [x] Transaction review workflow
- [x] Sync history tracking
- [x] Token encryption utilities
- [x] Manual days back control (UI input)
- [x] Balance reconciliation after sync
- [x] Unlink account functionality
- [x] Frontend polling optimization (5s intervals)

### Features
- Connect personal Akahu account (app token)
- Manual sync trigger from UI
- Automatic account detection
- Link external accounts to local accounts
- Fetch historical transactions (90 days default)
- Smart duplicate detection with confidence scoring
- Auto-import high-confidence matches (≥95%)
- Review workflow for medium-confidence matches (70-94%)
- Sync status indicators
- Sync history and logging
- Error handling and recovery

### Architecture Highlights
- **Provider-agnostic design**: Core sync logic works with any banking provider
- **Easy migration path**: Swap to OAuth provider later without changing app logic
- **Interface-based abstraction**: `IBankingDataProvider` enables future Plaid, TrueLayer, etc.
- **Separation of concerns**: API client → Provider → Sync Service → API Endpoints → UI
- **Encrypted token storage**: AES-256-GCM encryption at rest

### Technical Implementation
- Database models: BankConnection, LinkedAccount, ExternalTransaction, SyncHistory
- Services: AkahuApiClient, AkahuPersonalProvider, SyncService, DuplicateDetectionService, TransactionMappingService
- API routes: `/api/v1/sync/*`
- Frontend components: SyncButton, SyncStatusIndicator, TransactionReviewDialog

### Migration Path to Multi-Account
When upgrading to Akahu OAuth tier:
1. Create `AkahuOAuthProvider` implementing same interface
2. Add OAuth flow UI
3. Update provider factory
4. **No changes needed** to: SyncService, DuplicateDetection, TransactionMapping, API endpoints, or UI components

### Success Metrics
- Sync completion rate > 99%
- Duplicate detection accuracy > 90%
- <5% transactions need manual review
- 80% reduction in manual transaction entry

---

## Milestone 8.6: Enhanced Akahu Data Display ✅

**Objective**: Improve visibility of data already captured from Akahu API without additional API calls or schema changes.

**Status**: COMPLETE (January 13, 2026)
**Branch**: `feature/milestone-8.6-enhanced-akahu-data` (ready to merge)
**Dependencies**: Milestone 8.5 (Akahu Sync) ✅ Complete
**Feature Plan**: `/docs/feature-plans/milestone-8.6-enhanced-akahu-data.md`
**Priority**: Medium - Quick wins for better UX
**Estimated Effort**: Small (2-4 hours)

### Deliverables
- [x] Available balance display (credit cards) ✓
- [x] Account status visual indicators ✓
- [x] Foundation for balance trend charts (future) ✓
- [x] Development tools page for database management ✓ (Bonus feature)

### Features
- **Available Balance**: Show both current and available balance for credit cards
- **Merchant Display**: Extract and prominently display merchant names
- **Account Status Badges**: Visual indicators for closed/inactive accounts
- **Graceful Degradation**: Handle missing data elegantly

### Quick Wins (2-4 hours)
1. Available balance display (30 mins) - High value for credit card users
2. Merchant name extraction and display (1-2 hours) - Better transaction visibility
3. Account status indicators (1 hour) - Edge case handling

### Future Enhancements (Deferred)
- Balance trend charts (requires more complex visualization)
- Merchant spending breakdowns (better with categories)
- Top merchants report

### Technical Notes
- ✅ No schema changes required (data already captured)
- ✅ No additional API calls needed
- ✅ UI-only enhancements
- All data already in `ExternalTransaction.merchant`, `ExternalTransaction.balance`, and `LinkedAccount` status

---

## Milestone 9: Alert & Notification System

**Objective**: Implement configurable alerts and in-app notifications.

### Deliverables
- [ ] Alert rule engine with extensible architecture
- [ ] Alert condition configuration
- [ ] Low balance alerts
- [ ] Upcoming bill alerts
- [ ] Budget threshold alerts
- [ ] In-app notification system
- [ ] Notification bell with badge count
- [ ] Notification panel/drawer
- [ ] Mark as read/unread functionality
- [ ] Notification history
- [ ] Alert management UI
- [ ] User alert preferences

### Features
- Configurable alert thresholds
- Per-account low balance monitoring
- Advance notice for upcoming bills
- Budget overspending alerts
- Notification frequency controls
- Enable/disable individual alerts

---

## Milestone 10: Reporting & Multi-User Support

**Objective**: Generate comprehensive reports and enable multi-user deployment.

### Deliverables
- [ ] Standard report templates (monthly summary, category spending, budget performance)
- [ ] Custom report builder
- [ ] Report generation API
- [ ] Report export (PDF, CSV)
- [ ] User registration system
- [ ] Multi-user data isolation verification
- [ ] User profile management
- [ ] User settings and preferences
- [ ] Per-user customization
- [ ] Dashboard widget customization (drag-and-drop)

### Features
- Monthly/quarterly/annual reports
- Cash flow reports
- Net worth tracking
- Custom date range reports
- Multiple user accounts per deployment
- Individual user data privacy
- Customizable dashboards
- User preference persistence

---

## Milestone 11: Polish & Production Readiness

**Objective**: Optimize performance, enhance UX, and ensure production quality.

### Deliverables
- [ ] Comprehensive testing suite (unit, integration, E2E)
- [ ] Performance optimization (backend)
- [ ] Performance optimization (frontend)
- [ ] Database query optimization and indexing
- [ ] UI/UX refinements based on testing
- [ ] Responsive design improvements (mobile/tablet)
- [ ] Error handling improvements
- [ ] Loading states and user feedback
- [ ] Accessibility improvements (WCAG compliance)
- [ ] Complete API documentation (OpenAPI/Swagger)
- [ ] User documentation and guides
- [ ] Deployment documentation
- [ ] Security audit and fixes
- [ ] Production deployment configuration

### Quality Targets
- Backend test coverage > 80%
- Frontend test coverage > 70%
- API response time < 200ms (p95)
- Frontend load time < 2s
- Zero critical security vulnerabilities

---

## Future Enhancements (Post-MVP)

These features are planned for future releases after the core application is complete and stable.

### Multi-User Support & Authentication (Deferred from Milestone 1)
**Priority**: High - Required before deploying for multiple users

When moving from single-user to multi-user deployment:
- [ ] User registration and login system
- [ ] JWT-based authentication with refresh tokens
- [ ] User model and database schema updates
- [ ] Password hashing with bcrypt (12 rounds minimum)
- [ ] Protected route middleware (backend)
- [ ] Authentication context and protected routes (frontend)
- [ ] User session management
- [ ] Data isolation: Add userId foreign keys to all user-specific tables
- [ ] Data migration: Associate existing data with primary user account
- [ ] Login/registration UI pages

**Note**: Until authentication is implemented, the application operates in single-user mode. All data is accessible without login. This is acceptable for personal/local deployments.

### Advanced Security
- Two-factor authentication (2FA)
- Password reset flows
- Role-based access control (admin, user, read-only)
- Session management improvements
- Security audit logging

### Enhanced Notifications
- Email notifications
- SMS notifications (via Twilio)
- Push notifications (via Firebase)
- Webhook integrations
- Quiet hours configuration

### Attachments & Documentation
- Receipt attachment support
- File upload and storage
- Document management
- Invoice tracking

### Advanced Reporting
- Custom report templates
- Scheduled report generation
- Report sharing
- Data visualization enhancements

### Banking Integrations

**Akahu Integration (Full Multi-Account Tier)**:
- OAuth 2.0 authentication flow
- Multiple bank account connections
- Real-time transaction sync via webhooks
- Automatic balance updates
- Duplicate transaction detection and merging
- Background sync jobs with job queue
- Transaction reconciliation UI
- Webhook signature verification
- AES-256 encrypted token storage
- Comprehensive sync logging
- Account linking interface
- Historical transaction backfill
- WebSocket/SSE for real-time UI updates

**Note**: Currently only personal Akahu app tier is supported (single account, no webhooks). Full multi-account tier with webhooks, OAuth, and advanced features requires upgrade and significant implementation effort (see archived feature plan: `/docs/feature-plans/005-automatic-data-sync-akahu-full-version-archived.md`)

**Other Banking APIs**:
- Plaid API integration (US/Canada)
- TrueLayer (UK/EU)
- Open Banking UK
- Multi-region banking support
- Standardized integration layer

### Mobile Application
- React Native mobile app
- iOS and Android support
- Mobile-specific features
- Push notifications
- Offline support

### Premium Features
- Machine learning-based forecasting
- Investment portfolio tracking
- Tax preparation assistance
- Financial goal planning with milestones
- Debt payoff calculator and strategies
- Multi-currency support with exchange rates
- Advanced investment analytics
- Retirement planning tools

### Platform Integrations
- Export to accounting software (QuickBooks, Xero)
- Third-party API integrations
- Calendar integrations
- Email parsing for bills
- Smart assistant integration (Alexa, Google Assistant)

---

## Implementation Notes

### Dependencies
- Each milestone builds upon previous milestones
- Milestones 1-3 are foundational and should be completed sequentially
- Milestones 4-9 can have some parallel development
- Milestone 10-11 should be completed last

### Development Approach
- Iterative development within each milestone
- User testing after each major milestone
- Continuous integration and deployment
- Regular security reviews
- Performance monitoring throughout

### Success Criteria
Each milestone is considered complete when:
- All deliverables are implemented
- Tests are written and passing
- Documentation is updated
- Code review is completed
- User acceptance testing is passed (where applicable)

---

**Last Updated**: January 25, 2026
**Document Version**: 2.0
**Latest Completion**: Milestone 6 - Planned Transactions & Forecasting (January 25, 2026)
**In Progress**: None (ready for next milestone)
**Recent Changes**:
- Milestone 6 - Planned Transactions & Forecasting ✅ COMPLETE (Jan 25, 2026)
  - Recurring and one-off planned transactions
  - Cash flow forecasting with low balance warnings
  - Calendar integration with future projections
  - Transaction matching system with review queue
  - Planned transfers with correct balance impact
  - Match dismiss persistence
- Milestone 5 - Budget Management marked as PARTIALLY COMPLETE (Jan 20, 2026)
  - Core budget CRUD, periods, progress tracking, visualization all done
  - Remaining: alerts, historical comparison, rollover options
- Milestone 4 - Visualization & Basic Analytics ✅ COMPLETE (Jan 20, 2026)
- UI/UX Improvements: Theme switching (6 palettes), collapsible sidebar layout (Jan 20, 2026)
- Navigation reorganization: Streamlined navbar, Accounts moved to user menu (Jan 20, 2026)
- Milestone 3.5 - Smart Categorization & Rules Engine ✅ COMPLETE (Jan 16, 2026)
- Milestone 8.6 - Enhanced Akahu Data Display ✅ COMPLETE (Jan 13, 2026)
- Milestone 8.5 - Bank Synchronization (Akahu Personal App) ✅ COMPLETE (Jan 12, 2026)
