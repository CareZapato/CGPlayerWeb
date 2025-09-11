# Comandos para SSH - Debugging y Acceso a CGPlayerWeb

## 🔍 **Debugging del Contenedor Actual**

```bash
# 1. Ver logs del contenedor que se reinicia
docker-compose logs app

# 2. Ver logs detallados y seguir en tiempo real
docker-compose logs -f --tail=100 app

# 3. Entrar al contenedor para debugging
docker-compose exec app /bin/bash

# 4. Ver si los archivos están donde deben estar
docker-compose exec app ls -la /app/
docker-compose exec app ls -la /app/start.sh
docker-compose exec app cat /app/logs/startup.log
```

## 🚀 **Aplicar Correcciones y Reiniciar**

```bash
# 1. Actualizar código con mejoras de logging
git pull origin develop

# 2. Reconstruir con logging mejorado
docker-compose down -v
docker-compose up --build -d

# 3. Ver logs en tiempo real (como npm run dev)
docker-compose logs -f app
```

## 🌐 **Verificar Acceso Web**

```bash
# 1. Verificar que los puertos estén abiertos
netstat -tlnp | grep :80
netstat -tlnp | grep :3001

# 2. Probar endpoints localmente
curl http://localhost/health
curl http://localhost:3001/api/health

# 3. Verificar desde el navegador
# Frontend: http://192.99.122.62/
# API: http://192.99.122.62:3001/api/
```

## 🔧 **Troubleshooting si el Problema Persiste**

```bash
# 1. Ver todos los logs de supervisord
docker-compose exec app tail -f /var/log/supervisor/supervisord.log

# 2. Ver logs específicos del backend
docker-compose exec app tail -f /var/log/supervisor/backend.out.log
docker-compose exec app tail -f /var/log/supervisor/backend.err.log

# 3. Ver logs de nginx
docker-compose exec app tail -f /var/log/supervisor/nginx.out.log
docker-compose exec app tail -f /var/log/supervisor/nginx.err.log

# 4. Verificar que los servicios estén corriendo dentro del contenedor
docker-compose exec app ps aux
```

## 📝 **Lo que Mejoré:**

✅ **Script start.sh**: Arreglé caracteres de encoding, agregué más logging detallado
✅ **Supervisord**: Configuré para mostrar logs en stdout/stderr como en desarrollo  
✅ **Debugging**: Agregué verificación de permisos y información del sistema

¡Ejecuta estos comandos para ver qué está pasando y acceder a la aplicación! 🎯