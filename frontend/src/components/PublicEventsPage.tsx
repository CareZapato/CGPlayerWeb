import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Music, Eye, UserPlus } from 'lucide-react';

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
  location?: Location;
  creator?: Creator;
  eventCity?: string;
  eventAddress?: string;
  time?: string;
  mapLink?: string;
  imageUrl?: string;
  allowExternalJoin?: boolean;
  _count?: {
    eventSongs: number;
    joinRequests?: number;
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

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Eventos del Coro
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre las próximas presentaciones y conciertos de nuestro coro. 
            Únete a nosotros en estas experiencias musicales únicas.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-24 w-24 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay eventos programados</h3>
            <p className="mt-2 text-gray-500">
              Mantente atento para futuras presentaciones y conciertos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                {/* Imagen del evento */}
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Music className="h-16 w-16 text-white" />
                  </div>
                )}

                <div className="p-6">
                  {/* Título */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Descripción */}
                  {event.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {/* Fecha y hora */}
                  <div className="flex items-center text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {formatDate(event.date)}
                      {event.time && ` - ${formatTime(event.time)}`}
                    </span>
                  </div>

                  {/* Ubicación */}
                  <div className="flex items-center text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {event.eventCity || event.location?.city || 'Ubicación por confirmar'}
                      {event.eventAddress && `, ${event.eventAddress}`}
                    </span>
                  </div>

                  {/* Información adicional */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      {/* Mostrar contador de canciones solo si hay canciones */}
                      {event._count?.eventSongs && event._count.eventSongs > 0 && (
                        <div className="flex items-center text-gray-500">
                          <Music className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {event._count.eventSongs} canción{event._count.eventSongs !== 1 ? 'es' : ''}
                          </span>
                        </div>
                      )}
                      
                      {/* Mostrar badge de solicitudes solo si hay solicitudes pendientes */}
                      {event.allowExternalJoin && event._count?.joinRequests && event._count.joinRequests > 0 && (
                        <div className="flex items-center">
                          <div className="relative">
                            <UserPlus className="h-4 w-4 text-orange-500" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {event._count.joinRequests}
                            </span>
                          </div>
                          <span className="text-xs text-orange-600 ml-1">Solicitudes</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center text-blue-600">
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="text-sm">Ver detalles</span>
                    </div>
                  </div>
                  
                  {/* Etiqueta de "Abierto a Postulaciones" */}
                  {event.allowExternalJoin && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Abierto a Postulaciones
                      </div>
                    </div>
                  )}
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
                              {selectedEvent._count.eventSongs} canción{selectedEvent._count.eventSongs !== 1 ? 'es' : ''}
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
