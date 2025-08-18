import React, { useState, useEffect } from 'react';
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
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  location?: {
    id: string;
    name: string;
    city: string;
    color?: string;
  };
  voiceProfiles: Array<{
    id: string;
    voiceType: string;
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

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    voiceType: '',
    role: '',
    isActive: '',
    page: 1,
    limit: 10
  });

  // Estado del modal de confirmación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Estado del formulario de edición
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    locationId: '',
    isActive: true,
    selectedVoices: [] as string[]
  });

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
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
  };

  // Cargar ubicaciones
  const fetchLocations = async () => {
    try {
      const response = await fetch(getApiUrl('/api/users/data/locations'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      setLocations(data.locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, [filters]);

  // Manejar cambios en filtros
  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (typeof value === 'number' ? value : 1)
    }));
  };

  // Seleccionar usuario para el panel lateral
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      locationId: user.location?.id || '',
      isActive: user.isActive,
      selectedVoices: user.voiceProfiles.map(vp => vp.voiceType)
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
          locationId: editForm.locationId,
          isActive: editForm.isActive
        })
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update user');
      }

      // Actualizar voces
      const voicesResponse = await fetch(getApiUrl(`/api/users/${selectedUser.id}/voices`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          voiceTypes: editForm.selectedVoices
        })
      });

      if (!voicesResponse.ok) {
        throw new Error('Failed to update voices');
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
      toast.error('Error al actualizar usuario');
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

  // Manejar selección de voces
  const handleVoiceToggle = (voiceType: string) => {
    setEditForm(prev => ({
      ...prev,
      selectedVoices: prev.selectedVoices.includes(voiceType)
        ? prev.selectedVoices.filter(v => v !== voiceType)
        : [...prev.selectedVoices, voiceType]
    }));
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Administra usuarios, roles y permisos del sistema
          </p>
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

                  {/* Filtros en una sola fila en desktop, columna en móvil */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={filters.isActive}
                      onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      <option value="true">Activos</option>
                      <option value="false">Inactivos</option>
                    </select>

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
                            <div 
                              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs lg:text-sm"
                              style={{ backgroundColor: getLocationColor(user.location) }}
                            >
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </div>
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
                            {user.voiceProfiles.map((voice) => (
                              <span
                                key={voice.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
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
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg lg:text-2xl font-bold mx-auto mb-4">
                      {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
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
                        Ubicación
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editForm.locationId}
                        onChange={(e) => setEditForm(prev => ({ ...prev, locationId: e.target.value }))}
                      >
                        <option value="">Sin ubicación</option>
                        {locations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name} - {location.city}
                          </option>
                        ))}
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
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                        Usuario activo
                      </label>
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
