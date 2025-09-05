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
  Trash
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
      if (singerSearchTerm) params.append('search', singerSearchTerm);
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
      if (songSearchTerm) params.append('search', songSearchTerm);

      const response = await fetch(getApiUrl(`/songs/for-playlist?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        // Solo mostrar canciones que tienen voiceType (tienen archivo de audio)
        const songsWithAudio = result.data?.filter((song: Song) => song.voiceType) || [];
        setSongs(songsWithAudio);
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
      if (playlistSearchTerm) params.append('search', playlistSearchTerm);

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

  // Remove attendee from list
  const removeAttendee = (attendeeId: string) => {
    setSelectedAttendees(prev => prev.filter(attendee => attendee.id !== attendeeId));
  };

  // Clear all attendees
  const clearAllAttendees = () => {
    setSelectedAttendees([]);
  };

  // Add song to event playlist
  const addSongToEvent = (song: Song) => {
    const isAlreadyAdded = selectedSongs.some(s => s.id === song.id);
    if (isAlreadyAdded) return;

    setSelectedSongs(prev => [...prev, song]);
  };

  // Remove song from event playlist
  const removeSongFromEvent = (songId: string) => {
    setSelectedSongs(prev => prev.filter(song => song.id !== songId));
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
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al crear el evento');
      }
    } catch (error) {
      setError('Error de conexión al crear el evento');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Crear Nuevo Evento</h2>
            <button 
              onClick={onClose} 
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
                hasData: selectedSongs.length > 0 
              },
            ].map(({ id, label, icon: Icon, hasData }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
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
                {id === 'music' && selectedSongs.length > 0 && (
                  <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {selectedSongs.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
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

              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={singerSearchTerm}
                    onChange={(e) => setSingerSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Todos los roles</option>
                  <option value="soprano">Soprano</option>
                  <option value="contralto">Contralto</option>
                  <option value="tenor">Tenor</option>
                  <option value="bajo">Bajo</option>
                  <option value="director">Director</option>
                </select>
              </div>

              {/* Group Selection Mode */}
              {showGroupSelection && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Selección por Ubicación
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {singerLocations.map(location => (
                      <button
                        key={location.id}
                        onClick={() => showLocationConfirmation(location.id)}
                        className="text-left p-3 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-between"
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

              {/* Singers List */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h5 className="font-medium text-gray-900 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Cantantes Disponibles
                    {loadingSingers && (
                      <div className="ml-2 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    )}
                  </h5>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {singers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p>No se encontraron cantantes</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {singers.map(singer => {
                        const isSelected = selectedAttendees.some(a => a.id === singer.id);
                        return (
                          <div
                            key={singer.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => addSingerToAttendees(singer)}
                                  disabled={isSelected}
                                  className={`p-1 rounded border-2 transition-colors ${
                                    isSelected
                                      ? 'bg-indigo-500 border-indigo-500 text-white'
                                      : 'border-gray-300 hover:border-indigo-400'
                                  }`}
                                >
                                  <UserCheck className="h-3 w-3" />
                                </button>
                                
                                <div>
                                  <h6 className="font-medium text-gray-900">
                                    {singer.firstName} {singer.lastName}
                                  </h6>
                                  <p className="text-sm text-gray-500">
                                    {singer.email}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="flex flex-wrap gap-1 justify-end mb-1">
                                  {singer.assignedRoles.map((roleObj, index) => (
                                    <span
                                      key={index}
                                      className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                    >
                                      {roleObj.role}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 flex items-center justify-end">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {singer.location.name}, {singer.location.city}
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

              {/* Selected attendees summary */}
              {selectedAttendees.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-green-900 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Cantantes Seleccionados ({selectedAttendees.length})
                    </h5>
                    <button
                      onClick={clearAllAttendees}
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                    >
                      <Trash className="h-3 w-3 mr-1" />
                      Limpiar Todo
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAttendees.map(attendee => (
                      <span
                        key={attendee.id}
                        className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full"
                      >
                        {attendee.firstName} {attendee.lastName}
                        {attendee.addedBy === 'group' && (
                          <span className="ml-1 text-xs text-green-600">({attendee.groupName})</span>
                        )}
                        <button
                          onClick={() => removeAttendee(attendee.id)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'music' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-medium text-gray-900">
                  Gestión de Música del Evento
                </h4>
                <span className="text-sm text-gray-500 px-2 py-1 bg-blue-50 rounded-lg border border-blue-200">
                  {selectedSongs.length} canciones seleccionadas
                </span>
              </div>

              {/* Song Search */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar canciones..."
                    value={songSearchTerm}
                    onChange={(e) => setSongSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Songs List */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h5 className="font-medium text-gray-900 flex items-center">
                      <Music className="h-4 w-4 mr-2" />
                      Canciones Disponibles
                      {loadingSongs && (
                        <div className="ml-2 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                      )}
                    </h5>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {songs.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Music className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p>No se encontraron canciones</p>
                        <p className="text-sm">Intenta ajustar la búsqueda</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {songs.map(song => {
                          const isSelected = selectedSongs.some(s => s.id === song.id);
                          return (
                            <div
                              key={song.id}
                              className={`p-4 hover:bg-gray-50 transition-colors ${
                                isSelected ? 'bg-indigo-50' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => addSongToEvent(song)}
                                    disabled={isSelected}
                                    className={`p-1 rounded border-2 transition-colors ${
                                      isSelected
                                        ? 'bg-indigo-500 border-indigo-500 text-white'
                                        : 'border-gray-300 hover:border-indigo-400'
                                    }`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  
                                  <div>
                                    <h6 className="font-medium text-gray-900">
                                      {song.title}
                                    </h6>
                                    <p className="text-sm text-gray-500">
                                      {song.artist}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  {song.voiceType && (
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                      {song.voiceType}
                                    </span>
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
              </div>

              {/* Playlist Search */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar playlists..."
                    value={playlistSearchTerm}
                    onChange={(e) => setPlaylistSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Playlists List */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h5 className="font-medium text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Playlists Disponibles
                      {loadingPlaylists && (
                        <div className="ml-2 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                      )}
                    </h5>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {playlists.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p>No se encontraron playlists</p>
                        <p className="text-sm">Intenta ajustar la búsqueda</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {playlists.map(playlist => (
                          <div
                            key={playlist.id}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => addPlaylistToEvent(playlist.id)}
                                  className="p-1 rounded border-2 border-gray-300 hover:border-indigo-400 transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                                
                                <div>
                                  <h6 className="font-medium text-gray-900">
                                    {playlist.name}
                                  </h6>
                                  <p className="text-sm text-gray-500">
                                    Por {playlist.user.firstName} {playlist.user.lastName}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  {playlist._count.items} canciones
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected songs summary */}
              {selectedSongs.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-green-900 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Canciones Seleccionadas ({selectedSongs.length})
                    </h5>
                    <button
                      onClick={() => setSelectedSongs([])}
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                    >
                      <Trash className="h-3 w-3 mr-1" />
                      Limpiar Todo
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedSongs.map((song, index) => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">
                            {index + 1}.
                          </span>
                          <div>
                            <h6 className="font-medium text-gray-900 text-sm">
                              {song.title}
                            </h6>
                            <p className="text-xs text-gray-500">
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
                          <button
                            onClick={() => removeSongFromEvent(song.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  setActiveTab(tabs[currentIndex - 1] as any);
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
                  setActiveTab(tabs[currentIndex + 1] as any);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Siguiente
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
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
              <strong>{locationToAdd.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Se agregarán <strong>{locationToAdd.singersCount}</strong> cantantes de{' '}
              <strong>{locationToAdd.city}</strong> al evento.
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
