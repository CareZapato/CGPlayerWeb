/**
 * Configuración centralizada de la aplicación CGPlayer
 * Aquí se definen todas las constantes y parámetros globales
 */

// Función para detectar la URL base automáticamente
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
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
};

// Obtener versión desde package.json en tiempo de build
const packageInfo = {
  version: import.meta.env.VITE_APP_VERSION || '0.10.24'
};

export const APP_CONFIG = {
  // Información de la aplicación
  name: 'CGPlayer',
  version: `v${packageInfo.version}`,
  fullName: 'CGPlayer - Sistema de Gestión Musical',
  
  // URLs y endpoints
  api: {
    baseUrl: getApiBaseUrl(),
    version: 'v1'
  },
  
  // Configuración de UI
  ui: {
    itemsPerPage: 10,
    newsLimit: 8,
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  
  // Configuración de audio
  audio: {
    supportedFormats: ['mp3', 'wav', 'ogg', 'flac'],
    defaultVolume: 0.7,
    fadeInDuration: 500,
    fadeOutDuration: 300
  },
  
  // Estados del sistema
  status: {
    connected: 'Sistema Conectado',
    disconnected: 'Sistema Desconectado',
    loading: 'Cargando...',
    error: 'Error de conexión'
  },
  
  // Enlaces externos
  links: {
    changelog: '/changelog',
    documentation: '#',
    support: '#'
  }
};

// Función helper para obtener la versión completa
export const getFullVersion = () => `${APP_CONFIG.name} ${APP_CONFIG.version}`;

// Función helper para obtener el estado del sistema
export const getSystemStatus = () => APP_CONFIG.status.connected;

export default APP_CONFIG;
