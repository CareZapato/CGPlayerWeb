# 🎵 FUNCIONALIDAD COMPLETA PARA AGREGAR CANTANTES A EVENTOS

## 🚀 ENDPOINTS IMPLEMENTADOS PARA GESTIÓN DE CANTANTES

### 1. 🔍 **BÚSQUEDA AVANZADA DE CANTANTES**
**Endpoint**: `GET /api/events/search/singers`
**Autenticación**: ADMIN, DIRECTOR

#### ✨ **Filtros Disponibles:**
- `query`: Búsqueda por nombre, apellido, email, username
- `locationId`: Filtrar por ubicación/coro específico
- `voiceType`: Filtrar por tipo de voz (SOPRANO, TENOR, etc.)
- `role`: Filtrar por rol (CANTANTE, DIRECTOR)
- `limit`: Número de resultados (por defecto 50)

#### 📊 **Datos Retornados por Cantante:**
```json
{
  "id": "user_id",
  "firstName": "María",
  "lastName": "González", 
  "fullName": "María González",
  "email": "maria@example.com",
  "username": "maria_g",
  "phone": "+56912345678",
  "primaryRole": "CANTANTE",
  "allRoles": ["CANTANTE"],
  "primaryVoiceType": "SOPRANO",
  "allVoiceTypes": ["SOPRANO"],
  "location": {
    "id": "loc_id",
    "name": "Iglesia Central",
    "address": "Av. Principal 123",
    "city": "Santiago"
  },
  "assignedRoles": [...],
  "voiceProfiles": [...],
  "eventAttendees": [...],
  "_count": {
    "eventAttendees": 12,
    "songAssignments": 5,
    "soloPerformances": 2
  },
  "fullName": "María González",
  "primaryRole": "CANTANTE",
  "primaryVoiceType": "SOPRANO",
  "totalEvents": 12,
  "recentEvents": 3,
  "isExperienced": true,
  "lastEventDate": "2025-08-15T..."
}
```

#### 🎯 **Ejemplo de Uso:**
```bash
# Buscar cantantes por nombre
GET /api/events/search/singers?query=maria

# Buscar sopranos de una iglesia específica
GET /api/events/search/singers?locationId=church_1&voiceType=SOPRANO

# Buscar directores experimentados
GET /api/events/search/singers?role=DIRECTOR&limit=20
```

---

### 2. 🏛️ **CANTANTES POR UBICACIÓN/CORO**
**Endpoint**: `GET /api/events/locations/singers`
**Autenticación**: ADMIN, DIRECTOR

#### ✨ **Parámetros:**
- `includeStats`: true/false - Incluir estadísticas detalladas

#### 📊 **Datos Retornados por Ubicación:**
```json
{
  "id": "location_id",
  "name": "Iglesia Central Santiago",
  "address": "Av. Principal 123",
  "city": "Santiago",
  "country": "Chile",
  "singers": [
    {
      "id": "user_id",
      "fullName": "María González",
      "primaryRole": "CANTANTE",
      "primaryVoiceType": "SOPRANO",
      "allVoiceTypes": ["SOPRANO", "MESOSOPRANO"],
      "totalEvents": 12,
      "recentEvents": 3,
      "isExperienced": true,
      "lastEventDate": "2025-08-15T..."
    }
  ],
  "stats": {
    "totalSingers": 25,
    "voiceTypeDistribution": {
      "SOPRANO": 8,
      "CONTRALTO": 5,
      "TENOR": 7,
      "BARITONO": 5
    },
    "roleDistribution": {
      "CANTANTE": 23,
      "DIRECTOR": 2
    },
    "experienceDistribution": {
      "novice": 3,
      "beginner": 8,
      "intermediate": 9,
      "experienced": 5
    },
    "averageEventsPerSinger": 6
  }
}
```

---

### 3. 📋 **LISTA COMPLETA DE CANTANTES**
**Endpoint**: `GET /api/events/singers/all`
**Autenticación**: ADMIN, DIRECTOR

#### ✨ **Parámetros de Paginación:**
- `page`: Página actual (por defecto 1)
- `limit`: Cantantes por página (por defecto 100)
- `sortBy`: Campo para ordenar (firstName, lastName, etc.)
- `sortOrder`: asc/desc
- `includeInactive`: true/false - Incluir cantantes inactivos

