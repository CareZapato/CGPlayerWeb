# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [0.10.24] - 2025-01-16

### 🎨 **MEJORAS VISUALES DEL REPRODUCTOR**

#### 📱 **StickyPlayer Móvil Optimizado**
- **Tamaño aumentado 10%**: Reproductor sticky en versión móvil clara ampliado para mejor usabilidad
- **Botones más grandes**: Controles de reproducción (play, pause, siguiente, anterior) redimensionados
- **Mejor organización**: Elementos distribuidos de forma más eficiente en el espacio disponible
- **Responsive mejorado**: Mantiene proporciones correctas en diferentes tamaños de pantalla

#### ✨ **Sistema de Animaciones de Texto**
- **Marquee universal**: Efecto de barrido aplicado a TODOS los títulos de canciones
- **Animación inteligente**: Funciona tanto en títulos largos como cortos
- **Detección automática**: Sistema que identifica cuándo aplicar el efecto de desplazamiento
- **Experiencia consistente**: Implementado en todas las versiones (PC web, móvil claro/oscuro)

#### 🔄 **Reproductor Minimizado Interactivo**
- **Función de arrastre**: Esfera del reproductor minimizado completamente arrastrable
- **Interacción táctil corregida**: Solucionado problema de expansión por toque en móviles
- **Límites inteligentes**: Reproductor se mantiene dentro de los límites visibles
- **Eventos touch optimizados**: Mejor manejo de preventDefault() para evitar conflictos

### 🔧 **Correcciones Técnicas**
- **Touch events mejorados**: Distinción precisa entre toque simple y arrastre
- **Posicionamiento responsive**: Tamaños adaptativos (4rem desktop, 3.5rem móvil)
- **Boundary calculations**: Cálculos precisos para mantener elementos en viewport
- **Event propagation**: Control mejorado de propagación de eventos para mejor UX

### 📋 **Detalles de Implementación**
- **MinimizedPlayer.tsx**: Refactorización completa de eventos touch/mouse
- **StickyPlayer.css**: Nueva media query específica para mejoras visuales móviles
- **Marquee universal**: Sistema de detección y aplicación automática de animaciones
- **Estado de arrastre**: Gestión precisa de estados isDragging, hasMoved, position

## [0.10.19] - 2025-01-15

### 🔧 **CORRECCIÓN SISTEMA DE POSTULACIONES A EVENTOS**

#### 🎯 **Event Participation Fix**
- **Corrección crítica**: Botón "Solicitar participación" ahora aparece correctamente en eventos públicos abiertos a postulaciones
- **Footer del modal**: Footer de eventos se muestra correctamente cuando `allowExternalJoin` es true
- **Condición de renderizado**: Corregida la lógica que impedía mostrar opciones de postulación
- **Sistema completo**: Confirmación de asistencia y reenvío de solicitudes rechazadas completamente funcional

#### 🌐 **Configuración de IP Centralizada Backend**  
- **IPs hardcoded eliminadas**: Removidas todas las referencias a IP fija (192.168.1.10) en rutas de perfil
- **Función getServerIP()**: Implementación robusta con múltiples fallbacks para detección de IP
- **Carga automática**: Backend ahora carga automáticamente el archivo `ip-config.env` del proyecto
- **URLs dinámicas**: Generación dinámica de URLs de imágenes de perfil con IP configurada

#### ✨ **Mejoras en Configuración de Red**
- **Fallbacks inteligentes**: SERVER_IP → IP_ADDRESS → API_HOST → detección automática → localhost
- **Flexibilidad mejorada**: Mayor adaptabilidad a diferentes configuraciones de red
- **Logging mejorado**: Mejor trazabilidad en generación de URLs y configuración de IP
- **Integración completa**: Sincronización perfecta con sistema centralizado de configuración de IP

### 🐛 **Correcciones Específicas**
- **Modal de eventos**: Footer ahora se renderiza para eventos con postulaciones habilitadas
- **Botón de postulación**: Visible y funcional para usuarios sin solicitudes previas
- **Backend profile routes**: URLs de imágenes generadas dinámicamente sin IPs hardcoded
- **IP configuration**: Carga correcta del archivo de configuración centralizada

## [0.10.9] - 2024-12-22

### 🎯 **SISTEMA DE DISTRIBUCIÓN DE VOCES MEJORADO**

