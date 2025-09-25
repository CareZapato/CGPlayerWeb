import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NewsCard from '../components/NewsCard';
import { APP_CONFIG, getSystemStatus } from '../config/appConfig';
import { useState, useEffect } from 'react';
import './HomePage.css';

// Estilos CSS para el diseño minimalista de noticias
const minimalNewsStyles = `
  .minimal-news {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .minimal-news .news-card-title {
    font-size: 1.125rem;
    font-weight: 300;
    color: rgb(51, 65, 85);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .minimal-news .news-card-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .minimal-news .refresh-button {
    background: none;
    border: none;
    font-size: 0.875rem;
    color: rgb(100, 116, 139);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }

  .minimal-news .refresh-button:hover {
    background: rgba(148, 163, 184, 0.1);
    color: rgb(59, 130, 246);
  }

  .minimal-news .news-item {
    padding: 0.75rem;
    border-radius: 0.75rem;
    margin-bottom: 0.75rem;
    background: rgba(248, 250, 252, 0.8);
    border: 1px solid rgba(226, 232, 240, 0.5);
    transition: all 0.2s;
  }

  .minimal-news .news-item:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(148, 163, 184, 0.3);
    transform: translateY(-1px);
  }

  .minimal-news .news-item.clickable {
    cursor: pointer;
  }

  .minimal-news .news-content {
    flex: 1;
  }

  .minimal-news .news-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .minimal-news .news-type-prominent {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgb(59, 130, 246);
    background: rgba(59, 130, 246, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  .minimal-news .news-date {
    font-size: 0.75rem;
    color: rgb(100, 116, 139);
  }

  .minimal-news .news-title {
    font-size: 0.875rem;
    font-weight: 400;
    color: rgb(30, 41, 59);
    line-height: 1.4;
    margin: 0.25rem 0;
  }

  .minimal-news .news-icon {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.75rem;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 0.5rem;
    border: 1px solid rgba(226, 232, 240, 0.5);
  }

  .minimal-news .news-icon .icon-emoji {
    font-size: 1rem;
  }

  .minimal-news .news-metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: 0.375rem;
  }

  .minimal-news .metadata-tag {
    font-size: 0.75rem;
    color: rgb(71, 85, 105);
    background: rgba(226, 232, 240, 0.5);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
  }

  /* Estilos específicos para móvil */
  .mobile-news .news-item {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .mobile-news .news-title {
    font-size: 0.8rem;
  }

  .mobile-news .news-icon {
    width: 1.75rem;
    height: 1.75rem;
    margin-right: 0.5rem;
  }

  .mobile-news .news-icon .icon-emoji {
    font-size: 0.875rem;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = minimalNewsStyles;
  document.head.appendChild(styleElement);
}

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
  
  // Estado para el carrusel móvil
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto-play del carrusel en móvil (10 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAutoPlay && window.innerWidth < 1024) { // Solo en móvil
        setCurrentSlide(prev => (prev === 0 ? 1 : 0));
      }
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  // Función para cambiar slide manualmente
  const handleSlideChange = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    setIsAutoPlay(false); // Pausar auto-play al interactuar
    // Reanudar auto-play después de 5 segundos
    setTimeout(() => setIsAutoPlay(true), 5000);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="homepage-container fixed bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col" style={{ top: '64px', left: 0, right: 0, bottom: 0 }}>
      {/* Contenido principal */}
      <div className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 flex flex-col overflow-hidden">
        
        {/* Layout Desktop: 2 columnas lado a lado */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:h-full">
          {/* Columna Izquierda: Saludo + Botones */}
          <div className="flex flex-col">
            {/* Saludo */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200/50 p-6 mb-6 shadow-sm">
              <div className="mb-4">
                <h1 className="text-3xl font-light text-slate-800 mb-2">
                  Hola, <span className="font-medium text-blue-600">{user.firstName}</span>
                </h1>
                <p className="text-base text-slate-600 font-light">
                  Bienvenido de vuelta a CGPlayer
                </p>
              </div>

              {/* Etiquetas de información */}
              <div className="flex flex-wrap gap-2">
                {/* Tipos de voz */}
                {user.voiceProfiles && user.voiceProfiles.length > 0 && (
                  (user.voiceProfiles as ExtendedUserVoiceProfile[])
                    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
                    .map((profile) => (
                    <span
                      key={profile.id}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                        profile.isPrimary
                          ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                      title={profile.isPrimary ? 'Voz Primaria' : 'Voz Secundaria'}
                    >
                      {profile.isPrimary && <span className="mr-1.5 text-amber-500">⭐</span>}
                      <span className="mr-1.5">🎵</span>
                      <span>{formatVoiceType(profile.voiceType)}</span>
                    </span>
                  ))
                )}

                {/* Sede */}
                {user.location ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                    <span className="mr-1.5">📍</span>
                    <span>Sede: {user.location.name} - {user.location.city}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200 shadow-sm">
                    <span className="mr-1.5">⚠️</span>
                    <span>Sede: No asignada</span>
                  </span>
                )}
              </div>
            </div>

            {/* Botones de acciones */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-light text-slate-800">Acciones Rápidas</h2>
                <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1 ml-6"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Link to="/dashboard" className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:border-slate-300/70 hover:bg-white/90 transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-1">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">📊</div>
                  <h3 className="text-base font-medium text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">Dashboard</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Ver métricas</p>
                </Link>

                <Link to="/albums" className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:border-slate-300/70 hover:bg-white/90 transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-1">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">🎵</div>
                  <h3 className="text-base font-medium text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">Canciones</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Catálogo musical</p>
                </Link>

                <Link to="/playlists" className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:border-slate-300/70 hover:bg-white/90 transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-1">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">📋</div>
                  <h3 className="text-base font-medium text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">Listas</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Gestionar playlists</p>
                </Link>

                <Link to="/events" className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:border-slate-300/70 hover:bg-white/90 transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-1">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">📅</div>
                  <h3 className="text-base font-medium text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">Eventos</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Actividades programadas</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Noticias minimalistas */}
          <div className="flex flex-col">
            <div className="flex-1 min-h-0">
              <NewsCard limit={15} className="minimal-news" />
            </div>
          </div>
        </div>

        {/* Layout Mobile: Carrusel */}
        <div className="lg:hidden h-full flex flex-col">
          {/* Contenedor del carrusel */}
          <div className="flex-1 relative overflow-hidden px-2">
            <div 
              className="flex h-full transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {/* Slide 1: Saludo + Botones */}
              <div className="w-full flex-shrink-0 flex flex-col p-3">
                {/* Saludo móvil */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200/50 p-3 mb-3 shadow-sm">
                  <div className="mb-2">
                    <h1 className="text-lg font-light text-slate-800 mb-1">
                      Hola, <span className="font-medium text-blue-600">{user.firstName}</span>
                    </h1>
                    <p className="text-sm text-slate-600 font-light">
                      Bienvenido de vuelta a CGPlayer
                    </p>
                  </div>

                  {/* Etiquetas móviles */}
                  <div className="flex flex-wrap gap-1.5">
                    {/* Tipos de voz */}
                    {user.voiceProfiles && user.voiceProfiles.length > 0 && (
                      (user.voiceProfiles as ExtendedUserVoiceProfile[])
                        .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
                        .map((profile) => (
                        <span
                          key={profile.id}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            profile.isPrimary
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {profile.isPrimary && <span className="mr-1 text-amber-500">⭐</span>}
                          <span className="mr-1">🎵</span>
                          <span>{formatVoiceType(profile.voiceType)}</span>
                        </span>
                      ))
                    )}

                    {/* Sede móvil */}
                    {user.location ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="mr-1">📍</span>
                        <span>Sede: {user.location.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <span className="mr-1">⚠️</span>
                        <span>Sede: No asignada</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones móviles */}
                <div className="flex-1 px-1">
                  <h2 className="text-lg font-light text-slate-800 mb-2">Acciones Rápidas</h2>
                  <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                    <Link to="/dashboard" className="group bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 hover:border-slate-300/70 transition-all duration-300">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">📊</div>
                      <h3 className="text-sm font-medium text-slate-800 mb-1">Dashboard</h3>
                      <p className="text-xs text-slate-500">Ver métricas</p>
                    </Link>

                    <Link to="/albums" className="group bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 hover:border-slate-300/70 transition-all duration-300">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">🎵</div>
                      <h3 className="text-sm font-medium text-slate-800 mb-1">Canciones</h3>
                      <p className="text-xs text-slate-500">Catálogo musical</p>
                    </Link>

                    <Link to="/playlists" className="group bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 hover:border-slate-300/70 transition-all duration-300">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">📋</div>
                      <h3 className="text-sm font-medium text-slate-800 mb-1">Listas</h3>
                      <p className="text-xs text-slate-500">Gestionar playlists</p>
                    </Link>

                    <Link to="/events" className="group bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 hover:border-slate-300/70 transition-all duration-300">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">📅</div>
                      <h3 className="text-sm font-medium text-slate-800 mb-1">Eventos</h3>
                      <p className="text-xs text-slate-500">Actividades programadas</p>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Slide 2: Noticias */}
              <div className="w-full flex-shrink-0 flex flex-col p-3">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-light text-slate-800">Últimas Noticias</h2>
                  <p className="text-sm text-slate-500 mt-1">Mantente informado</p>
                </div>
                <div className="flex-1 min-h-0 px-1">
                  <NewsCard limit={5} className="carousel-news" showTitle={false} />
                </div>
              </div>
            </div>
          </div>

          {/* Indicadores y controles del carrusel */}
          <div className="flex justify-center items-center py-3 space-x-4 px-4">
            {/* Indicadores de página */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleSlideChange(0)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === 0 ? 'bg-blue-500 w-6' : 'bg-slate-300'
                }`}
                aria-label="Ir a página 1"
              />
              <button
                onClick={() => handleSlideChange(1)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === 1 ? 'bg-blue-500 w-6' : 'bg-slate-300'
                }`}
                aria-label="Ir a página 2"
              />
            </div>

            {/* Botones de navegación */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleSlideChange(0)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  currentSlide === 0 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => handleSlideChange(1)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  currentSlide === 1 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                Noticias
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info - Diseño moderno y minimalista */}
      <div className="bg-white/50 backdrop-blur-sm py-3 sm:py-4 border-t border-slate-200/50 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="bg-slate-50/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-200/30">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 rounded-full mr-2 sm:mr-3 animate-pulse"></div>
                <span className="text-slate-600 font-medium text-xs sm:text-sm">{getSystemStatus()}</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
              <Link 
                to={APP_CONFIG.links.changelog} 
                className="text-slate-500 hover:text-slate-700 font-medium transition-colors text-xs sm:text-sm group"
              >
                <span className="group-hover:underline">
                  {APP_CONFIG.name} {APP_CONFIG.version}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
