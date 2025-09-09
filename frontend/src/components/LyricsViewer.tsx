import React, { useState, useEffect, useRef } from 'react';
import { 
  DocumentTextIcon, 
  DocumentIcon, 
  PhotoIcon,
  ChevronUpIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import { useLyrics } from '../hooks/useLyrics';
import { usePlayerStore } from '../store/playerStore';
import configService from '../services/configService';
import type { Song, VoiceType } from '../types';
import type { Lyric } from '../types/lyrics';

interface LyricsViewerProps {
  song: Song;
  voiceType?: VoiceType | null;
  className?: string;
}

const VoiceTypeColors = {
  SOPRANO: 'text-pink-600 bg-pink-50',
  CONTRALTO: 'text-purple-600 bg-purple-50', 
  TENOR: 'text-blue-600 bg-blue-50',
  BAJO: 'text-green-600 bg-green-50',
  BARITONO: 'text-yellow-600 bg-yellow-50',
  MESOSOPRANO: 'text-rose-600 bg-rose-50',
  CORO: 'text-indigo-600 bg-indigo-50',
  ORIGINAL: 'text-gray-600 bg-gray-50',
  INSTRUMENTAL: 'text-red-600 bg-red-50'
};

const LyricsViewer: React.FC<LyricsViewerProps> = ({ 
  song, 
  voiceType = null, 
  className = '' 
}) => {
  console.log('🎵 [LYRICS VIEWER] Component rendered with:', {
    songId: song?.id,
    songTitle: song?.title,
    songVoiceType: song?.voiceType,
    propVoiceType: voiceType,
    className
  });

  const [isExpanded, setIsExpanded] = useState(true); // Empezar expandido cuando se integra en el reproductor
  const [displayMode, setDisplayMode] = useState<'sync' | 'files'>('sync');
  // Usar el voiceType de la canción (variación actual) o el prop como fallback
  const [selectedVoiceType, setSelectedVoiceType] = useState<VoiceType | null>(song?.voiceType || voiceType);

  // Actualizar selectedVoiceType cuando cambie la canción
  useEffect(() => {
    if (song?.voiceType) {
      console.log('🎵 [LYRICS VIEWER] Updating selectedVoiceType from', selectedVoiceType, 'to', song.voiceType);
      setSelectedVoiceType(song.voiceType);
    }
  }, [song?.voiceType]);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    const saved = localStorage.getItem('lyrics-auto-sync');
    return saved ? JSON.parse(saved) : true;
  });
  
  const { 
    lyrics, 
    syncedLyrics, 
    isLoading, 
    loadLyrics, 
    loadSyncedLyrics
  } = useLyrics();
  
  const { currentTime, seekTo, isPlaying } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Cargar letras cuando cambie la canción
  useEffect(() => {
    if (song?.id) {
      console.log('🔄 [LYRICS VIEWER] Loading lyrics for song:', {
        songId: song.id,
        songTitle: song.title,
        songVoiceType: song.voiceType
      });
      loadLyrics(song.id);
      loadSyncedLyrics(song.id);
    } else {
      console.log('🔄 [LYRICS VIEWER] No song provided');
    }
  }, [song?.id, loadLyrics, loadSyncedLyrics]);

  // Obtener letras filtradas por voiceType - TODAS las líneas
  const filteredLyrics = syncedLyrics.filter(lyric => {
    // Usar el voiceType seleccionado o el de la canción
    const targetVoiceType = selectedVoiceType || song?.voiceType;
    
    const passes = lyric.voiceType === targetVoiceType && lyric.lineNumber > 0;
    
    if (!passes && lyric.voiceType === targetVoiceType) {
      console.log('🔍 Filtering OUT lyric (lineNumber <= 0):', {
        lyricId: lyric.id,
        lineNumber: lyric.lineNumber,
        content: lyric.content?.substring(0, 30) + '...'
      });
    }
    
    return passes;
  }).sort((a, b) => a.lineNumber - b.lineNumber);

  console.log('🎵 [FILTER RESULT]', {
    targetVoiceType: selectedVoiceType || song?.voiceType,
    totalSynced: syncedLyrics.length,
    filtered: filteredLyrics.length,
    firstFewFiltered: filteredLyrics.slice(0, 3).map(l => ({ line: l.lineNumber, time: l.startTime, content: l.content?.substring(0, 20) }))
  });

  // Debug para ver qué datos tenemos
  useEffect(() => {
    console.log('🎵 LyricsViewer Debug:', {
      songId: song?.id,
      songVoiceType: song?.voiceType,
      selectedVoiceType,
      syncedLyricsCount: syncedLyrics.length,
      filteredLyricsCount: filteredLyrics.length,
      syncedLyrics: syncedLyrics.slice(0, 5), // Primeros 5 para debug
      filteredLyrics: filteredLyrics.slice(0, 5),
      isLoading,
      availableVoiceTypes
    });
    
    // Log extra para debug
    if (syncedLyrics.length > 0) {
      console.log('📝 First synced lyric sample:', syncedLyrics[0]);
    }
  }, [song?.id, selectedVoiceType, syncedLyrics.length, filteredLyrics.length, isLoading]);

  // Verificar si hay sincronización en cualquier línea
  const hasSyncData = filteredLyrics.some(lyric => 
    lyric.startTime !== undefined && 
    lyric.startTime !== null && 
    lyric.startTime > 0 &&
    lyric.lineNumber > 0 // Asegurar que no sea línea 0
  );

  console.log('🔍 [SYNC DATA CHECK]', {
    filteredCount: filteredLyrics.length,
    hasSyncData,
    syncedLines: filteredLyrics.filter(l => l.startTime && l.startTime > 0 && l.lineNumber > 0).length,
    sampleTimes: filteredLyrics.slice(1, 4).map(l => ({ line: l.lineNumber, time: l.startTime, content: l.content?.substring(0, 20) + '...' }))
  });

  // Siempre usar todas las líneas filtradas
  const displayLyrics = filteredLyrics;

  // Obtener archivos de letras de la canción principal
  const lyricsFiles = lyrics?.lyricsFiles || [];

  // Encontrar línea activa basada en tiempo actual
  useEffect(() => {
    if (!autoSync || !hasSyncData) {
      setActiveLineIndex(-1);
      return;
    }

    // Buscar la línea activa (desde startTime hasta startTime del siguiente)
    let newActiveIndex = -1;
    
    for (let i = 0; i < displayLyrics.length; i++) {
      const currentLyric = displayLyrics[i];
      
      const currentStart = currentLyric.startTime || 0;
      
      // Buscar el siguiente lyric con tiempo válido para determinar cuando termina este
      let nextStart = Infinity;
      for (let j = i + 1; j < displayLyrics.length; j++) {
        const futurelyric = displayLyrics[j];
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
      
      // Debug más específico
      if (currentStart > 0 && Math.abs(currentTime - currentStart) < 10) {
        const duration = nextStart === Infinity ? 'infinity' : (nextStart - currentStart).toFixed(1);
        console.log(`🎵 [SYNC] Line ${i}: "${currentLyric.content?.substring(0, 30)}" | Current: ${currentTime.toFixed(2)}s | Start: ${currentStart}s | End: ${nextStart === Infinity ? 'end' : nextStart.toFixed(1) + 's'} | Duration: ${duration}s | Active: ${currentTime >= currentStart && currentTime < nextStart}`);
      }
      
      // La línea está activa desde su startTime hasta el startTime de la siguiente línea
      if (currentTime >= currentStart && currentTime < nextStart && currentStart > 0) {
        newActiveIndex = i;
        break; // Tomar la primera línea que coincida
      }
    }

    // Actualizar solo si cambió y ha pasado suficiente tiempo
    if (newActiveIndex !== activeLineIndex) {
      console.log(`🔄 [ACTIVE LINE] Changing from ${activeLineIndex} to ${newActiveIndex} at time ${currentTime.toFixed(2)}s`);
      setActiveLineIndex(newActiveIndex);
    }
  }, [currentTime, displayLyrics, hasSyncData, autoSync]);

  // Auto-scroll a línea activa
  useEffect(() => {
    if (activeLineRef.current && isExpanded && autoScroll && activeLineIndex !== -1 && autoSync) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeLineIndex, isExpanded, autoScroll, autoSync]);

  // Manejar click en línea sincronizada
  const handleLineClick = (lyric: Lyric) => {
    if (autoSync && lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0) {
      seekTo(lyric.startTime);
    }
  };

  // Obtener voiceTypes disponibles
  const availableVoiceTypes = [...new Set(
    syncedLyrics
      .filter(l => l.voiceType !== null && l.lineNumber > 0) // Filtrar línea 0 de respaldo
      .map(l => l.voiceType)
  )] as VoiceType[];

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVoiceTypeColor = (vType: VoiceType | null) => {
    if (!vType) return 'text-gray-600 bg-gray-50';
    return VoiceTypeColors[vType] || 'text-gray-600 bg-gray-50';
  };

  const renderFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <DocumentIcon className="h-4 w-4" />;
      case 'txt':
      case 'doc':
      case 'docx':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <PhotoIcon className="h-4 w-4" />;
      default:
        return <DocumentIcon className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white border rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">Letras</h3>
            {hasSyncData && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Sincronizado</span>
              </span>
            )}
            {lyricsFiles.length > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                {lyricsFiles.length} archivo{lyricsFiles.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Controls when expanded */}
        {isExpanded && (
          <div className="mt-3 space-y-3">
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

            {/* Controles adicionales para modo sincronizado */}
            {displayMode === 'sync' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const newValue = !autoSync;
                    setAutoSync(newValue);
                    localStorage.setItem('lyrics-auto-sync', JSON.stringify(newValue));
                  }}
                  className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                    autoSync
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{autoSync ? '🎵' : '📄'}</span>
                  <span>{autoSync ? 'Auto-sync' : 'Estático'}</span>
                </button>
                {autoSync && hasSyncData && (
                  <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                      autoScroll
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{autoScroll ? '🎯' : '⏸️'}</span>
                    <span>Auto-seguimiento</span>
                  </button>
                )}
                <div className="text-xs text-gray-500">
                  {autoSync ? (isPlaying ? '▶️ Reproduciendo' : '⏸️ Pausado') : '📖 Modo lectura'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div 
          className="p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
          style={{ 
            maxHeight: 'min(400px, 50vh)',
            WebkitOverflowScrolling: 'touch' // Mejorar scroll en iOS
          }} 
          ref={containerRef}
        >
          {displayMode === 'sync' ? (
            // Synchronized lyrics
            <div className="space-y-3">
              {displayLyrics.length > 0 ? (
                displayLyrics.map((lyric, index) => {
                  // Determinar si es línea activa (resaltado temporal por tiempo)
                  const isActiveNow = autoSync && index === activeLineIndex && hasSyncData;
                  
                  // Debug para verificar isHighlighted
                  console.log(`🎵 Lyric ${index}: "${lyric.content?.substring(0, 30)}" - isHighlighted: ${lyric.isHighlighted} - isActive: ${isActiveNow}`);
                  
                  // COLORES BASE FIJOS - NUNCA CAMBIAN POR NADA
                  const isHighlighted = lyric.isHighlighted;
                  const baseBackgroundColor = isHighlighted 
                    ? 'bg-gradient-to-r from-purple-100 to-purple-200' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 opacity-70';
                  const baseBorderColor = isHighlighted ? 'border-purple-300' : 'border-gray-300';
                  const baseTextColor = isHighlighted ? 'text-purple-900' : 'text-gray-600';
                  
                  // EFECTOS DE RESALTADO TEMPORAL - ZOOM Y SOMBRA PARA LÍNEA ACTIVA
                  // El zoom se aplica SIEMPRE que sea la línea activa, independiente de highlighted
                  const activeEffects = isActiveNow 
                    ? 'shadow-xl transform scale-110 border-yellow-400 bg-gradient-to-r from-yellow-100 to-yellow-200' 
                    : '';
                  
                  // Agregar interactividad si tiene sync
                  const hasSync = autoSync && hasSyncData && lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0;
                  const hoverEffects = hasSync && !isActiveNow ? 'cursor-pointer hover:shadow-md hover:scale-102 transition-transform' : '';

                  return (
                  <div
                    key={lyric.id}
                    ref={index === activeLineIndex ? activeLineRef : null}
                    onClick={() => handleLineClick(lyric)}
                    className={`p-6 mx-2 rounded-xl transition-all duration-300 border-2 ${
                      isActiveNow ? activeEffects : `${baseBackgroundColor} ${baseBorderColor}`
                    } ${hoverEffects} ${
                      selectedVoiceType && lyric.voiceType === selectedVoiceType
                        ? `border-l-8 ${getVoiceTypeColor(lyric.voiceType).replace('bg-', 'border-').replace('-50', '-400')}`
                        : ''
                    }`}
                  >
                    {/* Contenido principal de la letra - CENTRADO */}
                    <div className="flex justify-center items-center w-full">
                      <p className={`text-center font-bold leading-relaxed mx-auto ${
                        // Color dinámico: activo = negro destacado, normal = según highlighted
                        isActiveNow 
                          ? 'text-gray-900' 
                          : baseTextColor
                      } ${
                        // Tamaño dinámico: activo = más grande, normal = responsivo
                        isActiveNow 
                          ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl' 
                          : 'text-lg sm:text-base md:text-lg lg:text-xl'
                      }`}>
                        {lyric.content}
                      </p>
                    </div>
                    
                    {/* Metadata y controles - CENTRADO */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full">
                        {/* Voice type badge */}
                        {lyric.voiceType && (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${getVoiceTypeColor(lyric.voiceType)}`}>
                            {lyric.voiceType.replace('_', ' ')}
                          </span>
                        )}
                        
                        {/* Highlighted badge */}
                        {lyric.isHighlighted && (
                          <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                            Participa
                          </span>
                        )}
                        
                        {/* Time and active indicator */}
                        {autoSync && hasSyncData && lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-mono">
                              {formatTime(lyric.startTime)}
                            </span>
                            {index === activeLineIndex && (
                              <div className={`w-3 h-3 rounded-full animate-pulse shadow-md ${
                                lyric.isHighlighted ? 'bg-purple-500' : 'bg-blue-500'
                              }`}></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-6xl mb-2">🎵</div>
                  {availableVoiceTypes.length > 0 ? (
                    <div>
                      <p>Letras disponibles para {selectedVoiceType || 'esta variante'}</p>
                      <p className="text-sm mt-1">
                        {autoSync ? (
                          hasSyncData ? 
                            'Reproduce la canción para ver la sincronización en tiempo real' :
                            'Las letras están disponibles pero no sincronizadas. Las líneas se muestran como texto estático.'
                        ) : (
                          'Modo de lectura estático - Las letras se muestran como texto normal'
                        )}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>No hay letras sincronizadas disponibles</p>
                      <p className="text-sm mt-1">Usa el sincronizador para agregar letras</p>
                    </div>
                  )}
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
                    onClick={() => {
                      const fileUrl = configService.buildFileUrl(`/lyrics/files/${file.id}`, true);
                      console.log('🔗 [LYRICS VIEWER] Opening file:', { fileName: file.fileName, fileUrl });
                      window.open(fileUrl, '_blank');
                    }}
                  >
                    {renderFileIcon(file.fileName)}
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
                <div className="text-center py-8">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                    <div className="flex items-center">
                      <DocumentIcon className="h-8 w-8 text-blue-400 mr-3" />
                      <div className="text-left">
                        <p className="text-blue-700 font-medium">
                          📄 No hay archivos de letras para esta canción
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          Puedes subir archivos de letras usando el botón "Subir Archivo" de arriba
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LyricsViewer;