#### 🎵 **Sistema de Voces Primarias Completo**
- **Distribución específica**: 100% de usuarios con voz primaria (SOPRANO/CONTRALTO/TENOR) + 30% con voz secundaria (BAJO/BARITONO/MESOSOPRANO)
- **Campo isPrimary**: Implementación completa del campo `isPrimary` en `UserVoiceProfile` para identificar la voz principal
- **Ordenamiento automático**: Sistema que prioriza automáticamente la voz primaria en todas las consultas y visualizaciones
- **Validación de distribución**: Endpoint de estadísticas para monitorear el cumplimiento de los requerimientos de distribución

#### 🔧 **Mejoras en Autenticación y Gestión de Usuarios**
- **Endpoints actualizados**: Login y `/me` incluyen información de voz primaria con ordenamiento correcto
- **Gestión de perfiles**: Soporte completo para voces primarias y secundarias en gestión de usuarios
- **Visualización mejorada**: Corrección de visualización de voz primaria en homepage y perfil de usuario
- **Type safety**: Solución con type casting para compatibilidad con cliente Prisma y campo `isPrimary`

#### 🗄️ **Robustez en Base de Datos**
- **Inicialización mejorada**: Estrategia de inicialización con `db push` primero y fallbacks robustos
- **Middleware actualizado**: Mejor manejo de errores cuando la base de datos no está disponible
- **Migración limpia**: Sistema de migración que maneja correctamente los estados de la base de datos
- **Estadísticas de voces**: Endpoint para monitoreo y validación de cumplimiento de distribución

### ✨ **Correcciones y Optimizaciones**
- **Archivos duplicados**: Eliminación de `admin_new.ts`, manteniendo solo `admin.ts` correcto con funcionalidad completa
- **Errores TypeScript**: Resolución completa de errores de compilación relacionados con `isPrimary`
- **Bug de visualización**: Corrección de visualización de voz primaria en homepage y componentes de usuario
- **Inicialización**: Corrección de bugs en inicialización de base de datos y middleware de autenticación

## [1.10.8] - 2024-12-22

### 🎯 **SISTEMA COMPLETO DE GESTIÓN DE EVENTOS**

#### 🎉 **Gestión de Eventos Avanzada**
- **CRUD completo**: Creación, edición, eliminación y listado de eventos con API robusta
- **Modal unificado**: Interfaz única para creación y edición de eventos con validación completa
- **Estados de aprobación**: Sistema de estados (pendiente, aprobado, rechazado) con gestión de permisos
- **Participantes**: Sistema completo para asignación y gestión de cantantes en eventos

#### 🎵 **Sincronización Musical**
- **Variaciones inteligentes**: Sistema automático para detección y sincronización de variaciones de canciones
- **Gestión de música**: Integración perfecta entre eventos y catálogo musical
- **Validación robusta**: Sistema de validación para datos de eventos y relaciones musicales

### 🔧 **Backend Optimizado**
- **API RESTful**: Endpoints completos para gestión de eventos con documentación
- **Performance**: Optimizaciones en consultas de base de datos para eventos y participantes
- **Seguridad**: Validación de permisos y autorización por rol en operaciones de eventos

## [0.10.7] - 2024-12-22

### 🔄 **SISTEMA DE BACKUP Y MANTENIMIENTO**

#### 💾 **Backup Completo**
- **Respaldo automático**: Sistema completo de backup de base de datos y archivos
- **Scripts de limpieza**: Herramientas automatizadas para limpieza de logs y archivos temporales
- **Recuperación**: Procesos documentados para restauración de respaldos

#### 🗂️ **Gestión de Archivos**
- **Organización mejorada**: Sistema optimizado para subida y organización de archivos de audio
- **Limpieza automática**: Scripts para eliminación de archivos temporales y logs antiguos
- **Validación**: Mejoras en validación de archivos de audio y metadatos

### ⚡ **Performance y Estabilidad**
- **Optimización de consultas**: Mejoras significativas en performance de base de datos
- **Manejo de errores**: Sistema robusto de manejo de errores en toda la aplicación
- **Logging mejorado**: Sistema de logs más detallado para debugging y monitoreo

## [0.10.6] - 2024-12-21

### 👤 **GESTIÓN DE PERFILES AVANZADA**

