import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import './SongUpload.css';

interface ParentSong {
  id: string;
  title: string;
}

interface SongUploadProps {
  parentSong?: ParentSong;
  onUploadSuccess?: () => void;
  onClose?: () => void;
}

// Tipos de voz disponibles
const voiceTypes = [
  { value: 'SOPRANO', label: 'Soprano', color: 'bg-pink-100 text-pink-800' },
  { value: 'CONTRALTO', label: 'Contralto', color: 'bg-purple-100 text-purple-800' },
  { value: 'TENOR', label: 'Tenor', color: 'bg-blue-100 text-blue-800' },
  { value: 'BARITONO', label: 'Barítono', color: 'bg-green-100 text-green-800' },
  { value: 'MESOSOPRANO', label: 'Mesosoprano', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'BAJO', label: 'Bajo', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CORO', label: 'Coro', color: 'bg-orange-100 text-orange-800' },
  { value: 'ORIGINAL', label: 'Original', color: 'bg-gray-100 text-gray-800' },
  { value: 'INSTRUMENTAL', label: 'Instrumental', color: 'bg-red-100 text-red-800' }
];

const SongUpload: React.FC<SongUploadProps> = ({ parentSong, onUploadSuccess, onClose }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVoiceType, setSelectedVoiceType] = useState<string>('');
  useAuthStore(); // Para verificar autenticación
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
      
      // Agregar voice type si está seleccionado
      if (selectedVoiceType) {
        formData.append('voiceType', selectedVoiceType);
      }
      
      // Si hay una canción padre, agregar el parentSongId
      if (parentSong) {
        formData.append('parentSongId', parentSong.id);
      }
      
      const response = await api.post('/songs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Canción subida exitosamente');
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      setIsUploading(false);
      
      // Ejecutar callback de éxito si existe
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al subir la canción');
      setIsUploading(false);
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        // Validar que se haya seleccionado un voice type
        if (!selectedVoiceType) {
          toast.error('Por favor selecciona un tipo de voz antes de subir el archivo');
          return;
        }
        
        setIsUploading(true);
        uploadMutation.mutate(acceptedFiles[0]);
      }
    },
  });

  return (
    <div className="song-upload">
      <div className="song-upload__container">
        <div className="song-upload__header">
          <h2 className="song-upload__title">
            {parentSong ? `Agregar versión a "${parentSong.title}"` : 'Subir Nueva Canción'}
          </h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="song-upload__close-btn"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
        
        {parentSong && (
          <div className="song-upload__parent-info">
            <p className="song-upload__parent-text">
              Esta canción será agregada como una versión de <strong>{parentSong.title}</strong>
            </p>
          </div>
        )}

        {/* Selector de tipo de voz */}
        <div className="song-upload__voice-selector">
          <label className="song-upload__voice-label">
            Tipo de voz:
          </label>
          <select
            value={selectedVoiceType}
            onChange={(e) => setSelectedVoiceType(e.target.value)}
            className="song-upload__voice-select"
            disabled={isUploading}
          >
            <option value="">Seleccionar tipo de voz</option>
            {voiceTypes.map(voice => (
              <option key={voice.value} value={voice.value}>
                {voice.label}
              </option>
            ))}
          </select>
          {selectedVoiceType && (
            <span className={`song-upload__voice-badge ${voiceTypes.find(v => v.value === selectedVoiceType)?.color || 'bg-gray-100 text-gray-800'}`}>
              {voiceTypes.find(v => v.value === selectedVoiceType)?.label}
            </span>
          )}
        </div>
        
        <div
          {...getRootProps()}
          className={`song-upload__dropzone ${
            isDragActive ? 'song-upload__dropzone--active' : ''
          } ${isUploading ? 'song-upload__dropzone--uploading' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="song-upload__icon">
            🎵
          </div>
          
          {isUploading ? (
            <div className="song-upload__uploading">
              <div className="song-upload__spinner"></div>
              <p>Subiendo canción...</p>
            </div>
          ) : isDragActive ? (
            <p className="song-upload__text">Suelta el archivo aquí...</p>
          ) : (
            <div className="song-upload__content">
              <p className="song-upload__text">
                Arrastra un archivo de audio aquí, o haz clic para seleccionar
              </p>
              <p className="song-upload__hint">
                Formatos soportados: MP3, WAV, OGG, M4A
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongUpload;
