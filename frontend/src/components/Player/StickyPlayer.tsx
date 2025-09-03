import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { useMediaSession } from '../../hooks/useMediaSession';
import { updateFavicon, resetFavicon } from '../../utils/favicon';
import { useLyrics } from '../../hooks/useLyrics';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import {
  CSS
} from '@dnd-kit/utilities';
import type { Song } from '../../types';
import configService from '../../services/configService';
import './StickyPlayer.css';

// Componente para elemento sorteable de la cola
interface SortableQueueItemProps {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  onRemove: () => void;
  onPlay: (song: Song, index: number) => void;
}

const SortableQueueItem: React.FC<SortableQueueItemProps> = ({
  song,
  index,
  isCurrentSong,
  onRemove,
  onPlay
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: `${song.id}-${index}`,
    disabled: isCurrentSong // No permitir arrastrar la canción actual
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`desktop-queue-item ${isCurrentSong ? 'desktop-queue-item--current' : ''} ${isDragging ? 'desktop-queue-item--dragging' : ''}`}
    >
      <div className="desktop-queue-item__info">
        {/* Handle de arrastre */}
        {!isCurrentSong && (
          <div 
            {...attributes} 
            {...listeners}
            className="desktop-queue-item__drag-handle"
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
        <div 
          className="song-info__avatar cursor-pointer" 
          style={{ width: '2rem', height: '2rem' }}
          onClick={() => {
            if (!isCurrentSong) {
              onPlay(song, index);
            }
          }}
        >
          <div className="song-info__avatar-circle" style={{ width: '2rem', height: '2rem' }}>
            <span className="song-info__avatar-text" style={{ fontSize: '0.75rem' }}>
              {song.title.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => {
            if (!isCurrentSong) {
              onPlay(song, index);
            }
          }}
        >
          <p className="desktop-queue-item__title">{song.title}</p>
          {song.artist && (
            <p className="desktop-queue-item__subtitle">{song.artist}</p>
          )}
        </div>
        
        {/* Botón de eliminar */}
        {!isCurrentSong && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="desktop-queue-item__remove"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Componente inline para evitar problemas de importación
interface LyricsViewerInlineProps {
  song: Song;
  isDesktop?: boolean;
  showSyncButton?: boolean;
}

const LyricsViewerInline: React.FC<LyricsViewerInlineProps> = ({ song, isDesktop = true }) => {
  const [displayMode, setDisplayMode] = useState<'sync' | 'files'>('sync');
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  
  // Estado del sincronizador automático
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    const saved = localStorage.getItem('lyrics-auto-sync');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Función para alternar entre sync y files en móvil
  const toggleMobileDisplayMode = () => {
    setDisplayMode(displayMode === 'sync' ? 'files' : 'sync');
  };

  // Función para toggle del sincronizador automático
  const toggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('lyrics-auto-sync', JSON.stringify(newValue));
  };

  // Función para obtener el icono del modo de display actual
  const getMobileDisplayIcon = () => {
    if (displayMode === 'sync') {
      return {
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        ),
        title: 'Letras Sincronizadas'
      };
    } else {
      return {
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        ),
        title: 'Archivos'
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
  
  // @ts-ignore - Variables used in queue handlers below
  const { currentTime, duration, seekTo, isPlaying, currentPlaylist, setCurrentSong } = usePlayerStore();
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Cargar letras cuando cambie la canción
  useEffect(() => {
    if (song?.id) {
      console.log('🎵 Loading lyrics for song:', song.title, 'ID:', song.id);
      loadLyrics(song.id);
      loadSyncedLyrics(song.id);
    }
  }, [song?.id, loadLyrics, loadSyncedLyrics]);

  // Debug: Log lyrics data when it changes
  useEffect(() => {
    if (lyrics) {
      console.log('📄 [FRONTEND] Lyrics loaded:', lyrics);
      console.log('📁 [FRONTEND] LyricsFiles count:', lyrics.lyricsFiles?.length || 0);
      console.log('📁 [FRONTEND] LyricsFiles:', lyrics.lyricsFiles);
      console.log('📁 [FRONTEND] Song parentSongId:', (lyrics as any).parentSongId);
      console.log('📁 [FRONTEND] Song voiceType:', lyrics.voiceType);
      console.log('📱 [FRONTEND] Device type:', isDesktop ? 'Desktop' : 'Mobile');
      
      // Debug específico para Don't Cry
      if (song?.title?.toLowerCase().includes('cry')) {
        console.log('🔍 [DON\'T CRY DEBUG] Full lyrics object:', JSON.stringify(lyrics, null, 2));
        console.log('🔍 [DON\'T CRY DEBUG] Current song details:', {
          id: song.id,
          title: song.title,
          voiceType: song.voiceType,
          parentSongId: (song as any).parentSongId
        });
      }
    }
  }, [lyrics, song, isDesktop]);

  // Debug: Log syncedLyrics specifically
  useEffect(() => {
    console.log('🎼 [SYNCED LYRICS DEBUG]', {
      songTitle: song?.title,
      songId: song?.id,
      songVoiceType: song?.voiceType,
      syncedLyricsType: typeof syncedLyrics,
      syncedLyricsLength: Array.isArray(syncedLyrics) ? syncedLyrics.length : 'Not array',
      syncedLyricsData: syncedLyrics,
      isLoading
    });
    
    if (Array.isArray(syncedLyrics) && syncedLyrics.length > 0) {
      console.log('🎼 [SYNCED LYRICS SAMPLE]', syncedLyrics.slice(0, 3).map(l => ({
        id: l.id,
        content: l.content?.substring(0, 30) + '...',
        lineNumber: l.lineNumber,
        voiceType: l.voiceType,
        startTime: l.startTime,
        isTextLyrics: l.isTextLyrics
      })));
    }
  }, [syncedLyrics, song?.title, song?.id, song?.voiceType, isLoading]);

  // Obtener letras filtradas por voiceType y filtrar línea 0
  const filteredLyrics = (Array.isArray(syncedLyrics) ? syncedLyrics : [])
    .filter(lyric => lyric.lineNumber > 0) // Omitir línea 0 de respaldo
    .sort((a, b) => a.lineNumber - b.lineNumber);

  // Debug: Log filtering process
  useEffect(() => {
    if (Array.isArray(syncedLyrics) && syncedLyrics.length > 0) {
      const allVoiceTypes = [...new Set(syncedLyrics.map(l => l.voiceType))];
      console.log('🎯 [FILTERING DEBUG]', {
        songTitle: song?.title,
        totalSyncedLyrics: syncedLyrics.length,
        availableVoiceTypes: allVoiceTypes,
        filteredCount: filteredLyrics.length,
        lyricsBeforeFilter: syncedLyrics.slice(0, 2).map(l => ({
          voiceType: l.voiceType,
          content: l.content?.substring(0, 20) + '...',
          lineNumber: l.lineNumber
        })),
        lyricsAfterFilter: filteredLyrics.slice(0, 2).map(l => ({
          voiceType: l.voiceType,
          content: l.content?.substring(0, 20) + '...',
          lineNumber: l.lineNumber
        }))
      });
    }
  }, [syncedLyrics, filteredLyrics, song?.title]);

  // Función para identificar si una canción tiene datos de sincronización válidos
  const getSyncStatus = () => {
    const hasAnyTimeData = filteredLyrics.some(lyric => 
      lyric.startTime !== undefined && lyric.startTime !== null
    );
    
    const hasRealSyncData = filteredLyrics.some(lyric => 
      lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0
    );
    
    const hasZeroTimeData = filteredLyrics.some(lyric => 
      lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime === 0
    );
    
    return {
      hasAnyTimeData,
      hasRealSyncData,
      hasZeroTimeData,
      hasOnlyZeroTime: hasZeroTimeData && !hasRealSyncData
    };
  };
  
  const syncStatus = getSyncStatus();
  
  // Debug: Log sync status
  useEffect(() => {
    if (filteredLyrics.length > 0) {
      console.log('🔄 [SYNC STATUS]', {
        totalLyrics: filteredLyrics.length,
        syncStatus,
        songTitle: song?.title,
        filteredLyrics: filteredLyrics.map(l => ({
          id: l.id,
          content: l.content?.substring(0, 50) + '...',
          startTime: l.startTime,
          isTextLyrics: l.isTextLyrics,
          voiceType: l.voiceType
        }))
      });
    }
  }, [filteredLyrics, song?.title, syncStatus]);

  // Separar letras por sincronización - YA NO FILTRAR POR isTextLyrics
  const syncedLyrics_withTime = filteredLyrics.filter(lyric => 
    lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0
  );
  const allLyricsForDisplay = filteredLyrics; // Mostrar todas las líneas

  // Debug: Log separated lyrics
  useEffect(() => {
    if (filteredLyrics.length > 0) {
      console.log('📝 [LYRICS SEPARATION]', {
        totalFiltered: filteredLyrics.length,
        syncedWithTime: syncedLyrics_withTime.length,
        allForDisplay: allLyricsForDisplay.length,
        songTitle: song?.title,
        autoSyncEnabled,
        syncStatus
      });
    }
  }, [filteredLyrics, syncedLyrics_withTime, allLyricsForDisplay, song?.title, autoSyncEnabled, syncStatus]);

  // Obtener archivos de letras de la canción principal
  const lyricsFiles = lyrics?.lyricsFiles || [];

  // Encontrar línea activa (solo si hay sincronización real con tiempo > 0 y autoSync está habilitado)
  useEffect(() => {
    if (!autoSyncEnabled || !syncStatus.hasRealSyncData || !isPlaying) {
      setActiveLineIndex(-1);
      return;
    }

    const activeIndex = syncedLyrics_withTime.findIndex((lyric: any, index: number) => {
      const nextLyric = syncedLyrics_withTime[index + 1];
      const currentStart = lyric.startTime || 0;
      const nextStart = nextLyric?.startTime || Infinity;
      
      return currentTime >= currentStart && currentTime < nextStart;
    });

    if (activeIndex !== activeLineIndex) {
      setActiveLineIndex(activeIndex);
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
    <div className="h-full flex flex-col" style={{ height: '100%' }}>
      {/* Header con controles básicos */}
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
      <div style={{ height: '100%', overflowY: 'auto' }} className="flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {displayMode === 'sync' ? (
          <div className="h-full relative">
            {/* Synchronized lyrics - letra continua elegante */}
            <div className="min-h-full bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 rounded-lg p-6">
              {filteredLyrics.length > 0 ? (
                <div className="relative">
                  {/* Mostrar todas las líneas (sincronizadas o no) */}
                  <div className="space-y-1">
                    {allLyricsForDisplay.map((lyric: any, index: number) => {
                      // Determinar si es línea activa
                      const isActiveLine = autoSyncEnabled && 
                        syncStatus.hasRealSyncData && 
                        lyric.startTime !== undefined &&
                        lyric.startTime !== null &&
                        lyric.startTime > 0 &&
                        Math.abs(currentTime - lyric.startTime) < 1; // Margen de 1 segundo
                      
                      // Determinar si tiene tiempo definido (incluso 0)
                      const hasTimeData = lyric.startTime !== undefined && lyric.startTime !== null;
                      const isValidTime = hasTimeData && (lyric.startTime || 0) > 0;
                      
                      // Colores según estado
                      const isHighlighted = lyric.isHighlighted === true;
                      
                      return (
                        <div
                          key={lyric.id}
                          ref={isActiveLine ? activeLineRef : null}
                          onClick={() => handleLineClick(lyric)}
                          className={`lyrics-line transition-all duration-500 py-2 px-3 rounded-md ${
                            isActiveLine 
                              ? (isHighlighted 
                                  ? 'lyrics-line--active bg-purple-200/60 text-purple-900 font-semibold transform scale-105 shadow-lg' 
                                  : 'lyrics-line--active bg-blue-200/60 text-blue-900 font-semibold transform scale-105 shadow-lg')
                              : (isHighlighted
                                  ? 'text-purple-700 hover:text-purple-600 hover:bg-purple-50/40 cursor-pointer' 
                                  : 'text-gray-600 hover:text-gray-700 hover:bg-white/40')
                          } ${isValidTime ? 'cursor-pointer' : ''}`}
                        >
                          <p 
                            className={`text-lg leading-relaxed transition-all duration-300 ${
                              isActiveLine 
                                ? (isHighlighted ? 'text-purple-900 font-bold text-xl' : 'text-blue-900 font-bold text-xl')
                                : (isHighlighted ? 'text-purple-700 font-medium' : 'text-gray-600 font-normal')
                            }`}
                            style={{ lineHeight: '1.8' }}
                          >
                            {lyric.content}
                            {isHighlighted && (
                              <span className="ml-2 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">♪</span>
                            )}
                          </p>
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
          // Files mode - Lista de todos los archivos disponibles
          <div className="space-y-3 h-full flex flex-col">
            
            {lyricsFiles.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">
                  📁 Archivos de Letras ({lyricsFiles.length})
                </h4>
                
                {lyricsFiles.map((file) => {
                  // Construir URL del archivo usando configService
                  const fileUrl = configService.buildFileUrl(`/lyrics/files/${file.id}`, true);
                  
                  const isPDF = file.fileType === 'PDF';
                  const isImage = file.fileType === 'IMAGE_JPG' || file.fileType === 'IMAGE_PNG';
                  const isDoc = file.fileType === 'DOC' || file.fileType === 'DOCX';
                  
                  // Función para obtener el icono y color del archivo
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
                        {/* Icono del archivo */}
                        <div className={`w-10 h-10 rounded-lg ${fileIcon.color} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                          {fileIcon.icon}
                        </div>
                        
                        {/* Información del archivo */}
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
                        
                        {/* Flecha indicadora */}
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
              <div className="text-center text-gray-500 py-8">
                <p>No hay archivos de letras disponibles</p>
                <p className="text-sm mt-1">Sube archivos PDF o imágenes con las letras</p>
                
                {/* Información adicional de debug */}
                {song?.title?.toLowerCase().includes('cry') && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                    <p className="text-sm text-red-700 font-semibold">Debug Info - Don't Cry:</p>
                    <p className="text-xs text-red-600 mt-1">
                      • Backend debería retornar archivos del padre<br/>
                      • Song ID actual: {song?.id}<br/>
                      • Voice Type: {song?.voiceType || 'ORIGINAL'}<br/>
                      • Parent Song ID esperado: {(lyrics as any)?.parentSongId || 'No encontrado'}<br/>
                      • Archivos en respuesta: {lyrics?.lyricsFiles?.length || 0}
                    </p>
                  </div>
                )}
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
  XMarkIcon,
  ArrowsUpDownIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  ArrowPathIcon as ArrowPathIconSolid
} from '@heroicons/react/24/solid';

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
    seekTo,
    currentPlaylist,
    setCurrentSong
  } = usePlayerStore();

  const {
    queue,
    currentIndex,
    nextSong,
    previousSong,
    isShuffled,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    moveInQueue,
    setCurrentIndex,
    removeFromQueue: removeFromQueueByID
  } = usePlaylistStore();

  // Configurar sensores para drag & drop - debe estar antes de los useState
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [isFullscreenLyrics, setIsFullscreenLyrics] = useState(false);
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(false);
  const [isFullscreenQueue, setIsFullscreenQueue] = useState(false); // Nueva variable para cola en fullscreen móvil

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

  // Manejar scroll del body cuando se abre pantalla completa de letras
  useEffect(() => {
    if (isFullscreenLyrics) {
      // Prevenir scroll del body en pantalla completa
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isFullscreenLyrics]);

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

  // Función para alternar entre shuffle y repeat
  const togglePlaybackMode = () => {
    if (!isShuffled && repeatMode === 'off') {
      // Activar shuffle
      toggleShuffle();
    } else if (isShuffled && repeatMode === 'off') {
      // Cambiar de shuffle a repeat all
      toggleShuffle(); // Desactivar shuffle
      toggleRepeat(); // Activar repeat (pasará a 'all')
    } else if (!isShuffled && repeatMode === 'all') {
      // Cambiar de repeat all a repeat one
      toggleRepeat(); // Pasará a 'one'
    } else if (!isShuffled && repeatMode === 'one') {
      // Volver al estado inicial (todo desactivado)
      toggleRepeat(); // Pasará a 'off'
    }
  };

  // Función para obtener el icono y título del modo de reproducción actual
  const getPlaybackModeIcon = () => {
    if (isShuffled) {
      return {
        icon: (
          <svg className="mobile-control-icon mobile-control-icon--small" viewBox="0 0 24 24">
            <path d="M14 7h2.5l-.5-.5 1.4-1.4L21 8.7l-3.6 3.6-1.4-1.4.5-.5H14v-3.4zm-2 10h2.5l-.5.5 1.4 1.4L21 15.3l-3.6-3.6-1.4 1.4.5.5H12v3.4zm-8-2L15.3 3l1.4 1.4L5.4 15.8 4 14.4zm0-10L15.3 21l1.4-1.4L5.4 8.2 4 9.6z"/>
          </svg>
        ),
        title: 'Aleatorio activado'
      };
    } else if (repeatMode === 'all') {
      return {
        icon: (
          <svg className="mobile-control-icon mobile-control-icon--small" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          </svg>
        ),
        title: 'Repetir lista'
      };
    } else if (repeatMode === 'one') {
      return {
        icon: (
          <svg className="mobile-control-icon mobile-control-icon--small" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            <text x="12" y="16" textAnchor="middle" fontSize="8" fill="currentColor">1</text>
          </svg>
        ),
        title: 'Repetir canción'
      };
    } else {
      return {
        icon: (
          <svg className="mobile-control-icon mobile-control-icon--small" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        ),
        title: 'Reproducción normal'
      };
    }
  };

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

  // Manejar finalización del drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = queue.findIndex((song, index) => `${song.id}-${index}` === active.id);
      const newIndex = queue.findIndex((song, index) => `${song.id}-${index}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        moveInQueue(oldIndex, newIndex);
      }
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
    const song = queue[index];
    if (song) {
      removeFromQueueByID(song.id);
    }
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

          {/* Botón de cola / expandir reproductor - solo en desktop */}
          {isDesktop && (
            <>
              <button
                onClick={() => setIsExpandedDesktop(!isExpandedDesktop)}
                className={`control-button ${isExpandedDesktop ? 'control-button--active' : ''}`}
                title="Expandir reproductor"
              >
                <QueueListIcon className="control-button__icon" />
              </button>
            </>
          )}

          {/* Botones móviles */}
          {!isDesktop && (
            <>
              <button
                onClick={() => setIsQueueVisible(!isQueueVisible)}
                className={`control-button ${isQueueVisible ? 'control-button--active' : ''}`}
                title="Ver cola de reproducción"
              >
                <QueueListIcon className="control-button__icon" />
              </button>
              
              <button
                onClick={() => setIsFullscreenLyrics(!isFullscreenLyrics)}
                className={`control-button ${isFullscreenLyrics ? 'control-button--active' : ''}`}
                title="Ver letras en pantalla completa"
              >
                <DocumentTextIcon className="control-button__icon" />
              </button>
            </>
          )}
        </div>
      </div>

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
                <LyricsViewerInline song={currentSong} isDesktop={isDesktop} />
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
                    className={`control-button ${isShuffled ? 'control-button--active' : ''}`}
                    title="Reproducción aleatoria"
                  >
                    <ArrowsUpDownIcon className="control-button__icon" />
                  </button>
                  
                  <button
                    onClick={toggleRepeat}
                    className={`control-button ${repeatMode !== 'off' ? 'control-button--active' : ''}`}
                    title={`Repetir: ${repeatMode === 'off' ? 'desactivado' : repeatMode === 'all' ? 'toda la lista' : 'canción actual'}`}
                  >
                    {repeatMode === 'one' ? (
                      <ArrowPathIconSolid className="control-button__icon" />
                    ) : (
                      <ArrowPathIcon className="control-button__icon" />
                    )}
                    {repeatMode === 'one' && (
                      <span className="control-button__badge">1</span>
                    )}
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
                      <SortableQueueItem
                        key={`${song.id}-${index}`}
                        song={song}
                        index={index}
                        isCurrentSong={index === currentIndex}
                        onRemove={() => removeFromQueue(index)}
                        onPlay={(song, index) => {
                          setCurrentIndex(index);
                          setCurrentSong(song, currentPlaylist || undefined, index);
                        }}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel expandido de la cola (solo móvil) */}
      {isQueueVisible && !isDesktop && (
        <div className="queue-panel">
          <div className="queue-panel__header">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Cola de reproducción ({queue.length} canciones)
            </h3>
            
            {/* Controles de shuffle y repeat móvil */}
            <div className="mobile-queue-controls">
              <button
                onClick={toggleShuffle}
                className={`control-button ${isShuffled ? 'control-button--active' : ''}`}
                title="Reproducción aleatoria"
              >
                <ArrowsUpDownIcon className="control-button__icon" />
              </button>
              
              <button
                onClick={toggleRepeat}
                className={`control-button ${repeatMode !== 'off' ? 'control-button--active' : ''}`}
                title={`Repetir: ${repeatMode === 'off' ? 'desactivado' : repeatMode === 'all' ? 'toda la lista' : 'canción actual'}`}
              >
                {repeatMode === 'one' ? (
                  <ArrowPathIconSolid className="control-button__icon" />
                ) : (
                  <ArrowPathIcon className="control-button__icon" />
                )}
                {repeatMode === 'one' && (
                  <span className="control-button__badge">1</span>
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {queue.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className={`queue-item ${index === currentIndex ? 'queue-item--current' : ''}`}
                onClick={() => {
                  if (index !== currentIndex) {
                    console.log(`🎵 [QUEUE] Playing song at index ${index}:`, song.title);
                    setCurrentIndex(index);
                    setCurrentSong(song, currentPlaylist || undefined, index);
                  }
                }}
                style={{ cursor: index !== currentIndex ? 'pointer' : 'default' }}
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
                    <TrashIcon className="h-4 w-4" />
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
            <LyricsViewerInline song={currentSong} isDesktop={isDesktop} />
          </div>
        </div>
      )}
      
      {/* Vista de pantalla completa para letras (móvil) */}
      {isFullscreenLyrics && (
        <div className="mobile-fullscreen-player">
          {/* Header con info de la canción */}
          <div className="mobile-fullscreen-header">
            <div className="mobile-fullscreen-song-info">
              <div className="mobile-fullscreen-song-avatar">
                <span>{currentSong.title.charAt(0).toUpperCase()}</span>
              </div>
              <div className="mobile-fullscreen-song-details">
                <h2 className="mobile-fullscreen-song-title">{currentSong.title}</h2>
                <p className="mobile-fullscreen-song-artist">
                  {currentSong.artist || 'Coro Gregorio'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFullscreenLyrics(false)}
              className="mobile-fullscreen-close"
            >
              ✕
            </button>
          </div>
          
          {/* Mensaje de estado si no están sincronizadas */}
          <div className="mobile-fullscreen-status">
            <p>Estas letras no están sincronizadas aún.</p>
          </div>
          
          {/* Contenido de letras */}
          <div className="mobile-fullscreen-lyrics">
            <LyricsViewerInline song={currentSong} isDesktop={false} />
          </div>
          
          {/* Barra de progreso */}
          <div className="mobile-fullscreen-progress">
            <div className="mobile-fullscreen-progress__time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div 
              className="mobile-fullscreen-progress__bar"
              onClick={handleProgressClick}
            >
              <div 
                className="mobile-fullscreen-progress__fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          {/* Controles de reproducción modernos minimalistas */}
          <div className="mobile-fullscreen-controls">


            {/* Controles principales */}
            <div className="mobile-fullscreen-controls-main">
              {/* Control consolidado de modo de reproducción */}
              <button
                onClick={togglePlaybackMode}
                className={`mobile-fullscreen-control mobile-fullscreen-control--small ${
                  isShuffled || repeatMode !== 'off' ? 'mobile-fullscreen-control--active' : ''
                }`}
                title={getPlaybackModeIcon().title}
              >
                {getPlaybackModeIcon().icon}
              </button>

              <button
                onClick={handlePrevious}
                className="mobile-fullscreen-control mobile-fullscreen-control--secondary"
                disabled={currentIndex === 0}
              >
                <svg className="mobile-control-icon mobile-control-icon--large" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button
                onClick={isPlaying ? pause : play}
                className="mobile-fullscreen-control mobile-fullscreen-control--primary"
              >
                {isPlaying ? (
                  <svg className="mobile-control-icon mobile-control-icon--primary" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="mobile-control-icon mobile-control-icon--primary" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button
                onClick={handleNext}
                className="mobile-fullscreen-control mobile-fullscreen-control--secondary"
                disabled={currentIndex === queue.length - 1}
              >
                <svg className="mobile-control-icon mobile-control-icon--large" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>

              {/* Botón de cola de reproducción */}
              <button
                onClick={() => setIsFullscreenQueue(!isFullscreenQueue)}
                className={`mobile-fullscreen-control mobile-fullscreen-control--small ${
                  isFullscreenQueue ? 'mobile-fullscreen-control--active' : ''
                }`}
                title="Cola de reproducción"
              >
                <svg className="mobile-control-icon mobile-control-icon--small" viewBox="0 0 24 24">
                  <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                </svg>
              </button>
            </div>
            

          </div>
        </div>
      )}

      {/* Cola de reproducción en pantalla completa para móvil */}
      {isFullscreenQueue && !isDesktop && (
        <div className="mobile-fullscreen-queue">
          <div className="mobile-fullscreen-queue__header">
            <h2 className="mobile-fullscreen-queue__title">Cola de reproducción</h2>
            <button
              onClick={() => setIsFullscreenQueue(false)}
              className="mobile-fullscreen-queue__close"
            >
              ✕
            </button>
          </div>
          
          <div className="mobile-fullscreen-queue__content">
            {queue.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className={`mobile-fullscreen-queue__item ${
                  index === currentIndex ? 'mobile-fullscreen-queue__item--current' : ''
                }`}
                onClick={() => {
                  if (index !== currentIndex) {
                    console.log(`🎵 [QUEUE] Playing song at index ${index}:`, song.title);
                    setCurrentIndex(index);
                    setCurrentSong(song, currentPlaylist || undefined, index);
                  }
                }}
                style={{ cursor: index !== currentIndex ? 'pointer' : 'default' }}
              >
                <div className="mobile-fullscreen-queue__avatar">
                  <span>{song.title.charAt(0).toUpperCase()}</span>
                </div>
                
                <div className="mobile-fullscreen-queue__info">
                  <h3 className="mobile-fullscreen-queue__title-song">{song.title}</h3>
                  {song.artist && (
                    <p className="mobile-fullscreen-queue__artist">{song.artist}</p>
                  )}
                </div>

                {index !== currentIndex && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(index);
                    }}
                    className="mobile-fullscreen-queue__remove"
                  >
                    <TrashIcon className="h-5 w-5" />
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