#### 📊 **Datos Mega Completos por Cantante:**
```json
{
  "id": "user_id",
  "firstName": "María",
  "lastName": "González",
  "fullName": "María González",
  "email": "maria@example.com",
  "username": "maria_g",
  "phone": "+56912345678",
  "isActive": true,
  "createdAt": "2024-01-15T...",
  "updatedAt": "2025-09-01T...",
  "primaryRole": "CANTANTE",
  "allRoles": ["CANTANTE"],
  "primaryVoiceType": "SOPRANO",
  "allVoiceTypes": ["SOPRANO", "MESOSOPRANO"],
  "choirName": "Iglesia Central",
  "locationInfo": "Iglesia Central - Santiago, Chile",
  "location": {
    "id": "loc_id",
    "name": "Iglesia Central",
    "address": "Av. Principal 123",
    "city": "Santiago",
    "country": "Chile"
  },
  "stats": {
    "totalEvents": 12,
    "recentEvents": 3,
    "totalSongs": 25,
    "soloPerformances": 4,
    "playlists": 3,
    "lyricContributions": 2,
    "experienceLevel": "Experimentado",
    "isActive": true,
    "joinDate": "2024-01-15T...",
    "lastUpdate": "2025-09-01T..."
  },
  "recentActivity": {
    "lastEvents": [
      {
        "title": "Culto Domingo",
        "date": "2025-08-30T...",
        "status": "CONFIRMED"
      }
    ],
    "lastSongs": [
      {
        "title": "Amazing Grace",
        "artist": "Traditional",
        "assignedDate": "2025-08-25T..."
      }
    ],
    "lastSolos": [
      {
        "song": "How Great Thou Art - Traditional",
        "event": "Concierto Especial",
        "date": "2025-08-20T..."
      }
    ]
  },
  "assignedRoles": [...],
  "voiceProfiles": [...],
  "eventAttendees": [...],
  "songAssignments": [...],
  "soloPerformances": [...]
}
```

#### 📈 **Respuesta con Estadísticas Globales:**
```json
{
  "success": true,
  "data": [...], // Array de cantantes
  "pagination": {
    "current_page": 1,
    "per_page": 100,
    "total": 250,
    "total_pages": 3,
    "has_next_page": true,
    "has_prev_page": false
  },
  "summary": {
    "total_singers": 250,
    "active_singers": 230,
    "voice_type_distribution": {
      "SOPRANO": 62,
      "CONTRALTO": 45,
      "TENOR": 58,
      "BARITONO": 42,
      "MESOSOPRANO": 23,
      "BAJO": 20
    },
    "experience_distribution": {
      "novato": 45,
      "principiante": 78,
      "intermedio": 89,
      "experimentado": 38
    }
  }
}
```

---

### 4. ⚙️ **OPCIONES PARA FILTROS DINÁMICOS**
**Endpoint**: `GET /api/events/filters/options`
**Autenticación**: ADMIN, DIRECTOR

