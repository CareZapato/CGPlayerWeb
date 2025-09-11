#!/bin/bash

# Script para reconfigurar la IP de CGPlayerWeb después del despliegue
# Útil cuando la IP cambia o se quiere ajustar manualmente

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[IP-CONFIG] $1${NC}"; }
warn() { echo -e "${YELLOW}[IP-CONFIG] $1${NC}"; }
error() { echo -e "${RED}[IP-CONFIG] $1${NC}"; }
info() { echo -e "${BLUE}[IP-CONFIG] $1${NC}"; }

print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║               CGPlayerWeb - Configurador IP              ║"
    echo "║                      v0.10.19                            ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar si Docker está ejecutándose
check_docker() {
    if ! docker ps &> /dev/null; then
        error "Docker no está ejecutándose o no tienes permisos"
        exit 1
    fi
}

# Detectar IP actual
detect_current_ip() {
    source scripts/auto-detect-ip.sh &> /dev/null
    echo "$DETECTED_LOCAL_IP"
}

# Mostrar IP actual en configuración
show_current_config() {
    info "📋 Configuración actual:"
    
    if [[ -f .env ]]; then
        local current_ip=$(grep "SERVER_IP=" .env 2>/dev/null | cut -d'=' -f2)
        local frontend_url=$(grep "FRONTEND_URL=" .env 2>/dev/null | cut -d'=' -f2)
        local backend_url=$(grep "BACKEND_URL=" .env 2>/dev/null | cut -d'=' -f2)
        
        echo "  • SERVER_IP: ${current_ip:-'No configurada'}"
        echo "  • FRONTEND_URL: ${frontend_url:-'No configurada'}"
        echo "  • BACKEND_URL: ${backend_url:-'No configurada'}"
    else
        warn "No se encuentra archivo .env"
    fi
    
    local detected_ip=$(detect_current_ip)
    if [[ -n "$detected_ip" ]]; then
        echo "  • IP detectada automáticamente: $detected_ip"
    fi
}

# Actualizar configuración IP
update_ip_config() {
    local new_ip="$1"
    
    if [[ -z "$new_ip" ]]; then
        error "No se proporcionó nueva IP"
        return 1
    fi
    
    log "🔄 Actualizando configuración IP a: $new_ip"
    
    # Backup del .env actual
    if [[ -f .env ]]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        log "✅ Backup creado del .env anterior"
    fi
    
    # Actualizar .env
    if [[ -f .env ]]; then
        # Actualizar líneas existentes
        sed -i "s|^SERVER_IP=.*|SERVER_IP=$new_ip|" .env
        sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=http://$new_ip|" .env
        sed -i "s|^BACKEND_URL=.*|BACKEND_URL=http://$new_ip:3001|" .env
        
        # Agregar líneas si no existen
        if ! grep -q "^SERVER_IP=" .env; then
            echo "SERVER_IP=$new_ip" >> .env
        fi
        if ! grep -q "^FRONTEND_URL=" .env; then
            echo "FRONTEND_URL=http://$new_ip" >> .env
        fi
        if ! grep -q "^BACKEND_URL=" .env; then
            echo "BACKEND_URL=http://$new_ip:3001" >> .env
        fi
    else
        error "No se encuentra archivo .env"
        return 1
    fi
    
    # Actualizar ip-config.env
    echo "DETECTED_LOCAL_IP=$new_ip" > ip-config.env
    echo "SERVER_IP=$new_ip" >> ip-config.env
    
    log "✅ Configuración actualizada"
}

# Reiniciar servicios Docker
restart_services() {
    log "🔄 Reiniciando servicios Docker..."
    
    if docker-compose ps | grep -q "cgplayer"; then
        docker-compose down
        sleep 2
        docker-compose up -d
        
        log "✅ Servicios reiniciados"
        
        # Esperar a que los servicios estén listos
        info "⏳ Esperando a que los servicios estén listos..."
        sleep 15
        
        # Verificar estado
        if docker-compose ps | grep -q "Up"; then
            log "✅ Servicios ejecutándose correctamente"
        else
            warn "⚠️ Algunos servicios pueden no estar funcionando correctamente"
        fi
    else
        warn "No se encontraron servicios CGPlayer ejecutándose"
    fi
}

# Verificar conectividad
test_connectivity() {
    local ip="$1"
    
    info "🧪 Probando conectividad..."
    
    # Test frontend
    if curl -s --connect-timeout 5 "http://$ip" > /dev/null; then
        log "✅ Frontend accesible en http://$ip"
    else
        warn "⚠️ Frontend no accesible en http://$ip"
    fi
    
    # Test API
    if curl -s --connect-timeout 5 "http://$ip:3001/api/health" > /dev/null; then
        log "✅ API accesible en http://$ip:3001"
    else
        warn "⚠️ API no accesible en http://$ip:3001"
    fi
}

# Función principal
main() {
    print_banner
    
    check_docker
    
    echo
    show_current_config
    echo
    
    # Opciones para el usuario
    echo "¿Qué deseas hacer?"
    echo "1) Auto-detectar y configurar IP automáticamente"
    echo "2) Configurar IP manualmente"
    echo "3) Solo reiniciar servicios (sin cambiar IP)"
    echo "4) Salir"
    echo
    
    read -p "Selecciona una opción (1-4): " choice
    
    case $choice in
        1)
            log "🔍 Detectando IP automáticamente..."
            auto_ip=$(detect_current_ip)
            if [[ -n "$auto_ip" ]]; then
                log "IP detectada: $auto_ip"
                read -p "¿Usar esta IP? (Y/n): " confirm
                if [[ "$confirm" != "n" && "$confirm" != "N" ]]; then
                    update_ip_config "$auto_ip"
                    restart_services
                    test_connectivity "$auto_ip"
                fi
            else
                error "No se pudo detectar IP automáticamente"
            fi
            ;;
        2)
            read -p "Ingresa la nueva IP: " manual_ip
            if [[ -n "$manual_ip" ]]; then
                update_ip_config "$manual_ip"
                restart_services
                test_connectivity "$manual_ip"
            else
                error "IP no válida"
            fi
            ;;
        3)
            restart_services
            ;;
        4)
            info "👋 Saliendo..."
            exit 0
            ;;
        *)
            error "Opción no válida"
            exit 1
            ;;
    esac
    
    echo
    info "🎯 URLs de acceso actuales:"
    local current_ip=$(grep "SERVER_IP=" .env 2>/dev/null | cut -d'=' -f2)
    if [[ -n "$current_ip" ]]; then
        echo "  • Frontend: http://$current_ip"
        echo "  • API: http://$current_ip:3001"
        echo "  • API Docs: http://$current_ip:3001/api-docs"
    fi
    
    log "🎵 Configuración completada!"
}

# Verificar que estamos en el directorio correcto
if [[ ! -f "docker-compose.yml" ]]; then
    error "Ejecutar desde el directorio raíz de CGPlayerWeb"
    exit 1
fi

main "$@"
