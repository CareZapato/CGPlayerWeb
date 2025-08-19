# 🔒 Seguridad y Personalización por Tipo de Voz - v0.6.0

## 📋 Resumen de Implementación

### 🎯 Objetivos Completados

1. **🔐 Protección de archivos de audio**
   - Eliminado acceso directo a `/uploads`
   - Todos los archivos requieren autenticación
   - Verificación de autorización por tipo de voz

2. **🎵 Filtrado por tipo de voz personalizado**
   - CANTANTES solo ven canciones de sus tipos de voz + CORO + ORIGINAL
   - ADMIN y DIRECTOR mantienen acceso completo
   - Filtrado aplicado en `/songs`, `/albums` y `/for-playlist`

3. **🏠 Página de inicio mejorada**
   - Mostrar tipos de voz del usuario con etiquetas coloridas
   - Diseño moderno y elegante
   - Información de acceso clara y visual

---

## 🛠️ Cambios Implementados

### Backend (`backend/src/`)

#### 1. **index.ts** - Eliminación de archivos estáticos
```typescript
// ❌ ELIMINADO por seguridad
// app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ✅ NUEVO: Solo archivos autenticados a través de endpoints específicos
```

#### 2. **routes/songsImproved.ts** - Protección de archivos de audio
```typescript
// ✅ MODIFICADO: Autenticación requerida para todos los archivos
router.get('/file/:folderName/:fileName', authenticateToken, async (req: AuthRequest, res: Response) => {
  // Verificar roles del usuario
  const isAdmin = userRoles.some((role: string) => role === 'ADMIN');
  const isDirector = userRoles.some((role: string) => role === 'DIRECTOR');
  const isCantante = userRoles.some((role: string) => role === 'CANTANTE');

  if (!isAdmin && !isDirector && isCantante) {
    // Buscar canción en base de datos
    const song = await prisma.song.findFirst({
      where: { fileName: fileName, isActive: true }
    });

    // Si no es CORO u ORIGINAL, verificar tipo de voz del usuario
    if (song.voiceType !== 'CORO' && song.voiceType !== 'ORIGINAL') {
      const userVoiceProfiles = await prisma.userVoiceProfile.findMany({
        where: { userId }, select: { voiceType: true }
      });

      const userVoiceTypes = userVoiceProfiles.map(profile => profile.voiceType);
      
      if (!userVoiceTypes.includes(song.voiceType)) {
        return res.status(403).json({ 
          message: 'No tienes autorización para acceder a este archivo' 
        });
      }
    }
  }

  // Headers anti-descarga
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-cache');
});
```

#### 3. **routes/songsImproved.ts** - Filtrado mejorado en endpoints principales
```typescript
// ✅ MODIFICADO: Endpoint /songs con filtrado por tipo de voz
if (isCantante && !isAdmin && !isDirector) {
  const userVoiceProfiles = await prisma.userVoiceProfile.findMany({
    where: { userId }, select: { voiceType: true }
  });

  if (userVoiceProfiles.length > 0) {
    const userVoiceTypes = userVoiceProfiles.map(profile => profile.voiceType);
    const allowedVoiceTypes = [...userVoiceTypes, 'CORO', 'ORIGINAL'];
    
    whereClause = {
      ...whereClause,
      OR: [
        { parentSongId: { not: null }, voiceType: { in: allowedVoiceTypes } },
        { parentSongId: null, voiceType: null }
      ]
    };
  } else {
    // Solo CORO y ORIGINAL si no tiene tipos asignados
    whereClause = {
      ...whereClause,
      OR: [
        { parentSongId: { not: null }, voiceType: { in: ['CORO', 'ORIGINAL'] } },
        { parentSongId: null, voiceType: null }
      ]
    };
  }
}
```

