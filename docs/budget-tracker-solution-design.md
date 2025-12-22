# Budget Tracker Application - Solution Design Document

## 1. Executive Summary

### 1.1 Purpose
A self-hosted web-based budget tracking application that helps users monitor expenses, forecast future cash flow, and ensure sufficient funds are always available. The application provides expense estimation, trend analysis, and comprehensive financial visibility across multiple accounts.

### 1.2 Core Objectives
- Track expenses and income across multiple accounts
- Estimate and forecast future financial positions
- Identify spending patterns and trends
- Alert users to potential cash flow issues
- Provide comprehensive financial visualization

---

## 2. System Architecture

### 2.1 High-Level Architecture
The application follows a three-tier architecture with containerized deployment:

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend App   │ (React Container)
│   (React SPA)   │
└────────┬────────┘
         │
         ▼ REST API
┌─────────────────┐
│   Backend API   │ (Node.js Container)
│   (Node.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │ (Database Container)
│    Database     │
└─────────────────┘
```

### 2.2 Technology Stack

#### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI) - Modern, responsive, extensive component library
- **State Management**: React Context API + React Query for server state
- **Charts**: Recharts for data visualization
- **Calendar**: FullCalendar for the calendar view
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Build Tool**: Vite

**Rationale**: React with TypeScript provides type safety and excellent developer experience. MUI offers a comprehensive component library that works well for both desktop and mobile. React Query handles server state elegantly with caching and optimistic updates.

#### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma (provides database abstraction layer)
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Validation**: Zod for request validation
- **API Documentation**: OpenAPI/Swagger

**Rationale**: Node.js with Express provides a lightweight, fast API server. Prisma offers excellent TypeScript support and a clean abstraction layer that makes switching databases straightforward. TypeScript ensures type safety across the stack.

#### Database
- **Primary Database**: PostgreSQL 16
- **Abstraction**: Prisma ORM (supports PostgreSQL, MySQL, SQLite, SQL Server, MongoDB)
- **Migration Tool**: Prisma Migrate

**Rationale**: PostgreSQL is robust, open-source, and excellent for financial data with ACID compliance. Prisma's abstraction layer means we can switch to MySQL, SQLite, or other databases with minimal code changes.

#### Deployment
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx (optional, for production deployment)

---

## 3. User Management

### 3.1 Initial Implementation
- Single user deployment
- Simple username/password authentication
- JWT-based session management
- Password encryption using bcrypt (12 rounds minimum)

### 3.2 Multi-User Design Considerations
The system is architected to support multiple users:
- User table with unique identifiers
- All data models include userId foreign keys
- Row-level security in data access layer
- User-specific settings and preferences

### 3.3 Future Enhancements
- Multi-user registration and management
- Two-factor authentication (2FA)
- Role-based access control (admin, user, read-only)
- User profile management
- Password reset flows

---

## 4. Core Features

### 4.1 Account Management

#### 4.1.1 Account Types
Users can create and manage multiple financial accounts:
- Checking accounts
- Savings accounts
- Credit cards
- Cash
- Investment accounts
- Other (custom)

#### 4.1.2 Account Properties
- Account name
- Account type/category
- Currency
- Initial balance
- Current balance (calculated)
- Account status (active/inactive)
- Custom categorization/tags

#### 4.1.3 Account Views
- List of all accounts with balances
- Per-account transaction history
- Consolidated view across all accounts
- Account balance trends over time

### 4.2 Transaction Management

#### 4.2.1 Transaction Types
- Expense (money out)
- Income (money in)
- Transfer (between accounts)

#### 4.2.2 Transaction Properties
- Date and time
- Amount
- Category (hierarchical)
- Account
- Description/notes
- Status (pending, cleared, reconciled)
- Receipt/attachment support (future)
- Tags

#### 4.2.3 Transaction Entry Methods

**Phase 1 (Initial Implementation):**
1. **Manual Entry**
   - Quick add form
   - Bulk entry interface
   - Duplicate transaction feature

2. **CSV Import**
   - Support for common bank CSV formats
   - Column mapping interface
   - Automatic category suggestion based on description
   - Preview before import
   - Conflict resolution (duplicate detection)

**Phase 2 (Future Enhancement):**
3. **Banking API Integration**
   - Plaid or similar service
   - Automatic transaction sync
   - Paid/premium feature
   - Bank account linking

### 4.3 Category Management

#### 4.3.1 Category Structure
Hierarchical category system with unlimited depth:
```
Transportation
  ├── Gas
  ├── Public Transit
  └── Car Maintenance
      ├── Oil Changes
      └── Repairs

Food & Dining
  ├── Groceries
  ├── Restaurants
  └── Coffee Shops
```

#### 4.3.2 Category Features
- **Predefined Categories**: Standard set of common categories
- **Custom Categories**: User-created categories
- **Hierarchical Structure**: Parent-child relationships
- **Category Budgets**: Assign budget amounts per category per period
- **Category Colors**: Visual identification
- **Category Rules**: Auto-categorization based on transaction descriptions

#### 4.3.3 Default Categories
```
Income
  ├── Salary
  ├── Freelance
  ├── Investments
  └── Other Income

Housing
  ├── Rent/Mortgage
  ├── Utilities
  ├── Maintenance
  └── Insurance

Transportation
  ├── Gas
  ├── Public Transit
  ├── Car Payment
  └── Maintenance

Food & Dining
  ├── Groceries
  ├── Restaurants
  └── Takeout

Shopping
  ├── Clothing
  ├── Electronics
  └── General

Entertainment
  ├── Streaming Services
  ├── Events
  └── Hobbies

Health & Fitness
  ├── Medical
  ├── Gym
  └── Sports

Personal Care
Bills & Utilities
Insurance
Debt Payments
Savings & Investments
Uncategorized
```

### 4.4 Recurring Transactions

#### 4.4.1 Overview
Allows users to set up recurring income and expenses for forecasting and automatic transaction creation.

#### 4.4.2 Recurrence Patterns
Extensible design supporting:
- **Daily**: Every N days
- **Weekly**: Every N weeks on specific days
- **Biweekly/Fortnightly**: Every 2 weeks
- **Monthly**: Specific day of month or last day
- **Quarterly**: Every 3 months
- **Semi-annually**: Every 6 months
- **Annually**: Specific date each year
- **Custom**: Defined by cron-like expression (future)

#### 4.4.3 Recurrence Properties
- Transaction type (income/expense)
- Amount (fixed or variable)
- Category
- Account
- Start date
- End date (optional)
- Description
- Recurrence pattern
- Next occurrence date (calculated)

#### 4.4.4 Transaction Creation Mode (Configurable per recurring item)
- **Pending/Expected** (Default): Creates pending transactions that require user confirmation
- **Automatic**: Automatically creates cleared transactions
- **Forecast Only**: Used only for projections, no transactions created

#### 4.4.5 Implementation Design
```typescript
// Extensible recurrence pattern
interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom';
  interval: number; // e.g., every 2 weeks
  dayOfWeek?: number[]; // for weekly (0-6)
  dayOfMonth?: number; // for monthly (1-31 or -1 for last day)
  monthOfYear?: number; // for annual (1-12)
  customCron?: string; // for future custom patterns
}

