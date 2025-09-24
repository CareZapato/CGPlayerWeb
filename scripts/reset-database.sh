#!/bin/bash
# Script para reset completo de base de datos CGPlayerWeb
# ADVERTENCIA: Este script eliminará TODOS los datos

echo "⚠️  CGPlayerWeb - Reset Completo de Base de Datos"
echo "================================================"
echo ""
echo "🚨 ADVERTENCIA: Este script eliminará TODOS los datos de la base de datos"
echo ""

# Confirmación
read -p "¿Estás seguro que quieres continuar? (escriba 'CONFIRMAR' para proceder): " confirmation

if [ "$confirmation" != "CONFIRMAR" ]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""
echo "🔄 Iniciando reset de base de datos..."

# Verificar directorio
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

cd backend

echo "🗑️  Reseteando migraciones de Prisma..."
npx prisma migrate reset --force

if [ $? -ne 0 ]; then
    echo "❌ Error durante el reset de migraciones"
    cd ..
    exit 1
fi

echo "📋 Aplicando migraciones limpias..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ Error aplicando migraciones"
    cd ..
    exit 1
fi

echo "🔍 Verificando estado de tablas..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTables() {
    try {
        // Intentar contar usuarios para verificar que las tablas existen
        const userCount = await prisma.user.count();
        console.log('✅ Tablas verificadas, usuarios actuales:', userCount);
        
        if (userCount > 0) {
            console.log('⚠️  Aún hay datos en la base de datos');
        } else {
            console.log('✅ Base de datos limpia y lista');
        }
    } catch (error) {
        console.log('❌ Error verificando tablas:', error.message);
        process.exit(1);
    } finally {
        await prisma.\$disconnect();
    }
}

verifyTables();
"

if [ $? -ne 0 ]; then
    echo "❌ Error verificando tablas"
    cd ..
    exit 1
fi

cd ..

echo ""
echo "✅ Reset de base de datos completado"
echo ""
echo "💡 Próximos pasos:"
echo "   1. Ejecutar: ./scripts/init-database.sh"
echo "   2. O iniciar la aplicación (se auto-inicializará)"
echo ""