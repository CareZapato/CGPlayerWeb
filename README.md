# CGPlayerWeb 🎵

[![Version](https://img.shields.io/badge/version-0.10.19-blue.svg)](https://github.com/CareZapato/CGPlayerWeb/releases/tag/v0.10.19)
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

### **Configuración de Red** *(Opcional)*
```bash
# Para acceso desde red local, editar:
echo "SERVER_IP=tu.ip.local" > ip-config.env

# O configurar automáticamente:
node scripts/setup-network.js
```

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

[![Version](https://img.shields.io/badge/version-0.10.19-blue.svg)](https://github.com/CareZapato/CGPlayerWeb/releases/tag/v0.10.19)
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

### **Configuración de Red** *(Opcional)*
```bash
# Para acceso desde red local, editar:
echo "SERVER_IP=tu.ip.local" > ip-config.env

# O configurar automáticamente:
node scripts/setup-network.js
```

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

## 🆕 **Novedades v0.10.19**

### **🔧 Correcciones Críticas**
- ✅ **Fix sistema de postulaciones** - Botón "Solicitar participación" funciona correctamente
- ✅ **Modal de eventos mejorado** - Footer aparece cuando permite postulaciones externas
- ✅ **Confirmación de asistencia** - Sistema completo operativo

### **🌐 Configuración IP Centralizada**
- ✅ **Backend flexible** - Elimina IPs hardcoded, usa configuración centralizada
- ✅ **URLs dinámicas** - Generación automática de URLs de imágenes
- ✅ **Detección automática** - Sistema inteligente de fallbacks de IP

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
- **[Release Notes](RELEASE_NOTES_v0.10.19.md)** - Notas de la versión actual
- **API Documentation** - Disponible en `/api-docs` cuando el servidor esté ejecutándose

---

## 🐛 **Reportar Problemas**

¿Encontraste un bug? [Crear un issue](https://github.com/CareZapato/CGPlayerWeb/issues/new)

Para reportes, incluye:
- **Versión** de CGPlayerWeb (v0.10.19)
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
- **Versión Actual:** v0.10.19
- **Última Actualización:** Enero 2025

---

<div align="center">

**🎵 Hecho con ❤️ para la comunidad coral**

*CGPlayerWeb - Donde la música coral cobra vida digital*

</div>

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

## � Credenciales de Prueba

Para facilitar las pruebas y desarrollo, el sistema incluye usuarios predefinidos con diferentes roles:

### 👑 Administradores
| Usuario | Email | Contraseña | Ubicación |
|---------|-------|------------|-----------|
| admin | admin@cgplayer.com | admin123 | Santiago |
| admin2 | admin2@cgplayer.com | admin123 | Valparaíso |

### 🎼 Directores
| Usuario | Email | Contraseña | Ubicación |
|---------|-------|------------|-----------|
| director.santiago | director.santiago@cgplayer.com | director123 | Santiago |
| director.valparaiso | director.valparaiso@cgplayer.com | director123 | Valparaíso |
| director.concepcion | director.concepcion@cgplayer.com | director123 | Concepción |

### 🎤 Cantantes de Prueba
| Usuario | Email | Contraseña | Ubicación | Tipos de Voz |
|---------|-------|------------|-----------|--------------|
| cantante1 | cantante1@cgplayer.com | cantante123 | Santiago | Soprano, Alto |
| cantante2 | cantante2@cgplayer.com | cantante123 | Valparaíso | Tenor |
| cantante3 | cantante3@cgplayer.com | cantante123 | Concepción | Soprano |
| cantante4 | cantante4@cgplayer.com | cantante123 | Antofagasta | Barítono, Bajo |

### 📊 Datos Masivos
El sistema también incluye **más de 300 cantantes** distribuidos automáticamente en:
- **Santiago**: 90 cantantes
- **Concepción**: 45 cantantes  
- **Antofagasta**: 30 cantantes
- **Viña del Mar**: 20 cantantes
- **Valparaíso**: 15 cantantes
- **Valdivia**: 15 cantantes

> **Nota**: Todos los cantantes masivos usan la contraseña `cantante123` y están distribuidos con tipos de voz aleatorios. Aproximadamente el 20% tiene dos tipos de voz asignados.

## �📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autor

- **CareZapato** - *Desarrollador Principal* - [@CareZapato](https://github.com/CareZapato)

---

**¿Encontraste un bug o tienes una sugerencia?** ¡Abre un [issue](https://github.com/CareZapato/CGPlayerWeb/issues) y ayúdanos a mejorar!

---

<div align="center">
  
**⭐ Si te gusta este proyecto, ¡dale una estrella! ⭐**

</div>

