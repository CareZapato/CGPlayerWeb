# CGPlayerWeb 🎵

[![Version](https://img.shields.io/badge/version-0.5.0-blue.svg)](https://github.com/CareZapato/CGPlayerWeb/releases/tag/v0.5.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

**CGPlayerWeb** es una aplicación web moderna para la gestión y reproducción de música coral, diseñada específicamente para coros y grupos musicales chilenos. Permite la subida, organización y reproducción de pistas de audio con un sistema avanzado de roles, autenticación y gestión de sedes ubicadas a lo largo de Chile.

## 🚀 Características Principales

### 🎵 Gestión de Música
- **Subida de archivos de audio** (MP3, M4A, WAV, FLAC) con validación robusta
- **Organización automática** en carpetas individuales por canción
- **Sistema de variaciones de voz** - todas las voces son tratadas como iguales
- **Metadatos automáticos** extraídos de archivos de audio
- **Reproductor de audio integrado** con controles avanzados y streaming optimizado
- **Cola de reproducción mejorada** con validación de tipos de voz
- **Sistema de subida robusto** con validación, limpieza automática y manejo de errores

### 👥 Sistema de Usuarios y Roles Jerárquico
- **Autenticación JWT** segura con información extendida (rol, ubicación)
- **Roles jerárquicos**: Admin, Director, Cantante con permisos específicos
- **Filtrado inteligente por sede**: Directores ven solo su sede asignada
- **Gestión de permisos** granular por funcionalidad y ubicación
- **Perfiles de usuario** con asignación automática de roles y voces
- **Dashboard específico por rol** con vistas personalizadas y métricas relevantes
- **Sistema dual para directores**: Pueden ser cantantes simultáneamente

### 📊 Dashboard Analytics Avanzado e Interactivo
- **Métricas en tiempo real** con estadísticas completas del sistema
- **Visualizaciones interactivas**: Gráficos de torta expandidos con porcentajes al hover
- **Cuadros estadísticos coloridos**: UI mejorada con paleta de colores y iconos
- **Filtrado inteligente por rol**: 
  - **Admins**: Ven todas las métricas del sistema completo
  - **Directores**: Solo métricas de su sede con información de cantantes
  - **Cantantes**: Vista apropiada con información relevante
- **API optimizada** con consultas paralelas para mejor rendimiento
- **UI responsive** adaptativa con diseño moderno y profesional

### 🎼 Reproductor Avanzado y Persistente
- **Reproductor flotante** en la parte inferior con diseño moderno
- **Controles completos** (play, pause, seek, volumen) con feedback visual
- **Barra de progreso interactiva** con click-to-seek y visualización de tiempo
- **Navegación automática** entre canciones con transiciones suaves
- **Soporte para streaming** con requests HTTP Range para archivos grandes
- **Audio de alta calidad** sin pérdida de fidelidad
- **Sistema de cola inteligente** que añade correctamente las versiones reproducibles
- **Título dinámico** en pestaña del navegador con canción actual
- **Favicon dinámico** que cambia según el estado de reproducción

### 🏛️ Gestión de Sedes Chilenas
- **6 Sedes principales**: Santiago, Valparaíso, Viña del Mar, Valdivia, Antofagasta, Concepción
- **Distribución específica**: 288 cantantes distribuidos según necesidades regionales
- **Datos localizados**: Nombres, direcciones y teléfonos chilenos auténticos
- **Formato telefónico chileno**: +56 9 XXXX XXXX para todos los usuarios
- **Directores por sede**: Cada sede tiene su director asignado con acceso local

### 🎨 Interfaz de Usuario Moderna
- **Navegación reorganizada**: Logo y título a la izquierda, opciones centradas, perfil a la derecha
- **Paleta de colores**: Diseño colorido y profesional para mejor experiencia visual
- **Iconografía mejorada**: Iconos apropiados y consistentes en toda la aplicación
- **Responsive design**: Optimizado para desktop, tablet y móvil
- **Feedback visual**: Hover effects, transiciones suaves y estados interactivos

### 📱 Experiencia Móvil Optimizada
- **Contraste mejorado** para títulos en dispositivos móviles
- **Soporte touch completo** con TouchSensor para drag & drop
- **Dark mode optimizado** con colores específicos para móvil
- **Interacciones táctiles** con delay y tolerancia configurables
- **Text shadows** para mejor legibilidad en diferentes fondos
- **Responsive design** adaptado para diferentes tamaños de pantalla

### 🏗️ Organización Inteligente
- **Estructura container-children** para variaciones de voz
- **7 tipos de voz completos**: Soprano, Contralto, Tenor, Barítono, Bajo, Coro, Original
- **Todas las voces son iguales** - ninguna se trata como "principal"
- **Carpetas automáticas** con nomenclatura: `nombreCancion_timestamp`
- **Base de datos PostgreSQL** para metadatos y relaciones
- **Validación automática** de integridad entre archivos y BD
- **Sistema de ubicaciones** para organización geográfica

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 19** con TypeScript
- **Vite** como bundler y dev server
- **Tailwind CSS** para estilos responsivos
- **Zustand** para gestión de estado global
- **React Query (TanStack Query)** para manejo de datos del servidor
- **React Router** para navegación SPA
- **React Hook Form** para formularios
- **React Hot Toast** para notificaciones
- **@dnd-kit** para funcionalidad drag & drop

### Backend
- **Node.js** con TypeScript
- **Express.js** como framework web
- **Prisma ORM** para base de datos
- **PostgreSQL** como base de datos principal
- **JWT** para autenticación con roles y ubicaciones
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
# Instalar dependencias de todos los módulos
npm run install:all
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

# Poblar con datos de ejemplo
npx prisma db seed
```

## 🔐 Sistema de Roles y Autenticación

### Tipos de Roles

#### 👑 ADMIN
- **Acceso completo** al sistema
- **Gestión de usuarios**: Crear, editar, eliminar cualquier usuario
- **Dashboard global**: Ve métricas de todo el sistema
- **Gestión de ubicaciones**: Administra todas las ubicaciones
- **Configuración del sistema**: Acceso a configuraciones avanzadas

#### 🎯 DIRECTOR
- **Gestión de ubicación específica**: Solo ve datos de su ubicación asignada
- **Dashboard filtrado**: Métricas limitadas a su ubicación
- **Gestión de cantantes**: Administra cantantes de su ubicación
- **Eventos y actividades**: Gestiona eventos de su ubicación
- **Playlists locales**: Crea y gestiona playlists para su ubicación

#### 🎤 CANTANTE
- **Vista personalizada**: Dashboard específico para cantantes
- **Reproducción de música**: Acceso completo al reproductor
- **Perfil personal**: Gestión de su perfil y preferencias
- **Eventos asignados**: Ve eventos relevantes para su rol

### Filtrado por Ubicación

El sistema implementa un filtrado inteligente basado en ubicaciones:

- **Admins**: Ven todos los datos sin filtros
- **Directores**: Automáticamente filtrados por su `locationId` asignado
- **Cantantes**: Ven contenido apropiado para su ubicación

### JWT y Autenticación

Los tokens JWT incluyen información extendida:
```json
{
  "userId": "uuid",
  "email": "user@example.com", 
  "role": "DIRECTOR",
  "locationId": "location-uuid", // Solo para directores
  "iat": timestamp,
  "exp": timestamp
}
```

## 📊 Dashboard Analytics

### Métricas por Rol

#### Dashboard Admin
- **Usuarios totales** por tipo y ubicación
- **Canciones subidas** con estadísticas de uso
- **Eventos programados** en todas las ubicaciones  
- **Actividad del sistema** en tiempo real
- **Distribución geográfica** de usuarios

#### Dashboard Director
- **Usuarios de su ubicación** con detalles específicos
- **Canciones relevantes** para su ubicación
- **Eventos locales** que gestiona
- **Estadísticas filtradas** por su área de responsabilidad

#### Dashboard Cantante
- **Progreso personal** en reproducción
- **Eventos asignados** próximos
- **Estadísticas de práctica** personales

### 6. Ejecutar la aplicación
```bash
# Desde el directorio raíz, ejecutar ambos servidores
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

## � Manual de Uso

### Primer Uso
1. **Registro**: Crear una cuenta de usuario
2. **Login**: Iniciar sesión con las credenciales
3. **Subir música**: Ir a la sección "Canciones" y subir archivos de audio
4. **Reproducir**: Hacer clic en cualquier canción para reproducirla

### Roles de Usuario
- **Admin**: Acceso completo, gestión de usuarios y configuración
- **Director**: Gestión de canciones, playlists y eventos
- **Cantante**: Reproducción de música y acceso a su perfil

### 👥 Credenciales de Prueba

Después de ejecutar `npx prisma db seed`, puedes usar estas credenciales:

#### 👑 Administrador
- **Email**: admin@cgplayer.com
- **Password**: admin123

#### 🎤 Cantantes
- **soprano1@coro.com** / cantante123 - María González (Soprano)
- **contralto1@coro.com** / cantante123 - Ana Martínez (Contralto)
- **tenor1@coro.com** / cantante123 - Carlos López (Tenor)
- **baritono1@coro.com** / cantante123 - Luis Rodríguez (Barítono)
- **bajo1@coro.com** / cantante123 - Miguel Fernández (Bajo)

### 🎵 Uso del Reproductor
- **Reproducción**: Haz clic en cualquier canción para reproducirla
- **Cola de reproducción**: Arrastra y suelta canciones para reordenar

## 📚 Documentación API

### 🔧 Swagger/OpenAPI
CGPlayerWeb incluye documentación completa de la API usando Swagger UI.

**Acceso Local**: http://localhost:3001/api-docs

#### Características de la API:
- **Autenticación JWT** - La mayoría de endpoints requieren token
- **Documentación interactiva** - Probar endpoints directamente
- **Schemas completos** - Estructura de datos detallada
- **Ejemplos de uso** - Respuestas de ejemplo para cada endpoint

#### Endpoints Principales:
- 🔐 **Authentication** (`/api/auth`) - Registro y login
- 👥 **Users** (`/api/users`) - Gestión de usuarios
- 🎵 **Songs** (`/api/songs`) - Gestión de canciones
- 📊 **Dashboard** (`/api/dashboard`) - Estadísticas del sistema
- 📍 **Locations** (`/api/locations`) - Gestión de ubicaciones
- 🎉 **Events** (`/api/events`) - Gestión de eventos
- ⚙️ **Admin** (`/api/admin`) - Herramientas de administrador

#### Uso de la Documentación:
1. **Explorar**: Navegar por categorías y endpoints
2. **Autenticar**: Usar botón "Authorize" con token JWT
3. **Probar**: Ejecutar requests directamente desde la interfaz
4. **Integrar**: Usar ejemplos para desarrollo

**📖 Guía completa**: Ver [SWAGGER_DOCS.md](SWAGGER_DOCS.md)
- **Controles**: Play/Pause, anterior/siguiente, control de volumen
- **Barra de progreso**: Haz clic para saltar a una posición específica
- **Título dinámico**: El título de la pestaña cambia con la canción actual

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

### Dashboard (Solo Admin)
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/voice-distribution` - Distribución de tipos de voz
- `GET /api/dashboard/recent-activity` - Actividad reciente

## 📝 Historial de Cambios

### [0.4.1] - 2025-08-18

#### 🐛 Correcciones de Errores
- **Error de exportación**: Solucionado el error "does not provide an export named 'default'" en Layout
- **Limpieza de archivos**: Eliminados archivos duplicados y vacíos de Layout
- **Importación corregida**: Actualizada la importación para apuntar a `./Layout/Layout` correctamente
- **Compilación**: Frontend ahora compila sin errores de importación
- **Variables no utilizadas**: Eliminadas variables no utilizadas en AudioManager

### [0.4.0] - 2025-08-17

#### 🎵 Nuevas Características

##### 📱 Experiencia Móvil Mejorada
- **Contraste mejorado**: Títulos de canciones con mejor contraste y legibilidad en dispositivos móviles
- **Soporte para dark mode**: Optimización específica para modo oscuro en móviles
- **Text shadows**: Sombras de texto para mejor legibilidad en diferentes fondos
- **Tipografía responsive**: Font weights y tamaños optimizados para pantallas pequeñas

##### 🎵 Título Dinámico en Pestaña
- **Favicon dinámico**: Actualización automática del favicon basado en la canción actual
- **Título de pestaña**: Muestra "[Título de la canción] - CGPlayer" durante la reproducción
- **Restauración automática**: Vuelve al título por defecto "CGPlayer" cuando se pausa
- **Integración completa**: Sincronizado con el estado del reproductor

##### 🎯 Drag & Drop Móvil Optimizado
- **TouchSensor**: Soporte específico para dispositivos táctiles
- **Activación inteligente**: 250ms de delay y tolerancia de 5px para evitar activación accidental
- **PointerSensor mejorado**: Distancia mínima de 8px antes de iniciar el drag
- **Feedback visual**: Mejor respuesta visual durante el arrastre en móviles

#### � Mejoras Técnicas
- **CSS responsivo**: Media queries específicas para móviles
- **Sensors optimizados**: Configuración avanzada de @dnd-kit para dispositivos táctiles
- **useEffect**: Gestión automática del título de pestaña con dependencias optimizadas
- **Error handling**: Mejor manejo de errores en playlist management

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autor

- **CareZapato** - *Desarrollador Principal* - [@CareZapato](https://github.com/CareZapato)

---

**¿Encontraste un bug o tienes una sugerencia?** ¡Abre un [issue](https://github.com/CareZapato/CGPlayerWeb/issues) y ayúdanos a mejorar!

---

<div align="center">
  
**⭐ Si te gusta este proyecto, ¡dale una estrella! ⭐**

</div>

