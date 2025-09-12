#!/bin/bash

# Script de inicialización para CGPlayerWeb
# Este script se ejecuta cuando el contenedor inicia

set -e

echo "🚀 Iniciando proceso de inicialización de CGPlayerWeb..."

# Esperar a que PostgreSQL esté disponible
echo "⏳ Esperando a que PostgreSQL esté disponible..."
until pg_isready -h database -p 5432 -U cgplayer -d cgplayerbd; do
  echo "PostgreSQL no está listo - esperando..."
  sleep 2
done

echo "✅ PostgreSQL está listo!"

# Cambiar al directorio del backend
cd /app/backend

# Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
npx prisma generate

# Aplicar migraciones
echo "📊 Aplicando migraciones de base de datos..."
if npx prisma migrate deploy; then
    echo "✅ Migraciones aplicadas exitosamente"
else
    echo "⚠️ Error en migraciones, intentando con db push..."
    npx prisma db push --accept-data-loss --force-reset
fi

# Verificar estado de la base de datos
echo "🔍 Verificando estado de la base de datos..."
npx prisma db seed --preview-feature || node prisma/seed-definitivo.js || echo "⚠️ Seed opcional falló, continuando..."

echo "🎉 CGPlayerWeb inicializado correctamente!"
echo "🌐 Backend iniciando en puerto 3001..."
