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

interface VoiceProfile {
  voiceType: string;
  isPrimary: boolean;
}

interface EventVoice {
  id: string;
  name: string;
  status: string;
  voiceProfiles: VoiceProfile[];
  primaryVoice?: {
    voiceType: string;
  };
}

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
      voiceProfiles?: VoiceProfile[];
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
  initialTab?: 'info' | 'attendees' | 'requests' | 'singers'; // Nueva prop opcional
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ 
  event, 
  onClose, 
  onEventUpdated,
  initialTab = 'info' // Por defecto 'info' si no se especifica
}) => {
  
  // 🐛 DEBUG: Log completo del objeto event que llega como prop
  console.log('🎭 [SOLICITUDES DEBUG] Event prop recibido:', {
    id: event.id,
    title: event.title,
    hasJoinRequests: !!event.joinRequests,
    joinRequestsLength: event.joinRequests?.length || 0,
    joinRequestsStatus: event.joinRequests?.map(r => ({id: r.id, status: r.status, user: r.user.firstName + ' ' + r.user.lastName})) || [],
    timestamp: new Date().toLocaleTimeString()
  });
  
  // 🐛 DEBUG: Verificar estructura específica del primer attendee si existe
  if (event.attendees && event.attendees.length > 0) {
    const firstAttendee = event.attendees[0];
    console.log('👤 [FRONTEND DEBUG] Primer attendee raw:', {
      status: firstAttendee.status,
      user: firstAttendee.user,
      userKeys: Object.keys(firstAttendee.user),
      hasVoiceProfiles: 'voiceProfiles' in firstAttendee.user,
      voiceProfilesValue: firstAttendee.user.voiceProfiles
    });
  }

  // Estado para las voces obtenidas del endpoint específico
  const [eventVoices, setEventVoices] = useState<EventVoice[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  
  // Función para obtener voces del endpoint específico
  const fetchEventVoices = React.useCallback(async () => {
    try {
      console.log('🎤 Obteniendo voces del evento...');
      const response = await fetch(getApiUrl(`/events/${event.id}/voices`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Voces recibidas del backend:', data);
        if (data.success) {
          setEventVoices(data.data.voicesData);
          setVoicesLoaded(true);
        }
      }
    } catch (error) {
      console.error('❌ Error obteniendo voces:', error);
    }
  }, [event.id]);

  // Llamar al endpoint de voces cuando se monta el componente
  React.useEffect(() => {
    fetchEventVoices();
  }, [fetchEventVoices]);
  const [activeTab, setActiveTab] = useState<'info' | 'attendees' | 'requests' | 'singers'>(initialTab || 'info');
  const [loading, setLoading] = useState(false);
  
  // Estado local para las solicitudes de unión para forzar re-render
  const [localJoinRequests, setLocalJoinRequests] = useState(event.joinRequests || []);
  
  // Sincronizar las solicitudes locales cuando cambie el prop event
  React.useEffect(() => {
    console.log(`🔄 [SYNC DEBUG] Syncing localJoinRequests:`, event.joinRequests?.length || 0);
    setLocalJoinRequests(event.joinRequests || []);
  }, [event.joinRequests, event.id]); // Agregar event.id como dependencia
  
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
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600' };
      case 'REJECTED':
      case 'RECHAZADO':
      case 'REFUSED':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' };
      case 'PENDING':
      case 'PENDIENTE':
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'text-gray-600' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'text-gray-600' };
    }
  };

  // Función para calcular la composición del coro
  const calculateChoirComposition = useMemo(() => {
    console.log('🎵 INICIO - Calculando composición del coro');
    
    // Si tenemos datos del endpoint específico de voces, usarlos
    if (voicesLoaded && eventVoices.length > 0) {
      console.log('🎤 Usando datos del endpoint /voices');
      console.log('🎵 Event voices data:', eventVoices);
      
      // Filtrar solo los confirmados
      const confirmedVoices = eventVoices.filter(v => v.status.toUpperCase() === 'CONFIRMED');
      console.log('✅ Confirmados con voces:', confirmedVoices.length);
      
      // Contar voces
      const voiceCounts = {
        SOPRANO: 0,
        MESOSOPRANO: 0,
        CONTRALTO: 0,
        TENOR: 0,
        BARITONO: 0,
        BAJO: 0
      };
      
      confirmedVoices.forEach((voiceData, index) => {
        console.log(`👤 Usuario ${index + 1}: ${voiceData.name}`);
        console.log('🎤 VoiceProfiles:', voiceData.voiceProfiles);
        console.log('🎯 Voz principal:', voiceData.primaryVoice);
        
        if (voiceData.primaryVoice) {
          const voiceType = voiceData.primaryVoice.voiceType;
          if (voiceType === 'SOPRANO') voiceCounts.SOPRANO++;
          else if (voiceType === 'MESOSOPRANO') voiceCounts.MESOSOPRANO++;
          else if (voiceType === 'CONTRALTO') voiceCounts.CONTRALTO++;
          else if (voiceType === 'TENOR') voiceCounts.TENOR++;
          else if (voiceType === 'BARITONO') voiceCounts.BARITONO++;
          else if (voiceType === 'BAJO') voiceCounts.BAJO++;
          console.log(`✅ Contado: ${voiceType}`);
        } else {
          console.log('❌ No tiene voz principal');
        }
      });
      
      console.log('🎶 Conteo final de voces (desde endpoint):', voiceCounts);
      
      // Contar estados
      const statusCounts = {
        CONFIRMED: eventVoices.filter(v => v.status.toUpperCase() === 'CONFIRMED').length,
        REFUSED: eventVoices.filter(v => v.status.toUpperCase() === 'REFUSED' || v.status.toUpperCase() === 'REJECTED').length,
        PENDING: eventVoices.filter(v => v.status.toUpperCase() === 'PENDING').length
      };
      
      const totalAttendees = eventVoices.length;
      
      return {
        voices: voiceCounts,
        statuses: statusCounts,
        total: totalAttendees,
        percentages: {
          SOPRANO: totalAttendees > 0 ? Math.round((voiceCounts.SOPRANO / totalAttendees) * 100) : 0,
          MESOSOPRANO: totalAttendees > 0 ? Math.round((voiceCounts.MESOSOPRANO / totalAttendees) * 100) : 0,
          CONTRALTO: totalAttendees > 0 ? Math.round((voiceCounts.CONTRALTO / totalAttendees) * 100) : 0,
          TENOR: totalAttendees > 0 ? Math.round((voiceCounts.TENOR / totalAttendees) * 100) : 0,
          BARITONO: totalAttendees > 0 ? Math.round((voiceCounts.BARITONO / totalAttendees) * 100) : 0,
          BAJO: totalAttendees > 0 ? Math.round((voiceCounts.BAJO / totalAttendees) * 100) : 0,
          CONFIRMED: totalAttendees > 0 ? Math.round((statusCounts.CONFIRMED / totalAttendees) * 100) : 0,
          REFUSED: totalAttendees > 0 ? Math.round((statusCounts.REFUSED / totalAttendees) * 100) : 0,
          PENDING: totalAttendees > 0 ? Math.round((statusCounts.PENDING / totalAttendees) * 100) : 0,
        }
      };
    }
    
    // FALLBACK: Código original (que no funciona por falta de voiceProfiles)
    console.log('📊 FALLBACK: Usando datos originales del evento');
    console.log('📊 Event attendees:', event.attendees);
    
    console.log('🎭 === INICIO CÁLCULO COMPOSICIÓN DEL CORO ===');
    console.log('📊 Total de attendees:', event.attendees?.length || 0);
    
    // Debug completo de la estructura del evento
    console.log('🔍 Estructura completa del evento:', {
      id: event.id,
      title: event.title,
      attendeesCount: event.attendees?.length || 0,
      hasAttendees: !!event.attendees
    });
    
    // Debug completo de cada attendee
    event.attendees?.forEach((attendee, index) => {
      console.log(`📋 Attendee ${index + 1}:`, {
        status: attendee.status,
        user: {
          id: attendee.user.id,
          name: `${attendee.user.firstName} ${attendee.user.lastName}`,
          voiceProfiles: attendee.user.voiceProfiles,
          hasVoiceProfiles: !!attendee.user.voiceProfiles,
          voiceProfilesLength: attendee.user.voiceProfiles?.length || 0
        }
      });
    });
    
    if (!event.attendees || event.attendees.length === 0) {
      console.log('⚠️ No hay attendees en el evento');
      return { 
        voices: { SOPRANO: 0, MESOSOPRANO: 0, CONTRALTO: 0, TENOR: 0, BARITONO: 0, BAJO: 0 }, 
        statuses: { CONFIRMED: 0, REFUSED: 0, PENDING: 0 }, 
        total: 0, 
        percentages: { SOPRANO: 0, MESOSOPRANO: 0, CONTRALTO: 0, TENOR: 0, BARITONO: 0, BAJO: 0, CONFIRMED: 0, REFUSED: 0, PENDING: 0 } 
      };
    }
    
    // Filtrar solo los confirmados para obtener las voces
    const confirmedAttendees = event.attendees.filter(a => a.status.toUpperCase() === 'CONFIRMED');
    console.log(`✅ Confirmados: ${confirmedAttendees.length} de ${event.attendees.length} total`);
    
    // Contar voces primarias de los confirmados
    const voiceCounts = {
      SOPRANO: 0,
      MESOSOPRANO: 0,
      CONTRALTO: 0,  
      TENOR: 0,
      BARITONO: 0,
      BAJO: 0
    };

    // Contar por cada cantante confirmado su voz principal
    confirmedAttendees.forEach((attendee, index) => {
      console.log(`👤 Usuario ${index + 1}: ${attendee.user.firstName} ${attendee.user.lastName}`);
      console.log('🎤 VoiceProfiles:', attendee.user.voiceProfiles);
      
      // Buscar la voz principal del usuario (isPrimary = true)
      const primaryVoice = attendee.user.voiceProfiles?.find(vp => vp.isPrimary);
      console.log('🎯 Voz principal encontrada:', primaryVoice);
      
      if (primaryVoice) {
        const voiceType = primaryVoice.voiceType.toUpperCase();
        console.log(`📝 Tipo de voz: ${voiceType}`);
        
        if (voiceType === 'SOPRANO') voiceCounts.SOPRANO++;
        else if (voiceType === 'MESOSOPRANO') voiceCounts.MESOSOPRANO++;
        else if (voiceType === 'CONTRALTO') voiceCounts.CONTRALTO++;
        else if (voiceType === 'TENOR') voiceCounts.TENOR++;
        else if (voiceType === 'BARITONO' || voiceType === 'BARÍTONO') voiceCounts.BARITONO++;
        else if (voiceType === 'BAJO') voiceCounts.BAJO++;
        else {
          console.log(`⚠️ Tipo de voz no reconocido: ${voiceType}`);
        }
      } else {
        console.log('❌ No se encontró voz principal para este usuario');
      }
    });

    // Contar estados
    const statusCounts = {
      CONFIRMED: event.attendees.filter(a => a.status.toUpperCase() === 'CONFIRMED').length,
      REFUSED: event.attendees.filter(a => a.status.toUpperCase() === 'REFUSED' || a.status.toUpperCase() === 'REJECTED').length,  
      PENDING: event.attendees.filter(a => a.status.toUpperCase() === 'PENDING').length
    };

    console.log('🎶 Conteo final de voces:', voiceCounts);
    console.log('📊 Conteo de estados:', statusCounts);

    const totalAttendees = event.attendees.length;

    const result = {
      voices: voiceCounts,
      statuses: statusCounts,
      total: totalAttendees,
      percentages: {
        SOPRANO: totalAttendees > 0 ? Math.round((voiceCounts.SOPRANO / totalAttendees) * 100) : 0,
        MESOSOPRANO: totalAttendees > 0 ? Math.round((voiceCounts.MESOSOPRANO / totalAttendees) * 100) : 0,
        CONTRALTO: totalAttendees > 0 ? Math.round((voiceCounts.CONTRALTO / totalAttendees) * 100) : 0,
        TENOR: totalAttendees > 0 ? Math.round((voiceCounts.TENOR / totalAttendees) * 100) : 0,
        BARITONO: totalAttendees > 0 ? Math.round((voiceCounts.BARITONO / totalAttendees) * 100) : 0,
        BAJO: totalAttendees > 0 ? Math.round((voiceCounts.BAJO / totalAttendees) * 100) : 0,
        CONFIRMED: totalAttendees > 0 ? Math.round((statusCounts.CONFIRMED / totalAttendees) * 100) : 0,
        REFUSED: totalAttendees > 0 ? Math.round((statusCounts.REFUSED / totalAttendees) * 100) : 0,
        PENDING: totalAttendees > 0 ? Math.round((statusCounts.PENDING / totalAttendees) * 100) : 0,
      }
    };

    console.log('📈 Resultado final:', result);
    console.log('🎵 FIN - Calculando composición del coro');
    return result;
  }, [event.attendees, event.id, event.title, voicesLoaded, eventVoices]);

  // Datos para el gráfico de torta
  const chartData = useMemo(() => {
    const composition = calculateChoirComposition;
    return [
      { name: 'SOPRANO', value: composition.voices.SOPRANO, percentage: composition.percentages.SOPRANO, color: '#8B5CF6' },
      { name: 'MESOSOPRANO', value: composition.voices.MESOSOPRANO, percentage: composition.percentages.MESOSOPRANO, color: '#EC4899' },
      { name: 'CONTRALTO', value: composition.voices.CONTRALTO, percentage: composition.percentages.CONTRALTO, color: '#F59E0B' },
      { name: 'TENOR', value: composition.voices.TENOR, percentage: composition.percentages.TENOR, color: '#3B82F6' },
      { name: 'BARÍTONO', value: composition.voices.BARITONO, percentage: composition.percentages.BARITONO, color: '#10B981' },
      { name: 'BAJO', value: composition.voices.BAJO, percentage: composition.percentages.BAJO, color: '#059669' },
      { name: 'NO ASISTEN', value: composition.statuses.REFUSED, percentage: composition.percentages.REFUSED, color: '#EF4444' },
      { name: 'POR CONFIRMAR', value: composition.statuses.PENDING, percentage: composition.percentages.PENDING, color: '#6B7280' }
    ].filter(item => item.value > 0);
  }, [calculateChoirComposition]);

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
      
      console.log(`📝 [SOLICITUDES DEBUG] Procesando solicitud: ${status} para request ${requestId}`);
      console.log(`📊 [SOLICITUDES DEBUG] Total joinRequests antes:`, localJoinRequests.length);
      console.log(`📊 [SOLICITUDES DEBUG] Solicitudes pendientes antes:`, localJoinRequests.filter(r => r.status === 'PENDING').length);
      
      // Debug de la URL construida
      const apiUrl = getApiUrl(`/events/${event.id}/join-requests/${requestId}`);
      console.log(`🔗 [SOLICITUDES DEBUG] URL construida:`, apiUrl);
      console.log(`🆔 [SOLICITUDES DEBUG] Event ID:`, event.id);
      console.log(`🆔 [SOLICITUDES DEBUG] Request ID:`, requestId);
      
      const response_data = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, response })
      });

      if (response_data.ok) {
        const result = await response_data.json();
        console.log(`✅ [SOLICITUDES DEBUG] Solicitud ${status.toLowerCase()} exitosamente:`, result);
        console.log(`🔄 [SOLICITUDES DEBUG] Llamando onEventUpdated() para refrescar datos...`);
        
        // Log del estado antes del refresh
        console.log(`📊 [SOLICITUDES DEBUG] Estado ANTES del refresh:`, {
          totalRequests: localJoinRequests.length,
          pendingRequests: localJoinRequests.filter(r => r.status === 'PENDING').length,
          processedRequests: localJoinRequests.filter(r => r.status !== 'PENDING').length
        });
        
        // Actualizar el estado local inmediatamente para que la UI responda
        setLocalJoinRequests(prevRequests => {
          const updated = prevRequests.map(req => 
            req.id === requestId 
              ? { ...req, status: status }
              : req
          );
          console.log(`🔄 [SOLICITUDES DEBUG] Estado local actualizado inmediatamente:`, {
            before: prevRequests.length,
            after: updated.length,
            pendingBefore: prevRequests.filter(r => r.status === 'PENDING').length,
            pendingAfter: updated.filter(r => r.status === 'PENDING').length
          });
          return updated;
        });
        
        // Llamar al callback del componente padre para actualizar la lista
        console.log(`🔄 [SOLICITUDES DEBUG] Llamando onEventUpdated()...`);
        await onEventUpdated();
        
        // También recargar los datos de voces localmente para asegurar coherencia
        await fetchEventVoices();
        
        console.log(`✅ [SOLICITUDES DEBUG] Todo completado - onEventUpdated() y fetchEventVoices()`);
      } else {
        console.error(`❌ [SOLICITUDES DEBUG] Response status:`, response_data.status);
        console.error(`❌ [SOLICITUDES DEBUG] Response statusText:`, response_data.statusText);
        
        let errorData;
        try {
          errorData = await response_data.json();
        } catch (parseError) {
          console.error(`❌ [SOLICITUDES DEBUG] No se pudo parsear JSON de error:`, parseError);
          const textResponse = await response_data.text();
          console.error(`❌ [SOLICITUDES DEBUG] Respuesta de texto:`, textResponse);
          throw new Error(`Error ${response_data.status}: ${textResponse || response_data.statusText}`);
        }
        
        console.error(`❌ [SOLICITUDES DEBUG] Error data:`, errorData);
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
      badge: localJoinRequests.filter(r => r.status === 'PENDING').length || 0 
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
                            <div className={`w-3 h-3 rounded-full ${statusColors.icon === 'text-green-600' ? 'bg-green-500' : statusColors.icon === 'text-red-600' ? 'bg-red-500' : statusColors.icon === 'text-gray-600' ? 'bg-gray-500' : 'bg-gray-500'}`}></div>
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
                               attendee.status === 'REJECTED' || attendee.status === 'REFUSED' ? 'No Asiste' : attendee.status}
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

                {/* Composición del Coro */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Composición del Coro</h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lista de datos del lado izquierdo */}
                    <div className="space-y-3">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="font-medium text-gray-900">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">{item.value}</span>
                            <span className="text-sm text-gray-600 ml-2">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Gráfico de torta del lado derecho */}
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <svg width="200" height="200" className="drop-shadow-sm">
                          <g transform="translate(100, 100)">
                            {(() => {
                              const total = chartData.reduce((sum, item) => sum + item.value, 0);
                              if (total === 0) return null;
                              
                              let currentAngle = 0;
                              return chartData.map((item, index) => {
                                const percentage = (item.value / total) * 100;
                                const angle = (percentage / 100) * 360;
                                const startAngle = currentAngle;
                                const endAngle = currentAngle + angle;
                                
                                const x1 = Math.cos(startAngle * Math.PI / 180) * 80;
                                const y1 = Math.sin(startAngle * Math.PI / 180) * 80;
                                const x2 = Math.cos(endAngle * Math.PI / 180) * 80;
                                const y2 = Math.sin(endAngle * Math.PI / 180) * 80;
                                
                                const largeArcFlag = angle > 180 ? 1 : 0;
                                
                                const pathData = [
                                  `M 0 0`,
                                  `L ${x1} ${y1}`,
                                  `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                  `Z`
                                ].join(' ');
                                
                                currentAngle += angle;
                                
                                return (
                                  <path
                                    key={index}
                                    d={pathData}
                                    fill={item.color}
                                    stroke="white"
                                    strokeWidth="2"
                                    className="hover:opacity-80 transition-opacity"
                                  />
                                );
                              });
                            })()}
                          </g>
                        </svg>
                        
                        {/* Centro del gráfico */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {event.attendees?.length || 0}
                            </div>
                            <div className="text-xs text-gray-600">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                      Pendientes ({localJoinRequests.filter(r => r.status === 'PENDING').length || 0})
                    </button>
                    <button
                      onClick={() => setRequestsView('processed')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        requestsView === 'processed'
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Procesadas ({localJoinRequests.filter(r => r.status !== 'PENDING').length || 0})
                    </button>
                  </div>
                </div>

                {(() => {
                  const filteredRequests = localJoinRequests.filter(request => 
                    requestsView === 'pending' ? request.status === 'PENDING' : request.status !== 'PENDING'
                  );

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
