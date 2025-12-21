# Multi-stage Dockerfile for Budget Tracker Backend

# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget

# Stage 2: Dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# Stage 3: Development
FROM dependencies AS development
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 4: Build
FROM dependencies AS build
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 5: Production
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]
