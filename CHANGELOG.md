# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [0.6.0] - 2025-08-19

### 🎵 **SOLUCIÓN CRÍTICA: Reproductor de Audio Funcional**

#### 🐛 **Problema Crítico Resuelto**
- **Reproductor no funcional**: Solucionado error 401 que impedía la reproducción de audio
- **Elementos HTML5 audio**: Ahora compatibles con sistema de autenticación
- **Streaming de archivos**: Funcionamiento completo restaurado

#### 🔧 **Implementación Técnica**
**Backend:**
- **Autenticación dual**: Middleware actualizado para aceptar tokens via query parameters
- **Rutas /file/ mejoradas**: Compatibilidad con elementos `<audio>` nativos
- **Logging detallado**: Mejor debugging para troubleshooting de autenticación

**Frontend:**
- **Función centralizada getSongFileUrl()**: Construcción uniforme de URLs con tokens
- **SongsPage.tsx**: Eliminada construcción manual de URLs en funciones de reproducción
- **SongCard.tsx**: Implementada autenticación para reproductor de tarjetas
- **SimplePlayer.tsx**: Corregido manejo de errores y navegación con URLs autenticadas
- **BottomPlayer.tsx**: Actualizada función buildSongUrl() para incluir tokens JWT
- **useMediaSession.ts**: Soporte para Media Session API con autenticación

#### ✅ **Resultado**
- **🎧 Reproductor 100% funcional**: Audio se reproduce sin errores
- **🔒 Seguridad mantenida**: Archivos protegidos con autenticación JWT
- **📱 Compatibilidad total**: Funciona en localhost y acceso remoto por red
- **🎵 Filtrado preservado**: Sistema de permisos por tipos de voz intacto

### 🧪 **Testing y Validación**
- **Base de datos poblada**: 313 usuarios en 5 ciudades chilenas
- **Pruebas completas**: Login, upload, listado, reproducción individual y por versiones
- **Verificación de roles**: ADMIN, DIRECTOR, CANTANTE con permisos apropiados
- **Acceso multi-dispositivo**: Confirmado funcionamiento desde red local

---

## [0.5.0] - 2025-08-18

### 🏗️ Arquitectura y Refactorización Major

#### 🔐 Sistema de Roles y Autenticación Robusto
- **Roles jerárquicos**: Implementación completa de ADMIN, DIRECTOR, CANTANTE con permisos específicos
- **Filtrado por sede**: Los directores solo ven datos de su sede asignada
- **Dashboard específico por rol**: Cada tipo de usuario tiene vistas personalizadas
- **Middleware de autorización**: Protección de rutas basada en roles y ubicación
- **JWT con información extendida**: Tokens incluyen rol y locationId para directores
- **Sistema dual para directores**: Pueden ser cantantes simultáneamente

#### 📊 Dashboard Analytics Avanzado e Interactivo
- **Métricas en tiempo real**: Estadísticas de usuarios, canciones, eventos y sedes
- **Gráfico de torta expandido**: Doble de tamaño con porcentajes al hacer hover
- **Cuadros estadísticos coloridos**: Paleta de colores profesional y iconos apropiados
- **Icono de persona**: Para usuarios activos con diseño moderno
- **Cambio de "Ubicaciones" a "Sedes"**: Terminología más apropiada para el contexto chileno
- **Filtrado inteligente**: Admins ven todo, directores filtrado por sede
- **API optimizada**: Consultas paralelas para mejor rendimiento
- **UI responsive**: Interfaz adaptativa para diferentes tipos de datos

#### 🎨 Interfaz de Usuario Moderna y Reorganizada
- **Navegación desktop reorganizada**: 
  - Logo y título alineados a la izquierda
  - Opciones de menú centradas
  - Changelog, usuario y logout alineados a la derecha
- **Icono de changelog mejorado**: Reemplazado QuestionMarkCircle por DocumentText
- **Paleta de colores aplicada**: Fondos coloridos para cuadros estadísticos
- **Diseño más vibrante**: Eliminación del aspecto pálido anterior

#### 🗂️ Gestión de Archivos Mejorada
- **Sistema de subida robusto**: Manejo mejorado de archivos múltiples
- **Validación de archivos**: Verificación de tipos y tamaños antes de la subida
- **Limpieza automática**: Eliminación de archivos temporales en caso de error
- **Organización**: Estructura de carpetas por canción con nombres únicos

### 🇨🇱 Localización Completa a Chile

#### 🏛️ Datos Chilenos Auténticos
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

