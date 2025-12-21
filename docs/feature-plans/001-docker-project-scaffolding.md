# Feature Plan: Docker & Project Scaffolding

**Feature ID**: 001
**Milestone**: 1 - Foundation & Core Setup
**Status**: Planning
**Created**: 2025-12-22
**Updated**: 2025-12-22

---

## Overview

Set up the complete development environment with Docker Compose orchestration, including PostgreSQL database, Node.js backend API, and React frontend application. Initialize both backend and frontend projects with TypeScript, establish basic "hello world" functionality, and create environment configuration templates.

---

## Requirements

### Functional Requirements
1. Docker Compose orchestrates three containers: PostgreSQL, Backend API, Frontend App
2. Backend serves a health check endpoint at `/api/health`
3. Backend connects to PostgreSQL database successfully
4. Frontend displays a "hello world" page
5. Frontend can make API calls to backend
6. All containers start with a single `docker-compose up -d` command
7. Development environment supports hot reload for both backend and frontend

### Non-Functional Requirements
1. TypeScript strict mode enabled for both projects
2. ESLint and Prettier configured for code quality
3. Environment variables properly configured
4. Git ignores sensitive files (.env, node_modules, etc.)
5. README includes setup instructions

---

## Implementation Approach

### Phase 1: Docker Compose Setup
1. Create `docker-compose.yml` with three services
2. Configure PostgreSQL container with persistent volume
3. Set up network for inter-container communication
4. Create `.env.example` template

### Phase 2: Backend Initialization
1. Initialize Node.js project with TypeScript
2. Install core dependencies (Express, Prisma, TypeScript, etc.)
3. Configure TypeScript with strict mode
4. Set up ESLint and Prettier
5. Create basic Express app structure
6. Initialize Prisma with PostgreSQL connection
7. Create health check endpoint
8. Create backend Dockerfile

### Phase 3: Frontend Initialization
1. Initialize React project with Vite and TypeScript
2. Install core dependencies (React, Material-UI, React Router, etc.)
3. Configure TypeScript with strict mode
4. Set up ESLint and Prettier
5. Create basic app structure with routing
6. Create "hello world" page
7. Set up Axios for API calls
8. Create test API call to backend health endpoint
9. Create frontend Dockerfile

### Phase 4: Integration & Testing
1. Build and start all containers
2. Verify database container is running and accessible
3. Verify backend can connect to database
4. Verify backend health endpoint responds
5. Verify frontend loads in browser
6. Verify frontend can call backend API
7. Test hot reload for both backend and frontend

### Phase 5: Documentation
1. Update README with setup instructions
2. Document environment variables
3. Document common commands
4. Update .gitignore files

---

## Detailed Task Breakdown

### Docker Configuration
- [ ] Create `docker-compose.yml`
  - [ ] PostgreSQL service configuration
  - [ ] Backend API service configuration
  - [ ] Frontend app service configuration
  - [ ] Network configuration
  - [ ] Volume configuration for database persistence
- [ ] Create `.env.example` with all required variables
- [ ] Create `.env` for local development (gitignored)

### Backend Project
- [ ] Initialize Node.js project (`npm init`)
- [ ] Install dependencies:
  - [ ] express
  - [ ] @types/express
  - [ ] typescript
  - [ ] ts-node-dev (for hot reload)
  - [ ] @prisma/client
  - [ ] prisma (dev dependency)
  - [ ] dotenv
  - [ ] cors
  - [ ] @types/cors
  - [ ] helmet
  - [ ] express-rate-limit
  - [ ] winston (logging)
  - [ ] zod (validation)
- [ ] Install dev dependencies:
  - [ ] eslint
  - [ ] @typescript-eslint/parser
  - [ ] @typescript-eslint/eslint-plugin
  - [ ] prettier
  - [ ] eslint-config-prettier
- [ ] Create `tsconfig.json`
- [ ] Create `.eslintrc.json`
- [ ] Create `.prettierrc`
- [ ] Create project structure:
  - [ ] `src/app.ts` - Express app setup
  - [ ] `src/index.ts` - Server entry point
  - [ ] `src/routes/` - Route definitions
  - [ ] `src/controllers/` - Request handlers
  - [ ] `src/middlewares/` - Express middlewares
  - [ ] `src/utils/` - Utility functions
  - [ ] `src/types/` - TypeScript types
- [ ] Initialize Prisma:
  - [ ] Run `npx prisma init`
  - [ ] Configure `schema.prisma` for PostgreSQL
  - [ ] Create basic User model (for future use)
