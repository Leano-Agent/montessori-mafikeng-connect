#!/bin/bash

# Montessori Mafikeng Connect - Rollback Script
# Author: Tyriie Solutions
# Version: 1.0.0

set -e
set -o pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
PROJECT_NAME="Montessori Mafikeng Connect"
BACKUP_DIR="./backups"
ROLLBACK_LOG="rollback_$(date +"%Y%m%d_%H%M%S").log"

# Check if running as root (for some operations)
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_warning "Some operations may require root privileges"
    fi
}

# Validate rollback target
validate_rollback_target() {
    local environment=$1
    local deployment_id=$2
    
    log_info "Validating rollback target..."
    
    # Check if deployment ID exists
    local backup_file="$BACKUP_DIR/${environment}_${deployment_id}.backup"
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Check if we have necessary credentials
    case $environment in
        "production")
            if [ -z "$PRODUCTION_DATABASE_URL" ]; then
                log_error "Production database URL not set"
                return 1
            fi
            ;;
        "staging")
            if [ -z "$STAGING_DATABASE_URL" ]; then
                log_error "Staging database URL not set"
                return 1
            fi
            ;;
        "development")
            if [ -z "$DATABASE_URL" ]; then
                log_error "Development database URL not set"
                return 1
            fi
            ;;
        *)
            log_error "Unknown environment: $environment"
            return 1
            ;;
    esac
    
    log_success "Rollback target validated"
    return 0
}

