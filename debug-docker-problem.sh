# Script de diagnóstico para ejecutar en el VPS
# Uso: bash debug-docker-problem.sh

echo "🔍 DIAGNÓSTICO: Problema start.sh no encontrado"
echo "=============================================="

echo "📁 Verificando estructura de archivos..."
echo "Directorio actual: $(pwd)"
echo "Contenido del directorio:"
ls -la

echo ""
echo "📁 Contenido del directorio docker:"
if [ -d "docker" ]; then
    ls -la docker/
    echo ""
    echo "🔍 Verificando start.sh específicamente:"
    if [ -f "docker/start.sh" ]; then
        echo "✅ docker/start.sh existe"
        echo "Permisos: $(ls -la docker/start.sh)"
        echo "Primeras 5 líneas:"
        head -5 docker/start.sh
    else
        echo "❌ docker/start.sh NO existe"
    fi
else
    echo "❌ Directorio docker no encontrado"
fi

echo ""
echo "🐳 Información de Docker:"
docker --version
docker-compose --version

echo ""
echo "📊 Estado actual de containers:"
docker-compose ps

echo ""
echo "🔍 Verificando imagen actual:"
docker images | grep cgplayerweb

echo ""
echo "📝 Logs recientes del container app:"
docker-compose logs --tail=20 cgplayer-app

echo ""
echo "🔍 Inspeccionando container (si existe):"
CONTAINER_ID=$(docker-compose ps -q cgplayer-app)
if [ ! -z "$CONTAINER_ID" ]; then
    echo "Container ID: $CONTAINER_ID"
    echo "Verificando si /app/start.sh existe en el container:"
    docker exec $CONTAINER_ID ls -la /app/ 2>/dev/null || echo "No se pudo acceder al container"
    echo "Verificando archivos en /app/:"
    docker exec $CONTAINER_ID find /app -name "*.sh" 2>/dev/null || echo "No se pudo buscar archivos .sh"
else
    echo "No hay container en ejecución"
fi

echo ""
echo "=============================================="
echo "🔧 Para resolver el problema, ejecutar:"
echo "1. docker-compose down"
echo "2. docker-compose build --no-cache"
echo "3. docker-compose up -d"
echo "=============================================="