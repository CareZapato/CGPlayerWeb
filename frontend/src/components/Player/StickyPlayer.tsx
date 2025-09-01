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
import type { Song, VoiceType } from '../../types';
import './StickyPlayer.css';

// Componente para elemento sorteable de la cola
interface SortableQueueItemProps {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  onRemove: () => void;
}

const SortableQueueItem: React.FC<SortableQueueItemProps> = ({
  song,
  index,
  isCurrentSong,
  onRemove
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
          >
            <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
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
        
        {/* Botón de eliminar */}
        {!isCurrentSong && (
          <button
            onClick={onRemove}
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
}

const LyricsViewerInline: React.FC<LyricsViewerInlineProps> = ({ song, isDesktop = true }) => {
  const [displayMode, setDisplayMode] = useState<'sync' | 'files'>('sync');
  const [selectedVoiceType, setSelectedVoiceType] = useState<VoiceType | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  
  const { 
    lyrics, 
    syncedLyrics, 
    isLoading, 
    loadLyrics, 
    loadSyncedLyrics
  } = useLyrics(song?.id);
  
  const { currentTime, seekTo, isPlaying } = usePlayerStore();
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

  // Obtener letras filtradas por voiceType
  const filteredLyrics = (Array.isArray(syncedLyrics) ? syncedLyrics : []).filter(lyric => {
    // Si no hay voiceType seleccionado, mostrar todas las letras
    if (selectedVoiceType === null) {
      return true;
    }
    // Si hay voiceType seleccionado, filtrar por ese tipo
    return lyric.voiceType === selectedVoiceType;
  }).sort((a, b) => a.lineNumber - b.lineNumber);

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
        songTitle: song?.title
      });
    }
  }, [filteredLyrics, song?.title]);

  // Separar letras sincronizadas de letras de texto
  const syncedOnlyLyrics = filteredLyrics.filter(lyric => !lyric.isTextLyrics);
  const textOnlyLyrics = filteredLyrics.filter(lyric => lyric.isTextLyrics);

  // Obtener archivos de letras de la canción principal
  const lyricsFiles = lyrics?.lyricsFiles || [];

  // Encontrar línea activa (solo si hay sincronización real con tiempo > 0)
  useEffect(() => {
    if (!syncStatus.hasRealSyncData || !isPlaying) {
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
  }, [currentTime, filteredLyrics, syncStatus.hasRealSyncData, isPlaying, activeLineIndex]);

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
      .filter(l => l.voiceType !== null)
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
      <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {displayMode === 'sync' ? (
          // Synchronized and text lyrics
          <div className="space-y-2">
            {filteredLyrics.length > 0 ? (
              <>
                {/* Mostrar advertencia si solo hay letras con tiempo 0 */}
                {syncStatus.hasOnlyZeroTime && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">!</span>
                      </div>
                      <p className="text-sm text-amber-700">
                        <strong>Letras sin sincronizar:</strong> Esta canción tiene letras pero sin tiempos de sincronización válidos.
                      </p>
                    </div>
                  </div>
                )}

                {/* Mostrar advertencia si hay datos en BD pero no se ven */}
                {syncedOnlyLyrics.length === 0 && textOnlyLyrics.length === 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">i</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        <strong>Debug:</strong> No se encontraron letras sincronizadas en la respuesta del servidor.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Mostrar letras sincronizadas */}
                {syncedOnlyLyrics.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
                      Letras Sincronizadas
                    </h4>
                    {syncedOnlyLyrics.map((lyric, index) => {
                      // Determinar si es línea activa (solo para letras con tiempo real > 0)
                      const isActiveLine = syncStatus.hasRealSyncData && 
                        lyric.startTime !== undefined && 
                        lyric.startTime !== null && 
                        lyric.startTime > 0 &&
                        currentTime >= lyric.startTime && 
                        (syncedOnlyLyrics[index + 1]?.startTime === undefined || 
                         syncedOnlyLyrics[index + 1]?.startTime === null || 
                         currentTime < (syncedOnlyLyrics[index + 1]?.startTime || Infinity));
                      
                      // Determinar si tiene tiempo definido (incluso 0)
                      const hasTimeData = lyric.startTime !== undefined && lyric.startTime !== null;
                      const isZeroTime = hasTimeData && lyric.startTime === 0;
                      const isValidTime = hasTimeData && (lyric.startTime || 0) > 0;
                      
                      return (
                        <div
                          key={lyric.id}
                          ref={isActiveLine ? activeLineRef : null}
                          onClick={() => handleLineClick(lyric)}
                          className={`p-3 rounded-lg transition-all border ${
                            isActiveLine
                              ? 'bg-blue-100 border-blue-300 text-blue-900 shadow-md'
                              : isValidTime
                                ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer hover:shadow-sm'
                                : isZeroTime
                                  ? 'bg-amber-50 border-amber-200 text-gray-800'
                                  : 'bg-white border-gray-200 text-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className={`font-medium ${
                                isActiveLine ? 'text-blue-900' : 'text-gray-900'
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
                            {hasTimeData && (
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  isValidTime 
                                    ? 'text-gray-500 bg-gray-100' 
                                    : 'text-amber-700 bg-amber-100'
                                }`}>
                                  {formatTime(lyric.startTime || 0)}
                                </span>
                                {isZeroTime && (
                                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                    Sin sincronizar
                                  </span>
                                )}
                                {isActiveLine && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Mostrar letras de texto */}
                {textOnlyLyrics.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
                      Letras de Texto
                    </h4>
                    {textOnlyLyrics.map((lyric) => (
                      <div
                        key={lyric.id}
                        className="p-3 rounded-lg border bg-yellow-50 border-yellow-200 text-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No hay letras disponibles</p>
                <p className="text-sm mt-1">Prueba cambiar el filtro de voz o revisa los archivos de letras</p>
              </div>
            )}
          </div>
        ) : (
          // Files mode - Mejorado para mostrar PDFs e imágenes
          <div className="space-y-3">
            {/* Debug info para archivos */}
            {song?.title?.toLowerCase().includes('cry') && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Debug - Don't Cry:</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Archivos encontrados: {lyricsFiles.length}
                </p>
                <p className="text-xs text-blue-600">
                  Song ID: {song?.id}
                </p>
                <p className="text-xs text-blue-600">
                  Voice Type: {song?.voiceType || 'No definido'}
                </p>
                <p className="text-xs text-blue-600">
                  Parent Song ID: {(lyrics as any)?.parentSongId || 'No definido'}
                </p>
              </div>
            )}
            
            {lyricsFiles.length > 0 ? (
              lyricsFiles.map(file => {
                // Construir URL del archivo con token de autenticación
                const token = localStorage.getItem('token');
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                const fileUrl = `${baseUrl}/lyrics/files/${file.id}${token ? `?token=${token}` : ''}`;
                
                const isPDF = file.fileType === 'PDF';
                const isImage = file.fileType === 'IMAGE_JPG' || file.fileType === 'IMAGE_PNG';
                
                return (
                  <div
                    key={file.id}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                  >
                    {/* Header del archivo */}
                    <div className="p-3 bg-gray-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold ${
                            isPDF ? 'bg-red-500' : isImage ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            {isPDF ? 'PDF' : isImage ? 'IMG' : 'DOC'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 truncate">
                              {file.fileName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {file.fileType.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(fileUrl, '_blank')}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Abrir
                        </button>
                      </div>
                    </div>
                    
                    {/* Preview del contenido */}
                    <div className="p-3">
                      {isPDF ? (
                        <div className="bg-gray-100 rounded p-4 text-center">
                          <p className="text-gray-600 mb-2">Vista previa de PDF</p>
                          <iframe
                            src={fileUrl}
                            className="w-full h-80 border rounded"
                            title={`PDF: ${file.fileName}`}
                          />
                        </div>
                      ) : isImage ? (
                        <div className="text-center">
                          <img
                            src={fileUrl}
                            alt={file.fileName}
                            className="max-w-full h-48 object-contain mx-auto rounded"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              const fallbackDiv = target.nextElementSibling as HTMLDivElement;
                              target.style.display = 'none';
                              if (fallbackDiv) {
                                fallbackDiv.style.display = 'block';
                              }
                            }}
                          />
                          <div className="hidden bg-gray-100 rounded p-4 text-gray-600">
                            No se pudo cargar la imagen
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 rounded p-4 text-center text-gray-600">
                          Tipo de archivo no soportado para vista previa
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
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
} from '@heroicons/react/24/solid';const StickyPlayer: React.FC = () => {
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
    previousSong,
    isShuffled,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    moveInQueue,
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
                <LyricsViewerInline song={currentSong} isDesktop={isDesktop} />
              </div>
            </div>
            
            {/* Panel de cola y controles - 25% */}
            <div className="desktop-queue-panel">
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
            <LyricsViewerInline song={currentSong} isDesktop={false} />
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