#### 🔧 **Sistema de Perfiles Mejorado**
- **Gestión completa**: Sistema avanzado para gestión de perfiles de usuario con validación
- **Configuración centralizada**: Sistema unificado de configuración de IP y red
- **Scripts automatizados**: Herramientas de mantenimiento y configuración automatizadas

#### 🔒 **Seguridad Mejorada**
- **Autenticación robusta**: Mejoras en sistemas de autenticación y autorización
- **Validación de permisos**: Sistema granular de permisos por funcionalidad
- **Encriptación**: Mejoras en seguridad de datos sensibles

### 🎨 **Refinamientos de UI/UX**
- **Interfaz pulida**: Mejoras en diseño y experiencia de usuario
- **Navegación**: Sistema de navegación más intuitivo y responsive
- **Feedback visual**: Mejor feedback visual para acciones de usuario

## [0.10.5] - 2024-12-21

### 📑 **SISTEMA DE PESTAÑAS Y FILTROS**

#### 🔍 **Navegación por Pestañas**
- **Sistema completo**: Implementación integral de sistema de navegación por pestañas
- **Filtros avanzados**: Sistema multi-criterio para filtrado de contenido
- **Estado persistente**: Mantenimiento de estado de pestañas durante navegación

#### 🎤 **Gestión de Cantantes por Eventos**
- **Asignación inteligente**: Sistema específico para asignación de cantantes a eventos
- **Filtros por voz**: Filtrado inteligente por tipo de voz y disponibilidad
- **Gestión de participación**: Sistema completo de gestión de participantes

### 🚀 **Mejoras en Navegación**
- **Pestañas responsive**: Diseño adaptativo para diferentes tamaños de pantalla
- **Performance**: Optimizaciones en cambio de pestañas y filtrado
- **UX mejorada**: Transiciones suaves y feedback visual

## [0.10.4] - 2024-12-21

### 🎵 **REPRODUCTOR MINIMIZADO**

#### 📱 **Experiencia de Reproducción Mejorada**
- **Modo compacto**: Versión minimizada del reproductor para mejor aprovechamiento de espacio
- **Cola avanzada**: Sistema mejorado de gestión de cola de reproducción
- **Controles optimizados**: Controles de reproducción más elegantes y funcionales

#### ⚡ **Performance de Audio**
- **Optimizaciones**: Mejoras significativas en performance de reproducción
- **Streaming**: Optimizaciones en streaming de archivos de audio
- **Memoria**: Gestión más eficiente de memoria durante reproducción

### 🎯 **UX Refinada**
- **Interfaz elegante**: Diseño más pulido y moderno del reproductor
- **Transiciones**: Animaciones suaves y transiciones elegantes
- **Responsive**: Mejor adaptación a diferentes tamaños de pantalla

## [0.10.3] - 2024-12-21

### 📰 **SISTEMA DE NOTICIAS COMPLETO**

#### 📢 **Comunicación Integral**
- **Sistema de noticias**: Implementación completa de sistema de noticias y comunicación
- **Notificaciones real-time**: Sistema de notificaciones en tiempo real para usuarios
- **Feed de actividades**: Visualización cronológica de actividades y noticias

#### 🔔 **Gestión de Notificaciones**
- **Tipos de notificación**: Sistema categorizado por tipos (eventos, actualizaciones, música)
- **Configuración personalizada**: Usuarios pueden configurar sus preferencias de notificación
- **Persistencia**: Sistema de almacenamiento persistente de notificaciones

### 📊 **Integración con Dashboard**
- **Dashboard actualizado**: Integración completa de noticias en dashboard principal
- **Métricas**: Estadísticas de engagement y lectura de noticias
- **Administración**: Panel de administración para gestión de noticias

## [0.10.2] - 2024-12-21

### 🎉 **REFINAMIENTO DEL SISTEMA DE EVENTOS**

#### ✨ **Optimizaciones Avanzadas**
- **Gestión de participantes**: Sistema más robusto para manejo de participantes en eventos
- **Validaciones mejoradas**: Sistema de validación más estricto y confiable
- **Performance**: Optimizaciones en consultas y operaciones de eventos

#### 🔧 **Estabilidad Mejorada**
- **Manejo de errores**: Sistema más robusto de manejo de errores en eventos
- **Validación de datos**: Validaciones más estrictas en formularios y operaciones
- **Consistencia**: Mejoras en consistencia de datos y estado

