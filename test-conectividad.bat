@echo off
echo ===================================
echo   TESTE0 RAPIDO DE CONECTIVIDAD
echo ===================================
echo.

echo 🔍 Verificando servidores locales...
echo.

echo 📱 Probando Frontend (puerto 5173)...
curl -s -o nul --max-time 5 http://localhost:5173 && echo ✅ Frontend OK || echo ❌ Frontend NO RESPONDE

echo 🔧 Probando Backend Health (puerto 3001)...
curl -s --max-time 5 http://localhost:3001/api/health && echo. || echo ❌ Backend NO RESPONDE

echo 🏓 Probando Backend Ping...
curl -s --max-time 5 http://localhost:3001/api/ping && echo. || echo ❌ Backend Ping FALLO

echo.
echo 🌐 Probando desde IP externa (192.168.1.17)...
echo.

echo 📱 Probando Frontend externo...
curl -s -o nul --max-time 5 http://192.168.1.17:5173 && echo ✅ Frontend externo OK || echo ❌ Frontend externo NO RESPONDE

echo 🔧 Probando Backend externo...
curl -s --max-time 5 http://192.168.1.17:3001/api/health && echo. || echo ❌ Backend externo NO RESPONDE

echo.
echo 📋 URLs para dispositivos móviles:
echo    Frontend: http://192.168.1.17:5173
echo    Backend: http://192.168.1.17:3001/api
echo    Diagnóstico: http://192.168.1.17:5173/diagnostico-completo.html
echo.
echo 📱 Para probar desde tu móvil:
echo    1. Conecta tu móvil a la misma WiFi
echo    2. Abre: http://192.168.1.17:5173/diagnostico-completo.html
echo    3. Haz click en "Ejecutar Todas las Pruebas"
echo.
pause