// Each recurrence pattern handler implements:
interface RecurrenceHandler {
  calculateNextOccurrence(lastOccurrence: Date, pattern: RecurrencePattern): Date;
  generateFutureOccurrences(startDate: Date, endDate: Date, pattern: RecurrencePattern): Date[];
}
```

### 4.5 Budget Management

#### 4.5.1 Budget Types
- Category budgets (per category, per period)
- Total spending budget
- Account-specific budgets
- Project/goal-based budgets

#### 4.5.2 Budget Periods
- Weekly
- Monthly
- Quarterly
- Annually
- Custom date range

#### 4.5.3 Budget vs Actual Analysis
- Current period progress
- Historical comparison
- Variance analysis
- Budget performance trends
- Rollover options (unused budget carries over)

---

## 5. Analysis & Forecasting Features

### 5.1 Feature: Balance Prediction

#### 5.1.1 Purpose
Predict when account balances might run low or negative based on recurring expenses and historical spending patterns.

#### 5.1.2 Functionality
- Calculate future balance on any given date
- Identify potential cash flow issues
- Consider recurring transactions
- Factor in average spending by category
- Show confidence intervals for predictions

#### 5.1.3 Algorithm Approach
```
Future Balance = Current Balance 
                + Scheduled Income 
                - Scheduled Expenses 
                - Estimated Variable Spending (based on historical average)
