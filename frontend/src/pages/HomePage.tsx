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
      const [songsResponse, usersResponse, eventsResponse] = await Promise.all([
        api.get('/songs'),
        api.get('/users'),
        api.get('/events')
      ]);

      const songs = songsResponse.data.songs || [];
      const users = usersResponse.data.users || [];
      const events = eventsResponse.data.events || [];

      // Contar usuarios por ubicación
      const usersByLocation = users.reduce((acc: any, user: any) => {
        const location = user.location?.name || 'Sin ubicación';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {});

      // Contar usuarios por tipo de voz
      const voiceTypeCounts = users.reduce((acc: any, user: any) => {
        user.voiceProfiles?.forEach((profile: any) => {
          acc[profile.voiceType] = (acc[profile.voiceType] || 0) + 1;
        });
        return acc;
      }, {});

      // Contar canciones únicas (agrupar por nombre base, sin versiones)
      const uniqueSongs = songs.reduce((acc: any, song: any) => {
        // Extraer el nombre base de la canción sin versiones como "(Version 1)", "(Karaoke)", etc.
        const baseName = song.name?.replace(/\s*\([^)]*\)\s*$/g, '').trim() || 'Sin nombre';
        acc[baseName] = true;
        return acc;
      }, {});

      setStats({
        totalSongs: Object.keys(uniqueSongs).length, // Contar canciones únicas
        totalUsers: users.length,
        totalEvents: events.length,
        usersByLocation: Object.entries(usersByLocation).map(([location, count]) => ({
          location,
          count: count as number
        })),
        usersByVoiceType: Object.entries(voiceTypeCounts).map(([voiceType, count]) => ({
          voiceType,
          count: count as number
        })),
        recentEvents: events.slice(0, 5)
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      // Si es error 401, el interceptor ya redirigirá al login
      if (error.response?.status === 401) {
        console.log('Token inválido, redirigiendo al login...');
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">📍 Cantantes por Ciudad</h3>
                <div className="space-y-3">
                  {stats.usersByLocation.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700">{item.location}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(item.count / stats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usuarios por tipo de voz */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🎤 Distribución de Voces</h3>
                <div className="space-y-3">
                  {stats.usersByVoiceType.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVoiceTypeColor(item.voiceType)}`}>
                        {item.voiceType}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(item.count / stats.usersByVoiceType.reduce((sum, v) => sum + v.count, 0)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Eventos recientes */}
            {stats.recentEvents.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📅 Próximos Eventos</h3>
                <div className="space-y-4">
                  {stats.recentEvents.map((event, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(event.dateTime).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-xs text-gray-500">{event.location?.name}</p>
                      </div>
                    </div>
                  ))}
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