## [0.10.1] - 2024-12-21

### 🎼 **SISTEMA DE LYRICS SINCRONIZADO**

#### 🎤 **Letras Inteligentes**
- **Sincronización temporal**: Sistema de sincronización precisa de letras con audio
- **Visualizador avanzado**: Interfaz completa para visualización de letras durante reproducción
- **Highlighting**: Sistema de resaltado dinámico de líneas actuales

#### 🎵 **Integración Perfecta**
- **Reproductor integrado**: Integración seamless con el sistema de reproducción existente
- **UI enriquecida**: Interfaz más rica y completa durante la reproducción
- **Experiencia inmersiva**: Mayor inmersión durante la experiencia de reproducción

## [0.10.0] - 2024-12-20

### 🎼 **SISTEMA DE PLAYLISTS AVANZADO**

#### 📝 **Gestión Completa**
- **Editor de playlists**: Interfaz completa para creación y edición de playlists
- **Metadatos personalizables**: Sistema completo de metadatos (nombre, descripción, visibilidad)
- **Imágenes personalizadas**: Soporte para subida y gestión de imágenes de playlists
- **Permisos granulares**: Sistema de playlists públicas y privadas con control de acceso

#### 🎯 **Funcionalidad Avanzada**
- **Reproducción automática**: Sistema que reproduce automáticamente al activar playlist
- **Gestión de contenido**: Agregar/quitar canciones con búsqueda en tiempo real
- **Integración total**: Integración perfecta con sistema de cola y reproductor existente

### 🎨 **UI Moderna**
- **Diseño de cards**: Interfaz moderna con sistema de cards responsive
- **Grid adaptativo**: Sistema de grid que se adapta automáticamente al tamaño de pantalla
- **Experiencia visual**: Interfaz más atractiva y fácil de usar

## [0.9.0] - 2025-09-05

### 🎯 **NUEVA FUNCIONALIDAD PRINCIPAL: Sistema de Edición Avanzada de Eventos**

#### 🔧 **Editor de Eventos Completo**
- **Edición de eventos existentes**: Modificación completa de eventos ya creados con todas sus propiedades
- **Carga automática de datos**: Los eventos se cargan con toda su información incluyendo asistentes y música
- **Sincronización de variaciones musicales**: Sistema inteligente que detecta y carga automáticamente las variaciones de canciones
- **Preservación de relaciones**: Mantiene intactas las relaciones entre eventos, asistentes y música durante la edición

#### 🎵 **Sistema de Variaciones Musicales Mejorado**
- **Detección automática en modo edición**: Identifica automáticamente las variaciones musicales cuando se edita un evento
- **Panel de variaciones inteligente**: Muestra las variaciones de cada canción en el panel derecho durante la edición
- **Carga de canciones padre**: Sistema que carga automáticamente las canciones padre necesarias para mostrar variaciones
- **Función especializada para edición**: `updateVariationsInfoForEditMode()` optimizada específicamente para el modo de edición

#### 🔄 **Arquitectura de Carga Mejorada**
- **Carga completa de eventos**: Al editar, se carga el evento completo con `eventSongs` desde el backend
- **API optimizada**: Endpoint GET `/events/:id` incluye toda la información necesaria para edición
- **Fallback robusto**: Sistema de respaldo que maneja errores de carga gracefully
- **Logs de debugging**: Sistema completo de logs para troubleshooting y monitoreo

#### 📝 **Gestión de Estado Refinada**
- **useEffect especializado**: Efectos dedicados para manejar la carga de datos en modo edición
- **Condiciones inteligentes**: Lógica mejorada para detectar cuándo usar funciones de edición vs. creación
- **Sincronización de estado**: Coordinación perfecta entre `selectedSongs`, `variationsInfo` y datos del evento
- **Persistencia de cambios**: Los cambios realizados se mantienen durante toda la sesión de edición

### 🐛 **Correcciones Críticas**

#### 🔍 **Problemas de Edición de Eventos**
- **Eventos sin canciones en edición**: Corregido el problema donde los eventos no mostraban sus canciones al editarlos
- **Variaciones no detectadas**: Solucionado el issue donde las variaciones no aparecían en el panel derecho
- **Carga incompleta de datos**: Arreglado el problema de carga parcial de eventos desde la lista de gestión
- **Estado inconsistente**: Eliminados los estados contradictorios entre diferentes partes del modal