- [ ] Create health check endpoint (`GET /api/health`)
- [ ] Create backend `Dockerfile`
- [ ] Create backend `.dockerignore`
- [ ] Configure npm scripts in `package.json`
- [ ] Create backend `.gitignore`

### Frontend Project
- [ ] Initialize Vite project (`npm create vite@latest`)
- [ ] Install dependencies:
  - [ ] react
  - [ ] react-dom
  - [ ] @mui/material
  - [ ] @emotion/react
  - [ ] @emotion/styled
  - [ ] react-router-dom
  - [ ] axios
  - [ ] @tanstack/react-query
  - [ ] react-hook-form
  - [ ] zod
- [ ] Install dev dependencies:
  - [ ] typescript
  - [ ] @types/react
  - [ ] @types/react-dom
  - [ ] eslint
  - [ ] @typescript-eslint/parser
  - [ ] @typescript-eslint/eslint-plugin
  - [ ] prettier
  - [ ] eslint-config-prettier
  - [ ] eslint-plugin-react-hooks
- [ ] Create `tsconfig.json`
- [ ] Create `.eslintrc.json`
- [ ] Create `.prettierrc`
- [ ] Create project structure:
  - [ ] `src/App.tsx` - Main app component
  - [ ] `src/main.tsx` - App entry point
  - [ ] `src/pages/` - Page components
  - [ ] `src/components/` - Reusable components
  - [ ] `src/services/` - API service layer
  - [ ] `src/types/` - TypeScript types
- [ ] Set up React Router
- [ ] Create "Hello World" home page
- [ ] Create API service with health check call
- [ ] Create frontend `Dockerfile`
- [ ] Create frontend `.dockerignore`
- [ ] Configure Vite config for API proxy (optional)
- [ ] Create frontend `.gitignore`

### Testing & Verification
- [ ] Build all Docker images
- [ ] Start all containers with `docker-compose up -d`
- [ ] Verify PostgreSQL container is running
- [ ] Verify backend container is running
- [ ] Verify frontend container is running
- [ ] Test database connection from backend
- [ ] Test backend health endpoint: `curl http://localhost:3000/api/health`
- [ ] Test frontend loads: `http://localhost:5173` (or configured port)
- [ ] Test frontend can call backend API
- [ ] Test hot reload: modify backend code, verify auto-restart
- [ ] Test hot reload: modify frontend code, verify HMR works
- [ ] Verify all services restart correctly after `docker-compose restart`

### Documentation
- [ ] Create/update README.md with:
  - [ ] Project description
  - [ ] Prerequisites (Docker, Docker Compose)
  - [ ] Setup instructions
  - [ ] How to start the application
  - [ ] How to stop the application
  - [ ] Available endpoints
  - [ ] Troubleshooting section
- [ ] Document environment variables in README
- [ ] Add comments to docker-compose.yml
- [ ] Update claude.md with current status

---

## Technology Stack for This Feature

### Docker
- **Docker**: v24+ (with BuildKit support)
- **Docker Compose**: v2+

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **Dev Server**: ts-node-dev (hot reload)
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: Zod

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Language**: TypeScript 5.x
- **UI Library**: Material-UI (MUI) 5.x
- **Routing**: React Router 6.x
- **HTTP Client**: Axios
- **State**: React Query (TanStack Query)

### Database
- **Database**: PostgreSQL 16 (Alpine image)

---

## File Structure After Completion

```
budget-tracker/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Server entry point
│   │   ├── app.ts                   # Express app configuration
│   │   ├── routes/
│   │   │   └── health.routes.ts     # Health check route
│   │   ├── controllers/
│   │   │   └── health.controller.ts # Health check controller
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts      # Global error handler
│   │   │   └── logger.ts            # Request logging
│   │   ├── utils/
│   │   │   └── logger.ts            # Winston logger setup
│   │   └── types/
│   │       └── index.ts             # Shared types
│   ├── prisma/
│   │   └── schema.prisma            # Prisma schema
│   ├── .dockerignore
│   ├── .eslintrc.json
│   ├── .gitignore
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # App entry point
│   │   ├── App.tsx                  # Main app component
│   │   ├── pages/
│   │   │   └── Home.tsx             # Home page (Hello World)
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── Layout.tsx       # Basic layout component
│   │   ├── services/
│   │   │   └── api.ts               # Axios setup + API calls
│   │   └── types/
│   │       └── index.ts             # Shared types
│   ├── public/
│   ├── index.html
│   ├── .dockerignore
│   ├── .eslintrc.json
│   ├── .gitignore
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
├── docs/
│   ├── feature-plans/
│   │   └── 001-docker-project-scaffolding.md (this file)
│   └── budget-tracker-solution-design.md
├── .env.example
├── .env                             # (gitignored)
├── .gitignore
├── docker-compose.yml
├── README.md
├── ROADMAP.md
└── claude.md
```

