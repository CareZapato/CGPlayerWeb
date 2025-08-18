import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../config/api';
import { isAdmin, isDirector } from '../utils/permissions';

interface LocationDetail {
  locationId: string;
  locationName: string;
  city: string;
  address: string;
  color: string;
  phone?: string;
  totalUsers: number;
  activeUsers: number;
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
    }[];
  }[];
}

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalSongs: number;
  totalEvents: number;
  totalLocations: number;
  locations: LocationDetail[];
  globalVoiceDistribution: {
    voiceType: string;
    count: number;
    activeCount: number;
  }[];
  recentEvents: {
    id: string;
    title: string;
    category: string;
    dateTime: string;
    location: { name: string };
  }[];
  isFiltered: boolean;
  filterLocation?: string;
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

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(getApiUrl('/api/dashboard/stats'), {
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
        if (result.data.locations && result.data.locations.length > 0) {
          setSelectedLocation(result.data.locations[0]);
        }
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

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

  // Get voice distribution data based on pinned/hovered location
  const getVoiceDistribution = () => {
    const targetLocation = pinnedLocation || hoveredLocation?.locationId;
    
    if (targetLocation && data) {
      const location = data.locations.find(loc => loc.locationId === targetLocation);
      return location?.voiceDistribution.map(vd => ({
        voiceType: vd.voiceType,
        count: vd.count,
        activeCount: vd.users.filter(u => u.isActive).length,
        users: vd.users
      })) || [];
    }
    return data?.globalVoiceDistribution.map(gvd => ({
      voiceType: gvd.voiceType,
      count: gvd.count,
      activeCount: gvd.activeCount,
      users: []
    })) || [];
  };

  // Get current location for director info
  const getCurrentLocation = () => {
    const targetLocationId = pinnedLocation || hoveredLocation?.locationId;
    if (targetLocationId && data) {
      return data.locations.find(loc => loc.locationId === targetLocationId);
    }
    return null;
  };

  const getVoiceTypeColor = (voiceType: string) => {
    const colors = {
      'SOPRANO': '#EC4899',
      'MESOSOPRANO': '#8B5CF6', 
      'CONTRALTO': '#7C3AED',
      'TENOR': '#3B82F6',
      'BARITONO': '#10B981',
      'BAJO': '#F59E0B'
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
      'BAJO': 'Bajo'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Dashboard {data.isFiltered ? 'Local' : 'Global'}
        </h1>
        <p className="text-gray-600">
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

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{data.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Canciones</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalSongs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Eventos</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ubicaciones</p>
              <p className="text-2xl font-semibold text-gray-900">{data.totalLocations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal: Tabla de ubicaciones + Gráfico de torta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla de Ubicaciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📍 Ubicaciones y Cantantes
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Ubicación</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Cantantes</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.locations.map((location) => (
                  <tr 
                    key={location.locationId}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    onMouseEnter={() => setHoveredLocation(location)}
                    onMouseLeave={() => setHoveredLocation(null)}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: location.color }}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900">{location.locationName}</p>
                          <p className="text-sm text-gray-500">{location.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {location.totalUsers} total
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-1">
                        {location.activeUsers} activos
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLocationPin(location.locationId);
                          }}
                          className={`px-2 py-1 text-xs rounded ${
                            pinnedLocation === location.locationId
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          📌 {pinnedLocation === location.locationId ? 'Fijado' : 'Fijar'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLocation(location);
                            setShowLocationModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver más
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico de Torta Interactivo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🎵 Distribución de Tipos de Voz
          </h2>
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              {pinnedLocation ? 
                (() => {
                  const loc = data.locations.find(l => l.locationId === pinnedLocation);
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
          </div>
          
          {/* Gráfico de torta SVG simplificado */}
          <div className="flex justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {getVoiceDistribution().map((voice, index) => {
                  const voiceData = getVoiceDistribution();
                  const total = voiceData.reduce((sum, v) => sum + v.count, 0);
                  const percentage = total > 0 ? (voice.count / total) * 100 : 0;
                  const startAngle = voiceData.slice(0, index).reduce((sum, v) => sum + (v.count / total) * 360, 0);
                  const endAngle = startAngle + (percentage * 3.6);
                  
                  const x1 = 50 + 30 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 50 + 30 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 50 + 30 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 50 + 30 * Math.sin((endAngle * Math.PI) / 180);
                  
                  const largeArcFlag = percentage > 50 ? 1 : 0;
                  
                  return (
                    <path
                      key={voice.voiceType}
                      d={`M 50 50 L ${x1} ${y1} A 30 30 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={getVoiceTypeColor(voice.voiceType)}
                      className="hover:opacity-80 cursor-pointer transition-opacity"
                      onClick={() => toggleVoiceTypeExpansion(voice.voiceType)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Información del Director (si hay ubicación seleccionada) */}
          {(() => {
            const currentLoc = pinnedLocation ? data.locations.find(l => l.locationId === pinnedLocation) : hoveredLocation;
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
          <div className="space-y-2">
            {getVoiceDistribution().map((voice) => (
              <React.Fragment key={voice.voiceType}>
                <div 
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleVoiceTypeExpansion(voice.voiceType)}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getVoiceTypeColor(voice.voiceType) }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">
                      {getVoiceTypeLabel(voice.voiceType)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {voice.count} total
                    </span>
                    {pinnedLocation && (
                      <span className="text-xs text-green-600">
                        ({voice.activeCount} activos)
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {expandedVoiceTypes.has(voice.voiceType) ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                
                {/* Lista expandible de usuarios */}
                {expandedVoiceTypes.has(voice.voiceType) && voice.users && voice.users.length > 0 && (
                  <div className="ml-6 bg-gray-50 rounded p-3 space-y-1">
                    {voice.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">
                          {user.firstName} {user.lastName}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">{user.email}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              user.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={user.isActive ? 'Activo' : 'Inactivo'}
                          ></span>
                        </div>
                      </div>
                    ))}
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
                Información de {selectedLocation.locationName}
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
                <p className="text-sm text-gray-600">{selectedLocation.address}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Ciudad:</p>
                <p className="text-sm text-gray-600">{selectedLocation.city}</p>
              </div>
              
              {selectedLocation.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Teléfono:</p>
                  <p className="text-sm text-gray-600">{selectedLocation.phone}</p>
                </div>
              )}
              
              {selectedLocation.director && (
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
                  {selectedLocation.totalUsers} cantantes totales, {selectedLocation.activeUsers} activos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eventos recientes */}
      {data.recentEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📅 Eventos Recientes
          </h2>
          <div className="space-y-3">
            {data.recentEvents.map((event) => (
              <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded">{event.category}</span>
                  <span>📍 {event.location.name}</span>
                  <span>📅 {new Date(event.dateTime).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;