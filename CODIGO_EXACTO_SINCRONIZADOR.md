# CÓDIGO EXACTO DEL SINCRONIZADOR PARA RESTAURACIÓN

## 1. ESTADO DEL SINCRONIZADOR
```typescript
// Línea 168 - En el componente LyricsViewerInline
const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
```

## 2. LÓGICA DE DETECCIÓN DE LÍNEA ACTIVA
```typescript
// Líneas 355-380 - useEffect para encontrar línea activa
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

## 3. AUTO-SCROLL HACIA LÍNEA ACTIVA
```typescript
// Líneas 382-390 - useEffect para auto-scroll
useEffect(() => {
  if (activeLineRef.current && activeLineIndex !== -1) {
    activeLineRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}, [activeLineIndex]);
```

## 4. REFERENCIAS NECESARIAS
```typescript
// Debe existir esta ref para el scroll
const activeLineRef = useRef<HTMLParagraphElement>(null);
```

## 5. RENDERIZADO CON LÍNEA ACTIVA
```typescript
// En el renderizado de letras sincronizadas, usar:
<p
  key={index}
  ref={index === activeLineIndex ? activeLineRef : undefined}
  className={`lyrics-line ${index === activeLineIndex ? 'lyrics-line--active' : ''}`}
  onClick={() => handleLineClick(lyric)}
>
  {lyric.text}
</p>
```

## 6. ESTILOS CSS NECESARIOS
```css
.lyrics-line--active {
  background-color: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  padding-left: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.lyrics-line {
  transition: all 0.3s ease;
  scroll-margin: 2rem;
  cursor: pointer;
}
```

## 7. IMPORTS REQUERIDOS
- Ya están presentes en el archivo actual
- No se requieren imports adicionales para esta funcionalidad básica

## 8. UBICACIÓN EXACTA
- Componente: `LyricsViewerInline` dentro de `StickyPlayer.tsx`
- Estados: Dentro del componente LyricsViewerInline
- UseEffects: Después de otros useEffect de sincronización
- Renderizado: En las líneas de letras sincronizadas

## NOTA IMPORTANTE:
Esta es la versión BÁSICA del sincronizador que está funcionando actualmente.
NO incluye el botón de toggle manual, solo la sincronización automática básica.
