# CGPlayerWeb 🎵

[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](https://github.com/CareZapato/CGPlayerWeb/releases/tag/v0.3.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

**CGPlayerWeb** es una aplicación web moderna para la gestión y reproducción de música coral, diseñada específicamente para coros y grupos musicales. Permite la subida, organización y reproducción de pistas de audio con un sistema avanzado de roles y autenticación.

## 🚀 Características Principales

### 🎵 Gestión de Música
- **Subida de archivos de audio** (MP3, M4A, WAV, FLAC)
- **Organización automática** en carpetas individuales por canción
- **Sistema de variaciones de voz** - todas las voces son tratadas como iguales
- **Metadatos automáticos** extraídos de archivos de audio
- **Reproductor de audio integrado** con controles avanzados
- **Cola de reproducción mejorada** con validación de tipos de voz

### 👥 Sistema de Usuarios
- **Autenticación JWT** segura
- **Roles diferenciados**: Admin, Director, Cantante
- **Gestión de permisos** granular por funcionalidad
- **Perfiles de usuario** personalizables

### 📊 Panel de Administración
- **Dashboard estadístico** con métricas en tiempo real
- **Visualizaciones de datos** con gráficos de torta interactivos
- **Gestión de usuarios** con estadísticas detalladas
- **Monitoreo del sistema** con datos de rendimiento

### 🎼 Reproductor Avanzado
- **Reproductor flotante** que permanece activo durante la navegación
- **Playlist slide-up** con interfaz deslizante desde abajo
- **Drag & Drop** para reordenar canciones en la cola
- **Controles de reproducción** completos (play, pause, seek, volumen)
- **Barra de progreso interactiva** con click-to-seek
- **Navegación automática** entre canciones
- **Soporte para streaming** con requests HTTP Range
- **Audio de alta calidad** sin pérdida de fidelidad
- **Sistema de cola corregido** que añade correctamente las versiones reproducibles

## 🚀 Características Principales

### 🎵 Gestión de Música
- **Subida de archivos de audio** (MP3, M4A, WAV, FLAC)
- **Organización automática** en carpetas individuales por canción
- **Sistema de versiones** para diferentes arreglos de la misma canción
- **Metadatos automáticos** extraídos de archivos de audio
- **Reproductor de audio integrado** con controles avanzados

### 👥 Sistema de Usuarios
- **Autenticación JWT** segura
- **Roles diferenciados**: Admin, Director, Cantante
- **Gestión de permisos** granular por funcionalidad
- **Perfiles de usuario** personalizables

### 🎵 Reproductor Avanzado
- **Reproductor flotante** que permanece activo durante la navegación
- **Controles de reproducción** completos (play, pause, seek, volumen)
- **Barra de progreso interactiva** con click-to-seek
- **Soporte para streaming** con requests HTTP Range
- **Audio de alta calidad** sin pérdida de fidelidad

### 🗂️ Organización Inteligente
- **Estructura container-children** para variaciones de voz
- **7 tipos de voz completos**: Soprano, Contralto, Tenor, Barítono, Bajo, Coro, Original
- **Todas las voces son iguales** - ninguna se trata como "principal"
- **Carpetas automáticas** con nomenclatura: `nombreCancion_timestamp`
- **Base de datos PostgreSQL** para metadatos y relaciones
- **Validación automática** de integridad entre archivos y BD

### ✨ Nuevas Características v0.2.0
- **🎭 Playlist Slide-Up**: Interfaz deslizante con drag & drop para reordenar
- **▶️ Botones de Reproducción**: Directamente en las tarjetas de canciones
- **🔄 Auto-navegación**: Reproducción automática de la siguiente canción
- **🎚️ Controles Mejorados**: Reproductor integrado con mejor UX
- **🗄️ Scripts de BD**: Gestión automatizada de base de datos

### 🎵 Características v0.2.2 (Agosto 2025)
- **🎭 Nuevos Tipos de Voz**: Agregados 'Coro' y 'Original' para clasificación completa
- **▶️ Reproducción Robusta**: Botón play reactivado con sistema de fallback múltiple
- **📅 Fechas de Subida**: Reemplazada duración por fecha de subida en gestión
- **🔧 Integridad de Datos**: Sistema automatizado de limpieza y validación de BD
- **🗂️ Gestión Mejorada**: Solo canciones con archivos físicos en base de datos

### 🎵 Características v0.3.0 (Enero 2025)
- **📊 Dashboard Estadístico**: Panel administrativo completo con métricas en tiempo real
- **📈 Gráficos de Torta**: Visualizaciones SVG para distribución de tipos de voz
- **🔄 Cola Corregida**: Sistema "Agregar a cola" funciona correctamente con versiones reproducibles
- **🛠️ API de Dashboard**: Endpoints especializados para estadísticas administrativas
- **✅ Validación de Versiones**: Solo se agregan a la cola canciones con voiceType válido
- **🧪 Herramientas de Testing**: Utilidades para verificar funcionamiento de APIs

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler y dev server
- **Tailwind CSS** para estilos responsivos
- **Zustand** para gestión de estado global
- **React Query (TanStack Query)** para manejo de datos del servidor
- **React Router** para navegación SPA
- **React Hook Form** para formularios
- **React Hot Toast** para notificaciones

### Backend
- **Node.js** con TypeScript
- **Express.js** como framework web
- **Prisma ORM** para base de datos
- **PostgreSQL** como base de datos principal
- **JWT** para autenticación
- **Multer** para subida de archivos
- **Music-metadata** para extracción de metadatos
- **CORS** configurado para desarrollo

### DevOps y Herramientas
- **Concurrently** para ejecutar frontend y backend simultáneamente
- **Nodemon** para desarrollo con hot reload
- **ESLint y Prettier** para calidad de código
- **TypeScript** en todo el stack para type safety

## 📋 Requisitos del Sistema

- **Node.js** 18.0.0 o superior
- **npm** 9.0.0 o superior
- **PostgreSQL** 13.0 o superior
- **Git** para control de versiones

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/CareZapato/CGPlayerWeb.git
cd CGPlayerWeb
```

### 2. Instalar dependencias
```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install

# Volver al directorio raíz
cd ..
```

### 3. Configurar la base de datos

#### Opción A: PostgreSQL local
1. Instalar PostgreSQL en tu sistema
2. Crear una base de datos:
```sql
CREATE DATABASE cgplayerweb;
```

#### Opción B: Docker (recomendado)
```bash
# Ejecutar PostgreSQL en Docker
docker run --name cgplayerweb-postgres \
  -e POSTGRES_PASSWORD=tu_password \
  -e POSTGRES_DB=cgplayerweb \
  -p 5432:5432 \
  -d postgres:13
```

### 4. Configurar variables de entorno

Crear archivo `.env` en la carpeta `backend/`:
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/cgplayerweb"

# JWT
JWT_SECRET="tu_jwt_secret_muy_seguro_aqui"

# Configuración del servidor
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:5173"
```

### 5. Configurar la base de datos
```bash
cd backend
# Generar el cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# (Opcional) Poblar con datos de ejemplo
npx prisma db seed
```

### 6. Ejecutar la aplicación
```bash
# Desde el directorio raíz, ejecutar ambos servidores
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

## 📱 Uso de la Aplicación

### Primer Uso
1. **Registro**: Crear una cuenta de usuario
2. **Login**: Iniciar sesión con las credenciales
3. **Subir música**: Ir a la sección "Canciones" y subir archivos de audio
4. **Reproducir**: Hacer clic en cualquier canción para reproducirla

### Roles de Usuario
- **Admin**: Acceso completo, gestión de usuarios y configuración
- **Director**: Gestión de canciones, playlists y eventos
- **Cantante**: Reproducción de música y acceso a su perfil

### 👥 Usuarios de Prueba (v0.2.2)
Después de ejecutar `npm run db:seed`, puedes usar estas credenciales:

#### 👑 Administrador
- **Email**: admin@cgplayer.com
- **Password**: admin123

#### 🎤 Cantantes (Actualizados v0.2.2)
- **soprano1@coro.com** / cantante123 - María González (Soprano)
- **contralto1@coro.com** / cantante123 - Ana Martínez (Contralto)
- **tenor1@coro.com** / cantante123 - Carlos López (Tenor)
- **baritono1@coro.com** / cantante123 - Luis Rodríguez (Barítono)
- **bajo1@coro.com** / cantante123 - Miguel Fernández (Bajo)

> **📝 Nota v0.2.2**: Todos los usuarios pueden ahora subir archivos con las nuevas clasificaciones 'Coro' y 'Original', además de las 5 voces tradicionales.

## 🔧 Scripts Disponibles

### Proyecto Principal
```bash
npm run dev          # Ejecutar frontend y backend en desarrollo
npm run build        # Construir para producción
npm run start        # Ejecutar en modo producción
npm run lint         # Ejecutar linting
```

### Backend
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm run start        # Ejecutar versión compilada

# 🗄️ Scripts de Base de Datos (NUEVO v0.2.0)
npm run db:reset     # Limpiar base de datos
npm run db:seed      # Sembrar datos de prueba
npm run db:check     # Verificar estado de canciones
npm run db:init      # Inicialización completa (reset + seed)

# 🔧 Scripts de Prisma
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir interfaz visual de BD
```

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de la build
npm run lint         # Linting del código
```

## 📁 Estructura del Proyecto

```
CGPlayerWeb/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── store/          # Estado global (Zustand)
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Utilidades
│   ├── public/             # Archivos estáticos
│   └── package.json
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── routes/         # Rutas de la API
│   │   ├── middleware/     # Middlewares
│   │   ├── utils/          # Utilidades
│   │   └── types/          # Tipos TypeScript
│   ├── prisma/             # Esquemas y migraciones
│   ├── uploads/            # Archivos subidos
│   └── package.json
├── package.json            # Dependencias principales
└── README.md              # Este archivo
```

## 🔄 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Perfil del usuario actual

### Canciones
- `GET /api/songs` - Listar canciones
- `POST /api/songs` - Subir nueva canción
- `GET /api/songs/:id` - Obtener canción específica
- `PUT /api/songs/:id` - Actualizar canción
- `DELETE /api/songs/:id` - Eliminar canción
- `GET /api/songs/file/:folder/:filename` - Streaming de archivo de audio

### Usuarios (Solo Admin)
- `GET /api/users` - Listar usuarios
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

## 🚧 Roadmap

### v0.2.0 (Próxima versión)
- [ ] Sistema de playlists completo
- [ ] Comentarios en canciones
- [ ] Favoritos personales
- [ ] Búsqueda avanzada con filtros

### v0.3.0
- [ ] Modo offline con cache
- [ ] Sincronización entre dispositivos
- [ ] Exportación de playlists
- [ ] Estadísticas de reproducción

### v1.0.0
- [ ] Aplicación móvil React Native
- [ ] Sistema de notificaciones
- [ ] Integración con servicios de almacenamiento en la nube
- [ ] Dashboard analítico completo

## 🤝 Contribuir

1. **Fork** el proyecto
2. **Crear** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

## 📝 Changelog

### [0.1.0] - 2025-08-13

#### ✨ Nuevas Características
- **Sistema de autenticación completo** con JWT y roles de usuario
- **Subida de archivos de audio** con soporte para múltiples formatos
- **Reproductor de audio integrado** con controles avanzados
- **Organización automática** de archivos en carpetas individuales
- **Base de datos PostgreSQL** con Prisma ORM
- **API RESTful completa** para gestión de canciones y usuarios
- **Interfaz responsiva** con Tailwind CSS
- **Sistema de streaming** de audio con HTTP Range requests

#### 🔧 Características Técnicas
- **Frontend React 18** con TypeScript y Vite
- **Backend Node.js** con Express y TypeScript
- **Gestión de estado** con Zustand
- **Queries optimizadas** con React Query
- **Validación de formularios** con React Hook Form
- **Notificaciones** con React Hot Toast

#### 🛠️ Configuración del Proyecto
- **Configuración de desarrollo** con hot reload
- **Scripts automatizados** para desarrollo y producción
- **Linting y formatting** con ESLint y Prettier
- **Dockerización** opcional para base de datos
- **Variables de entorno** configurables

#### 📚 Documentación
- **README completo** con guías de instalación
- **Documentación de API** con ejemplos
- **Estructura del proyecto** documentada
- **Guías de contribución** establecidas

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **CareZapato** - *Desarrollador Principal* - [@CareZapato](https://github.com/CareZapato)

## 🙏 Agradecimientos

- Comunidad de React y Node.js
- Contribuidores de las librerías utilizadas
- Testers y usuarios beta

---

**¿Encontraste un bug o tienes una sugerencia?** ¡Abre un [issue](https://github.com/CareZapato/CGPlayerWeb/issues) y ayúdanos a mejorar!

---

<div align="center">
  
**⭐ Si te gusta este proyecto, ¡dale una estrella! ⭐**

</div>

