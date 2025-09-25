# CGPlayerWeb 🎵

[![Version](https://img.shields.io/badge/version-0.12.42-blue.svg)](https://github.com/CareZapato/CGPlayerWeb/releases/tag/v0.12.42)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

> **Sistema moderno de gestión musical para coros**  
> Reproducción, organización y gestión completa de música coral con sistema de roles, eventos y colaboración en tiempo real.

---

## 📖 **¿Qué es CGPlayerWeb?**

CGPlayerWeb es una aplicación web integral diseñada para coros y grupos musicales que revoluciona la gestión musical mediante:

- 🎵 **Sistema de reproducción avanzado** con pistas especializadas por tipo de voz
- 👥 **Gestión inteligente de cantantes** con perfiles completos y tipos de voz
- 🗺️ **Organización multi-sede** para coros distribuidos geográficamente
- 🎭 **Planificación de eventos** con sistema de postulaciones y confirmación de asistencia
- 📱 **Experiencia multiplataforma** optimizada para desktop, tablet y móvil
- 🔐 **Autenticación robusta** con sistema de roles jerárquico

---

## 🚀 **Funcionalidades Completas del Sistema**

### 🔐 **Sistema de Autenticación y Perfiles**
- **Registro y login seguro**: Sistema de autenticación con JWT y validación de sesiones
- **Perfiles de usuario completos**: Gestión de información personal, contacto y preferencias
- **Sistema de tipos de voz avanzado**: Voces primarias y secundarias (Soprano, Contralto, Tenor, Bajo, Barítono, Mesosoprano)
- **Gestión de imágenes de perfil**: Subida y edición de fotos personales
- **Roles jerárquicos**: Administrador, Director y Cantante con permisos específicos
- **Configuración personalizada**: Ajustes de notificaciones y preferencias de usuario

### 📊 **Dashboard Inteligente por Rol**
- **Panel administrativo completo**: Vista global con estadísticas de usuarios, canciones, eventos y sedes
- **Dashboard de directores**: Vista filtrada por sede con gestión específica de su grupo
- **Dashboard de cantantes**: Panel personalizado con métricas de participación y logros
- **Gráficos interactivos**: Visualizaciones de torta con distribución de tipos de voz y métricas
- **Estadísticas en tiempo real**: Datos actualizados automáticamente basados en actividad real
- **Métricas de participación**: Ensayos asistidos, faltas, inasistencias y eventos confirmados

### 🎵 **Sistema Musical Avanzado**
- **Reproductor sticky inteligente**: Player que se mantiene visible durante la navegación
- **Gestión de pistas por voz**: Organización automática por tipos de voz específicos
- **Playlists personalizadas**: Creación, edición y gestión de listas de reproducción con imágenes
- **Letras sincronizadas**: Visualizador de letras que se sincroniza con la reproducción
- **Cola de reproducción**: Sistema de colas con drag & drop para reordenar canciones
- **Subida masiva de archivos**: Upload de canciones con metadatos y organización automática
- **Filtrado inteligente**: Canciones filtradas según el tipo de voz del usuario
- **Reproductor minimizado**: Modo compacto arrastrable para mejor experiencia móvil

### 🎭 **Gestión Integral de Eventos**
- **Calendario de eventos**: Visualización mensual con eventos y ensayos programados
- **Creación y edición de eventos**: Sistema completo de gestión con asignación de música
- **Sistema de postulaciones**: Cantantes pueden solicitar participar en eventos externos
- **Confirmación de asistencia**: Gestión de participantes con estados (confirmado, pendiente, rechazado)
- **Restricciones por cuenta**: Límites configurables de eventos que cada usuario puede crear
- **Notificaciones de eventos**: Alertas automáticas para cambios y recordatorios
- **Gestión de participantes**: Asignación manual de cantantes designados y solicitudes externas
- **Estados de eventos**: Aprobado, pendiente, rechazado con flujo de trabajo completo

### 👥 **Administración y Gestión de Usuarios**
- **Gestión de cantantes por sedes**: Directores administran solo su ubicación asignada
- **Sistema de roles granular**: Permisos específicos por funcionalidad y nivel de acceso
- **Onboarding de usuarios**: Proceso guiado para nuevos miembros del coro
- **Gestión de voces primarias**: Distribución automática de voces principales y secundarias
- **Estadísticas de participación**: Métricas individuales basadas en asistencia real a eventos
- **Sistema de logros**: Achievements por categorías de participación y compromiso
- **Configuración de sedes**: Gestión de ubicaciones geográficas con datos de contacto
- **Backup y restauración**: Sistema automatizado de respaldo de datos de usuarios

### 📱 **Experiencia de Usuario Optimizada**
- **Interfaz responsive completa**: Diseño adaptativo para todos los dispositivos
- **Navegación móvil mejorada**: Menú hamburguesa con submenús funcionales
- **HomePage minimalista**: Diseño optimizado sin scroll en dispositivos móviles
- **Carrusel de noticias inteligente**: 3 noticias en desktop, 1 en móvil con navegación automática
- **Transiciones suaves**: Animaciones fluidas en toda la aplicación
- **Feedback visual consistente**: Estados de carga, confirmaciones y mensajes claros
- **Accesibilidad mejorada**: Soporte para screen readers y navegación por teclado

---

## 🆕 **Novedades v0.12.42**

### **🎨 Mejoras Visuales del Homepage**
- **Carrusel de noticias rediseñado**: Navegación optimizada con 3 noticias completas en desktop y 1 en móvil
- **Responsive design perfeccionado**: Elementos que se adaptan perfectamente a diferentes pantallas
- **Transiciones suaves mejoradas**: Animaciones más fluidas entre elementos del carrusel
- **Cards de noticias optimizadas**: Mejor contraste, tipografía más clara y elementos refinados

### **🔐 Sistema de Restricciones de Eventos**
- **Límites por cuenta implementados**: Sistema completo de restricciones para creación de eventos
- **Validaciones automáticas**: Verificación de límites antes de permitir crear nuevos eventos
- **Dashboard de control**: Contadores de eventos creados por usuario y gestión de cuotas
- **Notificaciones de límites**: Alertas cuando se acercan a los límites establecidos

### **📱 Correcciones Críticas Móviles**
- **Navegación táctil corregida**: Carrusel funciona perfectamente en dispositivos móviles
- **Overflow eliminado**: Problema de scroll horizontal solucionado en pantallas pequeñas
- **Indicadores alineados**: Posición correcta en todos los tamaños de pantalla

---

## ✨ **Características Técnicas Destacadas**

### **Frontend**
- **React 19** con TypeScript strict mode
- **Tailwind CSS** para diseño responsive
- **Vite** como bundler optimizado
- **Zustand** para gestión de estado global
- **React Query** para caché de datos eficiente

### **Backend** 
- **Node.js** con Express framework
- **PostgreSQL** con Prisma ORM
- **Autenticación JWT** con refresh tokens
- **Multer** para upload de archivos
- **API RESTful** con documentación OpenAPI

### **Infraestructura**
- **Docker** ready con docker-compose
- **Nginx** como reverse proxy
- **Sistema de logs** comprehensivo
- **Configuración automática** de red
- **Backup automático** programado

---

## 🚀 **Instalación y Configuración**

### **Requisitos Previos**
- Node.js 18+
- PostgreSQL 15+
- npm o yarn

### **Instalación Rápida**
```bash
# Clonar el repositorio
git clone https://github.com/CareZapato/CGPlayerWeb.git
cd CGPlayerWeb

# Instalar dependencias
npm run install:all

# Configurar base de datos
cd backend
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Ejecutar migraciones
npx prisma migrate dev
npx prisma generate

# Iniciar en modo desarrollo
cd ..
npm run dev
```

### **🌐 Configuración Automática de Red**
```bash
# Detectar y configurar IP automáticamente
./scripts/auto-detect-ip.sh

# Reconfigurar IP después del despliegue
./scripts/configure-ip.sh

# Manual (si es necesario)
echo "SERVER_IP=192.168.1.10" > ip-config.env
```

**Características de la detección automática:**
- ✅ **Múltiples métodos** de detección (ip route, hostname, ifconfig, etc.)
- ✅ **Configuración automática** de variables de entorno
- ✅ **Acceso de red local** sin configuración manual
- ✅ **Reconfiguración dinámica** después del despliegue

---

## 📱 **Guía de Uso por Rol**

### **Para Cantantes**
1. **Registro y configuración de perfil** - Crear cuenta, completar datos personales y configurar tipo de voz
2. **Explorar catálogo musical** - Navegar canciones filtradas por tipo de voz asignado
3. **Reproducir y ensayar** - Usar el reproductor avanzado para practicar pistas individuales
4. **Crear playlists personales** - Organizar canciones favoritas para estudio
5. **Postular a eventos** - Solicitar participación en presentaciones y conciertos
6. **Gestionar asistencia** - Confirmar o declinar participación en eventos asignados
7. **Ver estadísticas personales** - Revisar métricas de participación y logros obtenidos

### **Para Directores**
1. **Gestionar cantantes de su sede** - Administrar miembros del coro de su ubicación
2. **Crear y organizar eventos** - Planificar ensayos, presentaciones y conciertos
3. **Subir material musical** - Agregar nuevas canciones al repositorio del coro
4. **Asignar cantantes a eventos** - Designar participantes para eventos específicos
5. **Aprobar solicitudes de participación** - Gestionar postulaciones de cantantes externos
6. **Monitorear estadísticas de sede** - Revisar métricas de participación y actividad
7. **Gestionar tipos de voz** - Asignar y modificar clasificaciones vocales de cantantes

### **Para Administradores**
1. **Configurar sistema completo** - Gestión global de configuraciones y parámetros
2. **Gestionar todas las sedes** - Administrar ubicaciones geográficas y directores
3. **Supervisar usuarios globales** - Vista completa de todos los cantantes y directores  
4. **Gestionar respaldos del sistema** - Mantener backups automáticos y restauraciones
5. **Revisar métricas globales** - Supervisar uso y actividad de toda la plataforma
6. **Configurar restricciones** - Establecer límites de eventos y permisos por rol
7. **Administrar contenido** - Gestión global de canciones, playlists y eventos

---

## 📋 **Estructura del Proyecto**

```
CGPlayerWeb/
├── frontend/              # Aplicación React TypeScript
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/          # Páginas principales de la app
│   │   ├── services/       # Servicios y API calls
│   │   ├── config/         # Configuraciones de app
│   │   ├── stores/         # Estado global con Zustand
│   │   └── types/          # Definiciones TypeScript
│   └── public/             # Archivos estáticos
├── backend/               # API Node.js con Express
│   ├── src/
│   │   ├── routes/         # Endpoints de la API
│   │   ├── services/       # Lógica de negocio
│   │   ├── middleware/     # Middlewares de auth y validación
│   │   ├── utils/          # Utilidades y helpers
│   │   └── config/         # Configuraciones del servidor
│   ├── prisma/            # Schema y migraciones DB
│   └── uploads/           # Archivos multimedia subidos
├── docker/                # Configuración Docker
├── scripts/               # Scripts de utilidad y despliegue
└── docs/                  # Documentación del proyecto
```

---

## 🤝 **Contribuir al Proyecto**

1. **Fork** el repositorio
2. Crear **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** cambios (`git commit -m 'Add: Amazing Feature'`)
4. **Push** a la branch (`git push origin feature/AmazingFeature`)
5. Abrir **Pull Request** con descripción detallada

### **Guías de Contribución**
- Seguir convenciones de código TypeScript
- Incluir pruebas para nuevas funcionalidades
- Documentar cambios en CHANGELOG.md
- Mantener compatibilidad con versiones anteriores

---

## 📄 **Documentación Completa**

- **[Changelog](CHANGELOG.md)** - Historial detallado de versiones
- **[Release Notes v0.12.42](RELEASE_NOTES_v0.12.42.md)** - Notas de la versión actual
- **[Docker Guide](docker/README.md)** - Guía completa de despliegue con Docker
- **API Documentation** - Disponible en `/api-docs` cuando el servidor esté ejecutándose
- **[Scripts Guide](scripts/README.md)** - Documentación de scripts de utilidad

---

## 🐛 **Reportar Problemas**

¿Encontraste un bug? [Crear un issue](https://github.com/CareZapato/CGPlayerWeb/issues/new)

**Para reportes efectivos, incluye:**
- **Versión** de CGPlayerWeb (v0.12.42)
- **Navegador** y versión específica
- **Dispositivo** (desktop/móvil/tablet)
- **Pasos detallados** para reproducir el problema
- **Comportamiento esperado** vs **comportamiento actual**
- **Screenshots** o videos si es aplicable

---

## 📊 **Estado Actual del Proyecto**

- ✅ **Producción Ready** - Sistema estable y completamente funcional
- 🔄 **Desarrollo Activo** - Actualizaciones regulares con nuevas funcionalidades
- 🧪 **Testing Continuo** - Cobertura de pruebas en expansión
- 📱 **Mobile First** - Optimización completa para dispositivos móviles
- 🌐 **Multi-sede** - Sistema robusto para organizaciones distribuidas
- 🔐 **Seguro** - Autenticación y autorización robustas implementadas

---

## 📞 **Contacto y Soporte**

- **GitHub Issues:** [Reportar problemas o sugerir mejoras](https://github.com/CareZapato/CGPlayerWeb/issues)
- **Desarrollador Principal:** CareZapato
- **Versión Actual:** v0.12.42
- **Última Actualización:** Septiembre 2025
- **Licencia:** MIT License

---

<div align="center">

**🎵 Desarrollado con ❤️ para la comunidad musical coral**

*CGPlayerWeb - Transformando la gestión musical digital para coros modernos*

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)

</div>