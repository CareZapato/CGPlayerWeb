import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api'; // Importar el servicio API con detección dinámica

interface SongUploadProps {
  parentSong?: {
    id: string;
    title: string;
  };
  onUploadSuccess?: () => void;
  onClose?: () => void;
}

const VOICE_TYPES = [
  { value: 'SOPRANO', label: 'Soprano' },
  { value: 'CONTRALTO', label: 'Contralto' },
  { value: 'TENOR', label: 'Tenor' },
  { value: 'BARITONE', label: 'Barítono' },
  { value: 'BASS', label: 'Bajo' }
];

const SongUpload: React.FC<SongUploadProps> = ({ parentSong, onUploadSuccess, onClose }) => {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    title: parentSong ? parentSong.title : '',
    artist: '',
    album: '',
    genre: 'Gospel',
    voiceType: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de archivo
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Formato de archivo no soportado. Use MP3, WAV, OGG o M4A.');
        return;
      }

      // Validar tamaño (50MB máximo)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 50MB.');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Por favor selecciona un archivo de audio');
      return;
    }

    if (!formData.title.trim()) {
      setError('El título es requerido');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const uploadData = new FormData();
      uploadData.append('audio', file);
      uploadData.append('title', formData.title);
      uploadData.append('artist', formData.artist);
      uploadData.append('album', formData.album);
      uploadData.append('genre', formData.genre);
      
      if (formData.voiceType) {
        uploadData.append('voiceType', formData.voiceType);
      }
      
      if (parentSong) {
        uploadData.append('parentSongId', parentSong.id);
      }

      console.log('📤 Enviando archivo:', {
        title: formData.title,
        filename: file.name,
        size: file.size
      });

      // Usar el servicio API con detección dinámica de URL
      // No especificar Content-Type para que axios lo maneje automáticamente
      const response = await api.post('/songs/upload', uploadData);

      const result = response.data;
      console.log('Canción subida:', result);
      
      // Resetear formulario
      setFormData({
        title: parentSong ? parentSong.title : '',
        artist: '',
        album: '',
        genre: 'Gospel',
        voiceType: ''
      });
      setFile(null);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error: any) {
      console.error('Error uploading song:', error);
      setError(error.message || 'Error al subir la canción');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {parentSong ? `Agregar Versión - ${parentSong.title}` : 'Subir Nueva Canción'}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Archivo de audio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo de Audio *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition-colors">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="audio-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                  <span>Seleccionar archivo</span>
                  <input
                    id="audio-upload"
                    name="audio-upload"
                    type="file"
                    className="sr-only"
                    accept="audio/*"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">o arrastra y suelta</p>
              </div>
              <p className="text-xs text-gray-500">MP3, WAV, OGG, M4A hasta 50MB</p>
              {file && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Información de la canción */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="input mt-1"
              placeholder="Título de la canción"
              disabled={!!parentSong}
            />
          </div>

          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-gray-700">
              Artista
            </label>
            <input
              type="text"
              name="artist"
              id="artist"
              value={formData.artist}
              onChange={handleInputChange}
              className="input mt-1"
              placeholder="Nombre del artista"
            />
          </div>

          <div>
            <label htmlFor="album" className="block text-sm font-medium text-gray-700">
              Álbum
            </label>
            <input
              type="text"
              name="album"
              id="album"
              value={formData.album}
              onChange={handleInputChange}
              className="input mt-1"
              placeholder="Nombre del álbum"
            />
          </div>

          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
              Género
            </label>
            <input
              type="text"
              name="genre"
              id="genre"
              value={formData.genre}
              onChange={handleInputChange}
              className="input mt-1"
              placeholder="Género musical"
            />
          </div>
        </div>

        {/* Tipo de voz */}
        <div>
          <label htmlFor="voiceType" className="block text-sm font-medium text-gray-700">
            Tipo de Voz {parentSong && '*'}
          </label>
          <select
            name="voiceType"
            id="voiceType"
            value={formData.voiceType}
            onChange={handleInputChange}
            className="input mt-1"
            required={!!parentSong}
          >
            <option value="">
              {parentSong ? 'Seleccionar tipo de voz' : 'Original (sin tipo específico)'}
            </option>
            {VOICE_TYPES.map(voice => (
              <option key={voice.value} value={voice.value}>
                {voice.label}
              </option>
            ))}
          </select>
          {parentSong && (
            <p className="mt-1 text-sm text-gray-500">
              Selecciona el tipo de voz para esta versión
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isUploading}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isUploading || !file}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Subiendo...' : 'Subir Canción'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SongUpload;