---

## API Endpoints (This Feature)

### Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns API health status and database connection status
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2025-12-22T10:30:00.000Z",
    "database": "connected",
    "version": "1.0.0"
  }
  ```

---

## Database Schema (This Feature)

```prisma
// Initial schema - User model placeholder for future authentication

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://budget_user:budget_password@database:5432/budget_tracker

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# API
API_VERSION=v1
```

### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api
```

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

---

## Acceptance Criteria

### Must Have (P0)
- [ ] All three Docker containers start successfully with `docker-compose up -d`
- [ ] PostgreSQL database is accessible and persists data across restarts
- [ ] Backend health endpoint responds with 200 status and correct JSON
- [ ] Backend can connect to PostgreSQL database
- [ ] Frontend loads in browser at configured port
- [ ] Frontend can make successful API call to backend health endpoint
- [ ] Hot reload works for backend (code changes trigger restart)
- [ ] Hot reload works for frontend (code changes trigger HMR)
- [ ] TypeScript strict mode enabled for both projects
- [ ] ESLint and Prettier configured and working
- [ ] .env.example file created with all required variables
- [ ] README includes complete setup instructions
- [ ] All sensitive files are gitignored

### Nice to Have (P1)
- [ ] Docker health checks configured for all containers
- [ ] Logs are properly formatted with timestamps
- [ ] Frontend shows API response on the page (not just console)
- [ ] Docker images optimized with multi-stage builds
- [ ] npm scripts documented in package.json files

### Out of Scope
- Authentication/authorization
- Database migrations (will be in next feature)
- Complex API endpoints
- UI styling (basic Material-UI is fine)
- Testing infrastructure (will be added later)
- Production configuration (Nginx, etc.)

---

## Dependencies

### Prerequisites
- Docker installed (v24+)
- Docker Compose installed (v2+)
- Node.js 20 LTS (for local development without Docker)
- Git

### Blocked By
- None (this is the first feature)

### Blocks
- All future features depend on this foundation

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Port conflicts with existing services | High | Medium | Document how to change ports in docker-compose.yml |
| Docker networking issues | High | Low | Use explicit network configuration, document troubleshooting |
| Hot reload not working in containers | Medium | Medium | Use volume mounts correctly, test thoroughly |
| Dependencies incompatibility | Medium | Low | Pin all dependency versions in package.json |
| Large Docker images | Low | High | Use Alpine base images, multi-stage builds |

---

## Testing Plan

### Manual Testing Checklist
- [ ] Start containers: `docker-compose up -d`
- [ ] Check container status: `docker-compose ps` (all should be "Up")
- [ ] Check backend logs: `docker-compose logs api` (no errors)
- [ ] Check frontend logs: `docker-compose logs app` (no errors)
- [ ] Test database: `docker-compose exec database psql -U budget_user -d budget_tracker -c '\dt'`
- [ ] Test backend health: `curl http://localhost:3000/api/health`
- [ ] Test frontend: Open `http://localhost:5173` in browser
- [ ] Verify frontend API call works (check browser console or UI)
- [ ] Test hot reload (backend): Edit a file, check logs for restart
- [ ] Test hot reload (frontend): Edit App.tsx, check browser updates
- [ ] Stop containers: `docker-compose down`
- [ ] Restart: `docker-compose up -d` (verify data persists)
- [ ] Clean restart: `docker-compose down -v && docker-compose up -d`

### Automated Testing
- Not implemented in this feature (infrastructure only)

---

## Performance Considerations

- Docker volumes for node_modules to improve performance
- PostgreSQL connection pooling (Prisma default)
- Frontend development server optimized with Vite
- Use .dockerignore to exclude unnecessary files from builds

---

## Security Considerations

- [ ] .env files not committed to git
- [ ] Default passwords documented as examples only
- [ ] CORS configured to allow only frontend origin
- [ ] Helmet.js configured for security headers
- [ ] Rate limiting configured on API
- [ ] Database exposed only to Docker network (not host in production)

---

## Open Questions

1. ~~What ports should we use for each service?~~
   - **Decision**: PostgreSQL: 5432, Backend: 3000, Frontend: 5173 (Vite default)

2. ~~Should we use npm or yarn?~~
   - **Decision**: npm (simpler, comes with Node.js)

3. ~~Do we need Nginx for development?~~
   - **Decision**: No, only for production. Vite dev server is sufficient.

4. ~~Should we set up HTTPS for local development?~~
   - **Decision**: No, HTTP is fine for local. HTTPS for production only.