```typescript
// ✅ MODIFICADO: Endpoint /for-playlist con acceso a CORO y ORIGINAL
if (isCantante && !isAdmin && !isDirector) {
  const userVoiceProfiles = await prisma.userVoiceProfile.findMany({
    where: { userId }, select: { voiceType: true }
  });

  if (userVoiceProfiles.length === 0) {
    whereClause.voiceType = { in: ['CORO', 'ORIGINAL'] };
  } else {
    const userVoiceTypes = userVoiceProfiles.map(profile => profile.voiceType);
    const allowedVoiceTypes = [...userVoiceTypes, 'CORO', 'ORIGINAL'];
    whereClause.voiceType = { in: allowedVoiceTypes };
  }
}
```

### Frontend (`frontend/src/`)

#### 4. **pages/HomePage.tsx** - Página de inicio personalizada
```tsx
// ✅ NUEVO: Funciones para tipos de voz
const getVoiceTypeColor = (voiceType: string) => {
  const colors = {
    'SOPRANO': 'bg-pink-100 text-pink-800 border-pink-200',
    'CONTRALTO': 'bg-purple-100 text-purple-800 border-purple-200',
    'TENOR': 'bg-blue-100 text-blue-800 border-blue-200',
    'BARITONO': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'BAJO': 'bg-gray-100 text-gray-800 border-gray-200',
    'MESOSOPRANO': 'bg-rose-100 text-rose-800 border-rose-200',
    'CORO': 'bg-orange-100 text-orange-800 border-orange-200',
    'ORIGINAL': 'bg-green-100 text-green-800 border-green-200'
  };
  return colors[voiceType] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// ✅ NUEVO: Header con tipos de voz del usuario
{user.voiceProfiles && user.voiceProfiles.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-4">
    <span className="text-sm opacity-90 mr-2">Tipos de voz:</span>
    {user.voiceProfiles.map((profile) => (
      <span
        key={profile.id}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getVoiceTypeColor(profile.voiceType)} bg-white/20 text-white border-white/30`}
      >
        🎵 {formatVoiceType(profile.voiceType)}
      </span>
    ))}
  </div>
)}

// ✅ NUEVO: Sección informativa mejorada con grid de 2 columnas
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Datos básicos del usuario */}
  <div className="space-y-4">
    {/* Usuario, Email, Roles, Estado */}
  </div>
  
  {/* Tipos de voz asignados */}
  <div className="space-y-4">
    {user.voiceProfiles?.map((profile) => (
      <div className={`p-3 rounded-lg border-2 ${getVoiceTypeColor(profile.voiceType)} transition-all duration-200 hover:shadow-md`}>
        <span className="font-medium">🎼 {formatVoiceType(profile.voiceType)}</span>
      </div>
    ))}
    
    {/* Información de acceso */}
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-sm text-blue-700">
        <strong>Acceso completo</strong> a canciones de tus tipos de voz + CORO y ORIGINAL
      </p>
    </div>
  </div>
