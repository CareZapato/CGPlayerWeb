#!/bin/bash

# Script completo para desplegar CGPlayerWeb con frontend y backend funcionando
# Ejecutar en el VPS como root

echo "🚀 DESPLEGANDO CGPLAYERWEB v1.10.9 - VERSIÓN COMPLETA"
echo "======================================================"

cd /root/CGPlayerWeb

echo "1. 📥 Obteniendo últimos cambios del repositorio..."
git pull origin develop

echo "2. ⏹️ Deteniendo containers actuales..."
docker-compose down

echo "3. 🧹 Limpiando imágenes y cache de Docker..."
docker rmi cgplayerweb-app:latest 2>/dev/null || true
docker system prune -f

echo "4. 🔍 Verificando archivos críticos..."
if [ ! -f "docker/start.sh" ]; then
    echo "❌ ERROR: docker/start.sh no existe"
    exit 1
fi

if [ ! -f "docker/supervisord.conf" ]; then
    echo "❌ ERROR: docker/supervisord.conf no existe"
    exit 1
fi

if [ ! -f "docker/nginx.conf" ]; then
    echo "❌ ERROR: docker/nginx.conf no existe"
    exit 1
fi

echo "✅ Archivos críticos verificados"

echo "5. 🔧 Configurando permisos..."
chmod +x docker/start.sh

echo "6. 🏗️ Construyendo imagen Docker (esto tomará varios minutos)..."
echo "   - Compilando frontend React/TypeScript"
echo "   - Compilando backend Node.js/TypeScript"
echo "   - Configurando nginx y supervisord"
docker-compose build --no-cache --pull

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló la construcción de Docker"
    exit 1
fi

echo "7. 🚀 Iniciando servicios..."
docker-compose up -d

echo "8. ⏳ Esperando 15 segundos para verificar estado..."
sleep 15

echo "9. 📊 Estado final de containers:"
docker-compose ps

echo "10. 📝 Logs del container principal:"
docker-compose logs --tail=50 cgplayer-app

echo ""
echo "======================================================"
echo "✅ DESPLIEGUE COMPLETADO"
echo ""
echo "🌐 ACCESOS:"
echo "   Frontend: http://192.99.122.62"
echo "   Backend API: http://192.99.122.62/api"
echo ""
echo "👤 CREDENCIALES DE APLICACIÓN:"
echo "   Usuario: admin@cgplayer.local"
echo "   Contraseña: cgplayer2025"
echo ""
echo "🗄️ CREDENCIALES DE BASE DE DATOS (DBeaver):"
echo "   SSH Host: 192.99.122.62:22"
echo "   SSH User: root"
echo "   SSH Pass: 3tzr-IT;YE002v"
echo "   DB Host: localhost (via SSH)"
echo "   DB Port: 5432"
echo "   DB Name: cgplayerbd"
echo "   DB User: cgplayer"
echo "   DB Pass: cgplayerpassword"
echo ""
echo "📊 COMANDOS ÚTILES:"
echo "   Ver logs: docker-compose logs -f cgplayer-app"
echo "   Reiniciar: docker-compose restart"
echo "   Estado: docker-compose ps"
echo "======================================================"

# Verificar si el servicio está respondiendo
echo "11. 🔍 Verificando conectividad..."
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:80 > /tmp/http_status 2>/dev/null
HTTP_STATUS=$(cat /tmp/http_status 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
    echo "✅ Servidor web respondiendo (HTTP $HTTP_STATUS)"
else
    echo "⚠️ Servidor web no responde correctamente (HTTP $HTTP_STATUS)"
    echo "Revisar logs con: docker-compose logs cgplayer-app"
fi