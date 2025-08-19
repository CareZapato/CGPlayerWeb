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
import { useAuthStore } from '../store/authStore';

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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
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
      const response = await fetch('http://localhost:3001/api/playlists', {
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
      const url = new URL('http://localhost:3001/api/songs/for-playlist');
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
        setAvailableSongs(data);
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

      const response = await fetch('http://localhost:3001/api/playlists', {
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
              await fetch(`http://localhost:3001/api/playlists/${createdPlaylist.id}/songs`, {
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
      const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}/songs`, {
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

  // Cargar detalles de playlist
  const loadPlaylistDetails = async (playlistId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/playlists/${playlistId}`, {
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

      const response = await fetch(`http://localhost:3001/api/playlists/search?${params}`, {
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
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listas de Reproducción</h1>
          <p className="text-gray-600">Gestiona y crea tus playlists personalizadas</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nueva Playlist</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de playlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <UserIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por creador..."
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Lista de playlists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist) => (
          <div 
            key={playlist.id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Imagen de playlist */}
            <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
              {playlist.imageUrl ? (
                <img 
                  src={playlist.imageUrl} 
                  alt={playlist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MusicalNoteIcon className="w-16 h-16 text-white opacity-50" />
                </div>
              )}
              
              {/* Botones de acción */}
              <div className="absolute top-4 right-4 flex space-x-2">
                {playlist.isPublic ? (
                  <div className="bg-green-500 p-2 rounded-full">
                    <EyeIcon className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="bg-gray-500 p-2 rounded-full">
                    <LockClosedIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Botón de reproducir */}
              <div className="absolute bottom-4 right-4">
                <button 
                  onClick={() => {
                    loadPlaylistDetails(playlist.id);
                    setShowSongManager(true);
                  }}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 p-3 rounded-full shadow-lg transition-all"
                >
                  <PlayIcon className="w-6 h-6 text-gray-800" />
                </button>
              </div>
            </div>

            {/* Información de playlist */}
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{playlist.name}</h3>
              
              {playlist.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{playlist.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <MusicalNoteIcon className="w-4 h-4" />
                  <span>{playlist.totalSongs} canciones</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatDuration(playlist.totalDuration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Por: {playlist.user.firstName} {playlist.user.lastName}
                </div>
                
                {playlist.user.id === user?.id && (
                  <div className="flex space-x-2">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-600 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de crear playlist */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              {/* Panel izquierdo - Información de la playlist */}
              <div className="w-1/2 p-6 border-r border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Nueva Playlist</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la playlist *
                    </label>
                    <input
                      type="text"
                      value={newPlaylist.name}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Mi playlist favorita"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={newPlaylist.description}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Describe tu playlist..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagen (opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, image: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                      Hacer playlist pública
                    </label>
                  </div>
                </div>

                {/* Canciones seleccionadas */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Canciones seleccionadas ({selectedSongsForNewPlaylist.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {selectedSongsForNewPlaylist.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <MusicalNoteIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No hay canciones seleccionadas</p>
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {selectedSongsForNewPlaylist.map((song) => (
                          <div key={song.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{song.title}</p>
                              <p className="text-xs text-gray-600">{song.artist} • {song.voiceType}</p>
                            </div>
                            <button
                              onClick={() => removeSongFromNewPlaylist(song.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded"
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

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeCreateModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createPlaylist}
                    disabled={!newPlaylist.name.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    Crear Playlist
                  </button>
                </div>
              </div>

              {/* Panel derecho - Canciones disponibles */}
              <div className="w-1/2 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Canciones disponibles
                  </h3>
                  <div className="relative w-64">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar canciones..."
                      value={searchSongsInModal}
                      onChange={(e) => filterSongsInModal(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {loadingSongs ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                      <p className="text-sm">Buscando canciones...</p>
                    </div>
                  ) : filteredSongsInModal.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MusicalNoteIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">
                        {searchSongsInModal ? 'No se encontraron canciones' : 'No hay canciones disponibles para tu tipo de voz'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredSongsInModal.map((song) => {
                        const isSelected = selectedSongsForNewPlaylist.some(s => s.id === song.id);
                        return (
                          <div key={song.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            isSelected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                          }`}>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{song.title}</p>
                              <p className="text-xs text-gray-600">{song.artist} • {song.voiceType}</p>
                              <p className="text-xs text-gray-500">
                                por {song.uploader.firstName} {song.uploader.lastName}
                              </p>
                            </div>
                            <button
                              onClick={() => isSelected ? removeSongFromNewPlaylist(song.id) : addSongToNewPlaylist(song)}
                              className={`p-2 rounded-lg transition-colors ${
                                isSelected 
                                  ? 'text-green-600 bg-green-100 hover:bg-green-200'
                                  : 'text-blue-600 bg-blue-100 hover:bg-blue-200'
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

                <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-800 mb-1">💡 Tip:</p>
                  <p>Las canciones se filtran automáticamente según tu tipo de voz asignado. Solo verás canciones que puedes cantar.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gestor de canciones de playlist */}
      {showSongManager && selectedPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPlaylist?.name}</h2>
                <p className="text-gray-600">{selectedPlaylist?.totalSongs} canciones • {selectedPlaylist?.totalDuration ? formatDuration(selectedPlaylist.totalDuration) : '0m'}</p>
              </div>
              <button
                onClick={() => setShowSongManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Canciones en la playlist */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Canciones en la playlist</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedPlaylist.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.song.title}</p>
                        <p className="text-sm text-gray-600">{item.song.artist} • {item.song.voiceType}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.song.duration ? formatDuration(item.song.duration) : '--:--'}
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>

              {/* Canciones disponibles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Canciones disponibles</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableSongs.map((song) => (
                    <div key={song.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{song.title}</p>
                        <p className="text-sm text-gray-600">{song.artist} • {song.voiceType}</p>
                      </div>
                      <button
                        onClick={() => selectedPlaylist && addSongToPlaylist(selectedPlaylist.id, song.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {playlists.length === 0 && (
        <div className="text-center py-12">
          <MusicalNoteIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay playlists</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || creatorFilter 
              ? 'No se encontraron playlists con los filtros aplicados' 
              : 'Crea tu primera playlist para comenzar'
            }
          </p>
          {!searchTerm && !creatorFilter && (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Crear mi primera playlist
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