```

### 5.2 Feature: Trend Identification

#### 5.2.1 Purpose
Identify spending patterns and trends over time to understand financial behavior.

#### 5.2.2 Analysis Types
- Spending trends by category (increasing/decreasing)
- Spending trends by time period (weekday vs weekend, month-over-month)
- Seasonal patterns
- Unusual spending detection (anomalies)
- Average daily/weekly/monthly spending

#### 5.2.3 Visualization
- Line charts showing spending trends
- Heatmaps for spending patterns
- Comparison charts (this month vs last month)

### 5.3 Feature: Recurring Payment Detection

#### 5.3.1 Purpose
Automatically identify recurring payments from transaction history to help users set up recurring transactions.

#### 5.3.2 Detection Algorithm
- Identify transactions with similar amounts
- Identify transactions with similar descriptions
- Detect regular time intervals (weekly, monthly, etc.)
- Minimum occurrences threshold (e.g., 3 times)
- Confidence scoring

#### 5.3.3 User Workflow
- System suggests potential recurring transactions
- User reviews and confirms/rejects
- User can modify detected pattern
- Confirmed recurring transactions are created

### 5.4 Feature: Expense Forecasting

#### 5.4.1 Purpose
Predict future expenses based on historical data and known recurring transactions.

#### 5.4.2 Forecasting Methods
- **Recurring Transactions**: Include all known recurring expenses
- **Historical Averages**: Calculate average spending per category
- **Trend Projection**: Project trends forward
- **Seasonal Adjustments**: Account for seasonal variations

#### 5.4.3 Time Horizons
- Next 7 days
- Next 30 days
- Next 90 days
- Next 12 months
- Custom date range

### 5.5 Feature: Budget vs Actual Comparison

#### 5.5.1 Purpose
Compare planned budgets against actual spending to track financial discipline.

#### 5.5.2 Metrics
- Spending by category vs budget
- Overall spending vs total budget
- Percentage of budget used
- Days remaining in period
- Projected end-of-period position

#### 5.5.3 Alerts
- 50% of budget reached
- 80% of budget reached
- Budget exceeded
- On track to exceed budget

### 5.6 Feature: Category Totals & Analysis

#### 5.6.1 Purpose
Provide detailed breakdown of spending and income by category.

#### 5.6.2 Views
- Category totals for selected period
- Category percentage of total spending
- Category trends over time
- Category comparison across periods
- Subcategory breakdown

#### 5.6.3 Insights
- Top spending categories
- Unusual category spending
- Category budget performance
- Category spending velocity

---

## 6. Visualization & Reporting

### 6.1 Calendar View (Must-Have)

#### 6.1.1 Purpose
Visual representation of current and estimated balances with transactions on a calendar.

#### 6.1.2 Features
- Daily balance display (actual and projected)
- Transaction indicators on each day
- Color coding for balance status:
  - Green: Healthy balance
  - Yellow: Warning threshold
  - Red: Low or negative balance
- Click on day to see transactions
- Pending vs cleared transaction distinction
- Multi-account view toggle

#### 6.1.3 Interaction
- Navigate months/years
- Zoom to week/month/quarter view
- Filter by account
- Filter by transaction type
- Click transaction to edit

### 6.2 Pie Charts (Must-Have)

#### 6.2.1 Use Cases
- Spending by category
- Income by source
- Account balance distribution
- Budget allocation

#### 6.2.2 Customization Settings
- Date range selection
- Category level (top-level vs all levels)
- Include/exclude transfers
- Include/exclude pending transactions
- Minimum percentage threshold (hide small slices)

### 6.3 Line/Bar Charts (Must-Have)

#### 6.3.1 Use Cases
- Spending over time
- Income over time
- Balance trends
- Category trends
- Budget performance

#### 6.3.2 Chart Types
- Line charts for trends
- Bar charts for comparisons
- Stacked charts for category breakdown
- Combined line+bar for income vs expenses

#### 6.3.3 Customization Settings
- Date range and granularity (daily/weekly/monthly/yearly)
- Accounts to include
- Categories to include
- Chart type selection
- Y-axis scale (linear/logarithmic)

### 6.4 Report Generation

#### 6.4.1 Standard Reports
- Monthly summary report
- Category spending report
- Budget performance report
- Net worth report (all accounts)
- Cash flow report

#### 6.4.2 Custom Reports
- User-defined date ranges
- Custom category selections
- Custom metrics
- Report templates

### 6.5 Dashboard

#### 6.5.1 Overview Dashboard
- Current total balance (all accounts)
- Monthly spending vs budget
- Upcoming bills (next 7 days)
- Recent transactions
- Quick add transaction
- Balance trend (last 30 days)
- Top spending categories

#### 6.5.2 Customization
- Widget-based dashboard
- Drag-and-drop arrangement
- Show/hide widgets
- Widget settings

---

## 7. Alerts & Notifications

### 7.1 Architecture Design

#### 7.1.1 Alert System Components
```
┌──────────────────┐
│  Alert Engine    │ (Evaluates conditions)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Notification     │ (Handles delivery)
│ Service          │
└────────┬─────────┘
         │
         ├──────────► In-App Notifications (Phase 1)
         ├──────────► Email (Phase 2)
         ├──────────► SMS (Phase 3)
         └──────────► Push Notifications (Phase 3)
