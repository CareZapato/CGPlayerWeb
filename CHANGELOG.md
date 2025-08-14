# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

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
