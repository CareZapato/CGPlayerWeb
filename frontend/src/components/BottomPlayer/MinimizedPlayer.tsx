import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import './BottomPlayer.css';

interface MinimizedPlayerProps {
  onExpand: () => void;
}

// Componente del basurero para drag-to-delete
interface TrashZoneProps {
  isVisible: boolean;
  isActive: boolean;
}

const TrashZone: React.FC<TrashZoneProps> = ({ isVisible, isActive }) => {
  if (!isVisible) {
    console.log('🗑️ TrashZone: OCULTO');
    return null;
  }

  const isMobile = window.innerWidth <= 768;
  console.log('🗑️ TrashZone: VISIBLE -', { isActive, isMobile });

  return (
    <div className={`trash-zone ${isActive ? 'trash-zone--active' : ''} ${isMobile ? 'trash-zone--mobile' : ''}`}>
      <div className="trash-zone__icon">
        <svg 
          className="trash-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
          strokeWidth={isMobile ? "2.5" : "2"}
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </div>
      {!isMobile && (
        <p className="trash-zone__text">
          {isActive ? 'Suelta para cerrar' : 'Arrastra aquí para cerrar'}
        </p>
      )}
    </div>
  );
};

/**
 * MinimizedPlayer - Versión minimizada del reproductor como esfera que se llena
 */
