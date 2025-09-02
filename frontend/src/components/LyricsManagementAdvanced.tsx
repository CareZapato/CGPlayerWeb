import { useState, useRef, useEffect } from 'react';
import { useLyrics } from '../hooks/useLyrics';
import { LyricsFileType, type VoiceType } from '../types/lyrics';
// import { LyricsViewer } from './LyricsViewer'; // Temporalmente comentado

interface LyricsManagementAdvancedProps {
  songId: string;
  songTitle: string;
  songVoiceType?: VoiceType | null; // Tipo de voz de la canción actual
  onUpdate?: () => void;
  className?: string;
}

const VOICE_TYPES: { value: VoiceType | null; label: string }[] = [
  { value: null, label: 'Canción Principal' },
  { value: 'SOPRANO', label: 'Soprano' },
  { value: 'CONTRALTO', label: 'Contralto' },
  { value: 'TENOR', label: 'Tenor' },
  { value: 'BAJO', label: 'Bajo' },
  { value: 'CORO', label: 'Coro' }
];

export function LyricsManagementAdvanced({ 
  songId, 
  songTitle, 
  songVoiceType,
  onUpdate, 
  className = '' 
}: LyricsManagementAdvancedProps) {
  const {
    lyrics,
    error,
    loadLyrics,
    updateTextLyrics,
    uploadLyricsFile,
    deleteLyrics,
    clearError
  } = useLyrics(songId);

  const [activeTab, setActiveTab] = useState<'view' | 'text' | 'files' | 'sync'>('view');
  const [selectedVoiceType, setSelectedVoiceType] = useState<VoiceType | null>(songVoiceType || null);
  const [textContent, setTextContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar letras al montar el componente
  useEffect(() => {
    if (songId) {
      loadLyrics(songId);
    }
  }, [songId, loadLyrics]);

  // Actualizar el contenido de texto cuando cambien las letras
  useEffect(() => {
    // Buscar letras de texto para la variante seleccionada
    const textLyric = lyrics?.lyrics?.find(
      l => l.voiceType === selectedVoiceType && l.isTextLyrics
    );
    if (textLyric?.textContent) {
      setTextContent(textLyric.textContent);
    } else {
      setTextContent('');
    }
  }, [lyrics?.lyrics, selectedVoiceType]);

  const handleVoiceTypeChange = (voiceType: string | null) => {
    const parsedVoiceType = voiceType as VoiceType | null;
    setSelectedVoiceType(parsedVoiceType);
    // Limpiar contenido de texto al cambiar variante
    setTextContent('');
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) return;

    setIsSubmitting(true);
    clearError();
    setSuccessMessage('');

    try {
      await updateTextLyrics(textContent, selectedVoiceType);
      setSuccessMessage(`Letras de texto actualizadas para ${
        selectedVoiceType ? VOICE_TYPES.find(v => v.value === selectedVoiceType)?.label : 'Canción Principal'
      }`);
      onUpdate?.();
      
      // Cambiar a vista después de guardar
      setTimeout(() => {
        setActiveTab('view');
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error updating text lyrics:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no válido. Solo se permiten PDF, DOC, DOCX, TXT, JPG y PNG.');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. El tamaño máximo es 10MB.');
      return;
    }

    setIsSubmitting(true);
    clearError();
    setSuccessMessage('');

    try {
      await uploadLyricsFile(file);
      setSuccessMessage(`Archivo ${file.name} subido correctamente`);
      onUpdate?.();
      
      // Limpiar input y cambiar a vista
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setActiveTab('view');
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todas las letras de esta canción?')) {
      return;
    }

    setIsSubmitting(true);
    clearError();
    setSuccessMessage('');

    try {
      await deleteLyrics();
      setSuccessMessage('Letras eliminadas correctamente');
      setTextContent('');
      onUpdate?.();
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error deleting lyrics:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileTypeIcon = (fileType: LyricsFileType) => {
    switch (fileType) {
      case LyricsFileType.PDF:
        return '📄';
      case LyricsFileType.DOC:
      case LyricsFileType.DOCX:
        return '📝';
      case LyricsFileType.IMAGE_JPG:
      case LyricsFileType.IMAGE_PNG:
        return '🖼️';
      case LyricsFileType.TEXT:
        return '📃';
      default:
        return '📄';
    }
  };

  const getFileTypeName = (fileType: LyricsFileType) => {
    switch (fileType) {
      case LyricsFileType.PDF:
        return 'PDF';
      case LyricsFileType.DOC:
        return 'DOC';
      case LyricsFileType.DOCX:
        return 'DOCX';
      case LyricsFileType.IMAGE_JPG:
        return 'Imagen JPG';
      case LyricsFileType.IMAGE_PNG:
        return 'Imagen PNG';
      case LyricsFileType.TEXT:
        return 'Texto';
      default:
        return 'Archivo';
    }
  };

  const tabs = [
    { id: 'view', label: 'Ver letras', icon: '👁️' },
    { id: 'text', label: 'Texto por Variante', icon: '📝' },
    { id: 'files', label: 'Archivos Compartidos', icon: '📄' },
    { id: 'sync', label: 'Sincronización', icon: '🎵' }
  ] as const;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header con pestañas */}
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Gestión de Letras: {songTitle}
          </h3>
          
          {(lyrics?.lyricsFiles?.length || lyrics?.lyrics?.length) && (
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Eliminar todas las letras"
            >
              🗑️ Eliminar Todo
            </button>
          )}
        </div>
        
        <div className="flex space-x-0 border-t">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {(error || successMessage) && (
        <div className="p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
              <div className="flex">
                <div className="text-red-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
              <div className="flex">
                <div className="text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {activeTab === 'view' && (
          <div className="min-h-96">
            {/* <LyricsViewer 
              songId={songId} 
              songTitle={songTitle}
              className="border-0 shadow-none"
            /> */}
            <div className="text-center text-gray-500 py-8">
              <p>Vista de letras temporalmente deshabilitada</p>
              <p className="text-sm">Usa el reproductor principal para ver letras</p>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            {/* Selector de variante de voz */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variante de voz
              </label>
              <select
                value={selectedVoiceType || ''}
                onChange={(e) => handleVoiceTypeChange(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {VOICE_TYPES.map((voice) => (
                  <option key={voice.value || 'main'} value={voice.value || ''}>
                    {voice.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Las letras de texto se guardan por separado para cada variante de voz
              </p>
            </div>

            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido de las letras para {
                    selectedVoiceType ? VOICE_TYPES.find(v => v.value === selectedVoiceType)?.label : 'Canción Principal'
                  }
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Escribe o pega las letras de la canción aquí..."
                  className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setTextContent('')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !textContent.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar letras'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subir archivo de letras (compartido entre todas las variantes)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor="lyrics-file" className="cursor-pointer">
                    <span className="text-base font-medium text-blue-600 hover:text-blue-500">
                      Seleccionar archivo
                    </span>
                    <input
                      id="lyrics-file"
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={isSubmitting}
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, DOC, DOCX, TXT, JPG, PNG hasta 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de archivos existentes */}
            {lyrics?.lyricsFiles && lyrics.lyricsFiles.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Archivos cargados</h4>
                <div className="space-y-2">
                  {lyrics.lyricsFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-white rounded-md p-3 border">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">
                          {getFileTypeIcon(file.fileType)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {getFileTypeName(file.fileType)} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`/uploads/lyrics/${file.filePath.split('/').pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="text-blue-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Próximamente</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    La interfaz de sincronización Spotify-like estará disponible en una próxima iteración. 
                    Permitirá configurar tiempos específicos para cada línea de letra, 
                    diferenciados por tipo de voz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
