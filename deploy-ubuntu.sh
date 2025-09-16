#!/bin/bash

# 🐳 Script de despliegue automático para CGPlayerWeb en Ubuntu
# Este script configura y despliega CGPlayerWeb usando Docker

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging con colores
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Banner de bienvenida
print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    CGPlayerWeb v0.10.19                    ║"
    echo "║                  Despliegue Automático                     ║"
    echo "║                                                            ║"
    echo "║  🎵 Sistema de gestión musical para coros                  ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar si estamos en Ubuntu
check_ubuntu() {
    if [[ ! -f /etc/os-release ]]; then
        error "No se puede determinar el sistema operativo"
        exit 1
    fi

    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        warn "Este script está optimizado para Ubuntu. Detectado: $ID"
        read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log "✅ Ubuntu detectado: $VERSION"
    fi
}

# Verificar requisitos del sistema
check_requirements() {
    log "🔍 Verificando requisitos del sistema..."

    # Verificar memoria RAM (mínimo 2GB)
    TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
    if [[ $TOTAL_MEM -lt 2048 ]]; then
        warn "Memoria RAM: ${TOTAL_MEM}MB (recomendado: >2GB)"
    else
        log "✅ Memoria RAM: ${TOTAL_MEM}MB"
    fi

    # Verificar espacio en disco (mínimo 5GB)
    AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $AVAILABLE_SPACE -lt 5 ]]; then
        error "Espacio insuficiente en disco: ${AVAILABLE_SPACE}GB (requerido: >5GB)"
        exit 1
    else
        log "✅ Espacio en disco: ${AVAILABLE_SPACE}GB disponible"
    fi
}

# Instalar Docker y Docker Compose
install_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        log "✅ Docker ya está instalado"
        docker --version
        docker-compose --version
        return 0
    fi

    log "📦 Instalando Docker y Docker Compose..."

    # Actualizar paquetes
    sudo apt-get update

    # Instalar dependencias
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Agregar clave GPG de Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Agregar repositorio de Docker
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Instalar Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Instalar Docker Compose standalone
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # Agregar usuario al grupo docker
    sudo usermod -aG docker $USER

    # Iniciar y habilitar Docker
    sudo systemctl start docker
    sudo systemctl enable docker

    log "✅ Docker instalado correctamente"
    
    warn "NOTA: Necesitas hacer logout/login o ejecutar 'newgrp docker' para usar Docker sin sudo"
}

# Configurar firewall
setup_firewall() {
    log "🔥 Configurando firewall..."

    # Verificar si ufw está instalado
    if ! command -v ufw &> /dev/null; then
        sudo apt-get install -y ufw
    fi

    # Configurar reglas básicas
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing

    # Permitir SSH
    sudo ufw allow ssh

    # Permitir puertos de la aplicación
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS (futuro)
    sudo ufw allow 3001/tcp # API Backend

    # Habilitar firewall
    sudo ufw --force enable

    log "✅ Firewall configurado"
}

# Detectar IP local automáticamente
detect_server_ip() {
    log "🔍 Detectando IP local del servidor..."
    
    # Hacer ejecutable el script si no lo está
    chmod +x scripts/auto-detect-ip.sh 2>/dev/null || true
    
    # Ejecutar script de detección
    if [[ -f "scripts/auto-detect-ip.sh" ]]; then
        source scripts/auto-detect-ip.sh
        if [[ -n "$DETECTED_LOCAL_IP" ]]; then
            SERVER_IP="$DETECTED_LOCAL_IP"
            log "✅ IP detectada automáticamente: $SERVER_IP"
        fi
    fi
    
    # Si no se detectó, usar detección simple
    if [[ -z "$SERVER_IP" ]]; then
        # Método simple de detección
        SERVER_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' | head -1)
        if [[ -z "$SERVER_IP" ]]; then
            SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
        fi
        if [[ -z "$SERVER_IP" ]]; then
            SERVER_IP="localhost"
            warn "No se pudo detectar IP, usando localhost"
        else
            log "✅ IP detectada: $SERVER_IP"
        fi
    fi
}