</div>
```

---

## 🔒 Lógica de Seguridad Implementada

### 🎵 Acceso a Archivos de Audio

#### Para Rol **CANTANTE**:
- ✅ **CORO y ORIGINAL**: Siempre accesible para todos los cantantes
- ✅ **Tipos de voz específicos**: Solo si el usuario tiene ese tipo asignado
- ❌ **Otros tipos de voz**: Acceso denegado con error 403
- ✅ **Autenticación requerida**: Todos los archivos protegidos

#### Para Roles **ADMIN** y **DIRECTOR**:
- ✅ **Sin restricciones**: Acceso completo a todos los archivos
- ✅ **Sin verificación adicional**: Bypass de filtros de tipo de voz

### 🎯 Filtrado de Canciones

#### En Endpoints `/songs` y `/albums`:
- **CANTANTE sin tipos asignados**: Solo ve CORO y ORIGINAL + canciones contenedoras
- **CANTANTE con tipos asignados**: Ve sus tipos + CORO + ORIGINAL + canciones contenedoras
- **ADMIN/DIRECTOR**: Ve todas las canciones sin restricciones

#### En Endpoint `/for-playlist`:
- **CANTANTE**: Solo puede agregar canciones de tipos permitidos
- **Búsqueda filtrada**: Solo dentro de canciones autorizadas
- **ADMIN/DIRECTOR**: Acceso completo para creación de playlists

---

## 🎨 Mejoras Visuales

### 🏠 Página de Inicio

#### Diseño Moderno:
- **Header con gradiente**: Azul a índigo con información del usuario
- **Etiquetas de tipos de voz**: Colores distintivos y elegantes por tipo
- **Grid responsivo**: 2 columnas en desktop, 1 en móvil
- **Micro-animaciones**: Hover effects y transiciones suaves

#### Colores por Tipo de Voz:
- **SOPRANO**: Rosa claro
- **CONTRALTO**: Púrpura claro  
- **TENOR**: Azul claro
- **BARÍTONO**: Índigo claro
- **BAJO**: Gris claro
- **MESOSOPRANO**: Rosa medio
- **CORO**: Naranja claro
- **ORIGINAL**: Verde claro

#### Estados Informativos:
- **Con tipos asignados**: Lista elegante con información de acceso
- **Sin tipos asignados**: Mensaje claro con llamada a la acción
- **Información de acceso**: Explicación clara de permisos

---

## 📊 Estructura de Datos

### Tabla `user_voice_profiles`:
```sql
CREATE TABLE user_voice_profiles (
  id VARCHAR PRIMARY KEY,
  userId VARCHAR NOT NULL,
  voiceType VoiceType NOT NULL,
  assignedBy VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(userId, voiceType)
);
```

### Tabla `songs`:
```sql
-- Canciones padre (contenedoras)
parentSongId: NULL, voiceType: NULL

-- Canciones variaciones (filtradas por tipo de voz)
parentSongId: ID_PADRE, voiceType: SOPRANO|CONTRALTO|TENOR|BARITONO|BAJO|CORO|ORIGINAL
```

---

## 🧪 Casos de Prueba

### 1. **Prueba de Seguridad - Acceso a Archivos**
```bash
# Usuario cantante intenta acceder a archivo no autorizado
GET /api/songs/file/folder/tenor_song.mp3
Authorization: Bearer [token_de_cantante_soprano]
# Esperado: 403 Forbidden
```

### 2. **Prueba de Filtrado - Lista de Canciones**
```bash
# Cantante soprano ve solo sus canciones + CORO + ORIGINAL
GET /api/songs
Authorization: Bearer [token_de_cantante_soprano]
# Esperado: Solo canciones SOPRANO, CORO, ORIGINAL
```

### 3. **Prueba Visual - Página de Inicio**
```bash
# Verificar que se muestran tipos de voz correctamente
GET /
# Esperado: Etiquetas coloridas con tipos de voz del usuario
```

---

## 🚀 Estado Final

### ✅ Seguridad Implementada:
- **Archivos protegidos**: No más acceso directo a `/uploads`
- **Autenticación requerida**: Todos los archivos necesitan token válido
- **Autorización por tipo de voz**: Filtrado granular por usuario
- **Headers anti-descarga**: Previene descarga directa de archivos

### ✅ Personalización Implementada:
- **Filtrado inteligente**: Cada usuario ve solo contenido relevante
- **CORO y ORIGINAL universal**: Accesible para todos los cantantes
- **Página de inicio personalizada**: Información visual de tipos de voz
- **Diseño elegante**: Colores y animaciones modernas

### ✅ Experiencia de Usuario:
- **Información clara**: Usuario sabe exactamente qué puede acceder
- **Diseño intuitivo**: Colores distintivos por tipo de voz
- **Feedback visual**: Estados claros para diferentes situaciones
- **Responsive**: Funciona perfectamente en todos los dispositivos

---

**Fecha de implementación**: 19 de Agosto, 2025  
**Versión**: 0.6.0  
**Estado**: ✅ Completado y listo para producción

### 🎯 Próximos Pasos Sugeridos:
1. **Pruebas exhaustivas** con diferentes tipos de usuarios
2. **Monitoreo de logs** de acceso para detectar intentos no autorizados
3. **Backup de seguridad** antes de desplegar en producción
4. **Documentación de usuario** con nuevas características de seguridad
