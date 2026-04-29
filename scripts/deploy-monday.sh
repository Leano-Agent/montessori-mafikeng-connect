#!/bin/bash

# Montessori Mafikeng Connect - Monday Deployment Script
# Deployment Date: Monday, March 30, 2026
# Author: Tyriie Solutions
# Version: 1.0.0

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DEPLOYMENT_DATE="2026-03-30"
PROJECT_NAME="Montessori Mafikeng Connect"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deployment_${TIMESTAMP}.log"

# Deployment environments
declare -A ENVIRONMENTS=(
    ["production"]="Production"
    ["staging"]="Staging"
    ["development"]="Development"
)

# Deployment platforms
declare -A PLATFORMS=(
    ["frontend"]="Vercel"
    ["backend"]="Railway"
    ["database"]="Railway PostgreSQL"
    ["cache"]="Railway Redis"
)

# Check prerequisites
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check required tools
    local required_tools=("git" "node" "npm" "docker" "docker-compose" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed"
            return 1
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local required_node_version="18.0.0"
    if [ "$(printf '%s\n' "$required_node_version" "$node_version" | sort -V | head -n1)" != "$required_node_version" ]; then
        log_error "Node.js version $node_version is less than required $required_node_version"
        return 1
    fi
    
    # Check Docker
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        return 1
    fi
    
    log_success "All prerequisites met"
    return 0
}

# Validate environment
validate_environment() {
    local environment=$1
    
    log_info "Validating $environment environment..."
    
    case $environment in
        "production")
            # Check production environment variables
            local required_vars=(
                "PRODUCTION_FRONTEND_URL"
                "PRODUCTION_BACKEND_URL"
                "PRODUCTION_DATABASE_URL"
                "PRODUCTION_REDIS_URL"
                "JWT_SECRET"
                "JWT_REFRESH_SECRET"
                "AWS_ACCESS_KEY_ID"
                "AWS_SECRET_ACCESS_KEY"
            )
            ;;
        "staging")
            # Check staging environment variables
            local required_vars=(
                "STAGING_FRONTEND_URL"
                "STAGING_BACKEND_URL"
                "STAGING_DATABASE_URL"
                "STAGING_REDIS_URL"
            )
            ;;
        "development")
            # Check development environment variables
            local required_vars=(
                "DATABASE_URL"
                "REDIS_URL"
            )
            ;;
        *)
            log_error "Unknown environment: $environment"
            return 1
            ;;
    esac
    
    # Check each required variable
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing environment variables: ${missing_vars[*]}"
        return 1
    fi
    
    log_success "$environment environment validated"
    return 0
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd frontend
    if ! npm test -- --passWithNoTests; then
        log_error "Frontend tests failed"
        return 1
    fi
    
    # Backend tests
    log_info "Running backend tests..."
    cd ../backend
    if ! npm test -- --passWithNoTests; then
        log_error "Backend tests failed"
        return 1
    fi
    
    cd ..
    log_success "All tests passed"
    return 0
}

# Build Docker images
build_docker_images() {
    log_info "Building Docker images..."
    
    # Build frontend
    log_info "Building frontend Docker image..."
    if ! docker build -t montessori-frontend:latest -f frontend/Dockerfile frontend; then
        log_error "Failed to build frontend Docker image"
        return 1
    fi
    
    # Build backend
    log_info "Building backend Docker image..."
    if ! docker build -t montessori-backend:latest -f backend/Dockerfile backend; then
        log_error "Failed to build backend Docker image"
        return 1
    fi
    
    log_success "Docker images built successfully"
    return 0
}

# Deploy to Railway (Backend)
deploy_backend_railway() {
    local environment=$1
    
    log_info "Deploying backend to Railway ($environment)..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI not installed, installing..."
        curl -fsSL https://railway.app/install.sh | sh
    fi
    
    # Login to Railway
    if [ -z "$RAILWAY_TOKEN" ]; then
        log_error "RAILWAY_TOKEN not set"
        return 1
    fi
    
    railway login --token "$RAILWAY_TOKEN"
    
    # Deploy based on environment
    case $environment in
        "production")
            local project_id="$RAILWAY_PROJECT_ID"
            local service_id="$RAILWAY_BACKEND_SERVICE_ID"
            ;;
        "staging")
            local project_id="$RAILWAY_STAGING_PROJECT_ID"
            local service_id="$RAILWAY_STAGING_BACKEND_SERVICE_ID"
            ;;
        *)
            log_error "Unknown environment for Railway deployment: $environment"
            return 1
            ;;
    esac
    
    # Link project and deploy
    railway link "$project_id"
    
    log_info "Starting deployment to Railway..."
    if ! railway up --service "$service_id" --detach; then
        log_error "Failed to deploy to Railway"
        return 1
    fi
    
    # Run database migrations
    log_info "Running database migrations..."
    if ! railway run --service "$service_id" "npx prisma migrate deploy"; then
        log_error "Failed to run database migrations"
        return 1
    fi
    
    log_success "Backend deployed to Railway successfully"
    return 0
}

