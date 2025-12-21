# Budget Tracker - Backend API

Backend API service for the Budget Tracker application built with Node.js, Express, TypeScript, and Prisma.

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Logging**: Winston

## Development

### Prerequisites

- Node.js 20 LTS or higher
- npm 10 or higher
- PostgreSQL 16 (or use Docker Compose)

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server (with hot reload)
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
backend/
├── src/
│   ├── index.ts           # Server entry point
│   ├── app.ts             # Express app configuration
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── middlewares/       # Express middlewares
│   ├── routes/            # Route definitions
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts            # Seed data
└── dist/                  # Compiled output (gitignored)
```

## Environment Variables

Create a `.env` file in the backend directory:

```bash
DATABASE_URL=postgresql://budget_user:budget_password@localhost:5432/budget_tracker
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
API_VERSION=v1
```

## API Documentation

API documentation is available at `/api/docs` when the server is running (Swagger UI).

## Docker

The backend runs in a Docker container. See the root `docker-compose.yml` for configuration.

```bash
# Build and start (from project root)
docker-compose up -d api

# View logs
docker-compose logs -f api

# Access container shell
docker-compose exec api sh
```
