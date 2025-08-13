@echo off
echo ========================================
echo    VERIFICACION CGPlayerWeb - PUERTOS
echo ========================================
echo.
echo Verificando puertos en uso...
echo.
echo Puerto 5173 (Frontend):
netstat -an | findstr :5173
echo.
echo Puerto 3001 (Backend):
netstat -an | findstr :3001
echo.
echo ========================================
echo IP del sistema:
ipconfig | findstr IPv4
echo ========================================
echo.
echo URLs para acceso movil:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr IPv4 ^| findstr 192.168') do (
    set IP=%%a
    setlocal enabledelayedexpansion
    set IP=!IP: =!
    echo Frontend: http://!IP!:5173
    echo Backend:  http://!IP!:3001/api
    endlocal
)
echo.
pause
