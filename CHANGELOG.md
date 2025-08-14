# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [0.2.2] - 2025-08-14

### 🎵 Nuevas Características

#### 🎭 Ampliación del Sistema de Voces
- **Nuevos tipos de voz**: Agregados 'Coro' y 'Original' al enum VoiceType
- **7 clasificaciones completas**: Soprano, Contralto, Tenor, Barítono, Bajo, Coro, Original
- **Migración de BD automática**: Aplicada para soportar los nuevos tipos
- **Frontend actualizado**: Componentes de subida y gestión incluyen las nuevas opciones
- **Etiquetas y colores**: Nuevas visualizaciones para 'Coro' (purple) y 'Original' (gray)

#### ▶️ Reactivación del Sistema de Reproducción
- **Botón play robusto**: Reactivado en sección de gestión con sistema de fallback múltiple
- **Función handlePlayAllVersions**: Implementación robusta con manejo de errores avanzado
- **API + Local fallback**: Si falla la API, reproduce versiones disponibles localmente
- **Integración con colas**: Soporte completo para autoplay y navegación automática
- **Feedback visual mejorado**: Estados de reproducción más claros

#### 📅 Mejora en Visualización de Datos
- **Fechas de subida**: Reemplazada duración por fecha de subida en lista de gestión
- **Formato localizado**: Fechas en español con formato dd/mm/yyyy
- **Información más relevante**: La fecha es más útil que la duración variable entre voces

### 🔧 Mejoras de Integridad y Rendimiento

#### 🗂️ Sistema de Validación de Datos
- **Script de limpieza**: cleanupOrphanedSongs.ts para eliminar entradas sin archivos físicos
- **Script de repoblación**: seedOnlyExistingSongs.ts para crear BD solo con archivos existentes
- **Validación automática**: Verificación de existencia de archivos antes de crear entradas
- **Integridad garantizada**: BD contiene únicamente canciones con archivos reales

#### 🛠️ Refactoring del Sistema de Reproducción
- **Manejo de errores mejorado**: Múltiples capas de fallback para garantizar reproducción
- **Funciones auxiliares**: playLocalVersions() y playVersionsFromAPI() para mayor modularidad
- **Logs detallados**: Mejor debugging y seguimiento de errores
- **Prevención de regresiones**: Mantenimiento de fixes anteriores del reproductor

### 🐛 Correcciones

#### 🔄 Estabilidad del Reproductor
- **Corrección de 404**: Eliminadas canciones órfanas que causaban errores de reproducción
- **Validación de archivos**: Solo se crean entradas de BD para archivos que existen físicamente
- **Mantenimiento de fixes**: Preservados todos los arreglos anteriores del reproductor
- **Consistencia de datos**: BD y sistema de archivos perfectamente sincronizados

### 📊 Datos del Proyecto

#### 🎵 Estado Actual de la BD
- **2 canciones padre**: assadfa, i_will_follow
- **6 versiones totales**: 3 voces por cada canción (CONTRALTO, SOPRANO, TENOR)
- **100% validado**: Todos los archivos de audio verificados como existentes
- **0 entradas órfanas**: BD completamente limpia

### 🚀 Scripts Nuevos y Actualizados

#### 🛠️ Herramientas de Mantenimiento
- `cleanupOrphanedSongs.ts`: Elimina canciones sin archivos físicos
- `seedOnlyExistingSongs.ts`: Repuebla BD solo con archivos existentes
- **Migración automática**: 20250814051504_add_coro_original_voice_types
- **Validación TypeScript**: Todos los scripts compilados sin errores

---

## [0.2.0] - 2025-08-13

### 🎉 Nuevas Características

#### 🎵 Sistema de Playlist Slide-Up
- **Nuevo componente PlaylistPlayer.tsx** con interfaz deslizante desde abajo
- **Animaciones fluidas** para mostrar/ocultar la lista de reproducción
- **Drag & Drop** para reordenar canciones en la cola
- **Controles integrados** del reproductor dentro de la playlist
- **Vista completa** de la cola de reproducción con información detallada

