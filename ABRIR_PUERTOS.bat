@echo off
echo ===============================================
echo    ABRIENDO PUERTOS PARA CGPlayerWeb
echo ===============================================
echo.
echo IMPORTANTE: Ejecutar como ADMINISTRADOR
echo.
echo Si no eres administrador, clic derecho en este archivo
echo y selecciona "Ejecutar como administrador"
echo.
pause
echo.
echo Abriendo puerto 5173 (Frontend)...
netsh advfirewall firewall add rule name="CGPlayerWeb Frontend" dir=in action=allow protocol=TCP localport=5173

echo.
echo Abriendo puerto 3001 (Backend)...
netsh advfirewall firewall add rule name="CGPlayerWeb Backend" dir=in action=allow protocol=TCP localport=3001

echo.
echo ===============================================
echo URLs para acceso desde otros dispositivos:
echo Frontend: http://192.168.1.17:5173
echo Backend:  http://192.168.1.17:3001/api
echo ===============================================
echo.
echo ¡Puertos abiertos exitosamente!
echo Ahora puedes acceder desde tu móvil o cualquier dispositivo en la misma red WiFi.
echo.
pause
