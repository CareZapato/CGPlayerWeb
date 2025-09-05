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
  Play
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

  // Hooks para reproducir eventos como playlists
  const { playEvent, loading: playLoading } = useEventPlaylist();
  const { setCurrentSong } = usePlayerStore();
  const { replaceQueueAndPlay } = usePlaylistStore();

  useEffect(() => {
    fetchEvents();
  }, []);

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

        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-100 shadow-lg max-w-md mx-auto">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos disponibles</h3>
              <p className="text-gray-500">
                Mantente atento para futuras presentaciones y conciertos.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
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
                      
                      {/* Mostrar solicitudes como badge solo si hay más de 0 y permite solicitudes externas */}
                      {event.allowExternalJoin && (event._count?.joinRequests ?? 0) > 0 && (
                        <div className="flex items-center">
                          <div className="relative">
                            <UserPlus className="h-4 w-4 text-orange-500" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {event._count?.joinRequests ?? 0}
                            </span>
                          </div>
                        </div>
                      )}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedEvent.title}
                  </h2>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {selectedEvent.imageUrl && (
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}

                {selectedEvent.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                    <p className="text-gray-600">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Evento</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium">Fecha</p>
                          <p className="text-gray-600">{formatDate(selectedEvent.date)}</p>
                        </div>
                      </div>

                      {selectedEvent.time && (
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-blue-600 mr-3" />
                          <div>
                            <p className="font-medium">Hora</p>
                            <p className="text-gray-600">{formatTime(selectedEvent.time)}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium">Ubicación</p>
                          <p className="text-gray-600">
                            {selectedEvent.eventCity || selectedEvent.location?.city || 'Por confirmar'}
                            {selectedEvent.eventAddress && (
                              <><br />{selectedEvent.eventAddress}</>
                            )}
                          </p>
                        </div>
                      </div>

                      {selectedEvent._count && selectedEvent._count.eventSongs && selectedEvent._count.eventSongs > 0 && (
                        <div className="flex items-center">
                          <Music className="h-5 w-5 text-blue-600 mr-3" />
                          <div>
                            <p className="font-medium">Repertorio</p>
                            <p className="text-gray-600">
                              {selectedEvent._count.eventSongs} {selectedEvent._count.eventSongs === 1 ? 'canción' : 'canciones'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Solicitudes pendientes si hay */}
                      {selectedEvent.allowExternalJoin && selectedEvent._count?.joinRequests && selectedEvent._count.joinRequests > 0 && (
                        <div className="flex items-center">
                          <UserPlus className="h-5 w-5 text-orange-500 mr-3" />
                          <div>
                            <p className="font-medium">Solicitudes Pendientes</p>
                            <p className="text-gray-600">
                              {selectedEvent._count.joinRequests} solicitud{selectedEvent._count.joinRequests !== 1 ? 'es' : ''} pendiente{selectedEvent._count.joinRequests !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Organización</h3>
                    
                    {selectedEvent.location && (
                      <div className="mb-4">
                        <p className="font-medium">Coro</p>
                        <p className="text-gray-600">{selectedEvent.location.name}</p>
                        <p className="text-sm text-gray-500">
                          {selectedEvent.location.city}, {selectedEvent.location.region}
                        </p>
                      </div>
                    )}
                    
                    {/* Etiqueta de Abierto a Postulaciones */}
                    {selectedEvent.allowExternalJoin && (
                      <div className="mb-4">
                        <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Abierto a Postulaciones
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Los cantantes pueden solicitar unirse a este evento
                        </p>
                      </div>
                    )}

                    {selectedEvent.mapLink && (
                      <a
                        href={selectedEvent.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Ver en el mapa
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicEventsPage;
