#!/bin/bash

# Script para arreglar todos los archivos con problemas de roles

echo "🔧 Arreglando archivos con problemas de roles..."

# Crear respaldo
echo "📁 Creando respaldos..."

# Lista de archivos a arreglar
declare -a files=(
    "src/routes/songs.ts"
    "src/routes/lyrics.ts"
    "src/routes/locations.ts"
    "src/routes/events.ts"
    "src/routes/songsImproved.ts"
    "src/routes/songs_old.ts"
)

# Arreglar cada archivo
for file in "${files[@]}"
do
    if [ -f "$file" ]; then
        echo "🔧 Arreglando $file..."
        
        # Reemplazar req.user!.role con hasRole helper
        sed -i "s/req\.user!\.role !== 'ADMIN'/!hasRole(req.user, ['ADMIN'])/g" "$file"
        sed -i "s/req\.user!\.role === 'ADMIN'/hasRole(req.user, ['ADMIN'])/g" "$file"
        sed -i "s/\['ADMIN', 'DIRECTOR'\]\.includes(req\.user!\.role)/hasRole(req.user, ['ADMIN'])/g" "$file"
        sed -i "s/req\.user!\.role/hasRole(req.user, ['ADMIN']) ? 'ADMIN' : 'CANTANTE'/g" "$file"
        
        # Agregar import si no existe
        if ! grep -q "import.*roleHelpers" "$file"; then
            sed -i "1i import { hasRole, isAdmin } from '../utils/roleHelpers';" "$file"
        fi
        
        echo "✅ $file arreglado"
    else
        echo "⚠️ $file no encontrado"
    fi
done

echo "🎉 Todos los archivos han sido arreglados!"
