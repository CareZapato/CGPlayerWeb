import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../config/api';
import { isAdmin, isDirector } from '../utils/permissions';
import UserAvatar from '../components/UserAvatar';

interface LocationDetail {
  locationId: string;
  locationName: string;
  city: string;
  address: string;
  color: string;
  phone?: string;
  totalUsers: number;
  activeUsers: number;
  riskyUsers: number;
  inactiveUsers: number;
  director?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  voiceDistribution: {
    voiceType: string;
    count: number;
    users: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      isActive: boolean;
      status: 'active' | 'risky' | 'inactive';
      riskData?: {
        total: number;
        refused: number;
        isRisky: boolean;
      } | null;
    }[];
  }[];
  primaryVoiceDistribution: {
    voiceType: string;
    count: number;
    users: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      isActive: boolean;
      status: 'active' | 'risky' | 'inactive';
      riskData?: {
        total: number;
        refused: number;
        isRisky: boolean;
      } | null;
    }[];
  }[];
}

interface DashboardData {
  // Nuevas estructuras mejoradas
  users: {
    total: number;
    active: number;
    inactive: number;
    risky: number;
  };
  songs: {
    total: number;
    variations: number;
    totalWithVariations: number;
  };
  events: {
    total: number;
    pending: number;
  };
  rehearsals: {
    total: number;
    pending: number;
  };
  requests: {
    pendingEventRequests: number;
    pendingUserRequests: number;
    totalPending: number;
  };
  locations: {
    total: number;
    details: LocationDetail[];
  };
  voiceDistribution: {
    global: {
      voiceType: string;
      count: number;
      activeCount: number;
      riskyCount: number;
      inactiveCount: number;
      users: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        isActive: boolean;
        status: 'active' | 'risky' | 'inactive';
        riskData?: {
          total: number;
          refused: number;
          isRisky: boolean;
        } | null;
      }[];
    }[];
    primary: {
      voiceType: string;
      count: number;
      activeCount: number;
      riskyCount: number;
      inactiveCount: number;
      users: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        isActive: boolean;
        status: 'active' | 'risky' | 'inactive';
        riskData?: {
          total: number;
          refused: number;
          isRisky: boolean;
        } | null;
      }[];
    }[];
  };
  config: {
    riskThreshold: number;
    currentYear: number;
    isFiltered: boolean;
    filterLocation?: string;
  };
  
  // Mantener compatibilidad (deprecated)
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  riskyUsers: number;
  totalSongs: number;
  totalEvents: number;
  totalLocations: number;
  globalVoiceDistribution: {
    voiceType: string;
    count: number;
    activeCount: number;
    riskyCount: number;
    inactiveCount: number;
    users: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      isActive: boolean;
      status: 'active' | 'risky' | 'inactive';
      riskData?: {
        total: number;
        refused: number;
        isRisky: boolean;
      } | null;
    }[];
  }[];
  primaryVoiceDistribution: {
    voiceType: string;
    count: number;
    activeCount: number;
    riskyCount: number;
    inactiveCount: number;
    users: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      isActive: boolean;
      status: 'active' | 'risky' | 'inactive';
      riskData?: {
        total: number;
        refused: number;
        isRisky: boolean;
      } | null;
    }[];
  }[];
  recentEvents: {
    id: string;
    title: string;
    category: string;
    dateTime: string;
    location: { name: string } | null;
  }[];
  riskConfig: {
    attendanceThreshold: number;
    currentYear: number;
  };
  isFiltered: boolean;
  filterLocation?: string;
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  profileImage?: string;
  status: 'active' | 'risky' | 'inactive';
  riskData?: {
    total: number;
    refused: number;
    isRisky: boolean;
  } | null;
}

interface VoiceDistributionItem {
  voiceType: string;
  count: number;
  users: UserData[];
}

interface VoiceDistribution {
  voiceType: string;
  count: number;
  activeCount: number;
  riskyCount: number;
  inactiveCount: number;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    status: 'active' | 'risky' | 'inactive';
    riskData?: {
      total: number;
      refused: number;
      isRisky: boolean;
    } | null;
  }[];
}

const DashboardPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationDetail | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<LocationDetail | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [expandedVoiceTypes, setExpandedVoiceTypes] = useState<Set<string>>(new Set());
  const [pinnedLocation, setPinnedLocation] = useState<string | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [showPercentages, setShowPercentages] = useState(false);
  const [showPrimaryVoices, setShowPrimaryVoices] = useState(false); // false = todas las voces, true = voces primarias

  // Helper para obtener la lista de ubicaciones de manera segura
  const getLocationsList = (data: DashboardData | null): LocationDetail[] => {
    if (!data) return [];
    return data.locations?.details || (Array.isArray(data.locations) ? data.locations : []);
  };

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(getApiUrl('/dashboard/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar estadísticas');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        // Seleccionar la primera ubicación por defecto para el gráfico
        const locationsList = getLocationsList(result.data);
        if (locationsList.length > 0) {
          setSelectedLocation(locationsList[0]);
        }
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [token, fetchDashboardData]);

  const toggleVoiceTypeExpansion = (voiceType: string) => {
    setExpandedVoiceTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(voiceType)) {
        newSet.delete(voiceType);
      } else {
        newSet.add(voiceType);
      }
      return newSet;
    });
  };

  const toggleLocationPin = (locationId: string) => {
    setPinnedLocation(prev => prev === locationId ? null : locationId);
  };

  // Get voice distribution data based on pinned/hovered location and voice view mode
  const getVoiceDistribution = (): VoiceDistribution[] => {
    const targetLocation = pinnedLocation || hoveredLocation?.locationId;
    
    if (targetLocation && data) {
      const locationsList = getLocationsList(data);
      const location = locationsList.find(loc => loc.locationId === targetLocation);
      
      // Elegir la distribución según el modo
      const distribution = showPrimaryVoices 
        ? location?.primaryVoiceDistribution 
        : location?.voiceDistribution;
        
      return distribution?.map((vd: VoiceDistributionItem): VoiceDistribution => ({
        voiceType: vd.voiceType,
        count: vd.count,
        activeCount: vd.users.filter((u: UserData) => u.status === 'active').length,
        riskyCount: vd.users.filter((u: UserData) => u.status === 'risky').length,
        inactiveCount: vd.users.filter((u: UserData) => u.status === 'inactive').length,
        users: vd.users
      })) || [];
    }
    
    // Vista global - elegir distribución según el modo
    const globalDistribution = showPrimaryVoices 
      ? (data?.voiceDistribution?.primary || data?.primaryVoiceDistribution)
      : (data?.voiceDistribution?.global || data?.globalVoiceDistribution);
      
    return globalDistribution?.map((gvd: VoiceDistribution): VoiceDistribution => ({
      voiceType: gvd.voiceType,
      count: gvd.count,
      activeCount: gvd.activeCount,
      riskyCount: gvd.riskyCount || 0,
      inactiveCount: gvd.inactiveCount || 0,
      users: gvd.users || []
    })) || [];
  };

  const getVoiceTypeColor = (voiceType: string) => {
    const colors = {
      'SOPRANO': '#EC4899',
      'MESOSOPRANO': '#8B5CF6', 
      'CONTRALTO': '#7C3AED',
      'TENOR': '#3B82F6',
      'BARITONO': '#10B981',
      'BAJO': '#F59E0B',
      'CORO': '#6366F1',
      'ORIGINAL': '#059669',
      'INSTRUMENTAL': '#DC2626'
    };
    return colors[voiceType as keyof typeof colors] || '#6B7280';
  };

  const getVoiceTypeLabel = (voiceType: string) => {
    const labels = {
      'SOPRANO': 'Soprano',
      'MESOSOPRANO': 'Mezzosoprano',
      'CONTRALTO': 'Contralto',
      'TENOR': 'Tenor',
      'BARITONO': 'Barítono',
      'BAJO': 'Bajo',
      'CORO': 'Coro',
      'ORIGINAL': 'Original',
      'INSTRUMENTAL': 'Instrumental'
    };
    return labels[voiceType as keyof typeof labels] || voiceType;
  };

  // Verificar permisos
  if (!user || (!isAdmin(user) && !isDirector(user))) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">
          No tienes permisos para acceder al dashboard
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">Error: {error}</div>
        <button
          onClick={fetchDashboardData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-lg">No hay datos disponibles</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="text-center px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          📊 Dashboard {data.isFiltered ? 'Local' : 'Global'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {data.isFiltered 
            ? `Vista filtrada para tu ubicación`
            : 'Vista completa del sistema'
          }
        </p>
        {data.isFiltered && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            🎯 Solo mostrando datos de tu ubicación
          </div>
        )}
      </div>

      {/* Estadísticas principales - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-blue-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-blue-500 rounded-full text-white">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">
              {data.users?.total || data.totalUsers}
            </div>
            <div className="text-xs sm:text-sm font-medium text-blue-700 mb-2 sm:mb-3">Cantantes</div>
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center justify-center space-x-1 text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-700">{data.users?.active || data.activeUsers} activos</span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-yellow-700">{data.users?.risky || data.riskyUsers} en riesgo</span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-xs">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></span>
                <span className="text-red-700">{data.users?.inactive || data.inactiveUsers} inactivos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-green-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-green-500 rounded-full text-white">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-1">
              {data.songs?.total || data.totalSongs}
            </div>
            <div className="text-xs sm:text-sm font-medium text-green-700 mb-2 sm:mb-3">Canciones</div>
            <div className="space-y-0.5 sm:space-y-1">
              <div className="text-xs text-green-600">
                <span>{data.songs?.variations || 0} variaciones</span>
              </div>
              <div className="text-xs text-green-800 font-medium">
                <span>{data.songs?.totalWithVariations || data.totalSongs} total</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-purple-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-purple-500 rounded-full text-white">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mb-1">
              {data.events?.total || data.totalEvents}
            </div>
            <div className="text-xs sm:text-sm font-medium text-purple-700 mb-2 sm:mb-3">Eventos</div>
            <div className="text-xs text-purple-600">
              <div className="flex items-center justify-center space-x-1">
                <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>{data.events?.pending || 0} pendientes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-orange-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-orange-500 rounded-full text-white">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
              {data.locations?.total || data.totalLocations}
            </div>
            <div className="text-xs sm:text-sm font-medium text-orange-700">Sedes</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-indigo-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-indigo-500 rounded-full text-white">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-900 mb-1">
              {data.rehearsals?.total || 0}
            </div>
            <div className="text-xs sm:text-sm font-medium text-indigo-700 mb-2 sm:mb-3">Ensayos</div>
            <div className="text-xs text-indigo-600">
              <div className="flex items-center justify-center space-x-1">
                <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>{data.rehearsals?.pending || 0} pendientes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-red-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-red-500 rounded-full text-white">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900 mb-1">
              {data.requests?.totalPending || 0}
            </div>
            <div className="text-xs sm:text-sm font-medium text-red-700 mb-2 sm:mb-3">Solicitudes</div>
            <div className="space-y-0.5 sm:space-y-1">
              <div className="text-xs text-red-600">
                <div className="flex items-center justify-center space-x-1">
                  <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" clipRule="evenodd" />
                  </svg>
                  <span>{data.requests?.pendingEventRequests || 0} eventos</span>
                </div>
              </div>
              <div className="text-xs text-red-600">
                <div className="flex items-center justify-center space-x-1">
                  <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>{data.requests?.pendingUserRequests || 0} usuarios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal: Tabla de ubicaciones + Gráfico de torta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla de Sedes Modernizada */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-lg mr-2">🏢</span>
            Sedes y Cantantes
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600 text-sm">Sede</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-600 text-sm">Cantantes</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-600 text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {getLocationsList(data).map((location) => (
                  <tr 
                    key={location.locationId}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredLocation(location)}
                    onMouseLeave={() => setHoveredLocation(null)}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <td className="py-2 px-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: location.color }}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{location.locationName}</p>
                          <p className="text-xs text-gray-500">{location.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex justify-center space-x-1">
                        {/* Total */}
                        <div className="flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                          <span className="mr-1">👥</span>
                          <span className="font-medium">{location.totalUsers}</span>
                        </div>
                        {/* Activos */}
                        <div className="flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                          <span className="mr-1">🟢</span>
                          <span className="font-medium">{location.activeUsers}</span>
                        </div>
                        {/* En Riesgo */}
                        {location.riskyUsers > 0 && (
                          <div className="flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                            <span className="mr-1">🟡</span>
                            <span className="font-medium">{location.riskyUsers}</span>
                          </div>
                        )}
                        {/* Inactivos */}
                        {location.inactiveUsers > 0 && (
                          <div className="flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                            <span className="mr-1">🔴</span>
                            <span className="font-medium">{location.inactiveUsers}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLocationPin(location.locationId);
                          }}
                          className={`p-1 rounded text-xs transition-colors ${
                            pinnedLocation === location.locationId
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={pinnedLocation === location.locationId ? 'Desfijar' : 'Fijar sede'}
                        >
                          📌
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLocation(location);
                            setShowLocationModal(true);
                          }}
                          className="p-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded text-xs transition-colors"
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Leyenda */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center">
                <span className="mr-1">👥</span>
                <span className="text-gray-600">Total</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">🟢</span>
                <span className="text-gray-600">Activos</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">🟡</span>
                <span className="text-gray-600">En Riesgo (&lt;{Math.round((data.riskConfig?.attendanceThreshold || 0.3) * 100)}% asistencia)</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">🔴</span>
                <span className="text-gray-600">Inactivos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Torta Interactivo */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              🎵 Distribución de Tipos de Voz
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {showPrimaryVoices ? 'Voces Principales' : 'Todas las Voces'}
              </span>
              <button
                onClick={() => setShowPrimaryVoices(!showPrimaryVoices)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showPrimaryVoices ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                title={showPrimaryVoices 
                  ? 'Cambiar a: Todas las voces (puede incluir duplicados)' 
                  : 'Cambiar a: Solo voces principales (sin duplicados)'
                }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showPrimaryVoices ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              {pinnedLocation ? 
                (() => {
                  const loc = getLocationsList(data).find(l => l.locationId === pinnedLocation);
                  return `${loc?.locationName} - ${loc?.city}`;
                })() :
                hoveredLocation ? 
                  `${hoveredLocation.locationName} - ${hoveredLocation.city}` :
                  'Vista Global'
              }
            </p>
            {pinnedLocation && (
              <button
                onClick={() => setPinnedLocation(null)}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                🔄 Volver a vista global
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {showPrimaryVoices 
                ? '📌 Mostrando solo la voz principal de cada cantante (sin duplicados)'
                : '🎵 Mostrando todas las voces que puede cantar cada cantante (puede incluir duplicados)'
              }
            </p>
          </div>
          
          {/* Gráfico de torta SVG más grande con porcentajes */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Gráfico principal más grande */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {getVoiceDistribution().map((voice: VoiceDistribution, index: number) => {
                    const voiceData = getVoiceDistribution();
                    const total = voiceData.reduce((sum: number, v: VoiceDistribution) => sum + v.count, 0);
                    const percentage = total > 0 ? (voice.count / total) * 100 : 0;
                    const startAngle = voiceData.slice(0, index).reduce((sum: number, v: VoiceDistribution) => sum + (v.count / total) * 360, 0);
                    const endAngle = startAngle + (percentage * 3.6);
                    
                    const x1 = 50 + 35 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 50 + 35 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 50 + 35 * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = 50 + 35 * Math.sin((endAngle * Math.PI) / 180);
                    
                    const largeArcFlag = percentage > 50 ? 1 : 0;
                    
                    return (
                      <path
                        key={voice.voiceType}
                        d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={getVoiceTypeColor(voice.voiceType)}
                        className="hover:opacity-80 cursor-pointer transition-all duration-200 hover:scale-105"
                        onClick={() => {
                          toggleVoiceTypeExpansion(voice.voiceType);
                          setShowPercentages(!showPercentages);
                        }}
                        onMouseEnter={() => setHoveredSlice(voice.voiceType)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        style={{
                          filter: hoveredSlice === voice.voiceType ? 'brightness(1.1)' : 'none',
                          transformOrigin: '50% 50%'
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Porcentajes flotantes */}
                {showPercentages && (
                  <div className="absolute inset-0 pointer-events-none">
                    {getVoiceDistribution().map((voice: VoiceDistribution, index: number) => {
                      const voiceData = getVoiceDistribution();
                      const total = voiceData.reduce((sum: number, v: VoiceDistribution) => sum + v.count, 0);
                      const percentage = total > 0 ? (voice.count / total) * 100 : 0;
                      const startAngle = voiceData.slice(0, index).reduce((sum: number, v: VoiceDistribution) => sum + (v.count / total) * 360, 0);
                      const midAngle = startAngle + (percentage * 3.6) / 2;
                      
                      // Posición para el texto (más alejado del centro)
                      const textRadius = 45;
                      const x = 50 + textRadius * Math.cos((midAngle * Math.PI) / 180);
                      const y = 50 + textRadius * Math.sin((midAngle * Math.PI) / 180);
                      
                      if (percentage < 3) return null; // No mostrar porcentajes muy pequeños
                      
                      return (
                        <div
                          key={`percentage-${voice.voiceType}`}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-bold shadow-lg border"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            color: getVoiceTypeColor(voice.voiceType)
                          }}
                        >
                          {percentage.toFixed(1)}%
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botón para mostrar/ocultar porcentajes */}
              <button
                onClick={() => setShowPercentages(!showPercentages)}
                className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 border"
                title={showPercentages ? "Ocultar porcentajes" : "Mostrar porcentajes"}
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a2 2 0 012-2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Información del Director (si hay ubicación seleccionada) */}
          {(() => {
            const currentLoc = pinnedLocation ? getLocationsList(data).find(l => l.locationId === pinnedLocation) : hoveredLocation;
            if (currentLoc && currentLoc.director) {
              return (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">👨‍🎓 Director del Coro</h3>
                  <div className="space-y-1">
                    <p className="text-sm"><strong>Nombre:</strong> {currentLoc.director.firstName} {currentLoc.director.lastName}</p>
                    <p className="text-sm"><strong>Email:</strong> {currentLoc.director.email}</p>
                    {currentLoc.director.phone && (
                      <p className="text-sm"><strong>Teléfono:</strong> {currentLoc.director.phone}</p>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Leyenda del gráfico */}
          <div className="space-y-3">
            {getVoiceDistribution().map((voice: VoiceDistribution) => (
              <React.Fragment key={voice.voiceType}>
                <div 
                  className="group relative bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
                  onClick={() => toggleVoiceTypeExpansion(voice.voiceType)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="relative">
                        <div 
                          className="w-5 h-5 rounded-full shadow-lg"
                          style={{ backgroundColor: getVoiceTypeColor(voice.voiceType) }}
                        ></div>
                        <div 
                          className="absolute inset-0 w-5 h-5 rounded-full opacity-30 blur-sm"
                          style={{ backgroundColor: getVoiceTypeColor(voice.voiceType) }}
                        ></div>
                      </div>
                      <div>
                        <span className="text-base font-semibold text-gray-900">
                          {getVoiceTypeLabel(voice.voiceType)}
                        </span>
                        <div className="text-sm text-gray-500 font-medium">
                          {voice.count} cantante{voice.count !== 1 ? 's' : ''} total
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-3">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        {voice.activeCount > 0 && (
                          <div className="flex items-center bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs font-semibold">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            <span className="hidden sm:inline">{voice.activeCount} activos</span>
                            <span className="sm:hidden">{voice.activeCount}</span>
                          </div>
                        )}
                        {voice.riskyCount > 0 && (
                          <div className="flex items-center bg-yellow-100 text-yellow-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs font-semibold">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                            <span className="hidden sm:inline">{voice.riskyCount} en riesgo</span>
                            <span className="sm:hidden">{voice.riskyCount}</span>
                          </div>
                        )}
                        {voice.inactiveCount > 0 && (
                          <div className="flex items-center bg-red-100 text-red-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs font-semibold">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                            <span className="hidden sm:inline">{voice.inactiveCount} inactivos</span>
                            <span className="sm:hidden">{voice.inactiveCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all duration-200">
                        <span className={`text-sm font-bold transition-transform duration-200 ${
                          expandedVoiceTypes.has(voice.voiceType) ? 'rotate-180 text-blue-600' : 'text-gray-400'
                        }`}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Lista expandible de usuarios */}
                {expandedVoiceTypes.has(voice.voiceType) && voice.users && voice.users.length > 0 && (
                  <div className="mt-4 ml-0 sm:ml-2">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-4 py-2 border-b border-gray-200">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.514 0a4 4 0 01-3.514-2.138M9 7h1m7 0h1" />
                          </svg>
                          Listado de Cantantes ({voice.users.length})
                        </h4>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1 p-1 sm:p-2">
                    {voice.users
                      .sort((a: UserData, b: UserData) => {
                        // Ordenar por estado: activos primero, luego riesgo, luego inactivos
                        const statusOrder: Record<string, number> = { 'active': 0, 'risky': 1, 'inactive': 2 };
                        return statusOrder[a.status] - statusOrder[b.status];
                      })
                      .map((user: UserData) => (
                      <div key={user.id} className={`flex items-center justify-between p-2 sm:p-3 rounded-lg transition-colors duration-150 ${
                        user.status === 'active' ? 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500' :
                        user.status === 'risky' ? 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-500' :
                        'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500'
                      }`}>
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <UserAvatar 
                            user={{
                              ...user,
                              profileImageUrl: user.profileImage 
                                ? `${getApiUrl('/uploads')}/images/profiles/${user.profileImage}`
                                : undefined
                            }} 
                            size="sm" 
                            className="shadow-sm" 
                            backgroundColor="#6b7280"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium self-start ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' :
                                user.status === 'risky' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                <span className="sm:hidden">
                                  {user.status === 'active' ? '✓' : user.status === 'risky' ? '⚠' : '✗'}
                                </span>
                                <span className="hidden sm:inline">
                                  {user.status === 'active' ? '✓ Activo' : user.status === 'risky' ? '⚠ En Riesgo' : '✗ Inactivo'}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                              </svg>
                              <span className="text-gray-500 truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span 
                            className={`text-xs font-medium px-2 py-1 rounded-lg bg-white bg-opacity-50 ${
                              user.status === 'active' ? 'text-green-800' :
                              user.status === 'risky' ? 'text-yellow-800' :
                              'text-red-800'
                            }`}
                            title={
                              user.status === 'active' ? 'Activo' :
                              user.status === 'risky' && user.riskData
                                ? `En riesgo - ${user.riskData ? Math.round((1 - user.riskData.refused / user.riskData.total) * 100) : 0}% asistencia`
                                : 'Inactivo'
                            }
                          >
                            {user.status === 'active' ? 'Activo' :
                            user.status === 'risky' && user.riskData
                              ? `${Math.round((1 - user.riskData.refused / user.riskData.total) * 100)}%`
                              : 'Inactivo'
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de información detallada de ubicación */}
      {showLocationModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Información de {selectedLocation?.locationName}
              </h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Dirección:</p>
                <p className="text-sm text-gray-600">{selectedLocation?.address}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Ciudad:</p>
                <p className="text-sm text-gray-600">{selectedLocation?.city}</p>
              </div>
              
              {selectedLocation?.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Teléfono:</p>
                  <p className="text-sm text-gray-600">{selectedLocation.phone}</p>
                </div>
              )}
              
              {selectedLocation?.director && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Director:</p>
                  <p className="text-sm text-gray-600">
                    {selectedLocation.director.firstName} {selectedLocation.director.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedLocation.director.email}</p>
                  {selectedLocation.director.phone && (
                    <p className="text-sm text-gray-500">📞 {selectedLocation.director.phone}</p>
                  )}
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-700">Estadísticas:</p>
                <p className="text-sm text-gray-600">
                  {selectedLocation?.totalUsers} cantantes totales, {selectedLocation?.activeUsers} activos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eventos recientes */}
      {data.recentEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            📅 Eventos Recientes
          </h2>
          <div className="space-y-3">
            {data.recentEvents.map((event) => {
              const isRehearsal = event.category === 'Ensayo';
              const eventDate = new Date(event.dateTime);
              const timeStr = eventDate.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
              
              return (
                <div
                  key={event.id}
                  className={`rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 transition-all hover:shadow-md ${
                    isRehearsal
                      ? 'bg-gray-800 text-white border border-gray-700'
                      : 'bg-gray-50 text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg ${
                      isRehearsal 
                        ? 'bg-gray-700' 
                        : 'bg-white border border-gray-300'
                    }`}>
                      {isRehearsal ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-semibold text-base sm:text-lg truncate ${
                        isRehearsal ? 'text-white' : 'text-gray-900'
                      }`}>
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isRehearsal 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {event.category}
                        </span>
                        <span className={`truncate ${isRehearsal ? 'text-gray-300' : 'text-gray-600'}`}>
                          📍 {event.location?.name || 'Sin ubicación'}
                        </span>
                        <span className={`font-medium ${
                          isRehearsal ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          🕒 {timeStr}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = `/events?eventId=${event.id}`}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors flex-shrink-0 w-full sm:w-auto text-center ${
                      isRehearsal
                        ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                    }`}
                  >
                    Ver detalles
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;