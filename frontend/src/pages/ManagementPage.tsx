import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Cog6ToothIcon,
  UserGroupIcon,
  FolderIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const ManagementPage: React.FC = () => {
  const { user } = useAuthStore();

  const managementSections = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar usuarios, roles y permisos del sistema',
      icon: UserGroupIcon,
      path: '/users',
      available: true,
      roles: ['ADMIN', 'DIRECTOR']
    },
    {
      title: 'Gestión de Canciones',
      description: 'Organizar biblioteca musical, categorías y metadatos',
      icon: FolderIcon,
      path: '/songs',
      available: true,
      roles: ['ADMIN', 'DIRECTOR']
    },
    {
      title: 'Reportes y Estadísticas',
      description: 'Ver estadísticas de uso y generar reportes',
      icon: ChartBarIcon,
      path: '/reports',
      available: false,
      roles: ['ADMIN', 'DIRECTOR']
    },
    {
      title: 'Gestión de Eventos',
      description: 'Programar y administrar eventos musicales',
      icon: DocumentTextIcon,
      path: '/events',
      available: true,
      roles: ['ADMIN', 'DIRECTOR']
    },
    {
      title: 'Configuración del Sistema',
      description: 'Configuraciones avanzadas del servidor y aplicación',
      icon: CogIcon,
      path: '/system-settings',
      available: false,
      roles: ['ADMIN']
    },
    {
      title: 'Respaldos y Seguridad',
      description: 'Gestionar respaldos de datos y configuraciones de seguridad',
      icon: ShieldCheckIcon,
      path: '/backup',
      available: false,
      roles: ['ADMIN']
    }
  ];

  const userRoles = user?.roles?.map(r => r.role) || [];
  
  const availableSections = managementSections.filter(section => 
    section.roles.some(role => userRoles.includes(role as any)) && section.available
  );

  const upcomingSections = managementSections.filter(section => 
    section.roles.some(role => userRoles.includes(role as any)) && !section.available
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Panel de Gestión
        </h1>
        <p className="text-gray-600">
          Administra todos los aspectos del sistema CGPlayerWeb
        </p>
      </div>

      {/* Información del usuario */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Cog6ToothIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <span className="font-medium">
                Conectado como {userRoles.includes('ADMIN') ? 'Administrador' : 'Cantante'}:
              </span>{' '}
              {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Secciones disponibles */}
      {availableSections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Secciones Disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.path}
                  to={section.path}
                  className="group bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center mb-3">
                    <Icon className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                    <h3 className="ml-3 text-lg font-medium text-gray-900 group-hover:text-blue-700">
                      {section.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700">
                    {section.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                    <span>Acceder</span>
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Próximas funcionalidades */}
      {upcomingSections.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Próximas Funcionalidades
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.path}
                  className="bg-gray-50 p-6 rounded-lg border border-gray-200 opacity-75"
                >
                  <div className="flex items-center mb-3">
                    <Icon className="h-8 w-8 text-gray-400" />
                    <h3 className="ml-3 text-lg font-medium text-gray-600">
                      {section.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    {section.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-gray-400">
                    <span>Próximamente</span>
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensaje si no hay secciones disponibles */}
      {availableSections.length === 0 && upcomingSections.length === 0 && (
        <div className="text-center py-12">
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sin acceso a gestión</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tienes permisos para acceder a las funciones de gestión.
          </p>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;
