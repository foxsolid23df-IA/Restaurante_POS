#!/bin/bash

# Production Deployment Script
# Restaurant POS System
# Author: Restaurant POS Team
# Version: 1.0.0

set -e  # Exit on error
set -u  # Treat unset variables as errors

# Colors for output
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
PROJECT_NAME="restaurant-pos"
ENVIRONMENT="${1:-production}"
BACKUP_DIR="/opt/backups"
DEPLOY_DIR="/opt/$PROJECT_NAME"
HEALTH_CHECK_TIMEOUT=300
MAX_RETRIES=3

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root is not recommended. Please use sudo."
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if curl is installed
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed"
        exit 1
    fi
    
    # Check environment file exists
    if [[ ! -f ".env.$ENVIRONMENT" ]]; then
        log_error "Environment file .env.$ENVIRONMENT not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Function to create backup
create_backup() {
    log_info "Creating backup of current deployment..."
    
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    if [[ -d "$DEPLOY_DIR" ]]; then
        tar -czf "$BACKUP_FILE" -C "$(dirname "$DEPLOY_DIR")" "$(basename "$DEPLOY_DIR")"
        log_success "Backup created: $BACKUP_FILE"
        
        # Keep only last 10 backups
        find "$BACKUP_DIR" -name "backup-*.tar.gz" -type f | sort -r | tail -n +11 | xargs -r rm
    else
        log_warning "No existing deployment to backup"
    fi
}

# Function to build application
build_application() {
    log_info "Building application..."
    
    # Copy environment file
    cp ".env.$ENVIRONMENT" .env
    
    # Run tests
    log_info "Running tests..."
    npm test --if-present
    
    # Build application
    log_info "Building production assets..."
    npm run build
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build -t "$PROJECT_NAME:$ENVIRONMENT" .
    docker build -t "$PROJECT_NAME:latest" .
    
    log_success "Application built successfully"
}

# Function to deploy application
deploy_application() {
    log_info "Deploying application to $ENVIRONMENT..."
    
    # Create deploy directory if it doesn't exist
    sudo mkdir -p "$DEPLOY_DIR"
    
    # Stop existing services
    log_info "Stopping existing services..."
    cd "$DEPLOY_DIR" || true
    sudo docker-compose down --remove-orphans || true
    
    # Copy new files
    log_info "Copying application files..."
    sudo rm -rf "$DEPLOY_DIR"/*
    sudo cp -r ./dist/* "$DEPLOY_DIR/"
    sudo cp -r ./nginx.conf "$DEPLOY_DIR/"
    sudo cp -r docker-compose.production.yml "$DEPLOY_DIR/docker-compose.yml"
    
    # Copy environment file
    sudo cp ".env.$ENVIRONMENT" "$DEPLOY_DIR/.env"
    
    # Set correct permissions
    sudo chown -R www-data:www-data "$DEPLOY_DIR"
    sudo chmod -R 755 "$DEPLOY_DIR"
    
    log_success "Application deployed successfully"
}

# Function to start services
start_services() {
    log_info "Starting services..."
    
    cd "$DEPLOY_DIR"
    sudo docker-compose up -d
    
    log_info "Waiting for services to start..."
    sleep 30
    
    log_success "Services started successfully"
}

# Function to health check
health_check() {
    log_info "Performing health check..."
    
    local retries=0
    local health_url="http://localhost:8080/health"
    
    while [[ $retries -lt $MAX_RETRIES ]]; do
        if curl -f -s "$health_url" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        retries=$((retries + 1))
        log_warning "Health check failed, retrying... ($retries/$MAX_RETRIES)"
        sleep 10
    done
    
    log_error "Health check failed after $MAX_RETRIES attempts"
    return 1
}

# Function to verify critical endpoints
verify_endpoints() {
    log_info "Verifying critical endpoints..."
    
    local endpoints=(
        "/"
        "/pin-login"
        "/dashboard"
        "/pos"
        "/api/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "http://localhost:8080$endpoint" > /dev/null; then
            log_success "Endpoint $endpoint is responding"
        else
            log_error "Endpoint $endpoint is not responding"
            return 1
        fi
    done
    
    log_success "All endpoints verified successfully"
}

# Function to rollback on failure
rollback_on_failure() {
    log_error "Deployment failed, initiating rollback..."
    
    # Get latest backup
    local latest_backup=$(find "$BACKUP_DIR" -name "backup-*.tar.gz" -type f | sort -r | head -n 1)
    
    if [[ -n "$latest_backup" ]]; then
        log_info "Rolling back to: $latest_backup"
        
        # Stop current services
        cd "$DEPLOY_DIR" || true
        sudo docker-compose down || true
        
        # Restore from backup
        sudo rm -rf "$DEPLOY_DIR"
        sudo mkdir -p "$DEPLOY_DIR"
        sudo tar -xzf "$latest_backup" -C "$(dirname "$DEPLOY_DIR")"
        
        # Start services
        cd "$DEPLOY_DIR"
        sudo docker-compose up -d
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

# Function to notify team
notify_team() {
    local status=$1
    local message="Deployment to $ENVIRONMENT: $status"
    
    log_info "Sending notification: $message"
    
    # Slack notification (if webhook URL is configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # Email notification (if configured)
    if [[ -n "${DEPLOYMENT_EMAIL:-}" ]]; then
        echo "$message" | mail -s "Restaurant POS Deployment" "$DEPLOYMENT_EMAIL" || true
    fi
}

# Function to cleanup
cleanup() {
    log_info "Cleaning up..."
    
    # Remove temporary files
    rm -f .env
    
    # Clean up Docker images
    docker image prune -f || true
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting deployment of $PROJECT_NAME to $ENVIRONMENT"
    
    # Trap errors and cleanup
    trap 'rollback_on_failure; cleanup' ERR
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Build application
    build_application
    
    # Deploy application
    deploy_application
    
    # Start services
    start_services
    
    # Health check
    if ! health_check; then
        notify_team "FAILED - Health check failed"
        exit 1
    fi
    
    # Verify endpoints
    if ! verify_endpoints; then
        notify_team "FAILED - Endpoint verification failed"
        exit 1
    fi
    
    # Cleanup
    cleanup
    
    # Notify success
    notify_team "SUCCESS"
    
    log_success "🚀 Deployment completed successfully!"
    log_info "Application is available at: http://localhost:8080"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [environment]"
        echo "  environment: staging|production (default: production)"
        exit 0
        ;;
    --version|-v)
        echo "$PROJECT_NAME deployment script v1.0.0"
        exit 0
        ;;
esac

# Check if environment is valid
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_error "Valid environments: staging, production"
    exit 1
fi

# Run main function
main "$@"