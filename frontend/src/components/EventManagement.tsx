import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Music, 
  Search, 
  Clock,
  Eye,
  Globe,
  Lock,
  UserPlus,
  Trash2,
  Edit,
  Play,
  AlertCircle,
  Star,
  CheckCircle,
  CalendarClock
} from 'lucide-react';
import CreateEventModal from './CreateEventModal.tsx';
import EventDetailsModal from './EventDetailsModal.tsx';
import { useEventPlaylist } from '../hooks/useEventPlaylist';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import type { Song } from '../types';
import { getSongFileUrl } from '../config/api';
import { getApiUrl } from '../config/api';

interface Location {
  id: string;
  name: string;
  city: string;
  region?: string;
  country: string;
}

interface Creator {
  firstName: string;
  lastName: string;
}

interface EventAttendee {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    location?: { name: string };
    assignedRoles: Array<{ role: string }>;
    voiceProfiles?: Array<{
      voiceType: string;
      isPrimary: boolean;
    }>;
  };
  addedByUser: {
    firstName: string;
    lastName: string;
  };
  addedBy: 'individual' | 'group';
  groupName?: string;
  status: string;
}

interface EventJoinRequest {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    assignedRoles: Array<{ role: string }>;
  };
  message?: string;
  status: string;
  createdAt: string;
}