#### 🔧 Script de Migración Chilena
- **reset-chilean-db.ts**: Script completo para poblar la base de datos
- **Roles duales**: Directores que también son cantantes con tipos de voz asignados
- **Distribución automática**: Asignación inteligente de voces (Soprano, Alto, Tenor, Bajo)
- **Datos de prueba**: Usuarios inactivos para testing completo

### 🧹 Limpieza Masiva de Código

#### 📁 Eliminación de Archivos Obsoletos
- **Scripts de test**: Eliminados todos los archivos test-*.html y test-*.ts
- **Versiones antiguas**: Removidos archivos *_old.ts, *Fixed.ts no utilizados
- **Seeders duplicados**: Limpieza de basicSeed, enhancedSeed, newSystemSeed, simpleSeed
- **Archivos de migración**: Eliminados migrate-system.bat/sh ya obsoletos
- **Backups obsoletos**: Removido database_backup.sql y scripts de diagnóstico
- **Dist compilado**: Limpieza de carpetas de compilación no versionadas

#### 🔧 Optimización de Estructura
- **Rutas consolidadas**: Unificación en authNew.ts, songsImproved.ts, uploadImproved.ts
- **Middleware optimizado**: Consolidación de middleware de autenticación
- **Scripts útiles**: Mantenidos solo los scripts necesarios para el sistema
- **Organización**: Estructura más limpia y mantenible

### 🛠️ Correcciones Técnicas Importantes

#### 🔍 Resolución de Errores de Compilación
- **Error TypeScript resuelto**: Eliminadas referencias a módulo inexistente './scripts/auto-init'
- **Imports corregidos**: Añadido import correcto de prisma en index.ts
- **Módulos no existentes**: Limpieza de todas las referencias a archivos eliminados
- **Compilación limpia**: Servidor inicia sin errores TypeScript

#### 🗄️ Base de Datos Optimizada
- **Conexión robusta**: Verificación automática de estado en startup
- **Prisma optimizado**: Queries paralelas para mejor rendimiento
- **Limpieza de datos**: Eliminación de registros de prueba obsoletos
- **Respaldo automático**: Sistema de backup antes de migraciones

#### 🔒 Seguridad Mejorada
- **Validación de sesiones**: Filtrado correcto por rol y ubicación
- **Protección de rutas**: Middleware actualizado para nuevos roles
- **Sanitización**: Limpieza de datos de entrada mejorada
- **Logs de seguridad**: Registro de accesos y operaciones críticas
- **TypeScript strict**: Corrección de todos los errores de tipos
- **Exports/Imports**: Arreglo de problemas de módulos ES6
- **Dependencies**: Actualización y limpieza de dependencias
- **Module resolution**: Corrección de paths y resolución de módulos

#### 🚀 Performance y Estabilidad
- **Queries optimizadas**: Consultas de base de datos más eficientes
- **Error handling**: Manejo robusto de errores en toda la aplicación
- **Memory leaks**: Prevención de pérdidas de memoria
- **Hot reload**: Mejor experiencia de desarrollo

### 🔐 Seguridad y Autenticación

#### 🛡️ Mejoras de Seguridad
- **Validación de roles**: Verificación estricta de permisos
- **Protección de rutas**: Middleware de autorización mejorado
- **Token validation**: Validación robusta de JWT
- **Input sanitization**: Sanitización de inputs del usuario

## [0.4.1] - 2025-08-18

### 🐛 Correcciones de Errores

#### 🔧 Corrección de Importación de Layout
- **Error de exportación**: Solucionado el error "does not provide an export named 'default'" en Layout
- **Limpieza de archivos**: Eliminados archivos duplicados y vacíos de Layout
- **Importación corregida**: Actualizada la importación para apuntar a `./Layout/Layout` correctamente
- **Compilación**: Frontend ahora compila sin errores de importación

#### 🧹 Limpieza de Código
- **Variables no utilizadas**: Eliminadas variables no utilizadas en AudioManager
- **Optimización**: Código más limpio y eficiente

## [0.4.0] - 2025-08-17

### 🎵 Nuevas Características

#### 📱 Experiencia Móvil Mejorada
- **Contraste mejorado**: Títulos de canciones con mejor contraste y legibilidad en dispositivos móviles
- **Soporte para dark mode**: Optimización específica para modo oscuro en móviles
- **Text shadows**: Sombras de texto para mejor legibilidad en diferentes fondos
- **Tipografía responsive**: Font weights y tamaños optimizados para pantallas pequeñas

#### 🎵 Título Dinámico en Pestaña
- **Favicon dinámico**: Actualización automática del favicon basado en la canción actual
- **Título de pestaña**: Muestra "[Título de la canción] - CGPlayer" durante la reproducción
- **Restauración automática**: Vuelve al título por defecto "CGPlayer" cuando se pausa
- **Integración completa**: Sincronizado con el estado del reproductor

