# Scripts de Sistema CGPlayerWeb

Esta carpeta contiene scripts utilitarios para la gestión del sistema CGPlayerWeb.

## 📁 Scripts Disponibles

### 🚀 **start-system.sh**
**Script principal de inicio del sistema**
- Verifica el estado de la base de datos
- Inicia backend y frontend automáticamente
- Abre el navegador en la URL correcta
- Auto-inicializa si es necesario

```bash
./scripts/start-system.sh
```

### 🔍 **check-status.sh**
**Verificación completa del estado del sistema**
- Verifica conexión a base de datos
- Cuenta usuarios, administradores, ubicaciones
- Muestra distribución de tipos de voz
- Identifica credenciales de acceso
- Diagnóstica problemas comunes

```bash
./scripts/check-status.sh
```

### 🌱 **init-database.sh**
**Inicialización de base de datos desde cero**
- Aplica migraciones de Prisma
- Ejecuta seed definitivo
- Crea usuario administrador base
- Verifica resultado final

```bash
./scripts/init-database.sh
```

### 🗑️ **reset-database.sh**
**Reset completo de base de datos**
- ⚠️ **ELIMINA TODOS LOS DATOS**
- Resetea migraciones de Prisma
- Deja la BD limpia y lista
- Requiere confirmación explícita

```bash
./scripts/reset-database.sh
```

### 🎭 **dev-seed.sh**
**Seed de desarrollo con 300+ cantantes**
- Solo para desarrollo/testing
- Crea datos masivos de prueba
- Requiere autenticación de admin
- Usa API REST del sistema

```bash
./scripts/dev-seed.sh
```

## 🔄 Flujo de Uso Recomendado

### Primera vez (instalación):
```bash
# 1. Instalar dependencias
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Iniciar sistema completo
./scripts/start-system.sh
```

### Desarrollo diario:
```bash
# Inicio rápido
./scripts/start-system.sh

# Verificar estado si hay problemas
./scripts/check-status.sh
```

### Reset completo (si hay problemas):
```bash
# 1. Reset completo
./scripts/reset-database.sh

# 2. Re-inicializar
./scripts/init-database.sh

# 3. Verificar
./scripts/check-status.sh
```

### Desarrollo con datos masivos:
```bash
# 1. Asegurar que el sistema esté corriendo
./scripts/start-system.sh

# 2. Crear datos de prueba (requiere login de admin)
./scripts/dev-seed.sh
```

## 🔧 Requisitos

- **Node.js** 18+ 
- **PostgreSQL** corriendo
- **Variables de entorno** configuradas (.env)
- **Dependencias instaladas** (npm install)

## ⚡ Auto-inicialización

El sistema tiene **auto-inicialización** integrada:

1. **En desarrollo**: Al iniciar con `npm run dev`, el backend verifica y crea usuarios base automáticamente
2. **En Docker**: El contenedor ejecuta verificación e inicialización al arrancar
3. **Scripts manuales**: Para control total del proceso

## 🔑 Credenciales por Defecto

### Usuario Administrador Base:
- **Email**: `admin@cgplayer.local`
- **Password**: `cgplayer2025`
- **Rol**: ADMIN
- **Ubicación**: Santiago Centro

### Después del Seed Completo:
- **Admin**: `admin@cgplayer.com` / `admin123`
- **Directores**: `director.santiago1@cgplayer.com` / `director123`
- **Cantantes**: Múltiples usuarios / `cantante123`

## 🚨 Resolución de Problemas

### "Base de datos no conecta"
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar variables .env
cat .env | grep DATABASE_URL

# Reset completo
./scripts/reset-database.sh
./scripts/init-database.sh
```

### "No hay usuario administrador"
```bash
# Re-inicializar BD
./scripts/init-database.sh

# O forzar desde la API
curl -X POST http://localhost:3001/api/admin/reinitialize-database
```

### "Tablas no existen"
```bash
# Reset completo con migraciones
./scripts/reset-database.sh
./scripts/init-database.sh
```

## 📊 Monitoreo del Sistema

### Verificación rápida:
```bash
# Estado general
./scripts/check-status.sh

# Solo conexión BD
curl http://localhost:3001/api/health

# Estadísticas de usuario
curl http://localhost:3001/api/admin/database-status
```

### Logs de desarrollo:
- **Backend**: Logs en consola con `npm run dev`
- **Frontend**: Logs en navegador DevTools
- **Base de datos**: Logs de Prisma habilitados en desarrollo

---

## 🎯 Casos de Uso Específicos

### Desarrollador nuevo:
```bash
git clone [repo]
cd CGPlayerWeb
./scripts/start-system.sh  # Todo automatizado
```

### Reset después de cambios de schema:
```bash
./scripts/reset-database.sh
npx prisma migrate dev
./scripts/init-database.sh
```

### Preparar datos para demo:
```bash
./scripts/start-system.sh
# Login como admin en web
./scripts/dev-seed.sh  # 300+ cantantes
```

### Diagnóstico de problemas:
```bash
./scripts/check-status.sh  # Reporte completo
# Seguir las sugerencias del output
```

Este sistema de scripts proporciona **control total** sobre la inicialización y mantenimiento de CGPlayerWeb, con **auto-recuperación** y **diagnósticos inteligentes**.