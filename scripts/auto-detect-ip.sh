#!/bin/bash

# Script para detectar automáticamente la IP local de la máquina
# y configurar las variables de entorno apropiadas

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[AUTO-IP] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[AUTO-IP] $1${NC}"
}

info() {
    echo -e "${BLUE}[AUTO-IP] $1${NC}"
}

# Función para detectar la IP local automáticamente
detect_local_ip() {
    local detected_ip=""
    
    # Método 1: Usando ip route (Linux moderno)
    if command -v ip &> /dev/null; then
        detected_ip=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' | head -1)
        if [[ -n "$detected_ip" && "$detected_ip" =~ ^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\. ]]; then
            log "✅ IP detectada con 'ip route': $detected_ip"
            echo "$detected_ip"
            return 0
        fi
    fi
    
    # Método 2: Usando hostname -I (Linux)
    if command -v hostname &> /dev/null; then
        detected_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
        if [[ -n "$detected_ip" && "$detected_ip" =~ ^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\. ]]; then
            log "✅ IP detectada con 'hostname -I': $detected_ip"
            echo "$detected_ip"
            return 0
        fi
    fi
    
    # Método 3: Usando ifconfig (sistema más antiguo)
    if command -v ifconfig &> /dev/null; then
        detected_ip=$(ifconfig 2>/dev/null | grep -E "inet (192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)" | grep -v "127.0.0.1" | awk '{print $2}' | head -1)
        if [[ -n "$detected_ip" ]]; then
            log "✅ IP detectada con 'ifconfig': $detected_ip"
            echo "$detected_ip"
            return 0
        fi
    fi
    
    # Método 4: Usando awk con /proc/net/route (Linux sin herramientas adicionales)
    if [[ -f "/proc/net/route" ]]; then
        local interface=$(awk '$2 == 00000000 { print $1 }' /proc/net/route | head -1)
        if [[ -n "$interface" ]]; then
            detected_ip=$(ip addr show "$interface" 2>/dev/null | grep -E "inet (192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)" | awk '{print $2}' | cut -d'/' -f1 | head -1)
            if [[ -n "$detected_ip" ]]; then
                log "✅ IP detectada via interface '$interface': $detected_ip"
                echo "$detected_ip"
                return 0
            fi
        fi
    fi
    
    # Método 5: Conectar a un socket externo para determinar IP local
    if command -v python3 &> /dev/null; then
        detected_ip=$(python3 -c "
import socket
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(('8.8.8.8', 80))
    ip = s.getsockname()[0]
    s.close()
    print(ip)
except:
    pass
" 2>/dev/null)
        if [[ -n "$detected_ip" && "$detected_ip" =~ ^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\. ]]; then
            log "✅ IP detectada con Python socket: $detected_ip"
            echo "$detected_ip"
            return 0
        fi
    fi
    
    # Método 6: Usando curl para detectar IP (como último recurso)
    if command -v curl &> /dev/null; then
        detected_ip=$(curl -s --connect-timeout 3 ifconfig.me 2>/dev/null)
        if [[ -n "$detected_ip" && "$detected_ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            warn "IP pública detectada: $detected_ip (puede no ser local)"
            echo "$detected_ip"
            return 0
        fi
    fi
    
    warn "❌ No se pudo detectar automáticamente la IP local"
    return 1
}

# Función para mostrar todas las IPs disponibles
show_available_ips() {
    info "📡 Interfaces de red disponibles:"
    
    if command -v ip &> /dev/null; then
        ip addr show | grep -E "inet (192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)" | while read line; do
            local ip=$(echo "$line" | awk '{print $2}' | cut -d'/' -f1)
            local interface=$(echo "$line" | awk '{print $NF}')
            echo "  - $ip (interface: $interface)"
        done
    elif command -v ifconfig &> /dev/null; then
        ifconfig | grep -E "inet (192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)" | while read line; do
            local ip=$(echo "$line" | awk '{print $2}')
            echo "  - $ip"
        done
    fi
}

# Función principal
main() {
    log "🔍 Detectando IP local automáticamente..."
    
    # Detectar IP automáticamente
    LOCAL_IP=$(detect_local_ip)
    
    if [[ -z "$LOCAL_IP" ]]; then
        warn "No se pudo detectar automáticamente. Mostrando opciones disponibles:"
        show_available_ips
        
        echo
        read -p "Ingresa manualmente la IP local: " LOCAL_IP
        
        if [[ -z "$LOCAL_IP" ]]; then
            warn "No se proporcionó IP. Usando localhost como fallback."
            LOCAL_IP="localhost"
        fi
    fi
    
    log "📍 IP seleccionada: $LOCAL_IP"
    
    # Exportar como variable de entorno para usar en otros scripts
    export DETECTED_LOCAL_IP="$LOCAL_IP"
    
    # Escribir a archivo para persistencia
    echo "DETECTED_LOCAL_IP=$LOCAL_IP" > ip-config.env
    echo "SERVER_IP=$LOCAL_IP" >> ip-config.env
    
    log "✅ Configuración guardada en ip-config.env"
    
    # Mostrar información de acceso
    echo
    info "🌐 URLs de acceso:"
    echo "  - Local: http://localhost"
    echo "  - Red local: http://$LOCAL_IP"
    echo "  - API: http://$LOCAL_IP:3001"
    
    return 0
}

# Ejecutar si se llama directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
