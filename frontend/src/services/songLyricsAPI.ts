// Ejemplo de uso del servicio desde el frontend
import { API_CONFIG } from '../config/api';

interface UploadedVariant {
  voiceType: 'SOPRANO' | 'CONTRALTO' | 'TENOR' | 'BARITONO' | 'MESOSOPRANO' | 'BAJO' | 'CORO' | 'ORIGINAL' | 'INSTRUMENTAL';
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  folderName?: string;
}

interface CreateSongWithLyricsRequest {
  title: string;
  artist?: string;
  uploadedVariants: UploadedVariant[];
  lyricsText: string;
  replaceExistingLyrics?: boolean;
}

export class SongLyricsAPI {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async createSongWithLyrics(data: CreateSongWithLyricsRequest) {
    const response = await fetch(`${this.baseUrl}/api/songs-with-lyrics/with-lyrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create song with lyrics');
    }

    return await response.json();
  }

  async getSongStructure(parentId: string) {
    const response = await fetch(`${this.baseUrl}/api/songs-with-lyrics/${parentId}/structure`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get song structure');
    }

    return await response.json();
  }
}

// Ejemplo de uso:
export async function exampleUsage() {
  const api = new SongLyricsAPI(API_CONFIG.BASE_URL, 'your-jwt-token');

  // Ejemplo 1: Crear canción con letras
  try {
    const result = await api.createSongWithLyrics({
      title: 'Mi Canción de Prueba',
      artist: 'Artista de Prueba',
      uploadedVariants: [
        {
          voiceType: 'SOPRANO',
          fileName: 'cancion-soprano.mp3',
          filePath: '/uploads/cancion-soprano.mp3',
          fileSize: 5000000,
          mimeType: 'audio/mpeg',
          folderName: 'mi_cancion_prueba'
        },
        {
          voiceType: 'TENOR',
          fileName: 'cancion-tenor.mp3',
          filePath: '/uploads/cancion-tenor.mp3', 
          fileSize: 4800000,
          mimeType: 'audio/mpeg',
          folderName: 'mi_cancion_prueba'
        }
      ],
      lyricsText: `Primera línea de la letra
Segunda línea de la letra
Tercera línea de la letra

Segunda estrofa línea uno
Segunda estrofa línea dos
Segunda estrofa línea tres`,
      replaceExistingLyrics: true
    });

    console.log('✅ Canción creada:', result.data.parentSong);
    console.log('📄 Variantes:', result.data.variants);
    console.log('📝 Estadísticas:', result.data.statistics);

    // Ejemplo 2: Obtener estructura de la canción creada
    const structure = await api.getSongStructure(result.data.parentSong.id);
    console.log('📋 Estructura:', structure.data);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Hook de React para usar en componentes
import { useState, useCallback } from 'react';

export function useSongLyricsAPI(baseUrl: string, token: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = new SongLyricsAPI(baseUrl, token);

  const createSongWithLyrics = useCallback(async (data: CreateSongWithLyricsRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.createSongWithLyrics(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getSongStructure = useCallback(async (parentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getSongStructure(parentId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    createSongWithLyrics,
    getSongStructure,
    loading,
    error
  };
}
