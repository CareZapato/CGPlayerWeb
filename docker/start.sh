#!/bin/bash

# Script de inicio para CGPlayerWeb v1.10.9
# Este script inicializa la base de datos y arranca los servicios
# Autor: Sistema automatizado de despliegue

set -e

# Configurar logging con flush inmediato
exec > >(tee -a /app/logs/startup.log)
exec 2>&1

echo "===================================================================================="
echo "🚀 INICIANDO CGPLAYERWEB v1.10.9"
echo "===================================================================================="
echo "📅 Timestamp: $(date)"
echo "🐳 Container ID: ${HOSTNAME}"
echo "📂 Working Directory: $(pwd)"
echo "👤 Usuario actual: $(whoami)"
echo "🔍 Verificando permisos del script..."
ls -la /app/start.sh

# Variables de entorno por defecto
export NODE_ENV=${NODE_ENV:-production}
export DATABASE_URL=${DATABASE_URL:-postgresql://cgplayer:cgplayerpassword@database:5432/cgplayerbd}
export API_PORT=${API_PORT:-3001}

# Crear directorio de logs si no existe
mkdir -p /app/logs

# Función para esperar que PostgreSQL esté listo
wait_for_postgres() {
    echo "⏳ Esperando a que PostgreSQL esté listo..."
    until pg_isready -h database -p 5432 -U cgplayer; do
        echo "PostgreSQL no está listo - esperando..."
        sleep 2
    done
    echo "✅ PostgreSQL está listo!"
}

# Función para inicializar la base de datos
init_database() {
    echo "���️ Inicializando base de datos..."
    
    cd /app/backend
    
    # Generar cliente de Prisma primero
    echo "⚙️ Generando cliente de Prisma..."
    npx prisma generate
    
    # Crear tablas usando db push (más robusto que migrate)
    echo "��� Creando/sincronizando tablas con Prisma..."
    if ! npx prisma db push --accept-data-loss; then
        echo "⚠️ db push falló, intentando con migrate deploy..."
        if ! npx prisma migrate deploy; then
            echo "❌ Error: No se pudo inicializar la estructura de la base de datos"
            exit 1
        fi
    fi
    
    echo "✅ Estructura de base de datos creada"
    
    # Verificar y poblar base de datos
    echo "��� Verificando estado de la base de datos..."
    
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function checkAndSeed() {
            try {
                console.log('��� Verificando estado de la base de datos...');
                
                // Verificar conexión y estructura de la base de datos
                let userCount = 0;
                try {
                    userCount = await prisma.user.count();
                    console.log(\`��� Usuarios encontrados: \${userCount}\`);
                } catch (tableError) {
                    if (tableError.code === 'P2021' || tableError.message.includes('does not exist')) {
                        console.log('⚠️  Tabla User no existe, ejecutando inicialización completa...');
                        userCount = 0;
                    } else {
                        throw tableError;
                    }
                }
                
                if (userCount === 0) {
                    console.log('��� Base de datos vacía o sin estructura, ejecutando seed...');
                    const { execSync } = require('child_process');
                    
                    // Intentar seed con diferentes estrategias
                    try {
                        execSync('npm run db:seed', { stdio: 'inherit', cwd: '/app' });
                        console.log('✅ Seed completado exitosamente');
                    } catch (seedError) {
                        console.warn('⚠️  Seed con npm falló, intentando ejecutar directamente...');
                        try {
                            execSync('node prisma/seed-definitivo.js', { stdio: 'inherit', cwd: '/app/backend' });
                            console.log('✅ Seed directo completado');
                        } catch (directSeedError) {
                            console.error('❌ Error en seed directo:', directSeedError.message);
                            throw new Error('No se pudo completar el seed de la base de datos');
                        }
                    }
                    
                    // Verificar que el seed fue exitoso
                    const finalUserCount = await prisma.user.count();
                    console.log(\`��� Verificación final: \${finalUserCount} usuarios creados\`);
                    
                    if (finalUserCount === 0) {
                        throw new Error('El seed no creó usuarios, algo salió mal');
                    }
                } else {
                    console.log(\`✅ Base de datos ya inicializada con \${userCount} usuarios\`);
                }
                
                // Verificar usuario admin
                const adminUser = await prisma.user.findFirst({
                    where: { email: 'admin@cgplayer.local' }
                });
                
                if (adminUser) {
                    console.log('��� Usuario administrador verificado: admin@cgplayer.local');
                } else {
                    console.warn('⚠️  Usuario administrador no encontrado');
                }
                
            } catch (error) {
                console.error('❌ Error en verificación/seed de base de datos:', error.message);
                console.error('Stack:', error.stack);
                process.exit(1);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        checkAndSeed();
    "
    
    cd /app
}

# Función principal
main() {
    echo "��� Iniciando CGPlayerWeb v1.10.9..."
    echo "��� Fecha: $(date)"
    echo "��� Variables de entorno:"
    echo "   - DATABASE_URL: ${DATABASE_URL:-'No configurada'}"
    echo "   - NODE_ENV: ${NODE_ENV:-'No configurada'}"
    echo "   - PORT: ${PORT:-'No configurada'}"
    
    # Verificar archivos críticos
    echo "��� Verificando archivos críticos..."
    if [ ! -f "/app/package.json" ]; then
        echo "❌ Error: package.json no encontrado en /app"
        exit 1
    fi
    
    if [ ! -f "/app/backend/prisma/seed-definitivo.js" ]; then
        echo "❌ Error: seed-definitivo.js no encontrado en /app/backend/prisma"
        exit 1
    fi
    
    if [ ! -f "/app/prisma/schema.prisma" ]; then
        echo "❌ Error: schema.prisma no encontrado en /app/prisma"
        exit 1
    fi
    
    echo "✅ Archivos críticos verificados"
    
    # Esperar a PostgreSQL
    wait_for_postgres
    
    # Inicializar base de datos
    init_database
    
    echo "��� Iniciando servicios de aplicación..."
    echo "   - Nginx (proxy reverso)"
    echo "   - Backend API (Node.js/Express)"
    
    # Verificar configuración de supervisord
    if [ ! -f "/etc/supervisor/conf.d/supervisord.conf" ]; then
        echo "❌ Error: Configuración de supervisord no encontrada"
        exit 1
    fi
    
    # Iniciar supervisord que maneja nginx y el backend
    echo "��� Ejecutando supervisord..."
    echo "===================================================================================="
    echo "✅ CGPLAYERWEB v1.10.9 INICIADO CORRECTAMENTE"
    echo "��� Backend API disponible en puerto: ${API_PORT}"
    echo "��� Sistema de gestión musical para coros listo"
    echo "��� Usuario admin: admin@cgplayer.local / cgplayer2025"
    echo "��� Logs disponibles en: /app/logs/"
    echo "===================================================================================="
    
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
}

# Función de limpieza al recibir señales
cleanup() {
    echo "🛑 Señal de parada recibida..."
    echo "📝 Guardando logs finales..."
    echo "⏰ Shutdown timestamp: $(date)" >> /app/logs/startup.log
    
    if [ -f "/etc/supervisor/conf.d/supervisord.conf" ]; then
        supervisorctl -c /etc/supervisor/conf.d/supervisord.conf shutdown
    fi
    
    echo "✅ Servicios detenidos correctamente"
    exit 0
}

# Capturar señales de parada
trap cleanup SIGTERM SIGINT SIGQUIT

# Ejecutar función principal
echo "🎬 Ejecutando función principal..."
echo "📊 Información del sistema:"
echo "   - Memoria: $(free -h | grep Mem | awk '{print $2}')"
echo "   - Espacio: $(df -h /app | tail -1 | awk '{print $4}')"
main "$@"
