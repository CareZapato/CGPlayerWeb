@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo     CONFIGURACION CENTRALIZADA DE IP
echo ===============================================
echo.

REM Leer IP actual desde frontend/.env
set "CONFIG_FILE=%~dp0frontend\.env"
set "SERVER_IP=192.168.1.11"

if exist "%CONFIG_FILE%" (
    for /f "tokens=2 delims==" %%a in ('findstr "VITE_SERVER_IP=" "%CONFIG_FILE%"') do (
        set "SERVER_IP=%%a"
    )
)

echo IP actual configurada: %SERVER_IP%
echo.
echo ¿Deseas cambiar la IP del servidor? (S/N)
set /p "CHANGE_IP="

if /i "%CHANGE_IP%"=="S" (
    echo.
    echo Ingresa la nueva IP del servidor:
    set /p "NEW_IP="
    
    echo.
    echo Actualizando archivos con nueva IP: !NEW_IP!
    
    REM Actualizar frontend/.env
    echo VITE_SERVER_IP=!NEW_IP! > "%~dp0frontend\.env.tmp"
    echo. >> "%~dp0frontend\.env.tmp"
    echo # Configuración dinámica basada en la IP >> "%~dp0frontend\.env.tmp"
    echo VITE_SERVER_HOST=!NEW_IP! >> "%~dp0frontend\.env.tmp"
    echo VITE_SERVER_PORT=3001 >> "%~dp0frontend\.env.tmp"
    echo VITE_FRONTEND_PORT=5173 >> "%~dp0frontend\.env.tmp"
    echo. >> "%~dp0frontend\.env.tmp"
    echo # URLs dinámicas >> "%~dp0frontend\.env.tmp"
    echo VITE_API_BASE_URL=http://!NEW_IP!:3001 >> "%~dp0frontend\.env.tmp"
    echo VITE_FRONTEND_URL=http://!NEW_IP!:5173 >> "%~dp0frontend\.env.tmp"
    
    move "%~dp0frontend\.env.tmp" "%~dp0frontend\.env"
    
    REM Actualizar backend/.env
    powershell -Command "(Get-Content '%~dp0backend\.env') -replace 'SERVER_IP=.*', 'SERVER_IP=!NEW_IP!' | Set-Content '%~dp0backend\.env'"
    
    REM Ejecutar script de actualización de referencias
    if exist "%~dp0scripts\update-ip-references.js" (
        echo.
        echo Actualizando referencias en documentos...
        cd "%~dp0"
        node scripts\update-ip-references.js
    )
    
    set "SERVER_IP=!NEW_IP!"
)

echo.
echo ===============================================
echo           CONFIGURACIÓN ACTUAL
echo ===============================================
echo IP del servidor: %SERVER_IP%
echo Frontend: http://%SERVER_IP%:5173
echo Backend: http://%SERVER_IP%:3001
echo API: http://%SERVER_IP%:3001/api
echo Documentación: http://%SERVER_IP%:3001/api-docs
echo ===============================================
echo.

echo ¿Deseas configurar el firewall ahora? (S/N)
set /p "CONFIG_FIREWALL="

if /i "%CONFIG_FIREWALL%"=="S" (
    echo.
    echo Configurando firewall...
    call "%~dp0CONFIGURAR_FIREWALL.bat"
)

echo.
echo ✅ Configuración completada!
echo.
echo Para iniciar los servidores:
echo   npm run dev
echo.
pause
