import React, { useState } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  QueueListIcon
} from '@heroicons/react/24/solid';
import './FloatingPlayer.css';

/**
 * FloatingPlayer - Reproductor flotante minimalista
 * Versión compacta del reproductor que se mantiene visible
 */
const FloatingPlayer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    play,
    pause,
    setVolume,
    toggleMute,
    seekTo
  } = usePlayerStore();

  const {
    queue,
    currentIndex,
    nextSong,
    previousSong
  } = usePlaylistStore();

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(newTime);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentSong || !isVisible) {
    return null;
  }

  return (
    <div className={`floating-player ${isExpanded ? 'floating-player--expanded' : 'floating-player--collapsed'}`}>
      {/* Barra de progreso */}
      <div 
        className="floating-player__progress"
        onClick={handleProgressClick}
      >
        <div 
          className="floating-player__progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Tiempos de reproducción */}
      <div className="floating-player__time-display">
        <span className="floating-player__time-current">{formatTime(currentTime)}</span>
        <span className="floating-player__time-total">{formatTime(duration)}</span>
      </div>

      {/* Contenido principal */}
      <div className="floating-player__content">
        {/* Información de la canción */}
        <div className="floating-player__info">
          <div className="floating-player__avatar">
            <span className="floating-player__avatar-text">
              {currentSong.title.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="floating-player__details">
            <h4 className="floating-player__title">
              {currentSong.title}
            </h4>
            {isExpanded && (
              <div className="floating-player__meta">
                {currentSong.artist && (
                  <span className="floating-player__artist">{currentSong.artist}</span>
                )}
              </div>
            )}
          </div>
          
          {/* Contador de cola */}
          {queue.length > 1 && (
            <div className="floating-player__queue-indicator">
              <QueueListIcon className="floating-player__queue-icon" />
              <span className="floating-player__queue-count">{queue.length}</span>
            </div>
          )}
        </div>

        {/* Controles principales */}
        <div className="floating-player__controls">
          {isExpanded && (
            <button
              onClick={previousSong}
              disabled={currentIndex <= 0}
              className="floating-player__control floating-player__control--secondary"
            >
              <BackwardIcon className="floating-player__control-icon" />
            </button>
          )}
          
          <button
            onClick={isPlaying ? pause : play}
            className="floating-player__control floating-player__control--primary"
          >
            {isPlaying ? (
              <PauseIcon className="floating-player__control-icon" />
            ) : (
              <PlayIcon className="floating-player__control-icon" />
            )}
          </button>
          
          {isExpanded && (
            <button
              onClick={nextSong}
              disabled={currentIndex >= queue.length - 1}
              className="floating-player__control floating-player__control--secondary"
            >
              <ForwardIcon className="floating-player__control-icon" />
            </button>
          )}
        </div>

        {/* Controles adicionales */}
        <div className="floating-player__actions">
          {isExpanded && (
            <div className="floating-player__volume">
              <button
                onClick={toggleMute}
                className="floating-player__control floating-player__control--secondary"
              >
                {isMuted || volume === 0 ? (
                  <SpeakerXMarkIcon className="floating-player__control-icon" />
                ) : (
                  <SpeakerWaveIcon className="floating-player__control-icon" />
                )}
              </button>
              
              <div className="floating-player__volume-container">
                <div 
                  className="floating-player__volume-track"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    setVolume(Math.max(0, Math.min(1, percent)));
                  }}
                >
                  <div 
                    className="floating-player__volume-fill"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <div 
                    className="floating-player__volume-handle"
                    style={{ left: `${volume * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="floating-player__control floating-player__control--secondary"
          >
            {isExpanded ? (
              <ChevronDownIcon className="floating-player__control-icon" />
            ) : (
              <ChevronUpIcon className="floating-player__control-icon" />
            )}
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="floating-player__control floating-player__control--close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingPlayer;
