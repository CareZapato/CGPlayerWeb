# INSTRUCCIONES DE RESTAURACIÓN POST-REVERT

## PROBLEMA ACTUAL
El reproductor principal tiene problemas de alineación visual que necesitan ser revertidos.
El sincronizador de letras funciona correctamente y debe ser preservado.

## PASOS PARA RESTAURACIÓN TRAS REVERT

### 1. VERIFICAR QUE EXISTE LA FUNCIONALIDAD BÁSICA
Buscar en `StickyPlayer.tsx` estas líneas específicas:

```typescript
const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
```

### 2. SI NO EXISTE, RESTAURAR ESTADO
Agregar dentro del componente `LyricsViewerInline`:
```typescript
const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
const activeLineRef = useRef<HTMLParagraphElement>(null);
```

### 3. VERIFICAR USEEFFECTS DE SINCRONIZACIÓN
Debe existir este useEffect (buscar "syncStatus.hasRealSyncData"):
```typescript
useEffect(() => {
  if (!syncStatus.hasRealSyncData || !isPlaying) {
    setActiveLineIndex(-1);
    return;
  }

  const activeIndex = filteredLyrics.findIndex((lyric, index) => {
    const nextLyric = filteredLyrics[index + 1];
    const currentStart = lyric.startTime || 0;
    const nextStart = nextLyric?.startTime || Infinity;
    
    return currentTime >= currentStart && currentTime < nextStart;
  });

  if (activeIndex !== activeLineIndex) {
    setActiveLineIndex(activeIndex);
  }
}, [currentTime, filteredLyrics, syncStatus.hasRealSyncData, isPlaying, activeLineIndex]);
```

### 4. VERIFICAR AUTO-SCROLL
Debe existir este useEffect para scroll automático:
```typescript
useEffect(() => {
  if (activeLineRef.current && activeLineIndex !== -1) {
    activeLineRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}, [activeLineIndex]);
```

### 5. VERIFICAR RENDERIZADO
En el renderizado de letras sincronizadas, buscar líneas como:
```typescript
<p
  key={index}
  ref={index === activeLineIndex ? activeLineRef : undefined}
  className={`alguna-clase ${index === activeLineIndex ? 'clase-activa' : ''}`}
  onClick={() => handleLineClick(lyric)}
>
  {lyric.text}
</p>
```

### 6. AGREGAR CSS SI FALTA
Si no hay estilos para línea activa, agregar:
```css
.lyrics-line--active,
.desktop-lyrics-line--active,
.mobile-lyrics-line--active {
  background-color: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  padding-left: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.lyrics-line,
.desktop-lyrics-line,
.mobile-lyrics-line {
  transition: all 0.3s ease;
  scroll-margin: 2rem;
  cursor: pointer;
}
```

### 7. TESTING
Verificar que:
- [x] Las letras se resaltan automáticamente durante reproducción
- [x] El scroll automático funciona
- [x] Se puede hacer click en líneas para saltar en la canción
- [x] El reproductor principal NO está roto visualmente

## ARCHIVOS A REVISAR POST-REVERT
1. `frontend/src/components/Player/StickyPlayer.tsx` - Funcionalidad principal
2. `frontend/src/components/Player/StickyPlayer.css` - Estilos de sincronización
3. Verificar que el layout del reproductor esté intacto

## SEÑALES DE ÉXITO
- Reproductor principal se ve normal (botones alineados, título visible)
- Letras se sincronizan automáticamente
- Scroll automático funciona
- Click en letras permite navegación
