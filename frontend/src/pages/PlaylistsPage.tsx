import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PlayIcon,
  EyeIcon,
  LockClosedIcon,
  ClockIcon,
  MusicalNoteIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { usePlaylistStore } from '../store/playlistStore';
import { usePlayerStore } from '../store/playerStore';
import { getSongFileUrl } from '../config/api';

interface Song {
  id: string;
  title: string;
  artist: string | null;
  duration: number | null;
  voiceType: string;
  uploader: {
    firstName: string;
    lastName: string;
  };
}

interface PlaylistItem {
  id: string;
  order: number;
  song: Song;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  totalDuration: number;
  totalSongs: number;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  items?: PlaylistItem[];
}

const PlaylistsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { replaceQueueAndPlay } = usePlaylistStore();
  const { playSong } = usePlayerStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showSongManager, setShowSongManager] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: false,
    image: null as File | null
  });

  // Estado para el modal de creación mejorado
  const [selectedSongsForNewPlaylist, setSelectedSongsForNewPlaylist] = useState<Song[]>([]);
  const [searchSongsInModal, setSearchSongsInModal] = useState('');
  const [filteredSongsInModal, setFilteredSongsInModal] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Cargar playlists
  const loadPlaylists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar canciones disponibles con búsqueda
  const loadAvailableSongs = async (search: string = '') => {
    try {
      setLoadingSongs(true);
      const token = localStorage.getItem('token');
      const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/api/songs/for-playlist`);
      if (search.trim()) {
        url.searchParams.append('search', search.trim());
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFilteredSongsInModal(data);
      }
    } catch (error) {
      console.error('Error loading available songs:', error);
    } finally {
      setLoadingSongs(false);
    }
  };

  // Crear nueva playlist
  const createPlaylist = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', newPlaylist.name);
      formData.append('description', newPlaylist.description);
      formData.append('isPublic', newPlaylist.isPublic.toString());
      
      if (newPlaylist.image) {
        formData.append('image', newPlaylist.image);
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const createdPlaylist = await response.json();
        
        // Agregar canciones seleccionadas a la nueva playlist
        if (selectedSongsForNewPlaylist.length > 0) {
          for (const song of selectedSongsForNewPlaylist) {
            try {
              await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${createdPlaylist.id}/songs`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ songId: song.id })
              });
            } catch (error) {
              console.error('Error adding song to playlist:', error);
            }
          }
        }

        setShowCreateModal(false);
        setNewPlaylist({ name: '', description: '', isPublic: false, image: null });
        setSelectedSongsForNewPlaylist([]);
        setSearchSongsInModal('');
        loadPlaylists();
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  // Funciones para el modal de creación mejorado
  const addSongToNewPlaylist = (song: Song) => {
    if (!selectedSongsForNewPlaylist.find(s => s.id === song.id)) {
      setSelectedSongsForNewPlaylist([...selectedSongsForNewPlaylist, song]);
    }
  };

  const removeSongFromNewPlaylist = (songId: string) => {
    setSelectedSongsForNewPlaylist(selectedSongsForNewPlaylist.filter(s => s.id !== songId));
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    loadAvailableSongs(); // Cargar canciones sin filtro inicial
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewPlaylist({ name: '', description: '', isPublic: false, image: null });
    setSelectedSongsForNewPlaylist([]);
    setSearchSongsInModal('');
    setFilteredSongsInModal([]);
    
    // Limpiar timeout si existe
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  };

  // Filtrar canciones en el modal según la búsqueda (con debounce)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const filterSongsInModal = (searchTerm: string) => {
    setSearchSongsInModal(searchTerm);
    
    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Crear nuevo timeout para debounce más rápido
    const timeout = setTimeout(() => {
      loadAvailableSongs(searchTerm);
    }, 200); // 200ms de debounce para respuesta más rápida
    
    setSearchTimeout(timeout);
  };

  // Agregar canción a playlist
  const addSongToPlaylist = async (playlistId: string, songId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ songId })
      });

      if (response.ok) {
        // Recargar la playlist específica si está seleccionada
        if (selectedPlaylist?.id === playlistId) {
          loadPlaylistDetails(playlistId);
        }
        loadPlaylists();
      }
    } catch (error) {
      console.error('Error adding song to playlist:', error);
    }
  };

  // Eliminar canción de playlist
  const removeSongFromPlaylist = async (playlistId: string, playlistItemId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistId}/songs/${playlistItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Recargar la playlist específica si está seleccionada
        if (selectedPlaylist?.id === playlistId) {
          loadPlaylistDetails(playlistId);
        }
        loadPlaylists();
      }
    } catch (error) {
      console.error('Error removing song from playlist:', error);
    }
  };

  // Cargar detalles de playlist
  const loadPlaylistDetails = async (playlistId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedPlaylist(data);
      }
    } catch (error) {
      console.error('Error loading playlist details:', error);
    }
  };

  // Formatear duración
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Función para reproducir playlist completa
  const handlePlayPlaylist = async (playlist: Playlist) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlist.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const playlistItems = data.items || [];
        
        if (playlistItems.length > 0) {
          // Convertir items de playlist a objetos Song
          const songs = playlistItems.map((item: any) => item.song);
          
          console.log(`🎵 Reproduciendo playlist: ${playlist.name} con ${songs.length} canciones`);
          
          // Usar replaceQueueAndPlay para configurar la cola
          replaceQueueAndPlay(songs, 0);
          
          // Inmediatamente reproducir la primera canción
          const firstSong = songs[0];
          console.log('🔍 DEBUG firstSong:', firstSong);
          console.log('🔍 DEBUG folderName:', firstSong.folderName);
          console.log('🔍 DEBUG fileName:', firstSong.fileName);
          
          const songUrl = getSongFileUrl(firstSong.folderName, firstSong.fileName);
          console.log('🔍 DEBUG songUrl generada:', songUrl);
          
          console.log('🎵 ¡INICIANDO REPRODUCCIÓN INMEDIATA!:', { 
            song: firstSong.title,
            voiceType: firstSong.voiceType,
            url: songUrl
          });
          
          // Reproducir inmediatamente con el formato correcto
          playSong({
            id: firstSong.id,
            title: firstSong.title,
            artist: firstSong.artist || 'Desconocido',
            url: songUrl,
            duration: firstSong.duration || 0
          });
        }
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  };

  // Función para abrir modal de gestión
  const openManageModal = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    loadPlaylistDetails(playlist.id);
    setShowSongManager(true);
  };

  // Función para abrir modal de edición
  const openEditModal = (playlist: Playlist) => {
    setNewPlaylist({
      name: playlist.name,
      description: playlist.description || '',
      isPublic: playlist.isPublic,
      image: null
    });
    setSelectedPlaylist(playlist);
    setShowCreateModal(true);
  };

  // Función para eliminar playlist
  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta playlist?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        loadPlaylists();
        console.log('Playlist eliminada exitosamente');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  // Función de búsqueda con debounce
  const searchPlaylists = async () => {
    if (!searchTerm && !creatorFilter) {
      loadPlaylists();
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('q', searchTerm);
      if (creatorFilter) params.append('creator', creatorFilter);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Error searching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
    loadAvailableSongs();
  }, []);

  // Effect para búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlaylists();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, creatorFilter]);

  // Effect para filtrar canciones en el modal
  useEffect(() => {
    filterSongsInModal(searchSongsInModal);
  }, [searchSongsInModal]);

  // Cleanup del timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 lg:py-8">{/* Expandido para usar todo el ancho */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listas de Reproducción</h1>
          <p className="text-gray-600 mt-1">Gestiona y reproduce tus playlists personalizadas</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nueva Playlist</span>
        </button>
      </div>

      {/* Filtros mejorados */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative group">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre de playlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200"
            />
          </div>
          
          <div className="relative group">
            <UserIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por creador..."
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Lista de playlists mejorada - Diseño cuadrado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {playlists.map((playlist) => (
          <div 
            key={playlist.id} 
            className="group bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Imagen de playlist cuadrada y centrada */}
            <div className="relative aspect-square bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
              {playlist.imageUrl ? (
                <img 
                  src={`${import.meta.env.VITE_API_BASE_URL}${playlist.imageUrl}`}
                  alt={playlist.name}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                  <MusicalNoteIcon className="w-20 h-20 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              
              {/* Overlay con gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Indicadores de estado */}
              <div className="absolute top-4 right-4 flex space-x-2">
                {playlist.isPublic ? (
                  <div className="bg-green-500/90 p-2 rounded-full backdrop-blur-sm">
                    <EyeIcon className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="bg-gray-500/90 p-2 rounded-full backdrop-blur-sm">
                    <LockClosedIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Botones de acción mejorados */}
              <div className="absolute bottom-4 right-4 flex space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <button 
                  onClick={() => handlePlayPlaylist(playlist)}
                  className="bg-green-500 hover:bg-green-600 p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
                  title="Reproducir playlist completa"
                >
                  <PlayIcon className="w-6 h-6 text-white" />
                </button>
                <button 
                  onClick={() => openManageModal(playlist)}
                  className="bg-blue-500 hover:bg-blue-600 p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
                  title="Gestionar playlist"
                >
                  <Cog6ToothIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Información de playlist mejorada */}
            <div className="p-6">
              <h3 className="font-bold text-xl text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">
                {playlist.name}
              </h3>
              
              {playlist.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {playlist.description}
                </p>
              )}

              {/* Estadísticas mejoradas */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <MusicalNoteIcon className="w-4 h-4" />
                    <span className="font-medium">{playlist.totalSongs}</span>
                    <span>canciones</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatDuration(playlist.totalDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Información del creador y acciones */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Por:</span> {playlist.user.firstName} {playlist.user.lastName}
                </div>
                
                {playlist.user.id === user?.id && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEditModal(playlist)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Editar playlist"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Eliminar playlist"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de crear playlist mejorado */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="flex h-full">
              {/* Panel izquierdo - Información de la playlist mejorado */}
              <div className="w-1/2 p-8 border-r border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">{selectedPlaylist ? 'Editar Playlist' : 'Nueva Playlist'}</h2>
                  <button 
                    onClick={closeCreateModal}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Nombre de la playlist *
                    </label>
                    <input
                      type="text"
                      value={newPlaylist.name}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all"
                      placeholder="Ej: Mi playlist favorita"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={newPlaylist.description}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all resize-none"
                      rows={4}
                      placeholder="Describe tu playlist..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Imagen de portada (opcional)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, image: e.target.files?.[0] || null })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center bg-blue-50 p-4 rounded-xl">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newPlaylist.isPublic}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, isPublic: e.target.checked })}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-3 block text-sm font-medium text-gray-700">
                      Hacer playlist pública (otros usuarios podrán verla)
                    </label>
                  </div>
                </div>

                {/* Canciones seleccionadas mejoradas */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MusicalNoteIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Canciones seleccionadas ({selectedSongsForNewPlaylist.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-inner">
                    {selectedSongsForNewPlaylist.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <MusicalNoteIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No hay canciones seleccionadas</p>
                        <p className="text-xs">Selecciona canciones del panel derecho</p>
                      </div>
                    ) : (
                      <div className="space-y-1 p-3">
                        {selectedSongsForNewPlaylist.map((song) => (
                          <div key={song.id} className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{song.title}</p>
                            </div>
                            <button
                              onClick={() => removeSongFromNewPlaylist(song.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all ml-2"
                              title="Eliminar canción"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción mejorados */}
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={closeCreateModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createPlaylist}
                    disabled={!newPlaylist.name.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {selectedPlaylist ? 'Actualizar Playlist' : 'Crear Playlist'}
                  </button>
                </div>
              </div>

              {/* Panel derecho - Canciones disponibles mejorado */}
              <div className="w-1/2 p-8 bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <MusicalNoteIcon className="w-6 h-6 mr-2 text-blue-600" />
                    Canciones disponibles
                  </h3>
                  <div className="relative w-72">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar canciones por título o artista..."
                      value={searchSongsInModal}
                      onChange={(e) => filterSongsInModal(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                </div>

                <div className="h-[500px] overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-inner">
                  {loadingSongs ? (
                    <div className="p-12 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-sm font-medium">Buscando canciones...</p>
                      <p className="text-xs text-gray-400">Por favor espera</p>
                    </div>
                  ) : filteredSongsInModal.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <MusicalNoteIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm font-medium">
                        {searchSongsInModal ? 'No se encontraron canciones' : 'No hay canciones disponibles'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {searchSongsInModal ? 'Intenta con otros términos de búsqueda' : 'Las canciones se filtran por tu tipo de voz'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-3">
                      {filteredSongsInModal.map((song) => {
                        const isSelected = selectedSongsForNewPlaylist.some(s => s.id === song.id);
                        return (
                          <div key={song.id} className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200' 
                              : 'bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 border border-gray-100 hover:border-blue-200'
                          }`}>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{song.title}</p>
                            </div>
                            <button
                              onClick={() => isSelected ? removeSongFromNewPlaylist(song.id) : addSongToNewPlaylist(song)}
                              className={`p-2 rounded-lg transition-all duration-200 ml-2 ${
                                isSelected 
                                  ? 'text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                  : 'text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                              }`}
                              title={isSelected ? 'Eliminar de la playlist' : 'Agregar a la playlist'}
                            >
                              {isSelected ? (
                                <TrashIcon className="w-4 h-4" />
                              ) : (
                                <PlusIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-6 text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">💡</div>
                    <div>
                      <p className="font-medium text-blue-800 mb-1">Tip:</p>
                      <p className="text-blue-700">Las canciones se filtran automáticamente según tu tipo de voz asignado. Solo verás canciones que puedes cantar.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gestor de canciones de playlist mejorado */}
      {showSongManager && selectedPlaylist && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Header mejorado con opciones de edición */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <MusicalNoteIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPlaylist?.name}</h2>
                    <p className="text-blue-100">{selectedPlaylist?.totalSongs} canciones • {selectedPlaylist?.totalDuration ? formatDuration(selectedPlaylist.totalDuration) : '0m'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Botón para editar información de playlist */}
                  <button
                    onClick={() => {
                      setNewPlaylist({
                        name: selectedPlaylist.name,
                        description: selectedPlaylist.description || '',
                        isPublic: selectedPlaylist.isPublic,
                        image: null
                      });
                      setShowSongManager(false);
                      setShowCreateModal(true);
                    }}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                    title="Editar información de playlist"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  {/* Botón para eliminar playlist */}
                  <button
                    onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                    className="bg-red-500/80 hover:bg-red-500 p-2 rounded-lg transition-all"
                    title="Eliminar playlist"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowSongManager(false)}
                    className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Canciones en la playlist mejoradas */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-xl font-semibold text-green-900 mb-6 flex items-center">
                    <MusicalNoteIcon className="w-6 h-6 mr-3 text-green-600" />
                    Canciones en la playlist ({selectedPlaylist.items?.length || 0})
                  </h3>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {selectedPlaylist.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm border border-green-100 hover:shadow-md transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.song.title}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.song.duration ? formatDuration(item.song.duration) : '--:--'}
                          </div>
                          <button
                            onClick={() => removeSongFromPlaylist(selectedPlaylist.id, item.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-all"
                            title="Eliminar de playlist"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )) || []}
                    {(!selectedPlaylist.items || selectedPlaylist.items.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <MusicalNoteIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No hay canciones en esta playlist</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Canciones disponibles mejoradas con buscador */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-blue-900 flex items-center">
                      <PlusIcon className="w-6 h-6 mr-3 text-blue-600" />
                      Canciones disponibles
                    </h3>
                  </div>
                  
                  {/* Buscador en el gestor */}
                  <div className="relative mb-4">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar canciones..."
                      value={searchSongsInModal}
                      onChange={(e) => filterSongsInModal(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    />
                  </div>
                  
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {loadingSongs ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                        <p className="text-sm">Cargando canciones...</p>
                      </div>
                    ) : filteredSongsInModal.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MusicalNoteIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">
                          {searchSongsInModal ? 'No se encontraron canciones' : 'No hay canciones disponibles'}
                        </p>
                      </div>
                    ) : (
                      filteredSongsInModal.filter(song => 
                        !selectedPlaylist.items?.some(item => item.song.id === song.id)
                      ).map((song) => {
                        return (
                          <div key={song.id} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{song.title}</p>
                            </div>
                            <button
                              onClick={() => selectedPlaylist && addSongToPlaylist(selectedPlaylist.id, song.id)}
                              className="px-3 py-1 rounded-lg text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all ml-2"
                            >
                              Agregar
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío mejorado */}
      {playlists.length === 0 && (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
              <MusicalNoteIcon className="w-20 h-20 text-blue-500 mx-auto mb-4" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No hay playlists</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {searchTerm || creatorFilter 
                ? 'No se encontraron playlists con los filtros aplicados. Intenta con otros términos de búsqueda.' 
                : 'Crea tu primera playlist para comenzar a organizar tu música favorita'
              }
            </p>
            {!searchTerm && !creatorFilter && (
              <button
                onClick={openCreateModal}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Crear mi primera playlist
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