#### 🛡 **Estabilidad del Sistema**
- **Prevención de crashes**: Mejor manejo de datos `undefined` o `null`
- **Fallbacks robustos**: Sistemas de respaldo para cuando fallan las cargas primarias
- **Validación estricta**: Verificación completa de tipos y estructuras de datos
- **Error boundaries**: Contenedores de errores para prevenir propagación de fallos

### 🚀 **Mejoras Técnicas**

#### 🛠 **Backend Optimizations**
- **Inclusión completa de relaciones**: El endpoint GET `/events/:id` incluye `eventSongs` con datos completos
- **Estructura de datos consistente**: Formato uniforme en todas las respuestas de la API
- **Performance mejorado**: Consultas optimizadas para cargar eventos con todas sus relaciones

#### ⚡ **Frontend Enhancements**
- **Componente unificado**: `CreateEventModal` maneja tanto creación como edición de eventos
- **Estado centralizado**: Gestión mejorada del estado con hooks especializados
- **Render optimizado**: Reducción de re-renders innecesarios
- **TypeScript mejorado**: Tipado más estricto y preciso para mejor developer experience

## [0.8.0] - 2025-09-03

### 🎵 **NUEVA FUNCIONALIDAD PRINCIPAL: Sistema de Letras Sincronizadas Avanzado**

#### 🎼 **Visualizador de Letras Inteligente**
- **Sincronización automática en tiempo real**: Las letras se resaltan automáticamente siguiendo la reproducción de audio
- **Sistema dual de colores**: Letras highlighted (púrpura) para participación del coro, letras normales (gris) para referencia
- **Interface minimalista**: Solo texto elegante, sin cuadros o decoraciones que distraigan
- **Effectos visuales sutiles**: Resaltado temporal con zoom de 10% y efecto 3D discreto
- **Visibilidad completa**: Todas las letras siempre visibles, con énfasis visual en las importantes
- **Sin elementos distractivos**: Eliminación de badges, tiempos, y puntos indicadores

#### 🔄 **Sistema de Sincronización Mejorado**
- **Duración extendida**: Mínimo 2 segundos por línea, 5 segundos para la última línea
- **Lógica de cálculo refinada**: Búsqueda inteligente del siguiente segmento para determinar duración
- **Scroll automático**: Seguimiento suave de la línea activa con centrado automático
- **Autosync toggle**: Control total del usuario sobre la sincronización automática
- **Debugging avanzado**: Logs detallados para troubleshooting y optimización

#### 🎨 **Diseño y Experiencia de Usuario**
- **Responsive completo**: Funciona perfectamente en desktop y móvil
- **Tipografía elegante**: Tamaños de fuente responsivos (sm:text-base md:text-lg lg:text-xl)
- **Negrita condicional**: Solo cuando una línea está activa para máximo contraste
- **Centramiento perfecto**: Texto completamente centrado con flexbox
- **Transiciones suaves**: Animaciones de 300ms para cambios visuales fluidos

#### 🔧 **Mejoras Técnicas Backend**
- **Campo isHighlighted**: Implementación completa en base de datos para marcado de líneas
- **API de sincronización**: Endpoint `/api/songs/:id/lyrics/sync` con campo isHighlighted incluido
- **Filtrado inteligente**: Solo líneas con lineNumber > 0 para evitar datos de respaldo
- **Componente correcto**: Identificación y corrección en `LyricsViewerInline` dentro de `StickyPlayer.tsx`
- **Optimización de consultas**: Mejores queries para rendimiento en tiempo real

### 🎯 **Correcciones Críticas del Sistema de Letras**

#### 🔍 **Identificación del Componente Correcto**
- **DevTools analysis**: Identificación correcta de `LyricsViewerInline` como componente activo
- **Archivo correcto**: Modificaciones aplicadas en `StickyPlayer.tsx` en lugar de `LyricsViewer.tsx`
- **Scope apropiado**: Cambios aplicados donde realmente se renderizan las letras

#### 🎨 **Refinamiento Visual**
- **Eliminación de backgrounds**: Remoción de cuadros morados que quitaban elegancia
- **Zoom sutil**: Reducción a 10% para efecto notorio pero no intrusivo
- **Efectos 3D mínimos**: Solo sombra textual muy suave para profundidad
- **Color preservation**: Los colores base nunca cambian durante el resaltado