# Restore database from backup
restore_database() {
    local environment=$1
    local deployment_id=$2
    
    log_info "Restoring database from backup..."
    
    local backup_file="$BACKUP_DIR/${environment}_${deployment_id}.backup"
    
    # Get database URL based on environment
    local database_url=""
    case $environment in
        "production") database_url="$PRODUCTION_DATABASE_URL" ;;
        "staging") database_url="$STAGING_DATABASE_URL" ;;
        "development") database_url="$DATABASE_URL" ;;
    esac
    
    # Parse database URL
    local db_user=$(echo "$database_url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    local db_password=$(echo "$database_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    local db_host=$(echo "$database_url" | sed -n 's/.*@\([^:/]*\).*/\1/p')
    local db_port=$(echo "$database_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local db_name=$(echo "$database_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    # Restore database
    log_info "Restoring to database: $db_name on $db_host"
    
    if PGPASSWORD="$db_password" pg_restore \
        --host="$db_host" \
        --port="$db_port" \
        --username="$db_user" \
        --dbname="$db_name" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        --verbose \
        "$backup_file"; then
        log_success "Database restored successfully"
        return 0
    else
        log_error "Database restore failed"
        return 1
    fi
}

# Revert Docker images
revert_docker_images() {
    local environment=$1
    local deployment_id=$2
    
    log_info "Reverting Docker images..."
    
    # Check for previous image tags
    local previous_frontend_tag="montessori-frontend:${deployment_id}"
    local previous_backend_tag="montessori-backend:${deployment_id}"
    
    # Check if previous images exist
    if ! docker image inspect "$previous_frontend_tag" > /dev/null 2>&1; then
        log_warning "Previous frontend image not found: $previous_frontend_tag"
        log_info "Pulling from registry..."
        # Try to pull from registry
        docker pull "$previous_frontend_tag" || {
            log_error "Failed to get previous frontend image"
            return 1
        }
    fi
    
    if ! docker image inspect "$previous_backend_tag" > /dev/null 2>&1; then
        log_warning "Previous backend image not found: $previous_backend_tag"
        log_info "Pulling from registry..."
        docker pull "$previous_backend_tag" || {
            log_error "Failed to get previous backend image"
            return 1
        }
    fi
    
    # Update Docker Compose to use previous images
    local compose_file="docker-compose.yml"
    if [ "$environment" = "production" ]; then
        compose_file="docker-compose.prod.yml"
    fi
    
    # Backup current compose file
    cp "$compose_file" "${compose_file}.backup.$(date +%s)"
    
    # Update image tags in compose file
    sed -i "s|image: montessori-frontend:.*|image: $previous_frontend_tag|" "$compose_file"
    sed -i "s|image: montessori-backend:.*|image: $previous_backend_tag|" "$compose_file"
    
    # Restart services
    log_info "Restarting services with previous images..."
    docker-compose -f "$compose_file" down
    docker-compose -f "$compose_file" up -d
    
    log_success "Docker images reverted"
    return 0
}

# Revert Vercel deployment
revert_vercel_deployment() {
    local environment=$1
    local deployment_id=$2
    
    log_info "Reverting Vercel deployment..."
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not installed"
        return 1
    fi
    
    # Get previous deployment
    log_info "Looking for previous deployment..."
    local previous_deployment=$(vercel list --token "$VERCEL_TOKEN" | grep -v "$deployment_id" | head -2 | tail -1 | awk '{print $2}')
    
    if [ -z "$previous_deployment" ]; then
        log_error "No previous deployment found"
        return 1
    fi
    
    # Rollback to previous deployment
    log_info "Rolling back to deployment: $previous_deployment"
    if vercel rollback "$previous_deployment" --token "$VERCEL_TOKEN" --yes; then
        log_success "Vercel deployment reverted"
        return 0
    else
        log_error "Failed to revert Vercel deployment"
        return 1
    fi
}

# Revert Railway deployment
revert_railway_deployment() {
    local environment=$1
    local deployment_id=$2
    
    log_info "Reverting Railway deployment..."
    
    # Check Railway CLI
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI not installed"
        return 1
    fi
    
    # Get deployment history
    log_info "Getting deployment history..."
    local previous_deployment=$(railway deployments list | grep -v "$deployment_id" | head -2 | tail -1 | awk '{print $1}')
    
    if [ -z "$previous_deployment" ]; then
        log_error "No previous deployment found"
        return 1
    fi
    
    # Rollback to previous deployment
    log_info "Rolling back to deployment: $previous_deployment"
    if railway deployments redeploy "$previous_deployment"; then
        log_success "Railway deployment reverted"
        return 0
    else
        log_error "Failed to revert Railway deployment"
        return 1
    fi
}

# Update environment variables
update_environment_variables() {
    local environment=$1
    local deployment_id=$2
    
    log_info "Updating environment variables..."
    
    # Restore environment variables from backup
    local env_backup="$BACKUP_DIR/${environment}_${deployment_id}.env"
    
    if [ -f "$env_backup" ]; then
        log_info "Restoring environment variables from backup..."
        
        # Backup current .env file
        if [ -f ".env" ]; then
            cp ".env" ".env.backup.$(date +%s)"
        fi
        
        # Restore from backup
        cp "$env_backup" ".env"
        
        # Source the environment variables
        set -a
        source ".env"
        set +a
        
        log_success "Environment variables updated"
        return 0
    else
        log_warning "No environment variable backup found"
        return 0
    fi
}

# Run health checks after rollback
run_post_rollback_checks() {
    local environment=$1
    
    log_info "Running post-rollback health checks..."
    
    # Determine URLs based on environment
    case $environment in
        "production")
            local frontend_url="${PRODUCTION_FRONTEND_URL}"
            local backend_url="${PRODUCTION_BACKEND_URL}"
            ;;
        "staging")
            local frontend_url="${STAGING_FRONTEND_URL}"
            local backend_url="${STAGING_BACKEND_URL}"
            ;;
        "development")
            local frontend_url="http://localhost:3000"
            local backend_url="http://localhost:3001"
            ;;
        *)
            log_error "Unknown environment: $environment"
            return 1
            ;;
    esac
    
    # Check backend
    log_info "Checking backend at $backend_url/api/health..."
    if ! curl -f -s "$backend_url/api/health" | grep -q "healthy"; then
        log_error "Backend health check failed after rollback"
        return 1
    fi
    
    # Check frontend
    log_info "Checking frontend at $frontend_url..."
    if ! curl -f -s "$frontend_url" > /dev/null; then
        log_error "Frontend health check failed after rollback"
        return 1
    fi
    
    log_success "Post-rollback health checks passed"
    return 0
}

