#!/bin/bash

# Script para reiniciar el sistema CGPlayer después de agregar INSTRUMENTAL
# Este script debería ejecutarse después de implementar el nuevo tipo de voz

echo "🎵 Iniciando reinicio del sistema CGPlayer..."

# 1. Detener servicios existentes
echo "⏹️ Deteniendo servicios..."
# Uncomment if using pm2:
# pm2 stop backend frontend

# 2. Verificar migración de base de datos
echo "🗃️ Verificando migración de base de datos..."
cd backend
npx prisma db push
npx prisma generate

echo "✅ Base de datos actualizada con tipo INSTRUMENTAL"

# 3. Reinstalar dependencias si es necesario (opcional)
# npm install

# 4. Compilar frontend
echo "🔨 Compilando frontend..."
cd ../frontend
npm run build

# 5. Reiniciar servicios
echo "🚀 Reiniciando servicios..."
cd ../backend

# Opción 1: Desarrollo
# npm run dev

# Opción 2: Producción con PM2
# pm2 restart backend

# Opción 3: Producción con systemd
# sudo systemctl restart cgplayer-backend
# sudo systemctl restart cgplayer-frontend

echo "✅ Sistema CGPlayer reiniciado exitosamente"
echo "🎯 INSTRUMENTAL ahora disponible para todos los cantantes"
echo ""
echo "📋 Verificaciones recomendadas:"
echo "   1. Verificar subida de canciones INSTRUMENTAL"
echo "   2. Probar filtrado en diferentes roles"
echo "   3. Validar acceso universal"
echo "   4. Confirmar integración con eventos y playlists"
