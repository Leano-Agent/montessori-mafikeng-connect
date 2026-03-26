#!/bin/bash

# Montessori Mafikeng Connect - Setup Script
# This script helps set up the development environment

set -e

echo "🦁 Setting up Montessori Mafikeng Connect..."
echo "=============================================="

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Docker Compose setup will not work."
    echo "   Install Docker for containerized development: https://docs.docker.com/get-docker/"
fi

if ! command -v git &> /dev/null; then
    echo "⚠️  Git is not installed. Git operations will not work."
    echo "   Install Git: https://git-scm.com/downloads"
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Setup backend
echo ""
echo "🚀 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration"
else
    echo "✅ .env file already exists"
fi

echo "📦 Installing backend dependencies..."
npm ci

echo "🗄️  Setting up database..."
npx prisma generate

echo "📊 Running database migrations..."
npx prisma migrate dev --name init

echo "✅ Backend setup complete!"

# Setup frontend
echo ""
echo "🚀 Setting up frontend..."
cd ../frontend

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit frontend/.env with your configuration"
else
    echo "✅ .env file already exists"
fi

echo "📦 Installing frontend dependencies..."
npm ci

echo "✅ Frontend setup complete!"

# Create test data
echo ""
echo "🧪 Setting up test data..."
cd ../backend
if [ -f "prisma/seed.ts" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed
else
    echo "⚠️  No seed file found. Skipping database seeding."
fi

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo ""
echo "To start the application:"
echo ""
echo "Option 1: Docker Compose (recommended)"
echo "  docker-compose up -d"
echo ""
echo "Option 2: Manual start"
echo "  Backend: cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Access points:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  API Docs: http://localhost:3001/api-docs"
echo "  Prisma Studio: http://localhost:5555"
echo ""
echo "Test accounts:"
echo "  Teacher: teacher@test.montessorimafikeng.org / Teacher123!"
echo "  Parent: parent@test.montessorimafikeng.org / Parent123!"
echo "  Admin: admin@test.montessorimafikeng.org / Admin123!"
echo "  Principal: principal@test.montessorimafikeng.org / Principal123!"
echo ""
echo "For deployment instructions, see DEPLOYMENT.md"
echo "For testing instructions, see TESTING_GUIDE.md"
echo ""
echo "🦁 Built with ❤️ in Africa, for Africa"