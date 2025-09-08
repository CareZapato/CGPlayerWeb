/**
 * Configuración centralizada de la aplicación CGPlayer
 * Aquí se definen todas las constantes y parámetros globales
 */

// Obtener versión desde package.json en tiempo de build
const packageInfo = {
  version: process.env.REACT_APP_VERSION || '0.10.9'
};

export const APP_CONFIG = {
  // Información de la aplicación
  name: 'CGPlayer',
  version: `v${packageInfo.version}`,
  fullName: 'CGPlayer - Sistema de Gestión Musical',
  
  // URLs y endpoints
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
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
