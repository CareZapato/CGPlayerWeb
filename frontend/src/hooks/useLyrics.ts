import { useState, useCallback } from 'react';
import type { SongWithLyrics, Lyric, LyricsSyncData, LyricsUploadResponse, VoiceType } from '../types/lyrics';
import lyricsService from '../services/lyricsService';

interface UseLyricsState {
  lyrics: SongWithLyrics | null;
  syncedLyrics: Lyric[];
  isLoading: boolean;
  error: string | null;
}

export function useLyrics(songId?: string) {
  const [state, setState] = useState<UseLyricsState>({
    lyrics: null,
    syncedLyrics: [],
    isLoading: false,
    error: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Cargar letras de una canción
  const loadLyrics = useCallback(async (targetSongId?: string) => {
    const id = targetSongId || songId;
    if (!id) {
      setError('No song ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lyrics = await lyricsService.getLyrics(id);
      setState(prev => ({ ...prev, lyrics, isLoading: false }));
    } catch (error) {
      console.error('Error loading lyrics:', error);
      setError(error instanceof Error ? error.message : 'Error loading lyrics');
      setLoading(false);
    }
  }, [songId, setLoading, setError]);

  // Cargar letras sincronizadas
  const loadSyncedLyrics = useCallback(async (targetSongId?: string) => {
    const id = targetSongId || songId;
    if (!id) {
      setError('No song ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const syncedLyrics = await lyricsService.getSyncedLyrics(id);
      setState(prev => ({ ...prev, syncedLyrics, isLoading: false }));
    } catch (error) {
      console.error('Error loading synced lyrics:', error);
      setError(error instanceof Error ? error.message : 'Error loading synced lyrics');
      setLoading(false);
    }
  }, [songId, setLoading, setError]);

  // Actualizar letras de texto
  const updateTextLyrics = useCallback(async (content: string, voiceType?: VoiceType | null, targetSongId?: string) => {
    const id = targetSongId || songId;
    if (!id) {
      setError('No song ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedLyrics = await lyricsService.updateTextLyrics(id, content, voiceType);
      setState(prev => ({ ...prev, lyrics: updatedLyrics, isLoading: false }));
      return updatedLyrics;
    } catch (error) {
      console.error('Error updating text lyrics:', error);
      setError(error instanceof Error ? error.message : 'Error updating text lyrics');
      setLoading(false);
      throw error;
    }
  }, [songId, setLoading, setError]);

  // Subir archivo de letras
  const uploadLyricsFile = useCallback(async (file: File, targetSongId?: string): Promise<LyricsUploadResponse> => {
    const id = targetSongId || songId;
    if (!id) {
      setError('No song ID provided');
      throw new Error('No song ID provided');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await lyricsService.uploadLyricsFile(id, file);
      // Recargar las letras después de subir el archivo
      await loadLyrics(id);
      setLoading(false);
      return result;
    } catch (error) {
      console.error('Error uploading lyrics file:', error);
      setError(error instanceof Error ? error.message : 'Error uploading lyrics file');
      setLoading(false);
      throw error;
    }
  }, [songId, loadLyrics, setLoading, setError]);

  // Eliminar letras
  const deleteLyrics = useCallback(async (targetSongId?: string) => {
    const id = targetSongId || songId;
    if (!id) {
      setError('No song ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await lyricsService.deleteLyrics(id);
      setState(prev => ({ ...prev, lyrics: null, syncedLyrics: [], isLoading: false }));
      return result;
    } catch (error) {
      console.error('Error deleting lyrics:', error);
      setError(error instanceof Error ? error.message : 'Error deleting lyrics');
      setLoading(false);
      throw error;
    }
  }, [songId, setLoading, setError]);

  // Actualizar sincronización
  const updateSync = useCallback(async (syncData: LyricsSyncData[], targetSongId?: string) => {
    const id = targetSongId || songId;
    if (!id) {
      setError('No song ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedSyncedLyrics = await lyricsService.updateLyricsSync(id, syncData);
      setState(prev => ({ ...prev, syncedLyrics: updatedSyncedLyrics, isLoading: false }));
      return updatedSyncedLyrics;
    } catch (error) {
      console.error('Error updating lyrics sync:', error);
      setError(error instanceof Error ? error.message : 'Error updating lyrics sync');
      setLoading(false);
      throw error;
    }
  }, [songId, setLoading, setError]);

  return {
    // Estado
    lyrics: state.lyrics,
    syncedLyrics: state.syncedLyrics,
    isLoading: state.isLoading,
    error: state.error,
    
    // Acciones
    loadLyrics,
    loadSyncedLyrics,
    updateTextLyrics,
    uploadLyricsFile,
    deleteLyrics,
    updateSync,
    
    // Utilidades
    clearError: () => setError(null)
  };
}
