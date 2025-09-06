import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../config/api';
import { SongCard } from '../components/UI';
import { SongDetailModal } from '../components/Modal';
import type { Song } from '../types';

// Extender el tipo Song para incluir childVersions
interface SongWithVersions extends Song {
  parentSong?: {
    id: string;
    title: string;
  };
  childVersions: Song[];
}

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
  const { token, user } = useAuthStore();
  const [selectedSong, setSelectedSong] = useState<SongWithVersions | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState<SongWithVersions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para filtrar versiones según los voice types del usuario
  const getFilteredVersions = (childVersions: Song[]) => {
    // Si el usuario es ADMIN o DIRECTOR, puede ver todas las versiones
    const isAdmin = user?.roles?.some(r => r.role === 'ADMIN') || false;
    const isDirector = user?.roles?.some(r => r.role === 'DIRECTOR') || false;
    
    console.log('🔍 [GRID-FILTERED-VERSIONS] Usuario roles:', user?.roles?.map(r => r.role));
    console.log('🔍 [GRID-FILTERED-VERSIONS] isAdmin:', isAdmin, 'isDirector:', isDirector);
    
    if (isAdmin || isDirector) {
      console.log('🔍 [GRID-FILTERED-VERSIONS] Admin/Director - mostrando todas las versiones');
      return childVersions;
    }

    // Si es CANTANTE, filtrar por sus voice types + CORO + ORIGINAL
    const userVoiceTypes = user?.voiceProfiles?.map(vp => vp.voiceType) || [];
    const allowedVoiceTypes = [...userVoiceTypes, 'CORO', 'ORIGINAL'];
    
    console.log('🔍 [GRID-FILTERED-VERSIONS] userVoiceTypes:', userVoiceTypes);
    console.log('🔍 [GRID-FILTERED-VERSIONS] allowedVoiceTypes:', allowedVoiceTypes);
    
    const filtered = childVersions.filter(version => {
      // Si no tiene voiceType, considerarlo como ORIGINAL (siempre permitido)
      if (!version.voiceType) {
        console.log(`🔍 [GRID-FILTERED-VERSIONS] "${version.title}" - sin voiceType, permitido (ORIGINAL)`);
        return true;
      }
      
      const isAllowed = allowedVoiceTypes.includes(version.voiceType);
      console.log(`🔍 [GRID-FILTERED-VERSIONS] "${version.title}" (${version.voiceType}) - ${isAllowed ? 'PERMITIDO' : 'BLOQUEADO'}`);
      return isAllowed;
    });
    
    console.log('🔍 [GRID-FILTERED-VERSIONS] Resultado:', filtered.length, 'de', childVersions.length);
    return filtered;
  };

  // Obtener canciones principales con filtrado por voice type
  useEffect(() => {
    const fetchSongs = async () => {
      if (!token) return;

      try {
        console.log('🎵 [SONGS-GRID] === INICIANDO FETCHSONGS ===');
        console.log('🎵 [SONGS-GRID] Usuario:', user?.email);
        console.log('🎵 [SONGS-GRID] Roles:', user?.roles?.map(r => r.role));
        console.log('🎵 [SONGS-GRID] Voice Types:', user?.voiceProfiles?.map(vp => vp.voiceType));
        
        setLoading(true);
        setError(null);

        // Obtener canciones con childVersions para hacer filtrado
        const response = await fetch(getApiUrl('/songs?includeVersions=true'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar las canciones');
        }

        const data = await response.json();
        console.log('🎵 [SONGS-GRID] Canciones del backend:', data.songs?.length);
        
        // Filtrar solo canciones principales (sin parentSongId)
        const mainSongs = (data.songs || []).filter((song: SongWithVersions) => !song.parentSongId);
        console.log('🎵 [SONGS-GRID] Canciones principales:', mainSongs.length);
        
        // Log de cada canción principal con sus variaciones
        mainSongs.forEach((song: SongWithVersions, index: number) => {
          console.log(`🎵 [SONGS-GRID] Canción ${index + 1}: "${song.title}"`);
          console.log(`🎵 [SONGS-GRID]   - Total childVersions: ${song.childVersions?.length || 0}`);
          if (song.childVersions && song.childVersions.length > 0) {
            song.childVersions.forEach(child => {
              console.log(`🎵 [SONGS-GRID]     - "${child.title}" (${child.voiceType || 'sin voiceType'})`);
            });
          }
          
          const accessibleVersions = getFilteredVersions(song.childVersions || []);
          console.log(`🎵 [SONGS-GRID]   - Versiones accesibles: ${accessibleVersions.length}`);
          accessibleVersions.forEach(accessible => {
            console.log(`🎵 [SONGS-GRID]     ✅ "${accessible.title}" (${accessible.voiceType || 'sin voiceType'})`);
          });
          
          if (accessibleVersions.length === 0) {
            console.log(`🎵 [SONGS-GRID]   ❌ CANCIÓN SERÁ OCULTADA: "${song.title}"`);
          } else {
            console.log(`🎵 [SONGS-GRID]   ✅ CANCIÓN SERÁ MOSTRADA: "${song.title}"`);
          }
        });
        
        // FILTRADO POR VOICE TYPE: Solo mostrar canciones que tengan variaciones accesibles
        const filteredSongs = mainSongs.filter((song: SongWithVersions) => {
          const accessibleVersions = getFilteredVersions(song.childVersions || []);
          return accessibleVersions.length > 0;
        });
        
        console.log('🎵 [SONGS-GRID] === RESULTADO FINAL ===');
        console.log(`🎵 [SONGS-GRID] Canciones que se mostrarán: ${filteredSongs.length}/${mainSongs.length}`);
        filteredSongs.forEach((song: SongWithVersions) => {
          console.log(`🎵 [SONGS-GRID]   ✅ "${song.title}"`);
        });
        
        setSongs(filteredSongs);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [token, user]); // Agregar user como dependencia

  // Filtrar canciones según búsqueda
  const filteredSongs = songs.filter((song: SongWithVersions) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.artist && song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener color para una canción (usar el guardado o generar uno aleatorio)
  const getSongColor = (song: SongWithVersions): string => {
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
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
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
