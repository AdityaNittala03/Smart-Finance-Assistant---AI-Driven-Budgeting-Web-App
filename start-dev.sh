#!/bin/bash

# Smart Finance Assistant - Development Startup Script

set -e

echo "🤖 Starting Smart Finance Assistant Development Environment"
echo "=" * 60

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration"
fi

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Python environment created"
fi

# Start PostgreSQL (if using Docker)
echo "🐘 Starting PostgreSQL..."
if command -v docker &> /dev/null; then
    docker run --name finance_tracker_postgres -d \
        -e POSTGRES_DB=finance_tracker \
        -e POSTGRES_USER=finance_user \
        -e POSTGRES_PASSWORD=finance_password \
        -p 5432:5432 \
        postgres:15-alpine 2>/dev/null || echo "PostgreSQL container already running"
else
    echo "⚠️  Docker not found. Please start PostgreSQL manually."
fi

# Start Redis (if using Docker)
echo "🔴 Starting Redis..."
if command -v docker &> /dev/null; then
    docker run --name finance_tracker_redis -d \
        -p 6379:6379 \
        redis:7-alpine 2>/dev/null || echo "Redis container already running"
else
    echo "⚠️  Docker not found. Please start Redis manually."
fi

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Initialize database
echo "🗄️  Initializing database..."
cd backend
source venv/bin/activate
export FLASK_APP=app.py
export FLASK_ENV=development
flask init-db
cd ..

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "🚀 Starting development servers..."

# Start backend in background
cd backend
source venv/bin/activate
export FLASK_APP=app.py
export FLASK_ENV=development
python app.py &
BACKEND_PID=$!
cd ..

# Start frontend in background
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Development environment started!"
echo "📊 Backend API: http://localhost:5000"
echo "🌐 Frontend: http://localhost:3000"
echo "📋 API Health: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development environment..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    
    if command -v docker &> /dev/null; then
        docker stop finance_tracker_postgres finance_tracker_redis 2>/dev/null || true
    fi
    
    echo "👋 Development environment stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait