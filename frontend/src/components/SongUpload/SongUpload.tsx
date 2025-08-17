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

const SongUpload: React.FC<SongUploadProps> = ({ parentSong, onUploadSuccess, onClose }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
      
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
