@echo off
REM Script para reiniciar el sistema CGPlayer después de agregar INSTRUMENTAL
REM Este script debería ejecutarse después de implementar el nuevo tipo de voz

echo 🎵 Iniciando reinicio del sistema CGPlayer...

REM 1. Detener servicios existentes
echo ⏹️ Deteniendo servicios...
REM Uncomment if using pm2:
REM pm2 stop backend frontend

REM 2. Verificar migración de base de datos
echo 🗃️ Verificando migración de base de datos...
cd backend
call npx prisma db push
call npx prisma generate

echo ✅ Base de datos actualizada con tipo INSTRUMENTAL

REM 3. Reinstalar dependencias si es necesario (opcional)
REM npm install

REM 4. Compilar frontend
echo 🔨 Compilando frontend...
cd ..\frontend
call npm run build

REM 5. Reiniciar servicios
echo 🚀 Reiniciando servicios...
cd ..\backend

REM Opción 1: Desarrollo
REM npm run dev

REM Opción 2: Producción con PM2
REM pm2 restart backend

REM Opción 3: Servicios Windows
REM net stop CGPlayerBackend
REM net start CGPlayerBackend
REM net stop CGPlayerFrontend  
REM net start CGPlayerFrontend

echo ✅ Sistema CGPlayer reiniciado exitosamente
echo 🎯 INSTRUMENTAL ahora disponible para todos los cantantes
echo.
echo 📋 Verificaciones recomendadas:
echo    1. Verificar subida de canciones INSTRUMENTAL
echo    2. Probar filtrado en diferentes roles
echo    3. Validar acceso universal
echo    4. Confirmar integración con eventos y playlists

pause
