#!/bin/bash
# Script de resumen y ayuda de todos los scripts del sistema

echo "📋 CGPlayerWeb - Resumen de Scripts Disponibles"
echo "=============================================="
echo ""

echo "📁 Scripts en /scripts:"
echo ""

if [ -f "scripts/start-system.sh" ]; then
    echo "🚀 start-system.sh - PRINCIPAL"
    echo "   └─ Inicia todo el sistema automáticamente"
    echo "   └─ Verifica BD, inicia backend/frontend, abre navegador"
    echo "   └─ Uso: ./scripts/start-system.sh"
    echo ""
fi

if [ -f "scripts/check-status.sh" ]; then
    echo "🔍 check-status.sh - DIAGNÓSTICO"
    echo "   └─ Verifica estado completo del sistema"
    echo "   └─ Muestra usuarios, ubicaciones, distribución de voces"
    echo "   └─ Uso: ./scripts/check-status.sh"
    echo ""
fi

if [ -f "scripts/init-database.sh" ]; then
    echo "🌱 init-database.sh - INICIALIZACIÓN"
    echo "   └─ Inicializa BD desde cero con datos mínimos"
    echo "   └─ Crea admin básico y estructura necesaria"
    echo "   └─ Uso: ./scripts/init-database.sh"
    echo ""
fi

if [ -f "scripts/reset-database.sh" ]; then
    echo "🗑️ reset-database.sh - RESET COMPLETO"
    echo "   └─ ⚠️  ELIMINA TODOS LOS DATOS de la BD"
    echo "   └─ Resetea migraciones y deja BD limpia"
    echo "   └─ Uso: ./scripts/reset-database.sh"
    echo ""
fi

if [ -f "scripts/dev-seed.sh" ]; then
    echo "🎭 dev-seed.sh - DATOS DE DESARROLLO"
    echo "   └─ Crea 300+ cantantes para testing"
    echo "   └─ Requiere autenticación de admin"
    echo "   └─ Uso: ./scripts/dev-seed.sh"
    echo ""
fi

echo "🔧 Scripts de soporte del sistema:"
echo ""

# Backend scripts
if [ -f "backend/prisma/seed-definitivo.js" ]; then
    echo "📦 backend/prisma/seed-definitivo.js"
    echo "   └─ Seed definitivo con datos base"
fi

if [ -f "backend/src/scripts/reset-chilean-db.ts" ]; then
    echo "🇨🇱 backend/src/scripts/reset-chilean-db.ts"
    echo "   └─ Reset con datos chilenos específicos"
fi

if [ -f "backend/src/services/databaseInitialization.ts" ]; then
    echo "⚙️  backend/src/services/databaseInitialization.ts"
    echo "   └─ Servicio de auto-inicialización integrado"
fi

echo ""
echo "🎯 Casos de Uso Comunes:"
echo ""
echo "🆕 Primera instalación:"
echo "   ./scripts/start-system.sh"
echo ""
echo "🐛 Problemas con BD:"
echo "   ./scripts/check-status.sh"
echo "   ./scripts/reset-database.sh"
echo "   ./scripts/init-database.sh"
echo ""
echo "🧪 Desarrollo con datos masivos:"
echo "   ./scripts/start-system.sh"
echo "   ./scripts/dev-seed.sh"
echo ""
echo "🔍 Solo verificar estado:"
echo "   ./scripts/check-status.sh"
echo ""

echo "✨ CARACTERÍSTICAS ESPECIALES:"
echo ""
echo "🤖 Auto-inicialización:"
echo "   ✅ El backend verifica y crea usuarios base automáticamente"
echo "   ✅ No necesitas ejecutar scripts manualmente normalmente"
echo "   ✅ Solo usar scripts para casos especiales"
echo ""

echo "🛡️ Recuperación automática:"
echo "   ✅ Si no hay admin, se crea automáticamente"
echo "   ✅ Si no hay ubicaciones, se crean automáticamente"
echo "   ✅ Si las tablas no existen, se crean con migraciones"
echo ""

echo "🔑 Credenciales por defecto:"
echo "   📧 admin@cgplayer.local / cgplayer2025 (sistema básico)"
echo "   📧 admin@cgplayer.com / admin123 (después del seed)"
echo ""

echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3001"
echo "   API Docs: http://localhost:3001/api-docs"
echo ""

echo "📖 Para más detalles:"
echo "   cat scripts/README.md"
echo ""