import React from 'react';
import { useAuthStore } from '../store/authStore';

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
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <p className="text-gray-900">{user?.role}</p>
          </div>
        </div>
      </div>

      {user?.voiceProfiles && user.voiceProfiles.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tipos de voz asignados</h2>
          <div className="space-y-2">
            {user.voiceProfiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{profile.voiceType}</span>
                {profile.assignedByUser && (
                  <span className="text-sm text-gray-600">
                    Asignado por: {profile.assignedByUser.firstName} {profile.assignedByUser.lastName}
                  </span>
                )}
              </div>
            ))}
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
