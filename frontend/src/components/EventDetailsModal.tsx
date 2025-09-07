import React, { useState } from 'react';
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
  MessageSquare
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
  // State for join requests management
  const [requestsView, setRequestsView] = useState<'pending' | 'processed'>('pending');

  // Check if user can modify event (simplified)
  const canModifyEvent = true; // For now, allow all users to reactivate





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
      
      console.log(`📝 Procesando solicitud: ${status} para request ${requestId}`);
      
      const response_data = await fetch(getApiUrl(`/events/${event.id}/join-requests/${requestId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, response })
      });

      if (response_data.ok) {
        const result = await response_data.json();
        console.log(`✅ Solicitud ${status.toLowerCase()} exitosamente:`, result);
        onEventUpdated();
      } else {
        const errorData = await response_data.json();
        console.error(`❌ Error al ${status.toLowerCase()} solicitud:`, errorData);
        throw new Error(errorData.message || `Error al ${status.toLowerCase()} la solicitud`);
      }
    } catch (error) {
      console.error('Error responding to join request:', error);
      throw error; // Re-throw para que el componente padre pueda manejarlo si es necesario
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



            {activeTab === 'requests' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-medium text-gray-900">
                    Solicitudes de Unión
                  </h4>
                  <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setRequestsView('pending')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        requestsView === 'pending'
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Pendientes ({event.joinRequests?.filter(r => r.status === 'PENDING').length || 0})
                    </button>
                    <button
                      onClick={() => setRequestsView('processed')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        requestsView === 'processed'
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Procesadas ({event.joinRequests?.filter(r => r.status !== 'PENDING').length || 0})
                    </button>
                  </div>
                </div>

                {(() => {
                  const filteredRequests = event.joinRequests?.filter(request => 
                    requestsView === 'pending' ? request.status === 'PENDING' : request.status !== 'PENDING'
                  ) || [];

                  return filteredRequests.length > 0 ? (
                    <div className="space-y-4">
                      {filteredRequests.map((request) => (
                        <div
                          key={request.id}
                          className={`border rounded-lg p-4 transition-all ${
                            request.status === 'APPROVED' 
                              ? 'border-green-200 bg-green-50' 
                              : request.status === 'REJECTED' 
                                ? 'border-red-200 bg-red-50' 
                                : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className={`p-2 rounded-lg ${
                                  request.status === 'APPROVED' 
                                    ? 'bg-green-100' 
                                    : request.status === 'REJECTED' 
                                      ? 'bg-red-100' 
                                      : 'bg-blue-100'
                                }`}>
                                  <User className={`h-5 w-5 ${
                                    request.status === 'APPROVED' 
                                      ? 'text-green-600' 
                                      : request.status === 'REJECTED' 
                                        ? 'text-red-600' 
                                        : 'text-blue-600'
                                  }`} />
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
                                  <div className={`rounded-lg p-3 ${
                                    request.status === 'APPROVED' 
                                      ? 'bg-green-100' 
                                      : request.status === 'REJECTED' 
                                        ? 'bg-red-100' 
                                        : 'bg-gray-50'
                                  }`}>
                                    <div className="flex items-start space-x-2">
                                      <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                      <p className="text-sm text-gray-700">{request.message}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="ml-11 text-xs text-gray-500">
                                Solicitud enviada el {new Date(request.createdAt).toLocaleDateString('es-ES')}
                                {request.status !== 'PENDING' && (
                                  <span className="ml-2">
                                    • {request.status === 'APPROVED' ? 'Aceptada' : 'Rechazada'}
                                  </span>
                                )}
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
                                <div className="flex flex-col space-y-2">
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
                                  {request.status === 'REJECTED' && canModifyEvent && (
                                    <button
                                      onClick={() => handleJoinRequestResponse(request.id, 'APPROVED')}
                                      disabled={loading}
                                      className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 disabled:opacity-50"
                                    >
                                      Reactivar
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        {requestsView === 'pending' 
                          ? 'No hay solicitudes pendientes' 
                          : 'No hay solicitudes procesadas'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
