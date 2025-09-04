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
  time?: string;
  category: string;
  eventCity?: string;
  eventAddress?: string;
  country?: string;
  mapLink?: string;
  imageUrl?: string;
  isPublic: boolean;
  allowExternalJoin: boolean;
  location: Location | null;
  attendees?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  eventPlaylists?: Array<{
    id: string;
    playlistId: string;
    playlist: {
      id: string;
      name: string;
    };
  }>;
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
  joinRequests?: Array<{
    id: string;
    userId: string;
    status: string;
    message?: string;
    user: {
      firstName: string;
      lastName: string;
      locationId?: string;
    };
  }>;
}

const EventManagement: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState({
    category: '',
    locationId: '',
    upcoming: true
  });

  const { user, token } = useAuthStore();

  // Fetch events for management
  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['events-management', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.locationId) params.append('locationId', filter.locationId);
      if (filter.upcoming) params.append('upcoming', 'true');

      const response = await fetch(`/api/events/management/all?${params}`, {
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
            onClick={() => setShowCreateModal(true)}
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

      {/* Create Event Modal */}
      {showCreateModal && (
        <EventFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          locations={locations || []}
          onSuccess={refetchEvents}
        />
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <EventFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          locations={locations || []}
          onSuccess={refetchEvents}
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

// Modal para crear/editar eventos
const EventFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  locations: Location[];
  onSuccess: () => void;
}> = ({ isOpen, onClose, event, locations, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    category: 'Culto',
    locationId: '',
    eventCity: '',
    eventAddress: '',
    country: 'Chile',
    mapLink: '',
    isPublic: true,
    allowExternalJoin: false
  });

  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [selectedChoirs, setSelectedChoirs] = useState<string[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'attendees' | 'content'>('basic');

  const { token } = useAuthStore();

  // Fetch data for the form
  const { data: singers } = useQuery({
    queryKey: ['singers-by-location'],
    queryFn: async () => {
      const response = await fetch('/api/events/locations/singers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch singers');
      const result = await response.json();
      return result.data;
    },
    enabled: isOpen
  });

  const { data: playlists } = useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const response = await fetch('/api/playlists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch playlists');
      const result = await response.json();
      return result.data;
    },
    enabled: isOpen
  });

  const { data: songs } = useQuery({
    queryKey: ['songs'],
    queryFn: async () => {
      const response = await fetch('/api/songs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch songs');
      const result = await response.json();
      return result.data;
    },
    enabled: isOpen
  });

  React.useEffect(() => {
    if (event) {
      const eventDate = new Date(event.date);
      setFormData({
        title: event.title,
        description: event.description || '',
        date: eventDate.toISOString().split('T')[0],
        time: event.time || eventDate.toTimeString().slice(0, 5),
        category: event.category || 'Culto',
        locationId: event.location?.id || '',
        eventCity: event.eventCity || '',
        eventAddress: event.eventAddress || '',
        country: event.country || 'Chile',
        mapLink: event.mapLink || '',
        isPublic: event.isPublic ?? true,
        allowExternalJoin: event.allowExternalJoin ?? false
      });
      
      // Cargar asistentes existentes
      setSelectedAttendees(event.attendees?.map(a => a.userId) || []);
      
      // Cargar playlists y canciones existentes
      setSelectedPlaylists(event.eventPlaylists?.map(ep => ep.playlistId) || []);
      setSelectedSongs(event.eventSongs?.map(es => es.song.id) || []);
    } else {
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        category: 'Culto',
        locationId: '',
        eventCity: '',
        eventAddress: '',
        country: 'Chile',
        mapLink: '',
        isPublic: true,
        allowExternalJoin: false
      });
      setSelectedAttendees([]);
      setSelectedChoirs([]);
      setSelectedPlaylists([]);
      setSelectedSongs([]);
      setImageFile(null);
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Datos básicos del evento
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('time', formData.time);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('eventCity', formData.eventCity);
      formDataToSend.append('eventAddress', formData.eventAddress);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('mapLink', formData.mapLink);
      formDataToSend.append('isPublic', formData.isPublic.toString());
      formDataToSend.append('allowExternalJoin', formData.allowExternalJoin.toString());
      
      if (formData.locationId) {
        formDataToSend.append('locationId', formData.locationId);
      }

      // Imagen
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      // Asistentes
      formDataToSend.append('attendeeUserIds', JSON.stringify(selectedAttendees));
      formDataToSend.append('attendeeLocationIds', JSON.stringify(selectedChoirs));
      
      // Contenido musical
      formDataToSend.append('playlistIds', JSON.stringify(selectedPlaylists));
      formDataToSend.append('songIds', JSON.stringify(selectedSongs));

      const url = event ? `/api/events/${event.id}` : '/api/events';
      const method = event ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Error al guardar el evento');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el evento');
    }
  };

  const handleAddEntireChoir = (locationId: string) => {
    if (selectedChoirs.includes(locationId)) {
      setSelectedChoirs(prev => prev.filter(id => id !== locationId));
    } else {
      setSelectedChoirs(prev => [...prev, locationId]);
    }
  };

  const handleToggleAttendee = (userId: string) => {
    if (selectedAttendees.includes(userId)) {
      setSelectedAttendees(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedAttendees(prev => [...prev, userId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {event ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'basic'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Información Básica
              </button>
              <button
                onClick={() => setActiveTab('attendees')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendees'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Asistentes ({selectedAttendees.length + selectedChoirs.reduce((total, choirId) => 
                  total + (singers?.find((s: any) => s.id === choirId)?.users?.length || 0), 0)})
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contenido Musical ({selectedPlaylists.length + selectedSongs.length})
              </button>
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[60vh]">
            {/* Tab: Información Básica */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título del Evento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre del evento"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Culto">Culto</option>
                      <option value="Ensayo">Ensayo</option>
                      <option value="Presentación">Presentación</option>
                      <option value="Especial">Especial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación Organizadora (Coro)
                    </label>
                    <select
                      value={formData.locationId}
                      onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar coro organizador...</option>
                      {locations?.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} - {location.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad del Evento
                    </label>
                    <input
                      type="text"
                      value={formData.eventCity}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventCity: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ciudad donde se realizará"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección del Evento
                  </label>
                  <input
                    type="text"
                    value={formData.eventAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventAddress: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dirección completa del evento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enlace de Google Maps
                  </label>
                  <input
                    type="url"
                    value={formData.mapLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, mapLink: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción del evento..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen del Evento
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Evento público (visible para todos los cantantes)</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.allowExternalJoin}
                        onChange={(e) => setFormData(prev => ({ ...prev, allowExternalJoin: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Permitir solicitudes de unión externa</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Asistentes */}
            {activeTab === 'attendees' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Asistentes</h3>
                  
                  <div className="space-y-6">
                    {/* Agregar coros completos */}
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-3">Agregar Coros Completos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {singers?.map((location: any) => (
                          <div key={location.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h5 className="font-medium text-gray-900">{location.name}</h5>
                                <p className="text-sm text-gray-600">{location.city} - {location.users.length} cantantes</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddEntireChoir(location.id)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  selectedChoirs.includes(location.id)
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {selectedChoirs.includes(location.id) ? 'Agregado' : 'Agregar Coro'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Agregar cantantes individuales */}
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-3">Agregar Cantantes Individuales</h4>
                      <div className="space-y-4">
                        {singers?.map((location: any) => (
                          <div key={location.id} className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-3">{location.name} - {location.city}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {location.users.map((user: any) => (
                                <label key={user.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedAttendees.includes(user.id)}
                                    onChange={() => handleToggleAttendee(user.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {user.firstName} {user.lastName}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Contenido Musical */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contenido Musical del Evento</h3>
                  
                  {/* Playlists */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-800 mb-3">Playlists</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {playlists?.map((playlist: any) => (
                        <label key={playlist.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedPlaylists.includes(playlist.id)}
                            onChange={() => {
                              if (selectedPlaylists.includes(playlist.id)) {
                                setSelectedPlaylists(prev => prev.filter(id => id !== playlist.id));
                              } else {
                                setSelectedPlaylists(prev => [...prev, playlist.id]);
                              }
                            }}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{playlist.name}</p>
                            {playlist.description && (
                              <p className="text-sm text-gray-600">{playlist.description}</p>
                            )}
                            <p className="text-xs text-gray-500">{playlist.items?.length || 0} canciones</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Canciones individuales */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Canciones Individuales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {songs?.map((song: any) => (
                        <label key={song.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={selectedSongs.includes(song.id)}
                            onChange={() => {
                              if (selectedSongs.includes(song.id)) {
                                setSelectedSongs(prev => prev.filter(id => id !== song.id));
                              } else {
                                setSelectedSongs(prev => [...prev, song.id]);
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{song.title}</p>
                            {song.artist && (
                              <p className="text-xs text-gray-600">{song.artist}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {event ? 'Actualizar Evento' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
