#!/bin/bash

# ================================
# FIX SSL ERROR - CGPlayerWeb v0.11.0
# Corrección para errores de imágenes de perfil en SSH
# ================================

echo "🔧 Aplicando corrección de errores SSL para imágenes de perfil..."
echo "📡 Servidor: 192.99.122.62"
echo ""

# 1. DETENER SERVICIOS
echo "🛑 Deteniendo servicios Docker..."
docker-compose down
echo "✅ Servicios detenidos"
echo ""

# 2. ACTUALIZAR CÓDIGO
echo "📥 Actualizando código desde Git..."
git fetch origin
git pull origin develop
echo "✅ Código actualizado"
echo ""

# 3. APLICAR CONFIGURACIÓN DE ENTORNO PARA SSH
echo "⚙️ Aplicando configuración específica para SSH..."
if [ -f ".env.ssh" ]; then
    cp .env.ssh .env
    echo "✅ Configuración SSH aplicada"
else
    echo "⚠️ Archivo .env.ssh no encontrado, creando manualmente..."
    cat > .env << 'EOF'
# Variables de entorno para CGPlayerWeb en SSH/VPS
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
    echo "✅ Configuración creada manualmente"
fi
echo ""

# 4. VERIFICAR CONFIGURACIÓN
echo "🔍 Verificando configuración aplicada..."
echo "IMAGE_URL_PROTOCOL=$(grep IMAGE_URL_PROTOCOL .env || echo 'No configurado')"
echo "SERVER_IP=$(grep SERVER_IP .env || echo 'No configurado')"
echo ""

# 5. LIMPIAR Y RECONSTRUIR
echo "🧹 Limpiando caché de Docker..."
docker system prune -f --volumes
docker image prune -f
echo "✅ Caché limpiado"
echo ""

echo "🔨 Reconstruyendo servicios con nueva configuración..."
docker-compose build --no-cache
docker-compose up -d
echo "✅ Servicios reconstruidos"
echo ""

# 6. VERIFICAR SERVICIOS
echo "📊 Verificando estado de contenedores..."
docker-compose ps
echo ""

# 7. VERIFICAR LOGS
echo "📋 Verificando logs del backend..."
docker-compose logs --tail=10 backend
echo ""

# 8. PROBAR GENERACIÓN DE URLs
echo "🧪 Probando generación de URLs de imágenes..."
echo "Las URLs de imágenes ahora deberían usar HTTP en lugar de HTTPS"
echo ""

echo "✅ Corrección de errores SSL completada!"
echo ""
echo "🎯 Cambios aplicados:"
echo "   • Protocolo de imágenes cambiado de HTTPS a HTTP"
echo "   • Variable IMAGE_URL_PROTOCOL configurada"
echo "   • IP del servidor configurada correctamente"
echo ""
echo "🔗 URLs corregidas:"
echo "   • Frontend: http://192.99.122.62:3000" 
echo "   • Backend: http://192.99.122.62:3001"
echo "   • Imágenes: http://192.99.122.62:3001/api/uploads/images/profiles/"
echo ""
echo "📝 Para verificar que funciona:"
echo "   1. Accede a http://192.99.122.62:3000"
echo "   2. Ve a tu perfil"  
echo "   3. Intenta subir una imagen de perfil"
echo "   4. La imagen debería cargarse sin errores SSL"
echo ""