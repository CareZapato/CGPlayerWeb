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
  
  // @ts-ignore - Variables used in queue handlers below
  const { currentTime, seekTo, isPlaying, currentPlaylist, setCurrentSong } = usePlayerStore();
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

  // Obtener letras filtradas por voiceType
  const filteredLyrics = (Array.isArray(syncedLyrics) ? syncedLyrics : []).filter(lyric => {
    // Si no hay voiceType seleccionado, mostrar todas las letras
    if (selectedVoiceType === null) {
      return true;
    }
    // Si hay voiceType seleccionado, filtrar por ese tipo
    return lyric.voiceType === selectedVoiceType;
  }).sort((a, b) => a.lineNumber - b.lineNumber);

  // Debug: Log filtering process
  useEffect(() => {
    if (Array.isArray(syncedLyrics) && syncedLyrics.length > 0) {
      const allVoiceTypes = [...new Set(syncedLyrics.map(l => l.voiceType))];
      console.log('🎯 [FILTERING DEBUG]', {
        songTitle: song?.title,
        totalSyncedLyrics: syncedLyrics.length,
        selectedVoiceType,
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
  }, [syncedLyrics, selectedVoiceType, filteredLyrics, song?.title]);

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

  // Separar letras sincronizadas de letras de texto
  const syncedOnlyLyrics = filteredLyrics.filter(lyric => !lyric.isTextLyrics);
  const textOnlyLyrics = filteredLyrics.filter(lyric => lyric.isTextLyrics);

  // Debug: Log separated lyrics
  useEffect(() => {
    if (filteredLyrics.length > 0) {
      console.log('📝 [LYRICS SEPARATION]', {
        totalFiltered: filteredLyrics.length,
        syncedOnly: syncedOnlyLyrics.length,
        textOnly: textOnlyLyrics.length,
        syncedWithZeroTime: syncedOnlyLyrics.filter(l => l.startTime === 0).length,
        songTitle: song?.title
      });
    }
  }, [syncedOnlyLyrics, textOnlyLyrics, filteredLyrics, song?.title]);

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
    <div className="h-full flex flex-col" style={{ height: '100%' }}>
      {/* Mode selector */}
      <div className="flex space-x-2 mb-2 flex-shrink-0">
        <button
          onClick={() => setDisplayMode('sync')}
          className={`px-3 py-1 text-xs rounded ${
            displayMode === 'sync'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📝 Letras Sincronizadas
        </button>
        <button
          onClick={() => setDisplayMode('files')}
          className={`px-3 py-1 text-xs rounded ${
            displayMode === 'files'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📁 Archivos ({lyricsFiles.length})
        </button>
      </div>

      {/* Voice type selector for sync mode */}
      {displayMode === 'sync' && availableVoiceTypes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 flex-shrink-0">
          <button
            onClick={() => setSelectedVoiceType(null)}
            className={`px-2 py-1 text-xs rounded ${
              selectedVoiceType === null
                ? 'bg-gray-200 text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas las Voces
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
      <div style={{ height: '100%', overflowY: 'auto' }} className="flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {displayMode === 'sync' ? (
          // Synchronized and text lyrics
          <div className="space-y-2">
            {filteredLyrics.length > 0 ? (
              <>
                {/* Mostrar advertencia si solo hay letras con tiempo 0 */}
                {syncStatus.hasOnlyZeroTime && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">📝</span>
                      </div>
                      <p className="text-sm text-green-700">
                        <strong>Letras estáticas:</strong> Esta canción tiene letras guardadas que se muestran de forma fija (sin seguimiento de tiempo).
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
                
                {/* Mostrar letras sincronizadas (incluye letras con tiempo 0) */}
                {syncedOnlyLyrics.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
                      {syncStatus.hasOnlyZeroTime ? 'Letras Estáticas (Sin Sincronización)' : 'Letras Sincronizadas'}
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
                      const isStaticLyric = !hasTimeData || isZeroTime; // Sin tiempo o tiempo 0
                      
                      return (
                        <div
                          key={lyric.id}
                          ref={isActiveLine ? activeLineRef : null}
                          onClick={() => handleLineClick(lyric)}
                          className={`p-3 rounded-lg transition-all border ${
                            isActiveLine
                              ? 'bg-blue-100 border-blue-300 text-blue-900 shadow-md'
                              : isValidTime
                                ? 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-900 cursor-pointer hover:shadow-sm'
                                : isStaticLyric
                                  ? 'bg-green-50 border-green-200 text-gray-800'
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
                            {(hasTimeData || isStaticLyric) && (
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  isValidTime 
                                    ? 'text-gray-500 bg-gray-100' 
                                    : 'text-green-700 bg-green-100'
                                }`}>
                                  {isStaticLyric ? 'Estática' : formatTime(lyric.startTime || 0)}
                                </span>
                                {isStaticLyric && (
                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                    📝 Letra fija
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

// Componente para visualizar PDFs con autenticación
interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName }) => {
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es móvil
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // En móvil, usar directamente la URL con token
        if (isMobile) {
          setPdfBlob(fileUrl);
          setIsLoading(false);
          return;
        }

        // En PC, usar fetch para cargar como blob
        const token = localStorage.getItem('token');
        const response = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlob(blobUrl);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Error cargando PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();

    // Cleanup: revoke blob URL when component unmounts
    return () => {
      if (pdfBlob && !isMobile) {
        URL.revokeObjectURL(pdfBlob);
      }
    };
  }, [fileUrl, isMobile]);

  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded p-4 text-center">
        <p className="text-gray-600">Cargando PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded p-4 text-center">
        <p className="text-red-600 mb-2">Error cargando PDF</p>
        <p className="text-sm text-red-500">{error}</p>
        <button 
          onClick={() => window.open(fileUrl, '_blank')}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Abrir en nueva pestaña
        </button>
      </div>
    );
  }

  // Para móvil, mostrar solo el botón de abrir
  if (isMobile) {
    return (
      <div className="bg-gray-100 rounded p-4 text-center">
        <div className="mb-3">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-700 font-medium">{fileName}</p>
          <p className="text-gray-500 text-sm">PDF disponible</p>
        </div>
        <button 
          onClick={() => window.open(fileUrl, '_blank')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          📄 Abrir PDF
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ height: '100vh', minHeight: '100vh' }}>
      <iframe
        src={`${pdfBlob}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
        className="w-full border-0 flex-1"
        title={`PDF: ${fileName}`}
        style={{ 
          height: '100vh', 
          minHeight: '100vh',
          width: '100%',
          border: 'none',
          margin: 0,
          padding: 0
        }}
      />
    </div>
  );
};

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
          {/* Botón de cerrar flotante */}
          <button
            onClick={() => setIsExpandedDesktop(false)}
            className="fixed top-4 right-4 z-50 p-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full transition-all"
            title="Cerrar vista expandida"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          
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
