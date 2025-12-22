# Multi-stage Dockerfile for Budget Tracker Frontend

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
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Stage 4: Build
FROM dependencies AS build
COPY . .
RUN npm run build

# Stage 5: Production
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
