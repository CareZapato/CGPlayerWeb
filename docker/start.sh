#!/bin/bash

# Script de inicio para CGPlayerWeb v1.10.9
# Este script inicializa la base de datos y arranca los servicios
# Autor: Sistema automatizado de despliegue

set -e

# Configurar logging
exec > >(tee -a /app/logs/startup.log)
exec 2>&1

echo "===================================================================================="
echo "Ì∫Ä INICIANDO CGPLAYERWEB v1.10.9"
echo "===================================================================================="
echo "‚è∞ Timestamp: $(date)"
echo "Ì∞≥ Container ID: ${HOSTNAME}"
echo "Ì≥Ç Working Directory: $(pwd)"

# Variables de entorno por defecto
export NODE_ENV=${NODE_ENV:-production}
export DATABASE_URL=${DATABASE_URL:-postgresql://cgplayer:cgplayerpassword@database:5432/cgplayerbd}
export API_PORT=${API_PORT:-3001}

# Crear directorio de logs si no existe
mkdir -p /app/logs

# Funci√≥n para esperar que PostgreSQL est√© listo
wait_for_postgres() {
    echo "‚è≥ Esperando a que PostgreSQL est√© listo..."
    until pg_isready -h database -p 5432 -U cgplayer; do
        echo "PostgreSQL no est√° listo - esperando..."
        sleep 2
    done
    echo "‚úÖ PostgreSQL est√° listo!"
}

# Funci√≥n para inicializar la base de datos
init_database() {
    echo "Ì∑ÑÔ∏è Inicializando base de datos..."
    
    cd /app/backend
    
    # Generar cliente de Prisma primero
    echo "‚öôÔ∏è Generando cliente de Prisma..."
    npx prisma generate
    
    # Crear tablas usando db push (m√°s robusto que migrate)
    echo "Ì≥¶ Creando/sincronizando tablas con Prisma..."
    if ! npx prisma db push --accept-data-loss; then
        echo "‚ö†Ô∏è db push fall√≥, intentando con migrate deploy..."
        if ! npx prisma migrate deploy; then
            echo "‚ùå Error: No se pudo inicializar la estructura de la base de datos"
            exit 1
        fi
    fi
    
    echo "‚úÖ Estructura de base de datos creada"
    
    # Verificar y poblar base de datos
    echo "Ì¥ç Verificando estado de la base de datos..."
    
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function checkAndSeed() {
            try {
                console.log('Ì¥ç Verificando estado de la base de datos...');
                
                // Verificar conexi√≥n y estructura de la base de datos
                let userCount = 0;
                try {
                    userCount = await prisma.user.count();
                    console.log(\`Ì≥ä Usuarios encontrados: \${userCount}\`);
                } catch (tableError) {
                    if (tableError.code === 'P2021' || tableError.message.includes('does not exist')) {
                        console.log('‚ö†Ô∏è  Tabla User no existe, ejecutando inicializaci√≥n completa...');
                        userCount = 0;
                    } else {
                        throw tableError;
                    }
                }
                
                if (userCount === 0) {
                    console.log('Ìº± Base de datos vac√≠a o sin estructura, ejecutando seed...');
                    const { execSync } = require('child_process');
                    
                    // Intentar seed con diferentes estrategias
                    try {
                        execSync('npm run db:seed', { stdio: 'inherit', cwd: '/app' });
                        console.log('‚úÖ Seed completado exitosamente');
                    } catch (seedError) {
                        console.warn('‚ö†Ô∏è  Seed con npm fall√≥, intentando ejecutar directamente...');
                        try {
                            execSync('node seed-definitivo.js', { stdio: 'inherit', cwd: '/app' });
                            console.log('‚úÖ Seed directo completado');
                        } catch (directSeedError) {
                            console.error('‚ùå Error en seed directo:', directSeedError.message);
                            throw new Error('No se pudo completar el seed de la base de datos');
                        }
                    }
                    
                    // Verificar que el seed fue exitoso
                    const finalUserCount = await prisma.user.count();
                    console.log(\`Ìæâ Verificaci√≥n final: \${finalUserCount} usuarios creados\`);
                    
                    if (finalUserCount === 0) {
                        throw new Error('El seed no cre√≥ usuarios, algo sali√≥ mal');
                    }
                } else {
                    console.log(\`‚úÖ Base de datos ya inicializada con \${userCount} usuarios\`);
                }
                
                // Verificar usuario admin
                const adminUser = await prisma.user.findFirst({
                    where: { email: 'admin@cgplayer.local' }
                });
                
                if (adminUser) {
                    console.log('Ì±ë Usuario administrador verificado: admin@cgplayer.local');
                } else {
                    console.warn('‚ö†Ô∏è  Usuario administrador no encontrado');
                }
                
            } catch (error) {
                console.error('‚ùå Error en verificaci√≥n/seed de base de datos:', error.message);
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

# Funci√≥n principal
main() {
    echo "Ì∫Ä Iniciando CGPlayerWeb v1.10.9..."
    echo "Ì≥Ö Fecha: $(date)"
    echo "Ìºê Variables de entorno:"
    echo "   - DATABASE_URL: ${DATABASE_URL:-'No configurada'}"
    echo "   - NODE_ENV: ${NODE_ENV:-'No configurada'}"
    echo "   - PORT: ${PORT:-'No configurada'}"
    
    # Verificar archivos cr√≠ticos
    echo "Ì¥ç Verificando archivos cr√≠ticos..."
    if [ ! -f "/app/package.json" ]; then
        echo "‚ùå Error: package.json no encontrado en /app"
        exit 1
    fi
    
    if [ ! -f "/app/seed-definitivo.js" ]; then
        echo "‚ùå Error: seed-definitivo.js no encontrado en /app"
        exit 1
    fi
    
    if [ ! -f "/app/prisma/schema.prisma" ]; then
        echo "‚ùå Error: schema.prisma no encontrado en /app/prisma"
        exit 1
    fi
    
    echo "‚úÖ Archivos cr√≠ticos verificados"
    
    # Esperar a PostgreSQL
    wait_for_postgres
    
    # Inicializar base de datos
    init_database
    
    echo "Ìºü Iniciando servicios de aplicaci√≥n..."
    echo "   - Nginx (proxy reverso)"
    echo "   - Backend API (Node.js/Express)"
    
    # Verificar configuraci√≥n de supervisord
    if [ ! -f "/etc/supervisor/conf.d/supervisord.conf" ]; then
        echo "‚ùå Error: Configuraci√≥n de supervisord no encontrada"
        exit 1
    fi
    
    # Iniciar supervisord que maneja nginx y el backend
    echo "ÌæØ Ejecutando supervisord..."
    echo "===================================================================================="
    echo "‚úÖ CGPLAYERWEB v1.10.9 INICIADO CORRECTAMENTE"
    echo "Ìºê Backend API disponible en puerto: ${API_PORT}"
    echo "Ìæµ Sistema de gesti√≥n musical para coros listo"
    echo "Ì±ë Usuario admin: admin@cgplayer.local / cgplayer2025"
    echo "Ì≥ù Logs disponibles en: /app/logs/"
    echo "===================================================================================="
    
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
}

# Funci√≥n de limpieza al recibir se√±ales
cleanup() {
    echo "Ìªë Se√±al de parada recibida..."
    echo "Ì≥ù Guardando logs finales..."
    echo "‚è∞ Shutdown timestamp: $(date)" >> /app/logs/startup.log
    
    if [ -f "/etc/supervisor/conf.d/supervisord.conf" ]; then
        supervisorctl -c /etc/supervisor/conf.d/supervisord.conf shutdown
    fi
    
    echo "‚úÖ Servicios detenidos correctamente"
    exit 0
}

# Capturar se√±ales de parada
trap cleanup SIGTERM SIGINT SIGQUIT

# Ejecutar funci√≥n principal
echo "Ìæ¨ Ejecutando funci√≥n principal..."
main "$@"
