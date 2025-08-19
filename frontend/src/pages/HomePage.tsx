import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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
      {/* Header Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">¡Bienvenido, {user.firstName}!</h1>
            <p className="text-xl opacity-90 mb-2">CGPlayer v0.5.0</p>
            <p className="opacity-75">Sistema de gestión y reproducción de música coral</p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-sm opacity-75">Usuario:</p>
              <p className="text-lg font-semibold">{user.username}</p>
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
          <span className="mr-2">�</span>
          Información del Usuario
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Usuario</span>
            <span className="font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {user.username}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Email</span>
            <span className="font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
              {user.email}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Roles</span>
            <span className="font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
              {user.roles?.map(r => r.role).join(', ') || 'Sin roles'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600 font-medium">Estado</span>
            <span className="inline-flex items-center font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Activo
            </span>
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
