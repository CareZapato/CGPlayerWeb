#!/bin/bash
# Script de desarrollo rápido - Seed con 300+ cantantes
# Solo para desarrollo y testing

echo "🎭 CGPlayerWeb - Seed de Desarrollo (300+ Cantantes)"
echo "=================================================="

# Verificar directorio
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

echo "⚠️  Este script creará 300+ cantantes de prueba"
echo "💡 Solo para desarrollo - NO usar en producción"
echo ""

# Confirmación
read -p "¿Continuar con el seed de desarrollo? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo "🌱 Ejecutando seed de desarrollo..."

# Verificar que la app esté ejecutándose
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Error: La aplicación no está ejecutándose"
    echo "💡 Primero ejecutar: npm run dev (en backend)"
    exit 1
fi

# Verificar token de admin (requiere login manual)
echo ""
echo "🔑 Para continuar necesitas estar logueado como ADMIN"
echo "💡 Pasos:"
echo "   1. Ir a http://localhost:3000"
echo "   2. Hacer login como administrador"
echo "   3. Ir a la sección Admin"
echo "   4. Usar el botón 'Seed Completo'"
echo ""
echo "🌐 Alternativamente, usar Postman:"
echo "   POST http://localhost:3001/api/admin/seed-full"
echo "   Header: Authorization: Bearer YOUR_TOKEN"
echo ""

# Script para obtener token (requiere que el usuario haga login)
echo "🚀 ¿Ya tienes el token de admin? Podemos intentar usar la API directamente..."
read -p "¿Tienes token de admin? (s/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "📝 Pega tu token de administrador:"
    read -r ADMIN_TOKEN
    
    if [ -n "$ADMIN_TOKEN" ]; then
        echo "🔄 Ejecutando seed mediante API..."
        
        curl -X POST http://localhost:3001/api/admin/seed-full \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $ADMIN_TOKEN" \
             -w "\n%{http_code}\n" \
             -s
        
        if [ $? -eq 0 ]; then
            echo "✅ Seed completado. Verificando resultado..."
            
            # Verificar resultado
            ./scripts/check-status.sh
        else
            echo "❌ Error ejecutando seed via API"
        fi
    else
        echo "❌ Token vacío"
    fi
else
    echo "💡 Para obtener el token:"
    echo "   1. Login en la aplicación web"
    echo "   2. Abrir DevTools (F12)"
    echo "   3. Ir a Application > Local Storage"
    echo "   4. Copiar el valor de 'token'"
fi

echo ""
echo "📋 Después del seed tendrás:"
echo "   👑 2 Administradores"
echo "   🎭 3 Directores" 
echo "   🎤 300+ Cantantes distribuidos por ciudades"
echo "   📍 7 Ubicaciones en Chile"
echo "   🎵 Perfiles de voz asignados automáticamente"
echo ""