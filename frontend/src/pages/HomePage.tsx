import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Función para obtener el color de la etiqueta de tipo de voz
const getVoiceTypeColor = (voiceType: string) => {
  const colors = {
    'SOPRANO': 'bg-pink-100 text-pink-800 border-pink-200',
    'CONTRALTO': 'bg-purple-100 text-purple-800 border-purple-200',
    'TENOR': 'bg-blue-100 text-blue-800 border-blue-200',
    'BARITONO': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'BAJO': 'bg-gray-100 text-gray-800 border-gray-200',
    'MESOSOPRANO': 'bg-rose-100 text-rose-800 border-rose-200',
    'CORO': 'bg-orange-100 text-orange-800 border-orange-200',
    'ORIGINAL': 'bg-green-100 text-green-800 border-green-200'
  };
  return colors[voiceType as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Función para formatear el nombre del tipo de voz
const formatVoiceType = (voiceType: string) => {
  const names = {
    'SOPRANO': 'Soprano',
    'CONTRALTO': 'Contralto',
    'TENOR': 'Tenor', 
    'BARITONO': 'Barítono',
    'BAJO': 'Bajo',
    'MESOSOPRANO': 'Mesosoprano',
    'CORO': 'Coro',
    'ORIGINAL': 'Original'
  };
  return names[voiceType as keyof typeof names] || voiceType;
};

function HomePage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Welcome con tipos de voz */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">¡Bienvenido, {user.firstName}!</h1>
            <p className="text-xl opacity-90 mb-2">CGPlayer v0.5.0</p>
            <p className="opacity-75 mb-4">Sistema de gestión y reproducción de música coral</p>
            
            {/* Mostrar tipos de voz del usuario */}
            {user.voiceProfiles && user.voiceProfiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm opacity-90 mr-2">Tipos de voz:</span>
                {user.voiceProfiles.map((profile) => (
                  <span
                    key={profile.id}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getVoiceTypeColor(profile.voiceType)} bg-white/20 text-white border-white/30`}
                  >
                    🎵 {formatVoiceType(profile.voiceType)}
                  </span>
                ))}
              </div>
            )}
            
            {(!user.voiceProfiles || user.voiceProfiles.length === 0) && (
              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-300/30 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-yellow-100">
                  <span className="font-medium">📢 Sin tipos de voz asignados.</span>
                  {' '}Contacta a tu director para obtener acceso a canciones específicas.
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <p className="text-sm opacity-75">Usuario:</p>
              <p className="text-lg font-semibold">{user.username}</p>
              <p className="text-xs opacity-60 mt-1">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Acciones Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/dashboard"
            className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
              📊
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
              Dashboard
            </h3>
            <p className="text-gray-600 text-sm">Ver estadísticas y métricas del sistema</p>
          </Link>

          <Link
            to="/albums"
            className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
              🎵
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
              Canciones
            </h3>
            <p className="text-gray-600 text-sm">Explorar el catálogo musical</p>
          </Link>

          <Link
            to="/playlists"
            className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
              📋
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
              Listas
            </h3>
            <p className="text-gray-600 text-sm">Gestionar listas de reproducción</p>
          </Link>

          <Link
            to="/events"
            className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
              📅
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
              Eventos
            </h3>
            <p className="text-gray-600 text-sm">Ver eventos y actividades</p>
          </Link>
        </div>
      </div>

      {/* Sistema Info */}
      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <span className="mr-3 text-2xl">👤</span>
          Información del Usuario
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Datos básicos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium flex items-center">
                <span className="mr-2">👤</span>
                Usuario
              </span>
              <span className="font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {user.username}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium flex items-center">
                <span className="mr-2">📧</span>
                Email
              </span>
              <span className="font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                {user.email}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium flex items-center">
                <span className="mr-2">🎭</span>
                Roles
              </span>
              <span className="font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {user.roles?.map(r => r.role).join(', ') || 'Sin roles'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600 font-medium flex items-center">
                <span className="mr-2">🟢</span>
                Estado
              </span>
              <span className="inline-flex items-center font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Activo
              </span>
            </div>
          </div>
          
          {/* Tipos de voz */}
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <span className="text-gray-600 font-medium flex items-center">
                <span className="mr-2">🎵</span>
                Tipos de Voz Asignados
              </span>
            </div>
            
            {user.voiceProfiles && user.voiceProfiles.length > 0 ? (
              <div className="space-y-3">
                {user.voiceProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-3 rounded-lg border-2 ${getVoiceTypeColor(profile.voiceType)} transition-all duration-200 hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        🎼 {formatVoiceType(profile.voiceType)}
                      </span>
                      <span className="text-xs opacity-75">
                        Asignado
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 flex items-center">
                    <span className="mr-2">ℹ️</span>
                    <span>
                      <strong>Acceso completo</strong> a canciones de tus tipos de voz + CORO y ORIGINAL
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center mb-2">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="font-medium text-yellow-800">Sin tipos de voz asignados</span>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  Solo puedes acceder a canciones marcadas como CORO y ORIGINAL.
                </p>
                <p className="text-xs text-yellow-600">
                  💡 Contacta a tu director para obtener tipos de voz específicos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-emerald-700 font-medium">Base de Datos Conectada</span>
            </div>
            <span className="text-emerald-600">•</span>
            <span className="text-emerald-600 text-sm font-medium">CGPlayer v0.5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
