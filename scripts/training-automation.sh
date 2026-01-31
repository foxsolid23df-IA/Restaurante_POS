#!/bin/bash

# Staff Training Automation Script
# Automates the complete training workflow for restaurant POS system

set -e

# Configuration
TRAINING_PORTAL="https://training.restaurant-pos.com"
ADMIN_EMAIL="admin@restaurant.com"
TRAINING_DURATION_DAYS=15
CERTIFICATION_REQUIRED=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on production environment
check_production_readiness() {
    log "Verifying production environment readiness..."
    
    # Check if production environment is accessible
    if curl -f -s "https://pos.yourdomain.com/health" > /dev/null; then
        log_success "Production system is online and healthy"
    else
        log_error "Production system is not accessible"
        exit 1
    fi
    
    # Check if training environment is set up
    if curl -f -s "${TRAINING_PORTAL}/health" > /dev/null; then
        log_success "Training portal is accessible"
    else
        log_warning "Training portal not accessible, using local simulation"
    fi
}

# Create user accounts for training
create_training_accounts() {
    log "Creating training user accounts..."
    
    # Wait staff accounts
    declare -a WAIT_STAFF=("waiter1" "waiter2" "waiter3")
    for username in "${WAIT_STAFF[@]}"; do
        log "Creating account: $username"
        # Command to create user in production system
        curl -X POST "https://pos.yourdomain.com/api/users" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${ADMIN_TOKEN}" \
            -d "{
                \"username\": \"$username\",
                \"email\": \"$username@training.restaurant.com\",
                \"role\": \"waiter\",
                \"temporary\": true,
                \"expires_at\": \"$(date -d "+${TRAINING_DURATION_DAYS} days" -I)\"
            }" || log_warning "Failed to create $username"
    done
    
    # Kitchen staff accounts
    declare -a KITCHEN_STAFF=("chef1" "chef2" "kitchen1")
    for username in "${KITCHEN_STAFF[@]}"; do
        log "Creating account: $username"
        curl -X POST "https://pos.yourdomain.com/api/users" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${ADMIN_TOKEN}" \
            -d "{
                \"username\": \"$username\",
                \"email\": \"$username@training.restaurant.com\",
                \"role\": \"kitchen\",
                \"temporary\": true,
                \"expires_at\": \"$(date -d "+${TRAINING_DURATION_DAYS} days" -I)\"
            }" || log_warning "Failed to create $username"
    done
    
    # Management accounts
    declare -a MANAGEMENT=("manager1" "admin_training")
    for username in "${MANAGEMENT[@]}"; do
        log "Creating account: $username"
        curl -X POST "https://pos.yourdomain.com/api/users" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${ADMIN_TOKEN}" \
            -d "{
                \"username\": \"$username\",
                \"email\": \"$username@training.restaurant.com\",
                \"role\": \"manager\",
                \"temporary\": true,
                \"expires_at\": \"$(date -d "+${TRAINING_DURATION_DAYS} days" -I)\"
            }" || log_warning "Failed to create $username"
    done
    
    log_success "Training accounts created successfully"
}

