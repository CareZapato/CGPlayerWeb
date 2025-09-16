#!/bin/sh

# Script de inicio para CGPlayerWeb Docker
# Este script configura el entorno y inicia los servicios

echo "🚀 Iniciando CGPlayerWeb v0.10.19..."

# Función para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Función para verificar variables de entorno requeridas
check_env() {
    if [ -z "$DATABASE_URL" ]; then
        log "❌ ERROR: DATABASE_URL no está configurada"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        log "⚠️  WARNING: JWT_SECRET no configurada, usando valor por defecto (NO RECOMENDADO EN PRODUCCIÓN)"
        export JWT_SECRET="default-jwt-secret-change-me"
    fi
    
    # Mostrar configuración de IP para debugging
    if [ -n "$SERVER_IP" ]; then
        log "🌐 IP del servidor configurada: $SERVER_IP"
        log "📱 Frontend URL: ${FRONTEND_URL:-http://localhost}"
        log "🔧 Backend URL: ${BACKEND_URL:-http://localhost:3001}"
    else
        log "⚠️ SERVER_IP no configurada, usando localhost"
    fi
}

# Función para esperar a que la base de datos esté lista
wait_for_db() {
    log "⏳ Esperando conexión a PostgreSQL..."
    
    # Extraer componentes de la URL de la base de datos
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    if [ -z "$DB_PORT" ]; then
        DB_PORT="5432"
    fi
    
    # Esperar hasta 60 segundos
    for i in $(seq 1 60); do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            log "✅ Base de datos conectada ($DB_HOST:$DB_PORT)"
            return 0
        fi
        log "⏳ Intentando conectar a la base de datos... ($i/60)"
        sleep 1
    done
    
    log "❌ ERROR: No se pudo conectar a la base de datos después de 60 segundos"
    exit 1
}

# Función para ejecutar migraciones de Prisma
run_migrations() {
    log "🔄 Ejecutando migraciones de base de datos..."
    cd /app/backend
    
    # Generar cliente Prisma
    npx prisma generate
    
    # Ejecutar migraciones
    if npx prisma migrate deploy; then
        log "✅ Migraciones ejecutadas exitosamente"
    else
        log "❌ ERROR: Fallo en migraciones de base de datos"
        exit 1
    fi
    
    # Poblar base de datos si está vacía (opcional)
    if [ "$SEED_DATABASE" = "true" ]; then
        log "🌱 Poblando base de datos inicial..."
        npx prisma db seed || log "⚠️  WARNING: No se pudo ejecutar el seed (puede ser normal si ya existe data)"
    fi
}

# Función para crear directorios necesarios
setup_directories() {
    log "📁 Configurando directorios..."
    
    mkdir -p /app/backend/uploads/songs
    mkdir -p /app/logs
    mkdir -p /var/log/supervisor
    
    # Asegurar permisos correctos
    chown -R cgplayer:nodejs /app/backend/uploads 2>/dev/null || true
    chown -R cgplayer:nodejs /app/logs 2>/dev/null || true
    
    log "✅ Directorios configurados"
}

# Función principal
main() {
    log "🏁 Iniciando proceso de configuración..."
    
    # Verificar variables de entorno
    check_env
    
    # Configurar directorios
    setup_directories
    
    # Esperar a la base de datos
    wait_for_db
    
    # Ejecutar migraciones
    run_migrations
    
    log "🎵 Configuración completada. Iniciando servicios..."
    
    # Iniciar supervisor para manejar múltiples procesos
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
}

# Manejo de señales para shutdown graceful
trap 'log "🛑 Recibida señal de parada..."; exit 0' TERM INT

# Ejecutar función principal
main