# Configurar variables de entorno
setup_environment() {
    log "⚙️ Configurando variables de entorno..."

    # Detectar IP del servidor
    detect_server_ip

    if [[ ! -f .env ]]; then
        # Generar JWT secret seguro
        JWT_SECRET=$(openssl rand -hex 32)
        
        # Generar password de base de datos
        DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

        # Crear archivo .env con IP auto-detectada
        cat > .env << EOF
# Configuración generada automáticamente - $(date)

# Base de datos
DB_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://cgplayer:${DB_PASSWORD}@database:5432/cgplayerweb

# Seguridad
JWT_SECRET=${JWT_SECRET}

# Configuración del servidor
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# URLs (IP auto-detectada: ${SERVER_IP})
SERVER_IP=${SERVER_IP}
FRONTEND_URL=http://${SERVER_IP}
BACKEND_URL=http://${SERVER_IP}:3001

# Redis
REDIS_URL=redis://redis:6379

# Configuración de archivos
MAX_FILE_SIZE=50MB

# Poblar base de datos inicial
SEED_DATABASE=true
EOF

        log "✅ Archivo .env creado con IP auto-detectada: $SERVER_IP"
    else
        # Actualizar IP en .env existente si no está configurada
        if ! grep -q "SERVER_IP=" .env; then
            echo "SERVER_IP=$SERVER_IP" >> .env
            log "✅ IP agregada al .env existente: $SERVER_IP"
        else
            log "✅ Archivo .env ya existe con configuración de IP"
        fi
    fi
}

# Construir y desplegar la aplicación
deploy_application() {
    log "🚀 Construyendo y desplegando CGPlayerWeb..."

    # Crear directorios necesarios
    mkdir -p logs backend/uploads

    # Construir imágenes Docker
    log "🔨 Construyendo imagen de la aplicación..."
    docker-compose build --no-cache

    # Desplegar servicios
    log "🚀 Desplegando servicios..."
    docker-compose up -d

    # Esperar a que los servicios estén listos
    log "⏳ Esperando a que los servicios estén listos..."
    sleep 30

    # Verificar estado de los servicios
    docker-compose ps
}

# Verificar despliegue
verify_deployment() {
    log "🧪 Verificando despliegue..."

    # Verificar que los contenedores estén ejecutándose
    if ! docker-compose ps | grep -q "Up"; then
        error "Algunos contenedores no están ejecutándose correctamente"
        docker-compose logs
        exit 1
    fi

    # Verificar conectividad a la base de datos
    if docker-compose exec -T database pg_isready -U cgplayer -d cgplayerweb; then
        log "✅ Base de datos conectada correctamente"
    else
        error "No se puede conectar a la base de datos"
        exit 1
    fi

    # Verificar API del backend
    sleep 10  # Dar tiempo adicional para que el backend esté listo
    if curl -s http://localhost:3001/api/health > /dev/null; then
        log "✅ Backend API respondiendo correctamente"
    else
        warn "Backend API no responde, verificando logs..."
        docker-compose logs app
    fi

    # Verificar frontend
    if curl -s http://localhost > /dev/null; then
        log "✅ Frontend accesible correctamente"
    else
        warn "Frontend no accesible"
    fi
}

# Mostrar información final
show_final_info() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    ¡DESPLIEGUE COMPLETADO! 🎉              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    info "📱 Aplicación web (local): http://localhost"
    info "🌐 Aplicación web (red): http://$SERVER_IP"
    info "🔧 API Backend (local): http://localhost:3001"
    info "� API Backend (red): http://$SERVER_IP:3001"
    info "�📊 Documentación API: http://$SERVER_IP:3001/api-docs"

    echo -e "\n${YELLOW}🔐 Credenciales por defecto:${NC}"
    info "Admin: admin@cgplayer.com / admin123"
    info "Director: director1@cgplayer.com / admin123"
    info "Cantante: cantante1@cgplayer.com / admin123"

    echo -e "\n${YELLOW}📋 Comandos útiles:${NC}"
    info "Ver logs: docker-compose logs -f"
    info "Reiniciar: docker-compose restart"
    info "Parar: docker-compose down"
    info "Actualizar: git pull && docker-compose up -d --build"

    echo -e "\n${YELLOW}📁 Archivos importantes:${NC}"
    info "Configuración: .env"
    info "Logs: ./logs/"
    info "Uploads: ./backend/uploads/"
}

# Función principal
main() {
    print_banner

    log "🚀 Iniciando despliegue automático de CGPlayerWeb..."

    check_ubuntu
    check_requirements
    install_docker
    setup_firewall
    setup_environment
    deploy_application
    verify_deployment
    show_final_info

    log "✅ Despliegue completado exitosamente!"
}

# Manejo de errores
handle_error() {
    error "Error en línea $1. Saliendo..."
    docker-compose down 2>/dev/null || true
    exit 1
}

trap 'handle_error $LINENO' ERR

# Verificar que estamos en el directorio correcto
if [[ ! -f "package.json" ]]; then
    error "Ejecutar este script desde el directorio raíz de CGPlayerWeb"
    exit 1
fi

# Ejecutar función principal
main
