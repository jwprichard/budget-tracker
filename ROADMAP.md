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

## Milestone 3.5: Smart Categorization & Rules Engine

**Objective**: Implement intelligent automatic category assignment based on configurable rules and machine learning.

**Status**: PLANNED
**Dependencies**: Milestone 3 (Category System)

### Deliverables
- [ ] Category rule data model and API
- [ ] Rule engine architecture (extensible pattern matching)
- [ ] Rule CRUD operations and management UI
- [ ] Multiple rule types implementation
- [ ] Rule priority and conflict resolution
- [ ] Auto-apply rules to new transactions
- [ ] Bulk apply rules to existing transactions
- [ ] Rule testing and validation interface
- [ ] Category suggestions based on transaction history
- [ ] Rule import/export functionality
- [ ] Performance optimization for large rule sets

### Rule Types
1. **Text-Based Rules**
   - Description contains keyword (case-insensitive)
   - Description exact match
   - Regular expression pattern matching
   - Merchant name matching

2. **Amount-Based Rules**
   - Amount range (e.g., $0-$20 → Fast Food)
   - Amount threshold (e.g., >$500 → Rent)
   - Specific amount match

3. **Context-Based Rules**
   - Transaction type (income/expense)
   - Account type
   - Day of week/month
   - Combination rules (AND/OR logic)

4. **Smart Learning Rules** *(Future Enhancement)*
   - Pattern detection from manual categorizations
   - Suggested rules based on user behavior
   - Confidence scoring

### Features
- **Rule Management Interface**
  - Visual rule builder (no code required)
  - Drag-and-drop rule priority ordering
  - Enable/disable individual rules
  - Rule testing against sample transactions
  - Bulk rule import from templates

- **Automatic Application**
  - Real-time categorization during transaction entry
  - Batch processing for CSV imports
  - Background job for uncategorized transactions
  - Manual review workflow for low-confidence matches

- **Rule Templates**
  - Pre-built rule sets (common merchants, bills, subscriptions)
  - Community-shared rule templates
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

## Milestone 4: Visualization & Basic Analytics

**Objective**: Provide visual insights into spending patterns and account balances.

### Deliverables
- [ ] Calendar view with daily balances
- [ ] Transaction display on calendar
- [ ] Balance status color coding (green/yellow/red)
- [ ] Pie charts for category breakdown
- [ ] Line/bar charts for trends over time
- [ ] Chart customization options (date range, filters)
- [ ] Enhanced dashboard with visualizations
- [ ] Category totals and percentage calculations
- [ ] Spending trends by category

### Features
- Interactive calendar navigation
- Click-through from calendar to transaction details
- Multi-account view toggle
- Spending by category pie charts
- Income vs. expense charts
- Balance trend visualization
- Date range selection for all charts

---

## Milestone 5: Budget Management

**Objective**: Enable budget creation and track spending against budgets.

### Deliverables
- [ ] Budget data model and API
- [ ] Budget CRUD operations
- [ ] Budget creation UI for categories
- [ ] Budget periods (weekly, monthly, quarterly, annually, custom)
- [ ] Budget vs. actual spending comparison
- [ ] Budget progress indicators
- [ ] Budget performance visualization
- [ ] Budget alerts at configurable thresholds (50%, 80%, 100%)
- [ ] Historical budget comparison
- [ ] Rollover budget options

### Features
- Category-specific budgets
- Per-period budget limits
- Real-time budget tracking
- Variance analysis
- Budget performance trends
- Visual budget progress bars

---

## Milestone 6: Recurring Transactions & Forecasting

**Objective**: Automate recurring transactions and provide future balance predictions.

### Deliverables
- [ ] Recurring transaction data model
- [ ] Recurrence pattern engine (daily, weekly, monthly, quarterly, etc.)
- [ ] Recurring transaction CRUD operations and UI
- [ ] Automatic transaction generation system
- [ ] Transaction creation modes (pending, automatic, forecast-only)
- [ ] Next occurrence calculation
- [ ] Balance prediction algorithm
- [ ] Cash flow forecasting
- [ ] Future balance projections on calendar
- [ ] Upcoming bills view

### Features
- Flexible recurrence patterns (extensible design)
- Scheduled income and expense tracking
- Automatic pending transaction creation
- Balance prediction with confidence intervals
- 7-day, 30-day, 90-day, and 12-month forecasts
- Low balance warnings
- Recurring payment management

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

**Last Updated**: January 13, 2026
**Document Version**: 1.7
**Latest Completion**: Milestone 8.6 - Enhanced Akahu Data Display (January 13, 2026)
**In Progress**: None (ready for next milestone)
**Recent Changes**:
- Milestone 8.6 - Enhanced Akahu Data Display ✅ COMPLETE (Jan 13, 2026)
- Milestone 8.5 - Bank Synchronization (Akahu Personal App) ✅ COMPLETE (Jan 12, 2026)
- Development Tools page added (Jan 13, 2026) - Database management interface
- Milestone 3.5 - Smart Categorization & Rules Engine (planned)
- Full Akahu OAuth Integration moved to Future Enhancements - requires multi-account tier upgrade