# Send training invitations
send_training_invitations() {
    log "Sending training invitations..."
    
    # Training schedule email template
    cat > training_invitations.json <<EOF
{
    "subject": "🍽️ Capacitación Sistema POS - Restaurante",
    "template": "training_schedule",
    "recipients": [
        "waiter1@training.restaurant.com",
        "waiter2@training.restaurant.com", 
        "waiter3@training.restaurant.com",
        "chef1@training.restaurant.com",
        "chef2@training.restaurant.com",
        "kitchen1@training.restaurant.com",
        "manager1@training.restaurant.com",
        "admin_training@training.restaurant.com"
    ],
    "schedule": {
        "week1": {
            "day1": "Módulo 1 - Navegación Básica (2 horas)",
            "day2": "Módulo 2 - Gestión de Órdenes Parte 1 (2 horas)",
            "day3": "Módulo 2 - Gestión de Órdenes Parte 2 (1 hora)",
            "day4": "Módulo 3 - Sistema de Visualización de Cocina (2 horas)",
            "day5": "Módulo 4 - Gestión de Mesas (1.5 horas)"
        },
        "week2": {
            "day6": "Módulo 5 - Gestión de Inventario (3 horas)",
            "day7": "Módulo 6 - Reportes Parte 1 (2 horas)",
            "day8": "Módulo 6 - Reportes Parte 2 (0.5 horas)",
            "day9": "Módulo 7 - Configuración de Impresoras (1.5 horas)",
            "day10": "Revisión General (2 horas)"
        },
        "week3": {
            "day11-12": "Módulo 8 - Administración del Sistema (4 horas por día)",
            "day13": "Escenarios Avanzados por Rol (3 horas)",
            "day14": "Ejercicios de Integración (2 horas)",
            "day15": "Evaluación Final y Certificación (3 horas)"
        }
    },
    "training_materials": {
        "manuals": "${TRAINING_PORTAL}/manuals",
        "videos": "${TRAINING_PORTAL}/videos",
        "quizzes": "${TRAINING_PORTAL}/quizzes",
        "support": "${TRAINING_PORTAL}/support"
    },
    "requirements": {
        "completion_rate": 95,
        "passing_score": 90,
        "certification": $CERTIFICATION_REQUIRED
    }
}
EOF
    
    # Send via email service
    curl -X POST "https://api.emailservice.com/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${EMAIL_API_KEY}" \
        -d @training_invitations.json || log_error "Failed to send invitations"
    
    log_success "Training invitations sent to all participants"
}

# Setup training environment
setup_training_environment() {
    log "Setting up training environment..."
    
    # Create training data set
    curl -X POST "https://pos.yourdomain.com/api/training/setup" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -d '{
            "mode": "training",
            "reset_data": true,
            "create_sample_data": true,
            "sample_orders": 50,
            "sample_products": 100,
            "sample_tables": 20,
            "enable_tips": true,
            "disable_real_payments": true
        }' || log_error "Failed to setup training environment"
    
    log_success "Training environment configured with sample data"
}

# Run automated assessments
run_training_assessments() {
    log "Configuring automated assessments..."
    
    # Module assessments configuration
    cat > assessment_config.json <<EOF
{
    "modules": [
        {
            "name": "Basic Navigation",
            "quiz_id": "nav_basic",
            "passing_score": 95,
            "time_limit": 30,
            "attempts": 3
        },
        {
            "name": "Order Management", 
            "quiz_id": "order_mgmt",
            "passing_score": 90,
            "time_limit": 45,
            "attempts": 3
        },
        {
            "name": "Kitchen Display System",
            "quiz_id": "kitchen_display",
            "passing_score": 85,
            "time_limit": 30,
            "attempts": 3
        },
        {
            "name": "Table Management",
            "quiz_id": "table_mgmt",
            "passing_score": 90,
            "time_limit": 25,
            "attempts": 3
        },
        {
            "name": "Inventory Management",
            "quiz_id": "inventory_mgmt", 
            "passing_score": 85,
            "time_limit": 60,
            "attempts": 3
        },
        {
            "name": "Reporting",
            "quiz_id": "reporting",
            "passing_score": 90,
            "time_limit": 45,
            "attempts": 3
        },
        {
            "name": "Printer Configuration",
            "quiz_id": "printer_config",
            "passing_score": 85,
            "time_limit": 30,
            "attempts": 3
        },
        {
            "name": "System Administration",
            "quiz_id": "sys_admin",
            "passing_score": 90,
            "time_limit": 90,
            "attempts": 2
        }
    ],
    "certification": {
        "required_modules": ["nav_basic", "order_mgmt", "table_mgmt"],
        "required_score": 90,
        "practical_exam": true,
        "time_limit": 120
    }
}
EOF
    
    # Upload assessment configuration
    curl -X POST "https://pos.yourdomain.com/api/training/assessments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -d @assessment_config.json || log_error "Failed to configure assessments"
    
    log_success "Training assessments configured"
}

