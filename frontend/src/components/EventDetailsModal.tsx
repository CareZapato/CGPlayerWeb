import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  Globe,
  Lock,
  UserPlus,
  ExternalLink,
  Mail,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  Search,
  UserCheck,
  Music
} from 'lucide-react';
import { getApiUrl } from '../config/api';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  eventCity?: string;
  eventAddress?: string;
  mapLink?: string;
  imageUrl?: string;
  isPublic: boolean;
  allowExternalJoin: boolean;
  creator?: {
    firstName: string;
    lastName: string;
  };
  _count?: {
    attendees: number;
    joinRequests: number;
  };
  attendees?: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      location?: { name: string };
      assignedRoles: Array<{ role: string }>;
    };
    addedByUser: {
      firstName: string;
      lastName: string;
    };
    status: string;
  }>;
  joinRequests?: Array<{
    id: string;
    user: {
      firstName: string;
      lastName: string;
      assignedRoles: Array<{ role: string }>;
    };
    message?: string;
    status: string;
    createdAt: string;
  }>;
}

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

interface Location {
  id: string;
  name: string;
  city: string;
  singersCount: number;
}

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onEventUpdated: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ 
  event, 
  onClose, 
  onEventUpdated 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'attendees' | 'requests' | 'singers'>('info');
  const [loading, setLoading] = useState(false);
  
  // Singer management state
  const [singers, setSingers] = useState<Singer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedSingers, setSelectedSingers] = useState<Set<string>>(new Set());
  const [loadingSingers, setLoadingSingers] = useState(false);
  const [singersPage, setSingersPage] = useState(1);
  const [singersTotal, setSingersTotal] = useState(0);
  const [showGroupSelection, setShowGroupSelection] = useState(false);

  // Load initial data when singers tab is opened
  useEffect(() => {
    if (activeTab === 'singers') {
      loadLocations();
      loadSingers();
    }
  }, [activeTab]);

  // Load singers when filters change
  useEffect(() => {
    if (activeTab === 'singers') {
      loadSingers();
    }
  }, [searchTerm, selectedLocation, selectedRole, singersPage]);

  const loadLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/events/locations/singers'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLocations(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadSingers = async () => {
    try {
      setLoadingSingers(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: singersPage.toString(),
        limit: '20'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (selectedRole) params.append('role', selectedRole);

      const response = await fetch(getApiUrl(`/events/search/singers?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSingers(data.data.singers);
          setSingersTotal(data.data.total);
        }
      }
    } catch (error) {
      console.error('Error loading singers:', error);
    } finally {
      setLoadingSingers(false);
    }
  };

  const handleAddSingers = async () => {
    if (selectedSingers.size === 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/events/${event.id}/attendees`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: Array.from(selectedSingers)
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedSingers(new Set());
          onEventUpdated();
          // Switch to attendees tab to see the results
          setActiveTab('attendees');
        }
      }
    } catch (error) {
      console.error('Error adding singers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocationSingers = async (locationId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/events/${event.id}/attendees/location`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locationId,
          role: selectedRole || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onEventUpdated();
          setActiveTab('attendees');
        }
      }
    } catch (error) {
      console.error('Error adding location singers:', error);
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

  const handleJoinRequestResponse = async (requestId: string, status: 'APPROVED' | 'REJECTED', response?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response_data = await fetch(`/api/events/${event.id}/join-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, response })
      });

      if (response_data.ok) {
        onEventUpdated();
      }
    } catch (error) {
      console.error('Error responding to join request:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'info' as const, label: 'Información', icon: Calendar },
    { 
      id: 'attendees' as const, 
      label: 'Asistentes', 
      icon: Users, 
      badge: event._count?.attendees || 0 
    },
    { 
      id: 'singers' as const, 
      label: 'Agregar Cantantes', 
      icon: UserPlus
    },
    { 
      id: 'requests' as const, 
      label: 'Solicitudes', 
      icon: Mail, 
      badge: event.joinRequests?.filter(r => r.status === 'PENDING').length || 0 
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{event.title}</h3>
              <div className="flex items-center space-x-4 mt-2">
                {event.isPublic ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Globe className="h-4 w-4 mr-1" />
                    Público
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <Lock className="h-4 w-4 mr-1" />
                    Privado
                  </span>
                )}
                {event.allowExternalJoin && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Solicitudes Abiertas
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Event Image */}
          {event.imageUrl && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs font-medium px-2 py-1 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date & Time */}
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fecha</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </div>

                  {event.time && (
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Hora</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatTime(event.time)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {(event.eventCity || event.eventAddress) && (
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <MapPin className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ubicación</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {event.eventCity}
                          {event.eventAddress && `, ${event.eventAddress}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Creator */}
                  {event.creator && (
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <User className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Creado por</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {event.creator.firstName} {event.creator.lastName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Descripción</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                    </div>
                  </div>
                )}

                {/* Map Link */}
                {event.mapLink && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Ubicación en Mapa</h4>
                    <a
                      href={event.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en Google Maps
                    </a>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendees' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Asistentes Confirmados ({event.attendees?.length || 0})
                </h4>
                {event.attendees && event.attendees.length > 0 ? (
                  <div className="space-y-3">
                    {event.attendees.map((attendee, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {attendee.user.firstName} {attendee.user.lastName}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              {attendee.user.location && (
                                <span>{attendee.user.location.name}</span>
                              )}
                              <span>•</span>
                              <span>
                                {attendee.user.assignedRoles.map(r => r.role).join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {attendee.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Agregado por {attendee.addedByUser.firstName} {attendee.addedByUser.lastName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay asistentes confirmados</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'singers' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-medium text-gray-900">
                    Agregar Cantantes al Evento
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowGroupSelection(!showGroupSelection)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        showGroupSelection
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {showGroupSelection ? 'Selección Individual' : 'Selección por Grupo'}
                    </button>
                  </div>
                </div>

                {!showGroupSelection ? (
                  /* Individual Singer Selection */
                  <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search Input */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* Location Filter */}
                        <select
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Todas las ubicaciones</option>
                          {locations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name} - {location.city}
                            </option>
                          ))}
                        </select>

                        {/* Role Filter */}
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Todos los roles</option>
                          <option value="SOPRANO">Soprano</option>
                          <option value="ALTO">Alto</option>
                          <option value="TENOR">Tenor</option>
                          <option value="BASS">Bajo</option>
                        </select>
                      </div>
                    </div>

                    {/* Selected Singers Summary */}
                    {selectedSingers.size > 0 && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <UserCheck className="h-5 w-5 text-indigo-600" />
                            <span className="font-medium text-indigo-900">
                              {selectedSingers.size} cantante(s) seleccionado(s)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedSingers(new Set())}
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              Limpiar selección
                            </button>
                            <button
                              onClick={handleAddSingers}
                              disabled={loading}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {loading ? 'Agregando...' : 'Agregar Seleccionados'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Singers List */}
                    {loadingSingers ? (
                      <div className="text-center py-12">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Music className="h-5 w-5 text-indigo-600 animate-pulse" />
                          </div>
                        </div>
                        <p className="mt-4 text-gray-600">Cargando cantantes...</p>
                      </div>
                    ) : singers.length > 0 ? (
                      <div className="space-y-3">
                        {singers.map((singer) => (
                          <div
                            key={singer.id}
                            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedSingers.has(singer.id)
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => {
                              const newSelected = new Set(selectedSingers);
                              if (newSelected.has(singer.id)) {
                                newSelected.delete(singer.id);
                              } else {
                                newSelected.add(singer.id);
                              }
                              setSelectedSingers(newSelected);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                selectedSingers.has(singer.id)
                                  ? 'bg-indigo-100'
                                  : 'bg-gray-100'
                              }`}>
                                <User className={`h-5 w-5 ${
                                  selectedSingers.has(singer.id)
                                    ? 'text-indigo-600'
                                    : 'text-gray-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {singer.firstName} {singer.lastName}
                                </p>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span>{singer.location.name}</span>
                                  <span>•</span>
                                  <span>{singer.assignedRoles.map(r => r.role).join(', ')}</span>
                                  <span>•</span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    singer.isActive 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {singer.isActive ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {selectedSingers.has(singer.id) ? (
                                <UserCheck className="h-5 w-5 text-indigo-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No se encontraron cantantes con los filtros aplicados</p>
                      </div>
                    )}

                    {/* Pagination */}
                    {singersTotal > 0 && (
                      <div className="flex items-center justify-between pt-4">
                        <p className="text-sm text-gray-600">
                          Mostrando {Math.min(singersPage * 20, singersTotal)} de {singersTotal} cantantes
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSingersPage(Math.max(1, singersPage - 1))}
                            disabled={singersPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                          >
                            Anterior
                          </button>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded text-sm">
                            {singersPage}
                          </span>
                          <button
                            onClick={() => setSingersPage(singersPage + 1)}
                            disabled={singersPage * 20 >= singersTotal}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Group/Location Selection */
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-yellow-800">Selección por Grupo</h5>
                          <p className="text-sm text-yellow-700 mt-1">
                            Selecciona una ubicación para agregar todos los cantantes activos de esa localidad al evento.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Role Filter for Group Selection */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtrar por rol (opcional)
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="block w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Todos los roles</option>
                        <option value="SOPRANO">Solo Sopranos</option>
                        <option value="ALTO">Solo Altos</option>
                        <option value="TENOR">Solo Tenores</option>
                        <option value="BASS">Solo Bajos</option>
                      </select>
                    </div>

                    {/* Locations Grid */}
                    {locations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {locations.map((location) => (
                          <div
                            key={location.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-gray-900">{location.name}</h5>
                                <p className="text-sm text-gray-600">{location.city}</p>
                              </div>
                              <div className="p-2 bg-indigo-100 rounded-lg">
                                <Users className="h-5 w-5 text-indigo-600" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                {location.singersCount} cantantes
                              </span>
                              <button
                                onClick={() => handleAddLocationSingers(location.id)}
                                disabled={loading}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {loading ? 'Agregando...' : 'Agregar Grupo'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No hay ubicaciones disponibles</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Solicitudes de Unión
                </h4>
                {event.joinRequests && event.joinRequests.length > 0 ? (
                  <div className="space-y-4">
                    {event.joinRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {request.user.firstName} {request.user.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {request.user.assignedRoles.map(r => r.role).join(', ')}
                                </p>
                              </div>
                            </div>
                            
                            {request.message && (
                              <div className="ml-11 mb-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-start space-x-2">
                                    <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <p className="text-sm text-gray-700">{request.message}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="ml-11 text-xs text-gray-500">
                              Solicitud enviada el {new Date(request.createdAt).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                          
                          <div className="ml-4 flex flex-col space-y-2">
                            {request.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleJoinRequestResponse(request.id, 'APPROVED')}
                                  disabled={loading}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aceptar
                                </button>
                                <button
                                  onClick={() => handleJoinRequestResponse(request.id, 'REJECTED')}
                                  disabled={loading}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rechazar
                                </button>
                              </>
                            ) : (
                              <span 
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  request.status === 'APPROVED' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {request.status === 'APPROVED' ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {request.status === 'APPROVED' ? 'Aceptada' : 'Rechazada'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay solicitudes de unión</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
