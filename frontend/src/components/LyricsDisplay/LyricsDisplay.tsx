import React, { useState, useEffect } from 'react';
import { useLyrics } from '../../hooks/useLyrics';
import type { VoiceType, LyricsFile } from '../../types/lyrics';

interface LyricsDisplayProps {
  songId: string;
  className?: string;
  compact?: boolean;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ 
  songId, 
  className = '', 
  compact = false 
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceType | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const { 
    lyrics,
    isLoading, 
    error,
    loadLyrics
  } = useLyrics(songId);

  const [lyricsData, setLyricsData] = useState<{
    files: LyricsFile[];
    textLyrics: { voiceType: VoiceType | null; content: string } | null;
  }>({ files: [], textLyrics: null });

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!songId) return;
      
      try {
        await loadLyrics();
      } catch (err) {
        console.error('Error cargando letras:', err);
      }
    };

    if (isOpen || !compact) {
      fetchLyrics();
    }
  }, [songId, isOpen, compact, loadLyrics]);

  // Procesar datos cuando cambie la respuesta de letras
  useEffect(() => {
    if (lyrics) {
      // Extraer archivos de letras
      const files = lyrics.lyricsFiles || [];
      
      // Buscar letras de texto para la variante seleccionada
      const textLyrics = lyrics.lyrics?.find(l => 
        l.isTextLyrics && 
        (selectedVoice ? l.voiceType === selectedVoice : l.voiceType === null)
      );
      
      setLyricsData({
        files,
        textLyrics: textLyrics ? {
          voiceType: textLyrics.voiceType || null,
          content: textLyrics.textContent || ''
        } : null
      });
    }
  }, [lyrics, selectedVoice]);

  const voiceTypes = [
    { value: null, label: 'Canción Principal' },
    { value: 'SOPRANO' as VoiceType, label: 'Soprano' },
    { value: 'CONTRALTO' as VoiceType, label: 'Contralto' },
    { value: 'TENOR' as VoiceType, label: 'Tenor' },
    { value: 'BAJO' as VoiceType, label: 'Bajo' },
    { value: 'TODOS_LOS_CORISTAS' as VoiceType, label: 'Todos los Coristas' },
  ];

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'txt': return '📃';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasLyrics = lyricsData.files.length > 0 || lyricsData.textLyrics?.content;

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-red-600 ${className}`}>
        <p className="text-sm">Error cargando letras</p>
      </div>
    );
  }

  if (!hasLyrics && !isOpen) {
    return (
      <div className={`p-4 text-gray-500 ${className}`}>
        <p className="text-sm flex items-center">
          <span className="mr-2">📝</span>
          No hay letras disponibles
        </p>
      </div>
    );
  }

  if (compact && !isOpen) {
    return (
      <div className={className}>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
        >
          <span className="flex items-center text-gray-700">
            <span className="mr-2">📝</span>
            <span className="font-medium">Ver letras</span>
            {lyricsData.files.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {lyricsData.files.length} archivo{lyricsData.files.length !== 1 ? 's' : ''}
              </span>
            )}
          </span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {compact && (
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <span className="mr-2">📝</span>
            Letras de la canción
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Selector de variante de voz */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variante de voz:
          </label>
          <select
            value={selectedVoice || ''}
            onChange={(e) => setSelectedVoice(e.target.value as VoiceType || null)}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {voiceTypes.map(voice => (
              <option key={voice.value || 'main'} value={voice.value || ''}>
                {voice.label}
              </option>
            ))}
          </select>
        </div>

        {/* Archivos de letras compartidos */}
        {lyricsData.files.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <span className="mr-2">📄</span>
              Archivos de letras ({lyricsData.files.length})
              <span className="ml-2 text-xs text-gray-500">Compartidos entre todas las variantes</span>
            </h4>
            <div className="space-y-2">
              {lyricsData.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getFileIcon(file.fileName)}</span>
                    <div>
                      <p className="font-medium text-sm">{file.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} • {file.fileType}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Abrir archivo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Texto de letras específico por variante */}
        {lyricsData.textLyrics?.content && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <span className="mr-2">📝</span>
              Letras de texto
              {selectedVoice && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {voiceTypes.find(v => v.value === selectedVoice)?.label}
                </span>
              )}
            </h4>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {lyricsData.textLyrics.content}
              </pre>
            </div>
          </div>
        )}

        {/* Mensaje si no hay letras para la variante seleccionada */}
        {!lyricsData.textLyrics?.content && lyricsData.files.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">📝</span>
            <p className="font-medium">No hay letras disponibles</p>
            <p className="text-sm">
              {selectedVoice 
                ? `No hay letras específicas para ${voiceTypes.find(v => v.value === selectedVoice)?.label}`
                : 'No hay letras para la canción principal'
              }
            </p>
          </div>
        )}

        {/* Información sobre archivos compartidos */}
        {lyricsData.files.length > 0 && selectedVoice && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            💡 Los archivos de letras están disponibles para todas las variantes de voz.
          </div>
        )}
      </div>
    </div>
  );
};

export default LyricsDisplay;