#### 🎯 Drag & Drop Móvil Optimizado
- **TouchSensor**: Soporte específico para dispositivos táctiles
- **Activación inteligente**: 250ms de delay y tolerancia de 5px para evitar activación accidental
- **PointerSensor mejorado**: Distancia mínima de 8px antes de iniciar el drag
- **Feedback visual**: Mejor respuesta visual durante el arrastre en móviles

### 🔧 Mejoras Técnicas

#### 📱 Frontend Mobile-First
- **Touch actions**: Configuración `touch-action: none` para mejor soporte táctil
- **User experience**: Manejo optimizado de interacciones táctiles
- **CSS responsivo**: Media queries específicas para móviles y tablets
- **Performance**: Sensores de drag & drop optimizados para diferentes dispositivos

#### 🎨 Interfaz de Usuario
- **Contraste dinámico**: Colores adaptativos según el tema del sistema
- **Estilos específicos**: Diferentes configuraciones para light/dark mode en móvil
- **Accessibility**: Mejor experiencia para usuarios con diferentes necesidades
- **Visual feedback**: Indicadores mejorados durante interacciones de drag & drop

### 🐛 Correcciones

#### 📱 Dispositivos Móviles
- **Drag & drop funcional**: Corregido el problema donde no funcionaba en dispositivos táctiles
- **Contraste insuficiente**: Solucionado el problema de legibilidad de títulos en móvil
- **Touch responsiveness**: Mejor respuesta a gestos táctiles en la playlist
- **Configuración de sensores**: Optimización para diferentes tipos de input (touch, pointer, keyboard)

#### 🔧 Reproducción
- **Estado de pestaña**: Sincronización correcta del título de pestaña con el estado de reproducción
- **Memory leaks**: Prevención de fugas de memoria en useEffect del título
- **Performance**: Optimización de actualizaciones del DOM para favicon y título

## [0.3.0] - 2025-01-02

### 🎵 Nuevas Características

#### 📊 Panel de Administración Mejorado
- **Dashboard estadístico**: Nuevo panel con métricas completas del sistema
- **Visualizaciones de datos**: Gráficos de torta para distribución de tipos de voz
- **API de estadísticas**: Endpoint centralizado `/api/dashboard/stats` para datos administrativos
- **Interfaz renovada**: Dashboard más intuitivo con tarjetas informativas y gráficos

#### 🎛️ Funcionalidad de Cola Corregida
- **Sistema de cola reparado**: Función "Agregar a cola" ahora añade correctamente las versiones reproducibles
- **Validación de tipos de voz**: Solo se agregan a la cola canciones con voiceType válido
- **Corrección en SongCard**: Tarjetas de canciones obtienen versiones reales via API
- **Mejor manejo de errores**: Validación robusta antes de añadir elementos a la cola

#### 🛠️ Herramientas de Desarrollo
- **Utilidad de pruebas**: test-dashboard-api.html para verificación de endpoints del dashboard
- **Validación de APIs**: Herramientas para testing manual de funcionalidades estadísticas

### 🔧 Mejoras Técnicas

#### 🗄️ Backend
- **Nuevas rutas de dashboard**: Endpoints especializados para estadísticas administrativas
- **Agregación de datos**: Consultas optimizadas para métricas de usuarios, canciones y eventos
- **Autenticación mejorada**: Validación de roles ADMIN para acceso a estadísticas
- **Paralelización de consultas**: Mejor rendimiento en obtención de datos

#### 🎨 Frontend
- **Dashboard responsive**: Interfaz adaptativa para diferentes tamaños de pantalla
- **Gráficos SVG**: Implementación de charts usando CSS y SVG nativo
- **Estados de carga**: Mejor feedback visual durante la obtención de datos
- **Manejo de errores**: Visualización clara de errores en el dashboard

### 🐛 Correcciones

#### 🔄 Sistema de Reproducción
- **Cola funcional**: Corregido el problema donde se agregaban contenedores padre en lugar de canciones reproducibles
- **Validación de versiones**: Solo se procesan canciones con datos de voz válidos
- **API de versiones**: Endpoint `/songs/:id/versions` funciona correctamente
- **Consistencia de datos**: Sincronización entre diferentes componentes de la aplicación

#### 📈 Panel Administrativo
- **Carga de usuarios**: Corregido problema donde no se mostraban las estadísticas de usuarios
- **Gráficos de torta**: Implementados correctamente los gráficos circulares
- **Datos en tiempo real**: Dashboard actualiza información dinámicamente

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
