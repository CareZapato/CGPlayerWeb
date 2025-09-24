import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  UserIcon,
  MusicalNoteIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarIcon,
  MicrophoneIcon,
  StarIcon,
  AcademicCapIcon,
  CameraIcon,
  LockClosedIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  TrophyIcon as TrophyIconSolid
} from '@heroicons/react/24/solid';

interface VoiceType {
  voiceType: string;
  isPrimary: boolean;
  assignedBy: string;
  assignedAt: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  category: 'ensayos' | 'presentaciones';
}

interface SeasonStats {
  year: number;
  ensayos: number;
  presentaciones: number;
  horasEntrenamiento: number;
}

type ProfileSection = 'perfil' | 'vocal' | 'permisos' | 'estadisticas' | 'logros';

const ProfilePage: React.FC = () => {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<ProfileSection>('perfil');
  
  // Función para formatear nombres de tipos de voz
  const formatVoiceType = (voiceType: string) => {
    const voiceMap: { [key: string]: string } = {
      'SOPRANO': 'Soprano',
      'CONTRALTO': 'Contralto',
      'MESOSOPRANO': 'Mezzosoprano',
      'TENOR': 'Tenor',
      'BARITONO': 'Barítono',
      'BAJO': 'Bajo',
      'CORO': 'Coro',
      'ORIGINAL': 'Original'
    };
    return voiceMap[voiceType] || voiceType;
  };

  // Usar useQuery para cargar el perfil
  const { data: profile, isLoading: loading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/profile/me');
      console.log('🔍 [PROFILE] Datos del perfil recibidos:', response.data);
      console.log('🖼️ [PROFILE] URL de imagen:', response.data.profileImageUrl);
      return response.data;
    }
  });

  // Datos mock para estadísticas por temporada
  const seasonStats: SeasonStats[] = [
    { year: 2024, ensayos: 45, presentaciones: 8, horasEntrenamiento: 120 },
    { year: 2023, ensayos: 52, presentaciones: 12, horasEntrenamiento: 156 },
    { year: 2022, ensayos: 38, presentaciones: 6, horasEntrenamiento: 95 },
  ];

  // Calcular totales
  const totalEnsayos = seasonStats.reduce((sum, season) => sum + season.ensayos, 0);
  const totalPresentaciones = seasonStats.reduce((sum, season) => sum + season.presentaciones, 0);

  // Datos de logros
  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'Primer Ensayo',
      description: 'Participa en tu primer ensayo',
      icon: '🎵',
      progress: Math.min(totalEnsayos, 1),
      maxProgress: 1,
      unlocked: totalEnsayos >= 1,
      category: 'ensayos'
    },
    {
      id: '2',
      name: 'Veterano del Coro',
      description: 'Completa 10 ensayos',
      icon: '🎤',
      progress: Math.min(totalEnsayos, 10),
      maxProgress: 10,
      unlocked: totalEnsayos >= 10,
      category: 'ensayos'
    },
    {
      id: '3',
      name: 'Cantante Dedicado',
      description: 'Completa 50 ensayos',
      icon: '🌟',
      progress: Math.min(totalEnsayos, 50),
      maxProgress: 50,
      unlocked: totalEnsayos >= 50,
      category: 'ensayos'
    },
    {
      id: '4',
      name: 'Maestro del Coro',
      description: 'Completa 100 ensayos',
      icon: '🏆',
      progress: Math.min(totalEnsayos, 100),
      maxProgress: 100,
      unlocked: totalEnsayos >= 100,
      category: 'ensayos'
    },
    {
      id: '5',
      name: 'Leyenda Vocal',
      description: 'Completa 250 ensayos',
      icon: '👑',
      progress: Math.min(totalEnsayos, 250),
      maxProgress: 250,
      unlocked: totalEnsayos >= 250,
      category: 'ensayos'
    },
    {
      id: '6',
      name: 'Primera Presentación',
      description: 'Participa en tu primera presentación',
      icon: '🎭',
      progress: Math.min(totalPresentaciones, 1),
      maxProgress: 1,
      unlocked: totalPresentaciones >= 1,
      category: 'presentaciones'
    },
    {
      id: '7',
      name: 'Artista en Escena',
      description: 'Completa 10 presentaciones',
      icon: '🎪',
      progress: Math.min(totalPresentaciones, 10),
      maxProgress: 10,
      unlocked: totalPresentaciones >= 10,
      category: 'presentaciones'
    },
    {
      id: '8',
      name: 'Estrella del Escenario',
      description: 'Completa 25 presentaciones',
      icon: '⭐',
      progress: Math.min(totalPresentaciones, 25),
      maxProgress: 25,
      unlocked: totalPresentaciones >= 25,
      category: 'presentaciones'
    }
  ];

  // Log adicional cuando el perfil cambia
  React.useEffect(() => {
    if (profile) {
      console.log('📸 [PROFILE] Perfil cargado:', {
        profileImage: profile.profileImage,
        profileImageUrl: profile.profileImageUrl,
        fullProfile: profile
      });
    }
  }, [profile]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para edición
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    username: profile?.username || '',
    phone: profile?.phone || ''
  });

  // Estados para cambio de contraseña
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estados para imagen
  const [imageUploading, setImageUploading] = useState(false);

  // Inicializar editData cuando el perfil se carga
  React.useEffect(() => {
    if (profile) {
      setEditData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        username: profile.username,
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const handleEditSave = async () => {
    try {
      const response = await api.put('/profile/me', editData);
      
      // Invalidar cache del perfil para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Actualizar el authStore con la información básica del usuario
      if (response.data && profile) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          updateUser({
            ...currentUser,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            email: response.data.email,
            username: response.data.username
          });
        }
      }
      
      setEditMode(false);
      setSuccess('Perfil actualizado exitosamente');
      
      // Limpiar mensaje después de unos segundos
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      await api.put('/profile/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Contraseña cambiada exitosamente');
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar la contraseña';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no debe superar los 5MB');
      setTimeout(() => setError(null), 5000);
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    setImageUploading(true);
    try {
      await api.post('/profile/me/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Invalidar cache del perfil para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      setSuccess('Imagen de perfil actualizada');
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setImageUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleImageDelete = async () => {
    try {
      await api.delete('/profile/me/image');
      
      // Invalidar cache del perfil para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      setSuccess('Imagen de perfil eliminada');
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la imagen';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Componente del menú lateral
  const SidebarMenu = () => (
    <div className="bg-white shadow-lg rounded-lg p-6 h-fit">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Mi Perfil</h2>
      <nav className="space-y-2">
        {[
          { id: 'perfil', name: 'Información Personal', icon: UserIcon },
          { id: 'vocal', name: 'Información Vocal', icon: MicrophoneIcon },
          { id: 'permisos', name: 'Roles y Permisos', icon: ShieldCheckIcon },
          { id: 'estadisticas', name: 'Estadísticas', icon: ChartBarIcon },
          { id: 'logros', name: 'Logros', icon: TrophyIcon },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as ProfileSection)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </button>
          );
        })}
      </nav>
    </div>
  );

  // Componente de barra de progreso
  const ProgressBar = ({ progress, maxProgress, color = 'blue' }: { progress: number; maxProgress: number; color?: string }) => {
    const percentage = (progress / maxProgress) * 100;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full bg-${color}-600`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-gray-600">Cargando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          No se pudo cargar el perfil
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <SidebarMenu />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === 'perfil' && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.nombre}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.apellido}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.correo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.telefono || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.fecha_nacimiento 
                        ? new Date(profile.fecha_nacimiento).toLocaleDateString('es-ES')
                        : 'No especificada'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'vocal' && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Vocal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de voz</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.tipo_voz || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parte coral</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.parte_coral || 'No especificada'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registro vocal</label>
                    <p className="mt-1 text-sm text-gray-900">{profile.registro_vocal || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado de membresía</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.estado_membresia === 'activo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile.estado_membresia === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'permisos' && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Roles y Permisos</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol principal</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {profile.rol}
                    </span>
                  </div>
                  {profile.permisos && profile.permisos.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Permisos especiales</label>
                      <div className="flex flex-wrap gap-2">
                        {profile.permisos.map((permiso, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800"
                          >
                            {permiso}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'estadisticas' && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas por Temporada</h2>
                <div className="space-y-6">
                  {/* Resumen general */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <MusicalNoteIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Ensayos</p>
                          <p className="text-2xl font-bold text-blue-900">{totalEnsayos}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <StarIcon className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-600">Total Presentaciones</p>
                          <p className="text-2xl font-bold text-green-900">{totalPresentaciones}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas por año */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Desempeño por Año</h3>
                    {seasonStats.map((season) => (
                      <div key={season.year} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Temporada {season.year}</h4>
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Ensayos</p>
                            <p className="text-lg font-semibold text-blue-600">{season.ensayos}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Presentaciones</p>
                            <p className="text-lg font-semibold text-green-600">{season.presentaciones}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'logros' && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sistema de Logros</h2>
                <div className="space-y-6">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className={`border rounded-lg p-4 ${
                      achievement.unlocked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{achievement.icon}</span>
                          <div>
                            <h3 className={`font-semibold ${
                              achievement.unlocked ? 'text-green-900' : 'text-gray-700'
                            }`}>
                              {achievement.name}
                            </h3>
                            <p className={`text-sm ${
                              achievement.unlocked ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        {achievement.unlocked && (
                          <CheckIcon className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progreso</span>
                          <span className={`font-medium ${
                            achievement.unlocked ? 'text-green-600' : 'text-gray-700'
                          }`}>
                            {achievement.progress} / {achievement.target}
                          </span>
                        </div>
                        <ProgressBar 
                          progress={achievement.progress} 
                          maxProgress={achievement.target}
                          color={achievement.unlocked ? 'green' : 'blue'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

                    {profile.profileImageUrl && (
                      <button
                        onClick={handleImageDelete}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="mr-2 -ml-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar Foto
                      </button>
                    )}

                    <div className="border-t border-gray-200 pt-4">
                      <button
                        onClick={() => setPasswordDialog(true)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="mr-2 -ml-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Cambiar Contraseña
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información Vocal - Segunda sección */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Información Vocal</h3>
                <p className="text-sm text-gray-500">Tipos de voz asignados</p>
              </div>
            </div>

            {profile?.voiceTypes && profile.voiceTypes.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Voz Principal */}
                {profile.primaryVoice && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          Voz Principal
                        </span>
                        <span className="ml-2 text-lg font-semibold text-gray-900">
                          {formatVoiceType(profile.primaryVoice.voiceType)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Asignado por: {profile.primaryVoice.assignedBy}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(profile.primaryVoice.assignedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}

                {/* Todas las voces */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Todos los tipos de voz:</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {profile.voiceTypes.map((voice: VoiceType, index: number) => (
                      <div key={index} className={`border rounded-lg p-3 ${voice.isPrimary ? 'border-purple-300 bg-purple-25' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              voice.isPrimary 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {formatVoiceType(voice.voiceType)}
                            </span>
                            {voice.isPrimary && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                ★ Principal
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          <p>Por: {voice.assignedBy}</p>
                          <p>{new Date(voice.assignedAt).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin tipos de voz asignados</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Aún no tienes ningún tipo de voz configurado en tu perfil.
                </p>
                <p className="text-xs text-gray-500">
                  Un director debe asignarte un tipo de voz para participar en los eventos musicales.
                </p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-xs text-blue-800 font-medium">¿Qué significa esto?</p>
                      <p className="text-xs text-blue-700">
                        Los tipos de voz (Soprano, Tenor, etc.) son asignados por los directores según tu rango vocal. 
                        Contacta a un director de tu sede para que evalúe y configure tu tipo de voz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información de Rol - Tercera sección */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Rol y Permisos</h3>
                <p className="text-sm text-gray-500">Nivel de acceso en el sistema</p>
              </div>
            </div>

            {profile?.primaryRole ? (
              <div className="space-y-4">
                {/* Rol Principal */}
                <div className={`border rounded-lg p-4 ${
                  profile.primaryRole.role === 'ADMIN' ? 'border-red-300 bg-red-50' :
                  profile.primaryRole.role === 'DIRECTOR' ? 'border-blue-300 bg-blue-50' :
                  'border-green-300 bg-green-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        profile.primaryRole.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        profile.primaryRole.role === 'DIRECTOR' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {profile.primaryRole.role === 'ADMIN' && (
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM2 8a8 8 0 1016 0A8 8 0 002 8z" clipRule="evenodd" />
                          </svg>
                        )}
                        {profile.primaryRole.role === 'DIRECTOR' && (
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.734.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364z" clipRule="evenodd" />
                          </svg>
                        )}
                        {profile.primaryRole.role === 'CANTANTE' && (
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                        {profile.primaryRole.role === 'ADMIN' ? 'Administrador' :
                         profile.primaryRole.role === 'DIRECTOR' ? 'Director' :
                         'Cantante'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Asignado por: {profile.primaryRole.assignedBy}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(profile.primaryRole.assignedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>

                {/* Información adicional sobre permisos */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Permisos del rol:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {profile.primaryRole.role === 'ADMIN' && (
                      <>
                        <li>• Gestión completa del sistema</li>
                        <li>• Administrar usuarios y roles</li>
                        <li>• Acceso a todas las funciones</li>
                      </>
                    )}
                    {profile.primaryRole.role === 'DIRECTOR' && (
                      <>
                        <li>• Gestión de su sede asignada</li>
                        <li>• Crear y administrar eventos</li>
                        <li>• Asignar tipos de voz</li>
                      </>
                    )}
                    {profile.primaryRole.role === 'CANTANTE' && (
                      <>
                        <li>• Acceso a canciones y playlists</li>
                        <li>• Participación en eventos</li>
                        <li>• Gestión de perfil personal</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Información de ubicación */}
                {profile.location && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sede asignada:</h4>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-gray-900">{profile.location.name}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin rol asignado</h3>
                <p className="text-sm text-gray-600 mb-1">
                  No tienes ningún rol configurado en el sistema.
                </p>
                <p className="text-xs text-gray-500">
                  Un administrador debe asignarte un rol para acceder a las funciones del sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para cambio de contraseña */}
      {passwordDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Cambiar Contraseña
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contraseña Actual</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handlePasswordChange}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cambiar Contraseña
                </button>
                <button
                  onClick={() => setPasswordDialog(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes de estado */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex bg-red-100 rounded-md p-1.5 text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-100 focus:ring-red-600"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{success}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setSuccess(null)}
                  className="inline-flex bg-green-100 rounded-md p-1.5 text-green-500 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-100 focus:ring-green-600"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;