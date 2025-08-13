# ChileGospel Music Player - Guía de Uso

## 🚀 Estado Actual del Sistema

### ✅ Base de Datos Configurada
- **12 usuarios** creados (1 admin, 1 director, 10 cantantes)
- **5 ubicaciones** en Chile (Antofagasta, Viña del Mar, Santiago, Concepción, Valdivia)
- **4 eventos** de ejemplo sin canciones
- **Sin canciones iniciales** para permitir testing limpio

### 📁 Estructura de Archivos
- **Carpeta de uploads**: `backend/uploads/songs/` (creada automáticamente)
- **Backup SQL**: `backend/database_backup.sql` (datos base)
- **Seeder básico**: `backend/src/seeders/basicSeed.ts`

## 🔑 Credenciales de Acceso

### Administrador
- **Email**: `admin@chilegospel.com`
- **Password**: `admin123`
- **Permisos**: Total access + gestión de usuarios

### Director Musical
- **Email**: `director@chilegospel.com`
- **Password**: `director123`
- **Permisos**: Gestión de canciones, eventos, playlists

### Cantantes (10 usuarios)
- **Emails**: `singer1@chilegospel.com` a `singer10@chilegospel.com`
- **Password**: `singer123` (para todos)
- **Permisos**: Ver canciones, playlists personales

## 🎨 Colores por Tipo de Voz

| Tipo de Voz | Color | Descripción |
|-------------|-------|-------------|
| **Soprano** | 🩷 Rosa | `bg-pink-100 text-pink-800` |
| **Contralto** | 💜 Púrpura | `bg-purple-100 text-purple-800` |
| **Tenor** | 💙 Azul | `bg-blue-100 text-blue-800` |
| **Barítono** | 💚 Verde | `bg-green-100 text-green-800` |
| **Bajo** | 💛 Amarillo | `bg-yellow-100 text-yellow-800` |

## 📤 Funcionalidades de Carga

### Carga Individual
- **Acceso**: Canciones → Subir Canción → Tab "Subida Individual"
- **Formatos**: MP3, WAV, OGG, M4A, AAC, FLAC
- **Límite**: 100MB por archivo
- **Metadata**: Título, artista, álbum, género, tipo de voz

### Carga Múltiple (NUEVA)
- **Acceso**: Canciones → Subir Canción → Tab "Subida Múltiple"
- **Capacidad**: Hasta 10 archivos simultáneamente
- **Asignación**: Tipo de voz por archivo individual
- **Drag & Drop**: Soporte completo
- **Validación**: Automática por formato y tamaño

## 📅 Gestión de Eventos

### Crear Eventos
- **Acceso**: Eventos → Nuevo Evento (Admin/Director)
- **Categorías**: Culto, Ensayo, Presentación, Especial
- **Ubicaciones**: Asignación por iglesia
- **Repertorio**: Agregar canciones con orden
- **Solistas**: Designación por tipo (MALE/FEMALE/BOTH)

### Filtros Disponibles
- Por categoría de evento
- Por ubicación
- Solo próximos eventos
- Vista detallada con repertorio y solistas

## 🏗️ Comandos de Mantenimiento

### Resetear Base de Datos
```bash
cd backend
npx ts-node src/seeders/basicSeed.ts
```

### Aplicar Backup SQL
```bash
cd backend
psql -d cgplayerbd -f database_backup.sql
```

### Iniciar Servidores
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend  
npm run dev
```

## 🔧 Resolución de Problemas

### Error 401 (Unauthorized)
1. Verificar que el usuario esté logueado
2. Revisar token en localStorage del navegador
3. Intentar logout/login nuevamente

### Archivos no se cargan
1. Verificar que existe la carpeta `backend/uploads/songs/`
2. Comprobar permisos de escritura
3. Revisar tamaño del archivo (máx. 100MB)

### Base de datos vacía
1. Ejecutar `basicSeed.ts` para datos básicos
2. O usar `database_backup.sql` para restaurar

## 📊 Estructura de Ubicaciones

1. **Antofagasta** - Iglesia Central
2. **Viña del Mar** - Iglesia ChileGospel  
3. **Santiago** - Iglesia Principal (central)
4. **Concepción** - Iglesia ChileGospel
5. **Valdivia** - Iglesia ChileGospel

## 🎯 Flujo de Trabajo Recomendado

1. **Login** como Director o Admin
2. **Subir canciones** usando carga múltiple
3. **Crear eventos** y asignar repertorio
4. **Designar solistas** por evento/canción
5. **Usuarios cantantes** acceden a su repertorio por voz

## 🔄 Próximas Funcionalidades

- [ ] Crear/editar eventos desde frontend
- [ ] Sistema de notificaciones
- [ ] Exportar repertorios a PDF
- [ ] Estadísticas de uso por ubicación
- [ ] Sistema de ensayos virtuales

---
*Última actualización: Agosto 13, 2025*
