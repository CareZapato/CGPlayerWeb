import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { useServerInfo } from '../../hooks/useServerInfo';
import { getSongFileUrl } from '../../config/api';
import { updateFavicon, resetFavicon } from '../../utils/favicon';
import { useLyrics } from '../../hooks/useLyrics';
import configService from '../../services/configService';
import type { Song } from '../../types';
import MinimizedPlayer from './MinimizedPlayer';
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
  MusicalNoteIcon,
  DocumentTextIcon,
  ArrowPathIcon
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

// Componente inline para las letras
interface LyricsViewerInlineProps {
  song: Song;
  isDesktop?: boolean;
  autoSyncEnabled: boolean;
  toggleAutoSync: () => void;
  onSyncStatusChange?: (hasSyncedLyrics: boolean) => void;
}

const LyricsViewerInline: React.FC<LyricsViewerInlineProps> = ({ 
  song, 
  isDesktop = true, 
  autoSyncEnabled,
  toggleAutoSync,
  onSyncStatusChange 
}) => {
  const [displayMode, setDisplayMode] = useState<'sync' | 'files'>('sync');
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const activeLineRef = useRef<HTMLDivElement>(null);
  
  // Función para alternar entre sync y files en móvil
  const toggleMobileDisplayMode = () => {
    setDisplayMode(displayMode === 'sync' ? 'files' : 'sync');
  };

  // Función para obtener el icono del modo de display actual
  const getMobileDisplayIcon = () => {
    if (displayMode === 'sync') {
      return {
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        ),
        title: 'Ver Archivos'
      };
    } else {
      return {
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        ),
        title: 'Ver Letras Sincronizadas'
      };
    }
  };
  
  const { 
    lyrics, 
    syncedLyrics, 
    isLoading, 
    loadLyrics, 
    loadSyncedLyrics
  } = useLyrics(song?.id);
  
  const { currentTime, duration, seekTo, isPlaying } = usePlayerStore();

  // Cargar letras cuando cambie la canción
  useEffect(() => {
    if (song?.id) {
      loadLyrics(song.id);
      loadSyncedLyrics(song.id);
    }
  }, [song?.id, loadLyrics, loadSyncedLyrics]);

  // Obtener letras filtradas
  const filteredLyrics = (Array.isArray(syncedLyrics) ? syncedLyrics : [])
    .filter(lyric => lyric.lineNumber > 0)
    .sort((a, b) => a.lineNumber - b.lineNumber);

  // Función para identificar si una canción tiene sincronización válida
  const getSyncStatus = () => {
    const hasRealSyncData = filteredLyrics.some(lyric => 
      lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0
    );
    return { hasRealSyncData };
  };
  
  const syncStatus = getSyncStatus();
  
  // Reportar estado de sincronización
  useEffect(() => {
    if (filteredLyrics.length > 0 && onSyncStatusChange) {
      onSyncStatusChange(syncStatus.hasRealSyncData);
    }
  }, [filteredLyrics, syncStatus, onSyncStatusChange]);

  // Separar letras sincronizadas
  const syncedLyrics_withTime = filteredLyrics.filter(lyric => 
    lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0
  );
  const allLyricsForDisplay = filteredLyrics;

  // Obtener archivos de letras
  const lyricsFiles = lyrics?.lyricsFiles || [];

  // Encontrar línea activa
  useEffect(() => {
    if (!autoSyncEnabled || !syncStatus.hasRealSyncData || !isPlaying) {
      setActiveLineIndex(-1);
      return;
    }

    let newActiveIndex = -1;
    
    for (let i = 0; i < syncedLyrics_withTime.length; i++) {
      const currentLyric = syncedLyrics_withTime[i];
      const currentStart = currentLyric.startTime || 0;
      
      let nextStart = Infinity;
      for (let j = i + 1; j < syncedLyrics_withTime.length; j++) {
        const futurelyric = syncedLyrics_withTime[j];
        if (futurelyric.startTime && futurelyric.startTime > currentStart) {
          nextStart = futurelyric.startTime;
          break;
        }
      }
      
      if (nextStart === Infinity && currentStart > 0) {
        nextStart = currentStart + 5;
      }
      
      if (nextStart !== Infinity && (nextStart - currentStart) < 2) {
        nextStart = currentStart + 2;
      }
      
      if (currentTime >= currentStart && currentTime < nextStart && currentStart > 0) {
        newActiveIndex = i;
        break;
      }
    }

    if (newActiveIndex !== activeLineIndex) {
      setActiveLineIndex(newActiveIndex);
    }
  }, [currentTime, syncedLyrics_withTime, syncStatus.hasRealSyncData, isPlaying, activeLineIndex, autoSyncEnabled]);

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
    <div className="h-full flex flex-col">
      {/* Header con controles */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
        <div className="flex space-x-2">
          {isDesktop ? (
            <>
              <button
                onClick={() => setDisplayMode('sync')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  displayMode === 'sync'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                Sincronización
              </button>
              <button
                onClick={() => setDisplayMode('files')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  displayMode === 'files'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                Archivos
              </button>
            </>
          ) : (
            <button
              onClick={toggleMobileDisplayMode}
              className="px-3 py-1.5 rounded-md bg-purple-500 text-white flex items-center space-x-2 shadow-md"
              title={getMobileDisplayIcon().title}
            >
              {getMobileDisplayIcon().icon}
              <span className="text-sm font-medium">{getMobileDisplayIcon().title}</span>
            </button>
          )}
        </div>

        {/* Auto-sync toggle */}
        {displayMode === 'sync' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAutoSync}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1 text-sm font-medium ${
                autoSyncEnabled
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600'
              }`}
              title={autoSyncEnabled ? 'Desactivar auto-sync' : 'Activar auto-sync'}
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Auto-sync</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ height: '100%', overflowY: 'auto' }} className="flex-1">
        {displayMode === 'sync' ? (
          <div className="h-full relative">
            <div className="min-h-full bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 rounded-lg p-6">
              {filteredLyrics.length > 0 ? (
                <div className="relative">
                  <div className="space-y-3">
                    {allLyricsForDisplay.map((lyric: any) => {
                      const activeLyricFromSynced = activeLineIndex >= 0 ? syncedLyrics_withTime[activeLineIndex] : null;
                      const isActiveLine = activeLyricFromSynced && lyric.id === activeLyricFromSynced.id;
                      
                      const hasTimeData = lyric.startTime !== undefined && lyric.startTime !== null;
                      const isValidTime = hasTimeData && (lyric.startTime || 0) > 0;
                      
                      const isHighlighted = lyric.isHighlighted === true;
                      const baseTextColor = isHighlighted ? 'text-purple-800' : 'text-gray-500';
                      
                      const activeEffects = isActiveLine ? 'transform scale-110' : '';
                      const hoverEffects = isValidTime ? 'hover:scale-105 cursor-pointer' : '';
                      const fontWeight = isActiveLine ? 'font-bold' : 'font-normal';
                      
                      return (
                        <div
                          key={lyric.id}
                          ref={isActiveLine ? activeLineRef : null}
                          onClick={() => handleLineClick(lyric)}
                          className={`lyrics-line transition-all duration-300 ease-out py-3 px-2 mx-1 ${
                            activeEffects
                          } ${hoverEffects}`}
                        >
                          <div className="flex justify-center items-center w-full">
                            <p 
                              className={`text-center ${baseTextColor} ${fontWeight} text-lg leading-relaxed mx-auto ${
                                isDesktop ? 'sm:text-base md:text-lg lg:text-xl' : 'text-base'
                              }`}
                              style={{
                                ...(isActiveLine && {
                                  textShadow: '0 1px 2px rgba(147, 51, 234, 0.2)'
                                })
                              }}
                            >
                              {lyric.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-600 py-8">
                  <p className="text-lg">No hay letras disponibles</p>
                  <p className="text-sm mt-2 text-gray-500">Revisa los archivos de letras</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 h-full flex flex-col">
            {lyricsFiles.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">
                  📁 Archivos de Letras ({lyricsFiles.length})
                </h4>
                
                {lyricsFiles.map((file) => {
                  const fileUrl = configService.buildFileUrl(`/lyrics/files/${file.id}`, true);
                  
                  const isPDF = file.fileType === 'PDF';
                  const isImage = file.fileType === 'IMAGE_JPG' || file.fileType === 'IMAGE_PNG';
                  const isDoc = file.fileType === 'DOC' || file.fileType === 'DOCX';
                  
                  const getFileIcon = () => {
                    if (isPDF) return { icon: '📄', color: 'bg-red-500', label: 'PDF' };
                    if (isImage) return { icon: '🖼️', color: 'bg-green-500', label: 'IMG' };
                    if (isDoc) return { icon: '📋', color: 'bg-blue-500', label: 'DOC' };
                    return { icon: '📁', color: 'bg-gray-500', label: 'FILE' };
                  };
                  
                  const fileIcon = getFileIcon();
                  
                  return (
                    <div
                      key={file.id}
                      className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                      onClick={() => window.open(fileUrl, '_blank')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg ${fileIcon.color} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                          {fileIcon.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900 truncate">
                              {file.fileName}
                            </p>
                            <span className={`px-2 py-1 text-xs rounded ${fileIcon.color} text-white font-medium`}>
                              {fileIcon.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {file.fileType.replace('_', ' ')} • Haz clic para abrir en nueva pestaña
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-4">
                  <p className="text-blue-800 font-medium">No hay archivos de letras disponibles</p>
                  <p className="text-blue-600 text-sm mt-1">Sube archivos PDF o imágenes con las letras</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * BottomPlayer - Reproductor persistente en la parte inferior
 * Barra de reproducción completa que se mantiene siempre visible
 */
const BottomPlayer: React.FC = () => {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [isFullscreenLyrics, setIsFullscreenLyrics] = useState(false);
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(false);
  
  // Estado del sincronizador automático
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    const saved = localStorage.getItem('lyrics-auto-sync');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Estado para recibir el estado de sincronización
  const [hasSyncedLyrics, setHasSyncedLyrics] = useState(false);
  
  // Función para toggle del sincronizador automático
  const toggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('lyrics-auto-sync', JSON.stringify(newValue));
  };

  // Callback para recibir el estado de sincronización
  const handleSyncStatusChange = (syncStatus: boolean) => {
    setHasSyncedLyrics(syncStatus);
  };

  // Detectar si estamos en desktop o móvil
  const [isDesktop, setIsDesktop] = useState(() => {
    const userAgent = navigator.userAgent;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    if (isMobileUserAgent) return false;
    if (screenWidth < 768) return false;
    if (screenHeight > screenWidth && screenWidth < 1024) return false;
    
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      const userAgent = navigator.userAgent;
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      if (isMobileUserAgent) {
        setIsDesktop(false);
        return;
      }
      
      if (screenWidth < 768) {
        setIsDesktop(false);
        return;
      }
      
      if (screenHeight > screenWidth && screenWidth < 1024) {
        setIsDesktop(false);
        return;
      }
      
      setIsDesktop(true);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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

  // Si está minimizado, mostrar solo la esfera flotante
  if (isMinimized) {
    return <MinimizedPlayer onExpand={() => setIsMinimized(false)} />;
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
            <div 
              className="bottom-player__artwork bottom-player__artwork--clickable"
              onClick={() => setIsMinimized(true)}
              title="Haz clic para minimizar el reproductor"
            >
              <div className="bottom-player__artwork-placeholder">
                {currentSong.title.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="bottom-player__details">
              <div className="bottom-player__title-container">
                <h4 
                  className="bottom-player__title bottom-player__title--with-tooltip"
                  title={`${currentSong.title} - ${currentSong.artist || 'Artista desconocido'}`}
                >
                  {currentSong.title}
                </h4>
                
                {/* Tooltip/Globo de información */}
                <div className="bottom-player__song-tooltip">
                  <div className="bottom-player__song-tooltip-content">
                    <div className="bottom-player__song-tooltip-title">{currentSong.title}</div>
                    <div className="bottom-player__song-tooltip-artist">{currentSong.artist || 'Artista desconocido'}</div>
                    {currentSong.voiceType && (
                      <div className="bottom-player__song-tooltip-voice">Voz: {currentSong.voiceType}</div>
                    )}
                    <div className="bottom-player__song-tooltip-time">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                  <div className="bottom-player__song-tooltip-arrow"></div>
                </div>
              </div>
              
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

            {/* Botón de lista de reproducción / letras */}
            {isDesktop ? (
              <button
                onClick={() => setIsExpandedDesktop(!isExpandedDesktop)}
                className={`bottom-player__control bottom-player__control--secondary ${isExpandedDesktop ? 'bottom-player__control--active' : ''}`}
                title="Expandir reproductor con letras y lista"
              >
                <QueueListIcon className="bottom-player__control-icon" />
                {queue && queue.length > 1 && (
                  <span className="bottom-player__queue-count">{queue.length}</span>
                )}
              </button>
            ) : (
              <>
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
                
                <button
                  onClick={() => setIsFullscreenLyrics(!isFullscreenLyrics)}
                  className={`bottom-player__control bottom-player__control--secondary ${isFullscreenLyrics ? 'bottom-player__control--active' : ''}`}
                  title="Ver letras en pantalla completa"
                >
                  <DocumentTextIcon className="bottom-player__control-icon" />
                </button>
              </>
            )}

            {/* Botón de expandir/contraer */}
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

      {/* Vista expandida de desktop */}
      {isExpandedDesktop && isDesktop && (
        <div 
          className="desktop-expanded-view"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1000,
            margin: 0,
            padding: 0,
            background: 'white'
          }}
        >
          
          <div 
            className="desktop-expanded-content"
            style={{
              display: 'flex',
              height: '100vh',
              width: '100%',
              margin: 0,
              padding: 0,
              gap: '4px'
            }}
          >
            {/* Panel de letras - 80% */}
            <div 
              className="desktop-lyrics-panel"
              style={{
                flex: '4',
                height: '100vh',
                margin: 0,
                padding: 0,
                background: 'white',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div 
                className="desktop-lyrics-content"
                style={{
                  flex: '1',
                  height: '100vh',
                  margin: 0,
                  padding: 0,
                  overflow: 'auto'
                }}
              >
                <LyricsViewerInline 
                  song={currentSong} 
                  isDesktop={isDesktop}
                  autoSyncEnabled={autoSyncEnabled}
                  toggleAutoSync={toggleAutoSync}
                  onSyncStatusChange={handleSyncStatusChange}
                />
              </div>
            </div>
            
            {/* Panel de cola y controles - 20% */}
            <div 
              className="desktop-queue-panel"
              style={{
                flex: '1',
                height: '100vh',
                margin: 0,
                padding: '4px',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto'
              }}
            >
              <div className="desktop-queue-header">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Cola de reproducción ({queue.length})
                </h4>
                
                {/* Controles de shuffle y repeat */}
                <div className="desktop-queue-controls">
                  <button
                    onClick={toggleShuffle}
                    className={`bottom-player__control ${isShuffled ? 'bottom-player__control--active' : ''}`}
                    title="Reproducción aleatoria"
                  >
                    <Bars3Icon className="bottom-player__control-icon" />
                  </button>
                  
                  <button
                    onClick={toggleRepeat}
                    className={`bottom-player__control ${repeatMode !== 'off' ? 'bottom-player__control--active' : ''}`}
                    title={`Repetir: ${repeatMode === 'off' ? 'desactivado' : repeatMode === 'all' ? 'toda la lista' : 'canción actual'}`}
                  >
                    <ArrowPathIcon className="bottom-player__control-icon" />
                    {repeatMode === 'one' && (
                      <span className="bottom-player__control-badge">1</span>
                    )}
                  </button>

                  <button
                    onClick={() => setIsExpandedDesktop(false)}
                    className="bottom-player__control"
                    title="Cerrar vista expandida"
                  >
                    <XMarkIcon className="bottom-player__control-icon" />
                  </button>
                </div>
              </div>
              
              <div className="desktop-queue-list">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={queue.map((song, index) => `${song.id}-${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {queue.map((song, index) => (
                      <div
                        key={`${song.id}-${index}`}
                        className={`desktop-queue-item ${index === currentIndex ? 'desktop-queue-item--current' : ''}`}
                        onClick={() => {
                          if (index !== currentIndex) {
                            setCurrentIndex(index);
                            handlePlaylistSongClick(song, index);
                          }
                        }}
                        style={{ cursor: index !== currentIndex ? 'pointer' : 'default' }}
                      >
                        <div className="desktop-queue-item__info">
                          <div className="bottom-player__artwork" style={{ width: '2rem', height: '2rem' }}>
                            <div className="bottom-player__artwork-placeholder" style={{ fontSize: '0.75rem' }}>
                              {song.title.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="desktop-queue-item__title">{song.title}</p>
                            {song.artist && (
                              <p className="desktop-queue-item__subtitle">{song.artist}</p>
                            )}
                          </div>
                          
                          {index !== currentIndex && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromQueue(song.id);
                              }}
                              className="desktop-queue-item__remove"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de pantalla completa para letras (móvil) */}
      {isFullscreenLyrics && !isDesktop && (
        <div 
          className="mobile-fullscreen-player"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1000,
            background: 'white',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header con info de la canción */}
          <div className="mobile-fullscreen-header" style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bottom-player__artwork" style={{ width: '3rem', height: '3rem' }}>
                  <div className="bottom-player__artwork-placeholder">
                    {currentSong.title.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{currentSong.title}</h2>
                  <p className="text-gray-600">
                    {currentSong.artist || 'Coro Gregorio'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFullscreenLyrics(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Contenido de letras */}
          <div className="flex-1 overflow-auto">
            <LyricsViewerInline 
              song={currentSong} 
              isDesktop={false}
              autoSyncEnabled={autoSyncEnabled}
              toggleAutoSync={toggleAutoSync}
              onSyncStatusChange={handleSyncStatusChange}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BottomPlayer;
