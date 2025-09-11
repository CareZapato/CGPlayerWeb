import { useState, useEffect } from 'react';

interface NetworkConfig {
  serverIP: string;
  urls: {
    local: string;
    network: string;
    frontend: string;
    api: string;
  };
  corsOrigins: string[];
  environment: string;
}

interface UseNetworkConfigResult {
  config: NetworkConfig | null;
  loading: boolean;
  error: string | null;
  apiURL: string;
  frontendURL: string;
}

/**
 * Hook para obtener automáticamente la configuración de red del servidor
 */
export function useNetworkConfig(): UseNetworkConfigResult {
  const [config, setConfig] = useState<NetworkConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URLs de fallback para diferentes entornos
  const getFallbackURLs = () => {
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    
    // Si estamos en desarrollo (Vite dev server)
    if (currentPort === '5173' || currentHost === 'localhost') {
      return {
        api: 'http://localhost:3001',
        frontend: `http://localhost:5173`
      };
    }
    
    // Si estamos en producción o accediendo por IP
    return {
      api: `http://${currentHost}:3001`,
      frontend: `http://${currentHost}`
    };
  };

  useEffect(() => {
    const detectNetworkConfig = async () => {
      setLoading(true);
      setError(null);

      try {
        // Intentar múltiples URLs para obtener la configuración
        const fallbackURLs = getFallbackURLs();
        const possibleAPIURLs = [
          fallbackURLs.api,
          'http://localhost:3001',
          // Agregar IP local si es diferente
          ...(window.location.hostname !== 'localhost' ? [`http://${window.location.hostname}:3001`] : [])
        ];

        let networkConfig: NetworkConfig | null = null;

        for (const apiURL of possibleAPIURLs) {
          try {
            console.log(`🔍 Probando API en: ${apiURL}`);
            
            const response = await fetch(`${apiURL}/api/network-config`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              // Timeout de 3 segundos por intento
              signal: AbortSignal.timeout(3000)
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                networkConfig = data.data;
                console.log(`✅ Configuración obtenida de: ${apiURL}`);
                break;
              }
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            console.warn(`⚠️ Falló conexión a ${apiURL}:`, errorMessage);
            continue;
          }
        }

        if (networkConfig) {
          setConfig(networkConfig);
          
          // Guardar en localStorage para uso posterior
          localStorage.setItem('cgplayer_network_config', JSON.stringify({
            config: networkConfig,
            timestamp: Date.now()
          }));
          
          console.log('🌐 Configuración de red cargada:', networkConfig);
        } else {
          throw new Error('No se pudo conectar a ninguna URL del servidor');
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error('❌ Error detectando configuración de red:', err);
        
        // Intentar cargar configuración guardada
        try {
          const cached = localStorage.getItem('cgplayer_network_config');
          if (cached) {
            const { config: cachedConfig, timestamp } = JSON.parse(cached);
            
            // Usar caché si tiene menos de 10 minutos
            if (Date.now() - timestamp < 10 * 60 * 1000) {
              setConfig(cachedConfig);
              console.log('📦 Usando configuración en caché');
              setLoading(false);
              return;
            }
          }
        } catch (cacheErr) {
          console.warn('⚠️ Error leyendo caché:', cacheErr);
        }

        // Fallback a configuración por defecto
        const fallbackURLs = getFallbackURLs();
        const fallbackConfig: NetworkConfig = {
          serverIP: window.location.hostname,
          urls: {
            local: 'http://localhost:3001',
            network: fallbackURLs.api,
            frontend: fallbackURLs.frontend,
            api: fallbackURLs.api
          },
          corsOrigins: [],
          environment: 'development'
        };

        setConfig(fallbackConfig);
        setError(`Usando configuración por defecto: ${errorMessage}`);
        
        console.warn('🔄 Usando configuración de fallback:', fallbackConfig);
      } finally {
        setLoading(false);
      }
    };

    detectNetworkConfig();
  }, []);

  // Determinar URLs actuales basadas en la configuración
  const apiURL = config?.urls.api || getFallbackURLs().api;
  const frontendURL = config?.urls.frontend || getFallbackURLs().frontend;

  return {
    config,
    loading,
    error,
    apiURL,
    frontendURL
  };
}

/**
 * Hook simplificado que solo retorna la URL de la API
 */
export function useAPIURL(): string {
  const { apiURL } = useNetworkConfig();
  return apiURL;
}

/**
 * Hook para verificar si estamos en red local
 */
export function useIsLocalNetwork(): boolean {
  const { config } = useNetworkConfig();
  
  if (!config) return false;
  
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1' && 
         config.serverIP !== 'localhost';
}

/**
 * Función utilitaria para obtener URL de API síncrona (con fallback)
 */
export function getAPIURLSync(): string {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Si estamos en desarrollo
  if (port === '5173' || hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  
  // Si estamos en red local
  return `http://${hostname}:3001`;
}
