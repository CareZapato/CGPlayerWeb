import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { useServerInfo } from '../../hooks/useServerInfo';
import { getSongFileUrl } from '../../config/api';
import { updateFavicon, resetFavicon } from '../../utils/favicon';
import type { Song } from '../../types';
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  QueueListIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
  Bars3Icon,
  MusicalNoteIcon
} from '@heroicons/react/24/solid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './BottomPlayer.css';

// Componente para items de playlist con drag & drop
interface PlaylistItemProps {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  isPlaying: boolean;
  onPlay: (song: Song, index: number) => void;
  onRemove: (songId: string) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  song,
  index,
  isCurrentSong,
  isPlaying,
  onPlay,
  onRemove,
}) => {
  const uniqueId = `${song.id}-${index}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: uniqueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bottom-player__playlist-item ${
        isCurrentSong ? 'bottom-player__playlist-item--current' : ''
      } ${isDragging ? 'bottom-player__playlist-item--dragging' : ''}`}
    >
      {/* Drag handle */}
      <div
        className="bottom-player__playlist-item-drag-handle"
        {...attributes}
        {...listeners}
      >
        <Bars3Icon className="bottom-player__playlist-item-drag-icon" />
      </div>

      {/* Play/pause icon */}
      <div className="bottom-player__playlist-item-play-icon">
        {isCurrentSong ? (
          isPlaying ? (
            <div className="bottom-player__playing-indicator">
              <div className="bottom-player__playing-bar"></div>
              <div className="bottom-player__playing-bar"></div>
              <div className="bottom-player__playing-bar"></div>
            </div>
          ) : (
            <PauseIcon className="bottom-player__playlist-item-icon" />
          )
        ) : (
          <MusicalNoteIcon className="bottom-player__playlist-item-icon" />
        )}
      </div>

      {/* Song info */}
      <div
        className="bottom-player__playlist-item-info"
        onClick={() => onPlay(song, index)}
      >
        <span className="bottom-player__playlist-item-title">
          {song.title}
        </span>
        <span className="bottom-player__playlist-item-artist">
          {song.artist || 'Artista desconocido'}
        </span>
      </div>

      {/* Duration */}
      <span className="bottom-player__playlist-item-duration">
        {formatTime(song.duration || 0)}
      </span>

      {/* Remove button */}
      <button
        className="bottom-player__playlist-item-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(song.id);
        }}
        title="Remover de la cola"
      >
        <XMarkIcon className="bottom-player__playlist-item-remove-icon" />
      </button>
    </li>
  );
};

/**
 * BottomPlayer - Reproductor persistente en la parte inferior
 * Barra de reproducción completa que se mantiene siempre visible
 */
