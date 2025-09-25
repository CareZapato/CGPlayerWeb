import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NewsCard from '../components/NewsCard';
import { APP_CONFIG, getSystemStatus } from '../config/appConfig';

// Interfaz extendida para UserVoiceProfile con isPrimary
interface ExtendedUserVoiceProfile {
  id: string;
  voiceType: string;
  isPrimary?: boolean;
}

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
      <div className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 flex flex-col overflow-hidden">
        {/* Header Welcome - Más compacto */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white p-3 sm:p-4 lg:p-6 mb-3 sm:mb-6 flex-shrink-0">
          <div className="text-center">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">¡Hola, {user.firstName}!</h1>
            <p className="text-sm sm:text-base lg:text-lg opacity-90 mb-2 sm:mb-3">Bienvenido a CGPlayer</p>
            
            {/* Mostrar tipos de voz del usuario si los tiene - Destacar voz primaria */}
            {user.voiceProfiles && user.voiceProfiles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                {(user.voiceProfiles as ExtendedUserVoiceProfile[])
                  .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)) // Voz primaria primero
                  .map((profile) => (
                  <span
                    key={profile.id}
                    className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border backdrop-blur-sm ${
                      profile.isPrimary
                        ? 'bg-yellow-300/30 text-white border-yellow-300/50 shadow-lg'
                        : 'bg-white/20 text-white border-white/30'
                    }`}
                    title={profile.isPrimary ? 'Voz Primaria' : 'Voz Secundaria'}
                  >
                    {profile.isPrimary && <span className="mr-0.5 sm:mr-1">⭐</span>}
                    <span className="text-xs sm:text-sm">🎵 {formatVoiceType(profile.voiceType)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal con mejor espaciado */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 overflow-hidden min-h-0">
          {/* Columna izquierda - Acciones rápidas */}
          <div className="lg:col-span-1 flex flex-col">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-grow content-start">
              <Link
                to="/dashboard"
                className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group transform hover:-translate-y-1"
              >
                <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3 group-hover:scale-110 transition-transform duration-300 text-center">
                  📊
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors text-center">
                  Dashboard
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 text-center leading-tight">Ver métricas</p>
              </Link>

              <Link
                to="/albums"
                className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group transform hover:-translate-y-1"
              >
                <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3 group-hover:scale-110 transition-transform duration-300 text-center">
                  🎵
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors text-center">
                  Canciones
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 text-center leading-tight">Catálogo musical</p>
              </Link>

              <Link
                to="/playlists"
                className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group transform hover:-translate-y-1"
              >
                <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3 group-hover:scale-110 transition-transform duration-300 text-center">
                  📋
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors text-center">
                  Listas
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 text-center leading-tight">Gestionar playlists</p>
              </Link>

              <Link
                to="/events"
                className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group transform hover:-translate-y-1"
              >
                <div className="text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-2 lg:mb-3 group-hover:scale-110 transition-transform duration-300 text-center">
                  📅
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors text-center">
                  Eventos
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 text-center leading-tight">Actividades programadas</p>
              </Link>
            </div>
          </div>

          {/* Columna derecha - Noticias expandidas */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <NewsCard limit={15} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info - Más compacto */}
      <div className="bg-gray-50 py-2 sm:py-3 border-t border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="bg-emerald-50 rounded-lg p-2 sm:p-3 border border-emerald-200">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full mr-1 sm:mr-2 animate-pulse"></span>
                <span className="text-emerald-700 font-medium text-xs sm:text-sm">{getSystemStatus()}</span>
              </div>
              <span className="text-emerald-600 hidden sm:inline">•</span>
              <Link to={APP_CONFIG.links.changelog} className="text-emerald-600 font-medium hover:text-emerald-800 transition-colors underline sm:no-underline hover:underline text-xs sm:text-sm">
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
