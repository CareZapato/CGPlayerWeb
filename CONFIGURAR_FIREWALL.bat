@echo off
echo ==============================================
echo     CONFIGURANDO FIREWALL PARA CGPlayerWeb
echo ==============================================
echo.

echo Verificando permisos de administrador...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Ejecutando como administrador
) else (
    echo ❌ ERROR: Este script debe ejecutarse como ADMINISTRADOR
    echo.
    echo ► Haz click derecho en este archivo y selecciona "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo.
echo 🔥 Configurando reglas del firewall...
echo.

echo 📱 Agregando regla para Frontend (puerto 5173)...
netsh advfirewall firewall delete rule name="CGPlayerWeb Frontend"
netsh advfirewall firewall add rule name="CGPlayerWeb Frontend" dir=in action=allow protocol=TCP localport=5173

echo 🔧 Agregando regla para Backend (puerto 3001)...
netsh advfirewall firewall delete rule name="CGPlayerWeb Backend"
netsh advfirewall firewall add rule name="CGPlayerWeb Backend" dir=in action=allow protocol=TCP localport=3001

echo 📄 Agregando regla para Node.js...
netsh advfirewall firewall delete rule name="Node.js CGPlayerWeb"
netsh advfirewall firewall add rule name="Node.js CGPlayerWeb" dir=in action=allow program="C:\Program Files\nodejs\node.exe"

echo.
echo 🔍 Verificando reglas creadas...
netsh advfirewall firewall show rule name="CGPlayerWeb Frontend"
netsh advfirewall firewall show rule name="CGPlayerWeb Backend"

echo.
echo ✅ CONFIGURACIÓN COMPLETADA
echo.
echo 📱 URLs para acceso móvil:
echo    Frontend: http://192.168.1.11:5173
echo    Backend API: http://192.168.1.11:3001/api
echo    Diagnóstico: http://192.168.1.11:5173/diagnostico-completo.html
echo.
echo 🔧 Para verificar que funciona:
echo    1. Abre http://192.168.1.11:5173/diagnostico-completo.html en tu móvil
echo    2. Ejecuta las pruebas desde el móvil
echo    3. Todas las pruebas deben pasar ✅
echo.
pause