#### 📱 **Optimización Mobile y Desktop**
- **Detección de dispositivo**: Prop `isDesktop` para ajustes específicos por plataforma
- **Tamaños adaptivos**: Escalado apropiado según tamaño de pantalla
- **Touch optimization**: Mejor experiencia táctil en dispositivos móviles

### 🔧 **Mejoras Técnicas y de Arquitectura**

#### ⚡ **Performance del Visualizador**
- **useEffect optimizado**: Lógica de sincronización más eficiente con dependencias correctas
- **Cálculo de duración inteligente**: Algoritmo mejorado para determinar tiempo de resaltado
- **Scroll suave**: Implementación optimizada de `scrollIntoView` con `behavior: 'smooth'`
- **Estado limpio**: Mejor manejo del estado `activeLineIndex` para evitar renders innecesarios

#### 🗄️ **Integración con Backend Existente**
- **Compatibilidad total**: Funciona con el sistema de playlists y reproductor existente
- **Reutilización de código**: Aprovecha hooks y stores ya implementados (`useLyrics`, `usePlayerStore`)
- **API consistency**: Usa endpoints existentes con extensión para isHighlighted

### 🎯 **Experiencia de Usuario Mejorada**

#### 🎵 **Uso en Vivo para Coros**
- **Visibilidad optimizada**: Solo información relevante visible durante la presentación
- **Distracción mínima**: Interface completamente limpia y enfocada
- **Participación clara**: Identificación inmediata de cuándo cantar
- **Flujo natural**: Transiciones que no interrumpen la concentración

#### 📱 **Accesibilidad y Usabilidad**
- **Contraste mejorado**: Diferenciación clara entre letras highlighted y normales
- **Legibilidad óptima**: Tamaños de fuente apropiados para distancias de lectura
- **Navegación intuitiva**: Click en líneas para navegación manual
- **Feedback visual**: Indicaciones claras del estado actual de reproducción

### 🐛 **Correcciones de Bugs y Estabilidad**

#### 🔧 **Fixes del Sistema de Letras**
- **Duración de resaltado**: Correción de resaltado de solo 1 segundo a duración apropiada
- **Preservación de colores**: Eliminación de cambios de color durante resaltado temporal
- **Component targeting**: Aplicación de cambios en el componente correcto según DevTools
- **Visual cleanup**: Remoción de elementos visuales innecesarios (puntos, badges, tiempos)

#### 📊 **Optimizaciones de Rendering**
- **Re-render reduction**: Optimización de componentes para menor carga de CPU
- **Memory efficiency**: Mejor gestión de estado para prevenir memory leaks
- **Scroll performance**: Implementación eficiente de auto-scroll sin lag

### 📝 **Documentación y Debugging**

#### 🔍 **Debugging Tools**
- **Console logging**: Información detallada de sincronización y estados
- **DevTools integration**: Mejor identificación de componentes y props
- **Performance monitoring**: Logs de timing para optimización continua

## [0.7.0] - 2025-09-01

### 🎵 **NUEVA FUNCIONALIDAD PRINCIPAL: Sistema de Playlists Completo**

#### 🎼 **Gestión Integral de Playlists**
- **Creación de playlists**: Editor completo con metadatos (nombre, descripción, imagen, visibilidad)
- **Gestión de contenido**: Agregar/quitar canciones con búsqueda en tiempo real
- **Edición completa**: Modificar nombre, descripción, imagen y configuraciones
- **Sistema de permisos**: Playlists públicas y privadas por usuario
- **Subida de imágenes**: Soporte para imágenes personalizadas de playlist (.png, .jpg, .jpeg)
- **Eliminación segura**: Confirmación y limpieza de archivos asociados

#### 🎯 **Reproductor de Playlists Funcional**
- **Reproducción automática**: Al dar play reproduce inmediatamente la primera canción
- **Cola inteligente**: Integración completa con el sistema de cola de reproducción
- **Navegación fluida**: Transición automática entre canciones de la playlist
- **Autenticación de audio**: URLs seguras con tokens JWT para streaming protegido
- **Compatibilidad total**: Funciona igual que la reproducción individual de canciones

