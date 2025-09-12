# 🔍 COMANDOS ESPECÍFICOS PARA DIAGNOSTICAR EL PROBLEMA DEL BACKUP

echo "=== DIAGNÓSTICO ESPECÍFICO DEL PROBLEMA ==="
echo ""

echo "🎯 1. VERIFICAR LA CANCIÓN ESPECÍFICA QUE FALLA:"
echo ""

# La canción que está fallando según los logs
SONG_FOLDER="wonderful_is_your_name_1757452789247"
SONG_FILE="wonderful_is_your_name_tenor.m4a"

echo "🔍 Buscando carpeta: $SONG_FOLDER"
docker exec cgplayer-app find /app/backend/uploads/ -name "*$SONG_FOLDER*" -type d

echo ""
echo "🔍 Buscando archivo: $SONG_FILE"
docker exec cgplayer-app find /app/backend/uploads/ -name "*$SONG_FILE*" -type f

echo ""
echo "🔍 Listando todo el contenido de uploads/songs:"
docker exec cgplayer-app ls -la /app/backend/uploads/songs/

echo ""
echo "🔍 Si la carpeta existe, ver su contenido:"
docker exec cgplayer-app ls -la /app/backend/uploads/songs/$SONG_FOLDER/ 2>/dev/null || echo "❌ Carpeta $SONG_FOLDER no encontrada"

echo ""
echo "📊 2. VERIFICAR EL ESTADO DEL BACKEND DE MANERA GENERAL:"
echo ""

echo "🔍 Verificar si el backend puede acceder a uploads:"
docker exec cgplayer-app ls -la /app/backend/

echo ""
echo "🔍 Verificar permisos de la carpeta uploads:"
docker exec cgplayer-app stat /app/backend/uploads/

echo ""
echo "🔍 Verificar todas las canciones disponibles:"
docker exec cgplayer-app find /app/backend/uploads/songs/ -name "*.m4a" -o -name "*.mp3" -o -name "*.wav" | head -10

echo ""
echo "📋 3. VERIFICAR LOGS ESPECÍFICOS DE LA APLICACIÓN:"
echo ""

echo "🔍 Logs de errores 404:"
docker logs cgplayer-app | grep -i "404\|not found" | tail -10

echo ""
echo "🔍 Logs de rutas de archivos:"
docker logs cgplayer-app | grep -i "file\|upload\|song" | tail -10

echo ""
echo "⚡ 4. COMANDOS DE REPARACIÓN RÁPIDA:"
echo ""

echo "Si no hay archivos, intentar reiniciar:"
echo "docker compose restart app"

echo ""
echo "Si hay problemas de permisos:"
echo "docker exec cgplayer-app chmod -R 755 /app/backend/uploads/"
echo "docker exec cgplayer-app chown -R cgplayer:nodejs /app/backend/uploads/"

echo ""
echo "🔄 5. CREAR ESTRUCTURA BÁSICA SI NO EXISTE:"
echo ""

echo "Crear carpetas básicas si faltan:"
echo "docker exec cgplayer-app mkdir -p /app/backend/uploads/songs"
echo "docker exec cgplayer-app mkdir -p /app/backend/uploads/events"
echo "docker exec cgplayer-app mkdir -p /app/backend/uploads/images/profiles"
echo "docker exec cgplayer-app mkdir -p /app/backend/uploads/images/playlists"
echo "docker exec cgplayer-app chmod -R 755 /app/backend/uploads/"
