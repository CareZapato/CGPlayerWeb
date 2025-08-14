import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface DashboardStats {
  totalSongs: number;
  totalUsers: number;
  totalEvents: number;
  usersByLocation: { location: string; count: number }[];
  usersByVoiceType: { voiceType: string; count: number }[];
  recentEvents: any[];
}

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper para verificar si el usuario es admin
  const isAdmin = (user: any) => {
    if (!user) return false;
    // Verificar roles activos de la BD
    const userRoles = user.roles?.filter((r: any) => r.isActive).map((r: any) => r.role) || [];
    return userRoles.includes('ADMIN');
  };

  useEffect(() => {
    // Solo cargar datos si el usuario está autenticado y es admin
    if (isAdmin(user) && localStorage.getItem('token')) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Usar el nuevo endpoint de estadísticas del dashboard
      const response = await api.get('/dashboard/stats');
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        setStats({
          totalSongs: data.totalSongs,
          totalUsers: data.totalUsers,
          totalEvents: data.totalEvents,
          usersByLocation: data.usersByLocation,
          usersByVoiceType: data.usersByVoiceType,
          recentEvents: data.recentEvents
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      // Si es error 401, el interceptor ya redirigirá al login
      if (error.response?.status === 401) {
        console.log('Token inválido, redirigiendo al login...');
      } else if (error.response?.status === 403) {
        console.log('Sin permisos para ver estadísticas del dashboard');
      } else {
        console.log('Error al cargar estadísticas:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getVoiceTypeColor = (voiceType: string) => {
    switch (voiceType) {
      case 'SOPRANO': return 'bg-pink-100 text-pink-800';
      case 'CONTRALTO': return 'bg-purple-100 text-purple-800';
      case 'TENOR': return 'bg-blue-100 text-blue-800';
      case 'BARITONO': return 'bg-green-100 text-green-800';
      case 'MESOSOPRANO': return 'bg-indigo-100 text-indigo-800';
      case 'BAJO': return 'bg-yellow-100 text-yellow-800';
      case 'CORO': return 'bg-orange-100 text-orange-800';
      case 'ORIGINAL': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Vista para ADMIN
  if (isAdmin(user)) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dashboard Administrativo
          </h1>
          <p className="text-xl text-gray-600">
            Bienvenido, {user?.firstName} - Panel de control del sistema
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : stats ? (
          <>
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <h3 className="text-lg font-medium mb-2">🎵 Total Canciones</h3>
                <p className="text-3xl font-bold">{stats.totalSongs}</p>
                <p className="text-sm opacity-90">Canciones en el sistema</p>
              </div>
              
              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <h3 className="text-lg font-medium mb-2">👥 Total Usuarios</h3>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm opacity-90">Cantantes registrados</p>
              </div>
              
              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <h3 className="text-lg font-medium mb-2">📅 Total Eventos</h3>
                <p className="text-3xl font-bold">{stats.totalEvents}</p>
                <p className="text-sm opacity-90">Eventos programados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Usuarios por ubicación */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📍</span>
                  Cantantes por Ciudad
                </h3>
                {stats.usersByLocation.length > 0 ? (
                  <div className="space-y-3">
                    {stats.usersByLocation.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">{item.location}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${(item.count / stats.totalUsers) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 min-w-[20px]">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">🏙️</span>
                    <p>No hay datos de ubicación</p>
                  </div>
                )}
              </div>

              {/* Usuarios por tipo de voz */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🎤</span>
                  Distribución de Voces
                </h3>
                {stats.usersByVoiceType.length > 0 ? (
                  <>
                    {/* Gráfico de torta simple con CSS */}
                    <div className="flex justify-center mb-4">
                      <div className="relative w-32 h-32">
                        {/* Crear un gráfico de torta simple */}
                        <svg viewBox="0 0 42 42" className="w-32 h-32">
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" strokeWidth="3"></circle>
                          {stats.usersByVoiceType.map((item, index) => {
                            const total = stats.usersByVoiceType.reduce((sum, v) => sum + v.count, 0);
                            const percentage = (item.count / total) * 100;
                            const strokeDasharray = `${percentage} ${100 - percentage}`;
                            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];
                            const rotate = stats.usersByVoiceType.slice(0, index).reduce((sum, v) => sum + (v.count / total) * 360, 0);
                            
                            return (
                              <circle
                                key={index}
                                cx="21"
                                cy="21"
                                r="15.915"
                                fill="transparent"
                                stroke={colors[index % colors.length]}
                                strokeWidth="3"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset="25"
                                transform={`rotate(${rotate - 90} 21 21)`}
                              ></circle>
                            );
                          })}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-700">
                            {stats.usersByVoiceType.reduce((sum, v) => sum + v.count, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Leyenda */}
                    <div className="space-y-2">
                      {stats.usersByVoiceType.map((item, index) => {
                        const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500', 'bg-lime-500'];
                        const total = stats.usersByVoiceType.reduce((sum, v) => sum + v.count, 0);
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVoiceTypeColor(item.voiceType)}`}>
                                {item.voiceType}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-gray-900">{item.count}</span>
                              <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">🎵</span>
                    <p>No hay perfiles de voz registrados</p>
                  </div>
                )}
              </div>
            </div>

            {/* Eventos recientes */}
            {stats.recentEvents && stats.recentEvents.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📅</span>
                  Próximos Eventos
                </h3>
                <div className="space-y-4">
                  {stats.recentEvents.map((event, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-blue-100 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <span className="mr-1">🏷️</span>
                            {event.category}
                          </span>
                          {event.location?.name && (
                            <span className="flex items-center">
                              <span className="mr-1">📍</span>
                              {event.location.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(event.dateTime).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.dateTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <a 
                    href="/events" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver todos los eventos →
                  </a>
                </div>
              </div>
            )}
            
            {/* Estado vacío para eventos */}
            {stats.recentEvents && stats.recentEvents.length === 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📅</span>
                  Próximos Eventos
                </h3>
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">📅</span>
                  <p className="font-medium">No hay eventos programados</p>
                  <p className="text-sm">Crea eventos desde la sección de gestión</p>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    );
  }

  // Vista para CANTANTE
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenido, {user?.firstName}!
        </h1>
        <p className="text-xl text-gray-600">
          Reproductor de música para el coro ChileGospel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-medium mb-2">🎵 Canciones</h3>
          <p className="mb-4 opacity-90">
            Explora las canciones organizadas por álbumes con todas las variaciones de voz
          </p>
          <a href="/albums" className="inline-block bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors">
            Ver Canciones
          </a>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">📚 Listas de reproducción</h3>
          <p className="text-gray-600 mb-4">
            Crea y gestiona tus listas personalizadas por tipo de voz
          </p>
          <a href="/playlists" className="btn-primary">
            Ver listas
          </a>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">📅 Eventos</h3>
          <p className="text-gray-600 mb-4">
            Consulta los eventos programados y tu repertorio asignado
          </p>
          <a href="/events" className="btn-primary">
            Ver eventos
          </a>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">👤 Mi perfil</h3>
          <p className="text-gray-600 mb-4">
            Gestiona tu perfil y tipos de voz asignados
          </p>
          <a href="/profile" className="btn-primary">
            Ver perfil
          </a>
        </div>
      </div>

      {user?.voiceProfiles && user.voiceProfiles.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🎤 Tus tipos de voz</h3>
          <div className="flex flex-wrap gap-2">
            {user.voiceProfiles.map((profile) => (
              <span
                key={profile.id}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getVoiceTypeColor(profile.voiceType)}`}
              >
                {profile.voiceType}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
