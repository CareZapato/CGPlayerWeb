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
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col overflow-hidden">
        {/* Header Welcome - Más espaciado */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white p-6 mb-6 flex-shrink-0">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">¡Hola, {user.firstName}!</h1>
            <p className="text-base sm:text-lg opacity-90 mb-3">Bienvenido a CGPlayer</p>
            
            {/* Mostrar tipos de voz del usuario si los tiene - Destacar voz primaria */}
            {user.voiceProfiles && user.voiceProfiles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {user.voiceProfiles
                  .sort((a, b) => ((b as any).isPrimary ? 1 : 0) - ((a as any).isPrimary ? 1 : 0)) // Voz primaria primero
                  .map((profile) => (
                  <span
                    key={profile.id}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border backdrop-blur-sm ${
                      (profile as any).isPrimary
                        ? 'bg-yellow-300/30 text-white border-yellow-300/50 shadow-lg'
                        : 'bg-white/20 text-white border-white/30'
                    }`}
                    title={(profile as any).isPrimary ? 'Voz Primaria' : 'Voz Secundaria'}
                  >
                    {(profile as any).isPrimary && <span className="mr-1">⭐</span>}
                    🎵 {formatVoiceType(profile.voiceType)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal con mejor espaciado */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden min-h-0">
          {/* Columna izquierda - Acciones rápidas */}
          <div className="lg:col-span-1 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-4 flex-grow content-start">
              <Link
                to="/dashboard"
                className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group transform hover:-translate-y-1"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 text-center">
                  📊
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors text-center">
                  Dashboard
                </h3>
                <p className="text-gray-600 text-sm text-center">Ver métricas y estadísticas</p>
              </Link>

              <Link
                to="/albums"
                className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group transform hover:-translate-y-1"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 text-center">
                  🎵
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors text-center">
                  Canciones
                </h3>
                <p className="text-gray-600 text-sm text-center">Explorar catálogo musical</p>
              </Link>

              <Link
                to="/playlists"
                className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group transform hover:-translate-y-1"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 text-center">
                  📋
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors text-center">
                  Listas
                </h3>
                <p className="text-gray-600 text-sm text-center">Gestionar playlists</p>
              </Link>

              <Link
                to="/events"
                className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 group transform hover:-translate-y-1"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 text-center">
                  📅
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors text-center">
                  Eventos
                </h3>
                <p className="text-gray-600 text-sm text-center">Ver actividades programadas</p>
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
      <div className="bg-gray-50 py-3 border-t border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-emerald-700 font-medium">{getSystemStatus()}</span>
              </div>
              <span className="text-emerald-600 hidden sm:inline">•</span>
              <Link to={APP_CONFIG.links.changelog} className="text-emerald-600 font-medium hover:text-emerald-800 transition-colors underline sm:no-underline hover:underline">
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
