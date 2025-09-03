# RESPALDO COMPLETO DEL SINCRONIZADOR DE LETRAS v0.8.0

## FECHA: 2025-09-03
## PROPÓSITO: Backup completo antes de revertir cambios para preservar funcionalidad del sincronizador

---

## 1. FUNCIONALIDADES IMPLEMENTADAS

### A) Sincronización Automática
- Detección automática de líneas de letras basada en tiempo de reproducción
- Scroll automático hacia la línea activa
- Resaltado visual de la línea actual
- Suavizado de transiciones entre líneas

### B) Controles de Usuario
- Botón de toggle para activar/desactivar sincronización automática
- Indicador visual del estado (activo/inactivo)
- Persistencia del estado en localStorage

### C) Visualización Mejorada
- Línea activa con background destacado
- Smooth scroll hacia líneas activas
- Animaciones de transición suaves
- Responsive design para mobile y desktop

---

## 2. ARCHIVOS MODIFICADOS Y FUNCIONES CLAVE

### A) StickyPlayer.tsx - FUNCIONES DEL SINCRONIZADOR

```typescript
// ESTADO DEL SINCRONIZADOR
const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
  const saved = localStorage.getItem('lyrics-auto-sync');
  return saved !== null ? JSON.parse(saved) : true;
});

// FUNCIÓN DE TOGGLE
const toggleAutoSync = () => {
  const newValue = !autoSyncEnabled;
  setAutoSyncEnabled(newValue);
  localStorage.setItem('lyrics-auto-sync', JSON.stringify(newValue));
};

// EFECTO DE SINCRONIZACIÓN AUTOMÁTICA
useEffect(() => {
  if (!autoSyncEnabled || !displayLyrics || displayLyrics.length === 0) return;

  const currentLineIndex = displayLyrics.findIndex((lyric, index) => {
    const nextLyric = displayLyrics[index + 1];
    return currentTime >= lyric.timestamp && 
           (!nextLyric || currentTime < nextLyric.timestamp);
  });

  if (currentLineIndex !== -1 && currentLineIndex !== activeLineIndex) {
    setActiveLineIndex(currentLineIndex);
    
    // Scroll automático hacia la línea activa
    setTimeout(() => {
      const activeElement = document.querySelector(`[data-line-index="${currentLineIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  }
}, [currentTime, displayLyrics, autoSyncEnabled, activeLineIndex]);

// BOTÓN DE CONTROL EN LA INTERFAZ
<button
  onClick={toggleAutoSync}
  className={`control-button ${autoSyncEnabled ? 'control-button--active' : ''}`}
  title={autoSyncEnabled ? 'Desactivar sincronización automática' : 'Activar sincronización automática'}
>
  <ArrowPathIcon className="control-button__icon" />
</button>
```

### B) RENDERIZADO DE LETRAS CON SINCRONIZACIÓN

```typescript
// RENDERIZADO EN DESKTOP
{currentLyrics && currentLyrics.length > 0 && (
  <div className="desktop-lyrics-panel">
    <div className="desktop-lyrics-header">
      <h3>Letras</h3>
      <button
        onClick={toggleAutoSync}
        className={`control-button ${autoSyncEnabled ? 'control-button--active' : ''}`}
        title={autoSyncEnabled ? 'Desactivar sincronización automática' : 'Activar sincronización automática'}
      >
        <ArrowPathIcon className="control-button__icon" />
      </button>
    </div>
    <div className="desktop-lyrics-content">
      {displayLyrics.map((lyric, index) => (
        <p 
          key={index}
          data-line-index={index}
          className={`desktop-lyrics-line ${
            autoSyncEnabled && index === activeLineIndex ? 'desktop-lyrics-line--active' : ''
          }`}
        >
          {lyric.text}
        </p>
      ))}
    </div>
  </div>
)}

