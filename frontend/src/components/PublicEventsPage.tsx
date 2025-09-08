import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Music, 
  Eye, 
  UserPlus,
  Users,
  Globe,
  Lock,
  Play,
  UserCheck,
  X,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import { getApiUrl, getSongFileUrl } from '../config/api';
import { useEventPlaylist } from '../hooks/useEventPlaylist';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';

interface Location {
  id: string;
  name: string;
  city: string;
  region?: string;
  country: string;
}

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
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
  };
  attendees?: any[];
  joinRequests?: any[];
  eventSongs?: EventSong[];
  userJoinRequest?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
  isUserAttendee?: boolean;
  userAttendanceStatus?: {
    attendanceConfirmed: boolean | null;
    nonAttendanceComment?: string;
    status?: 'CONFIRMED' | 'REFUSED' | 'PENDING';
  };
}

interface EventSong {
  id: string;
  song: {
    id: string;
    title: string;
    artist: string;
    duration?: number;
    voiceType?: string;
    filePath?: string;
    folderName?: string;
    fileName?: string;
  };
}

interface EventsResponse {
  success: boolean;
  data: Event[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalEvents: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const PublicEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventSongs, setEventSongs] = useState<EventSong[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [joinRequestLoading, setJoinRequestLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNonAttendanceModal, setShowNonAttendanceModal] = useState(false);
  const [nonAttendanceComment, setNonAttendanceComment] = useState('');
  
  // Estados para pestañas y filtros
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Hooks para reproducir eventos como playlists
  const { playEvent, loading: playLoading } = useEventPlaylist();
  const { setCurrentSong } = usePlayerStore();
  const { replaceQueueAndPlay } = usePlaylistStore();

  useEffect(() => {
    fetchEvents();
    fetchCurrentUser();
  }, []);

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

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.success) {
          setCurrentUser(userData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('/events/visible'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar eventos');
      }
      
      const data: EventsResponse = await response.json();
      
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
        replaceQueueAndPlay(songsWithUrls as any[], 0);
        
        // También establecer en playerStore para reproducción inmediata
        if (songsWithUrls[0]) {
          setCurrentSong(songsWithUrls[0] as any);
        }
        
        console.log(`✅ Evento reproducido: ${result.eventTitle} con ${result.totalSongs} canciones`);
      } else {
        console.warn('⚠️ El evento no tiene canciones para reproducir');
      }
    } catch (error) {
      console.error('Error al reproducir evento:', error);
    }
  };

  // Función para obtener canciones padre del evento (sin voiceType)
  const fetchEventSongs = async (eventId: string) => {
    try {
      setSongsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/events/${eventId}/songs`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar canciones');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Filtrar solo canciones padre (sin voiceType)
        const parentSongs = data.data.filter((eventSong: any) => 
          !eventSong.song.voiceType
        );
        setEventSongs(parentSongs);
      }
    } catch (error) {
      console.error('Error fetching event songs:', error);
    } finally {
      setSongsLoading(false);
    }
  };

  // Función para manejar postulaciones
  const handleJoinRequest = async (eventId: string, action: 'join' | 'cancel') => {
    try {
      setJoinRequestLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoint = `/events/${eventId}/join-request`;
      
      const response = await fetch(getApiUrl(endpoint), {
        method: action === 'join' ? 'POST' : 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al procesar solicitud');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local dinámicamente sin recargar todos los eventos
        if (action === 'join') {
          // Agregar solicitud pendiente con el ID real devuelto por el backend
          const newJoinRequest = {
            id: data.data?.id || 'temp-id',
            status: 'PENDING' as const
          };
          
          setEvents(prevEvents => 
            prevEvents.map(event => 
              event.id === eventId 
                ? {
                    ...event,
                    userJoinRequest: newJoinRequest
                  }
                : event
            )
          );
          
          // Actualizar selectedEvent si está abierto
          if (selectedEvent && selectedEvent.id === eventId) {
            setSelectedEvent(prev => prev ? {
              ...prev,
              userJoinRequest: newJoinRequest
            } : null);
          }
        } else {
          // Cancelar solicitud - remover userJoinRequest
          setEvents(prevEvents => 
            prevEvents.map(event => 
              event.id === eventId 
                ? {
                    ...event,
                    userJoinRequest: undefined
                  }
                : event
            )
          );
          
          // Actualizar selectedEvent si está abierto
          if (selectedEvent && selectedEvent.id === eventId) {
            setSelectedEvent(prev => prev ? {
              ...prev,
              userJoinRequest: undefined
            } : null);
          }
        }
        
        console.log(`✅ ${action === 'join' ? 'Solicitud enviada' : 'Solicitud cancelada'} correctamente`);
      }
    } catch (error) {
      console.error('Error handling join request:', error);
      // En caso de error, recargar los eventos como fallback
      fetchEvents();
    } finally {
      setJoinRequestLoading(false);
    }
  };

  // Función para reenviar solicitudes rechazadas
  const handleResubmitRequest = async (eventId: string, message?: string) => {
    try {
      setJoinRequestLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/events/${eventId}/resubmit-join-request`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error('Error al reenviar solicitud');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local para mostrar solicitud pendiente
        const newJoinRequest = {
          id: data.data?.id || 'temp-id',
          status: 'PENDING' as const
        };
        
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === eventId 
              ? {
                  ...event,
                  userJoinRequest: newJoinRequest
                }
              : event
          )
        );
        
        // Actualizar selectedEvent si está abierto
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent(prev => prev ? {
            ...prev,
            userJoinRequest: newJoinRequest
          } : null);
        }
        
        console.log('✅ Solicitud reenviada correctamente');
      }
    } catch (error) {
      console.error('Error resubmitting join request:', error);
      // En caso de error, recargar los eventos como fallback
      fetchEvents();
    } finally {
      setJoinRequestLoading(false);
    }
  };

  // Función para confirmar asistencia
  const handleAttendanceConfirmation = async (eventId: string, confirmed: boolean, comment?: string) => {
    try {
      setJoinRequestLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/events/${eventId}/attendance-confirmation`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attendanceConfirmed: confirmed,
          nonAttendanceComment: comment
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al confirmar asistencia');
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Asistencia ${confirmed ? 'confirmada' : 'denegada'} correctamente`);
        
        // Actualizar el estado local para reflejar el cambio
        const attendanceStatus = {
          attendanceConfirmed: confirmed,
          nonAttendanceComment: comment
        };
        
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === eventId 
              ? {
                  ...event,
                  userAttendanceStatus: attendanceStatus
                }
              : event
          )
        );
        
        // Actualizar selectedEvent si está abierto
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent(prev => prev ? {
            ...prev,
            userAttendanceStatus: attendanceStatus
          } : null);
        }
      }
    } catch (error) {
      console.error('Error confirming attendance:', error);
    } finally {
      setJoinRequestLoading(false);
    }
  };

  // Función para reproducir una canción individual
  const handlePlaySong = (eventSong: EventSong) => {
    const song = eventSong.song;
    let songUrl = '';
    
    if (song.folderName && song.fileName) {
      songUrl = getSongFileUrl(song.folderName, song.fileName);
    } else if (song.filePath) {
      songUrl = getApiUrl(`/uploads/${song.filePath}`);
    } else if (song.fileName) {
      songUrl = getApiUrl(`/uploads/${song.fileName}`);
    }
    
    const songWithUrl = {
      ...song,
      url: songUrl
    };
    
    setCurrentSong(songWithUrl as any);
    replaceQueueAndPlay([songWithUrl as any], 0);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Eventos del Coro
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Descubre las próximas presentaciones y conciertos de nuestro coro. 
            Únete a nosotros en estas experiencias musicales únicas.
          </p>
        </div>

        {/* Pestañas */}
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
              Próximos Eventos ({events.filter(e => new Date(e.date) >= new Date()).length})
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
              Eventos Pasados ({events.filter(e => new Date(e.date) < new Date()).length})
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
                  placeholder="Buscar eventos..."
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

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-100 shadow-lg max-w-md mx-auto">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'upcoming' ? 'No hay próximos eventos' : 'No hay eventos pasados'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'upcoming' 
                  ? 'Próximamente se publicarán nuevas fechas de conciertos.'
                  : 'Aún no se han realizado eventos o no coinciden con los filtros aplicados.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
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

                <div className="p-6">
                  {/* Header with Privacy Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                      {event.title}
                    </h3>
                    <div className="ml-2 flex flex-col gap-1">
                      {event.isPublic ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Globe className="h-3 w-3 mr-1" />
                          Público
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Lock className="h-3 w-3 mr-1" />
                          Privado
                        </span>
                      )}
                      
                      {/* Etiqueta "Abierto a Postulaciones" */}
                      {event.allowExternalJoin && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <UserPlus className="h-3 w-3 mr-1" />
                          Abierto a Postulaciones
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* Date & Time */}
                  <div className="flex items-center text-slate-600 mb-3">
                    <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                    <span className="text-sm font-medium">
                      {formatDate(event.date)}
                    </span>
                    {event.time && (
                      <>
                        <Clock className="h-4 w-4 ml-4 mr-2 text-emerald-500" />
                        <span className="text-sm font-medium">{formatTime(event.time)}</span>
                      </>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center text-slate-600 mb-4">
                    <MapPin className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-sm font-medium line-clamp-1">
                      {event.eventCity || event.location?.city || 'Ubicación por confirmar'}
                      {event.eventAddress && `, ${event.eventAddress}`}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-indigo-600">
                        <Users className="h-4 w-4 mr-1 text-indigo-500" />
                        <span className="text-sm font-medium">
                          {event._count?.attendees || 0} asistentes
                        </span>
                      </div>
                      
                      {/* Mostrar iconos según el rol del usuario */}
                      {(() => {
                        const isCreatorOrAdmin = currentUser && (
                          currentUser.assignedRoles?.some((role: any) => role.role === 'ADMIN') ||
                          event.creator?.id === currentUser.id
                        );

                        // Para creadores y admins: mostrar solicitudes pendientes
                        if (isCreatorOrAdmin && event.allowExternalJoin && (event._count?.joinRequests ?? 0) > 0) {
                          return (
                            <div className="flex items-center">
                              <div className="relative">
                                <UserPlus className="h-4 w-4 text-orange-500" />
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                  {event._count?.joinRequests ?? 0}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        // Para usuarios regulares: mostrar estado de su solicitud
                        if (!isCreatorOrAdmin && event.userJoinRequest) {
                          const { status } = event.userJoinRequest;
                          if (status === 'PENDING') {
                            return (
                              <div className="flex items-center" title="Solicitud enviada - Pendiente">
                                <div className="relative">
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                </div>
                              </div>
                            );
                          } else if (status === 'APPROVED') {
                            return (
                              <div className="flex items-center" title="Solicitud aprobada">
                                <div className="relative">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </div>
                              </div>
                            );
                          }
                        }

                        // Para usuarios regulares: mostrar si es cantante invitado (sin solicitud pero es asistente)
                        if (!isCreatorOrAdmin && !event.userJoinRequest && event.isUserAttendee) {
                          return (
                            <div className="flex items-center" title="Cantante invitado">
                              <div className="relative">
                                <UserCheck className="h-4 w-4 text-blue-500" />
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Contador de canciones */}
                      {(event._count?.eventSongs ?? 0) > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayEvent(event);
                          }}
                          disabled={playLoading}
                          className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-lg hover:text-green-700 hover:bg-green-100 transition-all duration-200 disabled:opacity-50"
                          title="Reproducir como playlist"
                        >
                          <span className="text-sm font-medium mr-1">
                            {event._count?.eventSongs ?? 0}
                          </span>
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de detalles del evento */}
        {selectedEvent && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onMouseEnter={() => fetchEventSongs(selectedEvent.id)}
          >
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedEvent.title}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {selectedEvent.isPublic ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Globe className="h-3 w-3 mr-1" />
                          Público
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Lock className="h-3 w-3 mr-1" />
                          Privado
                        </span>
                      )}
                      
                      {selectedEvent.allowExternalJoin && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <UserPlus className="h-3 w-3 mr-1" />
                          Abierto a Postulaciones
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      setEventSongs([]);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Imagen del evento - Solo si existe */}
                {selectedEvent.imageUrl && (
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="w-full h-64 object-cover rounded-xl mb-6 shadow-lg"
                  />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Información principal */}
                  <div>
                    {/* Descripción */}
                    {selectedEvent.description && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                        <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                      </div>
                    )}

                    {/* Información del evento */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Evento</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-indigo-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">Fecha</p>
                            <p className="text-gray-600">{formatDate(selectedEvent.date)}</p>
                          </div>
                        </div>

                        {selectedEvent.time && (
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-emerald-500 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">Hora</p>
                              <p className="text-gray-600">{formatTime(selectedEvent.time)}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-red-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">Ubicación</p>
                            <p className="text-gray-600">
                              {selectedEvent.eventCity || selectedEvent.location?.city || 'Por confirmar'}
                              {selectedEvent.eventAddress && (
                                <><br /><span className="text-sm">{selectedEvent.eventAddress}</span></>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">Participantes</p>
                            <p className="text-gray-600">
                              {selectedEvent._count?.attendees || 0} asistente{(selectedEvent._count?.attendees || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mapa */}
                    {selectedEvent.mapLink && (
                      <div className="mb-6">
                        <a
                          href={selectedEvent.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                        >
                          <MapPin className="h-5 w-5 mr-2" />
                          Ver ubicación en el mapa
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Canciones y postulaciones */}
                  <div>
                    {/* Botones de postulación */}
                    {selectedEvent.allowExternalJoin && !selectedEvent.isUserAttendee && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Postulación</h3>
                        
                        {selectedEvent.userJoinRequest ? (
                          <div className="space-y-3">
                            <div className="flex items-center">
                              {selectedEvent.userJoinRequest.status === 'PENDING' && (
                                <>
                                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                                  <span className="text-yellow-700 font-medium">Solicitud pendiente</span>
                                </>
                              )}
                              {selectedEvent.userJoinRequest.status === 'APPROVED' && (
                                <>
                                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                  <span className="text-green-700 font-medium">Solicitud aprobada</span>
                                </>
                              )}
                              {selectedEvent.userJoinRequest.status === 'REJECTED' && (
                                <>
                                  <X className="h-5 w-5 text-red-500 mr-2" />
                                  <span className="text-red-700 font-medium">Solicitud rechazada</span>
                                </>
                              )}
                            </div>
                            
                            {selectedEvent.userJoinRequest.status === 'PENDING' && (
                              <button
                                onClick={() => handleJoinRequest(selectedEvent.id, 'cancel')}
                                disabled={joinRequestLoading}
                                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {joinRequestLoading ? 'Cancelando...' : 'Cancelar solicitud'}
                              </button>
                            )}
                            
                            {selectedEvent.userJoinRequest.status === 'REJECTED' && (
                              <button
                                onClick={() => handleResubmitRequest(selectedEvent.id)}
                                disabled={joinRequestLoading}
                                className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                              >
                                {joinRequestLoading ? 'Reenviando...' : 'Reenviar solicitud'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleJoinRequest(selectedEvent.id, 'join')}
                            disabled={joinRequestLoading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                          >
                            {joinRequestLoading ? 'Enviando...' : 'Solicitar participación'}
                          </button>
                        )}
                      </div>
                    )}

                    {selectedEvent.isUserAttendee && (
                      <div className="mb-6 space-y-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="flex items-center mb-3">
                            <UserCheck className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-green-700 font-medium">Eres participante de este evento</span>
                          </div>
                        </div>
                        
                        {/* Confirmación de asistencia */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirmación de Asistencia</h3>
                          
                          {/* Estado actual de asistencia */}
                          {(selectedEvent.userAttendanceStatus?.attendanceConfirmed !== null || selectedEvent.userAttendanceStatus?.status) && (
                            <div className="mb-4 p-3 rounded-lg border">
                              {(selectedEvent.userAttendanceStatus?.status === 'CONFIRMED' || selectedEvent.userAttendanceStatus?.attendanceConfirmed === true) ? (
                                <div className="flex items-center text-green-700 bg-green-50 border-green-200">
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                  <span className="font-medium">Has confirmado tu asistencia</span>
                                </div>
                              ) : (selectedEvent.userAttendanceStatus?.status === 'REFUSED' || selectedEvent.userAttendanceStatus?.attendanceConfirmed === false) ? (
                                <div className="text-red-700 bg-red-50 border-red-200">
                                  <div className="flex items-center mb-2">
                                    <X className="h-5 w-5 mr-2" />
                                    <span className="font-medium">Has indicado que no podrás asistir</span>
                                  </div>
                                  {selectedEvent.userAttendanceStatus?.nonAttendanceComment && (
                                    <div className="text-sm text-red-600 ml-7">
                                      <strong>Comentario:</strong> {selectedEvent.userAttendanceStatus.nonAttendanceComment}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center text-amber-700 bg-amber-50 border-amber-200">
                                  <Clock className="h-5 w-5 mr-2" />
                                  <span className="font-medium">Asistencia pendiente de confirmación</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600 mb-3">
                              {(selectedEvent.userAttendanceStatus?.attendanceConfirmed !== null || selectedEvent.userAttendanceStatus?.status)
                                ? "Puedes cambiar tu respuesta cuando quieras:"
                                : "Por favor, confirma si podrás asistir al evento:"
                              }
                            </p>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleAttendanceConfirmation(selectedEvent.id, true)}
                                disabled={joinRequestLoading}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                                  selectedEvent.userAttendanceStatus?.status === 'CONFIRMED' ||
                                  selectedEvent.userAttendanceStatus?.attendanceConfirmed === true
                                    ? 'bg-green-700 text-white shadow-lg scale-105 border-2 border-green-600' 
                                    : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 opacity-70 hover:opacity-100'
                                }`}
                              >
                                {joinRequestLoading ? 'Confirmando...' : 'Confirmar Asistencia'}
                              </button>
                              <button
                                onClick={() => setShowNonAttendanceModal(true)}
                                disabled={joinRequestLoading}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                                  selectedEvent.userAttendanceStatus?.status === 'REFUSED' ||
                                  selectedEvent.userAttendanceStatus?.attendanceConfirmed === false
                                    ? 'bg-red-700 text-white shadow-lg scale-105 border-2 border-red-600' 
                                    : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 opacity-70 hover:opacity-100'
                                }`}
                              >
                                {joinRequestLoading ? 'Actualizando...' : 'No Podré Asistir'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lista de canciones */}
                    {(selectedEvent._count?.eventSongs || 0) > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Repertorio Musical</h3>
                        
                        {songsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {eventSongs.map((eventSong) => (
                              <div
                                key={eventSong.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{eventSong.song.title}</p>
                                  {eventSong.song.artist && (
                                    <p className="text-sm text-gray-600">{eventSong.song.artist}</p>
                                  )}
                                  {eventSong.song.duration && (
                                    <p className="text-xs text-gray-500">
                                      {Math.floor(eventSong.song.duration / 60)}:{(eventSong.song.duration % 60).toString().padStart(2, '0')}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handlePlaySong(eventSong)}
                                  className="ml-3 p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Reproducir canción"
                                >
                                  <Play className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Botón para reproducir todo el evento */}
                        <div className="mt-4">
                          <button
                            onClick={() => handlePlayEvent(selectedEvent)}
                            disabled={playLoading}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                          >
                            {playLoading ? 'Cargando...' : `▶ Reproducir todo el repertorio (${selectedEvent._count?.eventSongs || 0} canciones)`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de comentario de inasistencia */}
      {showNonAttendanceModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentario de Inasistencia</h3>
            <p className="text-gray-600 mb-4">
              Por favor, comparte brevemente por qué no podrás asistir al evento (opcional, máximo 300 caracteres):
            </p>
            
            <textarea
              value={nonAttendanceComment}
              onChange={(e) => setNonAttendanceComment(e.target.value.slice(0, 300))}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 mb-4"
              placeholder="Ej: Tengo otro compromiso familiar ese día..."
            />
            
            <div className="text-sm text-gray-500 mb-4">
              {nonAttendanceComment.length}/300 caracteres
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowNonAttendanceModal(false);
                  setNonAttendanceComment('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleAttendanceConfirmation(selectedEvent.id, false, nonAttendanceComment);
                  setShowNonAttendanceModal(false);
                  setNonAttendanceComment('');
                }}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar Inasistencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicEventsPage;
