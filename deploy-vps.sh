#!/bin/bash

# Script de despliegue para VPS de CGPlayerWeb
# Ejecutar este script en la VPS después de hacer git pull

set -e

echo "🚀 Iniciando despliegue de CGPlayerWeb en VPS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    error "No se encontró docker-compose.yml. ¿Estás en el directorio correcto?"
fi

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado. Por favor instala Docker primero."
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
fi

# Parar contenedores existentes
log "Parando contenedores existentes..."
docker-compose down || warning "No había contenedores corriendo"

# Limpiar imágenes antiguas (opcional)
log "Limpiando imágenes antiguas..."
docker system prune -f || warning "No se pudieron limpiar las imágenes"

# Construir nuevas imágenes
log "Construyendo nuevas imágenes..."
docker-compose build --no-cache || error "Error al construir las imágenes"

# Iniciar servicios
log "Iniciando servicios..."
docker-compose up -d || error "Error al iniciar los servicios"

# Esperar a que los servicios estén listos
log "Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
log "Verificando estado de los servicios..."
docker-compose ps

# Verificar conectividad
log "Verificando conectividad..."

# Verificar backend
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    success "Backend está respondiendo correctamente"
else
    warning "Backend no está respondiendo, verificando logs..."
    docker-compose logs --tail=20 app
fi

# Verificar frontend
if curl -f -s http://localhost/health > /dev/null; then
    success "Frontend está respondiendo correctamente"
else
    warning "Frontend no está respondiendo, verificando logs..."
    docker-compose logs --tail=20 app
fi

# Verificar base de datos
if docker-compose exec -T database pg_isready -U cgplayer -d cgplayerweb > /dev/null; then
    success "Base de datos está funcionando correctamente"
else
    warning "Base de datos no está respondiendo"
fi

# Mostrar logs finales
log "Mostrando logs finales..."
docker-compose logs --tail=10

success "🎉 Despliegue completado!"
echo ""
echo "🌐 Accesos:"
echo "   Frontend: http://192.99.122.62"
echo "   Backend API: http://192.99.122.62:3001"
echo "   Documentación API: http://192.99.122.62:3001/api-docs"
echo ""
echo "📊 Para monitorear:"
echo "   docker-compose logs -f"
echo "   docker-compose ps"
echo ""
echo "🔧 Para gestionar:"
echo "   docker-compose restart"
echo "   docker-compose down"
echo "   docker-compose up -d"