```

#### 7.1.2 Extensible Alert Rules
```typescript
interface AlertRule {
  id: string;
  userId: string;
  name: string;
  type: AlertType;
  condition: AlertCondition;
  enabled: boolean;
  notificationChannels: NotificationChannel[];
  frequency: AlertFrequency;
  lastTriggered?: Date;
}

type AlertType = 
  | 'low_balance'
  | 'upcoming_bill'
  | 'budget_threshold'
  | 'unusual_spending'
  | 'recurring_payment_due'
  | 'custom';

interface AlertCondition {
  // Flexible condition structure
  field: string;
  operator: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
  value: number | string;
  // For complex conditions
  logicalOperator?: 'and' | 'or';
  subConditions?: AlertCondition[];
}
```

### 7.2 Initial Alert Types (Phase 1)

#### 7.2.1 Low Balance Alert
- Trigger when account balance falls below threshold
- Configurable threshold per account
- Frequency: Once per day maximum

#### 7.2.2 Upcoming Bill Alert
- Trigger N days before recurring payment
- Configurable lead time (default: 3 days)
- Shows amount and account to be charged

#### 7.2.3 Budget Threshold Alert
- Trigger at 50%, 80%, 100% of budget
- Configurable thresholds
- Per category or overall

### 7.3 Notification Delivery

#### 7.3.1 In-App Notifications (Phase 1)
- Notification bell icon with badge count
- Notification panel/drawer
- Mark as read/unread
- Clear all option
- Notification history

#### 7.3.2 Future Channels (Phase 2+)
- Email notifications
- SMS notifications (via Twilio)
- Push notifications (via Firebase)
- Webhook integrations

### 7.4 User Configuration
- Enable/disable individual alerts
- Set alert thresholds
- Choose notification channels
- Set quiet hours
- Notification frequency preferences

---

## 8. Data Models

### 8.1 Core Database Schema

```prisma
// Prisma Schema

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  transactions  Transaction[]
  categories    Category[]
  budgets       Budget[]
  recurringTransactions RecurringTransaction[]
  alerts        Alert[]
  settings      UserSettings?
}

model Account {
  id          String    @id @default(uuid())
  userId      String
  name        String
  type        String    // checking, savings, credit, cash, investment, other
  category    String?   // Custom categorization
  currency    String    @default("USD")
  initialBalance Decimal @db.Decimal(15, 2)
  currentBalance Decimal @db.Decimal(15, 2)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
  transactions Transaction[]
  recurringTransactions RecurringTransaction[]
  
  @@index([userId])
}

model Category {
  id          String    @id @default(uuid())
  userId      String
  name        String
  parentId    String?   // For hierarchical structure
  color       String?
  icon        String?
  isDefault   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  transactions Transaction[]
  budgets     Budget[]
  recurringTransactions RecurringTransaction[]
  
  @@index([userId])
  @@index([parentId])
}

model Transaction {
  id          String    @id @default(uuid())
  userId      String
  accountId   String
  categoryId  String?
  type        String    // income, expense, transfer
  amount      Decimal   @db.Decimal(15, 2)
  date        DateTime
  description String
  notes       String?
  status      String    @default("cleared") // pending, cleared, reconciled
  isPending   Boolean   @default(false)
  tags        String[]
  
  transferToAccountId String? // For transfers
  recurringTransactionId String? // If generated from recurring
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
  account     Account   @relation(fields: [accountId], references: [id])
  category    Category? @relation(fields: [categoryId], references: [id])
  recurringTransaction RecurringTransaction? @relation(fields: [recurringTransactionId], references: [id])
  
  @@index([userId])
  @@index([accountId])
  @@index([categoryId])
  @@index([date])
}

