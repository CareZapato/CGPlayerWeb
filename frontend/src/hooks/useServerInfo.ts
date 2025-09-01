import { useState, useEffect } from 'react';

interface ServerInfo {
  localIP: string;
  port: number;
  audioBaseUrl: string;
}

export const useServerInfo = () => {
  const [serverInfo, setServerInfo] = useState<ServerInfo>({
    localIP: import.meta.env.VITE_SERVER_HOST || 'localhost',
    port: parseInt(import.meta.env.VITE_SERVER_PORT) || 3001,
    audioBaseUrl: `${import.meta.env.VITE_API_BASE_URL}/api/songs/file`
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        // Detectar si estamos en móvil o IP local
        const currentHost = window.location.hostname;
        const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
        
        // Si no es localhost, usar la IP actual para el backend también
        const backendHost = isLocalhost ? 'localhost' : currentHost;
        
        // Construir URL base para archivos de audio dinámicamente
        const audioBaseUrl = `http://${backendHost}:3001/api/songs/file`;
        const backendUrl = `http://${backendHost}:3001/api/songs/info/server`;
        
        console.log('🌐 Detectando servidor...', { currentHost, backendUrl, audioBaseUrl });
        
        const response = await fetch(backendUrl);
        if (response.ok) {
          const info = await response.json();
          console.log('✅ Información del servidor:', info);
          // Asegurar que use la URL base correcta para audio
          setServerInfo({
            ...info,
            audioBaseUrl: audioBaseUrl
          });
        } else {
          console.log('⚠️ No se pudo obtener info del servidor, usando configuración por defecto');
          setServerInfo({
            localIP: backendHost,
            port: 3001,
            audioBaseUrl: audioBaseUrl
          });
        }
      } catch (error) {
        console.log('⚠️ Error al obtener info del servidor:', error);
        // Fallback inteligente
        const currentHost = window.location.hostname;
        const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
        const backendHost = isLocalhost ? 'localhost' : currentHost;
        
        setServerInfo({
          localIP: backendHost,
          port: 3001,
          audioBaseUrl: `http://${backendHost}:3001/api/songs/file`
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServerInfo();
  }, []);

  return { serverInfo, isLoading };
};
