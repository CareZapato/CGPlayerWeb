# 🔍 COMANDOS DE DIAGNÓSTICO DEL BACKUP EN VPS

echo "=== DIAGNÓSTICO COMPLETO DEL BACKUP EN VPS ==="
echo ""

echo "1. VERIFICAR ESTADO DE LOS CONTENEDORES:"
docker ps

echo ""
echo "2. VER LOGS RECIENTES DEL CONTENEDOR DE LA APP:"
docker logs cgplayer-app --tail=50

echo ""
echo "3. VERIFICAR ESTRUCTURA DE UPLOADS DENTRO DEL CONTENEDOR:"
docker exec cgplayer-app ls -la /app/backend/uploads/

echo ""
echo "4. VERIFICAR CARPETA SONGS ESPECÍFICAMENTE:"
docker exec cgplayer-app ls -la /app/backend/uploads/songs/

echo ""
echo "5. CONTAR ARCHIVOS EN SONGS:"
docker exec cgplayer-app find /app/backend/uploads/songs/ -type f | wc -l

echo ""
echo "6. VERIFICAR CARPETA EVENTS:"
docker exec cgplayer-app ls -la /app/backend/uploads/events/

echo ""
echo "7. VERIFICAR CARPETAS DE IMAGES:"
docker exec cgplayer-app ls -la /app/backend/uploads/images/
docker exec cgplayer-app ls -la /app/backend/uploads/images/playlists/
docker exec cgplayer-app ls -la /app/backend/uploads/images/profiles/

echo ""
echo "8. VERIFICAR PERMISOS DE LAS CARPETAS:"
docker exec cgplayer-app stat /app/backend/uploads/songs/
docker exec cgplayer-app stat /app/backend/uploads/events/

echo ""
echo "9. BUSCAR EL ARCHIVO ESPECÍFICO QUE NO SE ENCUENTRA:"
docker exec cgplayer-app find /app/backend/uploads/ -name "*wonderful_is_your_name*" -type f

echo ""
echo "10. VERIFICAR ESTRUCTURA COMPLETA DEL DIRECTORIO UPLOADS:"
docker exec cgplayer-app find /app/backend/uploads/ -type d

echo ""
echo "11. VER ESPACIO USADO POR UPLOADS:"
docker exec cgplayer-app du -sh /app/backend/uploads/

echo ""
echo "12. VERIFICAR LOGS DE BACKUP EN EL CONTENEDOR:"
docker logs cgplayer-app | grep -i backup

echo ""
echo "13. VERIFICAR SI EXISTE LA CARPETA ESPECÍFICA DE LA CANCIÓN:"
docker exec cgplayer-app ls -la /app/backend/uploads/songs/wonderful_is_your_name_1757452789247/

echo ""
echo "14. VERIFICAR VOLÚMENES DE DOCKER:"
docker volume ls | grep cgplayer

echo ""
echo "15. INSPECCIONAR EL VOLUMEN DE UPLOADS:"
docker volume inspect cgplayerweb_app_uploads
