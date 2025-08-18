import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import './EventManagement.css';

interface Location {
  id: string;
  name: string;
  type: string;
  city: string;
  region: string;
  address?: string;
  phone?: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  voiceType: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  location: Location | null;
  eventSongs: Array<{
    id: string;
    order: number;
    notes: string | null;
    song: Song;
  }>;
  soloists: Array<{
    id: string;
    soloistType: string;
    notes: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
    song: Song | null;
  }>;
}

const EventManagement: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filter, setFilter] = useState({
    category: '',
    locationId: '',
    upcoming: true
  });

  const { user, token } = useAuthStore();

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.locationId) params.append('locationId', filter.locationId);
      if (filter.upcoming) params.append('upcoming', 'true');

      const response = await fetch(`/api/events?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch events');
      const result = await response.json();
      return result.data as Event[];
    }
  });

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch locations');
      const result = await response.json();
      return result.data as Location[];
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Culto': 'bg-blue-100 text-blue-800',
      'Ensayo': 'bg-green-100 text-green-800',
      'Presentación': 'bg-purple-100 text-purple-800',
      'Especial': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const canManageEvents = user?.roles?.some(r => r.role === 'ADMIN') || false;

  if (eventsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h1>
        {canManageEvents && (
          <button
            onClick={() => alert('Funcionalidad de crear evento próximamente')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Evento</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={filter.category}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              <option value="Culto">Culto</option>
              <option value="Ensayo">Ensayo</option>
              <option value="Presentación">Presentación</option>
              <option value="Especial">Especial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <select
              value={filter.locationId}
              onChange={(e) => setFilter(prev => ({ ...prev, locationId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las ubicaciones</option>
              {locations?.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} - {location.city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filter.upcoming}
                onChange={(e) => setFilter(prev => ({ ...prev, upcoming: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Solo próximos eventos</span>
            </label>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map(event => (
          <div key={event.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{event.title}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                </div>
                {canManageEvents && (
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEditModal(true);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(event.date)}</span>
                </div>

                {event.location && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location.name}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span>{event.eventSongs.length} canciones</span>
                </div>

                {event.soloists.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{event.soloists.length} solista{event.soloists.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {event.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{event.description}</p>
              )}

              <button
                onClick={() => setSelectedEvent(event)}
                className="mt-4 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-md transition-colors text-sm font-medium"
              >
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {events?.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay eventos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canManageEvents ? 'Comienza creando tu primer evento.' : 'No hay eventos programados actualmente.'}
          </p>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && !showEditModal && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          canManage={canManageEvents}
          onEdit={() => setShowEditModal(true)}
        />
      )}
    </div>
  );
};

// Event Detail Modal Component
interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
  canManage: boolean;
  onEdit: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, canManage, onEdit }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 lg:p-4 z-50">
      <div className="bg-white rounded-lg max-w-full lg:max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2 lg:mx-auto">
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{event.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Información General</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Fecha:</span> {formatDate(event.date)}</p>
                <p><span className="font-medium">Categoría:</span> {event.category}</p>
                {event.location && (
                  <p><span className="font-medium">Ubicación:</span> {event.location.name} - {event.location.city}</p>
                )}
                {event.description && (
                  <p><span className="font-medium">Descripción:</span> {event.description}</p>
                )}
              </div>
            </div>

            {event.eventSongs.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Repertorio ({event.eventSongs.length} canciones)</h3>
                <div className="space-y-2">
                  {event.eventSongs.map((eventSong, index) => (
                    <div key={eventSong.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium text-sm">{index + 1}. {eventSong.song.title}</span>
                        {eventSong.song.artist && <span className="text-gray-600 text-sm"> - {eventSong.song.artist}</span>}
                        {eventSong.notes && <p className="text-xs text-gray-500 mt-1">{eventSong.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.soloists.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Solistas ({event.soloists.length})</h3>
                <div className="space-y-2">
                  {event.soloists.map(soloist => (
                    <div key={soloist.id} className="p-2 bg-gray-50 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{soloist.user.firstName} {soloist.user.lastName}</p>
                          <p className="text-xs text-gray-600">Tipo: {soloist.soloistType}</p>
                          {soloist.song && (
                            <p className="text-xs text-gray-600">Canción: {soloist.song.title}</p>
                          )}
                          {soloist.notes && (
                            <p className="text-xs text-gray-500 mt-1">{soloist.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cerrar
            </button>
            {canManage && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Editar Evento
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