# Monitor training progress
monitor_training_progress() {
    log "Starting training progress monitoring..."
    
    # Monitor progress for training duration
    for ((day=1; day<=TRAINING_DURATION_DAYS; day++)); do
        log "Monitoring Day $day of training..."
        
        # Check completion rates
        completion_data=$(curl -s -H "Authorization: Bearer ${ADMIN_TOKEN}" \
            "https://pos.yourdomain.com/api/training/progress")
        
        completion_rate=$(echo $completion_data | jq '.completion_rate')
        
        if (( $(echo "$completion_rate < 80" | bc -l) )); then
            log_warning "Low completion rate: ${completion_rate}% - Sending reminders"
            send_reminder_email
        fi
        
        # Check quiz results
        failed_quizzes=$(echo $completion_data | jq '.failed_quizzes | length')
        if [ "$failed_quizzes" -gt 0 ]; then
            log_warning "There are $failed_quizzes failed quizzes - Providing additional support"
        fi
        
        sleep 86400 # Wait 1 day
    done
}

# Send reminder emails
send_reminder_email() {
    cat > reminder.json <<EOF
{
    "subject": "📚 Recordatorio de Capacitación POS",
    "template": "training_reminder",
    "message": "Tu progreso en la capacitación está por debajo del objetivo recomendado. Por favor completa los módulos pendientes.",
    "action_url": "${TRAINING_PORTAL}",
    "support_contact": "capacitacion@restaurant.com"
}
EOF
    
    curl -X POST "https://api.emailservice.com/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${EMAIL_API_KEY}" \
        -d @reminder.json
}

# Generate training completion report
generate_completion_report() {
    log "Generating training completion report..."
    
    report_date=$(date +%Y-%m-%d)
    report_file="training_report_${report_date}.json"
    
    # Get final training data
    final_data=$(curl -s -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        "https://pos.yourdomain.com/api/training/final-report")
    
    # Generate comprehensive report
    cat > "$report_file" <<EOF
{
    "report_date": "$report_date",
    "training_duration": "${TRAINING_DURATION_DAYS} days",
    "participants": $final_data,
    "summary": {
        "total_participants": $(echo $final_data | jq '.total'),
        "completion_rate": $(echo $final_data | jq '.completion_rate'),
        "average_score": $(echo $final_data | jq '.average_score'),
        "certified_staff": $(echo $final_data | jq '.certified_count'),
        "improvement_areas": $(echo $final_data | jq '.improvement_areas'),
        "success_rate": $(echo $final_data | jq '.success_rate')
    },
    "recommendations": [
        "Continue with monthly refresher training",
        "Focus on areas with low completion rates",
        "Schedule advanced training for certified staff",
        "Implement peer mentoring program"
    ],
    "next_steps": [
        "Schedule regular follow-up sessions",
        "Update training materials based on feedback",
        "Plan advanced skill development workshops"
    ]
}
EOF
    
    log_success "Training report generated: $report_file"
    
    # Send report to management
    curl -X POST "https://api.emailservice.com/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${EMAIL_API_KEY}" \
        -d "{
            \"subject\": \"📊 Reporte Final de Capacitación POS\",
            \"to\": \"$ADMIN_EMAIL\",
            \"attachment\": \"$report_file\",
            \"message\": \"Adjunto el reporte final de la capacitación del sistema POS.\"
        }"
}

# Cleanup training environment
cleanup_training_environment() {
    log "Cleaning up training environment..."
    
    # Remove temporary accounts
    curl -X DELETE "https://pos.yourdomain.com/api/training/cleanup" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -d '{
            "remove_temporary_accounts": true,
            "reset_training_data": true,
            "export_results": true
        }' || log_error "Failed to cleanup training environment"
    
    log_success "Training environment cleanup completed"
}

# Main execution function
main() {
    log "🍽️ Starting Restaurant POS Staff Training Automation"
    
    # Check prerequisites
    if [ -z "$ADMIN_TOKEN" ] || [ -z "$EMAIL_API_KEY" ]; then
        log_error "Missing required environment variables: ADMIN_TOKEN, EMAIL_API_KEY"
        exit 1
    fi
    
    # Execute training workflow
    check_production_readiness
    create_training_accounts
    send_training_invitations
    setup_training_environment
    run_training_assessments
    monitor_training_progress
    generate_completion_report
    
    # Ask if cleanup should be performed
    read -p "¿Desea limpiar el entorno de entrenamiento? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup_training_environment
    fi
    
    log_success "🎉 Staff training automation completed successfully!"
    log "📊 Training report available and staff ready for production use"
}

# Execute main function
main "$@"