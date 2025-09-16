# 🐳 CGPlayerWeb - Configuración Docker

Este directorio contiene toda la configuración necesaria para ejecutar CGPlayerWeb en contenedores Docker.

## 🚀 Despliegue Rápido en Ubuntu

### Opción 1: Script Automático (Recomendado)
```bash
# Hacer ejecutable el script
chmod +x deploy-ubuntu.sh

# Ejecutar despliegue automático
./deploy-ubuntu.sh
```

### Opción 2: Manual
```bash
# 1. Instalar Docker y Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose

# 2. Detectar IP local automáticamente
./scripts/auto-detect-ip.sh

# 3. Configurar variables de entorno (IP se configura automáticamente)
cp .env.example .env

# 4. Construir y ejecutar
docker-compose up -d --build

# 5. Verificar estado
docker-compose ps
```

### Opción 3: Reconfigurar IP después del despliegue
```bash
# Si necesitas cambiar la IP después del despliegue
./scripts/configure-ip.sh
```

## 📋 Servicios Incluidos

### 🗄️ **database** (PostgreSQL 15)
- **Puerto**: 5432
- **Usuario**: cgplayer  
- **Base de datos**: cgplayerweb
- **Volumen**: Persistente para datos

### 🔄 **redis** (Redis 7)
- **Puerto**: 6379
- **Uso**: Caché y sesiones (opcional)
- **Volumen**: Persistente

### 🖥️ **app** (CGPlayerWeb)
- **Puertos**: 
  - 80 (Frontend - Nginx)
  - 3001 (Backend API)
- **Servicios**:
  - React Frontend compilado
  - Node.js Backend API
  - Nginx como servidor web

### 🌐 **nginx** (Proxy Reverso - Opcional)
- **Puerto**: 8080
- **Uso**: Balanceador de carga avanzado
- **Activar**: `docker-compose --profile proxy up`

## 🔧 Configuración

### 🌐 Detección Automática de IP

CGPlayerWeb incluye detección automática de IP local para facilitar el acceso desde la red:

**🔍 Detección Automática**
```bash
# El script detecta automáticamente la IP local
./scripts/auto-detect-ip.sh

# Configurará automáticamente:
# - SERVER_IP=192.168.1.10 (tu IP detectada)
# - FRONTEND_URL=http://192.168.1.10
# - BACKEND_URL=http://192.168.1.10:3001
```

**⚙️ Reconfiguración Posterior**
```bash
# Si tu IP cambia o quieres ajustarla
./scripts/configure-ip.sh
# - Opción 1: Auto-detectar nueva IP
# - Opción 2: Configurar manualmente
# - Opción 3: Solo reiniciar servicios
```

**🎯 Acceso Multiplataforma**
- **Local**: http://localhost (solo en el servidor)
- **Red Local**: http://192.168.1.10 (desde otros dispositivos)
- **API**: http://192.168.1.10:3001 (para apps móviles)

### Variables de Entorno Importantes

```bash
# Base de datos
DATABASE_URL=postgresql://cgplayer:password@database:5432/cgplayerweb

# Seguridad (¡CAMBIAR EN PRODUCCIÓN!)
JWT_SECRET=your-super-secret-jwt-key

# Configuración del servidor
NODE_ENV=production
PORT=3001

# IP y URLs (auto-configuradas)
SERVER_IP=192.168.1.10          # ← Detectada automáticamente
FRONTEND_URL=http://192.168.1.10  # ← Configurada automáticamente
BACKEND_URL=http://192.168.1.10:3001  # ← Configurada automáticamente
```

### Archivos de Configuración

- **`nginx.conf`**: Configuración de Nginx para servir frontend y proxy API
- **`supervisord.conf`**: Gestión de procesos múltiples
- **`start.sh`**: Script de inicio con verificaciones
- **`wait-for-it.sh`**: Utilidad para esperar servicios dependientes

## 📊 Monitoreo

### Ver Logs
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f app
docker-compose logs -f database
```

### Verificar Estado
```bash
# Estado de contenedores
docker-compose ps

# Uso de recursos
docker stats

# Verificar salud de la aplicación
curl http://localhost/health
curl http://localhost:3001/api/health
```

## 🛠️ Comandos Útiles

### Gestión Básica
```bash
# Iniciar servicios
docker-compose up -d

# Parar servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Reconstruir imágenes
docker-compose up -d --build
```

### Mantenimiento
```bash
# Acceder al contenedor de la app
docker-compose exec app sh

# Ejecutar comandos en la base de datos
docker-compose exec database psql -U cgplayer -d cgplayerweb

# Ver logs del backend
docker-compose logs -f app

# Limpiar volúmenes (¡CUIDADO: Borra todos los datos!)
docker-compose down -v
```

### Backup y Restauración
```bash
# Backup de base de datos
docker-compose exec database pg_dump -U cgplayer cgplayerweb > backup.sql

# Restaurar base de datos
cat backup.sql | docker-compose exec -T database psql -U cgplayer -d cgplayerweb

# Backup de uploads
docker cp cgplayer-app:/app/backend/uploads ./uploads-backup
```

## 🔒 Seguridad

### Configuración de Producción
1. **Cambiar JWT_SECRET** - Generar con `openssl rand -hex 32`
2. **Cambiar password de DB** - Usar contraseña fuerte
3. **Configurar HTTPS** - Usar certificados SSL/TLS
4. **Firewall** - Permitir solo puertos necesarios
5. **Updates** - Mantener imágenes actualizadas

### Puertos Expuestos
- **80**: Frontend (HTTP)
- **3001**: Backend API
- **5432**: PostgreSQL (solo si es necesario externamente)
- **6379**: Redis (solo si es necesario externamente)

## 🚨 Troubleshooting

### Problemas Comunes

#### La aplicación no inicia
```bash
# Verificar logs
docker-compose logs

# Verificar recursos del sistema
docker system df
free -h
```

#### Base de datos no conecta
```bash
# Verificar estado de PostgreSQL
docker-compose exec database pg_isready -U cgplayer

# Verificar configuración
docker-compose exec app printenv | grep DATABASE
```

#### Frontend no carga
```bash
# Verificar Nginx
docker-compose exec app nginx -t

# Ver logs de Nginx
docker-compose logs app | grep nginx
```

### Restaurar Estado Limpio
```bash
# Parar todo y limpiar
docker-compose down -v --remove-orphans

# Limpiar imágenes
docker system prune -a

# Volver a construir desde cero
docker-compose up -d --build
```

## 📱 Acceso a la Aplicación

Una vez desplegado:

- **Frontend**: http://localhost
- **API**: http://localhost:3001
- **Documentación API**: http://localhost:3001/api-docs
- **Health Check**: http://localhost/health

### Credenciales por Defecto
- **Admin**: admin@cgplayer.com / admin123
- **Director**: director1@cgplayer.com / admin123  
- **Cantante**: cantante1@cgplayer.com / admin123

## 🔄 Actualizaciones

```bash
# Obtener cambios del repositorio
git pull origin develop

# Reconstruir y desplegar
docker-compose up -d --build

# Verificar que todo funcione
docker-compose ps
curl http://localhost/health
```

---

**⚠️ Nota**: Para uso en producción, asegúrate de configurar HTTPS, cambiar todas las contraseñas por defecto y seguir las mejores prácticas de seguridad.
