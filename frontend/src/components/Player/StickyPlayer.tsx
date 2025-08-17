import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { useServerInfo } from '../../hooks/useServerInfo';
import { useMediaSession } from '../../hooks/useMediaSession';
import { updateFavicon, resetFavicon } from '../../utils/favicon';
import './StickyPlayer.css';
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
} from '@heroicons/react/24/outline';

const StickyPlayer: React.FC = () => {
  const {
    isPlaying,
    currentSong,
    currentTime,
    duration,
    volume,
    play,
    pause,
    setVolume,
    seekTo
  } = usePlayerStore();

  const {
    queue,
    currentIndex,
    nextSong,
    previousSong
  } = usePlaylistStore();

  const { serverInfo } = useServerInfo();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isQueueVisible, setIsQueueVisible] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);

  // Configurar Media Session API para controles nativos en móvil
  useMediaSession();

  // Actualizar título de la página con el nombre de la canción
  useEffect(() => {
    if (currentSong) {
      const baseTitle = 'CGPlayerWeb';
      const songTitle = isPlaying ? `♪ ${currentSong.title}` : currentSong.title;
      document.title = `${songTitle} - ${baseTitle}`;
    } else {
      document.title = 'CGPlayerWeb - Reproductor de Música Coral';
    }

    return () => {
      // Limpiar título cuando el componente se desmonte
      document.title = 'CGPlayerWeb - Reproductor de Música Coral';
    };
  }, [currentSong, isPlaying]);

  // Actualizar favicon cuando cambia la canción
  useEffect(() => {
    if (currentSong) {
      updateFavicon(currentSong.title);
    } else {
      resetFavicon();
    }
  }, [currentSong]);

  // No mostrar el reproductor si no hay canción actual
  if (!currentSong) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    seekTo(newTime);
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      nextSong();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      previousSong();
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const removeFromQueue = (index: number) => {
    // Esta función debería estar implementada en el store
    console.log('Removing song at index:', index);
  };

  return (
    <div className={`sticky-player ${isExpanded ? 'sticky-player--expanded' : 'sticky-player--collapsed'}`}>
      
      {/* Barra de progreso principal */}
      <div 
        ref={progressRef}
        className="progress-bar"
        onClick={handleProgressClick}
      >
        <div 
          className="progress-bar__fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Contenido principal del reproductor */}
      <div className="player-layout">
        
        {/* Información de la canción - COLUMNA 1 */}
        <div className="song-info">
          <div className="song-info__avatar">
            <div className="song-info__avatar-circle">
              <span className="song-info__avatar-text">
                {currentSong.title.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="song-info__details">
            <p className="song-info__title">
              {currentSong.title}
            </p>
            <p className="song-info__subtitle">
              {currentSong.artist && (
                <span>{currentSong.artist} • </span>
              )}
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>

        {/* Controles de reproducción - COLUMNA 2 - CENTRADO ABSOLUTO */}
        <div className="player-controls">
          <button
            onClick={handlePrevious}
            disabled={currentIndex <= 0 || queue.length <= 1}
            className="control-button"
          >
            <BackwardIcon className="control-button__icon" />
          </button>
          
          <button
            onClick={isPlaying ? pause : play}
            className="control-button control-button--primary"
          >
            {isPlaying ? (
              <PauseIcon className="control-button__icon" />
            ) : (
              <PlayIcon className="control-button__icon" style={{ marginLeft: '2px' }} />
            )}
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentIndex >= queue.length - 1 || queue.length <= 1}
            className="control-button"
          >
            <ForwardIcon className="control-button__icon" />
          </button>
        </div>

        {/* Controles adicionales - COLUMNA 3 */}
        <div className="additional-controls">
          {/* Controles de volumen (desktop) */}
          <div className="volume-controls">
            <button
              onClick={toggleMute}
              className="control-button"
            >
              {isMuted || volume === 0 ? (
                <SpeakerXMarkIcon className="control-button__icon" />
              ) : (
                <SpeakerWaveIcon className="control-button__icon" />
              )}
            </button>
            
            {/* Barra de volumen mejorada */}
            <div className="volume-slider">
              <div className="volume-slider__track">
                <div 
                  className="volume-slider__fill"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider__input"
              />
            </div>
          </div>

          {/* Botón de cola */}
          <button
            onClick={() => setIsQueueVisible(!isQueueVisible)}
            className="control-button"
          >
            <QueueListIcon className="control-button__icon" />
          </button>

          {/* Botón de expansión */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="control-button"
          >
            {isExpanded ? (
              <ChevronDownIcon className="control-button__icon" />
            ) : (
              <ChevronUpIcon className="control-button__icon" />
            )}
          </button>
        </div>
      </div>

      {/* Panel expandido de la cola */}
      {(isExpanded || isQueueVisible) && (
        <div className="queue-panel">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Cola de reproducción ({queue.length} canciones)
          </h3>
          
          <div className="space-y-2">
            {queue.map((song, index) => (
              <div 
                key={`${song.id}-${index}`}
                className={`queue-item ${index === currentIndex ? 'queue-item--current' : ''}`}
              >
                <div className="queue-item__info">
                  <div className="song-info__avatar">
                    <div className="song-info__avatar-circle" style={{ width: '2rem', height: '2rem' }}>
                      <span className="song-info__avatar-text" style={{ fontSize: '0.75rem' }}>
                        {song.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="queue-item__title">{song.title}</p>
                    {song.artist && (
                      <p className="queue-item__subtitle">{song.artist}</p>
                    )}
                  </div>
                </div>

                {index !== currentIndex && (
                  <button
                    onClick={() => removeFromQueue(index)}
                    className="queue-item__remove"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StickyPlayer;
