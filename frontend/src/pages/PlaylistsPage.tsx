import React, { useState, useEffect, useCallback } from 'react';
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
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // Estado para el modal de creación/edición
  const [selectedSongsForNewPlaylist, setSelectedSongsForNewPlaylist] = useState<Song[]>([]);
  const [searchSongsInModal, setSearchSongsInModal] = useState('');
  const [filteredSongsInModal, setFilteredSongsInModal] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const [preventModalReopen, setPreventModalReopen] = useState(false);
  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false); // Nueva protección para modo edición
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

  // Actualizar una playlist específica en la lista sin recargar todo
  const updatePlaylistInList = async (playlistId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const updatedPlaylist = await response.json();
        setPlaylists(prevPlaylists => 
          prevPlaylists.map(p => p.id === playlistId ? updatedPlaylist : p)
        );
      }
    } catch (error) {
      console.error('Error updating playlist in list:', error);
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
    if (savingPlaylist) return;
    
    try {
      setSavingPlaylist(true);
      setPreventModalReopen(true);
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', newPlaylist.name);
      formData.append('description', newPlaylist.description);
      formData.append('isPublic', newPlaylist.isPublic.toString());
      
      // Manejar imagen
      if (newPlaylist.image) {
        formData.append('image', newPlaylist.image);
      } else if (selectedPlaylist && !currentImageUrl && selectedPlaylist.imageUrl) {
        formData.append('removeImage', 'true');
      }

      // Agregar canciones para actualización
      if (selectedPlaylist) {
        const songIds = selectedSongsForNewPlaylist.map(song => song.id);
        formData.append('songIds', JSON.stringify(songIds));
      }

      let response;
      if (selectedPlaylist) {
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${selectedPlaylist.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
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

        // Solo cerrar modal si estamos creando, no editando
        if (!selectedPlaylist) {
          closeCreateModal();
        }
        
        // Recargar datos
        setTimeout(async () => {
          if (!selectedPlaylist) {
            await loadPlaylists();
          } else {
            await updatePlaylistInList(selectedPlaylist.id);
            await loadPlaylistDetails(selectedPlaylist.id, true);
            setIsEditingPlaylist(false);
          }
          
          setTimeout(() => {
            setPreventModalReopen(false);
          }, 3000);
        }, 500);
      } else {
        const errorData = await response.json();
        alert(`Error al ${selectedPlaylist ? 'actualizar' : 'crear'} la playlist: ${errorData.error || errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error creating/updating playlist:', error);
      alert(`Error al ${selectedPlaylist ? 'actualizar' : 'crear'} la playlist. Intenta nuevamente.`);
    } finally {
      setSavingPlaylist(false);
    }
  };

  // Funciones para gestionar canciones en el modal
  const addSongToNewPlaylist = (song: Song) => {
    if (!selectedSongsForNewPlaylist.find(s => s.id === song.id)) {
      const updatedSongs = [...selectedSongsForNewPlaylist, song];
      setSelectedSongsForNewPlaylist(updatedSongs);
      
      // Si estamos editando una playlist, también agregar a los items de la playlist
      if (selectedPlaylist && selectedPlaylist.items) {
        const newItem = {
          id: `temp-${Date.now()}-${song.id}`,
          order: selectedPlaylist.items.length,
          song: song
        };
        const updatedPlaylist = {
          ...selectedPlaylist,
          items: [...selectedPlaylist.items, newItem],
          totalSongs: (selectedPlaylist.totalSongs || 0) + 1
        };
        setSelectedPlaylist(updatedPlaylist);
      }
      
      // Refrescar lista de canciones disponibles
      setTimeout(() => {
        loadAvailableSongs(searchSongsInModal);
      }, 100);
    }
  };

  const removeSongFromNewPlaylist = (songId: string) => {
    const updatedSongs = selectedSongsForNewPlaylist.filter(s => s.id !== songId);
    setSelectedSongsForNewPlaylist(updatedSongs);
    
    // Si estamos editando una playlist, también actualizar los items de la playlist
    if (selectedPlaylist && selectedPlaylist.items) {
      const updatedPlaylist = {
        ...selectedPlaylist,
        items: selectedPlaylist.items.filter(item => item.song.id !== songId),
        totalSongs: Math.max((selectedPlaylist.totalSongs || 1) - 1, 0)
      };
      setSelectedPlaylist(updatedPlaylist);
    }
    
    // Refrescar lista de canciones disponibles
    setTimeout(() => {
      loadAvailableSongs(searchSongsInModal);
    }, 100);
  };

  // Abrir modal para crear
  const openCreateModal = () => {
    setSelectedPlaylist(null);
    setShowCreateModal(true);
    setNewPlaylist({ name: '', description: '', isPublic: false, image: null });
    setCurrentImageUrl(null);
    setSelectedSongsForNewPlaylist([]);
    loadAvailableSongs();
  };

  // Abrir modal para editar
  const openEditModal = async (playlist: Playlist) => {
    if (showCreateModal || savingPlaylist || preventModalReopen) {
      return;
    }
    
    setSelectedPlaylist(playlist);
    setIsEditingPlaylist(true);
    setNewPlaylist({
      name: playlist.name,
      description: playlist.description || '',
      isPublic: playlist.isPublic,
      image: null
    });
    setCurrentImageUrl(playlist.imageUrl);
    
    loadAvailableSongs();
    await loadPlaylistDetails(playlist.id, true);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (isEditingPlaylist && selectedPlaylist) {
      return;
    }
    
    resetModalState();
  };

  const forceCloseModal = () => {
    setIsEditingPlaylist(false);
    resetModalState();
  };

  const resetModalState = () => {
    setShowCreateModal(false);
    setNewPlaylist({ name: '', description: '', isPublic: false, image: null });
    setCurrentImageUrl(null);
    setSelectedSongsForNewPlaylist([]);
    setSearchSongsInModal('');
    setFilteredSongsInModal([]);
    setSelectedPlaylist(null);
    setIsEditingPlaylist(false);
    
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

  // Cargar detalles de playlist para edición
  const loadPlaylistDetails = async (playlistId: string, populateSongs: boolean = false) => {
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
        
        if (populateSongs && data.items) {
          const songs = data.items.map((item: PlaylistItem) => item.song);
          setSelectedSongsForNewPlaylist(songs);
          
          setTimeout(() => {
            loadAvailableSongs(searchSongsInModal);
          }, 100);
        }
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
          const songs = playlistItems.map((item: PlaylistItem) => item.song);
          
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
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  // Función de búsqueda con debounce
  const searchPlaylists = useCallback(async () => {
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
  }, [searchTerm, creatorFilter]);

  useEffect(() => {
    loadPlaylists();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlaylists();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, creatorFilter, searchPlaylists]);

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

      {/* Lista de playlists - Diseño responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
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

              {/* Botones de acción - más visibles en móvil */}
              <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 flex space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button 
                  onClick={() => handlePlayPlaylist(playlist)}
                  className="bg-green-500 hover:bg-green-600 p-1 sm:p-1.5 rounded-full shadow-md transition-all transform hover:scale-110"
                  title="Reproducir playlist"
                >
                  <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditModal(playlist);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 p-1 sm:p-1.5 rounded-full shadow-md transition-all transform hover:scale-110"
                  title="Editar playlist"
                >
                  <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Información compacta responsive */}
            <div className="p-2 sm:p-3">
              <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors leading-tight">
                {playlist.name}
              </h3>
              
              {/* Estadísticas compactas */}
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 mt-1">
                <span className="flex items-center">
                  <MusicalNoteIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  {playlist.totalSongs}
                </span>
                <span className="flex items-center">
                  <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  {formatDuration(playlist.totalDuration)}
                </span>
              </div>

              {/* Creador */}
              <div className="text-[10px] sm:text-xs text-gray-600 mt-1 truncate">
                {playlist.user.firstName} {playlist.user.lastName}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal único para crear/editar playlist */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full h-full sm:rounded-2xl sm:w-full sm:max-w-7xl sm:max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="flex flex-col lg:flex-row h-full max-h-full">
              
              {/* Panel izquierdo - Información de la playlist */}
              <div className="w-full lg:w-1/2 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gradient-to-br from-gray-50 to-white flex flex-col overflow-hidden max-h-[50vh] sm:max-h-[45vh] lg:max-h-none">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center">
                    <MusicalNoteIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
                    {selectedPlaylist ? 'Editar Playlist' : 'Nueva Playlist'}
                  </h2>
                  <button 
                    onClick={forceCloseModal}
                    className="text-gray-400 hover:text-gray-600 p-1 sm:p-2 rounded-full hover:bg-gray-100 transition-all lg:hidden"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Formulario de información de la playlist */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                        Nombre de la playlist *
                      </label>
                      <input
                        type="text"
                        value={newPlaylist.name}
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base"
                        placeholder="Mi playlist favorita"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                        Descripción (opcional)
                      </label>
                      <textarea
                        value={newPlaylist.description}
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm resize-none text-sm sm:text-base"
                        rows={2}
                        placeholder="Describe tu playlist..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                        Imagen de portada (opcional)
                      </label>
                      
                      {/* Mostrar imagen actual si existe */}
                      {currentImageUrl && !newPlaylist.image && (
                        <div className="mb-2 sm:mb-3 p-2 sm:p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">Imagen actual:</p>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <img 
                              src={`${import.meta.env.VITE_API_BASE_URL}${currentImageUrl}`}
                              alt="Imagen actual"
                              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => setCurrentImageUrl(null)}
                              className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-md transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Preview de nueva imagen seleccionada */}
                      {newPlaylist.image && (
                        <div className="mb-2 sm:mb-3 p-2 sm:p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">Nueva imagen:</p>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <img 
                              src={URL.createObjectURL(newPlaylist.image)}
                              alt="Nueva imagen"
                              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => setNewPlaylist({ ...newPlaylist, image: null })}
                              className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-md transition-colors"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, image: e.target.files?.[0] || null })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-xs sm:text-base"
                      />
                      
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">
                        Máximo 5MB
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={newPlaylist.isPublic}
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, isPublic: e.target.checked })}
                        className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPublic" className="ml-2 sm:ml-3 block text-xs sm:text-sm font-medium text-gray-700">
                        Hacer playlist pública
                      </label>
                    </div>
                  </div>
                  
                  {/* Canciones en la playlist */}
                  <div className="mt-4 sm:mt-6">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <MusicalNoteIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-green-600" />
                      Canciones en la Playlist ({selectedSongsForNewPlaylist.length})
                    </h4>
                    
                    <div className="max-h-32 sm:max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-inner">
                      {selectedSongsForNewPlaylist.length > 0 ? (
                        <div className="space-y-1 p-2 sm:p-3">
                          {selectedSongsForNewPlaylist.map((song) => (
                            <div key={song.id} className="flex items-center justify-between p-1.5 sm:p-2 bg-green-50 rounded-md border border-green-200">
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{song.title}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{song.artist || 'Desconocido'}</p>
                              </div>
                              <button
                                onClick={() => removeSongFromNewPlaylist(song.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-all flex-shrink-0"
                                title="Eliminar canción"
                              >
                                <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 sm:p-4 text-center text-gray-500">
                          <MusicalNoteIcon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-xs sm:text-sm">{selectedPlaylist ? 'Esta playlist está vacía' : 'No hay canciones seleccionadas'}</p>
                          <p className="text-[10px] sm:text-xs">Las canciones aparecerán aquí cuando las agregues</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción - Solo móvil */}
                  <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-gray-200 lg:hidden">
                    <button
                      onClick={createPlaylist}
                      disabled={!newPlaylist.name.trim() || savingPlaylist}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:shadow-none text-sm"
                    >
                      {savingPlaylist ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </span>
                      ) : (
                        selectedPlaylist ? 'Actualizar' : 'Crear Playlist'
                      )}
                    </button>
                    
                    <button
                      onClick={forceCloseModal}
                      className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium text-sm"
                    >
                      Cancelar
                    </button>
                    
                    {selectedPlaylist && (
                      <button
                        onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel derecho - Buscador de canciones */}
              <div className="w-full lg:w-1/2 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white flex flex-col overflow-hidden max-h-[50vh] sm:max-h-[55vh] lg:max-h-none">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                    <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
                    Buscar Canciones
                  </h3>
                  <button 
                    onClick={forceCloseModal}
                    className="text-gray-400 hover:text-gray-600 p-1 sm:p-2 rounded-full hover:bg-gray-100 transition-all hidden lg:block"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Buscador */}
                <div className="relative mb-4 sm:mb-6">
                  <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar canciones..."
                    value={searchSongsInModal}
                    onChange={(e) => filterSongsInModal(e.target.value)}
                    className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm sm:text-base"
                  />
                </div>

                {/* Lista de canciones disponibles */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-1 sm:space-y-2 mb-4">
                    {loadingSongs ? (
                      <div className="text-center py-6 sm:py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                        <p className="text-xs sm:text-sm text-gray-600">Cargando canciones...</p>
                      </div>
                    ) : filteredSongsInModal.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <MusicalNoteIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                        <p className="text-xs sm:text-sm font-medium">No hay canciones disponibles</p>
                      </div>
                    ) : (
                      filteredSongsInModal
                        .filter(song => !selectedSongsForNewPlaylist.some(s => s.id === song.id))
                        .map((song) => (
                          <div key={song.id} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{song.title}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 truncate">{song.artist || 'Desconocido'}</p>
                            </div>
                            <button
                              onClick={() => addSongToNewPlaylist(song)}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all font-medium min-w-0 flex-shrink-0"
                            >
                              +
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                  
                  {/* Canciones seleccionadas */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <MusicalNoteIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-green-600" />
                      Canciones Seleccionadas ({selectedSongsForNewPlaylist.length})
                    </h4>
                    
                    <div className="max-h-32 sm:max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-inner">
                      {selectedSongsForNewPlaylist.length > 0 ? (
                        <div className="space-y-1 p-2 sm:p-3">
                          {selectedSongsForNewPlaylist.map((song) => (
                            <div key={song.id} className="flex items-center justify-between p-1.5 sm:p-2 bg-green-50 rounded-md sm:rounded-lg border border-green-200">
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{song.title}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{song.artist || 'Desconocido'}</p>
                              </div>
                              <button
                                onClick={() => removeSongFromNewPlaylist(song.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-all flex-shrink-0"
                                title="Eliminar canción"
                              >
                                <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 sm:p-6 text-center text-gray-500">
                          <MusicalNoteIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                          <p className="text-xs sm:text-sm">No hay canciones seleccionadas</p>
                          <p className="text-[10px] sm:text-xs">Busca y agrega canciones arriba</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción - Solo Desktop */}
                <div className="hidden lg:flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                  {selectedPlaylist && (
                    <button
                      onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl mr-auto"
                    >
                      Eliminar
                    </button>
                  )}
                  <button
                    onClick={forceCloseModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createPlaylist}
                    disabled={!newPlaylist.name.trim() || savingPlaylist}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {savingPlaylist ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </span>
                    ) : (
                      selectedPlaylist ? 'Actualizar' : 'Crear Playlist'
                    )}
                  </button>
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

      {/* Botón flotante para crear playlist (solo móvil) */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-20 right-4 sm:hidden bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default PlaylistsPage;
