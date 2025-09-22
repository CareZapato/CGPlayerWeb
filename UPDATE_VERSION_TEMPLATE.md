# Plantilla para Actualización de Versiones - CGPlayerWeb

## Instrucciones de Uso
Cuando se solicite "actualiza a la versión X.X.X" con imagen de commits, seguir estos pasos:

## 1. Análisis de Commits
- Revisar la imagen de commits proporcionada
- Identificar las características principales (plato fuerte)
- Resumir cambios de forma sencilla y no técnica
- Categorizar mejoras: UI/UX, funcionalidades, correcciones

## 2. Archivos a Actualizar

### Frontend (package.json)
- `frontend/package.json` - campo "version"

### Backend (package.json)
- `backend/package.json` - campo "version"

### Documentación
- `README.md` - sección de versión
- `CHANGELOG.md` - agregar nueva entrada
- Archivos de documentación relevantes

### Páginas Web
- Página principal - footer con versión
- Página de changelog - nueva entrada
- Sistema de noticias - nueva noticia

## 3. Estructura del Changelog
```markdown
## [X.X.X] - YYYY-MM-DD

### 🎯 Característica Principal
- [Descripción del plato fuerte de la versión]

### ✨ Nuevas Funcionalidades
- [Lista de nuevas características]

### 🔧 Mejoras
- [Mejoras en la interfaz y experiencia]

### 🐛 Correcciones
- [Bugs solucionados]

### 🎨 Interfaz de Usuario
- [Cambios visuales y de diseño]
```

## 4. Estructura de Noticia
```markdown
**Título:** CGPlayerWeb v X.X.X - [Nombre de la característica principal]

**Contenido:**
- Destacar la funcionalidad principal
- Mencionar mejoras importantes
- Listar correcciones relevantes
- Mantener tono accesible y no técnico
```

## 5. Pasos de Ejecución
1. Crear/actualizar entrada en CHANGELOG.md
2. Actualizar versiones en package.json (frontend y backend)
3. Actualizar README.md si es necesario
4. Actualizar página principal (footer)
5. Actualizar página de changelog
6. Crear noticia en sistema de noticias
7. Hacer commit con mensaje: "vX.X.X [descripción principal]"
8. Hacer push de los cambios

## 6. Formato de Commit
```
vX.X.X [característica principal] - [breve descripción]
```

## 7. Notas Importantes
- Siempre destacar el "plato fuerte" de la versión
- Usar lenguaje sencillo y accesible
- Mantener consistencia en formatos
- Verificar que todos los archivos estén actualizados
- Confirmar que las versiones coincidan en todos los archivos