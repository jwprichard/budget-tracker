# Budget Tracker Web Application

## Project Overview
A budget tracker web application that runs on Docker and can be accessed from mobile devices via local WiFi.

## Tech Stack

### Frontend
- React with TypeScript - Modern, well-supported, great mobile responsiveness
- Tailwind CSS - Utility-first styling, mobile-friendly
- React Query/TanStack Query - API state management

### Backend
- Node.js with Express.js and TypeScript - Fast development, JavaScript everywhere
- PostgreSQL - Reliable database for financial data
- Prisma ORM - Type-safe database operations

### Infrastructure
- Docker Compose - Multi-container orchestration
- Nginx - Reverse proxy and static file serving
- Redis (optional) - Session storage and caching

### Additional Tools
- JWT authentication for security
- Input validation with Zod
- ESLint + Prettier for code quality

## Deployment Goals
- Local development with Docker
- Eventually deploy to server for remote access
- Mobile-responsive design for phone usage via WiFi

## Development Notes
- Full TypeScript support across frontend/backend
- Easy Docker deployment
- Scalable from local to server deployment
- Strong ecosystem and community support