// API Configuration with dynamic host detection

// Get API base URL from environment or detect automatically
const getApiBaseUrl = (): string => {
  // Check if running in development with Vite
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Auto-detect based on current window location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // If accessing via IP, use the same IP for API
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:3001`;
  }
  
  // Default fallback
  return 'http://localhost:3001';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    SONGS: '/api/songs',
    ALBUMS: '/api/albums',
    PLAYLISTS: '/api/playlists',
    AUTH: '/api/auth',
    USERS: '/api/users',
    UPLOAD: '/api/upload'
  }
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getFileUrl = (filePath: string): string => {
  return `${API_CONFIG.BASE_URL}/uploads/${filePath}`;
};

export const getSongFileUrl = (folderName: string, fileName: string): string => {
  return `${API_CONFIG.BASE_URL}/api/songs/file/${folderName}/${fileName}`;
};

// Configuración global de URLs (legacy compatibility)
const config = {
  // Detectar automáticamente la URL base según el entorno
  getBaseURL: () => {
    return API_CONFIG.BASE_URL;
  },
  
  get API_URL() {
    return `${this.getBaseURL()}/api`;
  },
  
  // URLs específicas
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me'
  },
  
  songs: {
    base: '/songs',
    upload: '/songs/upload',
    multiUpload: '/songs/multi-upload',
    file: (folderName: string, fileName: string) => `/songs/file/${folderName}/${fileName}`,
    serverInfo: '/songs/info/server'
  },
  
  users: {
    base: '/users'
  },
  
  events: {
    base: '/events'
  },
  
  locations: {
    base: '/locations'  
  }
};

// Server info for backwards compatibility
export const serverInfo = {
  localIP: API_CONFIG.BASE_URL.replace(/https?:\/\//, '').split(':')[0],
  port: API_CONFIG.BASE_URL.includes(':3001') ? '3001' : '3001',
  baseUrl: API_CONFIG.BASE_URL,
  audioBaseUrl: `${API_CONFIG.BASE_URL}/api/songs/file`
};

console.log('🌐 [API CONFIG] Configured with:', {
  baseUrl: API_CONFIG.BASE_URL,
  hostname: window.location.hostname,
  protocol: window.location.protocol
});

export default config;