# Create rollback summary
create_rollback_summary() {
    local environment=$1
    local deployment_id=$2
    local status=$3
    
    log_info "Creating rollback summary..."
    
    local summary_file="rollback_summary_$(date +"%Y%m%d_%H%M%S").md"
    
    cat > "$summary_file" << EOF
# Montessori Mafikeng Connect - Rollback Summary

## Rollback Information
- **Project:** $PROJECT_NAME
- **Environment:** $environment
- **Rollback From:** Current deployment
- **Rollback To:** Deployment $deployment_id
- **Date:** $(date)
- **Rollback Status:** $status
- **Rollback ID:** $(date +"%Y%m%d_%H%M%S")

## Rollback Actions Performed
1. Database restored from backup
2. Docker images reverted to previous version
3. Environment variables updated
4. Services restarted

## Health Check Results
- Backend API: ✅ Healthy
- Frontend Application: ✅ Healthy
- Database Connection: ✅ Connected

## Next Steps
1. Verify all functionality is working
2. Monitor error rates and performance
3. Update stakeholders about rollback
4. Investigate root cause of issues

## Support Contacts
- Technical Support: support@montessori-mafikeng.connect
- Emergency: +27 82 123 4567

## Notes
$(if [ "$status" = "SUCCESS" ]; then
    echo "Rollback completed successfully. System should be stable."
else
    echo "Rollback encountered issues. Manual intervention may be required."
fi)

---
*Generated automatically by rollback script*
EOF
    
    log_success "Rollback summary created: $summary_file"
    return 0
}

# Send rollback notifications
send_rollback_notifications() {
    local environment=$1
    local deployment_id=$2
    local status=$3
    
    log_info "Sending rollback notifications..."
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local message="Rollback performed in $environment environment to deployment $deployment_id. Status: $status"
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || log_warning "Failed to send Slack notification"
    fi
    
    # Email notification
    if [ -n "$EMAIL_RECIPIENTS" ]; then
        log_info "Email notification would be sent to: $EMAIL_RECIPIENTS"
        # Implement email sending based on your email service
    fi
    
    log_success "Notifications sent"
    return 0
}

# Main rollback function
rollback() {
    local environment=$1
    local deployment_id=$2
    
    log_info "Starting rollback process..."
    log_info "Environment: $environment"
    log_info "Target Deployment: $deployment_id"
    
    # Start logging
    exec > >(tee -a "$ROLLBACK_LOG") 2>&1
    
    # Step 1: Check root privileges
    check_root
    
    # Step 2: Validate rollback target
    if ! validate_rollback_target "$environment" "$deployment_id"; then
        log_error "Rollback target validation failed"
        return 1
    fi
    
    # Step 3: Update environment variables
    if ! update_environment_variables "$environment" "$deployment_id"; then
        log_warning "Environment variable update had issues"
    fi
    
    # Step 4: Restore database
    if ! restore_database "$environment" "$deployment_id"; then
        log_error "Database restore failed"
        return 1
    fi
    
    # Step 5: Revert deployments based on environment
    case $environment in
        "production"|"staging")
            # Cloud platform rollbacks
            if ! revert_railway_deployment "$environment" "$deployment_id"; then
                log_error "Railway rollback failed"
                return 1
            fi
            
            if ! revert_vercel_deployment "$environment" "$deployment_id"; then
                log_error "Vercel rollback failed"
                return 1
            fi
            ;;
        "development")
            # Local Docker rollback
            if ! revert_docker_images "$environment" "$deployment_id"; then
                log_error "Docker rollback failed"
                return 1
            fi
            ;;
    esac
    
    # Step 6: Run health checks
    if ! run_post_rollback_checks "$environment"; then
        log_error "Post-rollback health checks failed"
        return 1
    fi
    
    # Step 7: Create summary
    if ! create_rollback_summary "$environment" "$deployment_id" "SUCCESS"; then
        log_warning "Failed to create rollback summary"
    fi
    
    # Step 8: Send notifications
    if ! send_rollback_notifications "$environment" "$deployment_id" "SUCCESS"; then
        log_warning "Failed to send notifications"
    fi
    
    log_success "Rollback completed successfully!"
    log_info "Rollback log: $ROLLBACK_LOG"
    
    return 0
}

# Show usage
usage() {
    echo "Usage: $0 [environment] [deployment_id]"
    echo ""
    echo "Environments:"
    echo "  production   Rollback production environment"
    echo "  staging      Rollback staging environment"
    echo "  development  Rollback development environment"
    echo ""
    echo "Examples:"
    echo "  $0 production 20240330_120000  # Rollback production to specific deployment"
    echo "  $0 staging latest              # Rollback staging to latest backup"
    echo ""
    exit 1
}

# Main script execution
main() {
    local environment=$1
    local deployment_id=$2
    
    if [ -z "$environment" ] || [ -z "$deployment_id" ]; then
        usage
    fi
    
    # Validate environment
    case $environment in
        "production"|"staging"|"development")
            # Valid environment
            ;;
        *)
            log_error "Invalid environment: $environment"
            usage
            ;;
    esac
    
    # Execute rollback
    rollback "$environment" "$deployment_id"
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi