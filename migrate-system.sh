#!/bin/bash

echo "🚀 Iniciando migración completa del sistema CGPlayerWeb"
echo "=============================================="

# Navegar al directorio del backend
cd backend

echo "📋 Paso 1: Regenerando cliente de Prisma..."
npx prisma generate

echo "📋 Paso 2: Aplicando migraciones de la base de datos..."
npx prisma migrate dev --name "update-roles-voices-system"

echo "📋 Paso 3: Ejecutando seed con nuevo sistema..."
npx ts-node src/seeders/newSystemSeed.ts

echo ""
echo "🎉 ¡Migración completada exitosamente!"
echo "=============================================="
echo "📊 Sistema actualizado con:"
echo "   ✅ Nuevos tipos de voz: SOPRANO, CONTRALTO, TENOR, BARITONO, MESOSOPRANO, BAJO, CORO"
echo "   ✅ Sistema de roles: ADMIN, CANTANTE"
echo "   ✅ Tabla user_roles para múltiples roles por usuario"  
echo "   ✅ Tabla user_voice_profiles para múltiples voces por usuario"
echo "   ✅ 20 cantantes de prueba con voces variadas"
echo "   ✅ Solo canciones existentes en la carpeta Songs"
echo ""
echo "🔑 Credenciales de acceso:"
echo "   Admin: admin@cgplayer.com / admin123"
echo "   Cantantes: [nombre.apellido]@cgplayer.com / cantante123"
echo ""
echo "⚠️  IMPORTANTE: Reinicia el servidor frontend y backend después de esta migración"
