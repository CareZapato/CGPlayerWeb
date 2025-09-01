import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
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
        .map((lyric) => ({
          id: lyric.id,
          content: lyric.content,
          startTime: lyric.startTime || null,
          endTime: lyric.endTime || null,
          lineNumber: lyric.lineNumber,
          isSelected: false,
          isActive: true // Por defecto todas las líneas están activas
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

  const markStartTime = (lineIndex: number) => {
    setLyricsLines(prev => prev.map((line, index) => {
      if (index === lineIndex) {
        return { ...line, startTime: currentTime, isSelected: true };
      }
      return { ...line, isSelected: false };
    }));
  };

  const markEndTime = (lineIndex: number) => {
    setLyricsLines(prev => prev.map((line, index) => {
      if (index === lineIndex) {
        return { ...line, endTime: currentTime };
      }
      return line;
    }));
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

          <div className="text-sm text-gray-600 mb-2">
            <strong>Instrucciones:</strong>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• <strong>Activar/Desactivar:</strong> Marca qué líneas canta esta voz específica</p>
            <p>• <strong>Marcar Inicio:</strong> Haz clic cuando comience cada línea</p>
            <p>• <strong>Marcar Final:</strong> Haz clic cuando termine cada línea</p>
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
          <div className="space-y-3">
            {lyricsLines.map((line, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-lg transition-all ${
                  !line.isActive 
                    ? 'border-gray-300 bg-gray-100 opacity-60'
                    : line.isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : line.startTime !== null 
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Checkbox para activar/desactivar línea */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={line.isActive}
                        onChange={() => toggleLineActive(index)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs text-gray-500">Esta voz canta</span>
                    </label>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${!line.isActive ? 'text-gray-400' : 'text-gray-900'}`}>
                        {line.content}
                      </p>
                      <div className="text-sm text-gray-500 mt-1">
                        {line.startTime !== null && (
                          <span className="mr-4">
                            Inicio: {formatTime(line.startTime)}
                          </span>
                        )}
                        {line.endTime !== null && (
                          <span>
                            Final: {formatTime(line.endTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => markStartTime(index)}
                      disabled={!line.isActive}
                      className={`px-3 py-1 text-xs rounded ${
                        !line.isActive
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : line.startTime !== null
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      {line.startTime !== null ? (
                        <CheckIcon className="h-4 w-4 inline" />
                      ) : (
                        'Marcar Inicio'
                      )}
                    </button>
                    
                    <button
                      onClick={() => markEndTime(index)}
                      disabled={!line.isActive || line.startTime === null}
                      className={`px-3 py-1 text-xs rounded ${
                        !line.isActive || line.startTime === null
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : line.endTime !== null
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {line.endTime !== null ? (
                        <CheckIcon className="h-4 w-4 inline" />
                      ) : (
                        'Marcar Final'
                      )}
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
