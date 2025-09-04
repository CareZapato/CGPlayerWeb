class ConfigService {
  private static instance: ConfigService;
  private _apiBaseUrl: string | null = null;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Obtiene la URL base de la API de forma dinámica
   * Detecta si estamos en localhost o en la red y devuelve la URL apropiada
   */
  public getApiBaseUrl(): string {
    if (this._apiBaseUrl) {
      return this._apiBaseUrl;
    }

    // Si hay una variable de entorno definida, usarla (tiene prioridad)
    if (import.meta.env.VITE_API_BASE_URL) {
      this._apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      return this._apiBaseUrl as string;
    }

    // Detectar automáticamente basado en el hostname actual
    const currentHostname = window.location.hostname;
    const port = import.meta.env.VITE_SERVER_PORT || '3001';
    
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      // Estamos en localhost
      this._apiBaseUrl = `http://localhost:${port}`;
    } else {
      // Estamos en la red - usar IP desde variable de entorno o detectar automáticamente
      const serverIP = import.meta.env.VITE_SERVER_IP || currentHostname;
      this._apiBaseUrl = `http://${serverIP}:${port}`;
    }

    console.log('🌐 [CONFIG] API Base URL detected:', {
      hostname: currentHostname,
      serverIP: import.meta.env.VITE_SERVER_IP,
      port: port,
      apiUrl: this._apiBaseUrl
    });

    return this._apiBaseUrl as string;
  }

  /**
   * Construye una URL completa para archivos con autenticación
   */
  public buildFileUrl(endpoint: string, includeToken: boolean = true): string {
    const baseUrl = this.getApiBaseUrl();
    const token = includeToken ? localStorage.getItem('token') : null;
    
    // Agregar /api si el endpoint no lo incluye
    const apiPath = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const url = `${baseUrl}${apiPath}`;
    
    if (token && includeToken) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}token=${token}`;
    }
    
    return url;
  }

  /**
   * Resetea la URL base para forzar re-detección
   */
  public resetApiBaseUrl(): void {
    this._apiBaseUrl = null;
  }
}

export default ConfigService.getInstance();
