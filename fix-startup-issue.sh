# Script de solución rápida para el problema de start.sh
# Ejecutar en el VPS como root

#!/bin/bash

cd /root/CGPlayerWeb

echo "🛠️ SOLUCIÓN RÁPIDA: Problema start.sh no encontrado"
echo "=================================================="

echo "1. Parando containers..."
docker-compose down

echo "2. Limpiando imágenes..."
docker rmi cgplayerweb-app:latest 2>/dev/null || true
docker system prune -f

echo "3. Verificando archivos críticos..."
if [ ! -f "docker/start.sh" ]; then
    echo "❌ ERROR: docker/start.sh no existe"
    exit 1
fi

echo "4. Estableciendo permisos correctos..."
chmod +x docker/start.sh

echo "5. Reconstruyendo imagen (esto puede tomar varios minutos)..."
docker-compose build --no-cache --pull

echo "6. Iniciando containers..."
docker-compose up -d

echo "7. Esperando 10 segundos para verificar estado..."
sleep 10

echo "8. Estado final:"
docker-compose ps

echo "9. Logs del container principal:"
docker-compose logs --tail=30 cgplayer-app

echo ""
echo "=================================================="
echo "✅ Si ves 'cgplayer-app' en estado 'Up', el problema está resuelto"
echo "🌐 Puedes acceder a: http://192.99.122.62"
echo "👤 Usuario: admin@cgplayer.local"
echo "🔑 Contraseña: cgplayer2025"
echo ""
echo "📊 Para ver logs en tiempo real:"
echo "   docker-compose logs -f cgplayer-app"
echo "=================================================="