#!/bin/bash
# Script de inicialización completa de base de datos CGPlayerWeb
# Este script verifica y regenera la base de datos con usuarios base

echo "🚀 CGPlayerWeb - Inicialización Completa de Base de Datos"
echo "======================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar conexión a base de datos
echo "🔍 Verificando conexión a base de datos..."
cd backend

# Verificar migraciones
echo "📋 Aplicando migraciones..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "⚠️  Migraciones fallaron, intentando reset..."
    npx prisma migrate reset --force
    npx prisma migrate deploy
fi

# Verificar estado actual
echo "📊 Verificando estado actual de la base de datos..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
    try {
        const userCount = await prisma.user.count();
        const locationCount = await prisma.location.count();
        
        console.log(\`👥 Usuarios actuales: \${userCount}\`);
        console.log(\`📍 Ubicaciones actuales: \${locationCount}\`);
        
        if (userCount === 0) {
            console.log('🟡 Base de datos vacía - requiere inicialización');
            process.exit(1);
        } else {
            console.log('✅ Base de datos ya inicializada');
            
            // Verificar admin
            const admin = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: 'admin@cgplayer.local' },
                        { email: 'admin@cgplayer.com' }
                    ]
                },
                include: { roles: true }
            });
            
            if (admin) {
                console.log(\`👑 Admin encontrado: \${admin.email}\`);
            } else {
                console.log('⚠️  No se encontró usuario administrador');
            }
            
            process.exit(0);
        }
    } catch (error) {
        console.log('❌ Error verificando base de datos:', error.message);
        process.exit(2);
    } finally {
        await prisma.\$disconnect();
    }
}

checkStatus();
"

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "✅ Base de datos ya está inicializada correctamente"
    cd ..
    exit 0
elif [ $exit_code -eq 2 ]; then
    echo "❌ Error de conexión a base de datos"
    cd ..
    exit 1
fi

# Si llegamos aquí, necesitamos inicializar
echo ""
echo "🌱 Iniciando seed de base de datos..."

# Ejecutar seed definitivo
if [ -f "prisma/seed-definitivo.js" ]; then
    echo "📦 Ejecutando seed definitivo..."
    node prisma/seed-definitivo.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Seed definitivo completado"
    else
        echo "⚠️  Seed definitivo falló, intentando alternativo..."
        
        # Usar el script de reset chileno como alternativa
        if [ -f "src/scripts/reset-chilean-db.ts" ]; then
            echo "📦 Ejecutando seed chileno..."
            npx ts-node src/scripts/reset-chilean-db.ts
        else
            echo "❌ No se encontró script de seed alternativo"
            cd ..
            exit 1
        fi
    fi
else
    echo "❌ No se encontró script de seed definitivo"
    cd ..
    exit 1
fi

# Verificar resultado final
echo ""
echo "🔍 Verificando resultado de inicialización..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyResult() {
    try {
        const [userCount, adminCount, locationCount] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: {
                    roles: { some: { role: 'ADMIN' } }
                }
            }),
            prisma.location.count()
        ]);
        
        console.log('📊 Resultado final:');
        console.log(\`   👥 Total usuarios: \${userCount}\`);
        console.log(\`   👑 Administradores: \${adminCount}\`);
        console.log(\`   📍 Ubicaciones: \${locationCount}\`);
        
        if (userCount > 0 && adminCount > 0) {
            console.log('');
            console.log('✅ Inicialización completada exitosamente');
            console.log('');
            console.log('🔑 CREDENCIALES DE ACCESO:');
            console.log('   📧 Email: admin@cgplayer.local');
            console.log('   🔒 Password: cgplayer2025');
            console.log('   🌐 URL: http://localhost:3000');
            console.log('');
        } else {
            console.log('❌ Inicialización incompleta');
            process.exit(1);
        }
        
    } catch (error) {
        console.log('❌ Error verificando resultado:', error.message);
        process.exit(1);
    } finally {
        await prisma.\$disconnect();
    }
}

verifyResult();
"

cd ..
echo "🎉 Proceso de inicialización completado"