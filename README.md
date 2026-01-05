# Budget Tracker

A self-hosted web-based budget tracking application that helps users monitor expenses, forecast future cash flow, and ensure sufficient funds are always available through expense estimation, trend analysis, and comprehensive financial visibility across multiple accounts.

## Features

### Currently Available ✅
- **Multi-Account Management**: Create and manage checking, savings, credit card, cash, investment, and other accounts
- **Transaction Tracking**: Record income, expenses, and transfers with validation
- **CSV Import**: Bulk import transactions from bank CSV files with smart column mapping
- **Balance Calculation**: Real-time balance tracking across all accounts
- **Balance Adjustment**: Update account balances with full audit trail via adjustment transactions
- **Transaction History**: View and filter transactions per account or across all accounts
- **Modern Dashboard**: Account overview with balances and recent transactions
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Planned Features 🚧
- **Category System**: Hierarchical categories for organizing transactions
- **Budget Management**: Set and track budgets by category
- **Visual Analytics**: Calendar views, pie charts, and trend visualizations
- **Recurring Transactions**: Automate regular income and expenses
- **Balance Forecasting**: Predict future cash flow based on patterns
- **Alerts & Notifications**: Get notified about low balances and upcoming bills
- **Advanced Analytics**: Spending trends and pattern analysis

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) 6
- **State Management**: React Context API + React Query
- **Charts**: Recharts
- **Calendar**: FullCalendar
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js with TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Production Web Server**: Nginx

## Prerequisites

- **Docker**: v24+ (with BuildKit support)
- **Docker Compose**: v2+
- OR for local development:
  - Node.js 20 LTS
  - PostgreSQL 16
  - npm 10+

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd budget-tracker
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your desired passwords
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/health
   - Database: localhost:5432

5. **View logs**
   ```bash
   docker compose logs -f
   ```

6. **Stop all services**
   ```bash
   docker compose down
   ```

## Local Development (Without Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database connection

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server (with hot reload)
npm run dev
```

The backend API will be available at http://localhost:3000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server (with hot reload)
npm run dev
```

The frontend will be available at http://localhost:5173

## Project Structure

```
budget-tracker/
├── backend/                 # Backend API (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── middlewares/    # Express middlewares
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utilities
│   │   └── types/          # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   ├── Dockerfile
│   └── package.json
├── frontend/               # Frontend app (React + TypeScript)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript types
│   ├── Dockerfile
│   ├── nginx.conf          # Production Nginx config
│   └── package.json
├── docs/                   # Documentation
│   ├── budget-tracker-solution-design.md
│   └── feature-plans/
├── docker-compose.yml      # Docker orchestration
├── .env.example            # Environment variable template
├── ROADMAP.md              # Development roadmap
└── README.md               # This file
```

## Environment Variables

### Docker Compose (.env)
```bash
# PostgreSQL Configuration
POSTGRES_USER=budget_user
POSTGRES_PASSWORD=budget_password
POSTGRES_DB=budget_tracker

# Port Mappings
POSTGRES_PORT=5432
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

### Backend (.env)
```bash
DATABASE_URL=postgresql://budget_user:budget_password@localhost:5432/budget_tracker
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
API_VERSION=v1
```

### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:3000/api
```

## Available Commands

### Docker Commands
```bash
# Start all services
docker compose up -d

# Start with rebuild
docker compose up -d --build

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f api
docker compose logs -f app
docker compose logs -f database

# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes database data)
docker compose down -v

# Restart a service
docker compose restart api

# Access container shell
docker compose exec api sh
docker compose exec app sh
```

### Backend Commands
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format with Prettier
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
```

### Frontend Commands
```bash
npm run dev       # Start Vite dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run lint:fix  # Fix ESLint errors
npm run format    # Format with Prettier
```

## API Documentation

The API follows RESTful conventions. Once the backend is running, you can access:

- **Health Check**: `GET /api/health`
- **API Documentation**: `/api/docs` (Swagger UI - to be added)

## Database Management

### Migrations
```bash
# Create a new migration
cd backend
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Backup & Restore
```bash
# Backup database
docker exec budget-tracker-db pg_dump -U budget_user budget_tracker > backup.sql

# Restore database
docker exec -i budget-tracker-db psql -U budget_user budget_tracker < backup.sql
```

## Development Workflow

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Make changes with incremental commits
3. Update documentation
4. Test locally
5. Create pull request
6. Merge after review

See [claude.md](claude.md) for detailed development guidelines.

## Troubleshooting

### Docker Issues

**Containers won't start:**
- Check if ports 3000, 5173, or 5432 are already in use
- Verify Docker and Docker Compose are installed: `docker --version` and `docker compose version`
- Check logs: `docker compose logs`

**Database connection errors:**
- Ensure database container is healthy: `docker compose ps`
- Check DATABASE_URL in backend .env file
- Wait for database to fully initialize (check logs)

**Hot reload not working:**
- Verify volume mounts in docker-compose.yml
- On Windows/WSL, ensure polling is enabled in vite.config.ts

### Local Development Issues

**Backend won't start:**
- Ensure PostgreSQL is running
- Verify DATABASE_URL is correct
- Run `npm run prisma:generate`
- Check if port 3000 is available

**Frontend won't start:**
- Verify VITE_API_URL is set
- Check if port 5173 is available
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**TypeScript errors:**
- Run `npm install` to ensure types are installed
- Check tsconfig.json settings
- Restart your IDE/editor

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write or update tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Documentation

- [Solution Design Document](docs/budget-tracker-solution-design.md) - Comprehensive system design
- [Development Roadmap](ROADMAP.md) - Feature roadmap and milestones
- [Development Guide](claude.md) - Development workflow and guidelines
- [Feature Plans](docs/feature-plans/) - Individual feature planning documents

## Current Status

**Current Milestone**: Milestone 2 - Account & Transaction Management ✅
**Latest Feature**: CSV Transaction Import (from Milestone 8) ✅
**Last Updated**: January 6, 2026

### Completed Milestones
- ✅ **Milestone 1**: Foundation & Core Setup (Docker, API, Frontend)
- ✅ **Milestone 2**: Account & Transaction Management
- ✅ **Milestone 8** (Partial): CSV Import, Column Mapping, Duplicate Detection

### What's Working Now
- Full account management (CRUD operations)
- Transaction entry and tracking (income, expense, transfer)
- CSV import with smart column mapping
- Balance tracking with adjustment audit trail
- Modern Material-UI interface with Indigo/Pink theme
- Fully containerized deployment with Docker

### Next Up
- **Milestone 3**: Category System - Hierarchical transaction categorization

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, PostgreSQL, and Docker**