---

## Implementation Notes

### Session 1: Docker Compose Setup

**Date**: 2025-12-22
**Developer**: Claude
**Session**: 1

#### What was completed:
- Created `docker-compose.yml` with three services (database, api, app)
- Configured PostgreSQL 16 Alpine container with persistent volumes
- Configured backend API container with hot reload support (volume mounts)
- Configured frontend app container with hot reload support (volume mounts)
- Added health checks for all three services
- Created `.env.example` with all required environment variables
- Created root `.gitignore` to exclude sensitive files and build artifacts
- Created `.env` file for local development (gitignored)

#### Decisions made:
- Used PostgreSQL 16 Alpine image for smaller footprint
- Configured separate named volumes for node_modules (backend and frontend) to improve performance on Windows/WSL
- Added health checks with proper dependencies (database must be healthy before API starts)
- Used multi-stage Dockerfile approach (target: development) for future production builds
- Used `wget` for health checks in API and app containers
- Configured volume mounts for src directories to enable hot reload

#### Issues encountered:
- None so far

#### Next steps:
- Initialize backend Node.js project with TypeScript and Express
- Create backend project structure

### Session 2: Backend Project Initialization

**Date**: 2025-12-22
**Developer**: Claude
**Session**: 2

#### What was completed:
- Created backend directory structure (src with subdirectories for controllers, services, middlewares, routes, utils, types)
- Created `package.json` with all required dependencies (Express, Prisma, TypeScript, Winston, Zod, etc.)
- Created `tsconfig.json` with strict mode enabled and comprehensive type checking
- Created `.eslintrc.json` for code quality enforcement
- Created `.prettierrc` for code formatting
- Created backend-specific `.gitignore` and `.dockerignore`
- Created backend `README.md` with setup instructions and project documentation

#### Decisions made:
- Enabled TypeScript strict mode with all type checking options
- Configured path aliases (`@/*` for `src/*`)
- Set up ESLint to require explicit function return types
- Pinned dependency versions for reproducibility
- Used ts-node-dev for hot reload in development

#### Issues encountered:
- None

#### Next steps:
- Create Express app structure with health check endpoint
- Set up Winston logger
- Create middleware for error handling and request logging

### Session 3: Express App and Health Check Endpoint

**Date**: 2025-12-22
**Developer**: Claude
**Session**: 3

#### What was completed:
- Created Winston logger utility with file and console transports
- Created error handler middleware with custom AppError class, Zod error handling, and 404 handler
- Created request logging middleware with response time tracking
- Created health check controller with database connection test
- Created health check routes mounted at `/api/health` and `/api/v1/health`
- Created TypeScript types for API responses (SuccessResponse, ErrorResponse, PaginatedResponse, HealthCheckResponse)
- Created Express app configuration with security middleware (Helmet, CORS, rate limiting)
- Created server entry point with graceful shutdown handling
- Created logs directory with .gitkeep

#### Decisions made:
- Winston logger configured with separate files for errors, combined logs, exceptions, and rejections
- Error handler returns standardized JSON error responses
- Request logger tracks response time and logs based on status code severity
- Health check tests database connectivity using Prisma
- Rate limiting set to 100 requests per 15 minutes per IP
- Graceful shutdown handles SIGTERM, SIGINT with 10-second timeout
- API versioning supported through environment variable (default: v1)

#### Issues encountered:
- None

#### Next steps:
- Initialize Prisma with PostgreSQL schema
- Create basic User model for future authentication

### Session 4: Prisma Setup

**Date**: 2025-12-22
**Developer**: Claude
**Session**: 4

#### What was completed:
- Created Prisma schema configured for PostgreSQL
- Added User model with id, email, username, passwordHash, timestamps
- Added indexes on email and username for query performance
- Created prisma/migrations directory structure

#### Decisions made:
- Used UUID for user ID (more secure than sequential integers)
- Added unique constraints on email and username
- Added indexes on frequently queried fields (email, username)
- Migrations will be run inside Docker container (not generated yet)

#### Issues encountered:
- None

#### Next steps:
- Create backend Dockerfile with multi-stage build
- Configure Prisma client generation in Docker build

---

## Sign-off

- [ ] All acceptance criteria met
- [ ] Code reviewed (if applicable)
- [ ] Documentation updated
- [ ] README.md updated
- [ ] claude.md updated with current status
- [ ] Feature branch merged to main
- [ ] Feature marked complete in ROADMAP.md

---

**Status**: Planning → Ready for Implementation
**Estimated Effort**: Medium (4-6 hours)
**Actual Effort**: [To be filled upon completion]
