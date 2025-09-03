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
  isActive: boolean; // Nueva propiedad para indicar si esta voz canta en esta línea
  isCurrent: boolean; // Nueva propiedad para la línea actualmente seleccionada
}

const LyricsSynchronizer: React.FC<LyricsSynchronizerProps> = ({ song, onClose, onSave }) => {
  const { lyrics, loadLyrics, updateSync } = useLyrics();
  const { serverInfo } = useServerInfo();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyricsLines, setLyricsLines] = useState<LyricLine[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  useEffect(() => {
    if (song.id) {
      loadLyrics(song.id);
    }
  }, [song.id, loadLyrics]);

  useEffect(() => {
    if (lyrics?.lyrics) {
      const lines = lyrics.lyrics
        .filter(lyric => lyric.voiceType === song.voiceType)
        .sort((a, b) => a.lineNumber - b.lineNumber)
        .map((lyric, index) => ({
          id: lyric.id,
          content: lyric.content,
          startTime: lyric.startTime || null,
          endTime: lyric.endTime || null,
          lineNumber: lyric.lineNumber,
          isSelected: false,
          isActive: true, // Por defecto todas las líneas están activas
          isCurrent: index === 0 // La primera línea es la actual por defecto
        }));
      
      setLyricsLines(lines);
    }
  }, [lyrics, song.voiceType]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
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

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Nueva función para marcado dinámico con spacebar
  const markCurrentLineAndAdvance = () => {
    setLyricsLines(prev => prev.map((line, index) => {
      if (index === currentLineIndex && line.isActive) {
        return { 
          ...line, 
          startTime: currentTime, 
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

  const toggleLineActive = (lineIndex: number) => {
    setLyricsLines(prev => prev.map((line, index) => {
      if (index === lineIndex) {
        return { 
          ...line, 
          isActive: !line.isActive,
          // Si se desactiva, limpiar los tiempos
          startTime: !line.isActive ? line.startTime : null,
          endTime: !line.isActive ? line.endTime : null
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
      // Solo incluir líneas activas y que tengan al menos un tiempo marcado
      const syncData = lyricsLines
        .filter(line => line.isActive && (line.startTime !== null || line.endTime !== null))
        .map(line => ({
          content: line.content,
          startTime: line.startTime || undefined,
          endTime: line.endTime || undefined,
          lineNumber: line.lineNumber,
          voiceType: song.voiceType || undefined
        }));

      if (syncData.length === 0) {
        alert('Debes marcar al menos una línea como activa y asignar tiempos antes de guardar.');
        setIsSaving(false);
        return;
      }

      await updateSync(syncData, song.id);
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
            </div>
            <div className="text-purple-600 font-medium">
              Línea {currentLineIndex + 1} de {lyricsLines.length}
            </div>
          </div>
          
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
              <div 
                key={index}
                className={`p-4 border rounded-lg transition-all duration-300 ${
                  line.isCurrent
                    ? 'border-purple-500 bg-purple-100 shadow-lg transform scale-105'
                    : !line.isActive 
                      ? 'border-gray-300 bg-gray-100 opacity-60'
                      : line.startTime !== null 
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Letra a la izquierda */}
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`font-medium text-lg leading-relaxed ${
                      line.isCurrent 
                        ? 'text-purple-900 font-bold' 
                        : !line.isActive 
                          ? 'text-gray-400' 
                          : 'text-gray-900'
                    }`}>
                      {line.content}
                    </p>
                    {line.startTime !== null && (
                      <div className="text-sm text-gray-500 mt-1">
                        ⏱️ {formatTime(line.startTime)}
                        {line.endTime !== null && ` - ${formatTime(line.endTime)}`}
                      </div>
                    )}
                  </div>
                  
                  {/* Botón indicador a la derecha */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => toggleLineActive(index)}
                      className={`w-16 h-16 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                        line.isActive
                          ? 'bg-purple-500 border-purple-600 text-white shadow-lg hover:bg-purple-600'
                          : 'bg-gray-200 border-gray-300 text-gray-500 hover:bg-gray-300'
                      }`}
                      title={line.isActive ? 'Esta voz canta aquí' : 'Esta voz no canta aquí'}
                    >
                      <div className="text-center">
                        <div className="text-xs font-bold">
                          {line.isActive ? '🎤' : '🔇'}
                        </div>
                        <div className="text-xs mt-1">
                          {line.isActive ? 'ON' : 'OFF'}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div>
              {lyricsLines.filter(line => line.isActive).length} líneas activas de {lyricsLines.length} total
            </div>
            <div>
              {lyricsLines.filter(line => line.isActive && line.startTime !== null).length} líneas sincronizadas
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
