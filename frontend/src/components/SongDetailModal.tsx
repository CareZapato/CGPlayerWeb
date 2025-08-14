import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { getApiUrl, getFileUrl } from '../config/api';
import type { Song } from '../types';

interface SongDetailModalProps {
  song: Song;
  color: string;
  onClose: () => void;
}

const SongDetailModal: React.FC<SongDetailModalProps> = ({ song, color, onClose }) => {
  const { token } = useAuthStore();
  const { setCurrentSong } = usePlayerStore();
  const [variations, setVariations] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar variaciones de la canción
  useEffect(() => {
    const fetchVariations = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await fetch(getApiUrl('/api/songs?includeVersions=false'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Buscar variaciones de esta canción
          const songVariations = (data.songs || []).filter((s: Song) => 
            s.parentSongId === song.id || s.id === song.id
          );
          setVariations(songVariations);
        }
      } catch (error) {
        console.error('Error al cargar variaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVariations();
  }, [song.id, token]);

  const handlePlaySong = (songToPlay: Song) => {
    console.log('🎵 Reproduciendo canción:', songToPlay.title, songToPlay.voiceType);
    
    // Crear el objeto de canción con la URL completa
    const songWithUrl = {
      ...songToPlay,
      url: getFileUrl(songToPlay.filePath)
    };
    
    console.log('🔗 URL de la canción:', songWithUrl.url);
    
    setCurrentSong(songWithUrl);
    onClose();
  };

  const getVoiceTypeLabel = (voiceType?: string) => {
    const labels: { [key: string]: string } = {
      'SOPRANO': 'Soprano',
      'CONTRALTO': 'Contralto', 
      'TENOR': 'Tenor',
      'BARITONE': 'Barítono',
      'BASS': 'Bajo',
      'CORO': 'Coro',
      'ORIGINAL': 'Original'
    };
    return labels[voiceType || 'ORIGINAL'] || voiceType || 'Sin categoría';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div 
          className="p-6 text-white relative"
          style={{ backgroundColor: color }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-4">
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              {song.title.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{song.title}</h2>
              {song.artist && (
                <p className="text-lg opacity-90">{song.artist}</p>
              )}
              <p className="text-sm opacity-75">
                {variations.length} {variations.length === 1 ? 'variación' : 'variaciones'} disponible{variations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Variaciones Disponibles
              </h3>
              
              {variations.map((variation) => (
                <div
                  key={variation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: color }}
                    >
                      {getVoiceTypeLabel(variation.voiceType).charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getVoiceTypeLabel(variation.voiceType)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {Math.floor((variation.duration || 0) / 60)}:{String((variation.duration || 0) % 60).padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handlePlaySong(variation)}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}

              {variations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p>No hay variaciones disponibles para esta canción</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cerrar
            </button>
            <button
              onClick={() => handlePlaySong(song)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reproducir Original
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetailModal;