// RENDERIZADO EN MOBILE
{showLyrics && currentLyrics && currentLyrics.length > 0 && (
  <div className="mobile-lyrics-fullscreen">
    <div className="mobile-lyrics-header">
      <button onClick={() => setShowLyrics(false)}>
        <XMarkIcon className="w-6 h-6" />
      </button>
      <h2>Letras</h2>
      <button
        onClick={toggleAutoSync}
        className={`control-button ${autoSyncEnabled ? 'control-button--active' : ''}`}
      >
        <ArrowPathIcon className="control-button__icon" />
      </button>
    </div>
    <div className="mobile-lyrics-content">
      {displayLyrics.map((lyric, index) => (
        <p 
          key={index}
          data-line-index={index}
          className={`mobile-lyrics-line ${
            autoSyncEnabled && index === activeLineIndex ? 'mobile-lyrics-line--active' : ''
          }`}
        >
          {lyric.text}
        </p>
      ))}
    </div>
  </div>
)}
```

---

## 3. ESTILOS CSS DEL SINCRONIZADOR

### A) Clases para líneas activas
```css
.desktop-lyrics-line--active,
.mobile-lyrics-line--active {
  background-color: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  padding-left: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.desktop-lyrics-line,
.mobile-lyrics-line {
  transition: all 0.3s ease;
  scroll-margin: 2rem;
}
```

### B) Botón de sincronización
```css
.control-button--active {
  background-color: #dbeafe;
  color: #2563eb;
}

.control-button--active:hover {
  background-color: #bfdbfe;
}
```

---

## 4. IMPORTS NECESARIOS

```typescript
import {
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  ArrowPathIcon as ArrowPathIconSolid
} from '@heroicons/react/24/solid';
```

---

## 5. VARIABLES DE ESTADO REQUERIDAS

```typescript
const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
  const saved = localStorage.getItem('lyrics-auto-sync');
  return saved !== null ? JSON.parse(saved) : true;
});
const [activeLineIndex, setActiveLineIndex] = useState(-1);
```

---

## 6. UBICACIONES EXACTAS EN EL COMPONENTE

### A) Botón en controles adicionales (desktop):
- Línea aproximada: ~950 en additional-controls
- Después del botón de cola

### B) Botón en header de letras (desktop):
- En desktop-lyrics-header junto al título "Letras"

### C) Botón en header mobile:
- En mobile-lyrics-header junto al botón de cerrar

### D) UseEffect de sincronización:
- Después de otros useEffect relacionados con letras
- Antes del renderizado del componente

---

## 7. DEPENDENCIAS Y LÓGICA

### A) Dependencias del useEffect:
```typescript
[currentTime, displayLyrics, autoSyncEnabled, activeLineIndex]
```

### B) Condiciones de activación:
- autoSyncEnabled debe ser true
- displayLyrics debe existir y tener contenido
- currentTime debe cambiar

### C) Lógica de detección de línea:
- Busca línea actual basada en timestamp
- Compara con línea siguiente para determinar rango
- Actualiza activeLineIndex solo si hay cambio

---

## 8. COMPORTAMIENTO ESPERADO

### A) Al activar sincronización:
1. Icono cambia a estado activo (azul)
2. Se guarda preferencia en localStorage
3. Comienza seguimiento automático de líneas

### B) Durante reproducción con sync activo:
1. Línea actual se resalta con background azul claro
2. Borde izquierdo azul en línea activa
3. Scroll automático y suave hacia línea actual
4. Transiciones animadas entre líneas

### C) Al desactivar sincronización:
1. Icono vuelve a estado normal
2. Se detiene el scroll automático
3. Líneas mantienen formato normal
4. Preferencia se guarda como desactivada

---

## NOTAS IMPORTANTES PARA RESTAURACIÓN:

1. **NO TOCAR** el layout principal del reproductor (player-layout)
2. **MANTENER INTACTO** el CSS del sticky-player base
3. **SOLO AGREGAR** funcionalidad de sincronización sin modificar estructura existente
4. **VERIFICAR** que los imports de Heroicons están correctos
5. **TESTING** completo antes de confirmar que funciona

---

Este backup contiene TODA la funcionalidad del sincronizador que debe ser restaurada después del revert.
