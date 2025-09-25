#!/bin/bash
# Script de inicio y verificación completa del sistema

echo "🚀 CGPlayerWeb - Inicio del Sistema"
echo "=================================="

# Verificar directorio
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

echo "🔍 Verificando estado del sistema..."

# Usar el script de verificación
./scripts/check-status.sh

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ Sistema verificado correctamente"
    echo ""
    echo "🚀 Iniciando aplicación..."
    echo ""
    
    # Verificar si ya está corriendo
    if lsof -i :3001 > /dev/null 2>&1; then
        echo "ℹ️  Backend ya está ejecutándose en puerto 3001"
    else
        echo "🔧 Iniciando backend..."
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        
        # Esperar a que el backend esté listo
        echo "⏳ Esperando que el backend esté listo..."
        for i in {1..30}; do
            if curl -s http://localhost:3001/api/health > /dev/null; then
                echo "✅ Backend listo en puerto 3001"
                break
            fi
            sleep 1
            echo -n "."
        done
        echo ""
    fi
    
    if lsof -i :3000 > /dev/null 2>&1; then
        echo "ℹ️  Frontend ya está ejecutándose en puerto 3000"
    else
        echo "🎨 Iniciando frontend..."
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        cd ..
        
        # Esperar a que el frontend esté listo
        echo "⏳ Esperando que el frontend esté listo..."
        sleep 5
        echo "✅ Frontend iniciado en puerto 3000"
    fi
    
    echo ""
    echo "🎉 Sistema iniciado correctamente!"
    echo ""
    echo "🌐 URLs de acceso:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   API Docs: http://localhost:3001/api-docs"
    echo ""
    echo "🔑 Credenciales de acceso:"
    echo "   Email: admin@cgplayer.local"
    echo "   Password: cgplayer2025"
    echo ""
    echo "📋 Scripts útiles:"
    echo "   ./scripts/check-status.sh - Verificar estado"
    echo "   ./scripts/dev-seed.sh - Crear datos de prueba"
    echo "   ./scripts/reset-database.sh - Resetear BD"
    echo ""
    
    # Abrir navegador si está disponible
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open > /dev/null; then
        open http://localhost:3000
    elif command -v start > /dev/null; then
        start http://localhost:3000
    fi
    
    # Mantener el script corriendo
    echo "🔄 Presiona Ctrl+C para detener los servicios"
    
    # Trap para limpiar procesos al salir
    trap 'echo ""; echo "🛑 Deteniendo servicios..."; [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null; [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null; echo "✅ Servicios detenidos"; exit 0' INT
    
    # Esperar indefinidamente
    while true; do
        sleep 1
    done
    
else
    echo ""
    echo "⚠️  El sistema requiere inicialización"
    echo ""
    read -p "¿Quieres inicializar la base de datos ahora? (s/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        ./scripts/init-database.sh
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Inicialización completada"
            echo "🔄 Reiniciando verificación..."
            exec "$0"  # Re-ejecutar este script
        else
            echo "❌ Error durante la inicialización"
            exit 1
        fi
    else
        echo ""
        echo "💡 Para inicializar manualmente:"
        echo "   ./scripts/init-database.sh"
        echo ""
        echo "💡 Para resetear y empezar desde cero:"
        echo "   ./scripts/reset-database.sh"
        echo "   ./scripts/init-database.sh"
        exit 1
    fi
fi