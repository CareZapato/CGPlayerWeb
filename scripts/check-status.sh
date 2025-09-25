#!/bin/bash
# Script de verificación del estado del sistema CGPlayerWeb
# Verifica conexión a BD, usuarios, y estado general

echo "🔍 CGPlayerWeb - Verificación del Estado del Sistema"
echo "=================================================="

# Verificar directorio
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

cd backend

echo "📊 Verificando estado de la base de datos..."

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSystemStatus() {
    try {
        console.log('🔗 Verificando conexión a base de datos...');
        
        // Test de conexión básica
        await prisma.\$queryRaw\`SELECT 1\`;
        console.log('✅ Conexión a base de datos: OK');
        
        // Verificar estructura de tablas principales
        console.log('\\n🏗️  Verificando estructura de tablas...');
        
        const tables = [
            'user', 'location', 'userRole_DB', 'userVoiceProfile',
            'song', 'playlist', 'event', 'lyric'
        ];
        
        for (const table of tables) {
            try {
                const count = await prisma[table].count();
                console.log(\`   ✅ \${table}: \${count} registros\`);
            } catch (error) {
                console.log(\`   ❌ \${table}: Error - \${error.message.split('\\n')[0]}\`);
            }
        }
        
        // Verificar usuarios administrativos
        console.log('\\n👑 Verificando usuarios administrativos...');
        
        const admins = await prisma.user.findMany({
            where: {
                roles: { some: { role: 'ADMIN' } }
            },
            include: {
                roles: true,
                location: true
            }
        });
        
        if (admins.length > 0) {
            console.log(\`✅ Encontrados \${admins.length} administrador(es):\`);
            admins.forEach(admin => {
                console.log(\`   👤 \${admin.firstName} \${admin.lastName} (\${admin.email})\`);
                console.log(\`      📍 \${admin.location?.name || 'Sin ubicación'}\`);
                console.log(\`      🟢 Estado: \${admin.isActive ? 'Activo' : 'Inactivo'}\`);
            });
        } else {
            console.log('❌ No se encontraron administradores');
        }
        
        // Verificar ubicaciones
        console.log('\\n📍 Verificando ubicaciones...');
        const locations = await prisma.location.findMany();
        
        if (locations.length > 0) {
            console.log(\`✅ Encontradas \${locations.length} ubicación(es):\`);
            locations.forEach(loc => {
                console.log(\`   📍 \${loc.name} - \${loc.city}\`);
            });
        } else {
            console.log('❌ No se encontraron ubicaciones');
        }
        
        // Estadísticas generales
        console.log('\\n📈 Estadísticas generales:');
        
        const [userCount, songCount, playlistCount, eventCount] = await Promise.all([
            prisma.user.count(),
            prisma.song.count().catch(() => 0),
            prisma.playlist.count().catch(() => 0),
            prisma.event.count().catch(() => 0)
        ]);
        
        console.log(\`   👥 Total usuarios: \${userCount}\`);
        console.log(\`   🎵 Total canciones: \${songCount}\`);
        console.log(\`   📋 Total playlists: \${playlistCount}\`);
        console.log(\`   🎪 Total eventos: \${eventCount}\`);
        
        // Verificar tipos de voz
        console.log('\\n🎤 Verificando distribución de voces...');
        try {
            const voiceDistribution = await prisma.userVoiceProfile.groupBy({
                by: ['voiceType'],
                _count: { voiceType: true }
            });
            
            if (voiceDistribution.length > 0) {
                console.log('✅ Distribución de tipos de voz:');
                voiceDistribution.forEach(voice => {
                    console.log(\`   🎵 \${voice.voiceType}: \${voice._count.voiceType} cantantes\`);
                });
            } else {
                console.log('ℹ️  No hay perfiles de voz asignados');
            }
        } catch (error) {
            console.log('⚠️  No se pudo verificar distribución de voces');
        }
        
        // Resumen del estado
        console.log('\\n' + '='.repeat(50));
        
        if (userCount > 0 && admins.length > 0 && locations.length > 0) {
            console.log('✅ ESTADO DEL SISTEMA: OPERACIONAL');
            console.log('🟢 La aplicación está lista para usar');
            
            console.log('\\n🔑 Credenciales sugeridas para prueba:');
            
            // Buscar credenciales conocidas
            const knownAdmin = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: 'admin@cgplayer.local' },
                        { email: 'admin@cgplayer.com' }
                    ]
                }
            });
            
            if (knownAdmin) {
                if (knownAdmin.email === 'admin@cgplayer.local') {
                    console.log('   📧 Email: admin@cgplayer.local');
                    console.log('   🔒 Password: cgplayer2025');
                } else {
                    console.log('   📧 Email: admin@cgplayer.com');
                    console.log('   🔒 Password: admin123');
                }
            }
            
        } else {
            console.log('⚠️  ESTADO DEL SISTEMA: INCOMPLETO');
            console.log('🟡 La aplicación requiere inicialización');
            console.log('\\n💡 Para inicializar ejecutar: ./scripts/init-database.sh');
        }
        
    } catch (error) {
        console.log('\\n❌ ERROR CRÍTICO:');
        console.log('   Mensaje:', error.message);
        console.log('   Código:', error.code || 'N/A');
        console.log('\\n💡 Soluciones sugeridas:');
        console.log('   1. Verificar que la base de datos esté ejecutándose');
        console.log('   2. Verificar variables de entorno (.env)');
        console.log('   3. Ejecutar: ./scripts/reset-database.sh');
        console.log('   4. Ejecutar: ./scripts/init-database.sh');
        
        process.exit(1);
    } finally {
        await prisma.\$disconnect();
    }
}

checkSystemStatus();
"

cd ..
echo ""