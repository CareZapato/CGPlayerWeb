import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NewsCard from '../components/NewsCard';
import { APP_CONFIG, getSystemStatus } from '../config/appConfig';

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
    <div className="homepage-container fixed bg-gray-50 flex flex-col" style={{ top: '64px', left: 0, right: 0, bottom: 0 }}>
      {/* Contenido principal que se ajusta a la altura disponible */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex flex-col overflow-hidden" style={{ paddingTop: '16px' }}>
        {/* Header Welcome - Más compacto */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white p-3 mb-3 flex-shrink-0">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">¡Hola, {user.firstName}!</h1>
            <p className="text-sm sm:text-base opacity-90 mb-2">Bienvenido a CGPlayer</p>
            
            {/* Mostrar tipos de voz del usuario si los tiene - Más compacto */}
            {user.voiceProfiles && user.voiceProfiles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1">
                {user.voiceProfiles.map((profile) => (
                  <span
                    key={profile.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                  >
                    🎵 {formatVoiceType(profile.voiceType)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
          {/* Columna izquierda - Acciones rápidas (50%) */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Link
                to="/dashboard"
                className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300 text-center">
                  📊
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors text-center">
                  Dashboard
                </h3>
                <p className="text-gray-600 text-sm text-center">Ver métricas</p>
              </Link>

              <Link
                to="/albums"
                className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300 text-center">
                  🎵
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors text-center">
                  Canciones
                </h3>
                <p className="text-gray-600 text-sm text-center">Explorar catálogo</p>
              </Link>

              <Link
                to="/playlists"
                className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300 text-center">
                  📋
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors text-center">
                  Listas
                </h3>
                <p className="text-gray-600 text-sm text-center">Playlists</p>
              </Link>

              <Link
                to="/events"
                className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300 text-center">
                  📅
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors text-center">
                  Eventos
                </h3>
                <p className="text-gray-600 text-sm text-center">Ver actividades</p>
              </Link>
            </div>
          </div>

          {/* Columna derecha - Noticias (50%) */}
          <div className="lg:col-span-1 overflow-hidden">
            <NewsCard limit={APP_CONFIG.ui.newsLimit} />
          </div>
        </div>
      </div>

      {/* Footer Info - Fijo en el fondo */}
      <div className="bg-gray-50 py-2 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-emerald-700 font-medium text-sm">{getSystemStatus()}</span>
              </div>
              <span className="text-emerald-600 hidden sm:inline text-sm">•</span>
              <Link to={APP_CONFIG.links.changelog} className="text-emerald-600 text-sm font-medium hover:text-emerald-800 transition-colors underline sm:no-underline hover:underline">
                {APP_CONFIG.name} {APP_CONFIG.version}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
