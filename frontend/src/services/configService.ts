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

    // Si hay una variable de entorno definida, usarla
    if (import.meta.env.VITE_API_URL) {
      this._apiBaseUrl = import.meta.env.VITE_API_URL;
      return this._apiBaseUrl as string;
    }

    // Detectar automáticamente basado en el hostname actual
    const currentHostname = window.location.hostname;
    
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      // Estamos en localhost
      this._apiBaseUrl = 'http://localhost:3001/api';
    } else {
      // Estamos en la red (probablemente móvil)
      this._apiBaseUrl = 'http://192.168.1.11:3001/api';
    }

    console.log('🌐 [CONFIG] API Base URL detected:', {
      hostname: currentHostname,
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
    
    const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
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
