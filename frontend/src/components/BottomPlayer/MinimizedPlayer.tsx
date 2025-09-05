import React from 'react';
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
    <div className="minimized-player" onClick={onExpand}>
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