model RecurringTransaction {
  id          String    @id @default(uuid())
  userId      String
  accountId   String
  categoryId  String?
  type        String    // income, expense
  amount      Decimal   @db.Decimal(15, 2)
  description String
  
  // Recurrence configuration
  recurrenceType String // daily, weekly, biweekly, monthly, quarterly, semiannual, annual, custom
  recurrenceInterval Int @default(1)
  dayOfWeek   Int[]     // For weekly
  dayOfMonth  Int?      // For monthly
  monthOfYear Int?      // For annual
  customCron  String?   // For custom patterns
  
  startDate   DateTime
  endDate     DateTime?
  nextOccurrence DateTime
  
  transactionMode String @default("pending") // pending, automatic, forecast_only
  
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
  account     Account   @relation(fields: [accountId], references: [id])
  category    Category? @relation(fields: [categoryId], references: [id])
  generatedTransactions Transaction[]
  
  @@index([userId])
  @@index([nextOccurrence])
}

model Budget {
  id          String    @id @default(uuid())
  userId      String
  categoryId  String
  amount      Decimal   @db.Decimal(15, 2)
  period      String    // weekly, monthly, quarterly, annual, custom
  startDate   DateTime
  endDate     DateTime?
  rollover    Boolean   @default(false)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
  category    Category  @relation(fields: [categoryId], references: [id])
  
  @@index([userId])
  @@index([categoryId])
}

model Alert {
  id          String    @id @default(uuid())
  userId      String
  name        String
  type        String    // low_balance, upcoming_bill, budget_threshold, unusual_spending, custom
  condition   Json      // Flexible condition structure
  enabled     Boolean   @default(true)
  notificationChannels String[] // in_app, email, sms, push
  frequency   String    @default("once_per_day")
  lastTriggered DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
  notifications Notification[]
  
  @@index([userId])
}

