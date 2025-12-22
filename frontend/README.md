# Budget Tracker - Frontend

Frontend application for the Budget Tracker built with React, TypeScript, Vite, and Material-UI.

## Technology Stack

- **Framework**: React 18
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) 6
- **Routing**: React Router 7
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod

## Development

### Prerequisites

- Node.js 20 LTS or higher
- npm 10 or higher

### Setup

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Main app component
│   ├── components/            # React components
│   │   ├── common/            # Reusable UI components
│   │   └── layout/            # Layout components
│   ├── pages/                 # Page components
│   ├── services/              # API service layer
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
└── dist/                      # Build output (gitignored)
```

## Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
VITE_API_URL=http://localhost:3000/api
```

## Docker

The frontend runs in a Docker container. See the root `docker-compose.yml` for configuration.

```bash
# Build and start (from project root)
docker-compose up -d app

# View logs
docker-compose logs -f app

# Access container shell
docker-compose exec app sh
```

## Development Server

The Vite development server runs on port 5173 with Hot Module Replacement (HMR) enabled.

Access the application at: http://localhost:5173