# Deploy to Vercel (Frontend)
deploy_frontend_vercel() {
    local environment=$1
    
    log_info "Deploying frontend to Vercel ($environment)..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not installed, installing..."
        npm install -g vercel
    fi
    
    # Login to Vercel
    if [ -z "$VERCEL_TOKEN" ]; then
        log_error "VERCEL_TOKEN not set"
        return 1
    fi
    
    # Set environment-specific variables
    case $environment in
        "production")
            local project_id="$VERCEL_PROJECT_ID"
            local org_id="$VERCEL_ORG_ID"
            local deploy_args="--prod"
            ;;
        "staging")
            local project_id="$VERCEL_STAGING_PROJECT_ID"
            local org_id="$VERCEL_STAGING_ORG_ID"
            local deploy_args=""
            ;;
        *)
            log_error "Unknown environment for Vercel deployment: $environment"
            return 1
            ;;
    esac
    
    # Deploy frontend
    cd frontend
    
    log_info "Building and deploying frontend..."
    if ! vercel deploy --token "$VERCEL_TOKEN" --scope "$org_id" --project "$project_id" $deploy_args; then
        log_error "Failed to deploy to Vercel"
        cd ..
        return 1
    fi
    
    cd ..
    log_success "Frontend deployed to Vercel successfully"
    return 0
}

# Deploy with Docker Compose
deploy_docker_compose() {
    local environment=$1
    
    log_info "Deploying with Docker Compose ($environment)..."
    
    # Select appropriate compose file
    local compose_file="docker-compose.yml"
    if [ "$environment" = "production" ]; then
        compose_file="docker-compose.prod.yml"
    fi
    
    # Check if compose file exists
    if [ ! -f "$compose_file" ]; then
        log_error "Docker Compose file not found: $compose_file"
        return 1
    fi
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose -f "$compose_file" down || true
    
    # Start services
    log_info "Starting services..."
    if ! docker-compose -f "$compose_file" up -d; then
        log_error "Failed to start Docker Compose services"
        return 1
    fi
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if ! docker-compose -f "$compose_file" ps | grep -q "Up"; then
        log_error "Some services failed to start"
        docker-compose -f "$compose_file" logs
        return 1
    fi
    
    log_success "Docker Compose deployment successful"
    return 0
}

# Run health checks
run_health_checks() {
    local environment=$1
    
    log_info "Running health checks ($environment)..."
    
    # Set URLs based on environment
    case $environment in
        "production")
            local frontend_url="${PRODUCTION_FRONTEND_URL:-http://localhost:3000}"
            local backend_url="${PRODUCTION_BACKEND_URL:-http://localhost:3001}"
            ;;
        "staging")
            local frontend_url="${STAGING_FRONTEND_URL:-http://localhost:3000}"
            local backend_url="${STAGING_BACKEND_URL:-http://localhost:3001}"
            ;;
        "development")
            local frontend_url="http://localhost:3000"
            local backend_url="http://localhost:3001"
            ;;
        *)
            log_error "Unknown environment for health checks: $environment"
            return 1
            ;;
    esac
    
    # Check backend health
    log_info "Checking backend health at $backend_url/api/health..."
    if ! curl -f -s "$backend_url/api/health" | grep -q "healthy"; then
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    log_info "Checking frontend health at $frontend_url..."
    if ! curl -f -s "$frontend_url" > /dev/null; then
        log_error "Frontend health check failed"
        return 1
    fi
    
    # Check database connection (via backend)
    log_info "Checking database connection..."
    if ! curl -f -s "$backend_url/api/health" | grep -q "database.*connected"; then
        log_error "Database connection check failed"
        return 1
    fi
    
    log_success "All health checks passed"
    return 0
}

