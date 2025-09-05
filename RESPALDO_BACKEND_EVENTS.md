# 🚀 RESPALDO RUTAS BACKEND EVENTOS - CGPlayerWeb

## 📂 Archivo: backend/src/routes/events.ts (1319 líneas)

### 🔧 Configuración Principal:
```typescript
import express from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import multer from 'multer';

const router = express.Router();
const prisma = new PrismaClient();

// Multer para upload de imágenes
const uploadsDir = path.join(__dirname, '../../uploads/events');
const storage = multer.diskStorage({...});
const upload = multer({ storage, fileFilter, limits: { fileSize: 5MB } });
```

### 🎯 ENDPOINTS CRÍTICOS IMPLEMENTADOS:

#### 1. **GET /api/events** - Lista todos los eventos (admin/director)
```typescript
router.get('/', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  // Incluye: location, creator, attendees, joinRequests, _count
  // OrderBy: date asc
  // Respuesta: { success: true, data: events }
});
```

#### 2. **GET /api/events/management/all** - Alias para gestión completa
```typescript
router.get('/management/all', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  // Misma funcionalidad que GET /events
  // Incluye estadísticas completas
});
```

#### 3. **POST /api/events** - Crear nuevo evento
```typescript
router.post('/', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), upload.single('image'), async (req, res) => {
  // Campos: title*, date*, description, time, category, locationId, 
  //         eventCity, eventAddress, isPublic, allowExternalJoin
  // Soporte para: upload de imagen, asistentes individuales, coros completos
  // Validación: título y fecha obligatorios
});
```

#### 4. **GET /api/events/locations/singers** - Ubicaciones con cantantes completos
```typescript
router.get('/locations/singers', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  // Incluye: users activos con roles CANTANTE/DIRECTOR
  // Estadísticas: voiceTypeDistribution, roleDistribution, experienceDistribution
  // Datos enriquecidos: fullName, primaryRole, primaryVoiceType, totalEvents
});
```

#### 5. **GET /api/events/search/singers** - Búsqueda avanzada de cantantes
```typescript
router.get('/search/singers', authenticateToken, requireRole(['ADMIN', 'DIRECTOR']), async (req, res) => {
  // Parámetros: query, locationId, voiceType, role, limit
  // Búsqueda por: firstName, lastName, email, username
  // Filtros: ubicación, tipo de voz, rol
  // Respuesta enriquecida con estadísticas
});
```

#### 6. **GET /api/events/public** - Eventos públicos
```typescript
router.get('/public', async (req, res) => {
  // Solo eventos: isPublic=true, allowExternalJoin=true, date>=hoy
  // Sin autenticación requerida
});
```

#### 7. **GET /api/events/my** - Eventos del usuario
```typescript
router.get('/my', authenticateToken, async (req, res) => {
  // Eventos donde el usuario es: creador O asistente
});
```

### 🎨 ESTRUCTURA DE RESPUESTA TÍPICA:

#### **Evento Completo:**
```typescript
{
  id: string,
  title: string,
  description?: string,
  date: string,
  time?: string,
  category: string,
  eventCity?: string,
  eventAddress?: string,
  imageUrl?: string,
  isPublic: boolean,
  allowExternalJoin: boolean,
  location?: { id, name, city, region, country },
  creator?: { firstName, lastName },
  attendees: [{ user: { firstName, lastName, location }, status }],
  joinRequests: [{ user: { firstName, lastName }, status }],
  _count: { attendees: number, joinRequests: number }
}
```

#### **Singer Enriquecido:**
```typescript
{
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  fullName: string,
  primaryRole: string,
  primaryVoiceType: string,
  totalEvents: number,
  isExperienced: boolean,
  location: { id, name, city },
  assignedRoles: [{ role, createdAt }],
  voiceProfiles: [{ voiceType, createdAt }]
}
```

### 🔒 AUTENTICACIÓN Y AUTORIZACIÓN:
- **authenticateToken**: Middleware para validar JWT
- **requireRole(['ADMIN', 'DIRECTOR'])**: Control de acceso por roles
- **UserRole.CANTANTE, UserRole.DIRECTOR**: Roles válidos para eventos

### 📊 FUNCIONALIDADES AVANZADAS:

#### **Upload de Imágenes:**
- Directorio: `uploads/events/`
- Formato: `event-{timestamp}-{random}.{ext}`
- Límite: 5MB
- Tipos: solo imágenes

#### **Gestión de Asistentes:**
- Asistentes individuales: `attendeeUserIds` (JSON array)
- Coros completos: `choirLocationIds` (JSON array)
- Estado automático: `CONFIRMED`
- Prevención de duplicados

#### **Búsqueda y Filtros:**
- Búsqueda insensible a mayúsculas
- Filtros múltiples combinables
- Ordenamiento personalizable
- Paginación con límites

#### **Estadísticas de Coros:**
```typescript
stats: {
  totalSingers: number,
  voiceTypeDistribution: { soprano: n, contralto: n, ... },
  roleDistribution: { CANTANTE: n, DIRECTOR: n },
  experienceDistribution: { novice: n, beginner: n, intermediate: n, experienced: n },
  averageEventsPerSinger: number
}
```

### 🛠️ DEPENDENCIAS CRÍTICAS:
- **Prisma ORM**: Interacción con base de datos
- **Express Router**: Rutas modulares
- **Multer**: Upload de archivos
- **JWT Auth Middleware**: Autenticación
- **TypeScript**: Tipado fuerte

### 🚀 INSTRUCCIONES DE RESTAURACIÓN:

1. **Instalar dependencias:**
   ```bash
   npm install express @prisma/client multer
   npm install -D @types/express @types/multer
   ```

2. **Crear directorio uploads:**
   ```bash
   mkdir -p backend/uploads/events
   ```

3. **Configurar middleware auth:**
   - Verificar `../middleware/auth.ts` existe
   - Funciones: `authenticateToken`, `requireRole`

4. **Registrar rutas en app principal:**
   ```typescript
   app.use('/api/events', eventsRouter);
   ```

5. **Verificar esquema Prisma:**
   - Modelo `Event` con campos completos
   - Modelo `EventAttendee` para asistentes
   - Modelo `User` con roles y ubicaciones

### ⚡ ENDPOINTS PARA TESTING:
- `GET /api/events/management/all` (lista eventos)
- `GET /api/events/locations/singers` (ubicaciones con cantantes)
- `GET /api/events/search/singers?query=nombre` (búsqueda)
- `POST /api/events` (crear evento con FormData)

### 📝 NOTAS IMPORTANTES:
- Todas las rutas requieren autenticación JWT
- Solo ADMIN y DIRECTOR pueden gestionar eventos
- Upload de imágenes opcional pero funcional
- Sistema completo de estadísticas implementado
- Búsqueda avanzada con múltiples filtros
- Soporte para selección individual y grupal de cantantes
