import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import api from '../services/api'; // Importar el servicio API con detección dinámica

interface VoiceAssignment {
  filename: string;
  voiceType: string;
}

interface UploadProgress {
  uploaded: number;
  total: number;
  currentFile?: string;
  percentage: number;
}

interface MultiSongUploadProps {
  onUploadComplete?: () => void;
  parentSongId?: string;
}

const MultiSongUpload: React.FC<MultiSongUploadProps> = ({ onUploadComplete, parentSongId }) => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  // Estados
  const [files, setFiles] = useState<File[]>([]);
  const [voiceAssignments, setVoiceAssignments] = useState<VoiceAssignment[]>([]);
  const [metadata, setMetadata] = useState({
    title: '',
    artist: '',
    album: '',
    genre: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    uploaded: 0,
    total: 0,
    percentage: 0
  });

  // Tipos de voz con colores
  const voiceTypes = [
    { value: 'SOPRANO', label: 'Soprano', color: 'bg-pink-100 text-pink-800' },
    { value: 'CONTRALTO', label: 'Contralto', color: 'bg-purple-100 text-purple-800' },
    { value: 'TENOR', label: 'Tenor', color: 'bg-blue-100 text-blue-800' },
    { value: 'BARITONE', label: 'Barítono', color: 'bg-green-100 text-green-800' },
    { value: 'BASS', label: 'Bajo', color: 'bg-gray-100 text-gray-800' }
  ];

  // Configuración del dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']
    },
    maxFiles: 10,
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
    noClick: false,
    noKeyboard: false,
    onDrop: useCallback((acceptedFiles: File[]) => {
      const audioFiles = acceptedFiles.filter(file => {
        const isAudio = file.type.startsWith('audio/') || 
          ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].some(ext => 
            file.name.toLowerCase().endsWith(ext)
          );
        
        if (!isAudio) {
          toast.error(`${file.name} no es un archivo de audio válido`);
          return false;
        }
        
        if (file.size > 100 * 1024 * 1024) {
          toast.error(`${file.name} es muy grande (máximo 100MB)`);
          return false;
        }
        
        return true;
      });

      if (audioFiles.length > 0) {
        setFiles(prev => [...prev, ...audioFiles]);
        setVoiceAssignments(prev => [
          ...prev,
          ...audioFiles.map(file => ({ filename: file.name, voiceType: '' }))
        ]);
        toast.success(`${audioFiles.length} archivo(s) agregado(s)`);
      }
    }, [])
  });

  // Validaciones
  const allFilesAssigned = files.length > 0 && voiceAssignments.length === files.length && 
    voiceAssignments.every(assignment => assignment.voiceType);

  // Actualizar asignación de voz
  const updateVoiceAssignment = (filename: string, voiceType: string) => {
    setVoiceAssignments(prev => 
      prev.map(assignment => 
        assignment.filename === filename 
          ? { ...assignment, voiceType }
          : assignment
      )
    );
  };

  // Remover archivo
  const removeFile = (filename: string) => {
    setFiles(prev => prev.filter(file => file.name !== filename));
    setVoiceAssignments(prev => prev.filter(assignment => assignment.filename !== filename));
  };

  // Mutation para upload múltiple
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No estás autenticado');
      if (files.length === 0) throw new Error('No hay archivos para subir');
      if (!metadata.title.trim()) throw new Error('El título es requerido');
      if (!allFilesAssigned) throw new Error('Todos los archivos deben tener un tipo de voz asignado');

      setIsUploading(true);
      setUploadProgress({ uploaded: 0, total: files.length, percentage: 0 });

      // Crear FormData con todos los archivos
      const formData = new FormData();
      
      // Agregar metadatos
      formData.append('title', metadata.title);
      formData.append('artist', metadata.artist || 'ChileGospel');
      formData.append('album', metadata.album || '');
      formData.append('genre', metadata.genre || 'Gospel');
      formData.append('voiceAssignments', JSON.stringify(voiceAssignments));
      
      if (parentSongId) {
        formData.append('parentSongId', parentSongId);
      }

      // Agregar todos los archivos
      files.forEach((file, index) => {
        console.log(`📎 Agregando archivo ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type
        });
        formData.append('audio', file);
      });

      // Debug del FormData
      console.log('📤 FormData preparado:', {
        title: metadata.title,
        archivos: files.length,
        voiceAssignments: voiceAssignments.length
      });
      
      // Verificar contenido del FormData
      const formDataEntries = [];
      for (let [key, value] of formData.entries()) {
        formDataEntries.push({
          key,
          value: value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value
        });
      }
      console.log('📋 FormData entries:', formDataEntries);

      // Usar el servicio API con detección dinámica de URL
      // No especificar Content-Type para que axios lo maneje automáticamente con FormData
      const response = await api.post('/songs/multi-upload', formData);

      const result = response.data;
      
      setUploadProgress({
        uploaded: files.length,
        total: files.length,
        percentage: 100,
        currentFile: undefined
      });

      return result;
    },
    onSuccess: (result) => {
      toast.success(`✅ ${result.songs?.length || files.length} archivo(s) subido(s) exitosamente`);
      
      // Limpiar estado
      setFiles([]);
      setVoiceAssignments([]);
      setMetadata({ title: '', artist: '', album: '', genre: '' });
      setUploadProgress({ uploaded: 0, total: 0, percentage: 0 });
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setUploadProgress({ uploaded: 0, total: 0, percentage: 0 });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Selecciona al menos un archivo');
      return;
    }

    if (!metadata.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    if (!allFilesAssigned) {
      toast.error('Todos los archivos deben tener un tipo de voz asignado');
      return;
    }

    uploadMutation.mutate();
  };

  // Función para formatear el tamaño del archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          📚 Subir Múltiples Canciones
        </h2>

        {/* Metadatos generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Título de la canción *
            </label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Amazing Grace"
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Artista
            </label>
            <input
              type="text"
              value={metadata.artist}
              onChange={(e) => setMetadata(prev => ({ ...prev, artist: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="ChileGospel"
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Álbum
            </label>
            <input
              type="text"
              value={metadata.album}
              onChange={(e) => setMetadata(prev => ({ ...prev, album: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nombre del álbum"
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Género
            </label>
            <select
              value={metadata.genre}
              onChange={(e) => setMetadata(prev => ({ ...prev, genre: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isUploading}
            >
              <option value="">Seleccionar género</option>
              <option value="Gospel">Gospel</option>
              <option value="Praise">Praise</option>
              <option value="Worship">Worship</option>
              <option value="Traditional">Traditional</option>
            </select>
          </div>
        </div>

        {/* Zona de arrastre */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} multiple accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,audio/*" />
          <div className="space-y-2">
            <div className="text-4xl">🎵</div>
            {isDragActive ? (
              <p className="text-blue-600">Suelta los archivos aquí...</p>
            ) : (
              <>
                <p className="text-gray-600">Arrastra archivos de audio aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-500">
                  Soporta MP3, WAV, OGG, M4A, AAC, FLAC • Máximo 10 archivos • 100MB por archivo
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Tip: Puedes seleccionar múltiples archivos manteniendo Ctrl (Windows) o Cmd (Mac)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        {isUploading && (
          <div className="mt-6 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Subiendo... ({uploadProgress.uploaded}/{uploadProgress.total})
              </span>
              <span className="text-sm text-gray-600">{uploadProgress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              ></div>
            </div>
            {uploadProgress.currentFile && (
              <p className="text-xs text-gray-500 mt-2">
                Archivo actual: {uploadProgress.currentFile}
              </p>
            )}
          </div>
        )}

        {/* Lista de archivos */}
        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Archivos seleccionados ({files.length})</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {files.map((file, index) => {
                const assignment = voiceAssignments.find(a => a.filename === file.name);
                const audioUrl = URL.createObjectURL(file);
                return (
                  <div key={`${file.name}-${index}`} className="flex flex-col space-y-3 p-3 bg-gray-50 rounded-md">
                    {/* Preview de audio - ANCHO COMPLETO */}
                    <div className="w-full">
                      <audio 
                        controls 
                        className="w-full h-12"
                        preload="none"
                        style={{ height: '48px', width: '100%' }}
                      >
                        <source src={audioUrl} type={file.type} />
                        Tu navegador no soporta el elemento de audio.
                      </audio>
                    </div>
                    
                    {/* Info del archivo y controles */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        {/* Selector de tipo de voz con color */}
                        <div className="flex flex-col items-end">
                          <select
                            value={assignment?.voiceType || ''}
                            onChange={(e) => updateVoiceAssignment(file.name, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={isUploading}
                          >
                            <option value="">Seleccionar voz</option>
                            {voiceTypes.map(voice => (
                              <option key={voice.value} value={voice.value}>
                                {voice.label}
                              </option>
                            ))}
                          </select>
                          {assignment?.voiceType && (
                            <span className={`mt-1 px-2 py-1 text-xs rounded-full ${voiceTypes.find(v => v.value === assignment.voiceType)?.color || 'bg-gray-100 text-gray-800'}`}>
                              {voiceTypes.find(v => v.value === assignment.voiceType)?.label}
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            URL.revokeObjectURL(audioUrl);
                            removeFile(file.name);
                          }}
                          disabled={isUploading}
                          className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                          title="Remover archivo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-6">
          {/* Indicadores de validación */}
          <div className="mb-4 space-y-2 text-sm bg-gray-50 p-3 rounded-md">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${metadata.title.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className={metadata.title.trim() ? 'text-green-700' : 'text-gray-500'}>
                Título definido {metadata.title.trim() ? '✓' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${files.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className={files.length > 0 ? 'text-green-700' : 'text-gray-500'}>
                Archivos seleccionados {files.length > 0 ? `(${files.length}) ✓` : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${allFilesAssigned ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className={allFilesAssigned ? 'text-green-700' : 'text-gray-500'}>
                Tipos de voz asignados {allFilesAssigned ? '✓' : `(${voiceAssignments.filter(a => a.voiceType).length}/${files.length})`}
              </span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setFiles([]);
                setVoiceAssignments([]);
                setUploadProgress({ uploaded: 0, total: 0, percentage: 0 });
              }}
              disabled={files.length === 0 || isUploading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Limpiar
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading || !metadata.title.trim() || !allFilesAssigned}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Subiendo... ({uploadProgress.uploaded}/{uploadProgress.total})</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Subir {files.length} archivo{files.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSongUpload;
