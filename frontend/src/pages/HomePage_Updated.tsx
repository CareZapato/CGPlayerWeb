import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NewsCard from '../components/NewsCard';

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
    <div className="min-h-screen flex flex-col">
      {/* Contenido principal */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Welcome - Simplificado y minimalista */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">¡Hola, {user.firstName}!</h1>
            <p className="text-base sm:text-lg opacity-90 mb-4">Bienvenido a CGPlayer</p>
            
            {/* Mostrar tipos de voz del usuario si los tiene - Centrado y más visible */}
            {user.voiceProfiles && user.voiceProfiles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {user.voiceProfiles.map((profile) => (
                  <span
                    key={profile.id}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm shadow-lg"
                  >
                    🎵 {formatVoiceType(profile.voiceType)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Columna izquierda - Acciones rápidas (3/5 del ancho) */}
          <div className="lg:col-span-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Link
                to="/dashboard"
                className="bg-white rounded-lg p-4 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-2xl sm:text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  📊
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Dashboard
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">Ver estadísticas y métricas del sistema</p>
              </Link>

              <Link
                to="/albums"
                className="bg-white rounded-lg p-4 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-2xl sm:text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  🎵
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Canciones
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">Explorar el catálogo musical</p>
              </Link>

              <Link
                to="/playlists"
                className="bg-white rounded-lg p-4 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-2xl sm:text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  📋
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Listas
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">Gestionar listas de reproducción</p>
              </Link>

              <Link
                to="/events"
                className="bg-white rounded-lg p-4 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-2xl sm:text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  📅
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  Eventos
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">Ver eventos y actividades</p>
              </Link>
            </div>
          </div>

          {/* Columna derecha - Noticias (2/5 del ancho - más amplia) */}
          <div className="lg:col-span-2">
            <NewsCard limit={15} />
          </div>
        </div>
      </div>

      {/* Footer Info - Fijo en el fondo */}
      <div className="mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-emerald-700 font-medium text-sm">Sistema Conectado</span>
              </div>
              <span className="text-emerald-600 hidden sm:inline">•</span>
              <Link to="/changelog" className="text-emerald-600 text-sm font-medium hover:text-emerald-800 transition-colors underline sm:no-underline hover:underline">
                CGPlayer v0.9.0
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