const BottomPlayer: React.FC = () => {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { serverInfo } = useServerInfo();
  
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    seekTo,
    togglePlayPause,
    playSong
  } = usePlayerStore();

  const {
    queue,
    currentIndex,
    nextSong,
    previousSong,
    removeFromQueue,
    moveInQueue,
    setCurrentIndex,
    isShuffled,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    clearQueue
  } = usePlaylistStore();

  // Actualizar título de la pestaña cuando cambia la canción o el estado de reproducción
  useEffect(() => {
    if (currentSong && currentSong.title && isPlaying) {
      updateFavicon(currentSong.title);
    } else if (!isPlaying || !currentSong?.title) {
      resetFavicon();
    }
  }, [currentSong?.title, isPlaying]);

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Función para construir URL de canción con autenticación
  const buildSongUrl = (song: Song): string => {
    if ((song as any).folderName) {
      return getSongFileUrl((song as any).folderName, song.fileName);
    } else {
      return `${serverInfo.audioBaseUrl}-root/${song.fileName}`;
    }
  };

  // Manejar navegación de canciones
  const handleNextSong = () => {
    const nextTrack = nextSong();
    if (nextTrack) {
      const songUrl = buildSongUrl(nextTrack);
      playSong({
        id: nextTrack.id,
        title: nextTrack.title,
        artist: nextTrack.artist || 'Desconocido',
        url: songUrl,
        duration: nextTrack.duration || 0
      });
    }
  };

  const handlePreviousSong = () => {
    const prevTrack = previousSong();
    if (prevTrack) {
      const songUrl = buildSongUrl(prevTrack);
      playSong({
        id: prevTrack.id,
        title: prevTrack.title,
        artist: prevTrack.artist || 'Desconocido',
        url: songUrl,
        duration: prevTrack.duration || 0
      });
    }
  };

  // Manejar selección de canción desde playlist
  const handlePlaylistSongClick = (song: Song, index: number) => {
    setCurrentIndex(index);
    const songUrl = buildSongUrl(song);
    playSong({
      id: song.id,
      title: song.title,
      artist: song.artist || 'Desconocido',
      url: songUrl,
      duration: song.duration || 0
    });
  };

  // Manejar drag & drop en la playlist
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Extraer índices de las claves únicas
      const getIndexFromId = (id: string | number) => {
        const idStr = id.toString();
        const lastDashIndex = idStr.lastIndexOf('-');
        return parseInt(idStr.substring(lastDashIndex + 1));
      };
      
      const oldIndex = getIndexFromId(active.id);
      const newIndex = getIndexFromId(over?.id || '');
      
      if (!isNaN(oldIndex) && !isNaN(newIndex) && oldIndex !== newIndex) {
        moveInQueue(oldIndex, newIndex);
        
        // Actualizar el índice actual si es necesario
        if (oldIndex === currentIndex) {
          setCurrentIndex(newIndex);
        } else if (oldIndex < currentIndex && newIndex >= currentIndex) {
          setCurrentIndex(currentIndex - 1);
        } else if (oldIndex > currentIndex && newIndex <= currentIndex) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    }
  };

  // Manejar eliminación de canción de la cola
  const handleRemoveFromQueue = (songId: string) => {
    try {
      removeFromQueue(songId);
    } catch (error) {
      console.error('Error removing song from queue:', error);
    }
  };

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

  if (!currentSong) {
    return null;
  }

  return (
    <>
      {/* Barra de reproducción principal */}
      <div className={`bottom-player ${isExpanded ? 'bottom-player--expanded' : ''}`}>
        {/* Barra de progreso superior */}
        <div 
          className="bottom-player__progress-container"
          onClick={handleProgressClick}
        >
          <div className="bottom-player__progress">
            <div 
              className="bottom-player__progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
            <div 
              className="bottom-player__progress-thumb"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Tiempos de reproducción */}
          <div className="bottom-player__time-display">
            <span className="bottom-player__time-current">{formatTime(currentTime)}</span>
            <span className="bottom-player__time-total">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Contenido principal de la barra */}
        <div className="bottom-player__content">
          {/* Información de la canción - Izquierda */}
          <div className="bottom-player__song-info">
            <div className="bottom-player__artwork">
              <div className="bottom-player__artwork-placeholder">
                {currentSong.title.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="bottom-player__details">
              <h4 className="bottom-player__title">
                {currentSong.title}
              </h4>
              <p className="bottom-player__artist">
                {currentSong.artist || 'Artista desconocido'}
              </p>
            </div>
          </div>

          {/* Controles principales - Centro */}
          <div className="bottom-player__controls">
            <button
              onClick={handlePreviousSong}
              disabled={currentIndex <= 0}
              className="bottom-player__control bottom-player__control--secondary"
              title="Anterior"
            >
              <BackwardIcon className="bottom-player__control-icon" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="bottom-player__control bottom-player__control--primary"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <PauseIcon className="bottom-player__control-icon" />
              ) : (
                <PlayIcon className="bottom-player__control-icon" />
              )}
            </button>
            
            <button
              onClick={handleNextSong}
              disabled={currentIndex >= queue.length - 1}
              className="bottom-player__control bottom-player__control--secondary"
              title="Siguiente"
            >
              <ForwardIcon className="bottom-player__control-icon" />
            </button>
          </div>

          {/* Controles adicionales - Derecha */}
          <div className="bottom-player__additional-controls">
            {/* Control de volumen */}
            <div className="bottom-player__volume-control">
              <button
                onClick={toggleMute}
                className="bottom-player__control bottom-player__control--secondary"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted || volume === 0 ? (
                  <SpeakerXMarkIcon className="bottom-player__control-icon" />
                ) : (
                  <SpeakerWaveIcon className="bottom-player__control-icon" />
                )}
              </button>
              
              <div className="bottom-player__volume-slider-container">
                <div 
                  className="bottom-player__volume-track"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    setVolume(Math.max(0, Math.min(1, percent)));
                  }}
                >
                  <div 
                    className="bottom-player__volume-fill"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <div 
                    className="bottom-player__volume-handle"
                    style={{ left: `${volume * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Botón de lista de reproducción */}
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`bottom-player__control bottom-player__control--secondary ${showPlaylist ? 'bottom-player__control--active' : ''}`}
              title="Lista de reproducción"
            >
              <QueueListIcon className="bottom-player__control-icon" />
              {queue && queue.length > 1 && (
                <span className="bottom-player__queue-count">{queue.length}</span>
              )}
            </button>

            {/* Botón de expandir */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="bottom-player__control bottom-player__control--secondary"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? (
                <ChevronDownIcon className="bottom-player__control-icon" />
              ) : (
                <ChevronUpIcon className="bottom-player__control-icon" />
              )}
            </button>
          </div>
        </div>

        {/* Información expandida */}
        {isExpanded && (
          <div className="bottom-player__expanded-info">
            <div className="bottom-player__expanded-details">
              <div className="bottom-player__expanded-meta">
                {currentSong.album && (
                  <span className="bottom-player__album">Álbum: {currentSong.album}</span>
                )}
                <span className="bottom-player__file-info">
                  {currentSong.fileName} • {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel lateral de lista de reproducción */}
      {showPlaylist && (
        <div className="bottom-player__playlist-panel">
          <div className="bottom-player__playlist-header">
            <div className="flex items-center space-x-3">
              <h3>Reproductor</h3>
              <span className="text-sm text-gray-500">
                {queue.length} canción{queue.length !== 1 ? 'es' : ''}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Botón combinado de modos de reproducción */}
              <button
                onClick={() => {
                  if (repeatMode === 'off' && !isShuffled) {
                    toggleShuffle(); // Activar shuffle
                  } else if (isShuffled && repeatMode === 'off') {
                    toggleShuffle(); // Desactivar shuffle
                    toggleRepeat(); // Activar repeat all
                  } else if (!isShuffled && repeatMode === 'all') {
                    toggleRepeat(); // Cambiar a repeat one
                  } else if (!isShuffled && repeatMode === 'one') {
                    toggleRepeat(); // Desactivar repeat (volver a off)
                  }
                }}
                className="p-2 rounded-md transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                title={
                  isShuffled ? 'Modo aleatorio activo' :
                  repeatMode === 'all' ? 'Repetir lista' :
                  repeatMode === 'one' ? 'Repetir canción' :
                  'Reproducción normal'
                }
              >
                {isShuffled ? (
                  // Icono shuffle - flechas cruzadas
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17L21 12L16 7M8 7L3 12L8 17M21 12H3" />
                  </svg>
                ) : repeatMode === 'all' ? (
                  // Icono repeat all
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : repeatMode === 'one' ? (
                  // Icono repeat one
                  <div className="relative">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="absolute -top-1 -right-1 text-xs font-bold bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                      1
                    </span>
                  </div>
                ) : (
                  // Icono normal (lista secuencial)
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {/* Botón limpiar lista */}
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="p-2 rounded-md transition-colors text-red-600 hover:text-red-800 hover:bg-red-50"
                  title="Limpiar lista"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              {/* Botón cerrar */}
              <button
                onClick={() => setShowPlaylist(false)}
                className="bottom-player__playlist-close"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="bottom-player__playlist-content">
            {queue && queue.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={queue.map((song, index) => `${song.id}-${index}`)} 
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="bottom-player__playlist-list">
                    {queue.map((song, index) => {
                      // Verificar que la canción tiene ID válido
                      if (!song || !song.id) {
                        return null;
                      }
                      
                      return (
                        <PlaylistItem
                          key={`${song.id}-${index}`}
                          song={song}
                          index={index}
                          isCurrentSong={index === currentIndex}
                          isPlaying={isPlaying && index === currentIndex}
                          onPlay={handlePlaylistSongClick}
                          onRemove={handleRemoveFromQueue}
                        />
                      );
                    })}
                  </ul>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="bottom-player__playlist-empty">
                <p>No hay canciones en la cola</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BottomPlayer;
