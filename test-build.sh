#!/bin/bash
# Test build script - runs TypeScript compilation in Docker

set -e  # Exit on error

echo "🔨 Testing Docker builds..."
echo ""

echo "📦 Building backend (TypeScript compilation)..."
docker compose build --target build api
echo "✅ Backend build passed!"
echo ""

echo "📦 Building frontend (TypeScript compilation + Vite build)..."
docker compose build --target build app
echo "✅ Frontend build passed!"
echo ""

echo "🎉 All Docker builds successful! Safe to push."