#### 🎨 **Interfaz Moderna y Responsive**
- **Diseño cuadrado**: Playlists con formato square para mejor aprovechamiento del espacio
- **Imágenes centradas**: `object-cover object-center` para visualización óptima
- **Grid responsivo**: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`
- **Elementos compactos**: Reducción de padding en listas de canciones (p-2 vs p-4)
- **UI optimizada**: Eliminación de subtítulos redundantes para mayor densidad visual

#### 🔍 **Editor Avanzado de Playlists**
- **Búsqueda en tiempo real**: Filtro de canciones con debounce de 200ms
- **Gestión individual**: Remover canciones específicas de playlists
- **Vista dual**: Lista de canciones disponibles y canciones en playlist
- **Controles completos**: Editar, eliminar, cambiar imagen desde la interfaz
- **Validación de datos**: Verificación de permisos y existencia de archivos

### 📊 **Mejoras en Dashboard y Visualización**

#### 🏗️ **Dashboard Optimizado**
- **Información más clara**: Reorganización de métricas para mejor legibilidad
- **Estadísticas de playlists**: Nuevas métricas para seguimiento de uso
- **Filtrado por usuario**: Dashboard personalizado según rol y permisos
- **Performance mejorado**: Consultas optimizadas para carga rápida de datos

#### 🖼️ **Servido de Imágenes Corregido**
- **Middleware estático**: Configuración correcta para imágenes de playlists
- **Path resolution**: Corrección de rutas relativas en express.static
- **Endpoint /uploads/images**: Servido seguro de imágenes sin autenticación
- **Fallback a gradientes**: Visualización elegante cuando no hay imagen personalizada

### 🔧 **Mejoras Técnicas y de Backend**

#### 🗄️ **API de Playlists**
- **CRUD completo**: Create, Read, Update, Delete con validaciones
- **Multer integration**: Subida de archivos con límites y validación de tipos
- **Autenticación robusta**: Middleware de auth en todas las rutas protegidas
- **Gestión de archivos**: Limpieza automática de imágenes huérfanas
- **Consultas optimizadas**: JOIN queries para mejor rendimiento

#### 🎵 **Reproductor Mejorado**
- **Función getSongFileUrl()**: Uso consistente del endpoint autenticado `/api/songs/file/`
- **Debugging mejorado**: Logs detallados para troubleshooting de reproducción
- **Error handling**: Manejo robusto de errores de red y archivos faltantes
- **Compatibilidad HTML5**: Audio elements nativos con autenticación transparente

### 🎯 **Experiencia de Usuario Mejorada**

#### 📱 **Interfaz Responsive**
- **Mejor uso del espacio**: Grid más denso con más columnas en pantallas grandes
- **Navegación fluida**: Transiciones suaves entre diferentes vistas
- **Feedback visual**: Estados de carga y confirmaciones claras
- **Accesibilidad**: Etiquetas y controles apropiados para screen readers

#### 🎼 **Gestión Musical**
- **Workflow completo**: Desde creación hasta reproducción sin interrupciones
- **Integración total**: Playlists funcionan igual que el resto del sistema
- **Búsqueda avanzada**: Filtros por título, artista y otros metadatos
- **Organización mejorada**: Herramientas para mantener colecciones ordenadas

### 🐛 **Correcciones Críticas**

#### 🔊 **Reproductor de Playlists**
- **URL Construction**: Cambio de construcción manual a `getSongFileUrl()` 
- **Authentication**: Corrección de tokens en requests de audio
- **AutoPlay**: Implementación del patrón correcto para reproducción automática
- **Queue Integration**: Sincronización perfecta con el sistema de colas existente

#### 🖼️ **Imágenes de Playlists**
- **404 Errors**: Resolución de errores 404 en carga de imágenes
- **Static Middleware**: Configuración correcta del path en express.static
- **File Serving**: Servido eficiente de archivos estáticos sin autenticación

### 📝 **Documentación y Logging**

#### 🔍 **Debugging**
- **Console logs**: Información detallada para development
- **Server logs**: Tracking de requests y errores
- **Performance metrics**: Monitoreo de tiempos de respuesta
- **User actions**: Logging de acciones importantes del usuario

#### 📋 **Código Limpio**
- **TypeScript strict**: Eliminación de errores de tipos
- **Import optimization**: Organización de imports y exports
- **Code organization**: Separación clara de responsabilidades
- **Comment updates**: Documentación en línea actualizada

---

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