#### 📊 **Datos para Construir Filtros:**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": "loc_1",
        "name": "Iglesia Central",
        "city": "Santiago",
        "label": "Iglesia Central (25 cantantes)",
        "singersCount": 25
      }
    ],
    "voiceTypes": [
      { "value": "SOPRANO", "label": "SOPRANO" },
      { "value": "CONTRALTO", "label": "CONTRALTO" },
      { "value": "TENOR", "label": "TENOR" },
      { "value": "BARITONO", "label": "BARITONO" }
    ],
    "roles": [
      { "value": "CANTANTE", "label": "CANTANTE" },
      { "value": "DIRECTOR", "label": "DIRECTOR" }
    ],
    "experienceLevels": [
      { "value": "novato", "label": "Novato (0 eventos)" },
      { "value": "principiante", "label": "Principiante (1-2 eventos)" },
      { "value": "intermedio", "label": "Intermedio (3-5 eventos)" },
      { "value": "experimentado", "label": "Experimentado (5+ eventos)" }
    ]
  }
}
```

---

## 🎯 FUNCIONALIDADES PARA AGREGAR CANTANTES A EVENTOS

### 5. ➕ **AGREGAR ASISTENTES A EVENTO**
**Endpoint**: `POST /api/events/:id/attendees`
**Autenticación**: ADMIN, DIRECTOR

#### 🔥 **Dos Modalidades de Selección:**

##### 👤 **SELECCIÓN INDIVIDUAL:**
```json
{
  "userIds": ["user_1", "user_2", "user_3"]
}
```

##### 🎭 **SELECCIÓN POR CORO COMPLETO:**
```json
{
  "choirLocationIds": ["location_1", "location_2"]
}
```
**Automáticamente agrega TODOS los cantantes activos de esas ubicaciones**

##### 🔄 **SELECCIÓN MIXTA:**
```json
{
  "userIds": ["user_1", "user_2"],
  "choirLocationIds": ["location_1"]
}
```

#### ✅ **Respuesta:**
```json
{
  "success": true,
  "message": "15 asistente(s) agregado(s) exitosamente"
}
```

---

### 6. 🗑️ **REMOVER ASISTENTE INDIVIDUAL**
**Endpoint**: `DELETE /api/events/:id/attendees/:userId`
**Autenticación**: ADMIN, DIRECTOR

---

## 🎵 FLUJO COMPLETO DE USO

### 📱 **ESCENARIO 1: Búsqueda y Selección Individual**
```bash
# 1. Buscar cantantes por nombre
GET /api/events/search/singers?query=maria&limit=20

# 2. Seleccionar cantantes específicos y agregarlos
POST /api/events/event_123/attendees
{
  "userIds": ["user_1", "user_2", "user_3"]
}
```

### 🏛️ **ESCENARIO 2: Selección de Coro Completo**
```bash
# 1. Ver cantantes por ubicación
GET /api/events/locations/singers

# 2. Seleccionar coro completo
POST /api/events/event_123/attendees
{
  "choirLocationIds": ["iglesia_central"]
}
```

### 🔍 **ESCENARIO 3: Filtros Avanzados**
```bash
# 1. Obtener opciones para filtros
GET /api/events/filters/options

# 2. Buscar sopranos experimentadas de Santiago
GET /api/events/search/singers?voiceType=SOPRANO&locationId=santiago_1

# 3. Ver lista completa con paginación
GET /api/events/singers/all?page=1&limit=50&sortBy=firstName
```

---

## 📊 CARACTERÍSTICAS TÉCNICAS

### ✨ **DATOS MASIVOS INCLUIDOS:**
- ✅ **Información Personal**: Nombre, email, teléfono, username
- ✅ **Ubicación Completa**: Iglesia, ciudad, país, dirección
- ✅ **Roles y Voces**: Todos los roles asignados y tipos de voz
- ✅ **Historial de Eventos**: Últimos eventos, estado de asistencia
- ✅ **Asignaciones Musicales**: Canciones asignadas, solos realizados
- ✅ **Estadísticas**: Total eventos, nivel de experiencia, fechas importantes
- ✅ **Actividad Reciente**: Últimos eventos, canciones, solos
- ✅ **Contadores**: Playlists, contribuciones líricas, asignaciones

### 🚀 **CARACTERÍSTICAS AVANZADAS:**
- ✅ **Paginación**: Para listas grandes
- ✅ **Filtros Múltiples**: Combinables entre sí
- ✅ **Ordenamiento**: Por cualquier campo
- ✅ **Búsqueda Inteligente**: Por múltiples campos simultáneamente
- ✅ **Estadísticas Grupales**: Distribuciones y promedios
- ✅ **Datos Enriquecidos**: Información procesada y calculada
- ✅ **Deduplicación**: Evita cantantes duplicados
- ✅ **Validaciones**: Verificaciones de estado y permisos

### 📈 **RENDIMIENTO:**
- ✅ **Consultas Optimizadas**: Select específicos, joins eficientes
- ✅ **Límites de Resultados**: Control de carga de datos
- ✅ **Índices Prisma**: Consultas rápidas por ubicación, roles, voces
- ✅ **Caching Ready**: Estructura preparada para caché

**🎉 Sistema completo implementado con funcionalidad robusta para agregar cantantes individual y grupalmente a eventos, con datos masivos y filtros avanzados.**
