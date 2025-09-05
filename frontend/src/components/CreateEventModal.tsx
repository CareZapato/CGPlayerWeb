import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  Music,
  CheckCircle,
  AlertCircle,
  Search,
  UserCheck,
  MapPin,
  Eye,
  EyeOff,
  Globe,
  UserPlus,
  Trash2,
  Plus,
  Trash,
  Check,
  Play,
  Pause
} from 'lucide-react';
import { getApiUrl } from '../config/api';

// Lista de ciudades de Chile
const CHILE_CITIES = [
  'Arica', 'Iquique', 'Antofagasta', 'Calama', 'Copiapó', 'La Serena', 'Coquimbo', 
  'Valparaíso', 'Viña del Mar', 'Santiago', 'Rancagua', 'Talca', 'Concepción', 
  'Talcahuano', 'Chillán', 'Los Ángeles', 'Temuco', 'Valdivia', 'Osorno', 
  'Puerto Montt', 'Castro', 'Coyhaique', 'Puerto Natales', 'Punta Arenas',
  'Puente Alto', 'Maipú', 'La Florida', 'Las Condes', 'Providencia', 'Ñuñoa',
  'San Bernardo', 'Peñalolén', 'La Pintana', 'El Bosque', 'Quilicura',
  'Villa Alemana', 'Quilpué', 'San Antonio', 'Quillota', 'Los Andes',
  'Melipilla', 'Talagante', 'Buin', 'Paine', 'Curacaví',
  'Linares', 'Cauquenes', 'Parral', 'San Javier', 'Constitución',
  'Chiguayante', 'San Pedro de la Paz', 'Hualpén', 'Coronel', 'Lota',
  'Angol', 'Villarrica', 'Pucón', 'Lautaro', 'Nueva Imperial',
  'La Unión', 'Río Bueno', 'Panguipulli', 'Los Lagos', 'Máfil',
  'Puerto Varas', 'Frutillar', 'Llanquihue', 'Ancud', 'Quellón'
];

interface Singer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assignedRoles: Array<{ role: string }>;
  location: {
    id: string;
    name: string;
    city: string;
  };
  isActive: boolean;
}

interface SingerLocation {
  id: string;
  name: string;
  city: string;
  singersCount: number;
}

