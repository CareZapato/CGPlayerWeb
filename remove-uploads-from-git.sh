#!/bin/bash

echo "🧹 REMOVIENDO ARCHIVOS DE UPLOADS DEL TRACKING DE GIT"
echo "📁 Los archivos se mantendrán en tu disco local, solo se quitarán del repositorio"
echo ""

# Remover del tracking los archivos de songs (mantenerlos localmente)
echo "🎵 Removiendo archivos de songs del tracking..."
git rm -r --cached backend/uploads/songs/* 2>/dev/null || echo "No hay archivos de songs para remover"

# Remover del tracking los archivos de events (mantenerlos localmente)  
echo "📅 Removiendo archivos de events del tracking..."
git rm -r --cached backend/uploads/events/* 2>/dev/null || echo "No hay archivos de events para remover"

# Remover del tracking las imágenes de playlists (excepto .gitkeep y README.md)
echo "🖼️ Removiendo imágenes de playlists del tracking..."
git ls-files backend/uploads/images/playlists/ | grep -v '.gitkeep' | grep -v 'README.md' | xargs git rm --cached 2>/dev/null || echo "No hay imágenes de playlists para remover"

# Remover del tracking las imágenes de profiles (excepto .gitkeep)
echo "👤 Removiendo imágenes de profiles del tracking..."
git ls-files backend/uploads/images/profiles/ | grep -v '.gitkeep' | xargs git rm --cached 2>/dev/null || echo "No hay imágenes de profiles para remover"

echo ""
echo "✅ Archivos removidos del tracking de Git"
echo "📋 Próximos pasos:"
echo "1. git add .gitignore"
echo "2. git commit -m 'Remove uploads from git tracking, keep local files'"
echo "3. git push origin develop"
echo ""
echo "🔍 Para verificar qué archivos están siendo trackeados:"
echo "git ls-files backend/uploads/"
