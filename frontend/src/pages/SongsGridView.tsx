import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../config/api';
import SongCard from '../components/SongCard';
import SongDetailModal from '../components/SongDetailModal';
import type { Song } from '../types';

// Paleta de colores predefinida
const COLOR_PALETTE = [
  '#FF6B6B', // Rosa coral
  '#4ECDC4', // Turquesa
  '#45B7D1', // Azul cielo
  '#96CEB4', // Verde menta
  '#FFEAA7', // Amarillo suave
  '#DDA0DD', // Lila
  '#98D8C8', // Verde agua
  '#F7DC6F', // Amarillo dorado
  '#BB8FCE', // Púrpura suave
  '#85C1E9', // Azul claro
  '#F8C471', // Naranja suave
  '#82E0AA'  // Verde claro
];

const SongsGridView: React.FC = () => {
  const { token } = useAuthStore();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener canciones principales (sin parentSongId)
  useEffect(() => {
    const fetchSongs = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(getApiUrl('/api/songs?includeVersions=false'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar las canciones');
        }

        const data = await response.json();
        // Filtrar solo canciones principales (sin parentSongId)
        const mainSongs = (data.songs || []).filter((song: Song) => !song.parentSongId);
        setSongs(mainSongs);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [token]);

  // Filtrar canciones según búsqueda
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.artist && song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener color para una canción (usar el guardado o generar uno aleatorio)
  const getSongColor = (song: Song): string => {
    if (song.coverColor) {
      return song.coverColor;
    }
    // Generar color consistente basado en el ID de la canción
    const index = song.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Canciones</h1>
          <p className="text-gray-600">
            {filteredSongs.length} canciones disponibles
          </p>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar canciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Grid de canciones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredSongs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            color={getSongColor(song)}
            onClick={() => setSelectedSong(song)}
          />
        ))}
      </div>

      {/* Estado vacío */}
      {filteredSongs.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron canciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Intenta cambiar los términos de búsqueda.' : 'No hay canciones disponibles.'}
          </p>
        </div>
      )}

      {/* Modal de detalle de la canción */}
      {selectedSong && (
        <SongDetailModal
          song={selectedSong}
          color={getSongColor(selectedSong)}
          onClose={() => setSelectedSong(null)}
        />
      )}
    </div>
  );
};

export default SongsGridView;
