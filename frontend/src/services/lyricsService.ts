import type { LyricsUploadResponse, SongWithLyrics, Lyric, LyricsSyncData, VoiceType } from '../types/lyrics';
import configService from './configService';

class LyricsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private handleAuthError(response: Response) {
    if (response.status === 401) {
      console.warn('🔐 [AUTH] Token inválido o expirado, limpiando localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redireccionar al login si estamos en una página que requiere autenticación
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
  }

  // Obtener letras de una canción
  async getLyrics(songId: string): Promise<SongWithLyrics> {
    try {
      console.log('🌐 [LYRICS SERVICE] Requesting lyrics for songId:', songId);
      
      const response = await fetch(`${configService.getApiBaseUrl()}/lyrics/${songId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        this.handleAuthError(response);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🌐 [LYRICS SERVICE] Response received:', data);
      
      // El backend devuelve { success: true, song: {...} }
      // Necesitamos extraer y transformar la respuesta
      if (data.success && data.song) {
        const songData = data.song;
        
        console.log('🌐 [LYRICS SERVICE] Song data:', songData);
        console.log('🌐 [LYRICS SERVICE] LyricsFiles in song:', songData.lyricsFiles);
        
        // Transformar a la estructura esperada por el frontend
        const transformedData: SongWithLyrics = {
          id: songData.id,
          title: songData.title,
          artist: songData.artist,
          voiceType: songData.voiceType,
          parentSongId: songData.parentSongId,
          hasLyricSync: songData.hasLyricSync,
          lyricsFiles: songData.lyricsFiles || [],
          lyrics: songData.lyrics || []
        };
        
        console.log('🌐 [LYRICS SERVICE] Transformed data:', transformedData);
        console.log('🌐 [LYRICS SERVICE] Final lyricsFiles count:', transformedData.lyricsFiles.length);
        
        return transformedData;
      } else {
        throw new Error('Invalid response format from backend');
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      throw error;
    }
  }

  // Actualizar letras de texto (tipo TEXT)
  async updateTextLyrics(songId: string, content: string, voiceType?: VoiceType | null): Promise<SongWithLyrics> {
    try {
      const response = await fetch(`${configService.getApiBaseUrl()}/lyrics/${songId}/text`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ content, voiceType })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating text lyrics:', error);
      throw error;
    }
  }

  // Subir archivo de letras (PDF, DOC, DOCX)
  async uploadLyricsFile(songId: string, file: File): Promise<LyricsUploadResponse> {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('lyrics', file);
      
      const response = await fetch(`${configService.getApiBaseUrl()}/lyrics/${songId}/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // No incluir Content-Type para multipart/form-data
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading lyrics file:', error);
      throw error;
    }
  }

  // Eliminar letras
  async deleteLyrics(songId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${configService.getApiBaseUrl()}/lyrics/${songId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting lyrics:', error);
      throw error;
    }
  }

  // Obtener líneas sincronizadas de letras
  async getSyncedLyrics(songId: string): Promise<Lyric[]> {
    try {
      console.log('🌐 [LYRICS SERVICE] Requesting synced lyrics for songId:', songId);
      
      const response = await fetch(`${configService.getApiBaseUrl()}/lyrics/${songId}/sync`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🌐 [LYRICS SERVICE] Synced lyrics response:', data);
      
      // El backend puede devolver { success: true, lyrics: [...] } o directamente [...]
      if (data.success && Array.isArray(data.lyrics)) {
        console.log('🌐 [LYRICS SERVICE] Found synced lyrics:', data.lyrics.length);
        return data.lyrics;
      } else if (Array.isArray(data)) {
        console.log('🌐 [LYRICS SERVICE] Direct array response:', data.length);
        return data;
      } else {
        console.log('🌐 [LYRICS SERVICE] No synced lyrics found');
        return [];
      }
    } catch (error) {
      console.error('Error fetching synced lyrics:', error);
      throw error;
    }
  }

  // Actualizar sincronización de letras
  async updateLyricsSync(songId: string, syncData: LyricsSyncData[]): Promise<Lyric[]> {
    try {
      const response = await fetch(`${configService.getApiBaseUrl()}/lyrics/${songId}/sync`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ syncData })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating lyrics sync:', error);
      throw error;
    }
  }

  // Obtener URL del archivo de letras
  getFileUrl(filePath: string): string {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${filePath}`;
  }
}

export const lyricsService = new LyricsService();
export default lyricsService;
