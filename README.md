# CGPlayerWeb 🎵

[![Version](https://img.shields.io/badge/version-0.7.0-blue.svg)](https://github.com/CareZapato/CGPlayerWeb/releases/tag/v0.7.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

**CGPlayerWeb** es una aplicación web moderna para la gestión y reproducción de música coral, diseñada específicamente para coros y grupos musicales chilenos. Permite la subida, organización y reproducción de pistas de audio con un sistema avanzado de roles, autenticación, gestión de sedes y **sistema completo de playlists** ubicadas a lo largo de Chile.

## 🚀 Características Principales

### 🎼 **Sistema de Playlists Completo** *(NUEVO en v0.7.0)*
- **Creación y gestión completa** de playlists con metadatos personalizados
- **Editor avanzado** con búsqueda en tiempo real y gestión individual de canciones
- **Imágenes personalizadas** con soporte para subida de imágenes (.png, .jpg, .jpeg)
- **Reproducción automática** - Al dar play reproduce inmediatamente la primera canción
- **Playlists públicas y privadas** con sistema de permisos por usuario
- **Interfaz cuadrada moderna** con grid responsivo optimizado
- **Integración total** con el sistema de cola y reproductor existente
- **Gestión completa** - Editar, eliminar, cambiar configuraciones desde la interfaz

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
- **Autenticación de archivos de audio** via query parameters para compatibilidad con HTML5 audio
- **Streaming seguro** con tokens JWT para proteger contenido multimedia
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

## 🎼 Sistema de Playlists Detallado *(v0.7.0)*

### 📝 **Creación y Gestión**
- **Editor completo**: Interfaz intuitiva para crear playlists con todos los metadatos
- **Metadatos personalizables**: Nombre, descripción, visibilidad (pública/privada)
- **Imágenes personalizadas**: Subida de imágenes con preview y validación automática
- **Gestión de contenido**: Agregar/quitar canciones con búsqueda en tiempo real
- **Permisos granulares**: Control de visibilidad y acceso por usuario

### 🎯 **Reproducción Avanzada**
- **Play inmediato**: Al presionar play, reproduce automáticamente la primera canción
- **Integración con cola**: Funciona perfectamente con el sistema de cola existente
- **Navegación automática**: Transición fluida entre canciones de la playlist
- **Autenticación transparente**: URLs seguras con tokens JWT para audio protegido
- **Compatibilidad total**: Misma experiencia que reproducción individual

### 🎨 **Interfaz Moderna**
- **Diseño cuadrado**: Formato square optimizado para mejor aprovechamiento visual
- **Grid responsivo**: Adaptación automática según tamaño de pantalla
  - `sm: 2 columnas | lg: 3 columnas | xl: 4 columnas | 2xl: 5 columnas`
- **Imágenes centradas**: Visualización óptima con `object-cover object-center`
- **UI compacta**: Elementos más densos para mostrar más información
- **Gradientes elegantes**: Fallback visual cuando no hay imagen personalizada

### 🔍 **Editor Avanzado**
- **Búsqueda en tiempo real**: Filtro instantáneo con debounce optimizado (200ms)
- **Vista dual**: Lista de canciones disponibles vs canciones en playlist
- **Gestión individual**: Remover canciones específicas con confirmación
- **Controles completos**: Editar nombre, descripción, imagen, eliminar playlist
- **Validación robusta**: Verificación de permisos y existencia de archivos

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

Después de ejecutar el script de población chileno (`npm run reset:chilean-db` o el seed), puedes usar estas credenciales:

#### 👑 Administrador
- **Email**: admin@cgplayer.com
- **Password**: admin123
- **Nombre**: Administrador Sistema

#### � Directores (Sistema Dual: Director + Cantante)
- **director1@cgplayer.com** / admin123 - Carlos González (Tenor) - Santiago
- **director2@cgplayer.com** / admin123 - María Rodríguez (Barítono) - Valparaíso  
- **director3@cgplayer.com** / admin123 - Pedro Martínez (Soprano) - Viña del Mar
- **director4@cgplayer.com** / admin123 - Ana Silva (Mezzo-soprano) - Valdivia
- **director5@cgplayer.com** / admin123 - José Muñoz (Bajo) - Antofagasta
- **director6@cgplayer.com** / admin123 - Carmen Torres (Contralto) - Concepción

#### 🎤 Cantantes Ejemplo
- **cantante1@cgplayer.com** / admin123 - Cantante de Santiago
- **cantante50@cgplayer.com** / admin123 - Cantante de Valparaíso
- **cantante100@cgplayer.com** / admin123 - Cantante de Viña del Mar
- **cantante200@cgplayer.com** / admin123 - Cantante de Antofagasta

> **Nota**: El sistema cuenta con 345 usuarios totales: 1 admin + 6 directores + 288 cantantes activos + 50 usuarios inactivos distribuidos en 6 sedes chilenas.

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

### [0.5.0] - 2025-08-18

#### 🏗️ Arquitectura y Refactorización Major

##### 🔐 Sistema de Roles y Autenticación Robusto
- **Roles jerárquicos**: Implementación completa de ADMIN, DIRECTOR, CANTANTE con permisos específicos
- **Filtrado por sede**: Los directores solo ven datos de su sede asignada
- **Dashboard específico por rol**: Cada tipo de usuario tiene vistas personalizadas
- **Middleware de autorización**: Protección de rutas basada en roles y ubicación
- **JWT con información extendida**: Tokens incluyen rol y locationId para directores
- **Sistema dual para directores**: Pueden ser cantantes simultáneamente

##### 📊 Dashboard Analytics Avanzado e Interactivo
- **Métricas en tiempo real**: Estadísticas de usuarios, canciones, eventos y sedes
- **Gráfico de torta expandido**: Doble de tamaño con porcentajes al hacer hover
- **Cuadros estadísticos coloridos**: Paleta de colores profesional y iconos apropiados
- **Icono de persona**: Para usuarios activos con diseño moderno
- **Cambio de "Ubicaciones" a "Sedes"**: Terminología más apropiada para el contexto chileno
- **Filtrado inteligente**: Admins ven todo, directores filtrado por sede
- **API optimizada**: Consultas paralelas para mejor rendimiento
- **UI responsive**: Interfaz adaptativa para diferentes tipos de datos

##### 🎨 Interfaz de Usuario Moderna y Reorganizada
- **Navegación desktop reorganizada**: 
  - Logo y título alineados a la izquierda
  - Opciones de menú centradas
  - Changelog, usuario y logout alineados a la derecha
- **Icono de changelog mejorado**: Reemplazado QuestionMarkCircle por DocumentText
- **Paleta de colores aplicada**: Fondos coloridos para cuadros estadísticos
- **Diseño más vibrante**: Eliminación del aspecto pálido anterior

##### 🗂️ Gestión de Archivos Mejorada
- **Sistema de subida robusto**: Manejo mejorado de archivos múltiples
- **Validación de archivos**: Verificación de tipos y tamaños antes de la subida
- **Limpieza automática**: Eliminación de archivos temporales en caso de error
- **Organización**: Estructura de carpetas por canción con nombres únicos

#### 🇨🇱 Localización Completa a Chile

##### 🏛️ Datos Chilenos Auténticos
- **6 Sedes principales**: Santiago, Valparaíso, Viña del Mar, Valdivia, Antofagasta, Concepción
- **Distribución específica de 288 cantantes**:
  - Santiago: 110 cantantes
  - Valparaíso: 45 cantantes
  - Viña del Mar: 38 cantantes
  - Valdivia: 35 cantantes
  - Antofagasta: 50 cantantes
  - Concepción: 60 cantantes
- **Total de usuarios**: 345 (1 admin + 6 directores + 288 cantantes + 50 inactivos)
- **Nombres chilenos**: Base de datos con nombres y apellidos locales
- **Direcciones reales**: Ubicaciones auténticas de cada ciudad
- **Teléfonos chilenos**: Formato +56 9 XXXX XXXX para todos los usuarios

##### 🔧 Script de Migración Chilena
- **reset-chilean-db.ts**: Script completo para poblar la base de datos
- **Roles duales**: Directores que también son cantantes con tipos de voz asignados
- **Distribución automática**: Asignación inteligente de voces (Soprano, Alto, Tenor, Bajo)
- **Datos de prueba**: Usuarios inactivos para testing completo

#### 🧹 Limpieza Masiva de Código

##### 📁 Eliminación de Archivos Obsoletos
- **Scripts de test**: Eliminados todos los archivos test-*.html y test-*.ts
- **Versiones antiguas**: Removidos archivos *_old.ts, *Fixed.ts no utilizados
- **Seeders duplicados**: Limpieza de basicSeed, enhancedSeed, newSystemSeed, simpleSeed
- **Archivos de migración**: Eliminados migrate-system.bat/sh ya obsoletos
- **Backups obsoletos**: Removido database_backup.sql y scripts de diagnóstico
- **Dist compilado**: Limpieza de carpetas de compilación no versionadas

##### 🔧 Optimización de Estructura
- **Rutas consolidadas**: Unificación en authNew.ts, songsImproved.ts, uploadImproved.ts
- **Middleware optimizado**: Consolidación de middleware de autenticación
- **Scripts útiles**: Mantenidos solo los scripts necesarios para el sistema
- **Organización**: Estructura más limpia y mantenible

#### 🛠️ Correcciones Técnicas Importantes

##### 🔍 Resolución de Errores de Compilación
- **Error TypeScript resuelto**: Eliminadas referencias a módulo inexistente './scripts/auto-init'
- **Imports corregidos**: Añadido import correcto de prisma en index.ts
- **Módulos no existentes**: Limpieza de todas las referencias a archivos eliminados
- **Compilación limpia**: Servidor inicia sin errores TypeScript

##### 🗄️ Base de Datos Optimizada
- **Conexión robusta**: Verificación automática de estado en startup
- **Prisma optimizado**: Queries paralelas para mejor rendimiento
- **Limpieza de datos**: Eliminación de registros de prueba obsoletos
- **Respaldo automático**: Sistema de backup antes de migraciones

##### 🔒 Seguridad Mejorada
- **Validación de sesiones**: Filtrado correcto por rol y ubicación
- **Protección de rutas**: Middleware actualizado para nuevos roles
- **Sanitización**: Limpieza de datos de entrada mejorada
- **Logs de seguridad**: Registro de accesos y operaciones críticas
- **TypeScript strict**: Corrección de todos los errores de tipos
- **Exports/Imports**: Arreglo de problemas de módulos ES6
- **Dependencies**: Actualización y limpieza de dependencias
- **Module resolution**: Corrección de paths y resolución de módulos

##### 🚀 Performance y Estabilidad
- **Queries optimizadas**: Consultas de base de datos más eficientes
- **Error handling**: Manejo robusto de errores en toda la aplicación
- **Memory leaks**: Prevención de pérdidas de memoria
- **Hot reload**: Mejor experiencia de desarrollo

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