interface SelectedAttendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  location: string;
  addedBy: 'individual' | 'group';
  groupName?: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  voiceType?: string;
  filePath: string;
  parentSongId?: string;
  uploader: {
    firstName: string;
    lastName: string;
  };
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  user: {
    firstName: string;
    lastName: string;
  };
  _count: {
    items: number;
  };
}

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: (event: any) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onEventCreated }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'attendees' | 'music'>('basic');
  
  // Basic info state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('Culto');
  const [eventCity, setEventCity] = useState('');
  const [eventAddress, setEventAddress] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [allowExternalJoin, setAllowExternalJoin] = useState(false);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attendees state
  const [singers, setSingers] = useState<Singer[]>([]);
  const [singerLocations, setSingerLocations] = useState<SingerLocation[]>([]);
  const [singerSearchTerm, setSingerSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loadingSingers, setLoadingSingers] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<SelectedAttendee[]>([]);
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [locationToAdd, setLocationToAdd] = useState<SingerLocation | null>(null);

  // Music state
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songSearchTerm, setSongSearchTerm] = useState('');
  const [playlistSearchTerm, setPlaylistSearchTerm] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [variationsInfo, setVariationsInfo] = useState<Record<string, {total: number, selected: number, isComplete: boolean}>>({});
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [currentPlayingSongId, setCurrentPlayingSongId] = useState<string | null>(null);

  // Filter cities for dropdown
  const filteredCities = CHILE_CITIES.filter(city =>
    city.toLowerCase().includes(citySearchTerm.toLowerCase())
  ).slice(0, 10);

  // Load singers and locations with authentication
  const loadSingerLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/events/locations/singers'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setSingerLocations(result.data || []);
      }
    } catch (error) {
      console.error('Error loading singer locations:', error);
    }
  };

  const searchSingers = async () => {
    setLoadingSingers(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (singerSearchTerm) params.append('query', singerSearchTerm);
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (selectedRole) params.append('role', selectedRole);

      const response = await fetch(getApiUrl(`/events/search/singers?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setSingers(result.data || []);
      }
    } catch (error) {
      console.error('Error searching singers:', error);
    }
    setLoadingSingers(false);
  };

  // Load songs for music tab
  const loadSongs = async () => {
    setLoadingSongs(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (songSearchTerm) params.append('query', songSearchTerm);

      const response = await fetch(getApiUrl(`/songs?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Songs response:', result); // Debug log
        // Mostrar solo canciones padre (sin voiceType) para selección
        const allSongs = result.songs || result.data || result || [];
        const parentSongs = allSongs.filter((song: Song) => !song.voiceType && !song.parentSongId);
        console.log('Parent songs filtered:', parentSongs); // Debug log
        setSongs(parentSongs);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    }
    setLoadingSongs(false);
  };

  // Load playlists for music tab
  const loadPlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (playlistSearchTerm) params.append('query', playlistSearchTerm);

      const response = await fetch(getApiUrl(`/playlists?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setPlaylists(result.data || []);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
    setLoadingPlaylists(false);
  };

  // Add individual singer to attendees list
  const addSingerToAttendees = (singer: Singer) => {
    const isAlreadyAdded = selectedAttendees.some(attendee => attendee.id === singer.id);
    if (isAlreadyAdded) return;

    const newAttendee: SelectedAttendee = {
      id: singer.id,
      firstName: singer.firstName,
      lastName: singer.lastName,
      email: singer.email,
      role: singer.assignedRoles[0]?.role || 'CANTANTE',
      location: `${singer.location.name}, ${singer.location.city}`,
      addedBy: 'individual'
    };

    setSelectedAttendees(prev => [...prev, newAttendee]);
  };

  // Show location confirmation modal
  const showLocationConfirmation = (locationId: string) => {
    const locationData = singerLocations.find(loc => loc.id === locationId);
    if (!locationData) return;
    
    setLocationToAdd(locationData);
    setShowLocationConfirm(true);
  };

  // Add entire choir/location group to attendees
  const addLocationGroupToAttendees = () => {
    if (!locationToAdd) return;

    const locationSingers = singers.filter(s => s.location.id === locationToAdd.id);
    const newAttendees: SelectedAttendee[] = [];

    locationSingers.forEach(singer => {
      const isAlreadyAdded = selectedAttendees.some(attendee => attendee.id === singer.id);
      if (!isAlreadyAdded) {
        newAttendees.push({
          id: singer.id,
          firstName: singer.firstName,
          lastName: singer.lastName,
          email: singer.email,
          role: singer.assignedRoles[0]?.role || 'CANTANTE',
          location: `${singer.location.name}, ${singer.location.city}`,
          addedBy: 'group',
          groupName: locationToAdd.name
        });
      }
    });

    setSelectedAttendees(prev => [...prev, ...newAttendees]);
    setShowLocationConfirm(false);
    setLocationToAdd(null);
  };

  // Add all singers from all locations
  const addAllSingersToEvent = async () => {
    try {
      // Primero obtener todos los cantantes sin filtros
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/events/search/singers?limit=1000'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const allSingers = result.data || [];
        
        const newAttendees: SelectedAttendee[] = [];
        
        allSingers.forEach((singer: Singer) => {
          const isAlreadyAdded = selectedAttendees.some(attendee => attendee.id === singer.id);
          if (!isAlreadyAdded) {
            newAttendees.push({
              id: singer.id,
              firstName: singer.firstName,
              lastName: singer.lastName,
              email: singer.email,
              role: singer.assignedRoles[0]?.role || 'CANTANTE',
              location: `${singer.location.name}, ${singer.location.city}`,
              addedBy: 'group',
              groupName: 'Todos los Coristas'
            });
          }
        });
        
        setSelectedAttendees(prev => [...prev, ...newAttendees]);
      }
    } catch (error) {
      console.error('Error adding all singers:', error);
    }
  };

  // Remove attendee from list
  const removeAttendee = (attendeeId: string) => {
    setSelectedAttendees(prev => prev.filter(attendee => attendee.id !== attendeeId));
  };

  // Clear all attendees
  const clearAllAttendees = () => {
    setSelectedAttendees([]);
  };

  // Add song to event playlist - for parent songs, add all variations
  const addSongToEvent = async (song: Song) => {
    try {
      const token = localStorage.getItem('token');
      
      // If it's a parent song (no voiceType), get all its variations
      if (!song.voiceType && !song.parentSongId) {
        console.log('Adding parent song:', song.title, '- Fetching variations...');
        const response = await fetch(getApiUrl(`/songs/${song.id}/versions`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Raw variations response:', result);
          
          // Manejar diferentes estructuras de respuesta del backend
          let variations = [];
          if (Array.isArray(result)) {
            variations = result;
          } else if (result.versions && Array.isArray(result.versions)) {
            variations = result.versions;
          } else if (result.data && Array.isArray(result.data)) {
            variations = result.data;
          } else if (result.songs && Array.isArray(result.songs)) {
            variations = result.songs;
          } else if (result.variations && Array.isArray(result.variations)) {
            variations = result.variations;
          } else {
            console.warn('Unexpected response structure:', result);
            variations = [];
          }
          
          console.log('Extracted variations array:', variations);
          
          // SOLO agregar variaciones que tienen voiceType (no elementos padre) y que no estén ya seleccionadas
          const validVariations = variations.filter((variation: Song) => {
            const hasVoiceType = variation.voiceType && variation.voiceType !== null;
            const notAlreadySelected = !selectedSongs.some(s => s.id === variation.id);
            const isNotParent = variation.parentSongId !== null; // Las variaciones tienen parentSongId
            console.log(`Variation ${variation.title}: voiceType=${variation.voiceType}, hasVoiceType=${hasVoiceType}, notAlreadySelected=${notAlreadySelected}, isNotParent=${isNotParent}`);
            return hasVoiceType && notAlreadySelected && isNotParent;
          });
          
          console.log('Valid variations to add:', validVariations);
          
          if (validVariations.length > 0) {
            setSelectedSongs(prev => [...prev, ...validVariations]);
            console.log(`Added ${validVariations.length} variations to playlist`);
          } else {
            console.warn('No se encontraron nuevas variaciones para esta canción. Total variations:', variations.length);
          }
        } else {
          console.error('Error fetching variations:', response.status, response.statusText);
        }
      } else if (song.voiceType) {
        // Si es una variación (tiene voiceType), agregarla directamente si no está ya seleccionada
        const isAlreadyAdded = selectedSongs.some(s => s.id === song.id);
        if (!isAlreadyAdded) {
          setSelectedSongs(prev => [...prev, song]);
          console.log('Added individual variation:', song.title, song.voiceType);
        }
      } else {
        console.warn('Song without voiceType and without parentSongId - this should not happen');
      }
    } catch (error) {
      console.error('Error adding song variations:', error);
      // En caso de error, NO agregamos nada si es un elemento padre
      if (song.voiceType) {
        const isAlreadyAdded = selectedSongs.some(s => s.id === song.id);
        if (!isAlreadyAdded) {
          setSelectedSongs(prev => [...prev, song]);
        }
      }
    }
  };

  // Remove song from event playlist
  const removeSongFromEvent = (songId: string) => {
    setSelectedSongs(prev => {
      // Remove the song itself
      const withoutSong = prev.filter(song => song.id !== songId);
      // Also remove any variations of this parent song
      return withoutSong.filter(song => song.parentSongId !== songId);
    });
  };

  // Add all songs from a playlist
  const addPlaylistToEvent = async (playlistId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/playlists/${playlistId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const playlistSongs = result.data.items?.map((item: any) => item.song) || [];
        
        const newSongs = playlistSongs.filter((song: Song) => 
          song.voiceType && !selectedSongs.some(s => s.id === song.id)
        );
        
        setSelectedSongs(prev => [...prev, ...newSongs]);
      }
    } catch (error) {
      console.error('Error loading playlist songs:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendees') {
      loadSingerLocations();
      searchSingers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'attendees') {
      searchSingers();
    }
  }, [singerSearchTerm, selectedLocation, selectedRole]);

  useEffect(() => {
    if (activeTab === 'music') {
      loadSongs();
      loadPlaylists();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'music') {
      loadSongs();
    }
  }, [songSearchTerm]);

  useEffect(() => {
    if (activeTab === 'music') {
      loadPlaylists();
    }
  }, [playlistSearchTerm]);

  // Update variations info when songs or selectedSongs change
  useEffect(() => {
    if (activeTab === 'music' && songs.length > 0) {
      updateVariationsInfo();
    }
  }, [songs, selectedSongs, activeTab]);

  const handleSubmit = async () => {
    if (!title || !date) {
      setError('El título y la fecha son obligatorios');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('category', category);
      formData.append('eventCity', eventCity);
      formData.append('eventAddress', eventAddress);
      formData.append('isPublic', String(isPublic));
      formData.append('allowExternalJoin', String(allowExternalJoin));

      // Add selected attendees
      if (selectedAttendees.length > 0) {
        const attendeeIds = selectedAttendees.map(attendee => attendee.id);
        formData.append('attendeeUserIds', JSON.stringify(attendeeIds));
      }

      // Add selected songs
      if (selectedSongs.length > 0) {
        const songIds = selectedSongs.map(song => song.id);
        formData.append('songIds', JSON.stringify(songIds));
      }

      const response = await fetch(getApiUrl('/events'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onEventCreated(result);
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al crear el evento');
      }
    } catch (error) {
      setError('Error de conexión al crear el evento');
    }
    setIsLoading(false);
  };

  // Update variations info for all parent songs
  const updateVariationsInfo = async () => {
    if (songs.length === 0) return;
    
    const info: Record<string, {total: number, selected: number, isComplete: boolean}> = {};
    
    for (const song of songs) {
      if (!song.voiceType && !song.parentSongId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(getApiUrl(`/songs/${song.id}/versions`), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            
            // Manejar diferentes estructuras de respuesta del backend
            let allVariations = [];
            if (Array.isArray(result)) {
              allVariations = result;
            } else if (result.versions && Array.isArray(result.versions)) {
              allVariations = result.versions;
            } else if (result.data && Array.isArray(result.data)) {
              allVariations = result.data;
            } else if (result.songs && Array.isArray(result.songs)) {
              allVariations = result.songs;
            } else {
              allVariations = [];
            }
            
            // Filtrar solo variaciones válidas (con voiceType)
            const validVariations = allVariations.filter((variation: Song) => 
              variation.voiceType && variation.voiceType !== null
            );
            
            // Contar cuántas variaciones están seleccionadas
            const selectedCount = selectedSongs.filter(s => s.parentSongId === song.id).length;
            
            info[song.id] = {
              total: validVariations.length,
              selected: selectedCount,
              isComplete: validVariations.length > 0 && selectedCount === validVariations.length
            };
          }
        } catch (error) {
          console.error('Error getting variations info for song:', song.id, error);
          info[song.id] = { total: 0, selected: 0, isComplete: false };
        }
      }
    }
    
    setVariationsInfo(info);
  };

  // Audio control functions
  const playAudio = (song: Song) => {
    if (!song.filePath) return;
    
    // Stop current audio if playing
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    }
    
    // If clicking the same song, toggle play/pause
    if (currentPlayingSongId === song.id && currentPlayingAudio && !currentPlayingAudio.paused) {
      currentPlayingAudio.pause();
      setCurrentPlayingSongId(null);
      return;
    }
    
    // Create new audio element
    const audio = new Audio(getApiUrl(`/uploads/${song.filePath}`));
    audio.volume = 0.5; // Set volume to 50%
    
    audio.onended = () => {
      setCurrentPlayingSongId(null);
      setCurrentPlayingAudio(null);
    };
    
    audio.onerror = () => {
      console.error('Error loading audio file:', song.filePath);
      setCurrentPlayingSongId(null);
      setCurrentPlayingAudio(null);
    };
    
    audio.play().then(() => {
      setCurrentPlayingAudio(audio);
      setCurrentPlayingSongId(song.id);
    }).catch(error => {
      console.error('Error playing audio:', error);
    });
  };

  const stopAudio = () => {
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
      setCurrentPlayingAudio(null);
      setCurrentPlayingSongId(null);
    }
  };

  // Stop audio when modal closes or tab changes
  const handleTabChange = (newTab: 'basic' | 'attendees' | 'music') => {
    if (newTab !== 'music') {
      stopAudio();
    }
    setActiveTab(newTab);
  };

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Handle modal close with audio cleanup
  const handleClose = () => {
    stopAudio();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[98vh] overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Crear Nuevo Evento</h2>
            <button 
              onClick={handleClose} 
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { 
                id: 'basic', 
                label: 'Información Básica', 
                icon: Calendar, 
                hasData: title && date 
              },
              { 
                id: 'attendees', 
                label: 'Asistentes', 
                icon: Users, 
                hasData: selectedAttendees.length > 0 
              },
              { 
                id: 'music', 
                label: 'Música', 
                icon: Music, 
                hasData: selectedSongs.filter(song => song.voiceType).length > 0 
              },
            ].map(({ id, label, icon: Icon, hasData }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors relative ${
                  activeTab === id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {hasData && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
                {id === 'attendees' && selectedAttendees.length > 0 && (
                  <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {selectedAttendees.length}
                  </span>
                )}
                {id === 'music' && selectedSongs.filter(song => song.voiceType).length > 0 && (
                  <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {selectedSongs.filter(song => song.voiceType).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Ej: Culto de Adoración - Domingo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  placeholder="Describe el evento..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="Culto">Culto</option>
                  <option value="Ensayo">Ensayo</option>
                  <option value="Conferencia">Conferencia</option>
                  <option value="Retiro">Retiro</option>
                  <option value="Evangelismo">Evangelismo</option>
                  <option value="Especial">Evento Especial</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad del Evento
                  </label>
                  <input
                    type="text"
                    value={citySearchTerm}
                    onChange={(e) => {
                      setCitySearchTerm(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Buscar ciudad..."
                  />
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setEventCity(city);
                            setCitySearchTerm(city);
                            setShowCityDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={eventAddress}
                    onChange={(e) => setEventAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Dirección del evento"
                  />
                </div>
              </div>

              {/* Visibility Settings */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Configuración de Visibilidad
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className={`p-2 rounded-lg transition-colors ${
                        isPublic 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <div>
                      <label className="font-medium text-gray-900">
                        Evento Público
                      </label>
                      <p className="text-sm text-gray-500">
                        {isPublic 
                          ? 'Visible para todos los cantantes' 
                          : 'Solo visible para cantantes seleccionados'}
                      </p>
                    </div>
                  </div>

                  {isPublic && (
                    <div className="flex items-center space-x-3 pl-11">
                      <button
                        onClick={() => setAllowExternalJoin(!allowExternalJoin)}
                        className={`p-2 rounded-lg transition-colors ${
                          allowExternalJoin 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <div>
                        <label className="font-medium text-gray-900">
                          Abierto a Postulaciones
                        </label>
                        <p className="text-sm text-gray-500">
                          Los cantantes pueden solicitar unirse al evento
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-medium text-gray-900">
                  Gestión de Cantantes del Evento
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowGroupSelection(!showGroupSelection)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      showGroupSelection 
                        ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {showGroupSelection ? 'Selección Individual' : 'Selección por Ubicación'}
                  </button>
                  <span className="text-sm text-gray-500 px-2 py-1 bg-blue-50 rounded-lg border border-blue-200">
                    {selectedAttendees.length} seleccionados
                  </span>
                </div>
              </div>

              {/* Diseño de dos columnas */}
              <div className="grid grid-cols-2 gap-6 h-[600px]">
                {/* Columna izquierda: Filtros y búsqueda */}
                <div className="space-y-4 border-r border-gray-200 pr-6">
                  <div className="sticky top-0 bg-white">
                    <h5 className="text-lg font-medium text-gray-900 mb-4">Filtros de Búsqueda</h5>
                    
                    {/* Search and Filters - Solo mostrar si no está activa la selección por grupo */}
                    {!showGroupSelection && (
                      <div className="space-y-3">
                        {/* Filtros en una sola fila */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                              <Search className="h-3 w-3 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Buscar nombre..."
                              value={singerSearchTerm}
                              onChange={(e) => setSingerSearchTerm(e.target.value)}
                              className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>

                          <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="">Todas las ubicaciones</option>
                            {singerLocations.map(location => (
                              <option key={location.id} value={location.id}>
                                {location.name} ({location.singersCount})
                              </option>
                            ))}
                          </select>

                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="">Todos los roles</option>
                            <option value="cantante">Cantante</option>
                            <option value="director">Director</option>
                          </select>
                        </div>

                        {/* Lista de cantantes encontrados */}
                        <div className="border border-gray-200 rounded-lg">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h6 className="font-medium text-gray-900 flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Cantantes Encontrados
                              {loadingSingers && (
                                <div className="ml-2 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                              )}
                            </h6>
                          </div>
                          
                          <div className="max-h-80 overflow-y-auto">
                            {singers.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                <Users className="mx-auto h-6 w-6 text-gray-300 mb-2" />
                                <p className="text-sm">No se encontraron cantantes</p>
                                <p className="text-xs">Intenta ajustar los filtros</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-200">
                                {singers.map(singer => {
                                  const isSelected = selectedAttendees.some(a => a.id === singer.id);
                                  return (
                                    <div
                                      key={singer.id}
                                      className={`p-2 hover:bg-gray-50 transition-colors ${
                                        isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => isSelected ? removeAttendee(singer.id) : addSingerToAttendees(singer)}
                                            className={`p-1 rounded border transition-colors ${
                                              isSelected
                                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                            }`}
                                          >
                                            {isSelected ? <Check className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                          </button>
                                          
                                          <div>
                                            <h6 className="font-medium text-gray-900 text-sm">
                                              {singer.firstName} {singer.lastName}
                                            </h6>
                                            <p className="text-xs text-gray-500">
                                              {singer.email}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="text-right">
                                          <div className="flex flex-wrap gap-1 justify-end mb-1">
                                            {singer.assignedRoles?.map((roleObj, index) => (
                                              <span
                                                key={index}
                                                className="inline-block px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                                              >
                                                {roleObj.role}
                                              </span>
                                            ))}
                                          </div>
                                          <p className="text-xs text-gray-500 flex items-center justify-end">
                                            <MapPin className="h-2 w-2 mr-1" />
                                            {singer.location?.name}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group Selection Mode */}
                    {showGroupSelection && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h6 className="font-medium text-purple-900 mb-3 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Selección por Ubicación
                        </h6>
                        <div className="space-y-3">
                          {/* Opción especial para todos los coristas */}
                          <button
                            onClick={() => addAllSingersToEvent()}
                            className="w-full text-left p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border border-indigo-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-between shadow-lg"
                          >
                            <div>
                              <div className="font-bold text-white">🎵 Todos los Coristas</div>
                              <div className="text-sm text-indigo-100">Todas las ubicaciones</div>
                              <div className="text-xs text-indigo-200">
                                {singerLocations.reduce((total, loc) => total + loc.singersCount, 0)} cantantes
                              </div>
                            </div>
                            <Plus className="h-5 w-5 text-white" />
                          </button>
                          
                          {/* Ubicaciones individuales */}
                          {singerLocations.map(location => (
                            <button
                              key={location.id}
                              onClick={() => showLocationConfirmation(location.id)}
                              className="w-full text-left p-3 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium text-purple-900">{location.name}</div>
                                <div className="text-sm text-purple-600">{location.city}</div>
                                <div className="text-xs text-purple-500">{location.singersCount} cantantes</div>
                              </div>
                              <Plus className="h-5 w-5 text-green-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna derecha: Lista de cantantes seleccionados */}
                <div className="pl-6">
                  <div className="h-full flex flex-col">
                    <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Cantantes Seleccionados ({selectedAttendees.length})
                    </h5>

                    {selectedAttendees.length === 0 ? (
                      <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">No hay cantantes seleccionados</p>
                          <p className="text-sm">Selecciona cantantes de la lista de la izquierda</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">
                            Lista de Asistentes al Evento
                          </span>
                          <button
                            onClick={clearAllAttendees}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Limpiar Todo
                          </button>
                        </div>
                        
                        <div className="h-full overflow-y-auto">
                          <div className="divide-y divide-gray-200">
                            {selectedAttendees.map((attendee, index) => (
                              <div
                                key={attendee.id}
                                className="p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <h6 className="font-medium text-gray-900">
                                        {attendee.firstName} {attendee.lastName}
                                      </h6>
                                      <p className="text-sm text-gray-500">
                                        {attendee.email}
                                      </p>
                                      {attendee.addedBy === 'group' && (
                                        <p className="text-xs text-green-600">
                                          Agregado por ubicación: {attendee.groupName}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                      {attendee.role}
                                    </span>
                                    <button
                                      onClick={() => removeAttendee(attendee.id)}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mensaje para selección por grupo */}
                    {showGroupSelection && selectedAttendees.length === 0 && (
                      <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">Selección por Ubicación Activa</p>
                          <p className="text-sm">Usa los botones de la izquierda para seleccionar cantantes por ubicación</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'music' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-medium text-gray-900">
                  Gestión de Música del Evento
                </h4>
                <span className="text-sm text-gray-500 px-2 py-1 bg-blue-50 rounded-lg border border-blue-200">
                  {selectedSongs.filter(song => song.voiceType).length} canciones seleccionadas
                </span>
              </div>

              {/* Diseño de dos columnas para música */}
              <div className="grid grid-cols-2 gap-6 h-[600px]">
                {/* Columna izquierda: Filtros y búsqueda de música */}
                <div className="space-y-4 border-r border-gray-200 pr-6">
                  <div className="sticky top-0 bg-white">
                    <h5 className="text-lg font-medium text-gray-900 mb-4">Búsqueda de Música</h5>
                    
                    {/* Song Search */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <Search className="h-3 w-3 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar canciones..."
                            value={songSearchTerm}
                            onChange={(e) => setSongSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <Search className="h-3 w-3 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar playlists..."
                            value={playlistSearchTerm}
                            onChange={(e) => setPlaylistSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Songs List */}
                      <div className="border border-gray-200 rounded-lg">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h6 className="font-medium text-gray-900 flex items-center">
                            <Music className="h-4 w-4 mr-2" />
                            Canciones Disponibles
                            {loadingSongs && (
                              <div className="ml-2 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            )}
                          </h6>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                          {songs.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <Music className="mx-auto h-6 w-6 text-gray-300 mb-2" />
                              <p className="text-sm">No se encontraron canciones</p>
                              <p className="text-xs">Intenta ajustar la búsqueda</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {songs.map(song => {
                                const songInfo = variationsInfo[song.id] || { total: 0, selected: 0, isComplete: false };
                                const hasVariations = songInfo.selected > 0;
                                const isCompletelySelected = songInfo.isComplete;
                                
                                return (
                                  <div
                                    key={song.id}
                                    className={`p-2 hover:bg-gray-50 transition-colors ${
                                      isCompletelySelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 
                                      hasVariations ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => {
                                            if (hasVariations) {
                                              // Remove all variations of this parent song
                                              setSelectedSongs(prev => prev.filter(s => s.parentSongId !== song.id));
                                            } else {
                                              addSongToEvent(song);
                                            }
                                          }}
                                          className={`p-1 rounded border transition-colors ${
                                            isCompletelySelected
                                              ? 'bg-indigo-500 border-indigo-500 text-white'
                                              : hasVariations
                                              ? 'bg-yellow-400 border-yellow-400 text-white'
                                              : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                          }`}
                                        >
                                          {isCompletelySelected ? <Check className="h-3 w-3" /> : 
                                           hasVariations ? <span className="text-xs font-bold">!</span> : 
                                           <Plus className="h-3 w-3" />}
                                        </button>

                                        {/* Solo mostrar play si es una variación (tiene voiceType) */}
                                        {song.voiceType && song.filePath && (
                                          <button
                                            onClick={() => playAudio(song)}
                                            className={`p-1 rounded border transition-colors ${
                                              currentPlayingSongId === song.id
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                                            }`}
                                            title={currentPlayingSongId === song.id ? 'Pausar' : 'Reproducir'}
                                          >
                                            {currentPlayingSongId === song.id ? 
                                              <Pause className="h-3 w-3" /> : 
                                              <Play className="h-3 w-3" />
                                            }
                                          </button>
                                        )}
                                        
                                        <div>
                                          <h6 className="font-medium text-gray-900 text-sm">
                                            {song.title}
                                          </h6>
                                          <p className="text-xs text-gray-500">
                                            {song.artist}
                                            {hasVariations && (
                                              <span className={`ml-2 text-xs font-medium ${
                                                isCompletelySelected 
                                                  ? 'text-indigo-600' 
                                                  : 'text-yellow-600'
                                              }`}>
                                                ({songInfo.selected}/{songInfo.total} variaciones)
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="text-right">
                                        {song.voiceType && (
                                          <span className="inline-block px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                            {song.voiceType}
                                          </span>
                                        )}
                                        {songInfo.total > 0 && (
                                          <div className="text-xs text-gray-400 mt-1">
                                            {songInfo.total} voces
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Playlists List */}
                      <div className="border border-gray-200 rounded-lg">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <h6 className="font-medium text-gray-900 text-sm flex items-center">
                            <Users className="h-3 w-3 mr-2" />
                            Playlists Disponibles
                            {loadingPlaylists && (
                              <div className="ml-2 animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            )}
                          </h6>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto">
                          {playlists.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <Users className="mx-auto h-4 w-4 text-gray-300 mb-2" />
                              <p className="text-sm">No se encontraron playlists</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {playlists.map(playlist => (
                                <div
                                  key={playlist.id}
                                  className="p-2 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => addPlaylistToEvent(playlist.id)}
                                        className="p-1 rounded border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                      
                                      <div>
                                        <h6 className="font-medium text-gray-900 text-sm">
                                          {playlist.name}
                                        </h6>
                                        <p className="text-xs text-gray-500">
                                          Por {playlist.user.firstName} {playlist.user.lastName}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <span className="inline-block px-1 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                      {playlist._count.items} canciones
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna derecha: Lista de canciones seleccionadas */}
                <div className="pl-6">
                  <div className="h-full flex flex-col">
                    <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Canciones Seleccionadas ({selectedSongs.filter(song => song.voiceType).length})
                    </h5>

                    {selectedSongs.filter(song => song.voiceType).length === 0 ? (
                      <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Music className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">No hay canciones seleccionadas</p>
                          <p className="text-sm">Selecciona canciones de la lista de la izquierda</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">
                            Lista de Reproducción del Evento
                          </span>
                          <button
                            onClick={() => setSelectedSongs([])}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Limpiar Todo
                          </button>
                        </div>
                        
                        <div className="h-full overflow-y-auto">
                          <div className="divide-y divide-gray-200">
                            {selectedSongs
                              .filter(song => song.voiceType) // Solo mostrar variaciones con voiceType
                              .map((song, index) => (
                              <div
                                key={song.id}
                                className="p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <h6 className="font-medium text-gray-900">
                                        {song.title}
                                      </h6>
                                      <p className="text-sm text-gray-500">
                                        {song.artist}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    {song.voiceType && (
                                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        {song.voiceType}
                                      </span>
                                    )}
                                    
                                    {song.filePath && (
                                      <button
                                        onClick={() => playAudio(song)}
                                        className={`p-1 rounded border transition-colors ${
                                          currentPlayingSongId === song.id
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                                        }`}
                                        title={currentPlayingSongId === song.id ? 'Pausar' : 'Reproducir'}
                                      >
                                        {currentPlayingSongId === song.id ? 
                                          <Pause className="h-4 w-4" /> : 
                                          <Play className="h-4 w-4" />
                                        }
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => removeSongFromEvent(song.id)}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="flex space-x-3">
            {activeTab !== 'basic' && (
              <button
                onClick={() => {
                  const tabs = ['basic', 'attendees', 'music'];
                  const currentIndex = tabs.indexOf(activeTab);
                  handleTabChange(tabs[currentIndex - 1] as any);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
            )}
            {activeTab !== 'music' && (
              <button
                onClick={() => {
                  const tabs = ['basic', 'attendees', 'music'];
                  const currentIndex = tabs.indexOf(activeTab);
                  handleTabChange(tabs[currentIndex + 1] as any);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Siguiente
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title || !date || isLoading}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Crear Evento
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Location Confirmation Modal */}
      {showLocationConfirm && locationToAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirmar Selección de Ubicación
            </h3>
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de que quieres agregar todos los cantantes de{' '}
              <strong>{locationToAdd?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Se agregarán <strong>{locationToAdd?.singersCount}</strong> cantantes de{' '}
              <strong>{locationToAdd?.city}</strong> al evento.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowLocationConfirm(false);
                  setLocationToAdd(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addLocationGroupToAttendees}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEventModal;
