#!/bin/bash

# Montessori Mafikeng Connect - Development Script
# African Montessori School Management Platform

set -e

echo "🦁 Montessori Mafikeng Connect - Development Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ $NODE_MAJOR -lt 18 ]; then
        print_error "Node.js version must be 18+. Current: $NODE_VERSION"
        exit 1
    fi
    
    print_success "Node.js $NODE_VERSION detected"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "npm detected"
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        print_success "Docker detected (optional)"
    else
        print_warning "Docker not found (optional for database)"
    fi
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    else
        print_status "Frontend dependencies already installed"
    fi
    
    # Create environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating frontend .env file..."
        cat > .env << EOF
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Montessori Mafikeng Connect
VITE_APP_VERSION=0.1.0
VITE_DEFAULT_LANGUAGE=setswana
EOF
        print_success "Frontend .env file created"
    fi
    
    cd ..
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    else
        print_status "Backend dependencies already installed"
    fi
    
    # Create environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating backend .env file..."
        cp .env.example .env
        print_warning "Please edit backend/.env with your configuration"
    fi
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    cd ..
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start backend in background
    print_status "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend in background
    print_status "Starting frontend development server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Save PIDs to file for cleanup
    echo "$BACKEND_PID $FRONTEND_PID" > .dev_pids
    
    print_success "Services started!"
    echo ""
    echo "🌍 Application URLs:"
    echo "   Frontend:  ${GREEN}http://localhost:3000${NC}"
    echo "   Backend:   ${GREEN}http://localhost:3001${NC}"
    echo "   Health:    ${GREEN}http://localhost:3001/health${NC}"
    echo ""
    echo "🛑 To stop services, run: ./scripts/dev.sh stop"
}

# Stop services
stop_services() {
    print_status "Stopping services..."
    
    if [ -f ".dev_pids" ]; then
        read BACKEND_PID FRONTEND_PID < .dev_pids
        
        print_status "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        
        print_status "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        
        rm -f .dev_pids
        print_success "Services stopped"
    else
        print_warning "No running services found"
    fi
}

# Database setup
setup_database() {
    print_status "Setting up database..."
    
    cd backend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_error "Backend .env file not found. Run setup first."
        exit 1
    fi
    
    # Run database migrations
    print_status "Running database migrations..."
    npx prisma migrate dev
    
    # Seed database if seed file exists
    if [ -f "prisma/seed.ts" ]; then
        print_status "Seeding database..."
        npm run db:seed
    fi
    
    cd ..
    
    print_success "Database setup complete"
}

# Show logs
show_logs() {
    print_status "Showing logs..."
    
    if [ ! -f ".dev_pids" ]; then
        print_error "Services are not running"
        exit 1
    fi
    
    echo ""
    echo "📋 Service Logs:"
    echo "1. Backend logs"
    echo "2. Frontend logs"
    echo "3. Both logs"
    echo "4. Clear logs"
    echo ""
    read -p "Select option (1-4): " LOG_OPTION
    
    case $LOG_OPTION in
        1)
            print_status "Backend logs:"
            # In a real setup, you would tail the backend logs
            echo "Backend logs would be shown here"
            ;;
        2)
            print_status "Frontend logs:"
            # In a real setup, you would tail the frontend logs
            echo "Frontend logs would be shown here"
            ;;
        3)
            print_status "Both backend and frontend logs:"
            echo "Combined logs would be shown here"
            ;;
        4)
            print_status "Clearing logs..."
            # Clear log files if they exist
            rm -f backend/logs/*.log 2>/dev/null || true
            rm -f frontend/logs/*.log 2>/dev/null || true
            print_success "Logs cleared"
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
}

# Main menu
show_menu() {
    echo ""
    echo "🦁 Montessori Mafikeng Connect - Development Menu"
    echo "================================================"
    echo "1. Setup project (first time)"
    echo "2. Start services"
    echo "3. Stop services"
    echo "4. Setup database"
    echo "5. Show logs"
    echo "6. Run tests"
    echo "7. Clean install"
    echo "8. Exit"
    echo ""
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run backend tests
    print_status "Running backend tests..."
    cd backend
    npm test || true
    cd ..
    
    # Run frontend tests
    print_status "Running frontend tests..."
    cd frontend
    npm test || true
    cd ..
    
    print_success "Tests completed"
}

# Clean install
clean_install() {
    print_warning "This will remove node_modules and do a fresh install"
    read -p "Are you sure? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning frontend..."
        cd frontend
        rm -rf node_modules
        npm install
        cd ..
        
        print_status "Cleaning backend..."
        cd backend
        rm -rf node_modules
        npm install
        cd ..
        
        print_success "Clean install complete"
    fi
}

# Main script
main() {
    # Check if command provided
    if [ $# -eq 1 ]; then
        case $1 in
            "start")
                check_prerequisites
                start_services
                ;;
            "stop")
                stop_services
                ;;
            "setup")
                check_prerequisites
                setup_frontend
                setup_backend
                ;;
            "db")
                setup_database
                ;;
            "test")
                run_tests
                ;;
            "clean")
                clean_install
                ;;
            *)
                print_error "Unknown command: $1"
                echo "Available commands: start, stop, setup, db, test, clean"
                exit 1
                ;;
        esac
        exit 0
    fi
    
    # Interactive mode
    while true; do
        show_menu
        read -p "Select option (1-8): " OPTION
        
        case $OPTION in
            1)
                check_prerequisites
                setup_frontend
                setup_backend
                ;;
            2)
                check_prerequisites
                start_services
                ;;
            3)
                stop_services
                ;;
            4)
                setup_database
                ;;
            5)
                show_logs
                ;;
            6)
                run_tests
                ;;
            7)
                clean_install
                ;;
            8)
                print_status "Exiting..."
                stop_services
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
    done
}

# Run main function with all arguments
main "$@"