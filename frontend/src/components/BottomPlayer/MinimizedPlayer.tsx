import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import './BottomPlayer.css';

interface MinimizedPlayerProps {
  onExpand: () => void;
}

/**
 * MinimizedPlayer - Versión minimizada del reproductor como esfera que se llena
 */
const MinimizedPlayer: React.FC<MinimizedPlayerProps> = ({ onExpand }) => {
  const { currentSong, isPlaying, currentTime, duration } = usePlayerStore();
  
  // Estados solo para arrastre
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs
  const playerRef = useRef<HTMLDivElement>(null);

  // Funciones de arrastre corregidas
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!playerRef.current) return;
    const rect = playerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setHasMoved(false);
    // Guardar el offset del mouse/touch respecto al elemento
    setDragStart({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    setHasMoved(true);
    
    // Calcular nueva posición restando el offset inicial
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    // Obtener dimensiones del elemento según el dispositivo
    const isMobile = window.innerWidth <= 768;
    const elementSize = isMobile ? 56 : 64; // 3.5rem en móvil, 4rem en desktop
    const maxX = window.innerWidth - elementSize;
    const maxY = window.innerHeight - elementSize;
    
    // Aplicar límites para mantenerlo visible
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragStart.x, dragStart.y]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    // Solo expandir si no hubo arrastre
    setTimeout(() => {
      if (!hasMoved && !isDragging) {
        onExpand();
      }
    }, 0);
  }, [hasMoved, isDragging, onExpand]);

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
    // No prevenir el default inicialmente para permitir el tap
    e.stopPropagation();
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Solo prevenir el scroll si se está moviendo significativamente
    if (isDragging || hasMoved) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  }, [handleDragMove, isDragging, hasMoved]);

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
    <div 
      ref={playerRef}
      className={`minimized-player ${isDragging ? 'minimized-player--dragging' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab'
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
  );
};

export default MinimizedPlayer;
