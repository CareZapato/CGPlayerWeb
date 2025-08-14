import { AuthRequest } from '../middleware/auth';

// Helper para verificar si un usuario tiene un rol específico
export function hasRole(user: AuthRequest['user'], roles: string[]): boolean {
  if (!user || !user.roles) return false;
  return roles.some(role => user.roles.includes(role));
}

// Helper para verificar si un usuario es admin
export function isAdmin(user: AuthRequest['user']): boolean {
  return hasRole(user, ['ADMIN']);
}

// Helper para verificar si un usuario es admin o director (para compatibilidad)
export function isAdminOrDirector(user: AuthRequest['user']): boolean {
  return hasRole(user, ['ADMIN']);
}

// Helper para verificar si un usuario puede editar contenido
export function canEdit(user: AuthRequest['user']): boolean {
  return hasRole(user, ['ADMIN']);
}

// Helper para verificar si un usuario puede eliminar contenido
export function canDelete(user: AuthRequest['user']): boolean {
  return hasRole(user, ['ADMIN']);
}

// Helper para obtener el primer rol del usuario (para compatibilidad)
export function getUserPrimaryRole(user: AuthRequest['user']): string | null {
  if (!user || !user.roles || user.roles.length === 0) return null;
  return user.roles[0];
}
