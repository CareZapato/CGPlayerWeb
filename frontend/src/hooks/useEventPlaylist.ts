import { useState } from 'react';
import { getApiUrl } from '../config/api';

interface EventPlaylist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  totalSongs: number;
  totalDuration: number;
  items: Array<{
    id: string;
    order: number;
    song: {
      id: string;
      title: string;
      artist: string;
      duration?: number;
      voiceType?: string;
      filePath?: string;
      folderName?: string;
      fileName?: string;
    };
  }>;
  type: 'event';
}

interface PlayEventResponse {
  eventId: string;
  eventTitle: string;
  songs: Array<{
    id: string;
    title: string;
    artist: string;
    duration?: number;
    voiceType?: string;
    filePath?: string;
    folderName?: string;
    fileName?: string;
  }>;
  totalSongs: number;
  currentSong: {
    id: string;
    title: string;
    artist: string;
    duration?: number;
    voiceType?: string;
    filePath?: string;
    folderName?: string;
    fileName?: string;
  };
}

export const useEventPlaylist = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEventPlaylist = async (eventId: string): Promise<EventPlaylist | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/events/${eventId}/playlist`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener playlist del evento');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const playEvent = async (eventId: string): Promise<PlayEventResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/events/${eventId}/play`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al reproducir evento');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    getEventPlaylist,
    playEvent,
    loading,
    error
  };
};
