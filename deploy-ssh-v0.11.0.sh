#!/bin/bash

# ================================
# DEPLOY SSH v0.11.0 - CGPlayerWeb
# Sistema de Ensayos y Avatares Animados
# Fecha: 22 de septiembre de 2025
# ================================

echo "🚀 Iniciando deploy de CGPlayerWeb v0.11.0..."
echo "📡 Servidor: 192.99.122.62"
echo "🎭 Nuevas características: Sistema de Ensayos y Avatares Animados"
echo ""

# 1. DETENER SERVICIOS ACTUALES
echo "🛑 Deteniendo servicios Docker actuales..."
docker-compose down
echo "✅ Servicios detenidos"
echo ""

# 2. HACER BACKUP DE LA BASE DE DATOS (opcional pero recomendado)
echo "💾 Creando backup de la base de datos..."
docker exec cgplayerweb-db-1 pg_dump -U cgplayer cgplayer_db > backup_pre_v0.11.0_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Backup creado"
echo ""

# 3. ACTUALIZAR CÓDIGO DESDE GIT
echo "📥 Actualizando código desde Git..."
git fetch origin
git checkout develop
git pull origin develop
echo "✅ Código actualizado desde Git"
echo ""

# 3.1. APLICAR CONFIGURACIÓN ESPECÍFICA PARA SSH
echo "⚙️ Aplicando configuración SSH (corrige errores SSL de imágenes)..."
if [ -f ".env.ssh" ]; then
    cp .env.ssh .env
    echo "✅ Configuración SSH aplicada"
else
    echo "⚠️ Creando configuración SSH..."
    cat > .env << 'EOF'
DB_PASSWORD=cgplayer123
DATABASE_URL=postgresql://cgplayer:cgplayer123@database:5432/cgplayerweb
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
FRONTEND_URL=http://192.99.122.62:3000
BACKEND_URL=http://192.99.122.62:3001
IMAGE_URL_PROTOCOL=http
SERVER_IP=192.99.122.62
API_HOST=192.99.122.62
REDIS_URL=redis://redis:6379
MAX_FILE_SIZE=50MB
UPLOAD_PATH=/app/backend/uploads
SEED_DATABASE=false
EOF
    echo "✅ Configuración SSH creada"
fi
echo ""

# 4. VERIFICAR CAMBIOS DE VERSIÓN
echo "🔍 Verificando archivos de versión actualizados..."
echo "Frontend package.json:"
cat frontend/package.json | grep '"version"'
echo "Backend package.json:"
cat backend/package.json | grep '"version"'
echo "appConfig.ts:"
cat frontend/src/config/appConfig.ts | grep "version:"
echo ""

# 5. LIMPIAR VOLÚMENES Y CACHÉ DE DOCKER
echo "🧹 Limpiando caché y volúmenes de Docker..."
docker system prune -f --volumes
docker image prune -f
echo "✅ Caché limpiado"
echo ""

# 6. REBUILD Y RESTART DE SERVICIOS
echo "🔨 Reconstruyendo y iniciando servicios..."
docker-compose build --no-cache
docker-compose up -d
echo "✅ Servicios reconstruidos e iniciados"
echo ""

# 7. VERIFICAR ESTADO DE CONTENEDORES
echo "📊 Verificando estado de los contenedores..."
docker-compose ps
echo ""

# 8. VERIFICAR LOGS INICIALES
echo "📋 Verificando logs iniciales..."
echo "=== BACKEND LOGS (últimas 20 líneas) ==="
docker-compose logs --tail=20 backend
echo ""
echo "=== FRONTEND LOGS (últimas 20 líneas) ==="
docker-compose logs --tail=20 frontend
echo ""

# 9. EJECUTAR SCRIPT DE NOTICIAS (si es necesario)
echo "📰 Ejecutando script de noticias para v0.11.0..."
docker-compose exec backend node add-v0.11.0-news.js
echo "✅ Noticia de versión agregada"
echo ""

# 10. VERIFICACIÓN FINAL
echo "🎯 Verificación final del deploy..."
echo "🌐 Frontend debería estar disponible en: http://192.99.122.62:3000"
echo "🔧 Backend API disponible en: http://192.99.122.62:3001"
echo ""
echo "🎭 CGPlayerWeb v0.11.0 - Deploy completado exitosamente!"
echo "✨ Nuevas características:"
echo "   • Sistema completo de Ensayos"
echo "   • Avatares animados con franjas identificadoras"
echo "   • Contadores dinámicos de asistentes"
echo "   • Mejoras visuales significativas"
echo ""
echo "📝 Para monitorear logs en tiempo real:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
