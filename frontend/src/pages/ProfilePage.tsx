import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { 
  UserIcon, 
  MicrophoneIcon, 
  ShieldCheckIcon, 
  ChartBarIcon, 
  TrophyIcon,
  MusicalNoteIcon,
  CalendarIcon,
  StarIcon,
  CheckIcon,
  CameraIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

// Interfaces
interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  unlocked: boolean;
  type: 'ensayos' | 'presentaciones';
}

interface SeasonStats {
  year: number;
  ensayosAsistidos: number;
  ensayosFaltas: number;
  ensayosInasistencias: number;
  totalEnsayos: number;
  eventosAsistidos: number;
  totalEventos: number;
  porcentajeAsistencia: number;
}

type ProfileSection = 'perfil' | 'vocal' | 'permisos' | 'estadisticas' | 'logros';

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  profileImageUrl?: string;
  voiceTypes?: VoiceType[];
  primaryVoice?: VoiceType;
  role: string;
  permissions?: string[];
}

interface VoiceType {
  voiceType: string;
  isPrimary: boolean;
  assignedBy: string;
  assignedAt: string;
}

const ProfilePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ProfileSection>('perfil');
  const [imageUploading, setImageUploading] = useState(false);
  const queryClient = useQueryClient();
  
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

  // Función para subir imagen de perfil
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede ser mayor a 5MB');
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await api.post('/profile/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ [PROFILE] Imagen subida exitosamente:', response.data);
      
      // Refrescar los datos del perfil
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
    } catch (error) {
      console.error('❌ [PROFILE] Error al subir imagen:', error);
      alert('Error al subir la imagen. Por favor intenta de nuevo.');
    } finally {
      setImageUploading(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  // Función para eliminar imagen de perfil
  const handleImageDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      return;
    }

    try {
      await api.delete('/profile/delete-image');
      console.log('✅ [PROFILE] Imagen eliminada exitosamente');
      
      // Refrescar los datos del perfil
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
    } catch (error) {
      console.error('❌ [PROFILE] Error al eliminar imagen:', error);
      alert('Error al eliminar la imagen. Por favor intenta de nuevo.');
    }
  };

  // Usar useQuery para cargar el perfil
  const { data: profile, isLoading: loading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/profile/me');
      console.log('🔍 [PROFILE] Datos del perfil recibidos:', response.data);
      return response.data;
    }
  });

  // Usar useQuery para cargar estadísticas reales del usuario
  const { data: userStats } = useQuery<SeasonStats[]>({
    queryKey: ['userStats'],
    queryFn: async () => {
      try {
        // Llamada a API que debe devolver estadísticas reales basadas en:
        // 1. Solicitudes confirmadas para ensayos (status = 'confirmado')
        // 2. Solicitudes rechazadas sin justificación (status = 'rechazado' y justificación = null) = Faltas
        // 3. Solicitudes rechazadas con justificación (status = 'rechazado' y justificación != null) = Inasistencias
        // 4. Participación en eventos confirmados
        // Todo agrupado por año/temporada desde la fecha actual hacia atrás
        const response = await api.get('/profile/stats');
        console.log('📊 [PROFILE] Estadísticas reales del usuario:', response.data);
        return response.data;
      } catch (error) {
        console.warn('⚠️ [PROFILE] Error cargando estadísticas reales, usando datos vacíos:', error);
        // Devolver array vacío si no hay datos reales
        return [];
      }
    }
  });

  const seasonStats = userStats || [];
  
  // Calcular totales basados en datos reales
  const totalEnsayosAsistidos = seasonStats.reduce((sum, season) => sum + season.ensayosAsistidos, 0);
  const totalEventosAsistidos = seasonStats.reduce((sum, season) => sum + season.eventosAsistidos, 0);
  const totalFaltas = seasonStats.reduce((sum, season) => sum + season.ensayosFaltas, 0);
  const totalInasistencias = seasonStats.reduce((sum, season) => sum + season.ensayosInasistencias, 0);


  // Sistema de logros basado en datos reales
  const achievements: Achievement[] = [
    {
      id: 1,
      name: "Primer Ensayo",
      description: "Participaste en tu primer ensayo",
      icon: "🎵",
      target: 1,
      progress: Math.min(totalEnsayosAsistidos, 1),
      unlocked: totalEnsayosAsistidos >= 1,
      type: 'ensayos'
    },
    {
      id: 2,
      name: "Ensayista Dedicado",
      description: "Participaste en 10 ensayos",
      icon: "🎼",
      target: 10,
      progress: Math.min(totalEnsayosAsistidos, 10),
      unlocked: totalEnsayosAsistidos >= 10,
      type: 'ensayos'
    },
    {
      id: 3,
      name: "Veterano del Coro",
      description: "Participaste en 50 ensayos",
      icon: "🎤",
      target: 50,
      progress: Math.min(totalEnsayosAsistidos, 50),
      unlocked: totalEnsayosAsistidos >= 50,
      type: 'ensayos'
    },
    {
      id: 4,
      name: "Maestro Corista",
      description: "Participaste en 100 ensayos",
      icon: "👑",
      target: 100,
      progress: Math.min(totalEnsayosAsistidos, 100),
      unlocked: totalEnsayosAsistidos >= 100,
      type: 'ensayos'
    },
    {
      id: 5,
      name: "Leyenda del Coro",
      description: "Participaste en 250 ensayos",
      icon: "🏆",
      target: 250,
      progress: Math.min(totalEnsayosAsistidos, 250),
      unlocked: totalEnsayosAsistidos >= 250,
      type: 'ensayos'
    },
    {
      id: 6,
      name: "Primera Presentación",
      description: "Participaste en tu primera presentación",
      icon: "⭐",
      target: 1,
      progress: Math.min(totalEventosAsistidos, 1),
      unlocked: totalEventosAsistidos >= 1,
      type: 'presentaciones'
    },
    {
      id: 7,
      name: "Artista Experimentado",
      description: "Participaste en 10 presentaciones",
      icon: "🌟",
      target: 10,
      progress: Math.min(totalEventosAsistidos, 10),
      unlocked: totalEventosAsistidos >= 10,
      type: 'presentaciones'
    },
    {
      id: 8,
      name: "Estrella del Escenario",
      description: "Participaste en 25 presentaciones",
      icon: "✨",
      target: 25,
      progress: Math.min(totalEventosAsistidos, 25),
      unlocked: totalEventosAsistidos >= 25,
      type: 'presentaciones'
    }
  ];



  // Componente del menú lateral
  const SidebarMenu = () => (
    <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 h-fit">
      <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-6 hidden lg:block">Mi Perfil</h2>
      <nav className="space-y-1 sm:space-y-2">
        {/* Mobile: Horizontal scroll */}
        <div className="lg:hidden">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {[
              { id: 'perfil', name: 'Perfil', icon: UserIcon },
              { id: 'vocal', name: 'Vocal', icon: MicrophoneIcon },
              { id: 'permisos', name: 'Permisos', icon: ShieldCheckIcon },
              { id: 'estadisticas', name: 'Stats', icon: ChartBarIcon },
              { id: 'logros', name: 'Logros', icon: TrophyIcon },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as ProfileSection)}
                  className={`flex-shrink-0 flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Desktop: Vertical menu */}
        <div className="hidden lg:block space-y-2">
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
        </div>
      </nav>
    </div>
  );

  // Componente de barra de progreso mejorado
  const ProgressBar = ({ progress, maxProgress, color = 'blue' }: { progress: number; maxProgress: number; color?: string }) => {
    const percentage = Math.min(Math.max((progress / maxProgress) * 100, 0), 100);
    const colorClasses = {
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      purple: 'bg-purple-600',
      red: 'bg-red-600'
    };
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorClasses[color as keyof typeof colorClasses] || 'bg-blue-600'}`}
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <SidebarMenu />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === 'perfil' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Header con foto de perfil */}
                <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    {/* Foto de perfil */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                        {profile.profileImageUrl ? (
                          <img
                            src={profile.profileImageUrl}
                            alt={`${profile.firstName} ${profile.lastName}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ [PROFILE] Error cargando imagen:', profile.profileImageUrl);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${profile.profileImageUrl ? 'hidden' : ''}`}>
                          <span className="text-2xl sm:text-3xl font-medium text-gray-600">
                            {profile.firstName?.[0]}{profile.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      
                      {/* Botones de acciones para la foto */}
                      <div className="absolute -bottom-2 -right-2 flex space-x-1">
                        <label className="cursor-pointer p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors">
                          <CameraIcon className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={imageUploading}
                          />
                        </label>
                        {profile.profileImageUrl && (
                          <button
                            onClick={handleImageDelete}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Indicador de carga */}
                      {imageUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Información básica */}
                    <div className="flex-1 text-center sm:text-left">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {profile.firstName} {profile.lastName}
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600 mt-1">@{profile.username}</p>
                      <p className="text-sm text-gray-500 mt-2">{profile.email}</p>
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {profile.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información detallada */}
                <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Información Personal</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Apellido</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Usuario</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                      <p className="mt-1 text-sm text-gray-900 break-all">{profile.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.phone || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {profile.dateOfBirth 
                          ? new Date(profile.dateOfBirth).toLocaleDateString('es-ES')
                          : 'No especificada'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'vocal' && (
              <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Información Vocal</h2>
                
                {profile?.voiceTypes && profile.voiceTypes.length > 0 ? (
                  <div className="space-y-6">
                    {/* Voz Principal */}
                    {profile.primaryVoice && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 w-fit">
                              ⚡ Voz Principal
                            </span>
                            <span className="sm:ml-3 text-base sm:text-lg font-semibold text-gray-900">
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
                  <div className="text-center py-6">
                    <MicrophoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Sin tipos de voz asignados</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Aún no tienes tipos de voz asignados por los administradores.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'permisos' && (
              <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Roles y Permisos</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol principal</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {profile.role}
                    </span>
                  </div>
                  {profile.permissions && profile.permissions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Permisos especiales</label>
                      <div className="flex flex-wrap gap-2">
                        {profile.permissions.map((permission: string, index: number) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'estadisticas' && (
              <div className="space-y-6">
                {/* Estadísticas por Temporada */}
                <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Estadísticas por Temporada</h2>
                  
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : seasonStats.length === 0 ? (
                    <div className="text-center py-12">
                      <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Sin estadísticas disponibles</h3>
                      <p className="text-gray-600">Aún no tienes datos de participación registrados.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Resumen general */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
                        <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                          <div className="flex flex-col items-center text-center">
                            <MusicalNoteIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mb-1" />
                            <p className="text-xs font-medium text-blue-600">Ensayos</p>
                            <p className="text-lg sm:text-xl font-bold text-blue-900">{totalEnsayosAsistidos}</p>
                          </div>
                        </div>
                        <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                          <div className="flex flex-col items-center text-center">
                            <StarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mb-1" />
                            <p className="text-xs font-medium text-green-600">Eventos</p>
                            <p className="text-lg sm:text-xl font-bold text-green-900">{totalEventosAsistidos}</p>
                          </div>
                        </div>
                        <div className="bg-red-50 p-2 sm:p-3 rounded-lg">
                          <div className="flex flex-col items-center text-center">
                            <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mb-1" />
                            <p className="text-xs font-medium text-red-600">Faltas</p>
                            <p className="text-lg sm:text-xl font-bold text-red-900">{totalFaltas}</p>
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-2 sm:p-3 rounded-lg">
                          <div className="flex flex-col items-center text-center">
                            <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 mb-1" />
                            <p className="text-xs font-medium text-yellow-600">Inasistencias</p>
                            <p className="text-lg sm:text-xl font-bold text-yellow-900">{totalInasistencias}</p>
                          </div>
                        </div>
                      </div>

                      {/* Estadísticas por año */}
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Desempeño por Año</h3>
                        {seasonStats.map((season) => (
                          <div key={season.year} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <h4 className="text-sm sm:text-base font-medium text-gray-900">Temporada {season.year}</h4>
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  season.porcentajeAsistencia >= 80 ? 'bg-green-100 text-green-800' :
                                  season.porcentajeAsistencia >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {season.porcentajeAsistencia.toFixed(1)}%
                                </span>
                                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                              <div>
                                <p className="text-xs text-gray-600">Asistidos</p>
                                <p className="text-sm sm:text-base font-semibold text-green-600">{season.ensayosAsistidos}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Faltas</p>
                                <p className="text-sm sm:text-base font-semibold text-red-600">{season.ensayosFaltas}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Inasistencias</p>
                                <p className="text-sm sm:text-base font-semibold text-yellow-600">{season.ensayosInasistencias}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Eventos</p>
                                <p className="text-sm sm:text-base font-semibold text-blue-600">{season.eventosAsistidos}/{season.totalEventos}</p>
                              </div>
                            </div>
                            
                            {/* Barra de progreso de asistencia */}
                            <div className="mt-2 sm:mt-3">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Asistencia General</span>
                                <span>{season.ensayosAsistidos}/{season.totalEnsayos}</span>
                              </div>
                              <ProgressBar 
                                progress={season.ensayosAsistidos} 
                                maxProgress={season.totalEnsayos}
                                color={season.porcentajeAsistencia >= 80 ? 'green' : season.porcentajeAsistencia >= 60 ? 'blue' : 'red'}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeSection === 'logros' && (
              <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Sistema de Logros</h2>
                <div className="space-y-3 sm:space-y-6">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className={`border rounded-lg p-3 sm:p-4 ${
                      achievement.unlocked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <span className="text-xl sm:text-2xl flex-shrink-0">{achievement.icon}</span>
                          <div className="min-w-0">
                            <h3 className={`text-sm sm:text-base font-semibold ${
                              achievement.unlocked ? 'text-green-900' : 'text-gray-700'
                            }`}>
                              {achievement.name}
                            </h3>
                            <p className={`text-xs sm:text-sm ${
                              achievement.unlocked ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        {achievement.unlocked && (
                          <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
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

export default ProfilePage;