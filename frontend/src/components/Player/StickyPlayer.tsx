import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { useMediaSession } from '../../hooks/useMediaSession';
import { useServerInfo } from '../../hooks/useServerInfo';
import { getSongFileUrl } from '../../config/api';
import { updateFavicon, resetFavicon } from '../../utils/favicon';
import { useLyrics } from '../../hooks/useLyrics';
import MinimizedPlayer from '../BottomPlayer/MinimizedPlayer';
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

// Interfaces para tipado
interface LyricLine {
  id: string;
  content: string;
  lineNumber: number;
  voiceType?: string | null;
  startTime?: number | null;
  isTextLyrics?: boolean;
  isHighlighted?: boolean;
}

interface SongWithFolder extends Song {
  folderName?: string;
  parentSongId?: string;
}

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

// Componente para elemento sorteable de la cola móvil
interface MobileSortableQueueItemProps {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  onRemove: () => void;
  onPlay: (song: Song, index: number) => void;
}

const MobileSortableQueueItem: React.FC<MobileSortableQueueItemProps> = ({
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
    id: `mobile-${song.id}-${index}`,
    disabled: isCurrentSong // No permitir arrastrar la canción actual
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : 1
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`mobile-fullscreen-queue__item ${
        isCurrentSong ? 'mobile-fullscreen-queue__item--current' : ''
      } ${isDragging ? 'mobile-fullscreen-queue__item--dragging' : ''}`}
    >
      {/* Handle de arrastre para móvil */}
      {!isCurrentSong && (
        <div 
          {...attributes} 
          {...listeners}
          className="mobile-fullscreen-queue__drag-handle"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
            <circle cx="3" cy="4" r="1.5"/>
            <circle cx="9" cy="4" r="1.5"/>
            <circle cx="3" cy="10" r="1.5"/>
            <circle cx="9" cy="10" r="1.5"/>
            <circle cx="3" cy="16" r="1.5"/>
            <circle cx="9" cy="16" r="1.5"/>
          </svg>
        </div>
      )}

      <div className="mobile-fullscreen-queue__item-content">
        <div 
          className="mobile-fullscreen-queue__avatar"
          onClick={() => {
            if (!isCurrentSong) {
              onPlay(song, index);
            }
          }}
          style={{ cursor: isCurrentSong ? 'default' : 'pointer' }}
        >
          <span>{song.title.charAt(0).toUpperCase()}</span>
        </div>
        
        <div 
          className="mobile-fullscreen-queue__info"
          onClick={() => {
            if (!isCurrentSong) {
              onPlay(song, index);
            }
          }}
          style={{ cursor: isCurrentSong ? 'default' : 'pointer' }}
        >
          <h3 className="mobile-fullscreen-queue__title-song">{song.title}</h3>
          {song.artist && (
            <p className="mobile-fullscreen-queue__artist">{song.artist}</p>
          )}
        </div>

        {!isCurrentSong && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="mobile-fullscreen-queue__remove"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Componente para elemento sorteable de la cola simple (fondo blanco)
interface SimpleSortableQueueItemProps {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  onRemove: () => void;
  onPlay: (song: Song, index: number) => void;
}

const SimpleSortableQueueItem: React.FC<SimpleSortableQueueItemProps> = ({
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
    id: `simple-${song.id}-${index}`,
    disabled: isCurrentSong // No permitir arrastrar la canción actual
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`queue-item ${isCurrentSong ? 'queue-item--current' : ''} ${isDragging ? 'queue-item--dragging' : ''}`}
      onClick={() => {
        if (!isCurrentSong) {
          onPlay(song, index);
        }
      }}
    >
      <div className="queue-item__info">
        {/* Handle de arrastre para cola simple */}
        {!isCurrentSong && (
          <div 
            {...attributes} 
            {...listeners}
            className="queue-item__drag-handle"
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}

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

      {!isCurrentSong && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="queue-item__remove"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Componente inline para evitar problemas de importación
interface LyricsViewerInlineProps {
  song: Song;
  isDesktop?: boolean;
  showSyncButton?: boolean;
  autoSyncEnabled: boolean;
  toggleAutoSync: () => void;
  onSyncStatusChange?: (hasSyncedLyrics: boolean) => void; // Nueva prop para reportar estado
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
  
  // Estado para manejar scroll manual vs automático
  const [userScrolled, setUserScrolled] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoScrollingRef = useRef(false);
  const lastActiveIndexRef = useRef(-1);
  
  // Función para alternar entre sync y files en móvil
  const toggleMobileDisplayMode = () => {
    setDisplayMode(displayMode === 'sync' ? 'files' : 'sync');
  };

  // Función para toggle del sincronizador automático
  // (removida - ahora viene como prop desde StickyPlayer)

  // Función para obtener el icono del modo de display actual
  const getMobileDisplayIcon = () => {
    // En móvil, mostrar la opción a la que se va a cambiar, no la actual
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
  
  // Variables del reproductor para las letras
  const { currentTime, seekTo, isPlaying } = usePlayerStore();
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Cargar letras cuando cambie la canción
  useEffect(() => {
    if (song?.id) {
      console.log('🎵 Loading lyrics for song:', song.title, 'ID:', song.id);
      loadLyrics(song.id);
      loadSyncedLyrics(song.id);
    }
  }, [song?.id, song?.title, loadLyrics, loadSyncedLyrics]);

  // Debug: Log lyrics data when it changes
  useEffect(() => {
    if (lyrics) {
      console.log('📄 [FRONTEND] Lyrics loaded:', lyrics);
      console.log('📁 [FRONTEND] LyricsFiles count:', lyrics.lyricsFiles?.length || 0);
      console.log('📁 [FRONTEND] LyricsFiles:', lyrics.lyricsFiles);
      console.log('📁 [FRONTEND] Song parentSongId:', (lyrics as { parentSongId?: string }).parentSongId);
      console.log('📁 [FRONTEND] Song voiceType:', lyrics.voiceType);
      console.log('📱 [FRONTEND] Device type:', isDesktop ? 'Desktop' : 'Mobile');
      
      // Debug específico para Don't Cry
      if (song?.title?.toLowerCase().includes('cry')) {
        console.log('🔍 [DON\'T CRY DEBUG] Full lyrics object:', JSON.stringify(lyrics, null, 2));
        console.log('🔍 [DON\'T CRY DEBUG] Current song details:', {
          id: song.id,
          title: song.title,
          voiceType: song.voiceType,
          parentSongId: (song as SongWithFolder).parentSongId
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
      
      // REPORTAR ESTADO DE SINCRONIZACIÓN AL COMPONENTE PADRE
      if (onSyncStatusChange) {
        console.log('📡 [SYNC REPORT] Reportando al StickyPlayer:', syncStatus.hasRealSyncData);
        onSyncStatusChange(syncStatus.hasRealSyncData);
      }
    }
  }, [filteredLyrics, song?.title, syncStatus, onSyncStatusChange]);

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

    // Buscar la línea activa con mejor lógica de duración
    let newActiveIndex = -1;
    
    for (let i = 0; i < syncedLyrics_withTime.length; i++) {
      const currentLyric = syncedLyrics_withTime[i];
      const currentStart = currentLyric.startTime || 0;
      
      // Buscar el siguiente lyric con tiempo válido para determinar cuando termina este
      let nextStart = Infinity;
      for (let j = i + 1; j < syncedLyrics_withTime.length; j++) {
        const futurelyric = syncedLyrics_withTime[j];
        if (futurelyric.startTime && futurelyric.startTime > currentStart) {
          nextStart = futurelyric.startTime;
          break;
        }
      }
      
      // Si no hay siguiente línea, usar duración mínima de 5 segundos
      if (nextStart === Infinity && currentStart > 0) {
        nextStart = currentStart + 5; // Mínimo 5 segundos para la última línea
      }
      
      // Si la duración es muy corta (menos de 2 segundos), extenderla
      if (nextStart !== Infinity && (nextStart - currentStart) < 2) {
        nextStart = currentStart + 2; // Mínimo 2 segundos por línea
      }
      
      // La línea está activa desde su startTime hasta el startTime de la siguiente línea
      if (currentTime >= currentStart && currentTime < nextStart && currentStart > 0) {
        newActiveIndex = i;
        break; // Tomar la primera línea que coincida
      }
    }

    if (newActiveIndex !== activeLineIndex) {
      setActiveLineIndex(newActiveIndex);
    }
  }, [currentTime, syncedLyrics_withTime, syncStatus.hasRealSyncData, isPlaying, activeLineIndex, autoSyncEnabled]);

  // Función para manejar scroll manual del usuario
  const handleUserScroll = useCallback(() => {
    if (isAutoScrollingRef.current) {
      // Si estamos en medio de un auto-scroll, ignorar
      return;
    }
    
    // Marcar que el usuario hizo scroll manual
    setUserScrolled(true);
    
    // Limpiar timeout anterior si existe
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reactivar auto-scroll después de 3 segundos de inactividad
    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolled(false);
    }, 3000);
  }, []);

  // Auto-scroll inteligente - centra la letra activa manteniendo zona segura
  useEffect(() => {
    // Si no hay letra activa, salir
    if (!activeLineRef.current || activeLineIndex === -1) {
      return;
    }
    
    const lyricsContainer = activeLineRef.current.closest('[style*="overflow"]') || 
                           activeLineRef.current.closest('.lyrics-content-container') ||
                           activeLineRef.current.closest('.sticky-player-lyrics');
    
    if (!lyricsContainer || !activeLineRef.current) {
      return;
    }

    // Obtener posiciones actuales
    const containerRect = lyricsContainer.getBoundingClientRect();
    const elementRect = activeLineRef.current.getBoundingClientRect();
    const currentScrollTop = lyricsContainer.scrollTop;
    const containerHeight = lyricsContainer.clientHeight;
    const elementTop = activeLineRef.current.offsetTop;
    
    // Definir zona segura (80px desde arriba para evitar cubrir controles)
    const safeZoneTop = 80;
    const safeZoneBottom = containerHeight - 80;
    
    // Calcular posición ideal (centrada en el área visible)
    const idealScrollTop = Math.max(0, elementTop - containerHeight / 2);
    
    // Verificar si el elemento está en la zona visible y centrada
    const elementRelativeTop = elementRect.top - containerRect.top;
    const isInCenterZone = elementRelativeTop >= safeZoneTop && elementRelativeTop <= safeZoneBottom;
    const isNearCenter = Math.abs(elementRelativeTop - containerHeight / 2) < 50;
    
    // Verificar si la letra activa está completamente fuera de la vista
    const isCompletelyOutOfView = elementRelativeTop < -20 || elementRelativeTop > containerHeight + 20;
    
    // Verificar si el índice activo ha cambiado desde la última vez
    const activeIndexChanged = activeLineIndex !== lastActiveIndexRef.current;
    lastActiveIndexRef.current = activeLineIndex;
    
    // Lógica de scroll más agresiva:
    // 1. Si el índice activo cambió Y la letra está fuera de vista -> FORZAR scroll
    // 2. Si el usuario hizo scroll manual Y la letra activa aún está visible -> NO hacer scroll
    // 3. Si el usuario hizo scroll manual PERO la letra activa está fuera de vista -> FORZAR scroll INMEDIATAMENTE
    // 4. Si no hay scroll manual -> comportamiento normal
    
    const shouldForceScrollOnChange = activeIndexChanged && isCompletelyOutOfView;
    const shouldForceScrollOnOutOfView = userScrolled && isCompletelyOutOfView;
    const shouldNormalScroll = !userScrolled && (!isNearCenter || elementRelativeTop < safeZoneTop || elementRelativeTop > safeZoneBottom);
    
    if (shouldForceScrollOnChange || shouldForceScrollOnOutOfView || shouldNormalScroll) {
      // Si vamos a forzar scroll por estar fuera de vista, resetear el estado de scroll manual
      if (shouldForceScrollOnChange || shouldForceScrollOnOutOfView) {
        setUserScrolled(false);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        console.log('🚨 FORZANDO AUTO-SCROLL:', {
          reason: shouldForceScrollOnChange ? 'Índice cambió' : 'Letra fuera de vista',
          activeLineIndex,
          elementRelativeTop,
          isCompletelyOutOfView
        });
      }
      
      // Si el scroll ideal es hacia arriba pero muy poco, usar posición actual
      const finalScrollTop = idealScrollTop < currentScrollTop - 50 ? currentScrollTop : idealScrollTop;
      
      // Marcar que estamos haciendo auto-scroll
      isAutoScrollingRef.current = true;
      
      // Aplicar scroll suave hacia la posición calculada
      lyricsContainer.scrollTo({
        top: finalScrollTop,
        behavior: 'smooth'
      });
      
      // Marcar que terminó el auto-scroll después de la animación
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 300);
    }
    
    console.log('StickyPlayer Lyrics Sync Debug:', {
      activeLineIndex,
      userScrolled,
      activeIndexChanged,
      isCompletelyOutOfView,
      shouldForceScrollOnChange,
      shouldForceScrollOnOutOfView,
      shouldNormalScroll,
      isInCenterZone,
      isNearCenter,
      elementRelativeTop,
      currentScroll: currentScrollTop,
      idealScroll: idealScrollTop,
      containerHeight,
      safeZoneTop,
      safeZoneBottom
    });
  }, [activeLineIndex, userScrolled]);

  // Detectar scroll manual del usuario
  useEffect(() => {
    const lyricsContainerSelectors = [
      '.desktop-lyrics-content',
      '.mobile-fullscreen-lyrics',
      '.sticky-player-lyrics [style*="overflow"]'
    ];
    
    const lyricsContainers = lyricsContainerSelectors
      .map(selector => document.querySelector(selector))
      .filter(Boolean);
    
    lyricsContainers.forEach(container => {
      if (container) {
        container.addEventListener('scroll', handleUserScroll);
      }
    });
    
    return () => {
      lyricsContainers.forEach(container => {
        if (container) {
          container.removeEventListener('scroll', handleUserScroll);
        }
      });
    };
  }, [handleUserScroll]);

  const handleLineClick = (lyric: LyricLine) => {
    // Al hacer click, marcar como scroll manual y buscar línea
    setUserScrolled(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolled(false);
    }, 3000);
    
    if (lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0) {
      seekTo(lyric.startTime);
    }
  };

  // Cleanup de timeouts al desmontar componente
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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
                  <div className="space-y-3">
                    {allLyricsForDisplay.map((lyric: LyricLine) => {
                      // Determinar si es línea activa basado en el activeLineIndex calculado
                      const activeLyricFromSynced = activeLineIndex >= 0 ? syncedLyrics_withTime[activeLineIndex] : null;
                      const isActiveLine = activeLyricFromSynced && lyric.id === activeLyricFromSynced.id;
                      
                      // Determinar si tiene tiempo definido (incluso 0)
                      const hasTimeData = lyric.startTime !== undefined && lyric.startTime !== null;
                      const isValidTime = hasTimeData && (lyric.startTime || 0) > 0;
                      
                      // COLORES BASE FIJOS - SIN FONDOS, SOLO TEXTO
                      const isHighlighted = lyric.isHighlighted === true;
                      const baseTextColor = isHighlighted ? 'text-purple-800' : 'text-gray-500';
                      
                      // EFECTOS DE RESALTADO TEMPORAL - ZOOM MUY SUTIL
                      const activeEffects = isActiveLine 
                        ? 'transform scale-110' 
                        : '';
                      const hoverEffects = isValidTime ? 'hover:scale-105 cursor-pointer' : '';
                      
                      // PESO DE FUENTE: Solo negrita cuando está activo
                      const fontWeight = isActiveLine ? 'font-bold' : 'font-normal';
                      
                      // TODAS LAS LETRAS SIEMPRE VISIBLES
                      const visibilityClass = 'opacity-100';
                      
                      return (
                        <div
                          key={lyric.id}
                          ref={isActiveLine ? activeLineRef : null}
                          onClick={() => handleLineClick(lyric)}
                          className={`lyrics-line transition-all duration-300 ease-out py-3 px-2 mx-1 ${
                            activeEffects
                          } ${hoverEffects} ${visibilityClass}`}
                        >
                          {/* Solo el texto, sin fondos ni decoraciones */}
                          <div className="flex justify-center items-center w-full">
                            <p 
                              className={`text-center ${baseTextColor} ${fontWeight} text-lg leading-relaxed mx-auto ${
                                // Responsive text sizing
                                isDesktop ? 'sm:text-base md:text-lg lg:text-xl' : 'text-base'
                              }`}
                              style={{
                                // Efecto 3D muy sutil en el texto cuando está activo
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
    setCurrentSong,
    playSong
  } = usePlayerStore();

  const {
    queue,
    currentIndex,
    isShuffled,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    moveInQueue,
    setCurrentIndex,
    removeFromQueue: removeFromQueueByID
  } = usePlaylistStore();

  const { serverInfo } = useServerInfo();

  // Función para construir URL de canción
  const buildSongUrl = (song: Song): string => {
    const songWithFolder = song as SongWithFolder;
    if (songWithFolder.folderName) {
      return getSongFileUrl(songWithFolder.folderName, song.fileName);
    } else {
      return `${serverInfo.audioBaseUrl}-root/${song.fileName}`;
    }
  };

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [isFullscreenLyrics, setIsFullscreenLyrics] = useState(false);
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(false);
  const [isFullscreenQueue, setIsFullscreenQueue] = useState(false); // Nueva variable para cola en fullscreen móvil
  const [isMinimized, setIsMinimized] = useState(false); // Nuevo estado para minimización

  // Estado del sincronizador automático - movido desde LyricsViewerInline
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    const saved = localStorage.getItem('lyrics-auto-sync');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Estado para recibir el estado de sincronización desde LyricsViewerInline
  const [hasSyncedLyrics, setHasSyncedLyrics] = useState(false);

  // Estados para el drag de la barra de progreso
  const [isDragging, setIsDragging] = useState(false);
  const [draggingElement, setDraggingElement] = useState<HTMLElement | null>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const titleRef = useRef<HTMLParagraphElement>(null);

  // Función para toggle del sincronizador automático
  const toggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('lyrics-auto-sync', JSON.stringify(newValue));
  };

  // Callback para recibir el estado de sincronización desde LyricsViewerInline
  const handleSyncStatusChange = (syncStatus: boolean) => {
    console.log('🔄 [SYNC STATUS RECEIVED] Recibido desde LyricsViewerInline:', syncStatus);
    setHasSyncedLyrics(syncStatus);
  };

  const progressRef = useRef<HTMLDivElement>(null);

  // Detectar si estamos en desktop o móvil
  const [isDesktop, setIsDesktop] = useState(() => {
    // Mejorar detección para DevTools
    const userAgent = navigator.userAgent;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Si es un user agent móvil, considerarlo móvil independientemente del ancho
    if (isMobileUserAgent) return false;
    
    // Si el ancho es menor a 768px, es móvil
    if (screenWidth < 768) return false;
    
    // Si la proporción es más alta que ancha (modo portrait), probablemente móvil
    if (screenHeight > screenWidth && screenWidth < 1024) return false;
    
    return true;
  });

  // Configurar sensores para drag & drop - MEJORADO para móvil
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: isDesktop ? 5 : 8, // Más distancia en móvil para evitar conflictos con scroll
      delay: isDesktop ? 0 : 100, // Pequeño delay en móvil para diferenciar de scroll
      tolerance: isDesktop ? 5 : 10, // Mayor tolerancia en móvil
    },
  });
  
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

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

  // Configurar Media Session API para controles nativos en móvil
  useMediaSession();

  // Función para actualizar el progreso (funciona con cualquier barra de progreso)
  const handleProgressUpdate = useCallback((clientX: number, targetElement?: HTMLElement) => {
    if (!duration) return;
    
    // Use the target element if provided, otherwise fall back to progressRef
    const element = targetElement || progressRef.current;
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    seekTo(newTime);
  }, [duration, seekTo]);

  // Manejar inicio del drag
  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to parent elements
    setIsDragging(true);
    setDraggingElement(e.currentTarget);
    handleProgressUpdate(e.clientX, e.currentTarget);
  }, [handleProgressUpdate]);

  // Manejar inicio del drag en touch
  const handleProgressTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to parent elements
    setIsDragging(true);
    setDraggingElement(e.currentTarget);
    handleProgressUpdate(e.touches[0].clientX, e.currentTarget);
  }, [handleProgressUpdate]);

  // Manejar eventos globales de mouse y touch
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && draggingElement) {
        e.preventDefault();
        e.stopPropagation();
        handleProgressUpdate(e.clientX, draggingElement);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && draggingElement && e.touches.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        handleProgressUpdate(e.touches[0].clientX, draggingElement);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setDraggingElement(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, draggingElement, handleProgressUpdate]);

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

  // Detectar si el título necesita marquee
  useEffect(() => {
    const checkTitleOverflow = () => {
      if (titleRef.current && currentSong) {
        const element = titleRef.current;
        const isOverflowing = element.scrollWidth > element.clientWidth;
        setShouldMarquee(isOverflowing);
      }
    };

    // Comprobar inmediatamente y después de un retraso para asegurar el render
    checkTitleOverflow();
    const timeoutId = setTimeout(checkTitleOverflow, 100);

    return () => clearTimeout(timeoutId);
  }, [currentSong]);

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

  // Si está minimizado, mostrar solo la esfera flotante
  if (isMinimized) {
    return <MinimizedPlayer onExpand={() => setIsMinimized(false)} />;
  }

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
    if (!duration || isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    seekTo(newTime);
  };

  const handleNext = () => {
    console.log('🎵 [STICKY] Intentando siguiente canción...', { 
      currentIndex, 
      queueLength: queue.length, 
      repeatMode,
      currentSong: currentSong?.title 
    });
    
    // Verificar que el índice actual sea válido
    if (currentIndex >= queue.length || currentIndex < 0) {
      console.log('⚠️ [STICKY] Índice actual inválido, corrigiendo...', { currentIndex, queueLength: queue.length });
      setCurrentIndex(Math.max(0, Math.min(currentIndex, queue.length - 1)));
      return;
    }
    
    // Calcular el siguiente índice manualmente
    let nextIndex;
    if (repeatMode === 'one') {
      // En repeat one, mantener la misma canción
      nextIndex = currentIndex;
    } else if (repeatMode === 'all' && currentIndex === queue.length - 1) {
      // En repeat all, volver al inicio
      nextIndex = 0;
    } else {
      // Índice normal siguiente
      nextIndex = currentIndex + 1;
    }
    
    // Verificar que el índice siguiente sea válido
    if (nextIndex >= queue.length && repeatMode === 'off') {
      console.log('❌ [STICKY] No hay siguiente canción disponible (sin repeat)');
      return;
    }
    
    // Obtener la canción del índice calculado
    const nextTrack = queue[nextIndex];
    console.log('🎵 [STICKY] Next track obtenido manualmente:', nextTrack, 'en índice:', nextIndex);
    
    if (nextTrack) {
      // Primero actualizar el índice en el store
      setCurrentIndex(nextIndex);
      
      // Luego reproducir usando playSong
      const songUrl = buildSongUrl(nextTrack);
      console.log('🎵 [STICKY] Reproduciendo siguiente canción:', nextTrack.title, 'índice:', nextIndex);
      
      playSong({
        id: nextTrack.id,
        title: nextTrack.title,
        artist: nextTrack.artist || 'Desconocido',
        url: songUrl,
        duration: nextTrack.duration || 0
      });
    } else {
      console.log('❌ [STICKY] No hay siguiente canción disponible');
    }
  };

  const handlePrevious = () => {
    console.log('🎵 [STICKY] Intentando canción anterior...', { 
      currentIndex, 
      queueLength: queue.length, 
      repeatMode,
      currentSong: currentSong?.title 
    });
    
    // Verificar que el índice actual sea válido
    if (currentIndex >= queue.length || currentIndex < 0) {
      console.log('⚠️ [STICKY] Índice actual inválido, corrigiendo...', { currentIndex, queueLength: queue.length });
      setCurrentIndex(Math.max(0, Math.min(currentIndex, queue.length - 1)));
      return;
    }
    
    // Calcular el índice anterior manualmente
    const prevIndex = currentIndex - 1;
    let targetIndex;
    
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        // En repeat all, ir a la última canción
        targetIndex = queue.length - 1;
      } else {
        console.log('❌ [STICKY] No hay canción anterior disponible (sin repeat)');
        return;
      }
    } else {
      targetIndex = prevIndex;
    }
    
    // Obtener la canción del índice calculado
    const prevTrack = queue[targetIndex];
    console.log('🎵 [STICKY] Previous track obtenido manualmente:', prevTrack, 'en índice:', targetIndex);
    
    if (prevTrack) {
      // Primero actualizar el índice en el store
      setCurrentIndex(targetIndex);
      
      // Luego reproducir usando playSong
      const songUrl = buildSongUrl(prevTrack);
      console.log('🎵 [STICKY] Reproduciendo canción anterior:', prevTrack.title, 'índice:', targetIndex);
      
      playSong({
        id: prevTrack.id,
        title: prevTrack.title,
        artist: prevTrack.artist || 'Desconocido',
        url: songUrl,
        duration: prevTrack.duration || 0
      });
    } else {
      console.log('❌ [STICKY] No hay canción anterior disponible');
    }
  };

  // Manejar finalización del drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      // Extract the actual ID by removing prefixes (mobile- for mobile, simple- for simple, no prefix for desktop)
      const extractID = (id: string) => {
        if (typeof id === 'string') {
          if (id.startsWith('mobile-')) {
            return id.replace('mobile-', '');
          } else if (id.startsWith('simple-')) {
            return id.replace('simple-', '');
          }
        }
        return id;
      };

      const activeId = extractID(active.id as string);
      const overId = extractID(over.id as string);

      const oldIndex = queue.findIndex((song, index) => `${song.id}-${index}` === activeId);
      const newIndex = queue.findIndex((song, index) => `${song.id}-${index}` === overId);

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
        onMouseDown={handleProgressMouseDown}
        onTouchStart={handleProgressTouchStart}
      >
        <div 
          className="progress-bar__fill"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="progress-bar__thumb" />
        </div>
      </div>

      {/* Contenido principal del reproductor */}
      <div className="player-layout">
        
        {/* Información de la canción - COLUMNA 1 */}
        <div className="song-info">
          <div 
            className="song-info__avatar song-info__avatar--clickable"
            onClick={() => setIsMinimized(true)}
            title="Haz clic para minimizar el reproductor"
          >
            <div className="song-info__avatar-circle">
              <span className="song-info__avatar-text">
                {currentSong.title.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="song-info__details">
            <div className="song-info__title-container">
              <p 
                ref={titleRef}
                className={`song-info__title song-info__title--with-tooltip ${shouldMarquee ? 'song-info__title--marquee' : ''}`}
                title={`${currentSong.title} - ${currentSong.artist || 'Artista desconocido'}`}
              >
                {shouldMarquee ? (
                  <span className="song-title-text">{currentSong.title}</span>
                ) : (
                  currentSong.title
                )}
              </p>
              
              {/* Tooltip/Globo de información */}
              <div className="song-info__tooltip">
                <div className="song-info__tooltip-content">
                  <div className="song-info__tooltip-title">{currentSong.title}</div>
                  <div className="song-info__tooltip-artist">{currentSong.artist || 'Artista desconocido'}</div>
                  {currentSong.voiceType && (
                    <div className="song-info__tooltip-voice">Voz: {currentSong.voiceType}</div>
                  )}
                  <div className="song-info__tooltip-time">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                <div className="song-info__tooltip-arrow"></div>
              </div>
            </div>
            
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
            disabled={queue.length <= 1 || (currentIndex <= 0 && repeatMode !== 'all')}
            className={`control-button ${
              queue.length <= 1 || (currentIndex <= 0 && repeatMode !== 'all') 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
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
            disabled={queue.length <= 1 || (currentIndex >= queue.length - 1 && repeatMode === 'off')}
            className={`control-button ${
              queue.length <= 1 || (currentIndex >= queue.length - 1 && repeatMode === 'off') 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
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
                {queue && queue.length > 1 && (
                  <span className="control-button__badge">{queue.length}</span>
                )}
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
                {queue && queue.length > 1 && (
                  <span className="control-button__badge">{queue.length}</span>
                )}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={queue.map((song, index) => `simple-${song.id}-${index}`)} strategy={verticalListSortingStrategy}>
                {queue.map((song, index) => (
                  <SimpleSortableQueueItem
                    key={`${song.id}-${index}`}
                    song={song}
                    index={index}
                    isCurrentSong={index === currentIndex}
                    onRemove={() => removeFromQueue(index)}
                    onPlay={(song, idx) => {
                      console.log(`🎵 [QUEUE] Playing song at index ${idx}:`, song.title);
                      setCurrentIndex(idx);
                      setCurrentSong(song, currentPlaylist || undefined, idx);
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
            <LyricsViewerInline 
              song={currentSong} 
              isDesktop={isDesktop}
              autoSyncEnabled={autoSyncEnabled}
              toggleAutoSync={toggleAutoSync}
              onSyncStatusChange={handleSyncStatusChange}
            />
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
          
          {/* Mensaje de estado si no están sincronizadas - SOLO mostrar si:
              1. Auto-sync está habilitado Y
              2. Realmente no están sincronizadas
          */}
          {(() => {
            // LOG INMEDIATO AL RENDERIZAR
            console.log('🚨 [RENDER DECISION] ===== DECISIÓN DE MOSTRAR MENSAJE =====');
            console.log('🚨 [RENDER DECISION] autoSyncEnabled:', autoSyncEnabled);
            console.log('🚨 [RENDER DECISION] hasSyncedLyrics:', hasSyncedLyrics);
            console.log('🚨 [RENDER DECISION] !hasSyncedLyrics:', !hasSyncedLyrics);
            console.log('🚨 [RENDER DECISION] Condición completa (autoSyncEnabled && !hasSyncedLyrics):', autoSyncEnabled && !hasSyncedLyrics);
            console.log('🚨 [RENDER DECISION] ¿Mostrar mensaje?:', autoSyncEnabled && !hasSyncedLyrics);
            console.log('🚨 [RENDER DECISION] ================================================');
            
            return autoSyncEnabled && !hasSyncedLyrics;
          })() && (
            <div className="mobile-fullscreen-status">
              <p>Estas letras no están sincronizadas aún.</p>
            </div>
          )}
          
          {/* Contenido de letras */}
          <div className="mobile-fullscreen-lyrics">
            <LyricsViewerInline 
              song={currentSong} 
              isDesktop={false}
              autoSyncEnabled={autoSyncEnabled}
              toggleAutoSync={toggleAutoSync}
              onSyncStatusChange={handleSyncStatusChange}
            />
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
              onMouseDown={handleProgressMouseDown}
              onTouchStart={handleProgressTouchStart}
            >
              <div 
                className="mobile-fullscreen-progress__fill"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="mobile-fullscreen-progress__thumb" />
              </div>
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
                disabled={queue.length <= 1 || (currentIndex <= 0 && repeatMode !== 'all')}
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
                disabled={queue.length <= 1 || (currentIndex >= queue.length - 1 && repeatMode === 'off')}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={queue.map((song, index) => `mobile-${song.id}-${index}`)} strategy={verticalListSortingStrategy}>
                {queue.map((song, index) => (
                  <MobileSortableQueueItem
                    key={`${song.id}-${index}`}
                    song={song}
                    index={index}
                    isCurrentSong={index === currentIndex}
                    onRemove={() => removeFromQueue(index)}
                    onPlay={(song, idx) => {
                      console.log(`🎵 [QUEUE] Playing song at index ${idx}:`, song.title);
                      setCurrentIndex(idx);
                      setCurrentSong(song, currentPlaylist || undefined, idx);
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickyPlayer;
