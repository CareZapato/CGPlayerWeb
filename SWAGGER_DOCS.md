# Documentación API CGPlayerWeb

Este proyecto incluye documentación completa de la API usando Swagger/OpenAPI 3.0.

## Acceso a la Documentación

### Desarrollo Local
- **URL**: http://localhost:3001/api-docs
- **Puerto**: 3001 (servidor backend)

### Acceso desde Red Local
- **URL**: http://[IP_LOCAL]:3001/api-docs
- **Ejemplo**: http://192.168.1.17:3001/api-docs

## Características de la Documentación

### 🔐 Autenticación
- La mayoría de endpoints requieren autenticación JWT
- Usar el botón "Authorize" en Swagger UI
- Formato del token: `Bearer [JWT_TOKEN]`

### 📚 Endpoints Documentados

#### Authentication (`/api/auth`)
- `POST /auth/register` - Registro de usuarios
- `POST /auth/login` - Inicio de sesión

#### Users (`/api/users`)
- `GET /users` - Lista de usuarios con filtros y paginación

#### Songs (`/api/songs`)
- `GET /songs` - Lista de canciones
- `POST /songs/upload` - Subir canción individual

#### Dashboard (`/api/dashboard`)
- `GET /dashboard/stats` - Estadísticas del sistema

#### Locations (`/api/locations`)
- `GET /locations` - Lista de ubicaciones

#### Events (`/api/events`)
- `GET /events` - Lista de eventos

#### Admin (`/api/admin`)
- `POST /admin/reset-database` - Resetear base de datos
- `POST /admin/seed` - Sembrar datos de ejemplo

### 🏷️ Schemas Incluidos
- **User**: Estructura de usuario
- **Song**: Estructura de canción
- **Location**: Estructura de ubicación
- **Event**: Estructura de evento
- **Playlist**: Estructura de playlist
- **DashboardStats**: Estadísticas del dashboard
- **Error**: Estructura de errores

## Configuración Técnica

### Dependencias
```json
{
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.1",
  "@types/swagger-jsdoc": "^6.0.4",
  "@types/swagger-ui-express": "^4.1.6"
}
```

### Archivos de Configuración
- **Configuración**: `backend/src/config/swagger.ts`
- **Integración**: `backend/src/index.ts`

## Uso de la Documentación

### 1. Explorar Endpoints
- Navegar por las diferentes categorías (tags)
- Ver parámetros requeridos y opcionales
- Revisar ejemplos de respuesta

### 2. Probar APIs
- Usar el botón "Try it out"
- Completar parámetros requeridos
- Ejecutar directamente desde la interfaz

### 3. Autenticación
1. Registrarse o hacer login usando `/auth/register` o `/auth/login`
2. Copiar el token JWT de la respuesta
3. Hacer clic en "Authorize" en la parte superior
4. Pegar el token con formato: `Bearer [TOKEN]`
5. Usar endpoints protegidos

### 4. Endpoints de Admin
Los endpoints `/admin/reset-database` y `/admin/seed` requieren:
- Autenticación JWT
- Rol de ADMIN
- ⚠️ **CUIDADO**: El reset elimina todos los datos

## Personalización

### Agregar Nuevos Endpoints
1. Agregar comentarios JSDoc en las rutas:
```typescript
/**
 * @swagger
 * /mi-endpoint:
 *   get:
 *     summary: Descripción del endpoint
 *     tags: [MiCategoria]
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 */
```

2. El sistema automáticamente los incluirá en la documentación

### Modificar Configuración
Editar `backend/src/config/swagger.ts` para:
- Cambiar información del API
- Agregar nuevos schemas
- Modificar configuración de seguridad

## Notas Importantes

- 🔄 La documentación se actualiza automáticamente al reiniciar el servidor
- 🚀 Disponible solo en modo desarrollo
- 🔒 Endpoints protegidos requieren autenticación previa
- 📝 Los schemas están definidos en el archivo de configuración

## Soporte

Para problemas con la documentación:
1. Verificar que el servidor esté ejecutándose
2. Comprobar la URL de acceso
3. Revisar logs del servidor para errores
4. Validar sintaxis de comentarios JSDoc
