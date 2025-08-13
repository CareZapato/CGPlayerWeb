import React from 'react';
import { useAuthStore } from '../store/authStore';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();

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
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">🎵 Canciones</h3>
          <p className="text-gray-600 mb-4">
            Explora y reproduce las canciones del coro
          </p>
          <a href="/songs" className="btn-primary">
            Ver canciones
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
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
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
