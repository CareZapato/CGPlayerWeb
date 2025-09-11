import { Request, Response, NextFunction } from 'express';
import { networkDetector } from '../utils/networkDetector';

interface DynamicConfig {
  serverIP: string;
  frontendURL: string;
  backendURL: string;
  corsOrigins: string[];
}

let cachedConfig: DynamicConfig | null = null;

/**
 * Obtiene la configuración dinámica del servidor
 */
export async function getDynamicConfig(): Promise<DynamicConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const networkConfig = await networkDetector.getNetworkConfig();
  const urls = await networkDetector.getAccessURLs(parseInt(process.env.PORT || '3001'));

  // Configurar CORS origins dinámicamente
  const corsOrigins = [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Frontend alternativo
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  // Agregar IP local si es diferente de localhost
  if (networkConfig.localIP !== 'localhost') {
    corsOrigins.push(
      `http://${networkConfig.localIP}:5173`,
      `http://${networkConfig.localIP}:3000`,
      `http://${networkConfig.localIP}`,
      urls.frontend
    );
  }

  cachedConfig = {
    serverIP: networkConfig.localIP,
    frontendURL: urls.frontend,
    backendURL: urls.api,
    corsOrigins: [...new Set(corsOrigins)] // Eliminar duplicados
  };

  console.log('🌐 Configuración dinámica cargada:', {
    serverIP: cachedConfig.serverIP,
    frontendURL: cachedConfig.frontendURL,
    backendURL: cachedConfig.backendURL,
    corsOrigins: cachedConfig.corsOrigins.length + ' origins'
  });

  return cachedConfig;
}

/**
 * Middleware para inyectar configuración de red en las requests
 */
export async function injectNetworkConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await getDynamicConfig();
    
    // Agregar configuración al objeto request para usar en otros middlewares
    (req as any).networkConfig = config;
    
    next();
  } catch (error) {
    console.error('❌ Error obteniendo configuración de red:', error);
    next(); // Continuar sin bloquear
  }
}

/**
 * Endpoint para obtener la configuración de red
 */
export async function getNetworkConfigEndpoint(req: Request, res: Response) {
  try {
    const config = await getDynamicConfig();
    const urls = await networkDetector.getAccessURLs(parseInt(process.env.PORT || '3001'));
    
    res.json({
      success: true,
      data: {
        serverIP: config.serverIP,
        urls: {
          local: 'http://localhost:3001',
          network: urls.network,
          frontend: config.frontendURL,
          api: config.backendURL
        },
        corsOrigins: config.corsOrigins,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('❌ Error en endpoint de configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo configuración de red'
    });
  }
}

/**
 * Limpia el caché de configuración (útil para development)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  networkDetector.clearCache();
  console.log('🔄 Caché de configuración limpiado');
}

// Función para obtener CORS origins dinámicamente
export async function getDynamicCorsOrigins(): Promise<string[]> {
  const config = await getDynamicConfig();
  return config.corsOrigins;
}