#### ▶️ Botones de Reproducción en Tarjetas
- **Botones visibles** al hacer hover sobre las tarjetas de canciones
- **Menú mejorado** con opción "Reproducir ahora" como primera opción
- **Auto-carga** de variaciones de voz al reproducir una canción
- **Feedback visual** mejorado para interacciones

#### 🗂️ Gestión Mejorada de Canciones
- **Estructura container-children** para variaciones de voz
- **Todas las voces son iguales** - ninguna se trata como "principal"
- **Navegación automática** entre canciones cuando termina la reproducción
- **API mejorada** para obtener variaciones de canciones

### 🔧 Mejoras Técnicas

#### 🎚️ Reproductor Principal
- **Integración completa** con el nuevo sistema de playlist
- **Controles de navegación** (anterior/siguiente) mejorados
- **Barra de progreso interactiva** con mejor UX
- **Manejo de errores** mejorado para archivos de audio

#### 🗄️ Base de Datos y Scripts
- **Scripts automatizados** para gestión de BD (`db:reset`, `db:seed`, `db:check`, `db:init`)
- **Datos de prueba** con usuarios predefinidos
- **Documentación completa** de scripts en `DATABASE_SCRIPTS.md`
- **Validación mejorada** de tipos TypeScript

#### 🎨 Interfaz de Usuario
- **Animaciones suaves** en todas las transiciones
- **Z-index apropiado** para modales y overlays
- **Responsividad mejorada** en todos los componentes
- **Feedback visual** consistente en toda la aplicación

### 🐛 Correcciones

#### 🔨 Errores de TypeScript
- **Corregidos errores** de tipos `null` no asignables en `songs.ts`
- **Tipificación explícita** en scripts de verificación
- **Manejo seguro** de valores opcionales y nulos

#### 🧹 Limpieza del Código
- **Eliminados archivos duplicados** (`SingerDashboardFixed.tsx`)
- **Imports optimizados** - removidas dependencias no utilizadas
- **Variables no utilizadas** eliminadas para compilación limpia

#### 🗂️ Estructura de Archivos
- **Carpetas de uploads** limpiadas
- **Archivos temporales** eliminados
- **Estructura consistente** en todo el proyecto

### 🚀 Configuración y Despliegue

#### 📦 Scripts NPM Nuevos
```bash
npm run db:reset    # Limpiar base de datos
npm run db:seed     # Sembrar datos de prueba  
npm run db:check    # Verificar estado de canciones
npm run db:init     # Inicialización completa (reset + seed)
```

#### 👥 Usuarios de Prueba
- **Administrador**: admin@cgplayer.com / admin123
- **Cantantes**: soprano1@coro.com, contralto1@coro.com, etc. / cantante123

### 📚 Documentación

#### 📋 Archivos Nuevos
- `DATABASE_SCRIPTS.md` - Guía completa de scripts de BD
- `CHANGELOG.md` - Documentación de cambios (este archivo)
- README actualizado con nuevas características

#### 🎯 Instrucciones de Uso
- **Guías paso a paso** para inicialización
- **Credenciales de acceso** documentadas
- **Solución de problemas** comunes incluida

---

## [0.1.0] - 2025-08-12

### 🎉 Lanzamiento Inicial
- **Sistema básico de reproducción** de audio
- **Gestión de usuarios** con roles (Admin, Singer, Director)
- **Upload de canciones** con múltiples formatos
- **Interfaz responsive** con React + TypeScript
- **Backend API** con Node.js + Express + Prisma
- **Base de datos PostgreSQL** con esquemas completos
- **Autenticación JWT** para seguridad
- **Sistema de variaciones de voz** (Soprano, Contralto, Tenor, Barítono, Bajo)

---

## Tipos de Cambios

- `🎉 Nuevas Características` - para nuevas funcionalidades
- `🔧 Mejoras` - para cambios en funcionalidades existentes
- `🐛 Correcciones` - para corrección de bugs
- `🚀 Configuración` - para cambios en configuración/despliegue
- `📚 Documentación` - para cambios solo en documentación
- `🔒 Seguridad` - para vulnerabilidades de seguridad
