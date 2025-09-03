import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLyrics } from '../hooks/useLyrics';
import type { Song } from '../types';
import { getSongFileUrl } from '../config/api';
import { useServerInfo } from '../hooks/useServerInfo';

interface LyricsSynchronizerProps {
  song: Song;
  onClose: () => void;
  onSave: () => void;
}

interface LyricLine {
  id?: string;
  content: string;
  startTime: number | null;
  endTime: number | null;
  lineNumber: number;
  isSelected: boolean;
  isHighlighted: boolean; // Nueva propiedad para indicar si esta voz canta en esta línea
  isCurrent: boolean; // Nueva propiedad para la línea actualmente seleccionada
}

const LyricsSynchronizer: React.FC<LyricsSynchronizerProps> = ({ song, onClose, onSave }) => {
  const { lyrics, loadLyrics, updateSyncWithVariants } = useLyrics();
  const { serverInfo } = useServerInfo();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyricsLines, setLyricsLines] = useState<LyricLine[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressTarget, setLongPressTarget] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);

  useEffect(() => {
    if (song.id) {
      loadLyrics(song.id);
    }
  }, [song.id, loadLyrics]);

  useEffect(() => {
    if (lyrics?.lyrics) {
      const lines = lyrics.lyrics
        .filter(lyric => lyric.voiceType === song.voiceType && lyric.lineNumber > 0) // Omitir línea 0
        .sort((a, b) => a.lineNumber - b.lineNumber)
        .map((lyric, index) => ({
          id: lyric.id,
          content: lyric.content,
          startTime: lyric.startTime || null,
          endTime: lyric.endTime || null,
          lineNumber: lyric.lineNumber,
          isSelected: false,
          isHighlighted: lyric.isHighlighted !== false, // Por defecto todas las líneas están destacadas
          isCurrent: index === 0 // La primera línea (línea 1) es la actual por defecto
        }));
      
      setLyricsLines(lines);
    }
  }, [lyrics, song.voiceType]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    // Actualización más frecuente del tiempo con requestAnimationFrame
    let animationId: number;
    const updateTimeFrequently = () => {
      if (audio && !audio.paused && !audio.ended) {
        setCurrentTime(audio.currentTime);
      }
      animationId = requestAnimationFrame(updateTimeFrequently);
    };

    audio.addEventListener('play', () => {
      updateTimeFrequently(); // Iniciar actualización frecuente al reproducir
    });
    
    audio.addEventListener('pause', () => {
      if (animationId) {
        cancelAnimationFrame(animationId); // Detener actualización al pausar
      }
    });

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    });

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  // Manejo de teclas para navegación y marcado
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        markCurrentLineAndAdvance();
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        goToPreviousLine();
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        goToNextLine();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentLineIndex, lyricsLines]);

  // Función para iniciar countdown antes del play
  const startCountdownAndPlay = (audioAction: () => void) => {
    if (isCountingDown) return; // Evitar múltiples countdowns
    
    setIsCountingDown(true);
    setCountdown(3);
    
    // Countdown 3-2-1 súper rápido (250ms)
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          setIsCountingDown(false);
          setCountdown(null);
          // Ejecutar acción de audio después del countdown
          audioAction();
          return null;
        }
        return prev - 1;
      });
    }, 500); // Súper rápido: 0.25 segundos
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // Si está reproduciendo, pausar inmediatamente sin countdown
      audio.pause();
      setIsPlaying(false);
    } else {
      // Si no está reproduciendo, iniciar countdown antes de play
      startCountdownAndPlay(() => {
        audio.play();
        setIsPlaying(true);
      });
    }
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Nueva función para marcado dinámico con spacebar (sin countdown)
  const markCurrentLineAndAdvance = () => {
    if (isCountingDown) return; // No marcar durante countdown
    
    // Obtener tiempo exacto directamente del audio element (más preciso)
    const audio = audioRef.current;
    if (!audio) return;
    
    const exactTime = audio.currentTime; // Tiempo exacto del reproductor
    
    // Actualizar también el estado para que se vea en tiempo real
    setCurrentTime(exactTime);
    
    console.log('Tiempo capturado:', exactTime.toFixed(3), 'segundos'); // Para debug con más precisión
    
    setLyricsLines(prevLines => prevLines.map((line, index) => {
      if (index === currentLineIndex && line.isHighlighted) {
        return { 
          ...line, 
          startTime: exactTime, // Tiempo exacto sin corrección
          isSelected: true,
          isCurrent: false
        };
      }
      if (index === currentLineIndex + 1) {
        return { ...line, isCurrent: true };
      }
      return { ...line, isSelected: false, isCurrent: false };
    }));
    
    if (currentLineIndex < lyricsLines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
    }
  };

  // Función para navegar a línea anterior
  const goToPreviousLine = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(prev => prev - 1);
      setLyricsLines(prev => prev.map((line, index) => ({
        ...line,
        isCurrent: index === currentLineIndex - 1
      })));
    }
  };

  // Función para navegar a línea siguiente
  const goToNextLine = () => {
    if (currentLineIndex < lyricsLines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
      setLyricsLines(prev => prev.map((line, index) => ({
        ...line,
        isCurrent: index === currentLineIndex + 1
      })));
    }
  };

  // Funciones para manejo de long press
  const handleMouseDown = (lineIndex: number) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    const timer = setTimeout(() => {
      // Long press detected - restart from this line
      restartFromLine(lineIndex);
      setLongPressTarget(null);
    }, 1000); // 1 segundo
    
    setLongPressTimer(timer);
    setLongPressTarget(lineIndex);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    if (longPressTarget !== null) {
      // Click normal - solo cambiar a edición (comportamiento existente)
      setLongPressTarget(null);
    }
  };

  const restartFromLine = (lineIndex: number) => {
    // Limpiar marcas de tiempo de esta línea en adelante
    setLyricsLines(prev => prev.map((line, index) => {
      if (index >= lineIndex) {
        return {
          ...line,
          startTime: null,
          endTime: null,
          isSelected: false,
          isCurrent: index === lineIndex
        };
      }
      return { ...line, isCurrent: false };
    }));
    
    // Establecer como línea actual
    setCurrentLineIndex(lineIndex);
  };

  // Función para reproducir desde una línea específica
  const playFromLine = (lineIndex: number) => {
    const line = lyricsLines[lineIndex];
    const audio = audioRef.current;
    
    if (!audio) return;
    
    // Preparar la configuración pero ejecutar después del countdown
    const setupAndPlay = () => {
      if (line.startTime !== null) {
        // Si la línea tiene tiempo, ir a ese tiempo
        audio.currentTime = line.startTime;
        setCurrentTime(line.startTime);
      } else {
        // Si no tiene tiempo, calcular estimado basado en líneas anteriores
        const previousSyncedLine = lyricsLines
          .slice(0, lineIndex)
          .reverse()
          .find(l => l.startTime !== null);
        
        if (previousSyncedLine && previousSyncedLine.startTime !== null) {
          audio.currentTime = previousSyncedLine.startTime;
          setCurrentTime(previousSyncedLine.startTime);
        }
      }
      
      // Establecer como línea actual y preparar para continuar sincronización
      setCurrentLineIndex(lineIndex);
      setLyricsLines(prev => prev.map((line, index) => ({
        ...line,
        isCurrent: index === lineIndex
      })));
      
      // Reproducir
      audio.play();
      setIsPlaying(true);
    };

    // Si ya está reproduciendo, pausar y luego usar countdown
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    }
    
    // Iniciar countdown antes de reproducir
    startCountdownAndPlay(setupAndPlay);
  };

  // Función para insertar nueva línea
  const insertNewLine = (afterIndex: number) => {
    const newLineNumber = lyricsLines[afterIndex].lineNumber + 0.5; // Número intermedio
    const newLine: LyricLine = {
      id: `temp-${Date.now()}`, // ID temporal
      content: '',
      startTime: null,
      endTime: null,
      lineNumber: newLineNumber,
      isSelected: false,
      isHighlighted: true,
      isCurrent: false
    };

    setLyricsLines(prev => {
      const newLines = [...prev];
      newLines.splice(afterIndex + 1, 0, newLine);
      // Actualizar línea actual si es necesario
      return newLines.map((line, index) => ({
        ...line,
        isCurrent: index === afterIndex + 1 // La nueva línea se convierte en actual
      }));
    });
    
    // Mover el cursor a la nueva línea
    setCurrentLineIndex(afterIndex + 1);
  };

  // Función para eliminar línea
  const deleteLine = (index: number) => {
    setLyricsLines(prev => prev.filter((_, i) => i !== index));
    if (currentLineIndex >= index && currentLineIndex > 0) {
      setCurrentLineIndex(prev => prev - 1);
    }
  };

  // Función para actualizar contenido de línea
  const updateLineContent = (index: number, newContent: string) => {
    setLyricsLines(prev => prev.map((line, i) => 
      i === index ? { ...line, content: newContent } : line
    ));
  };

  const toggleLineHighlighted = (lineIndex: number) => {
    setLyricsLines(prev => prev.map((line, index) => {
      if (index === lineIndex) {
        return { 
          ...line, 
          isHighlighted: !line.isHighlighted,
          // Si se desactiva, limpiar los tiempos
          startTime: !line.isHighlighted ? line.startTime : null,
          endTime: !line.isHighlighted ? line.endTime : null
        };
      }
      return line;
    }));
  };

  const clearAllTimes = () => {
    setLyricsLines(prev => prev.map(line => ({
      ...line,
      startTime: null,
      endTime: null,
      isSelected: false
    })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Preparar datos de sincronización con numeración correcta
      const highlightedLines = lyricsLines.filter(line => line.isHighlighted);
      
      if (highlightedLines.length === 0) {
        alert('Debes marcar al menos una línea como destacada antes de guardar.');
        setIsSaving(false);
        return;
      }
      
      // Crear línea 0 con toda la letra como respaldo
      const fullLyrics = highlightedLines.map(line => line.content).join(' ');
      
      const syncData = [
        // Línea 0: Letra completa como respaldo
        {
          content: fullLyrics,
          startTime: undefined,
          endTime: undefined,
          lineNumber: 0,
          voiceType: song.voiceType || undefined,
          isHighlighted: false // Línea 0 nunca es highlighted
        },
        // Líneas 1 en adelante: TODAS las líneas (highlighted y no highlighted)
        ...lyricsLines
          .filter(line => line.lineNumber > 0) // Omitir línea 0 si existe
          .map((line, index) => ({
            content: line.content,
            startTime: line.startTime || undefined,
            endTime: line.endTime || undefined,
            lineNumber: index + 1, // Renumerar desde 1
            voiceType: song.voiceType || undefined,
            // isHighlighted solo TRUE para la variación actual
            isHighlighted: line.isHighlighted,
            // Información para el backend sobre la variación actual
            currentVoiceType: song.voiceType || undefined
          }))
      ];

      console.log('🎵 Guardando sincronización:', {
        songId: song.id,
        currentVoiceType: song.voiceType,
        totalLines: syncData.length - 1, // -1 por línea 0
        highlightedCount: syncData.filter(d => d.isHighlighted).length
      });

      const result = await updateSyncWithVariants(syncData, song.id);
      
      // Mostrar mensaje de auto-sincronización si aplicó
      if (result && (result as any).variantsUpdated > 0) {
        alert(`Sincronización guardada exitosamente!\n\n${(result as any).autoSyncMessage}`);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving sync data:', error);
      alert('Error al guardar la sincronización. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const songUrl = song.folderName 
    ? getSongFileUrl(song.folderName, song.fileName)
    : `${serverInfo.audioBaseUrl}-root/${song.fileName}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sincronizador de Letras
            </h2>
            <p className="text-sm text-gray-600">
              {song.title} - {song.voiceType || 'General'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Audio Player */}
        <div className="p-6 border-b border-gray-200">
          <audio ref={audioRef} src={songUrl} preload="metadata" />
          
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700"
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6 ml-1" />
              )}
            </button>
            
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <div 
                className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percentage = (e.clientX - rect.left) / rect.width;
                  handleSeek(percentage * duration);
                }}
              >
                <div 
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">ESPACIO</kbd>
                <span>Marcar línea actual</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">↑/↓</kbd>
                <span>Navegar líneas</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">CLICK LARGO</kbd>
                <span>Reiniciar desde línea</span>
              </div>
            </div>
            <div className="text-purple-600 font-medium">
              Línea {currentLineIndex + 1} de {lyricsLines.length}
            </div>
          </div>

          {/* Countdown Visual */}
          {isCountingDown && countdown !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 pointer-events-none">
              <div className="text-center">
                <div className="text-8xl font-bold text-white mb-4 animate-bounce">
                  {countdown}
                </div>
                <div className="text-2xl text-white">
                  ¡Prepárate para sincronizar!
                </div>
                <div className="text-lg text-gray-300 mt-2">
                  Presiona ESPACIO para marcar cada línea
                </div>
                <div className="text-md text-gray-400 mt-1">
                  Línea actual: "{lyricsLines[currentLineIndex]?.content || ''}"
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-2 mt-3">
            <button
              onClick={clearAllTimes}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Limpiar Tiempos
            </button>
          </div>
        </div>

        {/* Lyrics Lines */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: '400px' }}>
          <div className="space-y-2">
            {lyricsLines.map((line, index) => (
              <div key={index}>
                {/* Línea principal */}
                <div 
                  className={`p-4 border rounded-lg transition-all duration-300 cursor-pointer ${
                    line.isCurrent
                      ? 'border-purple-500 bg-purple-100 shadow-lg transform scale-105'
                      : !line.isHighlighted 
                        ? 'border-gray-300 bg-gray-100 opacity-60'
                        : line.startTime !== null 
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white hover:bg-purple-50'
                  }`}
                  onMouseDown={() => handleMouseDown(index)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="flex items-center justify-between">
                    {/* Letra a la izquierda */}
                    <div className="flex-1 min-w-0 pr-4">
                      <textarea
                        value={line.content}
                        onChange={(e) => updateLineContent(index, e.target.value)}
                        className={`w-full resize-none bg-transparent border-none focus:outline-none font-medium text-lg leading-relaxed ${
                          line.isCurrent 
                            ? 'text-purple-900 font-bold' 
                            : !line.isHighlighted 
                              ? 'text-gray-400' 
                              : 'text-gray-900'
                        }`}
                        rows={2}
                        placeholder="Escribe el texto de la línea..."
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          {line.startTime !== null && (
                            <div className="text-sm text-gray-500">
                              ⏱️ {formatTime(line.startTime)}
                              {line.endTime !== null && ` - ${formatTime(line.endTime)}`}
                            </div>
                          )}
                          {(line.startTime !== null || index > 0) && (
                            <button
                              onClick={() => playFromLine(index)}
                              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors text-xs"
                              title="Reproducir desde aquí"
                            >
                              ▶
                            </button>
                          )}
                        </div>
                        {lyricsLines.length > 1 && (
                          <button
                            onClick={() => deleteLine(index)}
                            className="text-xs text-red-500 hover:text-red-700 ml-2"
                            title="Eliminar línea"
                          >
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Botón indicador a la derecha */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => toggleLineHighlighted(index)}
                        className={`w-16 h-16 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                          line.isHighlighted
                            ? 'bg-purple-500 border-purple-600 text-white shadow-lg hover:bg-purple-600'
                            : 'bg-gray-200 border-gray-300 text-gray-500 hover:bg-gray-300'
                        }`}
                        title={line.isHighlighted ? 'Esta voz canta aquí' : 'Esta voz no canta aquí'}
                      >
                        <div className="text-center">
                          <div className="text-xs font-bold">
                            {line.isHighlighted ? '🎤' : '🔇'}
                          </div>
                          <div className="text-xs mt-1">
                            {line.isHighlighted ? 'ON' : 'OFF'}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Botón para insertar nueva línea */}
                <div className="flex justify-center py-2">
                  <button
                    onClick={() => insertNewLine(index)}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-all flex items-center space-x-1"
                    title="Insertar nueva línea después"
                  >
                    <span>➕</span>
                    <span>Agregar línea</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div>
              {lyricsLines.filter(line => line.isHighlighted).length} líneas destacadas de {lyricsLines.length} total
            </div>
            <div>
              {lyricsLines.filter(line => line.isHighlighted && line.startTime !== null).length} líneas sincronizadas
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || lyricsLines.filter(line => line.startTime !== null).length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Guarda la sincronización y aplica automáticamente la letra a otras variantes sin sincronizar"
            >
              {isSaving ? 'Guardando...' : 'Guardar Sincronización'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LyricsSynchronizer;
