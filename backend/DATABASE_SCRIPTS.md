# Scripts de Base de Datos - CGPlayerWeb

Este archivo documenta los scripts disponibles para gestionar la base de datos del proyecto.

## 📋 Scripts Disponibles

### 🔄 Gestión de Base de Datos

```bash
# Limpiar la base de datos (elimina todas las canciones y usuarios excepto admin)
npm run db:reset

# Sembrar datos de prueba (crear usuarios de ejemplo)
npm run db:seed

# Verificar el estado actual de las canciones
npm run db:check

# Inicialización completa (reset + seed)
npm run db:init
```

### 🏗️ Scripts de Prisma

```bash
# Generar el cliente de Prisma (necesario después de cambios en schema)
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Abrir Prisma Studio (interfaz visual de la BD)
npm run prisma:studio
```

## 👥 Usuarios de Prueba

Después de ejecutar `npm run db:seed`, tendrás estos usuarios disponibles:

### 👑 Administrador
- **Email**: admin@cgplayer.com
- **Password**: admin123
- **Rol**: ADMIN

### 🎤 Cantantes
- **Email**: soprano1@coro.com | **Password**: cantante123 | **Nombre**: María González
- **Email**: contralto1@coro.com | **Password**: cantante123 | **Nombre**: Ana Martínez
- **Email**: tenor1@coro.com | **Password**: cantante123 | **Nombre**: Carlos López
- **Email**: baritono1@coro.com | **Password**: cantante123 | **Nombre**: Luis Rodríguez
- **Email**: bajo1@coro.com | **Password**: cantante123 | **Nombre**: Miguel Fernández

## 🎯 Uso Típico

### Inicialización desde cero:
```bash
cd backend
npm run db:init  # Limpia todo y crea usuarios de prueba
npm run dev      # Inicia el servidor
```

### Después de cambios en el esquema:
```bash
npm run prisma:generate  # Regenera el cliente
npm run prisma:migrate   # Aplica migraciones
```

### Para verificar datos:
```bash
npm run db:check         # Ver canciones en consola
npm run prisma:studio    # Ver todo en interfaz web
```

## 🗂️ Estructura de Datos

### Canciones Contenedoras
- Las canciones principales actúan como "contenedores"
- No tienen archivo de audio asociado
- Agrupan las variaciones de voz

### Variaciones de Voz
- Son "hijas" de la canción contenedora
- Cada una tiene su archivo de audio
- Tipos: SOPRANO, CONTRALTO, TENOR, BARITONE, BASS

## 🚨 Notas Importantes

1. **Backup**: Siempre haz backup antes de ejecutar `db:reset`
2. **Archivos**: Los archivos de audio en `/uploads` se deben limpiar manualmente
3. **Admin**: El usuario admin siempre se mantiene, incluso después de reset
4. **Red**: El servidor detecta automáticamente la IP de red para acceso remoto

## 🔧 Solución de Problemas

### Error "Prisma Client not generated"
```bash
npm run prisma:generate
```

### Error "Address already in use"
```bash
# Detener el proceso que usa el puerto 3001
netstat -ano | findstr :3001
taskkill /PID <numero_proceso> /F
```

### Base de datos corrupta
```bash
npm run db:reset
npm run db:seed
```
