# 🛠️ SCRIPT DE VERIFICACIÓN Y REPARACIÓN DE UPLOADS

echo "=== VERIFICACIÓN Y REPARACIÓN DE UPLOADS ==="
echo ""

echo "📊 1. ESTADO ACTUAL DEL SISTEMA:"
echo ""

echo "🐳 Contenedores activos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📁 Estructura de uploads en el contenedor:"
docker exec cgplayer-app find /app/backend/uploads/ -type d | head -20

echo ""
echo "📈 Estadísticas de archivos:"
echo "   Songs: $(docker exec cgplayer-app find /app/backend/uploads/songs/ -type f 2>/dev/null | wc -l)"
echo "   Events: $(docker exec cgplayer-app find /app/backend/uploads/events/ -type f 2>/dev/null | wc -l)"
echo "   Profile Images: $(docker exec cgplayer-app find /app/backend/uploads/images/profiles/ -type f 2>/dev/null | wc -l)"
echo "   Playlist Images: $(docker exec cgplayer-app find /app/backend/uploads/images/playlists/ -type f 2>/dev/null | wc -l)"

echo ""
echo "🔍 2. VERIFICAR ARCHIVO ESPECÍFICO QUE FALLA:"
echo ""

echo "Buscando archivos 'wonderful_is_your_name':"
docker exec cgplayer-app find /app/backend/uploads/ -name "*wonderful_is_your_name*" -type f

echo ""
echo "Verificando carpeta específica:"
docker exec cgplayer-app ls -la /app/backend/uploads/songs/wonderful_is_your_name_1757452789247/ 2>/dev/null || echo "❌ Carpeta no encontrada"

echo ""
echo "🔧 3. VERIFICAR PERMISOS Y PROPIETARIOS:"
echo ""

docker exec cgplayer-app ls -la /app/backend/uploads/
docker exec cgplayer-app stat /app/backend/uploads/songs/ 2>/dev/null || echo "❌ Carpeta songs no existe"

echo ""
echo "🔄 4. LOGS RECIENTES RELACIONADOS CON BACKUP:"
echo ""

docker logs cgplayer-app --since=1h | grep -i -E "(backup|upload|restore|file|error)" | tail -20

echo ""
echo "💾 5. INFORMACIÓN DE VOLÚMENES:"
echo ""

docker volume ls | grep cgplayer
docker volume inspect cgplayerweb_app_uploads | grep -A 5 -B 5 "Mountpoint"

echo ""
echo "🚨 6. VERIFICAR SI HAY ERRORES EN LOGS:"
echo ""

echo "Errores recientes:"
docker logs cgplayer-app --since=1h | grep -i error | tail -10

echo ""
echo "=== COMANDOS DE REPARACIÓN (EJECUTAR SI ES NECESARIO) ==="
echo ""

echo "Si no hay archivos en uploads, ejecutar:"
echo "# docker compose restart app"
echo ""

echo "Si hay problemas de permisos:"
echo "# docker exec cgplayer-app chmod -R 755 /app/backend/uploads/"
echo "# docker exec cgplayer-app chown -R cgplayer:nodejs /app/backend/uploads/"
echo ""

echo "Si el volumen está corrupto:"
echo "# docker compose down -v"
echo "# docker volume rm cgplayerweb_app_uploads"
echo "# docker compose up -d"