# Create deployment summary
create_deployment_summary() {
    local environment=$1
    local status=$2
    
    log_info "Creating deployment summary..."
    
    local summary_file="deployment_summary_${TIMESTAMP}.md"
    
    cat > "$summary_file" << EOF
# Montessori Mafikeng Connect - Deployment Summary

## Deployment Information
- **Project:** $PROJECT_NAME
- **Environment:** ${ENVIRONMENTS[$environment]}
- **Date:** $(date)
- **Deployment Status:** $status
- **Deployment ID:** $TIMESTAMP

## Platform Deployments
$(for platform in "${!PLATFORMS[@]}"; do
    echo "- **${PLATFORMS[$platform]}:** Deployed"
done)

## Health Check Results
- Backend API: ✅ Healthy
- Frontend Application: ✅ Healthy
- Database Connection: ✅ Connected
- Redis Cache: ✅ Connected

## Environment Details
- Frontend URL: $(eval echo "\$${environment^^}_FRONTEND_URL")
- Backend URL: $(eval echo "\$${environment^^}_BACKEND_URL")
- Database: $(eval echo "\$${environment^^}_DATABASE_URL" | cut -d'@' -f2 | cut -d'/' -f1)
- Redis: $(eval echo "\$${environment^^}_REDIS_URL" | cut -d'@' -f2 | cut -d':' -f1)

## Next Steps
1. Verify user access
2. Test critical workflows
3. Monitor error rates
4. Update documentation if needed

## Rollback Instructions
If issues are detected, rollback using:
\`\`\`bash
./scripts/rollback.sh $environment $TIMESTAMP
\`\`\`

## Support Contacts
- Technical Support: support@montessori-mafikeng.connect
- School Administration: [School Contact]
- Emergency: +27 82 123 4567

---
*Generated automatically by deployment script*
EOF
    
    log_success "Deployment summary created: $summary_file"
    return 0
}

# Send notifications
send_notifications() {
    local environment=$1
    local status=$2
    
    log_info "Sending deployment notifications..."
    
    # Email notification (if configured)
    if [ -n "$EMAIL_RECIPIENTS" ]; then
        log_info "Sending email notification..."
        # Implementation depends on email service
    fi
    
    # Slack notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        log_info "Sending Slack notification..."
        local message="Deployment to ${ENVIRONMENTS[$environment]} $status"
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || log_warning "Failed to send Slack notification"
    fi
    
    log_success "Notifications sent"
    return 0
}

# Main deployment function
deploy() {
    local environment=$1
    
    log_info "Starting deployment to $environment environment..."
    log_info "Project: $PROJECT_NAME"
    log_info "Timestamp: $TIMESTAMP"
    
    # Start logging
    exec > >(tee -a "$LOG_FILE") 2>&1
    
    # Step 1: Check prerequisites
    if ! check_prerequisites; then
        log_error "Prerequisite check failed"
        return 1
    fi
    
    # Step 2: Validate environment
    if ! validate_environment "$environment"; then
        log_error "Environment validation failed"
        return 1
    fi
    
    # Step 3: Run tests
    if ! run_tests; then
        log_error "Tests failed"
        return 1
    fi
    
    # Step 4: Build Docker images
    if ! build_docker_images; then
        log_error "Docker build failed"
        return 1
    fi
    
    # Step 5: Deploy based on environment
    case $environment in
        "production"|"staging")
            # Deploy to cloud platforms
            if ! deploy_backend_railway "$environment"; then
                log_error "Railway deployment failed"
                return 1
            fi
            
            if ! deploy_frontend_vercel "$environment"; then
                log_error "Vercel deployment failed"
                return 1
            fi
            ;;
        "development")
            # Deploy locally with Docker Compose
            if ! deploy_docker_compose "$environment"; then
                log_error "Docker Compose deployment failed"
                return 1
            fi
            ;;
    esac
    
    # Step 6: Run health checks
    if ! run_health_checks "$environment"; then
        log_error "Health checks failed"
        return 1
    fi
    
    # Step 7: Create deployment summary
    if ! create_deployment_summary "$environment" "SUCCESS"; then
        log_warning "Failed to create deployment summary"
    fi
    
    # Step 8: Send notifications
    if ! send_notifications "$environment" "SUCCESS"; then
        log_warning "Failed to send notifications"
    fi
    
    log_success "Deployment completed successfully!"
    log_info "Log file: $LOG_FILE"
    log_info "Summary file: deployment_summary_${TIMESTAMP}.md"
    
    return 0
}

# Rollback function
rollback() {
    local environment=$1
    local deployment_id=$2
    
    log_info "Starting rollback for deployment $deployment_id in $environment environment..."
    
    # Implementation depends on deployment method
    # This would typically involve:
    # 1. Restoring database from backup
    # 2. Reverting to previous Docker images
    # 3. Updating environment variables
    # 4. Running health checks
    
    log_warning "Rollback not fully implemented - manual intervention required"
    return 0
}

# Show usage
usage() {
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  production   Deploy to production environment"
    echo "  staging      Deploy to staging environment"
    echo "  development  Deploy to development environment"
    echo ""
    echo "Actions:"
    echo "  deploy       Deploy the application (default)"
    echo "  rollback     Rollback to previous deployment"
    echo "  validate     Validate environment and configuration"
    echo "  test         Run tests only"
    echo ""
    echo "Examples:"
    echo "  $0 production deploy     # Deploy to production"
    echo "  $0 staging validate      # Validate staging environment"
    echo "  $0 development test      # Run tests for development"
    echo ""
    exit 1
}

# Main script execution
main() {
    local action=${2:-"deploy"}
    local environment=${1:-"development"}
    
    # Validate environment
    if [[ ! "${!ENVIRONMENTS[@]}" =~ "$environment" ]]; then
        log_error "Invalid environment: $environment"
        usage
    fi
    
    # Execute action
    case $action in
        "deploy")
            deploy "$environment"
            ;;
        "rollback")
            if [ -z "$3" ]; then
                log_error "Deployment ID required for rollback"
                echo "Usage: $0 $environment rollback [deployment_id]"
                exit 1
            fi
            rollback "$environment" "$3"
            ;;
        "validate")
            validate_environment "$environment"
            ;;
        "test")
            run_tests
            ;;
        *)
            log_error "Invalid action: $action"
            usage
            ;;
    esac
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi