import React, { useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight
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
  
  // Paginación para asistentes
  const [attendeesPage, setAttendeesPage] = useState(1);
  const attendeesPerPage = 8;
  
  // Singer management state
  // State for join requests management
  const [requestsView, setRequestsView] = useState<'pending' | 'processed'>('pending');

  // Check if user can modify event (simplified)
  const canModifyEvent = true; // For now, allow all users to reactivate

  // Función para obtener el color según el estado
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'CONFIRMADO':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-600' };
      case 'REJECTED':
      case 'RECHAZADO':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' };
      case 'PENDING':
      case 'PENDIENTE':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-600' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'text-gray-600' };
    }
  };

  // Datos para el gráfico de torta
  const chartData = useMemo(() => {
    if (!event.attendees) return [];

    const stats = {
      SOPRANO: 0,
      TENOR: 0,
      CONTRALTO: 0,
      CONFIRMADOS: 0,
      PENDIENTES: 0,
      SIN_CONFIRMAR: 0
    };

    event.attendees.forEach(attendee => {
      // Contar por estado
      const status = attendee.status.toUpperCase();
      if (status === 'CONFIRMED' || status === 'CONFIRMADO') {
        stats.CONFIRMADOS++;
      } else if (status === 'PENDING' || status === 'PENDIENTE') {
        stats.PENDIENTES++;
      } else {
        stats.SIN_CONFIRMAR++;
      }

      // Contar por tipo de voz (asumiendo que está en assignedRoles o voiceProfiles)
      // Por ahora simulamos los datos de voz
      const voiceTypes = attendee.user.assignedRoles?.map(r => r.role) || [];
      voiceTypes.forEach(voice => {
        if (voice === 'SOPRANO') stats.SOPRANO++;
        else if (voice === 'TENOR') stats.TENOR++;
        else if (voice === 'CONTRALTO') stats.CONTRALTO++;
      });
    });

    return [
      { name: 'Soprano', value: stats.SOPRANO, color: '#ec4899' },
      { name: 'Tenor', value: stats.TENOR, color: '#3b82f6' },
      { name: 'Contralto', value: stats.CONTRALTO, color: '#8b5cf6' },
      { name: 'Confirmados', value: stats.CONFIRMADOS, color: '#10b981' },
      { name: 'Pendientes', value: stats.PENDIENTES, color: '#6b7280' },
      { name: 'Sin Confirmar', value: stats.SIN_CONFIRMAR, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [event.attendees]);

  // Paginación de asistentes
  const paginatedAttendees = useMemo(() => {
    if (!event.attendees) return [];
    const startIndex = (attendeesPage - 1) * attendeesPerPage;
    return event.attendees.slice(startIndex, startIndex + attendeesPerPage);
  }, [event.attendees, attendeesPage, attendeesPerPage]);

  const totalPages = Math.ceil((event.attendees?.length || 0) / attendeesPerPage);





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
          {/* Header - Título Elegante y Minimalista */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                <h3 className="text-3xl font-light text-gray-900 tracking-tight">{event.title}</h3>
              </div>
              <div className="flex items-center space-x-3 ml-4">
                {event.isPublic ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Globe className="h-3 w-3 mr-1" />
                    Público
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                    <Lock className="h-3 w-3 mr-1" />
                    Privado
                  </span>
                )}
                {event.allowExternalJoin && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Solicitudes Abiertas
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-105"
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
              <div className="space-y-6">
                {/* Header con estadísticas */}
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">
                    Asistentes ({event.attendees?.length || 0})
                  </h4>
                  {totalPages > 1 && (
                    <div className="text-sm text-gray-500">
                      Página {attendeesPage} de {totalPages}
                    </div>
                  )}
                </div>

                {/* Lista de asistentes con diseño aplanado */}
                {paginatedAttendees && paginatedAttendees.length > 0 ? (
                  <div className="space-y-2">
                    {paginatedAttendees.map((attendee, index) => {
                      const statusColors = getStatusColor(attendee.status);
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${statusColors.bg} ${statusColors.border} transition-all hover:shadow-sm`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${statusColors.icon === 'text-emerald-600' ? 'bg-emerald-500' : statusColors.icon === 'text-red-600' ? 'bg-red-500' : statusColors.icon === 'text-amber-600' ? 'bg-amber-500' : 'bg-gray-500'}`}></div>
                            <div className="flex-1">
                              <p className={`font-medium ${statusColors.text}`}>
                                {attendee.user.firstName} {attendee.user.lastName}
                              </p>
                              {attendee.user.location && (
                                <p className="text-xs text-gray-600">
                                  {attendee.user.location.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors.bg} ${statusColors.text}`}>
                              {attendee.status === 'CONFIRMED' ? 'Confirmado' : 
                               attendee.status === 'PENDING' ? 'Pendiente' : 
                               attendee.status === 'REJECTED' ? 'Rechazado' : attendee.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay asistentes confirmados</p>
                  </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setAttendeesPage(prev => Math.max(1, prev - 1))}
                      disabled={attendeesPage === 1}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </button>
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setAttendeesPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            page === attendeesPage
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setAttendeesPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={attendeesPage === totalPages}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                )}

                {/* Gráfico de composición del coro */}
                {chartData.length > 0 && (
                  <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-3"></div>
                      Composición del Coro
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Gráfico de torta simple con barras */}
                      <div className="space-y-3">
                        {chartData.map((item, index) => {
                          const total = chartData.reduce((sum, d) => sum + d.value, 0);
                          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                          return (
                            <div key={index} className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-gray-700">{item.name}</span>
                                  <span className="text-gray-500">{item.value} ({percentage}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      backgroundColor: item.color,
                                      width: `${percentage}%`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Resumen general */}
                      <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {event.attendees?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 mb-4">Total de Asistentes</div>
                        <div className="space-y-2 text-sm">
                          {chartData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-gray-600">{item.name.split(' - ')[0]}:</span>
                              <span className="font-medium text-gray-900">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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
