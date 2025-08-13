// Configuración global de URLs
const config = {
  // Detectar automáticamente la URL base según el entorno
  getBaseURL: () => {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // Si no es localhost, usar la IP actual para el backend también
    const backendHost = isLocalhost ? 'localhost' : hostname;
    return `http://${backendHost}:3001`;
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

export default config;
