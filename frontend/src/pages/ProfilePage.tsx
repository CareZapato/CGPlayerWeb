import React from 'react';
import { useAuthStore } from '../store/authStore';

// Función para formatear tipos de voz
const formatVoiceType = (voiceType: string): string => {
  const labels: { [key: string]: string } = {
    SOPRANO: 'Soprano',
    MESOSOPRANO: 'Mesosoprano',
    CONTRALTO: 'Contralto', 
    TENOR: 'Tenor',
    BARITONO: 'Barítono',
    BAJO: 'Bajo'
  };
  return labels[voiceType] || voiceType;
};

// Función para obtener color del tipo de voz
const getVoiceTypeColor = (voiceType: string): string => {
  const colors: { [key: string]: string } = {
    SOPRANO: 'bg-pink-100 text-pink-800',
    MESOSOPRANO: 'bg-indigo-100 text-indigo-800',
    CONTRALTO: 'bg-purple-100 text-purple-800', 
    TENOR: 'bg-blue-100 text-blue-800',
    BARITONO: 'bg-green-100 text-green-800',
    BAJO: 'bg-yellow-100 text-yellow-800'
  };
  return colors[voiceType] || 'bg-gray-100 text-gray-800';
};

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
      
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Información personal</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
            <p className="text-gray-900">{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <p className="text-gray-900">{user?.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Roles</label>
            <div className="flex flex-wrap gap-2">
              {user?.roles?.map((userRole) => (
                <span key={userRole.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  {userRole.role}
                </span>
              )) || <span className="text-gray-500">Sin roles asignados</span>}
            </div>
          </div>
        </div>
      </div>

      {user?.voiceProfiles && user.voiceProfiles.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tipos de voz asignados</h2>
          <div className="space-y-3">
            {user.voiceProfiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVoiceTypeColor(profile.voiceType)}`}>
                    {formatVoiceType(profile.voiceType)}
                  </span>
                </div>
                {profile.assignedByUser && (
                  <span className="text-sm text-gray-600">
                    Asignado por: {profile.assignedByUser.firstName} {profile.assignedByUser.lastName}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {user.voiceProfiles.length > 1 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Tienes {user.voiceProfiles.length} tipos de voz asignados.</span> 
                {' '}Podrás ver y crear playlists con canciones de todos estos tipos de voz.
              </p>
            </div>
          )}
        </div>
      )}

      {(!user?.voiceProfiles || user.voiceProfiles.length === 0) && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tipos de voz</h2>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">No tienes tipos de voz asignados.</span>
              {' '}Contacta a tu director para que te asigne los tipos de voz apropiados.
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones</h2>
        <button
          onClick={handleLogout}
          className="btn-danger"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
