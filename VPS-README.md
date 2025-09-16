# 🚀 CGPlayerWeb - Despliegue en VPS

## Información de la VPS
- **IP**: 192.99.122.62
- **Usuario**: root
- **Contraseña**: 3tzr-IT;YE002v

## 📋 Pasos para desplegar en la VPS

### 1. Conectar a la VPS
```bash
ssh root@192.99.122.62
# Contraseña: 3tzr-IT;YE002v
```

### 2. Instalar dependencias (solo la primera vez)
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Instalar Git
apt install -y git curl wget

# Verificar instalaciones
docker --version
docker-compose --version
git --version
```

### 3. Clonar o actualizar el proyecto
```bash
# Si es la primera vez
git clone https://github.com/CareZapato/CGPlayerWeb.git
cd CGPlayerWeb

# Si ya existe el proyecto
cd CGPlayerWeb
git pull origin develop
```

### 4. Desplegar la aplicación
```bash
# Hacer el script ejecutable
chmod +x deploy-vps.sh

# Ejecutar despliegue
./deploy-vps.sh
```

### 5. Verificar que funciona
- **Frontend**: http://192.99.122.62
- **Backend API**: http://192.99.122.62:3001
- **Docs API**: http://192.99.122.62:3001/api-docs

## 🔧 Comandos útiles en la VPS

### Gestión de contenedores
```bash
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f
docker-compose logs -f app
docker-compose logs -f database

# Reiniciar servicios
docker-compose restart
docker-compose restart app

# Parar todo
docker-compose down

# Iniciar todo
docker-compose up -d

# Reconstruir desde cero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Monitoreo
```bash
# Recursos del sistema
htop
df -h
free -h

# Estado de Docker
docker stats
docker system df

# Conectar a contenedor
docker-compose exec app sh
docker-compose exec database psql -U cgplayer -d cgplayerweb
```

## 🐛 Solución de problemas

### Si el backend no responde
```bash
# Ver logs del backend
docker-compose logs app

# Reiniciar solo el app
docker-compose restart app

# Verificar variables de entorno
docker-compose exec app printenv | grep -E "(DATABASE_URL|JWT_SECRET|SERVER_IP)"
```

### Si la base de datos no conecta
```bash
# Ver logs de la base de datos
docker-compose logs database

# Verificar conexión
docker-compose exec database pg_isready -U cgplayer -d cgplayerweb

# Conectar manualmente
docker-compose exec database psql -U cgplayer -d cgplayerweb
```

### Si el frontend no carga
```bash
# Verificar Nginx
docker-compose exec app nginx -t

# Reiniciar Nginx
docker-compose exec app supervisorctl restart nginx
```

## 🔄 Proceso de actualización

### Desde tu máquina local:
1. Hacer cambios
2. `git add .`
3. `git commit -m "descripción"`
4. `git push origin develop`

### En la VPS:
1. `cd CGPlayerWeb`
2. `git pull origin develop`
3. `./deploy-vps.sh`

## 📊 Configuración de producción

### Variables importantes (ya configuradas)
- **DATABASE_URL**: postgresql://cgplayer:cgplayer_secure_password_2025@database:5432/cgplayerweb
- **JWT_SECRET**: cgplayer_vps_jwt_ultra_secure_key_2025_!@#$$%^&*()
- **SERVER_IP**: 192.99.122.62
- **NODE_ENV**: production

### Credenciales por defecto
- **Admin**: admin@cgplayer.com / admin123
- **Director**: director1@cgplayer.com / admin123
- **Cantante**: cantante1@cgplayer.com / admin123

## 🔒 Seguridad

### Firewall (configurar si es necesario)
```bash
# Permitir solo puertos necesarios
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 3001  # API Backend
ufw enable
```

### SSL/HTTPS (opcional para después)
```bash
# Instalar Certbot para SSL
apt install -y certbot
certbot --nginx -d 192.99.122.62
```

## 📞 Contacto

Si tienes problemas con el despliegue, revisa los logs y el README principal del proyecto.