interface EventSong {
  id: string;
  song: {
    id: string;
    title: string;
    artist?: string;
    voiceType?: string;
    filePath?: string;
    parentSongId?: string;
  };
  order: number;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  category?: string;
  location?: Location;
  creator?: Creator;
  eventCity?: string;
  eventAddress?: string;
  mapLink?: string;
  imageUrl?: string;
  isPublic: boolean;
  allowExternalJoin: boolean;
  _count?: {
    attendees: number;
    joinRequests: number;
    eventSongs?: number;
    uniqueEventSongs?: number;
  };
  attendees?: EventAttendee[];
  joinRequests?: EventJoinRequest[];
  eventSongs?: EventSong[];
}

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState<'info' | 'attendees' | 'requests' | 'singers'>('info'); // Nueva estado
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  // Estados para pestañas y filtros adicionales
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Hooks para reproducir eventos como playlists
  const { playEvent, loading: playLoading } = useEventPlaylist();
  const { setCurrentSong } = usePlayerStore();
  const { replaceQueueAndPlay } = usePlaylistStore();

  // Función para filtrar eventos
  const getFilteredEvents = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let filteredEvents = events;

    // Filtrar por pestaña (próximos/pasados)
    if (activeTab === 'upcoming') {
      filteredEvents = filteredEvents.filter(event => new Date(event.date) >= now);
    } else {
      filteredEvents = filteredEvents.filter(event => new Date(event.date) < now);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.eventCity?.toLowerCase().includes(term) ||
        event.location?.name.toLowerCase().includes(term) ||
        event.location?.city.toLowerCase().includes(term)
      );
    }

    // Filtrar por ciudad
    if (selectedCity) {
      filteredEvents = filteredEvents.filter(event =>
        event.eventCity === selectedCity || event.location?.city === selectedCity
      );
    }

    // Filtrar por región
    if (selectedRegion) {
      filteredEvents = filteredEvents.filter(event =>
        event.location?.region === selectedRegion
      );
    }

    // Ordenar por fecha
    return filteredEvents.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
    });
  };

  // Obtener ciudades únicas para el filtro
  const getUniqueCities = () => {
    const cities = new Set<string>();
    events.forEach(event => {
      if (event.eventCity) cities.add(event.eventCity);
      if (event.location?.city) cities.add(event.location.city);
    });
    return Array.from(cities).sort();
  };

  // Obtener regiones únicas para el filtro
  const getUniqueRegions = () => {
    const regions = new Set<string>();
    events.forEach(event => {
      if (event.location?.region) regions.add(event.location.region);
    });
    return Array.from(regions).sort();
  };

  const filteredEvents = getFilteredEvents();
  const uniqueCities = getUniqueCities();
  const uniqueRegions = getUniqueRegions();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('/events/management/all'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar eventos');
      }

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      } else {
        setError('Error al cargar eventos');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para recargar un evento específico por ID
  const reloadEventById = useCallback(async (eventId: string): Promise<Event | null> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/events/${eventId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (err) {
      console.error('Error reloading event:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventCreated = (newEventData: unknown) => {
    // Extraer el evento de la respuesta del backend
    const response = newEventData as { data?: Event } | Event;
    const newEvent = 'data' in response && response.data ? response.data : response as Event;
    
    // Agregar el nuevo evento al principio de la lista
    setEvents(prev => [newEvent, ...prev]);
    setShowCreateModal(false);
    
    // También recargar la lista completa para asegurar sincronización
    setTimeout(() => {
      fetchEvents();
    }, 1000);
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setInitialModalTab('info'); // Por defecto a info
    setShowDetailsModal(true);
  };

  const handleViewRequests = (event: Event) => {
    setSelectedEvent(event);
    setInitialModalTab('requests'); // Directamente a solicitudes
    setShowDetailsModal(true);
  };

  const handleEditEvent = async (event: Event) => {
    try {
      // Cargar el evento completo con sus canciones
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/events/${event.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const completeEvent = result.data || result;
        console.log('🔄 [EDIT] Complete event data loaded:', completeEvent);
        console.log('🔄 [EDIT] Event has eventSongs:', !!completeEvent.eventSongs);
        console.log('🔄 [EDIT] EventSongs:', completeEvent.eventSongs);
        
        setEventToEdit(completeEvent);
        setShowEditModal(true);
      } else {
        console.error('Error loading complete event data:', response.status);
        // Fallback to basic event data
        setEventToEdit(event);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error loading complete event data:', error);
      // Fallback to basic event data
      setEventToEdit(event);
      setShowEditModal(true);
    }
  };

  const handleEventUpdated = () => {
    // Actualizar la lista de eventos
    fetchEvents();
    setShowEditModal(false);
    setEventToEdit(null);
  };



  // Función para reproducir evento como playlist
  const handlePlayEvent = async (event: Event) => {
    try {
      const result = await playEvent(event.id);
      if (result && result.songs.length > 0) {
        console.log(`🎵 Playing event: ${result.eventTitle} with ${result.totalSongs} songs`);
        
        // Convertir las canciones a formato correcto con URLs
        const songsWithUrls = result.songs.map(song => {
          let songUrl = '';
          
          if (song.folderName && song.fileName) {
            // Usar getSongFileUrl para archivos en carpetas dinámicas
            songUrl = getSongFileUrl(song.folderName, song.fileName);
          } else if (song.filePath) {
            // Usar filePath directo si está disponible
            songUrl = getApiUrl(`/uploads/${song.filePath}`);
          } else if (song.fileName) {
            // Archivo en carpeta raíz
            songUrl = getApiUrl(`/uploads/${song.fileName}`);
          }
          
          return {
            ...song,
            url: songUrl // Añadir URL para playerStore
          };
        });

        console.log(`🎵 Songs with URLs:`, songsWithUrls);

        // Agregar todas las canciones a la cola y empezar a reproducir la primera
        replaceQueueAndPlay(songsWithUrls as unknown as Song[], 0);
        
        // También establecer en playerStore para reproducción inmediata
        if (songsWithUrls[0]) {
          setCurrentSong(songsWithUrls[0] as unknown as Song);
        }
        
        console.log(`✅ Evento reproducido: ${result.eventTitle} con ${result.totalSongs} canciones`);
      } else {
        console.warn('⚠️ El evento no tiene canciones para reproducir');
      }
    } catch (error) {
      console.error('Error al reproducir evento:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Music className="h-6 w-6 text-indigo-600 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Gestión de Programación
            </h1>
            <p className="text-gray-600">
              Crea y administra eventos y ensayos para el coro
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Programación
          </button>
        </div>

        {/* Pestañas y Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Próxima Programación ({events.filter(e => new Date(e.date) >= new Date()).length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'past'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-5 h-5 inline mr-2" />
              Programación Pasada ({events.filter(e => new Date(e.date) < new Date()).length})
            </button>
          </div>

          {/* Filtros */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar programación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Filtro por ciudad */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Todas las ciudades</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por región */}
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Todas las regiones</option>
                  {uniqueRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Eventos Pendientes */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eventos Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    return events.filter(e => 
                      e.category !== 'Ensayo' && 
                      new Date(e.date) >= now
                    ).length;
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Ensayos Pendientes */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ensayos Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    return events.filter(e => 
                      e.category === 'Ensayo' && 
                      new Date(e.date) >= now
                    ).length;
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Eventos Realizados */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eventos Realizados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    return events.filter(e => 
                      e.category !== 'Ensayo' && 
                      new Date(e.date) < now
                    ).length;
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Ensayos Realizados */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <CalendarClock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ensayos Realizados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    return events.filter(e => 
                      e.category === 'Ensayo' && 
                      new Date(e.date) < now
                    ).length;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchEvents}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-100 shadow-lg max-w-md mx-auto">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontró programación' : 'No hay programación creada'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Crea tu primera programación para comenzar'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Programación
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const isEnsayo = event.category === 'Ensayo';
              const cardClass = isEnsayo 
                ? "bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700 overflow-hidden group" 
                : "bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group";
              
              return (
                <div
                  key={event.id}
                  className={`${cardClass} flex flex-col h-full`}
                >
                {/* Event Image */}
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:from-indigo-600 group-hover:to-purple-700 transition-all duration-300">
                    <Music className="h-16 w-16 text-white opacity-80" />
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Fila 1: Título completo */}
                  <div className="mb-3">
                    <h3 className={`text-lg font-bold line-clamp-2 ${isEnsayo ? 'text-white' : 'text-gray-900'}`}>
                      {event.title}
                    </h3>
                  </div>

                  {/* Fila 2: Todas las etiquetas */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Etiqueta de categoría con icono */}
                    {event.category && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                        isEnsayo 
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500/50' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                      }`}>
                        {isEnsayo ? (
                          <Music className="h-3 w-3 mr-1" />
                        ) : (
                          <Calendar className="h-3 w-3 mr-1" />
                        )}
                        {event.category}
                      </span>
                    )}

                    {/* Etiqueta Público/Privado */}
                    {event.isPublic ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isEnsayo 
                          ? 'bg-green-800 text-green-200' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        <Globe className="h-3 w-3 mr-1" />
                        Público
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isEnsayo 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <Lock className="h-3 w-3 mr-1" />
                        Privado
                      </span>
                    )}
                    
                    {/* Etiqueta "Abierto a Postulaciones" */}
                    {event.allowExternalJoin && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isEnsayo 
                          ? 'bg-blue-800 text-blue-200' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        <UserPlus className="h-3 w-3 mr-1" />
                        Abierto a Postulaciones
                      </span>
                    )}
                  </div>

                  {/* Fila 3: Fecha, Hora y Lugar */}
                  <div className={`flex flex-col gap-2 mb-4 ${isEnsayo ? 'text-gray-400' : 'text-slate-600'}`}>
                    {/* Fecha y Hora */}
                    <div className="flex items-center">
                      <Calendar className={`h-4 w-4 mr-2 ${isEnsayo ? 'text-indigo-400' : 'text-indigo-500'}`} />
                      <span className="text-sm font-medium">
                        {formatDate(event.date)}
                      </span>
                      {event.time && (
                        <>
                          <Clock className={`h-4 w-4 ml-4 mr-2 ${isEnsayo ? 'text-emerald-400' : 'text-emerald-500'}`} />
                          <span className="text-sm font-medium">{formatTime(event.time)}</span>
                        </>
                      )}
                    </div>

                    {/* Lugar */}
                    <div className="flex items-center">
                      <MapPin className={`h-4 w-4 mr-2 ${isEnsayo ? 'text-red-400' : 'text-red-500'}`} />
                      <span className="text-sm font-medium line-clamp-1">
                        {event.eventCity || event.location?.city || 'Ubicación por confirmar'}
                        {event.eventAddress && `, ${event.eventAddress}`}
                      </span>
                    </div>
                  </div>

                  {/* Spacer para empujar los botones hacia abajo */}
                  <div className="flex-1"></div>

                  {/* Stats */}
                  <div className={`flex items-center justify-between pt-4 border-t ${isEnsayo ? 'border-gray-600' : 'border-gray-100'} mt-auto`}>
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center px-3 py-2 rounded-lg ${
                        isEnsayo 
                          ? 'bg-gradient-to-r from-blue-700/40 to-indigo-700/40 border border-blue-600/30'
                          : 'bg-indigo-50'
                      }`}>
                        <Users className={`h-5 w-5 mr-2 ${isEnsayo ? 'text-blue-300' : 'text-indigo-500'}`} />
                        <span className={`text-sm font-bold ${isEnsayo ? 'text-blue-200' : 'text-indigo-700'}`}>
                          {event._count?.attendees || 0} 
                        </span>
                        {/* Indicador de asistentes pendientes */}
                        {event.attendees && event.attendees.filter(a => a.status === 'PENDING').length > 0 && (
                          <div className="ml-2 relative group">
                            <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {event.attendees.filter(a => a.status === 'PENDING').length} por confirmar
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Mostrar solicitudes como badge solo si hay más de 0 y permite solicitudes externas */}
                      {event.allowExternalJoin && (event._count?.joinRequests ?? 0) > 0 && (
                        <div className="flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar que abra el modal normal
                              handleViewRequests(event);
                            }}
                            className="relative hover:bg-orange-50 rounded-full p-1 transition-all duration-200"
                            title={`${event._count?.joinRequests ?? 0} solicitudes pendientes - Clic para ver`}
                          >
                            <UserPlus className="h-4 w-4 text-orange-500" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {event._count?.joinRequests ?? 0}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Contador de canciones */}
                      {(event._count?.uniqueEventSongs ?? event._count?.eventSongs ?? 0) > 0 && (
                        <button
                          onClick={() => handlePlayEvent(event)}
                          disabled={playLoading}
                          className={`flex items-center px-2 py-1 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                            isEnsayo 
                              ? 'text-green-400 bg-green-900/30 hover:text-green-300 hover:bg-green-900/50' 
                              : 'text-green-600 bg-green-50 hover:text-green-700 hover:bg-green-100'
                          }`}
                          title="Reproducir como playlist"
                        >
                          <span className="text-sm font-medium mr-1">
                            {event._count?.uniqueEventSongs ?? event._count?.eventSongs ?? 0}
                          </span>
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(event)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isEnsayo 
                            ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30' 
                            : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                        }`}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditEvent(event)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isEnsayo 
                            ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30' 
                            : 'text-purple-500 hover:text-purple-700 hover:bg-purple-50'
                        }`}
                        title="Editar evento"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isEnsayo 
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30' 
                            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                        }`}
                        title="Eliminar evento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateEventModal
            onClose={() => setShowCreateModal(false)}
            onEventCreated={handleEventCreated}
          />
        )}

        {showEditModal && eventToEdit && (
          <CreateEventModal
            onClose={() => {
              setShowEditModal(false);
              setEventToEdit(null);
            }}
            onEventCreated={handleEventUpdated}
            editMode={true}
            eventData={eventToEdit as Parameters<typeof CreateEventModal>[0]['eventData']}
          />
        )}

        {showDetailsModal && selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            onClose={() => {
              setShowDetailsModal(false);
              setInitialModalTab('info'); // Reset a info por defecto
            }}
            onEventUpdated={async () => {
              // Primero actualizar la lista completa
              await fetchEvents();
              
              // Luego recargar el evento seleccionado con datos frescos
              const updatedEvent = await reloadEventById(selectedEvent.id);
              if (updatedEvent) {
                console.log(`🔄 [EVENT UPDATE] Updated selectedEvent:`, updatedEvent);
                setSelectedEvent(updatedEvent);
              }
            }}
            initialTab={initialModalTab}
          />
        )}
      </div>
    </div>
  );
};

export default EventManagement;
