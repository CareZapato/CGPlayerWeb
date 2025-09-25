import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user: User, token: string) => {
        console.log('🔐 [AUTH_STORE] Login llamado con usuario:', user.firstName, user.roles);
        console.log('🔐 [AUTH_STORE] Location en usuario:', user.location);
        console.log('🔐 [AUTH_STORE] Usuario completo:', user);
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
        console.log('🔐 [AUTH_STORE] Estado actualizado:', { user: user.firstName, roles: user.roles, hasLocation: !!user.location, isAuthenticated: true });
      },
      logout: () => {
        console.log('🔐 [AUTH_STORE] Logout ejecutado');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (user: User) => {
        console.log('🔐 [AUTH_STORE] UpdateUser llamado con:', user.firstName, user.roles);
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
      // Validar estado al hidratar
      onRehydrateStorage: () => (state) => {
        if (state) {
          const storedToken = localStorage.getItem('token');
          // Si no hay token en localStorage, limpiar el estado
          if (!storedToken && state.isAuthenticated) {
            console.log('🔐 [AUTH_STORE] Token no encontrado, limpiando estado');
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);
