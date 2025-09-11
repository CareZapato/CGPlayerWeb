#!/bin/bash

# Script de corrección para el problema de start.sh no encontrado
# Ejecutar en el VPS: bash fix-docker-startup.sh

echo "🔧 Solucionando problema de start.sh no encontrado..."

# Parar containers
echo "⏹️ Deteniendo containers..."
docker-compose down

# Eliminar imagen actual
echo "🗑️ Eliminando imagen actual..."
docker rmi cgplayerweb-app:latest 2>/dev/null || true

# Verificar que start.sh existe
echo "🔍 Verificando archivos críticos..."
if [ ! -f "docker/start.sh" ]; then
    echo "❌ Error: docker/start.sh no encontrado"
    exit 1
fi

echo "📋 Contenido del directorio docker:"
ls -la docker/

echo "🔧 Verificando permisos de start.sh..."
chmod +x docker/start.sh
ls -la docker/start.sh

# Reconstruir imagen sin cache
echo "🏗️ Reconstruyendo imagen Docker..."
docker-compose build --no-cache --pull

echo "🚀 Iniciando containers..."
docker-compose up -d

echo "📊 Estado de containers:"
docker-compose ps

echo "📝 Logs del container app:"
docker-compose logs cgplayer-app

echo "✅ Script completado. Si el problema persiste, verificar logs con:"
echo "   docker-compose logs -f cgplayer-app"