model Notification {
  id          String    @id @default(uuid())
  alertId     String
  userId      String
  title       String
  message     String
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())
  
  alert       Alert     @relation(fields: [alertId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
}

model UserSettings {
  id          String    @id @default(uuid())
  userId      String    @unique
  currency    String    @default("USD")
  dateFormat  String    @default("MM/DD/YYYY")
  theme       String    @default("light")
  
  // Notification settings
  emailNotifications Boolean @default(false)
  smsNotifications Boolean @default(false)
  pushNotifications Boolean @default(false)
  
  // Privacy settings
  dataExportEnabled Boolean @default(true)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
}
```

### 8.2 Data Access Layer

All database access goes through Prisma ORM, providing:
- Type-safe database queries
- Automatic migrations
- Database-agnostic queries
- Transaction support
- Query optimization

Service layer pattern:
```typescript
// Example service structure
class TransactionService {
  constructor(private prisma: PrismaClient) {}
  
  async create(userId: string, data: CreateTransactionDto) {
    // Business logic and validation
    // Prisma query
    return this.prisma.transaction.create({...});
  }
  
  async getUserTransactions(userId: string, filters: TransactionFilters) {
    // Query with user isolation
    return this.prisma.transaction.findMany({
      where: { userId, ...filters }
    });
  }
}
```

---

## 9. API Design

### 9.1 API Structure

RESTful API with the following structure:

```
/api/v1
  /auth
    POST   /register
    POST   /login
    POST   /logout
    POST   /refresh
    GET    /me
  
  /accounts
    GET    /
    POST   /
    GET    /:id
    PUT    /:id
    DELETE /:id
    GET    /:id/balance-history
    GET    /:id/transactions
  
  /transactions
    GET    /
    POST   /
    POST   /bulk
    GET    /:id
    PUT    /:id
    DELETE /:id
    POST   /import/csv
  
  /categories
    GET    /
    POST   /
    GET    /:id
    PUT    /:id
    DELETE /:id
    GET    /:id/transactions
    GET    /:id/spending-analysis
  
  /recurring-transactions
    GET    /
    POST   /
    GET    /:id
    PUT    /:id
    DELETE /:id
    POST   /:id/generate-next
    GET    /suggested (auto-detection)
  
  /budgets
    GET    /
    POST   /
    GET    /:id
    PUT    /:id
    DELETE /:id
    GET    /:id/performance
  
  /analytics
    GET    /balance-prediction
    GET    /spending-trends
    GET    /category-totals
    GET    /budget-vs-actual
    POST   /forecast
  
  /alerts
    GET    /
    POST   /
    GET    /:id
    PUT    /:id
    DELETE /:id
  
  /notifications
    GET    /
    PUT    /:id/read
    PUT    /mark-all-read
    DELETE /:id
  
  /reports
    POST   /generate
    GET    /:id
  
  /settings
    GET    /
    PUT    /
```

### 9.2 Authentication

- JWT-based authentication
- Access token (short-lived, 15 minutes)
- Refresh token (long-lived, 7 days)
- Tokens include userId claim
- All protected routes require valid access token
- Refresh endpoint to get new access token

### 9.3 Request/Response Format

#### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

#### Pagination
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalPages": 10,
    "totalItems": 500
  }
}
```

### 9.4 API Security

- All endpoints use HTTPS in production
- Rate limiting (100 requests per 15 minutes per user)
- Input validation on all endpoints
- SQL injection protection via Prisma
- XSS protection via input sanitization
- CORS configuration for frontend domain only
- Request size limits
- Helmet.js for security headers

---

## 10. Frontend Architecture

### 10.1 Component Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── ...
│   ├── layout/
│   │   ├── AppBar/
│   │   ├── Sidebar/
│   │   ├── Layout/
│   │   └── ...
│   ├── transactions/
│   │   ├── TransactionList/
│   │   ├── TransactionForm/
│   │   ├── TransactionItem/
│   │   └── ...
│   ├── accounts/
│   ├── categories/
│   ├── budgets/
│   ├── recurring/
│   ├── analytics/
│   │   ├── CalendarView/
│   │   ├── PieChart/
│   │   ├── LineChart/
│   │   └── ...
│   └── notifications/
├── pages/
│   ├── Dashboard/
│   ├── Transactions/
│   ├── Accounts/
│   ├── Categories/
│   ├── Budgets/
│   ├── Analytics/
│   └── Settings/
├── hooks/
│   ├── useAuth.ts
│   ├── useTransactions.ts
│   ├── useAccounts.ts
│   └── ...
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── transaction.service.ts
│   └── ...
├── contexts/
│   ├── AuthContext.tsx
│   └── ...
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── ...
└── types/
    ├── transaction.ts
    ├── account.ts
    └── ...
```

### 10.2 State Management

#### Server State (React Query)
- API data caching
- Automatic refetching
- Optimistic updates
- Background synchronization

#### Client State (Context API)
- Authentication state
- User preferences
- UI state (sidebar open/closed, etc.)
- Theme settings

### 10.3 Routing

React Router v6 for client-side routing:

```
/ - Dashboard
/transactions - Transaction list
/transactions/new - Add transaction
/transactions/:id - Transaction details
/accounts - Account list
/accounts/:id - Account details
/categories - Category management
/budgets - Budget overview
/recurring - Recurring transactions
/analytics - Analytics dashboard
/analytics/calendar - Calendar view
/analytics/trends - Trend analysis
/settings - User settings
/login - Login page
/register - Registration page (future)
```

### 10.4 Responsive Design

#### Breakpoints
- Mobile: < 600px
- Tablet: 600px - 960px
- Desktop: > 960px

#### Desktop-First Approach
- Primary development for desktop (> 960px)
- Progressive enhancement for mobile
- Touch-friendly targets for mobile
- Responsive tables (convert to cards on mobile)
- Collapsible sidebar on mobile

---

## 11. Deployment Architecture

### 11.1 Docker Compose Configuration

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  database:
    image: postgres:16-alpine
    container_name: budget-tracker-db
    environment:
      POSTGRES_DB: budget_tracker
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - budget-tracker-network
    restart: unless-stopped

  # Backend API
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: budget-tracker-api
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@database:5432/budget_tracker
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
    depends_on:
      - database
    ports:
      - "3000:3000"
    networks:
      - budget-tracker-network
    restart: unless-stopped

  # Frontend App
  app:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: budget-tracker-app
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
    depends_on:
      - api
    ports:
      - "80:80"
    networks:
      - budget-tracker-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  budget-tracker-network:
    driver: bridge
```

### 11.2 Environment Variables

```bash
# .env file
DB_USER=budget_user
DB_PASSWORD=<strong-password>
JWT_SECRET=<jwt-secret-key>
JWT_REFRESH_SECRET=<jwt-refresh-secret-key>
```

### 11.3 Deployment Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Database backup
docker exec budget-tracker-db pg_dump -U budget_user budget_tracker > backup.sql

# Database restore
docker exec -i budget-tracker-db psql -U budget_user budget_tracker < backup.sql
```

### 11.4 Container Details

#### Database Container
- PostgreSQL 16 Alpine (lightweight)
- Persistent volume for data
- Automatic restart

#### API Container
- Node.js 20 Alpine
- Multi-stage build (smaller image)
- Prisma client generation during build
- Automatic database migrations on startup
- Health check endpoint

#### App Container
- Nginx Alpine to serve static files
- Production-optimized Vite build
- Gzip compression enabled
- Security headers configured

---

## 12. Development Workflow

### 12.1 Project Setup

```bash
# Clone repository
git clone <repo-url>
cd budget-tracker

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Initialize database
cd backend
npx prisma migrate dev
npx prisma db seed  # Seed default categories

# Start development servers
cd backend
npm run dev  # API on localhost:3000

cd frontend
npm run dev  # Frontend on localhost:5173
```

### 12.2 Development Environment

#### Backend Development
- TypeScript with hot reload (ts-node-dev)
- Prisma Studio for database inspection
- API testing with Thunder Client/Postman
- ESLint and Prettier for code formatting

#### Frontend Development
- Vite dev server with HMR
- React DevTools
- Redux DevTools (if needed)
- ESLint and Prettier

### 12.3 Testing Strategy

#### Backend Testing
- **Unit Tests**: Jest for service layer
- **Integration Tests**: Supertest for API endpoints
- **Database Tests**: In-memory SQLite for fast tests
- Coverage target: 80%

#### Frontend Testing
- **Unit Tests**: Vitest for utilities and hooks
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright (future)
- Coverage target: 70%

### 12.4 CI/CD Pipeline (Future)

```yaml
# GitHub Actions example
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm test
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: docker-compose build
```

---

## 13. Security Considerations

### 13.1 Authentication & Authorization
- Passwords hashed with bcrypt (12 rounds minimum)
- JWT tokens with short expiration
- Refresh token rotation
- Secure token storage (httpOnly cookies for refresh tokens)
- Rate limiting on authentication endpoints

### 13.2 Data Protection
- All sensitive data encrypted at rest (database level)
- HTTPS required in production
- Secure headers (CSP, HSTS, X-Frame-Options)
- Input validation and sanitization
- SQL injection protection via Prisma
- XSS protection

### 13.3 API Security
- CORS restricted to frontend domain
- Rate limiting per user
- Request size limits
- API key for internal services (future)
- Audit logging for sensitive operations

### 13.4 Database Security
- User-level data isolation (userId in all queries)
- Prepared statements via Prisma
- Regular backups
- Database user with minimal privileges
- No direct database access from frontend

---

## 14. Performance Optimization

### 14.1 Backend Performance
- Database indexing on frequently queried fields
- Query optimization with Prisma
- Response caching for analytics endpoints
- Pagination for large datasets
- Connection pooling

### 14.2 Frontend Performance
- Code splitting by route
- Lazy loading of components
- Image optimization
- React Query caching
- Memoization of expensive calculations
- Virtual scrolling for long lists

### 14.3 Database Performance
- Appropriate indexes on foreign keys
- Composite indexes for common queries
- Periodic VACUUM for PostgreSQL
- Query performance monitoring
- Connection pooling

---

## 15. Monitoring & Logging

### 15.1 Application Logging
- Winston for structured logging
- Log levels: ERROR, WARN, INFO, DEBUG
- Request/response logging
- Error stack traces
- User action audit log

### 15.2 Health Checks
- API health endpoint: `/api/health`
- Database connection check
- Memory and CPU usage
- Uptime monitoring

### 15.3 Metrics (Future)
- Prometheus for metrics collection
- Grafana for visualization
- Request duration
- Error rates
- Active users

---

## 16. Feature Roadmap

### Phase 1: MVP (Weeks 1-4)
**Core functionality for single user**

Week 1-2: Foundation
- Docker setup
- Database schema and migrations
- Authentication (login only)
- Account management (CRUD)
- Basic transaction entry (manual)

Week 3-4: Core Features
- Category management (hierarchical)
- Transaction listing and filtering
- Basic dashboard
- Account balance calculation
- Responsive layout foundation

### Phase 2: Analysis & Visualization (Weeks 5-8)

Week 5-6: Visualizations
- Calendar view with balance projection
- Pie charts for category breakdown
- Line/bar charts for trends
- Dashboard enhancements

Week 7-8: Analytics
- Balance prediction algorithm
- Spending trend analysis
- Category totals and analysis
- Budget vs actual comparison

### Phase 3: Advanced Features (Weeks 9-12)

Week 9-10: Recurring & Forecasting
- Recurring transaction setup
- Recurring payment detection
- Expense forecasting
- Budget management

Week 11-12: Imports & Alerts
- CSV import functionality
- Basic alert system
- In-app notifications
- Alert rule configuration

### Phase 4: Multi-User & Polish (Weeks 13-16)

Week 13-14: Multi-User
- User registration
- User management
- Data isolation verification
- User settings

Week 15-16: Polish & Testing
- UI/UX refinements
- Performance optimization
- Comprehensive testing
- Documentation
- Bug fixes

### Future Enhancements (Post-MVP)

**Phase 5: Advanced Features**
- Two-factor authentication (2FA)
- Data export functionality
- Automated backups
- Email notifications
- SMS notifications (Twilio)
- Receipt attachments
- Advanced reporting
- Custom report builder

**Phase 6: Integrations**
- Banking API integration (Plaid)
- Export to accounting software
- Third-party integrations
- Webhook support
- Mobile app (React Native)

**Phase 7: Premium Features**
- Advanced forecasting (ML-based)
- Investment tracking
- Tax preparation assistance
- Financial goal planning
- Debt payoff calculator
- Net worth tracking
- Multi-currency support

---

## 17. Development Guidelines

### 17.1 Code Standards

#### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Interfaces for data structures
- Avoid `any` type
- Use enums for fixed sets of values

#### React
- Functional components with hooks
- PropTypes or TypeScript interfaces
- Component composition over inheritance
- Custom hooks for reusable logic
- Memoization for expensive operations

#### API
- RESTful conventions
- Consistent naming (camelCase for JSON)
- Proper HTTP status codes
- Error handling middleware
- Request validation

#### Database
- Descriptive table and column names
- Proper foreign key constraints
- Indexes on frequently queried fields
- Migration files for all schema changes
- Seed data for development

### 17.2 Git Workflow

```bash
# Branch naming
feature/feature-name
bugfix/bug-description
hotfix/urgent-fix

# Commit message format
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Example:
feat(transactions): add CSV import functionality
fix(api): resolve balance calculation error
```

### 17.3 Documentation

- README.md with setup instructions
- API documentation (OpenAPI/Swagger)
- Inline code comments for complex logic
- Component documentation (Storybook future)
- Database schema diagram
- Architecture decision records

---

## 18. Success Metrics

### 18.1 Technical Metrics
- API response time < 200ms (p95)
- Frontend load time < 2s
- Database query time < 50ms (p95)
- Uptime > 99.5%
- Test coverage > 80% (backend), > 70% (frontend)

### 18.2 User Metrics
- Time to add transaction < 30 seconds
- Successful budget prediction accuracy > 80%
- User retention rate
- Feature adoption rate
- Error rate < 1%

---

## 19. Risk Assessment

### 19.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss | High | Low | Regular backups, persistent volumes |
| Security breach | High | Medium | Security best practices, regular updates |
| Performance issues | Medium | Medium | Load testing, optimization, caching |
| Database migration failures | Medium | Low | Test migrations, backup before migration |
| Third-party API issues | Low | Medium | Graceful degradation, error handling |

### 19.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Feature creep | Medium | High | Clear roadmap, phased approach |
| Scope expansion | Medium | High | MVP focus, future enhancement list |
| User adoption | Medium | Medium | User testing, iterative improvements |
| Banking API costs | Low | Low | Start with manual entry, add later |

---

## 20. Appendices

### 20.1 Glossary

- **Transaction**: A single financial event (income, expense, or transfer)
- **Recurring Transaction**: A template for automatically creating transactions
- **Category**: A classification for transactions (hierarchical)
- **Budget**: A spending limit for a category over a time period
- **Account**: A financial account (bank, credit card, cash, etc.)
- **Alert**: A condition-based notification trigger
- **Forecast**: Prediction of future financial position
- **Balance Projection**: Estimated account balance on a future date

### 20.2 Technology References

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

### 20.3 File Structure Overview

```
budget-tracker/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── types/
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docker-compose.yml
├── .env.example
├── README.md
└── .gitignore
```

---

## 21. Conclusion

This solution design document provides a comprehensive blueprint for building a self-hosted budget tracker application. The architecture is designed to be:

- **Extensible**: Easy to add new features and modify existing ones
- **Maintainable**: Clean code structure with separation of concerns
- **Scalable**: Can grow from single-user to multi-user
- **Secure**: Built with security best practices from the ground up
- **User-Friendly**: Intuitive interface with powerful features

The phased development approach ensures that core functionality is delivered first, with advanced features added incrementally. The technology stack is modern, well-supported, and suitable for both development and production deployment.

---

**Document Version**: 1.0  
**Last Updated**: October 27, 2025  
**Status**: Ready for Implementation
