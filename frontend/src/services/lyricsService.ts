import type { LyricsUploadResponse, SongWithLyrics, Lyric, LyricsSyncData, VoiceType } from '../types/lyrics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class LyricsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Obtener letras de una canción
  async getLyrics(songId: string): Promise<SongWithLyrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/lyrics/${songId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      throw error;
    }
  }

  // Actualizar letras de texto (tipo TEXT)
  async updateTextLyrics(songId: string, content: string, voiceType?: VoiceType | null): Promise<SongWithLyrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/lyrics/${songId}/text`, {
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
      
      const response = await fetch(`${API_BASE_URL}/lyrics/${songId}/file`, {
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
      const response = await fetch(`${API_BASE_URL}/lyrics/${songId}`, {
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
      const response = await fetch(`${API_BASE_URL}/lyrics/${songId}/sync`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching synced lyrics:', error);
      throw error;
    }
  }

  // Actualizar sincronización de letras
  async updateLyricsSync(songId: string, syncData: LyricsSyncData[]): Promise<Lyric[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/lyrics/${songId}/sync`, {
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
