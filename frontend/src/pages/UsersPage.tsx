import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  TrashIcon,
  PencilIcon,
  UserPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { getApiUrl } from '../config/api';
import UserAvatar from '../components/UserAvatar';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  status?: 'PENDING' | 'CONFIRMED' | 'REFUSED';
  createdAt: string;
  profileImage?: string | null;
  profileImageUrl?: string | null;
  location?: {
    id: string;
    name: string;
    city: string;
    color?: string;
  };
  voiceProfiles: Array<{
    id: string;
    voiceType: string;
    isPrimary?: boolean;
    createdAt: string;
    assignedByUser?: {
      firstName: string;
      lastName: string;
    };
  }>;
  roles: Array<{
    id: string;
    role: string;
    createdAt: string;
  }>;
}

interface Location {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  color?: string; // Color hexadecimal de la ubicación
}

interface CSVUser {
  lineNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  locationName: string;
  voiceTypes: string[];
}

// Función para obtener el color de la ubicación
const getLocationColor = (location?: { id: string; name: string; city: string; color?: string }) => {
  if (!location) return '#6b7280'; // Gris por defecto
  
  // Si la ubicación tiene color definido, usarlo
  if (location.color) return location.color;
  
  // Colores por defecto basados en el nombre/ciudad si no hay color en BD
  const defaultColors: { [key: string]: string } = {
    'santiago': '#1e3a8a', // Azul marino
    'antofagasta': '#dc2626', // Rojo
    'viña del mar': '#059669', // Verde esmeralda
    'vina del mar': '#059669', // Verde esmeralda
    'concepción': '#7c3aed', // Púrpura
    'concepcion': '#7c3aed', // Púrpura
    'valdivia': '#ea580c', // Naranja
    'todos los coristas': '#6b7280' // Gris
  };
  
  const cityKey = location.city.toLowerCase();
  const nameKey = location.name.toLowerCase();
  
  return defaultColors[cityKey] || defaultColors[nameKey] || '#6b7280';
};

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

import type { UserVoiceType } from '../types';

// Tipos de voz válidos para usuarios (sin CORO y ORIGINAL)
const VOICE_TYPES: UserVoiceType[] = ['SOPRANO', 'MESOSOPRANO', 'CONTRALTO', 'TENOR', 'BARITONO', 'BAJO'];

// Función para formatear tipos de voz a texto amigable
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
const ROLES = ['ADMIN', 'DIRECTOR', 'CANTANTE'];

