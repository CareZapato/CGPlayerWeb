# CGPlayerWeb 🎵

[![Version](https://img.shields.io/badge/version-0.10.24-blue.svg)](https://github.com/CareZapato/CGPlayerWeb/releases/tag/v0.10.24)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

> **Sistema moderno de gestión musical para coros**  
> Reproducción, organización y gestión completa de música coral con sistema de roles, eventos y colaboración en tiempo real.

---

## 📖 **¿Qué es CGPlayerWeb?**

CGPlayerWeb es una aplicación web integral diseñada para coros y grupos musicales que permite:

- 🎵 **Subir y reproducir** pistas de audio con calidad profesional
- 👥 **Gestionar cantantes** con sistema de roles y tipos de voz
- �️ **Organizar sedes** distribuidas geográficamente
- 🎭 **Planificar eventos** con sistema de postulaciones
- 📱 **Acceso multiplataforma** desde cualquier dispositivo

---

## ✨ **Características Principales**

### 🎼 **Gestión Musical**
- **Reproductor avanzado** - Player sticky con controles completos
- **Pistas por tipo de voz** - Soprano, Contralto, Tenor, Bajo, etc.
- **Playlists inteligentes** - Creación y gestión de listas de reproducción
- **Letras sincronizadas** - Visualización de letras durante la reproducción

### 👤 **Sistema de Usuarios**
- **Autenticación segura** - Login con JWT y roles diferenciados
- **Perfiles completos** - Gestión de información personal y musical
- **Tipos de voz** - Sistema de voces primarias y secundarias
- **Ubicaciones** - Organización por sedes geográficas

### 🎭 **Eventos y Participación**
- **Calendario de eventos** - Visualización y gestión de presentaciones
- **Sistema de postulaciones** - Solicitar participación en eventos externos
- **Confirmación de asistencia** - Gestión completa de participantes
- **Estados de eventos** - Pendiente, aprobado, rechazado

### 📊 **Administración**
- **Dashboard administrativo** - Panel de control completo
- **Gestión de roles** - Admin, Director, Cantante
- **Sistema de backup** - Respaldo automático de datos
- **Estadísticas** - Métricas de uso y participación

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

## 📱 **Uso Básico**

### **Para Cantantes**
1. **Registro y Login** - Crear cuenta y completar perfil
2. **Explorar música** - Navegar catálogo de canciones disponibles
3. **Reproducir pistas** - Usar el player para ensayar tu voz
4. **Unirse a eventos** - Postular a presentaciones y conciertos
5. **Confirmar asistencia** - Gestionar tu participación en eventos

### **Para Directores**
1. **Gestionar cantantes** - Administrar miembros del coro
2. **Crear eventos** - Planificar presentaciones y ensayos
3. **Subir música** - Agregar nuevas canciones al repertorio
4. **Aprobar solicitudes** - Gestionar postulaciones a eventos
5. **Ver estadísticas** - Monitorear actividad del coro

### **Para Administradores**
1. **Configurar sistema** - Gestión completa de configuraciones
2. **Gestionar sedes** - Organizar ubicaciones geográficas
3. **Backup de datos** - Mantener respaldos del sistema
4. **Métricas globales** - Supervisar uso de toda la plataforma

---

## 🔧 **Características Técnicas**

### **Frontend**
- **React 19** con TypeScript
- **Tailwind CSS** para estilos
- **Vite** como bundler
- **Estado global** con Context API

### **Backend** 
- **Node.js** con Express
- **PostgreSQL** con Prisma ORM
- **Autenticación JWT**
- **Upload de archivos** con Multer
- **API RESTful** documentada

### **Infraestructura**
- **Docker ready** (contenedores disponibles)
- **Configuración flexible** de red
- **Sistema de logs** comprehensivo
- **Backup automático** de base de datos

---

## 📋 **Estructura del Proyecto**

```
CGPlayerWeb/
├── frontend/          # Aplicación React
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/       # Páginas principales
│   │   ├── services/    # Servicios y API calls
│   │   └── config/      # Configuraciones
│   └── public/          # Archivos estáticos
├── backend/           # API Node.js
│   ├── src/
│   │   ├── routes/      # Endpoints API
│   │   ├── services/    # Lógica de negocio
│   │   ├── middleware/  # Middlewares
│   │   └── config/      # Configuraciones
│   ├── prisma/         # Schema y migraciones DB
│   └── uploads/        # Archivos subidos
└── scripts/           # Scripts de utilidad
```

---

## 🤝 **Contribuir**

1. **Fork** el proyecto
2. Crear **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** cambios (`git commit -m 'Add: Amazing Feature'`)
4. **Push** a la branch (`git push origin feature/AmazingFeature`)
5. Abrir **Pull Request**

---

## 📄 **Documentación**

- **[Changelog](CHANGELOG.md)** - Historial de versiones
- **[API Documentation](backend/docs/API.md)** - Documentación de endpoints
- **[User Guide](docs/USER_GUIDE.md)** - Guía de usuario
- **[Admin Guide](docs/ADMIN_GUIDE.md)** - Guía de administración

---

## 🐛 **Reportar Problemas**

¿Encontraste un bug? [Crear un issue](https://github.com/CareZapato/CGPlayerWeb/issues/new)

Para reportes, incluye:
- **Versión** de CGPlayerWeb
- **Navegador** y versión
- **Pasos** para reproducir
- **Comportamiento esperado** vs **real**

---

## � **Estado del Proyecto**

# CGPlayerWeb 🎵

[![Version](https://img.shields.io/badge/version-0.10.24-blue.svg)](https://github.com/CareZapato/CGPlayerWeb/releases/tag/v0.10.24)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

> **Sistema moderno de gestión musical para coros**  
> Reproducción, organización y gestión completa de música coral con sistema de roles, eventos y colaboración en tiempo real.

---

## 📖 **¿Qué es CGPlayerWeb?**

CGPlayerWeb es una aplicación web integral diseñada para coros y grupos musicales que permite:

- 🎵 **Subir y reproducir** pistas de audio con calidad profesional
- 👥 **Gestionar cantantes** con sistema de roles y tipos de voz
- 🗺️ **Organizar sedes** distribuidas geográficamente
- 🎭 **Planificar eventos** con sistema de postulaciones
- 📱 **Acceso multiplataforma** desde cualquier dispositivo

---

## ✨ **Características Principales**

### 🎼 **Gestión Musical**
- **Reproductor avanzado** - Player sticky con controles completos
- **Pistas por tipo de voz** - Soprano, Contralto, Tenor, Bajo, etc.
- **Playlists inteligentes** - Creación y gestión de listas de reproducción
- **Letras sincronizadas** - Visualización de letras durante la reproducción

### 👤 **Sistema de Usuarios**
- **Autenticación segura** - Login con JWT y roles diferenciados
- **Perfiles completos** - Gestión de información personal y musical
- **Tipos de voz** - Sistema de voces primarias y secundarias
- **Ubicaciones** - Organización por sedes geográficas

### 🎭 **Eventos y Participación**
- **Calendario de eventos** - Visualización y gestión de presentaciones
- **Sistema de postulaciones** - Solicitar participación en eventos externos
- **Confirmación de asistencia** - Gestión completa de participantes
- **Estados de eventos** - Pendiente, aprobado, rechazado

### 📊 **Administración**
- **Dashboard administrativo** - Panel de control completo
- **Gestión de roles** - Admin, Director, Cantante
- **Sistema de backup** - Respaldo automático de datos
- **Estadísticas** - Métricas de uso y participación

---

## 🆕 **Novedades v0.10.24**

### **🎨 Mejoras Visuales del Reproductor**
- ✅ **StickyPlayer móvil 10% más grande** - Mejor usabilidad en dispositivos móviles
- ✅ **Botones redimensionados** - Controles más grandes y organizados
- ✅ **Marquee universal** - Efecto de barrido en TODOS los títulos de canciones
- ✅ **Reproductor minimizado arrastrable** - Esfera móvil por toda la pantalla

### **🔧 Correcciones de Interacción**
- ✅ **Touch events optimizados** - Toque para expandir funciona en PC y móvil
- ✅ **Límites inteligentes** - Reproductor se mantiene en área visible
- ✅ **Animaciones mejoradas** - Texto con desplazamiento suave y consistente

---

## 🤝 **Contribuir**

1. **Fork** el proyecto
2. Crear **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** cambios (`git commit -m 'Add: Amazing Feature'`)
4. **Push** a la branch (`git push origin feature/AmazingFeature`)
5. Abrir **Pull Request**

---

## 📄 **Documentación**

- **[Changelog](CHANGELOG.md)** - Historial de versiones
- **[Release Notes](RELEASE_NOTES_v0.10.24.md)** - Notas de la versión actual
- **[Docker Guide](docker/README.md)** - Guía completa de despliegue con Docker
- **API Documentation** - Disponible en `/api-docs` cuando el servidor esté ejecutándose

---

## 🐛 **Reportar Problemas**

¿Encontraste un bug? [Crear un issue](https://github.com/CareZapato/CGPlayerWeb/issues/new)

Para reportes, incluye:
- **Versión** de CGPlayerWeb (v0.10.24)
- **Navegador** y versión
- **Pasos** para reproducir
- **Comportamiento esperado** vs **real**

---

## 📊 **Estado del Proyecto**

- ✅ **Producción Ready** - Sistema estable y funcional
- 🔄 **Desarrollo Activo** - Actualizaciones regulares
- 🧪 **Testing** - Cobertura de pruebas en progreso
- 📱 **Mobile Responsive** - Optimizado para móviles

---

## 📞 **Contacto y Soporte**

- **GitHub Issues:** [Reportar problemas](https://github.com/CareZapato/CGPlayerWeb/issues)
- **Desarrollador:** CareZapato
- **Versión Actual:** v0.10.24
- **Última Actualización:** Enero 2025

---

<div align="center">

**🎵 Hecho con ❤️ para la comunidad coral**

*CGPlayerWeb - Donde la música coral cobra vida digital*

</div>

