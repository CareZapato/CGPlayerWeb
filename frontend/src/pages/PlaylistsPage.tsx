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
  TrashIcon
} from '@heroicons/react/24/outline';
import { usePlaylistStore } from '../store/playlistStore';
import { usePlayerStore } from '../store/playerStore';
import { getSongFileUrl } from '../config/api';

interface Song {
  id: string;
  title: string;
  artist: string | null;
  duration: number | null;
  voiceType: string;
  folderName?: string;
  fileName?: string;
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
  const { replaceQueueAndPlay } = usePlaylistStore();
  const { playSong } = usePlayerStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: false,
    image: null as File | null
  });

  // Estado para el modal de creación/edición
  const [selectedSongsForNewPlaylist, setSelectedSongsForNewPlaylist] = useState<Song[]>([]);
  const [searchSongsInModal, setSearchSongsInModal] = useState('');
  const [filteredSongsInModal, setFilteredSongsInModal] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // Crear o actualizar playlist
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

      let response;
      if (selectedPlaylist) {
        // Actualizar playlist existente
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${selectedPlaylist.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // Crear nueva playlist
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      }

      if (response.ok) {
        const playlistData = await response.json();
        
        // Agregar canciones seleccionadas a la nueva playlist (solo para crear)
        if (!selectedPlaylist && selectedSongsForNewPlaylist.length > 0) {
          for (const song of selectedSongsForNewPlaylist) {
            try {
              await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistData.id}/songs`, {
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

        closeCreateModal();
        loadPlaylists();
      }
    } catch (error) {
      console.error('Error creating/updating playlist:', error);
    }
  };

  // Funciones para gestionar canciones en el modal
  const addSongToNewPlaylist = (song: Song) => {
    if (!selectedSongsForNewPlaylist.find(s => s.id === song.id)) {
      setSelectedSongsForNewPlaylist([...selectedSongsForNewPlaylist, song]);
    }
  };

  const removeSongFromNewPlaylist = (songId: string) => {
    setSelectedSongsForNewPlaylist(selectedSongsForNewPlaylist.filter(s => s.id !== songId));
  };

  // Abrir modal para crear
  const openCreateModal = () => {
    setSelectedPlaylist(null);
    setShowCreateModal(true);
    setNewPlaylist({ name: '', description: '', isPublic: false, image: null });
    setSelectedSongsForNewPlaylist([]);
    loadAvailableSongs();
  };

  // Abrir modal para editar
  const openEditModal = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setNewPlaylist({
      name: playlist.name,
      description: playlist.description || '',
      isPublic: playlist.isPublic,
      image: null
    });
    loadPlaylistDetails(playlist.id);
    setShowCreateModal(true);
    loadAvailableSongs();
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewPlaylist({ name: '', description: '', isPublic: false, image: null });
    setSelectedSongsForNewPlaylist([]);
    setSearchSongsInModal('');
    setFilteredSongsInModal([]);
    setSelectedPlaylist(null);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  };

  // Filtrar canciones en el modal con debounce
  const filterSongsInModal = (searchTerm: string) => {
    setSearchSongsInModal(searchTerm);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      loadAvailableSongs(searchTerm);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // Agregar canción a playlist existente
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
        if (selectedPlaylist?.id === playlistId) {
          loadPlaylistDetails(playlistId);
        }
        loadPlaylists();
      }
    } catch (error) {
      console.error('Error removing song from playlist:', error);
    }
  };

  // Cargar detalles de playlist para edición
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
    if (!seconds) return '0:00';
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
          const songs = playlistItems.map((item: any) => item.song);
          
          console.log(`🎵 Reproduciendo playlist: ${playlist.name} con ${songs.length} canciones`);
          
          replaceQueueAndPlay(songs, 0);
          
          const firstSong = songs[0];
          const songUrl = getSongFileUrl(firstSong.folderName, firstSong.fileName);
          
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
        closeCreateModal();
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
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlaylists();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, creatorFilter]);

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
    <div className="w-full max-w-full mx-auto px-4 lg:px-6 py-4 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Listas de Reproducción</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gestiona y reproduce tus playlists personalizadas</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Nueva Playlist</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="relative group">
            <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre de playlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base"
            />
          </div>
          
          <div className="relative group">
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por creador..."
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Lista de playlists - Diseño más compacto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {playlists.map((playlist) => (
          <div 
            key={playlist.id} 
            className="group bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            {/* Imagen de playlist más compacta */}
            <div className="relative aspect-square bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
              {playlist.imageUrl ? (
                <img 
                  src={`${import.meta.env.VITE_API_BASE_URL}${playlist.imageUrl}`}
                  alt={playlist.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                  <MusicalNoteIcon className="w-8 sm:w-12 h-8 sm:h-12 text-white opacity-80" />
                </div>
              )}
              
              {/* Indicadores de estado más pequeños */}
              <div className="absolute top-2 right-2 flex space-x-1">
                {playlist.isPublic ? (
                  <div className="bg-green-500/90 p-1 rounded-full">
                    <EyeIcon className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="bg-gray-500/90 p-1 rounded-full">
                    <LockClosedIcon className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Botones de acción más pequeños */}
              <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button 
                  onClick={() => handlePlayPlaylist(playlist)}
                  className="bg-green-500 hover:bg-green-600 p-1.5 rounded-full shadow-md transition-all transform hover:scale-110"
                  title="Reproducir playlist"
                >
                  <PlayIcon className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={() => openEditModal(playlist)}
                  className="bg-blue-500 hover:bg-blue-600 p-1.5 rounded-full shadow-md transition-all transform hover:scale-110"
                  title="Editar playlist"
                >
                  <PencilIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Información más compacta */}
            <div className="p-3">
              <h3 className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {playlist.name}
              </h3>
              
              {/* Estadísticas compactas */}
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span className="flex items-center">
                  <MusicalNoteIcon className="w-3 h-3 mr-1" />
                  {playlist.totalSongs}
                </span>
                <span className="flex items-center">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  {formatDuration(playlist.totalDuration)}
                </span>
              </div>

              {/* Creador */}
              <div className="text-xs text-gray-600 mt-1 truncate">
                {playlist.user.firstName} {playlist.user.lastName}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal único para crear/editar playlist */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="flex flex-col lg:flex-row h-full max-h-[95vh]">
              
              {/* Panel izquierdo - Buscador de canciones */}
              <div className="w-full lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gradient-to-br from-blue-50 to-white overflow-y-auto max-h-[45vh] lg:max-h-none">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <PlusIcon className="w-6 h-6 mr-3 text-blue-600" />
                  Buscar Canciones
                </h3>
                
                {/* Buscador */}
                <div className="relative mb-6">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar canciones por título o artista..."
                    value={searchSongsInModal}
                    onChange={(e) => filterSongsInModal(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  />
                </div>

                {/* Lista de canciones disponibles */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {loadingSongs ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">Cargando canciones...</p>
                    </div>
                  ) : filteredSongsInModal.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MusicalNoteIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm font-medium">No hay canciones disponibles</p>
                    </div>
                  ) : (
                    filteredSongsInModal
                      .filter(song => selectedPlaylist ? 
                        !selectedPlaylist.items?.some(item => item.song.id === song.id) : 
                        !selectedSongsForNewPlaylist.some(s => s.id === song.id)
                      )
                      .map((song) => (
                        <div key={song.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{song.title}</p>
                            <p className="text-xs text-gray-500 truncate">{song.artist || 'Desconocido'}</p>
                          </div>
                          <button
                            onClick={() => selectedPlaylist ? 
                              addSongToPlaylist(selectedPlaylist.id, song.id) : 
                              addSongToNewPlaylist(song)
                            }
                            className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all ml-3"
                          >
                            Agregar
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Panel derecho - Información de la playlist */}
              <div className="w-full lg:w-1/2 p-6 bg-gradient-to-br from-gray-50 to-white overflow-y-auto max-h-[45vh] lg:max-h-none">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedPlaylist ? 'Editar Playlist' : 'Nueva Playlist'}
                  </h2>
                  <button 
                    onClick={closeCreateModal}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Formulario de información */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Nombre de la playlist *
                    </label>
                    <input
                      type="text"
                      value={newPlaylist.name}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm resize-none"
                      rows={3}
                      placeholder="Describe tu playlist..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Imagen de portada (opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, image: e.target.files?.[0] || null })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newPlaylist.isPublic}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, isPublic: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-3 block text-sm font-medium text-gray-700">
                      Hacer playlist pública
                    </label>
                  </div>
                </div>

                {/* Canciones en la playlist */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MusicalNoteIcon className="w-5 h-5 mr-2 text-green-600" />
                    Canciones en la playlist ({selectedPlaylist ? selectedPlaylist.items?.length || 0 : selectedSongsForNewPlaylist.length})
                  </h3>
                  
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-inner">
                    {selectedPlaylist ? (
                      /* Si está editando, mostrar canciones de la playlist */
                      selectedPlaylist.items && selectedPlaylist.items.length > 0 ? (
                        <div className="space-y-1 p-3">
                          {selectedPlaylist.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{item.song.title}</p>
                              </div>
                              <button
                                onClick={() => removeSongFromPlaylist(selectedPlaylist.id, item.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-all ml-2"
                                title="Eliminar canción"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <MusicalNoteIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">Esta playlist está vacía</p>
                        </div>
                      )
                    ) : (
                      /* Si está creando, mostrar canciones seleccionadas */
                      selectedSongsForNewPlaylist.length > 0 ? (
                        <div className="space-y-1 p-3">
                          {selectedSongsForNewPlaylist.map((song) => (
                            <div key={song.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{song.title}</p>
                              </div>
                              <button
                                onClick={() => removeSongFromNewPlaylist(song.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-all ml-2"
                                title="Eliminar canción"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <MusicalNoteIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No hay canciones seleccionadas</p>
                          <p className="text-xs">Busca y agrega canciones desde la izquierda</p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={closeCreateModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createPlaylist}
                    disabled={!newPlaylist.name.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {selectedPlaylist ? 'Actualizar Playlist' : 'Crear Playlist'}
                  </button>
                  {selectedPlaylist && (
                    <button
                      onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {playlists.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
              <MusicalNoteIcon className="w-20 h-20 text-blue-500 mx-auto mb-4" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No hay playlists</h3>
            <p className="text-gray-600 mb-6 leading-relaxed px-4">
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
