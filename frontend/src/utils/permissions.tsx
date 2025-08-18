import type { User } from '../types';
import React from 'react';

// Configuración de permisos por sección basada en roles de la BD
export const SECTION_PERMISSIONS = {
  // Secciones accesibles para cantantes
  HOME: ['ADMIN', 'CANTANTE', 'DIRECTOR'] as const, // Pantalla de inicio/guía para todos
  DASHBOARD: ['ADMIN', 'DIRECTOR'] as const, // Dashboard solo para admin y directores
  SONGS: ['ADMIN', 'CANTANTE', 'DIRECTOR'] as const, // Vista de canciones en cuadros
  PLAYLISTS: ['ADMIN', 'CANTANTE', 'DIRECTOR'] as const,
  EVENTS: ['ADMIN', 'CANTANTE', 'DIRECTOR'] as const, // Cantantes pueden ver eventos
  PROFILE: ['ADMIN', 'CANTANTE', 'DIRECTOR'] as const,
  
  // Secciones para administradores
  MANAGEMENT: ['ADMIN'] as const, // Panel de gestión
  SONG_MANAGEMENT: ['ADMIN'] as const, // Gestión/subida de canciones
  USERS: ['ADMIN'] as const,
  LOCATIONS: ['ADMIN'] as const,
  REPORTS: ['ADMIN'] as const,
  SYSTEM: ['ADMIN'] as const,
  ANALYTICS: ['ADMIN'] as const,
  SETTINGS: ['ADMIN'] as const,
  BACKUP: ['ADMIN'] as const
} as const;

// Tipos para TypeScript
export type SectionKey = keyof typeof SECTION_PERMISSIONS;

/**
 * Verifica si un usuario tiene acceso a una sección específica
 * Basado en roles de la BD user_roles
 */
export const hasAccess = (user: User | null, section: SectionKey): boolean => {
  if (!user) {
    console.log(`🔐 [PERMISOS] Sin usuario para acceder a ${section}`);
    return false;
  }
  
  const allowedRoles = SECTION_PERMISSIONS[section];
  
  // Verificar roles activos del usuario
  const userRoles = user.roles?.filter(r => r.isActive).map(r => r.role) || [];
  
  console.log(`🔐 [PERMISOS] Verificando acceso a ${section}:`, {
    user: user.firstName,
    allowedRoles,
    allUserRoles: user.roles,
    activeUserRoles: userRoles,
    hasAccess: userRoles.some(role => allowedRoles.includes(role as any))
  });
  
  return userRoles.some(role => allowedRoles.includes(role as any));
};

/**
 * Obtiene las secciones accesibles para un usuario específico
 */
export const getAccessibleSections = (user: User | null): SectionKey[] => {
  if (!user) return [];
  
  return Object.keys(SECTION_PERMISSIONS).filter(section => 
    hasAccess(user, section as SectionKey)
  ) as SectionKey[];
};

/**
 * Hook para verificar permisos de acceso
 */
export const usePermissions = () => {
  const checkAccess = (user: User | null, section: SectionKey) => {
    return hasAccess(user, section);
  };

  const getMenuItems = (user: User | null) => {
    console.log('🍔 [MENU] Generando items de menú para usuario:', user?.firstName, user?.roles);
    
    const accessibleSections = getAccessibleSections(user);
    console.log('📋 [MENU] Secciones accesibles:', accessibleSections);
    
    const menuItems = [
      {
        key: 'HOME',
        label: 'Inicio',
        icon: 'Home',
        path: '/',
        type: 'single'
      },
      {
        key: 'DASHBOARD',
        label: 'Dashboard',
        icon: 'ChartBar',
        path: '/dashboard',
        type: 'single'
      },
      {
        key: 'SONGS',
        label: 'Canciones',
        icon: 'Music',
        path: '/albums', // Vista de cuadros/grid para todos los usuarios
        type: 'single'
      },
      {
        key: 'PLAYLISTS',
        label: 'Listas',
        icon: 'List',
        path: '/playlists',
        type: 'single'
      },
      {
        key: 'EVENTS',
        label: 'Eventos',
        icon: 'Calendar',
        path: '/events',
        type: 'single'
      },
      // Menú de gestión con submenús (solo para ADMIN/DIRECTOR)
      {
        key: 'MANAGEMENT',
        label: 'Gestión',
        icon: 'Settings',
        path: '/management',
        type: 'dropdown',
        children: [
          {
            key: 'SONG_MANAGEMENT',
            label: 'Gestión de Canciones',
            icon: 'FolderOpen',
            path: '/songs', // Gestión/subida de canciones
            requiredPermission: 'SONG_MANAGEMENT'
          },
          {
            key: 'USERS',
            label: 'Gestión de Usuarios',
            icon: 'Users',
            path: '/users',
            requiredPermission: 'USERS'
          },
          {
            key: 'EVENTS_MGMT',
            label: 'Gestión de Eventos',
            icon: 'Calendar',
            path: '/events-management',
            requiredPermission: 'MANAGEMENT'
          },
          {
            key: 'REPORTS',
            label: 'Reportes',
            icon: 'ChartBar',
            path: '/reports',
            requiredPermission: 'REPORTS'
          }
        ]
      },
      {
        key: 'PROFILE',
        label: 'Perfil',
        icon: 'User',
        path: '/profile',
        type: 'single'
      }
    ];

    return menuItems.filter(item => {
      if (item.type === 'dropdown') {
        // Para dropdowns, verificar si al menos un hijo es accesible
        const accessibleChildren: any[] = item.children?.filter(child => 
          hasAccess(user, child.requiredPermission as SectionKey)
        ) || [];
        const hasDropdownAccess: boolean = accessibleChildren.length > 0;
        return hasDropdownAccess;
      } else {
        // Para items simples, verificar acceso directo
        const hasAccessToSection = accessibleSections.includes(item.key as SectionKey);
        return hasAccessToSection;
      }
    }).map(item => {
      if (item.type === 'dropdown' && item.children) {
        // Filtrar los hijos accesibles
        const accessibleChildren = item.children.filter(child => 
          hasAccess(user, child.requiredPermission as SectionKey)
        );
        return { ...item, children: accessibleChildren };
      }
      return item;
    });
  };

  return {
    checkAccess,
    getMenuItems,
    getAccessibleSections
  };
};

/**
 * Componente de protección de rutas
 */
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  section: SectionKey;
  user: User | null;
  fallback?: React.ReactNode;
}> = ({ children, section, user, fallback }) => {
  const hasPermission = hasAccess(user, section);
  
  if (!hasPermission) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso Denegado</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

/**
 * Helper functions for role checking
 */
export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.roles?.some(role => role.role === 'ADMIN' && role.isActive) || false;
};

export const isDirector = (user: User | null): boolean => {
  if (!user) return false;
  return user.roles?.some(role => role.role === 'DIRECTOR' && role.isActive) || false;
};

export const isCantante = (user: User | null): boolean => {
  if (!user) return false;
  return user.roles?.some(role => role.role === 'CANTANTE' && role.isActive) || false;
};