const MinimizedPlayer: React.FC<MinimizedPlayerProps> = ({ onExpand }) => {
  const { currentSong, isPlaying, currentTime, duration, closePlayer } = usePlayerStore();
  
  // Estados solo para arrastre
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Estados para drag-to-delete
  const [showTrashZone, setShowTrashZone] = useState(false);
  const [isOverTrashZone, setIsOverTrashZone] = useState(false);
  
  // Refs
  const playerRef = useRef<HTMLDivElement>(null);

  // Funciones de arrastre corregidas con drag-to-delete
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    console.log('🎯 Iniciando drag del reproductor minimizado');
    if (!playerRef.current) return;
    const rect = playerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setHasMoved(false);
    setShowTrashZone(false);
    setIsOverTrashZone(false);
    
    // Guardar el offset del mouse/touch respecto al elemento
    setDragStart({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    
    // En móvil, mostrar el basurero después de un breve delay para asegurar consistencia
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      setTimeout(() => {
        // Solo mostrar si todavía se está arrastrando
        setShowTrashZone(prev => {
          if (prev === false) {
            console.log('📱 Forzando aparición del basurero en móvil');
            return true;
          }
          return prev;
        });
      }, 150); // 150ms de delay
    }
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    setHasMoved(true);
    
    // Calcular nueva posición restando el offset inicial
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    // Calcular distancia desde la posición inicial para mostrar zona de eliminación
    const initialX = position.x;
    const initialY = position.y;
    const distance = Math.sqrt(Math.pow(newX - initialX, 2) + Math.pow(newY - initialY, 2));
    
    // Lógica mejorada: mostrar basurero con diferentes criterios para móvil y desktop
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // En móvil: mostrar basurero inmediatamente al detectar movimiento
      if (distance > 15 && !showTrashZone) {
        console.log('📱 Mostrando basurero en móvil - movimiento detectado:', distance);
        setShowTrashZone(true);
      }
    } else {
      // En desktop: usar lógica tradicional con distancia mayor
      const minDistance = 50;
      if (distance > minDistance && !showTrashZone) {
        console.log("���️ Mostrando basurero en desktop - movimiento detectado:", distance);
        setShowTrashZone(true);
      }
    }
    
    // Verificar si está sobre la zona de eliminación (optimizado para móvil)
    const trashZoneX = window.innerWidth / 2;
    const trashZoneY = isMobile ? window.innerHeight - 140 : window.innerHeight - 120;
    const distanceToTrash = Math.sqrt(Math.pow(clientX - trashZoneX, 2) + Math.pow(clientY - trashZoneY, 2));
    
    // Radio más grande en móvil para mejor usabilidad táctil
    const activationRadius = isMobile ? 80 : 60;
    const isOverTrash = distanceToTrash < activationRadius;
    
    if (isOverTrash !== isOverTrashZone) {
      console.log('🎯 Estado del basurero cambió:', isOverTrash ? 'SOBRE BASURERO' : 'FUERA DEL BASURERO', 'distancia:', distanceToTrash);
      
      // Retroalimentación háptica en móvil cuando entra en la zona
      if (isOverTrash && isMobile && 'vibrate' in navigator) {
        navigator.vibrate(50); // Vibración corta de 50ms
      }
    }
    
    setIsOverTrashZone(isOverTrash);
    
    // Obtener dimensiones del elemento según el dispositivo
    const elementSize = isMobile ? 56 : 64; // 3.5rem en móvil, 4rem en desktop
    const maxX = window.innerWidth - elementSize;
    const maxY = window.innerHeight - elementSize;
    
    // Aplicar límites para mantenerlo visible
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragStart.x, dragStart.y, position.x, position.y, showTrashZone, isOverTrashZone]);

  const handleDragEnd = useCallback(() => {
    const wasOverTrash = isOverTrashZone;
    const hadMoved = hasMoved;
    
    setIsDragging(false);
    setShowTrashZone(false);
    setIsOverTrashZone(false);
    
    // Si se soltó sobre la zona de eliminación, cerrar el reproductor
    if (wasOverTrash) {
      console.log('🗑️ Cerrando reproductor por drag-to-delete');
      closePlayer();
      return;
    }
    
    // Solo expandir si no hubo arrastre significativo
    if (!hadMoved) {
      setTimeout(() => {
        onExpand();
      }, 0);
    }
  }, [hasMoved, isOverTrashZone, closePlayer, onExpand]);

  // Eventos de mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleDragMove(e.clientX, e.clientY);
  }, [handleDragMove]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleDragEnd();
  }, [handleDragEnd]);

  // Eventos touch para móvil
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    console.log('📱 Touch start detectado en reproductor minimizado');
    e.stopPropagation();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    }
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Siempre prevenir el scroll cuando se está arrastrando
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    }
  }, [handleDragMove, isDragging]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    // Solo prevenir el default si realmente se arrastró
    if (hasMoved) {
      e.preventDefault();
    }
    handleDragEnd();
  }, [handleDragEnd, hasMoved]);

  // Inicializar posición por defecto (evita que se vaya a 0,0)
  useEffect(() => {
    if (!isInitialized && currentSong) {
      // Posición inicial en la esquina inferior derecha pero visible
      const isMobile = window.innerWidth <= 768;
      const elementSize = isMobile ? 56 : 64; // 3.5rem en móvil, 4rem en desktop
      const padding = isMobile ? 16 : 24; // 1rem en móvil, 1.5rem en desktop
      setPosition({
        x: window.innerWidth - elementSize - padding,
        y: window.innerHeight - elementSize - padding
      });
      setIsInitialized(true);
    }
  }, [isInitialized, currentSong]);

  // Efectos para eventos globales
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  if (!currentSong) return null;

  // Calcular progreso (0-1)
  const progress = duration > 0 ? currentTime / duration : 0;
  
  // Obtener inicial del título de la canción
  const initial = currentSong.title?.charAt(0)?.toUpperCase() || 'M';
  
  // Calcular el porcentaje de llenado (desde abajo hacia arriba)
  const fillPercentage = Math.min(Math.max(progress * 100, 0), 100);

  // Calcular stroke-dashoffset para el anillo de progreso
  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Zona de eliminación */}
      <TrashZone isVisible={showTrashZone} isActive={isOverTrashZone} />
      
      <div 
        ref={playerRef}
        className={`minimized-player ${isDragging ? 'minimized-player--dragging' : ''} ${isOverTrashZone ? 'minimized-player--over-trash' : ''}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isOverTrashZone ? 0.7 : 1,
          scale: isOverTrashZone ? '1.1' : '1'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => {
          if (!hasMoved) {
            onExpand();
          }
        }}
      >
      <div className="minimized-player__container">
        {/* Agua que se llena desde abajo */}
        <div 
          className={`minimized-player__water ${
            isPlaying 
              ? 'minimized-player__water--playing' 
              : 'minimized-player__water--paused'
          }`}
          style={{ height: `${fillPercentage}%` }}
        >
          {/* Efectos de ondas cuando está reproduciéndose */}
          {isPlaying && (
            <div className="minimized-player__waves">
              <div className="minimized-player__wave"></div>
              <div className="minimized-player__wave"></div>
              <div className="minimized-player__wave"></div>
            </div>
          )}
        </div>
        
        {/* Inicial de la canción */}
        <div className="minimized-player__initial">
          {initial}
        </div>
        
        {/* Indicador de reproducción */}
        {isPlaying && (
          <div className="minimized-player__playing-indicator"></div>
        )}
        
        {/* Anillo de progreso */}
        <svg 
          className="minimized-player__progress-ring" 
          viewBox="0 0 64 64"
        >
          <circle
            cx="32"
            cy="32"
            r="30"
            className="minimized-player__progress-circle"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              stroke: 'rgba(255,255,255,0.8)',
              strokeWidth: '2'
            }}
          />
        </svg>
        
        {/* Tooltip con información de la canción */}
        <div className="minimized-player__tooltip">
          <div className="minimized-player__tooltip-content">
            <span className="minimized-player__tooltip-title">{currentSong.title}</span>
            {currentSong.artist && (
              <span className="minimized-player__tooltip-artist">{currentSong.artist}</span>
            )}
            <span className="minimized-player__tooltip-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default MinimizedPlayer;
