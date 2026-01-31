#!/bin/bash

# Production Deployment Script - Restaurante POS
# Requisitos: Node.js 18+, Docker, Nginx

set -e

echo "🚀 Iniciando deployment producción - Sistema POS"

# Validar variables de entorno
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Variables de entorno de Supabase no configuradas"
    exit 1
fi

# Build optimizado para producción
echo "📦 Build optimizado para producción..."
npm ci --only=production
npm run build:prod

# Verificar build
if [ ! -d "dist" ]; then
    echo "❌ Error: Build fallido"
    exit 1
fi

# Optimización de assets
echo "⚡ Optimizando assets..."
npm run optimize:images
npm run analyze:bundlesize

# Docker build
echo "🐳 Construyendo imagen Docker..."
docker build -t restaurante-pos:latest .
docker tag restaurante-pos:latest restaurante-pos:$(date +%Y%m%d-%H%M%S)

# Deploy a staging primero
echo "🧪 Deploy a staging..."
docker-compose -f docker-compose.staging.yml up -d

# Health check
echo "🔍 Verificando salud del sistema..."
sleep 30
curl -f http://localhost:3001/health || exit 1

# Deploy a producción si staging está OK
echo "🎯 Deploy a producción..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deploy completado exitosamente"
echo "📊 Monitoreo disponible en: http://localhost:3000/monitoring"