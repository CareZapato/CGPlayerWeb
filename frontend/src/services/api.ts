import axios from 'axios';
import type { 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  User, 
  Song, 
  Playlist, 
  CreatePlaylistData,
  Lyric,
  CreateLyricData,
  VoiceType
} from '../types';

// Función para detectar la URL base automáticamente en tiempo real
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const backendHost = isLocalhost ? 'localhost' : hostname;
  const baseUrl = import.meta.env.VITE_API_URL || `http://${backendHost}:3001/api`;
  
  console.log('🌐 API Base URL detectada:', {
    hostname,
    isLocalhost,
    backendHost,
    baseUrl
  });
  
  return baseUrl;
};

const api = axios.create({
  timeout: 30000, // 30 segundos para móviles
});

// Interceptor para configurar URL base dinámicamente
api.interceptors.request.use((config) => {
  // Configurar URL base dinámicamente en cada request
  config.baseURL = getApiBaseUrl();
  
  // Agregar token si existe
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Headers adicionales para compatibilidad móvil - SOLO si no es FormData
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
  } else {
    // Para FormData, eliminar cualquier Content-Type predefinido
    delete config.headers['Content-Type'];
    console.log('📁 FormData detected - letting axios handle Content-Type');
  }
  
  console.log('🚀 Request:', {
    method: config.method?.toUpperCase(),
    url: `${config.baseURL}${config.url}`,
    hasToken: !!token,
    isFormData: config.data instanceof FormData
  });
  
  return config;
}, (error) => {
  console.error('❌ Request error:', error);
  return Promise.reject(error);
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Limpiar almacenamiento local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Solo redirigir si no estamos ya en la página de login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: RegisterData): Promise<{ data: AuthResponse }> =>
    api.post('/auth/register', data),
  
  login: (credentials: LoginCredentials): Promise<{ data: AuthResponse }> =>
    api.post('/auth/login', credentials),
  
  verify: (): Promise<{ data: { user: User } }> =>
    api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: (): Promise<{ data: User[] }> =>
    api.get('/users'),
  
  getProfile: (): Promise<{ data: User }> =>
    api.get('/users/profile'),
  
  assignVoiceProfile: (userId: string, voiceType: VoiceType): Promise<{ data: any }> =>
    api.post(`/users/${userId}/voice-profiles`, { voiceType }),
  
  removeVoiceProfile: (userId: string, voiceType: VoiceType): Promise<{ data: any }> =>
    api.delete(`/users/${userId}/voice-profiles/${voiceType}`),
};

// Songs API
export const songsAPI = {
  getAll: (): Promise<{ data: Song[] }> =>
    api.get('/songs'),
  
  getById: (id: string): Promise<{ data: Song }> =>
    api.get(`/songs/${id}`),
  
  upload: (formData: FormData): Promise<{ data: { song: Song } }> =>
    api.post('/songs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  assign: (songId: string, userId: string, voiceType: VoiceType): Promise<{ data: any }> =>
    api.post(`/songs/${songId}/assign`, { userId, voiceType }),
  
  delete: (id: string): Promise<{ data: any }> =>
    api.delete(`/songs/${id}`),
};

// Playlists API
export const playlistsAPI = {
  getAll: (voiceType?: VoiceType): Promise<{ data: Playlist[] }> =>
    api.get('/playlists', { params: voiceType ? { voiceType } : {} }),
  
  getById: (id: string): Promise<{ data: Playlist }> =>
    api.get(`/playlists/${id}`),
  
  create: (data: CreatePlaylistData): Promise<{ data: { playlist: Playlist } }> =>
    api.post('/playlists', data),
  
  update: (id: string, data: Partial<CreatePlaylistData>): Promise<{ data: { playlist: Playlist } }> =>
    api.put(`/playlists/${id}`, data),
  
  delete: (id: string): Promise<{ data: any }> =>
    api.delete(`/playlists/${id}`),
  
  addSong: (playlistId: string, songId: string): Promise<{ data: any }> =>
    api.post(`/playlists/${playlistId}/songs`, { songId }),
  
  removeSong: (playlistId: string, songId: string): Promise<{ data: any }> =>
    api.delete(`/playlists/${playlistId}/songs/${songId}`),
};

// Lyrics API
export const lyricsAPI = {
  getBySong: (songId: string, voiceType?: VoiceType): Promise<{ data: Lyric[] }> =>
    api.get(`/lyrics/song/${songId}`, { params: voiceType ? { voiceType } : {} }),
  
  create: (data: CreateLyricData): Promise<{ data: { lyric: Lyric } }> =>
    api.post('/lyrics', data),
  
  update: (id: string, data: Partial<CreateLyricData>): Promise<{ data: { lyric: Lyric } }> =>
    api.put(`/lyrics/${id}`, data),
  
  delete: (id: string): Promise<{ data: any }> =>
    api.delete(`/lyrics/${id}`),
};

export default api;
