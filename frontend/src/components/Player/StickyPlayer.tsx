import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { useMediaSession } from '../../hooks/useMediaSession';
import { updateFavicon, resetFavicon } from '../../utils/favicon';
import { useLyrics } from '../../hooks/useLyrics';
import type { Song, VoiceType } from '../../types';
import './StickyPlayer.css';

// Componente inline para evitar problemas de importación
interface LyricsViewerInlineProps {
  song: Song;
}

const LyricsViewerInline: React.FC<LyricsViewerInlineProps> = ({ song }) => {
  const [displayMode, setDisplayMode] = useState<'sync' | 'files'>('sync');
  const [selectedVoiceType, setSelectedVoiceType] = useState<VoiceType | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  
  const { 
    lyrics, 
    syncedLyrics, 
    isLoading, 
    loadLyrics, 
    loadSyncedLyrics
  } = useLyrics();
  
  const { currentTime, seekTo, isPlaying } = usePlayerStore();
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Cargar letras cuando cambie la canción
  useEffect(() => {
    if (song?.id) {
      loadLyrics(song.id);
      loadSyncedLyrics(song.id);
    }
  }, [song?.id, loadLyrics, loadSyncedLyrics]);

  // Obtener letras filtradas por voiceType
  const filteredLyrics = (Array.isArray(syncedLyrics) ? syncedLyrics : []).filter(lyric => 
    lyric.voiceType === selectedVoiceType && !lyric.isTextLyrics
  ).sort((a, b) => a.lineNumber - b.lineNumber);

  // Verificar si hay sincronización
  const hasSyncData = filteredLyrics.some(lyric => 
    lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0
  );

  // Obtener archivos de letras de la canción principal
  const lyricsFiles = lyrics?.lyricsFiles || [];

  // Encontrar línea activa
  useEffect(() => {
    if (!hasSyncData || !isPlaying) {
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
  }, [currentTime, filteredLyrics, hasSyncData, isPlaying, activeLineIndex]);

  // Auto-scroll
  useEffect(() => {
    if (activeLineRef.current && activeLineIndex !== -1) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeLineIndex]);

  const handleLineClick = (lyric: any) => {
    if (lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0) {
      seekTo(lyric.startTime);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVoiceTypeColor = (vType: VoiceType | null) => {
    const colors: Record<string, string> = {
      SOPRANO: 'text-pink-600 bg-pink-50',
      CONTRALTO: 'text-purple-600 bg-purple-50', 
      TENOR: 'text-blue-600 bg-blue-50',
      BAJO: 'text-green-600 bg-green-50',
      BARITONO: 'text-yellow-600 bg-yellow-50',
      MESOSOPRANO: 'text-rose-600 bg-rose-50',
      CORO: 'text-indigo-600 bg-indigo-50',
      ORIGINAL: 'text-gray-600 bg-gray-50'
    };
    if (!vType) return 'text-gray-600 bg-gray-50';
    return colors[vType] || 'text-gray-600 bg-gray-50';
  };

  const availableVoiceTypes = [...new Set(
    (Array.isArray(syncedLyrics) ? syncedLyrics : [])
      .filter(l => l.voiceType !== null && !l.isTextLyrics)
      .map(l => l.voiceType)
  )] as VoiceType[];

  if (isLoading) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex space-x-2">
        <button
          onClick={() => setDisplayMode('sync')}
          className={`px-3 py-1 text-xs rounded ${
            displayMode === 'sync'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Texto Sincronizado
        </button>
        <button
          onClick={() => setDisplayMode('files')}
          className={`px-3 py-1 text-xs rounded ${
            displayMode === 'files'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Archivos ({lyricsFiles.length})
        </button>
      </div>

      {/* Voice type selector for sync mode */}
      {displayMode === 'sync' && availableVoiceTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedVoiceType(null)}
            className={`px-2 py-1 text-xs rounded ${
              selectedVoiceType === null
                ? 'bg-gray-200 text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            General
          </button>
          {availableVoiceTypes.map(vType => (
            <button
              key={vType}
              onClick={() => setSelectedVoiceType(vType)}
              className={`px-2 py-1 text-xs rounded ${
                selectedVoiceType === vType
                  ? getVoiceTypeColor(vType)
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {vType.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {displayMode === 'sync' ? (
          // Synchronized lyrics
          <div className="space-y-2">
            {filteredLyrics.length > 0 ? (
              filteredLyrics.map((lyric, index) => (
                <div
                  key={lyric.id}
                  ref={index === activeLineIndex ? activeLineRef : null}
                  onClick={() => handleLineClick(lyric)}
                  className={`p-3 rounded-lg transition-all border ${
                    index === activeLineIndex && hasSyncData
                      ? 'bg-blue-100 border-blue-300 text-blue-900 shadow-md'
                      : hasSyncData && lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0
                        ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer hover:shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${
                        index === activeLineIndex && hasSyncData 
                          ? 'text-blue-900' 
                          : 'text-gray-900'
                      }`}>
                        {lyric.content}
                      </p>
                      {lyric.voiceType && (
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${getVoiceTypeColor(lyric.voiceType)}`}>
                            {lyric.voiceType.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                    {hasSyncData && lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {formatTime(lyric.startTime)}
                        </span>
                        {index === activeLineIndex && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No hay letras sincronizadas disponibles</p>
              </div>
            )}
          </div>
        ) : (
          // Files mode
          <div className="space-y-2">
            {lyricsFiles.length > 0 ? (
              lyricsFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/lyrics/files/${file.id}`, '_blank')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {file.fileName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {file.fileType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No hay archivos de letras disponibles</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
import { 
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  QueueListIcon,
  DocumentTextIcon,
  XMarkIcon
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

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [isFullscreenLyrics, setIsFullscreenLyrics] = useState(false);
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);

  // Detectar si estamos en desktop o móvil
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className={`sticky-player ${
      isExpandedDesktop ? 'sticky-player--desktop-expanded' : 
      isQueueVisible ? 'sticky-player--expanded' : 
      'sticky-player--collapsed'
    }`}>
      
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

          {/* Botón de cola / expandir reproductor */}
          <button
            onClick={() => {
              if (isDesktop) {
                setIsExpandedDesktop(!isExpandedDesktop);
              } else {
                setIsQueueVisible(!isQueueVisible);
              }
            }}
            className={`control-button ${(isDesktop && isExpandedDesktop) || (!isDesktop && isQueueVisible) ? 'control-button--active' : ''}`}
            title={isDesktop ? "Expandir reproductor" : "Ver cola de reproducción"}
          >
            <QueueListIcon className="control-button__icon" />
          </button>

          {/* Botón de letras - comportamiento diferente en desktop vs móvil */}
          <button
            onClick={() => {
              if (isDesktop) {
                setIsLyricsVisible(!isLyricsVisible);
              } else {
                setIsFullscreenLyrics(!isFullscreenLyrics);
              }
            }}
            className={`control-button ${(isDesktop && isLyricsVisible) || (!isDesktop && isFullscreenLyrics) ? 'control-button--active' : ''}`}
            title={isDesktop ? "Ver letras en panel lateral" : "Ver letras en pantalla completa"}
          >
            <DocumentTextIcon className="control-button__icon" />
          </button>
        </div>
      </div>

      {/* Vista expandida de desktop */}
      {isExpandedDesktop && isDesktop && (
        <div className="desktop-expanded-view">
          <div className="desktop-expanded-content">
            {/* Panel de letras - 75% */}
            <div className="desktop-lyrics-panel">
              <div className="desktop-lyrics-header">
                <h3 className="text-xl font-semibold text-gray-900">
                  Letras de {currentSong.title}
                </h3>
              </div>
              <div className="desktop-lyrics-content">
                <LyricsViewerInline song={currentSong} />
              </div>
            </div>
            
            {/* Panel de cola y controles - 25% */}
            <div className="desktop-queue-panel">
              <div className="desktop-queue-header">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Cola de reproducción ({queue.length})
                </h4>
              </div>
              
              <div className="desktop-queue-list">
                {queue.map((song, index) => (
                  <div 
                    key={`${song.id}-${index}`}
                    className={`desktop-queue-item ${index === currentIndex ? 'desktop-queue-item--current' : ''}`}
                  >
                    <div className="desktop-queue-item__info">
                      <div className="song-info__avatar" style={{ width: '2rem', height: '2rem' }}>
                        <div className="song-info__avatar-circle" style={{ width: '2rem', height: '2rem' }}>
                          <span className="song-info__avatar-text" style={{ fontSize: '0.75rem' }}>
                            {song.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="desktop-queue-item__title">{song.title}</p>
                        {song.artist && (
                          <p className="desktop-queue-item__subtitle">{song.artist}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Controles de reproducción en desktop expandido */}
              <div className="desktop-controls">
                <div className="desktop-controls__playback">
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
                
                {/* Barra de progreso en desktop expandido */}
                <div className="desktop-progress">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div 
                    className="progress-bar cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="progress-bar__fill"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel expandido de la cola (solo móvil) */}
      {isQueueVisible && !isDesktop && (
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
      
      {/* Panel de letras lateral (solo cuando no está expandido en desktop) */}
      {isLyricsVisible && !isExpandedDesktop && (
        <div className="queue-panel">
          <div className="queue-panel__header">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Letras de {currentSong.title}
            </h3>
            <button
              onClick={() => setIsLyricsVisible(false)}
              className="queue-panel__close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <LyricsViewerInline song={currentSong} />
          </div>
        </div>
      )}
      
      {/* Vista de pantalla completa para letras (móvil) */}
      {isFullscreenLyrics && (
        <div className="mobile-fullscreen-player">
          {/* Header minimalista */}
          <div className="mobile-fullscreen-header">
            <button
              onClick={() => setIsFullscreenLyrics(false)}
              className="mobile-fullscreen-close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Imagen/Avatar de la canción */}
          <div className="mobile-fullscreen-artwork">
            <div className="mobile-fullscreen-artwork__circle">
              <span className="mobile-fullscreen-artwork__text">
                {currentSong.title.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Información de la canción */}
          <div className="mobile-fullscreen-info">
            <h1 className="mobile-fullscreen-title">
              {currentSong.title}
            </h1>
            {currentSong.artist && (
              <p className="mobile-fullscreen-artist">
                {currentSong.artist}
              </p>
            )}
          </div>
          
          {/* Contenido de letras */}
          <div className="mobile-fullscreen-lyrics">
            <LyricsViewerInline song={currentSong} />
          </div>
          
          {/* Barra de progreso */}
          <div className="mobile-fullscreen-progress">
            <div 
              className="mobile-fullscreen-progress__bar"
              onClick={handleProgressClick}
            >
              <div 
                className="mobile-fullscreen-progress__fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="mobile-fullscreen-progress__time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Controles de reproducción */}
          <div className="mobile-fullscreen-controls">
            <button
              onClick={handlePrevious}
              className="mobile-fullscreen-control mobile-fullscreen-control--secondary"
              disabled={currentIndex === 0}
            >
              <BackwardIcon className="h-8 w-8" />
            </button>

            <button
              onClick={isPlaying ? pause : play}
              className="mobile-fullscreen-control mobile-fullscreen-control--primary"
            >
              {isPlaying ? (
                <PauseIcon className="h-12 w-12" />
              ) : (
                <PlayIcon className="h-12 w-12" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="mobile-fullscreen-control mobile-fullscreen-control--secondary"
              disabled={currentIndex === queue.length - 1}
            >
              <ForwardIcon className="h-8 w-8" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickyPlayer;