// Función para formatear roles a texto amigable
const formatRole = (role: string): string => {
  const labels: { [key: string]: string } = {
    ADMIN: 'Administrador',
    DIRECTOR: 'Director',
    CANTANTE: 'Cantante'
  };
  return labels[role] || role;
};

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false
  });

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    voiceType: '',
    role: '',
    isActive: '',
    status: '',
    page: 1,
    limit: 10
  });

  // Estado del formulario de edición
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    locationId: '',
    isActive: true,
    selectedVoices: [] as string[],
    primaryVoice: '', // Nueva propiedad para voz primaria
    selectedRole: ''
  });

  // Estado del formulario de creación
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    locationId: '',
    isActive: true,
    selectedVoices: [] as string[],
    primaryVoice: '', // Nueva propiedad para voz primaria
    selectedRole: 'CANTANTE'
  });

  // Estado para importación CSV
  const [csvPreview, setCsvPreview] = useState<CSVUser[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // Cargar usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      // Si el usuario actual es Director, filtrar por su ubicación
      const isUserDirector = currentUser?.roles?.some(role => role.role === 'DIRECTOR');
      if (isUserDirector && currentUser?.locationId) {
        queryParams.append('location', currentUser.locationId);
      }
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== 0) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(getApiUrl(`/api/users?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser]);

  // Cargar ubicaciones
  const fetchLocations = async () => {
    try {
      const response = await fetch(getApiUrl('/api/locations'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      console.log('Locations loaded:', data); // Debug log
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]); // Fallback a array vacío
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, [fetchUsers]);

  // Manejar cambios en filtros
  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'number' ? value : 1)
    }));
  };

  // Manejar toggle de tipos de voz
  const handleVoiceToggle = (voiceType: string) => {
    setEditForm(prev => {
      const isRemoving = prev.selectedVoices.includes(voiceType);
      const newVoices = isRemoving 
        ? prev.selectedVoices.filter(v => v !== voiceType)
        : [...prev.selectedVoices, voiceType];
      
      // Si se está removiendo la voz primaria, elegir otra como primaria
      let newPrimaryVoice = prev.primaryVoice;
      if (isRemoving && prev.primaryVoice === voiceType) {
        newPrimaryVoice = newVoices.length > 0 ? newVoices[0] : '';
      }
      // Si no hay voz primaria y se está agregando una voz, hacerla primaria
      else if (!prev.primaryVoice && !isRemoving) {
        newPrimaryVoice = voiceType;
      }

      return {
        ...prev,
        selectedVoices: newVoices,
        primaryVoice: newPrimaryVoice
      };
    });
  };

  // Manejar toggle de tipos de voz para creación
  const handleCreateVoiceToggle = (voiceType: string) => {
    setCreateForm(prev => {
      const isRemoving = prev.selectedVoices.includes(voiceType);
      const newVoices = isRemoving 
        ? prev.selectedVoices.filter(v => v !== voiceType)
        : [...prev.selectedVoices, voiceType];
      
      // Si se está removiendo la voz primaria, elegir otra como primaria
      let newPrimaryVoice = prev.primaryVoice;
      if (isRemoving && prev.primaryVoice === voiceType) {
        newPrimaryVoice = newVoices.length > 0 ? newVoices[0] : '';
      }
      // Si no hay voz primaria y se está agregando una voz, hacerla primaria
      else if (!prev.primaryVoice && !isRemoving) {
        newPrimaryVoice = voiceType;
      }

      return {
        ...prev,
        selectedVoices: newVoices,
        primaryVoice: newPrimaryVoice
      };
    });
  };

  // Manejar cambio de voz primaria en edición
  const handlePrimaryVoiceChange = (voiceType: string) => {
    setEditForm(prev => ({
      ...prev,
      primaryVoice: voiceType
    }));
  };

  // Manejar cambio de voz primaria en creación
  const handleCreatePrimaryVoiceChange = (voiceType: string) => {
    setCreateForm(prev => ({
      ...prev,
      primaryVoice: voiceType
    }));
  };

  // Seleccionar usuario para el panel lateral
  const handleSelectUser = (user: User) => {
    console.log('Selected user:', user); // Debug log
    console.log('User location:', user.location); // Debug log
    setSelectedUser(user);
    // Encontrar la voz primaria
    const primaryVoiceProfile = user.voiceProfiles?.find(vp => vp.isPrimary);
    
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      phone: user.phone || '',
      locationId: user.location?.id || '',
      isActive: user.isActive,
      selectedVoices: user.voiceProfiles?.map(vp => vp.voiceType) || [],
      primaryVoice: primaryVoiceProfile?.voiceType || '',
      selectedRole: user.roles && user.roles.length > 0 ? user.roles[0].role : ''
    });
  };

  // Actualizar usuario
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // Actualizar datos básicos
      const userResponse = await fetch(getApiUrl(`/api/users/${selectedUser.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          username: editForm.username,
          phone: editForm.phone || null,
          locationId: editForm.locationId || null, // Convertir cadena vacía a null
          isActive: editForm.isActive
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      // Actualizar voces
      const voicesResponse = await fetch(getApiUrl(`/api/users/${selectedUser.id}/voices`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          voiceTypes: editForm.selectedVoices,
          primaryVoice: editForm.primaryVoice
        })
      });

      if (!voicesResponse.ok) {
        throw new Error('Failed to update voices');
      }

      // Actualizar rol (solo uno por usuario)
      if (editForm.selectedRole) {
        const roleResponse = await fetch(getApiUrl(`/api/users/${selectedUser.id}/role`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            role: editForm.selectedRole
          })
        });

        if (!roleResponse.ok) {
          throw new Error('Failed to update role');
        }
      }

      toast.success('Usuario actualizado correctamente');
      fetchUsers();
      
      // Actualizar usuario seleccionado
      const updatedUser = await fetch(getApiUrl(`/api/users/${selectedUser.id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (updatedUser.ok) {
        const userData = await updatedUser.json();
        setSelectedUser(userData.user);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar usuario';
      toast.error(errorMessage);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success('Usuario eliminado correctamente');
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  // Crear usuario manual
  const handleCreateUser = async () => {
    try {
      const isUserDirector = currentUser?.roles?.some(role => role.role === 'DIRECTOR');
      
      const response = await fetch(getApiUrl('/api/users/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email,
          username: createForm.username,
          phone: createForm.phone || null,
          password: createForm.password,
          // Si es Director, usar su ubicación, de lo contrario usar la seleccionada
          locationId: isUserDirector ? currentUser?.locationId : (createForm.locationId || null),
          isActive: createForm.isActive,
          // Si es Director, el usuario queda PENDING, de lo contrario CONFIRMED
          status: isUserDirector ? 'PENDING' : 'CONFIRMED',
          voiceTypes: createForm.selectedVoices,
          primaryVoice: createForm.primaryVoice || null,
          role: createForm.selectedRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || 'Error al crear usuario');
      }

      if (isUserDirector) {
        toast.success('Usuario creado y enviado para aprobación por administrador');
      } else {
        toast.success('Usuario creado correctamente');
      }
      
      fetchUsers();
      setShowCreateModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        phone: '',
        password: '',
        locationId: '',
        isActive: true,
        selectedVoices: [],
        primaryVoice: '',
        selectedRole: 'CANTANTE'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear usuario';
      toast.error(errorMessage);
    }
  };

  // Aprobar usuario (solo admins)
  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/users/${userId}/approve`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al aprobar usuario');
      }

      toast.success('Usuario aprobado correctamente');
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al aprobar usuario';
      toast.error(errorMessage);
    }
  };

  // Rechazar usuario (solo admins)
  const handleRejectUser = async (userId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/users/${userId}/reject`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al rechazar usuario');
      }

      toast.success('Usuario rechazado');
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al rechazar usuario';
      toast.error(errorMessage);
    }
  };

  // Validaciones para edición de usuarios
  const canEditUserActiveStatus = (user: User | null): boolean => {
    if (!user) return false;
    
    // Si el usuario está PENDING, no se puede cambiar el estado
    if (user.status === 'PENDING') return false;
    
    // Si el usuario actual es Director y el usuario está REFUSED, no puede activarlo
    const isCurrentUserDirector = currentUser?.roles?.some(role => role.role === 'DIRECTOR');
    const isCurrentUserAdmin = currentUser?.roles?.some(role => role.role === 'ADMIN');
    
    if (isCurrentUserDirector && !isCurrentUserAdmin && user.status === 'REFUSED') {
      return false;
    }
    
    return true;
  };

  const getActiveStatusMessage = (user: User | null): string => {
    if (!user) return '';
    
    if (user.status === 'PENDING') {
      return 'No se puede cambiar el estado mientras esté pendiente de aprobación';
    }
    
    const isCurrentUserDirector = currentUser?.roles?.some(role => role.role === 'DIRECTOR');
    const isCurrentUserAdmin = currentUser?.roles?.some(role => role.role === 'ADMIN');
    
    if (isCurrentUserDirector && !isCurrentUserAdmin && user.status === 'REFUSED') {
      return 'Los directores no pueden reactivar usuarios rechazados';
    }
    
    return '';
  };

  // Procesar archivo CSV
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const user: CSVUser = { 
          lineNumber: index + 2, // +2 porque empezamos desde línea 2 (después del header)
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          phone: '',
          locationName: '',
          voiceTypes: []
        };
        
        // Mapear según el formato esperado:
        // Nombre, Apellido, Email, Usuario, Telefono, Ubicacion, voicetype1, voicetype2, voicetype3, voicetype4, voicetype5
        user.firstName = values[0] || '';
        user.lastName = values[1] || '';
        user.email = values[2] || '';
        user.username = values[3] || '';
        user.phone = values[4] || '';
        user.locationName = values[5] || '';
        
        // Procesar tipos de voz (columnas 6-10)
        user.voiceTypes = [];
        for (let i = 6; i < Math.min(11, values.length); i++) {
          if (values[i] && VOICE_TYPES.includes(values[i].toUpperCase() as UserVoiceType)) {
            user.voiceTypes.push(values[i].toUpperCase());
          }
        }
        
        return user;
      });
      
      setCsvPreview(data);
    };
    
    reader.readAsText(file);
  };

  // Importar usuarios desde CSV
  const handleImportCSV = async () => {
    if (!csvPreview.length) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const response = await fetch(getApiUrl('/api/users/import-csv'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          users: csvPreview
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import users');
      }

      const result = await response.json();
      toast.success(`${result.created} usuarios importados correctamente`);
      
      if (result.errors && result.errors.length > 0) {
        toast.error(`${result.errors.length} usuarios tuvieron errores`);
      }

      fetchUsers();
      setShowImportModal(false);
      setCsvPreview([]);
    } catch (error) {
      console.error('Error importing users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al importar usuarios';
      toast.error(errorMessage);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
        <div className="animate-pulse max-w-full mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-8">
              <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-2">
                Administra usuarios, roles y permisos del sistema
              </p>
            </div>
            
            {currentUser?.roles && (currentUser.roles.some(r => r.role === 'ADMIN') || currentUser.roles.some(r => r.role === 'DIRECTOR')) && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  <span>
                    {currentUser.roles.some(r => r.role === 'ADMIN') ? 'Crear Usuario' : 'Crear Cantante'}
                  </span>
                </button>
                {currentUser.roles.some(r => r.role === 'ADMIN') && (
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span>Importar CSV</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Panel principal - Lista de usuarios (70%) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow">
              {/* Filtros y búsqueda */}
              <div className="p-4 lg:p-6 border-b border-gray-200">
                <div className="flex flex-col gap-4">
                  {/* Búsqueda */}
                  <div className="w-full">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, email o usuario..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filtros dinámicos - Grid se adapta según el rol */}
                  <div className={`grid gap-3 ${
                    currentUser?.roles?.some(role => role.role === 'ADMIN') 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}>
                    {/* Filtro de ubicación - Solo para ADMINs */}
                    {currentUser?.roles?.some(role => role.role === 'ADMIN') && (
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                      >
                        <option value="">Todas las ubicaciones</option>
                        {locations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name} - {location.city}
                          </option>
                        ))}
                      </select>
                    )}

                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={filters.voiceType}
                      onChange={(e) => handleFilterChange('voiceType', e.target.value)}
                    >
                      <option value="">Todos los tipos de voz</option>
                      {VOICE_TYPES.map(voice => (
                        <option key={voice} value={voice}>
                          {formatVoiceType(voice)}
                        </option>
                      ))}
                    </select>

                    {/* Filtro de roles - Solo para ADMINs */}
                    {currentUser?.roles?.some(role => role.role === 'ADMIN') && (
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                      >
                        <option value="">Todos los roles</option>
                        {ROLES.map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    )}

                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={filters.isActive}
                      onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      <option value="true">Activos</option>
                      <option value="false">Inactivos</option>
                    </select>

                    {/* Solo mostrar filtro de estado para admins */}
                    {currentUser?.roles?.some(role => role.role === 'ADMIN') && (
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">Todos los estados</option>
                        <option value="CONFIRMED">Confirmados</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="REFUSED">Rechazados</option>
                      </select>
                    )}

                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={filters.limit}
                      onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                    >
                      <option value={5}>5 por página</option>
                      <option value={10}>10 por página</option>
                      <option value={25}>25 por página</option>
                      <option value={50}>50 por página</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabla de usuarios */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="hidden lg:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voces
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      {/* Solo mostrar columna de aprobación para admins */}
                      {currentUser?.roles?.some(role => role.role === 'ADMIN') && (
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aprobación
                        </th>
                      )}
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr 
                        key={user.id}
                        className={`hover:bg-gray-50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSelectUser(user)}
                      >
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserAvatar
                              user={user}
                              size="md"
                              backgroundColor={getLocationColor(user.location)}
                            />
                            <div className="ml-3 lg:ml-4">
                              <div className="text-xs lg:text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                @{user.username}
                              </div>
                              <div className="sm:hidden text-xs text-gray-500 mt-1">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="hidden md:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                          {user.location ? `${user.location.name} - ${user.location.city}` : 'Sin ubicación'}
                        </td>
                        <td className="hidden lg:table-cell px-3 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.voiceProfiles
                              .sort((a, b) => ((b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))) // Voz primaria primero
                              .map((voice) => (
                              <span
                                key={voice.id}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  voice.isPrimary 
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                                title={voice.isPrimary ? 'Voz Primaria' : 'Voz Secundaria'}
                              >
                                {voice.isPrimary && <span className="mr-1">⭐</span>}
                                {formatVoiceType(voice.voiceType)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        {/* Solo mostrar columna de aprobación para admins */}
                        {currentUser?.roles?.some(role => role.role === 'ADMIN') && (
                          <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.status === 'CONFIRMED' 
                                  ? 'bg-green-100 text-green-800'
                                  : user.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status === 'CONFIRMED' ? 'Confirmado' : 
                                 user.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
                              </span>
                              {user.status === 'PENDING' && (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveUser(user.id);
                                    }}
                                    className="text-green-600 hover:text-green-900 text-xs px-2 py-1 bg-green-50 rounded"
                                    title="Aprobar"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRejectUser(user.id);
                                    }}
                                    className="text-red-600 hover:text-red-900 text-xs px-2 py-1 bg-red-50 rounded"
                                    title="Rechazar"
                                  >
                                    ✗
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectUser(user);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            {currentUser?.roles && currentUser.roles.some(r => r.role === 'ADMIN') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(user.id);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-3 lg:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs lg:text-sm text-gray-700 text-center sm:text-left">
                  Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} de{' '}
                  {pagination.totalCount} usuarios
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-xs lg:text-sm text-gray-700">
                    Página {pagination.currentPage} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel lateral - Detalles del usuario (30%) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow p-4 lg:p-6 lg:sticky lg:top-6">
              {selectedUser ? (
                <div>
                  {/* Header del usuario */}
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <UserAvatar
                        user={selectedUser}
                        size="lg"
                        backgroundColor={getLocationColor(selectedUser.location)}
                        className="w-16 h-16 lg:w-20 lg:h-20 text-lg lg:text-2xl"
                      />
                    </div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-gray-600 text-sm lg:text-base">@{selectedUser.username}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUser.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Formulario de edición */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuario
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+56 9 1234 5678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol del Usuario
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editForm.selectedRole}
                        onChange={(e) => setEditForm(prev => ({ ...prev, selectedRole: e.target.value }))}
                      >
                        <option value="">Seleccionar rol</option>
                        {ROLES.map(role => (
                          <option key={role} value={role}>
                            {formatRole(role)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ubicación
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editForm.locationId}
                        onChange={(e) => setEditForm(prev => ({ ...prev, locationId: e.target.value }))}
                      >
                        <option value="">Sin ubicación</option>
                        {locations.length === 0 && (
                          <option value="" disabled>Cargando ubicaciones...</option>
                        )}
                        {locations.map(location => {
                          console.log('Rendering edit location option:', location); // Debug log
                          return (
                            <option key={location.id} value={location.id}>
                              {location.name} - {location.city}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipos de Voz
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {VOICE_TYPES.map(voice => (
                          <label key={voice} className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={editForm.selectedVoices.includes(voice)}
                              onChange={() => handleVoiceToggle(voice)}
                            />
                            <span className="ml-2 text-sm text-gray-700">{formatVoiceType(voice)}</span>
                          </label>
                        ))}
                      </div>
                      
                      {/* Selector de Voz Primaria */}
                      {editForm.selectedVoices.length > 1 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <label className="block text-sm font-medium text-blue-800 mb-2">
                            <span className="flex items-center">
                              <span className="text-blue-600 mr-1">⭐</span>
                              Voz Primaria
                            </span>
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {editForm.selectedVoices.map(voice => (
                              <label key={voice} className="flex items-center">
                                <input
                                  type="radio"
                                  name="primaryVoice"
                                  className="border-blue-300 text-blue-600 focus:ring-blue-500"
                                  checked={editForm.primaryVoice === voice}
                                  onChange={() => handlePrimaryVoiceChange(voice)}
                                />
                                <span className="ml-2 text-sm text-blue-700">{formatVoiceType(voice)}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            Esta será la voz principal mostrada en el perfil
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isActive"
                          className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                            !canEditUserActiveStatus(selectedUser) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          checked={editForm.isActive}
                          disabled={!canEditUserActiveStatus(selectedUser)}
                          onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        />
                        <label htmlFor="isActive" className={`ml-2 text-sm ${
                          !canEditUserActiveStatus(selectedUser) ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          Usuario activo
                        </label>
                      </div>
                      {!canEditUserActiveStatus(selectedUser) && (
                        <p className="text-xs text-amber-600 mt-1 ml-6">
                          {getActiveStatusMessage(selectedUser)}
                        </p>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="pt-4 space-y-2">
                      <button
                        onClick={handleUpdateUser}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Guardar Cambios
                      </button>
                      
                      {currentUser?.roles && currentUser.roles.some(r => r.role === 'ADMIN') && (
                        <button
                          onClick={() => setShowDeleteConfirm(selectedUser.id)}
                          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Eliminar Usuario
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Sistema</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Registrado:</span>{' '}
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Roles:</span>{' '}
                        {selectedUser.roles.map(r => r.role).join(', ') || 'Sin roles'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                    <UserPlusIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p>Selecciona un usuario para ver sus detalles y editarlo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de crear usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {currentUser?.roles?.some(role => role.role === 'ADMIN') 
                        ? 'Crear Nuevo Usuario' 
                        : 'Crear Nuevo Cantante'
                      }
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {currentUser?.roles?.some(role => role.role === 'ADMIN') 
                        ? 'Complete los datos para crear un nuevo usuario en el sistema' 
                        : 'Complete los datos para agregar un nuevo cantante a su delegación'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del formulario */}
            <div className="p-6 max-h-[calc(95vh-120px)] overflow-y-auto">
              
              {/* Sección: Información Personal */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Información Personal</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Ingrese el nombre"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Ingrese el apellido"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Cuenta y Acceso */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Cuenta y Acceso</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Usuario <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={createForm.username}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="nombre_usuario"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Contraseña <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={createForm.password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Rol y Ubicación */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Rol y Ubicación</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Rol <span className="text-red-500">*</span>
                    </label>
                    {currentUser?.roles?.some(role => role.role === 'ADMIN') ? (
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        value={createForm.selectedRole}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, selectedRole: e.target.value }))}
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>
                            {formatRole(role)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium">
                        🎤 Cantante
                      </div>
                    )}
                  </div>

                  {/* Solo mostrar selector de ubicación para ADMINs */}
                  {currentUser?.roles?.some(role => role.role === 'ADMIN') && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Ubicación
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        value={createForm.locationId}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, locationId: e.target.value }))}
                      >
                        <option value="">Sin ubicación</option>
                        {locations.length === 0 && (
                          <option value="" disabled>Cargando ubicaciones...</option>
                        )}
                        {locations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name} - {location.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Para Directors, mostrar información de la ubicación asignada automáticamente */}
                  {currentUser?.roles?.some(role => role.role === 'DIRECTOR') && !currentUser?.roles?.some(role => role.role === 'ADMIN') && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Ubicación
                      </label>
                      <div className="w-full px-4 py-3 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 font-medium flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Se asignará automáticamente a tu ubicación
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección: Tipos de Voz */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-pink-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Tipos de Voz</h4>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {VOICE_TYPES.map(voice => (
                      <label key={voice} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                          checked={createForm.selectedVoices.includes(voice)}
                          onChange={() => handleCreateVoiceToggle(voice)}
                        />
                        <span className="text-sm text-gray-700 font-medium">{formatVoiceType(voice)}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Selector de Voz Primaria */}
                  {createForm.selectedVoices.length > 1 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-3">
                        <span className="text-blue-600 mr-2 text-lg">⭐</span>
                        <label className="block text-sm font-medium text-blue-800">
                          Voz Primaria
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {createForm.selectedVoices.map(voice => (
                          <label key={voice} className="flex items-center p-2 bg-white bg-opacity-60 rounded-lg">
                            <input
                              type="radio"
                              name="createPrimaryVoice"
                              className="border-blue-300 text-blue-600 focus:ring-blue-500 mr-2"
                              checked={createForm.primaryVoice === voice}
                              onChange={() => handleCreatePrimaryVoiceChange(voice)}
                            />
                            <span className="text-sm text-blue-700 font-medium">{formatVoiceType(voice)}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Esta será la voz principal mostrada en el perfil del cantante
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Solo mostrar checkbox de activo para ADMINs */}
              {currentUser?.roles?.some(role => role.role === 'ADMIN') && (
                <div className="mt-6 flex items-center">
                  <input
                    type="checkbox"
                    id="createIsActive"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="createIsActive" className="ml-2 text-sm text-gray-700">
                    Usuario activo
                  </label>
                </div>
              )}

              {/* Para Directors, mostrar info de que el usuario será activo por defecto */}
              {currentUser?.roles?.some(role => role.role === 'DIRECTOR') && !currentUser?.roles?.some(role => role.role === 'ADMIN') && (
                <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-800 font-medium">
                      El usuario será creado como activo y en estado pendiente de aprobación
                    </span>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.username || !createForm.password}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {currentUser?.roles?.some(role => role.role === 'ADMIN') 
                    ? 'Crear Usuario' 
                    : 'Crear Cantante'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de importar CSV */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Importar Usuarios desde CSV
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Instrucciones */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Formato CSV esperado:</h4>
                <p className="text-sm text-blue-800 mb-2">
                  El archivo debe tener las siguientes columnas en este orden:
                </p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                  Nombre, Apellido, Email, Usuario, Telefono, Ubicacion, VoiceType1, VoiceType2, VoiceType3, VoiceType4, VoiceType5
                </code>
                <p className="text-xs text-blue-700 mt-2">
                  * Los tipos de voz válidos son: SOPRANO, MESOSOPRANO, CONTRALTO, TENOR, BARITONO, BAJO<br/>
                  * La ubicación debe coincidir con el nombre de una ciudad existente<br/>
                  * Los usuarios se crearán con rol CANTANTE por defecto y contraseña "usuario123"
                </p>
              </div>

              {/* Selector de archivo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Vista previa */}
              {csvPreview.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Vista previa ({csvPreview.length} usuarios)
                  </h4>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Línea</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Apellido</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Voces</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvPreview.slice(0, 10).map((user, index) => (
                          <tr key={index} className={!user.firstName || !user.lastName || !user.email || !user.username ? 'bg-red-50' : ''}>
                            <td className="px-3 py-2 text-xs text-gray-500">{user.lineNumber}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{user.firstName}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{user.lastName}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{user.email}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{user.username}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{user.phone}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{user.locationName}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {user.voiceTypes.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvPreview.length > 10 && (
                      <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                        ... y {csvPreview.length - 10} usuarios más
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progreso de importación */}
              {isImporting && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Importando usuarios...</span>
                    <span className="text-sm text-gray-500">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  disabled={isImporting}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportCSV}
                  disabled={csvPreview.length === 0 || isImporting}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importando...' : `Importar ${csvPreview.length} Usuarios`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
