import React, { useState, useEffect, useRef } from 'react';
import { 
  DocumentTextIcon, 
  DocumentIcon, 
  PhotoIcon,
  MusicalNoteIcon,
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
  ORIGINAL: 'text-gray-600 bg-gray-50'
};

const LyricsViewer: React.FC<LyricsViewerProps> = ({ 
  song, 
  voiceType = null, 
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Empezar expandido cuando se integra en el reproductor
  const [displayMode, setDisplayMode] = useState<'sync' | 'files'>('sync');
  // Usar el voiceType de la canción (variación actual) o el prop como fallback
  const [selectedVoiceType, setSelectedVoiceType] = useState<VoiceType | null>(song?.voiceType || voiceType);

  // Actualizar selectedVoiceType cuando cambie la canción
  useEffect(() => {
    if (song?.voiceType) {
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
      loadLyrics(song.id);
      loadSyncedLyrics(song.id);
    }
  }, [song?.id, loadLyrics, loadSyncedLyrics]);

  // Obtener letras filtradas por voiceType - TODAS las líneas
  const filteredLyrics = syncedLyrics.filter(lyric => {
    // Si no hay voiceType seleccionado, mostrar la primera variación disponible
    const targetVoiceType = selectedVoiceType || syncedLyrics.find(l => l.voiceType && l.lineNumber > 0)?.voiceType;
    
    return lyric.voiceType === targetVoiceType && 
           lyric.lineNumber > 0; // Filtrar línea 0 de respaldo
  }).sort((a, b) => a.lineNumber - b.lineNumber);

  // Debug para ver qué datos tenemos
  useEffect(() => {
    console.log('🎵 LyricsViewer Debug:', {
      songId: song?.id,
      selectedVoiceType,
      syncedLyricsCount: syncedLyrics.length,
      filteredLyricsCount: filteredLyrics.length,
      syncedLyrics: syncedLyrics.slice(0, 3), // Primeros 3 para debug
      filteredLyrics: filteredLyrics.slice(0, 3)
    });
  }, [song?.id, selectedVoiceType, syncedLyrics.length, filteredLyrics.length]);

  // Verificar si hay sincronización en cualquier línea
  const hasSyncData = filteredLyrics.some(lyric => 
    lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0
  );

  // Siempre usar todas las líneas filtradas
  const displayLyrics = filteredLyrics;

  // Obtener archivos de letras de la canción principal
  const lyricsFiles = lyrics?.lyricsFiles || [];

  // Encontrar línea activa basada en tiempo actual
  useEffect(() => {
    if (!autoSync) {
      // En modo estático, no resaltar ninguna línea
      setActiveLineIndex(-1);
      return;
    }

    if (!hasSyncData || !isPlaying) {
      // Si no hay sincronización o no está reproduciendo, quitar resaltado
      setActiveLineIndex(-1);
      return;
    }

    const activeIndex = displayLyrics.findIndex((lyric, index) => {
      const nextLyric = displayLyrics[index + 1];
      const currentStart = lyric.startTime || 0;
      const currentEnd = lyric.endTime || 0;
      const nextStart = nextLyric?.startTime || Infinity;
      
      // Verificar si estamos dentro del rango de la línea actual
      if (currentEnd > 0) {
        // Si tiene tiempo de fin, usar rango exacto
        return currentTime >= currentStart && currentTime <= currentEnd;
      } else {
        // Si no tiene tiempo de fin, usar hasta el inicio de la siguiente
        return currentTime >= currentStart && currentTime < nextStart;
      }
    });

    if (activeIndex !== activeLineIndex) {
      setActiveLineIndex(activeIndex);
    }
  }, [currentTime, displayLyrics, hasSyncData, isPlaying, activeLineIndex, autoSync]);

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
            <MusicalNoteIcon className="h-5 w-5 text-gray-500" />
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
        <div className="p-4" style={{ maxHeight: '400px', overflowY: 'auto' }} ref={containerRef}>
          {displayMode === 'sync' ? (
            // Synchronized lyrics
            <div className="space-y-2">
              {displayLyrics.length > 0 ? (
                displayLyrics.map((lyric, index) => (
                  <div
                    key={lyric.id}
                    ref={index === activeLineIndex ? activeLineRef : null}
                    onClick={() => handleLineClick(lyric)}
                    className={`p-3 rounded-lg transition-all border ${
                      // Línea activa en auto-sync con tiempo actual
                      autoSync && index === activeLineIndex && hasSyncData
                        ? lyric.isHighlighted 
                          ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-md' // Morado elegante para highlighted activa
                          : 'bg-blue-100 border-blue-300 text-blue-900 shadow-md'     // Azul para no-highlighted activa
                        // Líneas con sincronización disponibles
                        : autoSync && hasSyncData && lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0
                          ? lyric.isHighlighted
                            ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 cursor-pointer hover:shadow-sm text-purple-800' // Morado elegante para highlighted
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer hover:shadow-sm text-gray-700'        // Opaco para no-highlighted
                        // Modo estático o sin sincronización
                        : lyric.isHighlighted
                          ? 'bg-purple-50 border-purple-200 text-purple-800' // Morado elegante para highlighted estático
                          : 'bg-white border-gray-200 text-gray-600'         // Opaco para no-highlighted estático
                    } ${
                      selectedVoiceType && lyric.voiceType === selectedVoiceType
                        ? `border-l-4 ${getVoiceTypeColor(lyric.voiceType).replace('bg-', 'border-').replace('-50', '-300')}`
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`font-medium ${
                          // Texto activo en auto-sync
                          autoSync && index === activeLineIndex && hasSyncData 
                            ? lyric.isHighlighted 
                              ? 'text-purple-900' 
                              : 'text-blue-900'
                            // Texto normal según estado
                            : lyric.isHighlighted
                              ? 'text-purple-800' // Morado elegante para highlighted
                              : 'text-gray-600'   // Opaco para no-highlighted
                        }`}>
                          {lyric.content}
                        </p>
                        <div className="mt-1 flex items-center space-x-2">
                          {lyric.voiceType && (
                            <span className={`text-xs px-2 py-1 rounded ${getVoiceTypeColor(lyric.voiceType)}`}>
                              {lyric.voiceType.replace('_', ' ')}
                            </span>
                          )}
                          {lyric.isHighlighted && (
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                              ♪ Participa
                            </span>
                          )}
                        </div>
                      </div>
                      {autoSync && hasSyncData && lyric.startTime !== undefined && lyric.startTime !== null && lyric.startTime > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {formatTime(lyric.startTime)}
                          </span>
                          {index === activeLineIndex && (
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              lyric.isHighlighted ? 'bg-purple-500' : 'bg-blue-500'
                            }`}></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MusicalNoteIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
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
                <div className="text-center text-gray-500 py-8">
                  <DocumentIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay archivos de letras disponibles</p>
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
