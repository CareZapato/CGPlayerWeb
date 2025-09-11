import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useServerInfo } from './useServerInfo';
import { getSongFileUrl } from '../config/api';

interface SongData {
  id: string;
  title: string;
  artist?: string;
  fileName: string;
  folderName?: string;
  duration?: number;
}

export const useMediaSession = () => {
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    duration, 
    play, 
    pause, 
    seekTo 
  } = usePlayerStore();
  
  const { 
    queue, 
    currentIndex, 
    repeatMode 
  } = usePlaylistStore();

  const { serverInfo } = useServerInfo();

  // Función para construir URL de canción
  const buildSongUrl = useCallback((song: SongData): string => {
    if (song.folderName) {
      return getSongFileUrl(song.folderName, song.fileName);
    } else {
      return `${serverInfo.audioBaseUrl}-root/${song.fileName}`;
    }
  }, [serverInfo.audioBaseUrl, getSongFileUrl]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) {
      console.log('📱 Media Session: Not available or no current song');
      return;
    }

    console.log('📱 Media Session: Setting up for song:', currentSong.title);

    // Configurar metadata de la canción
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist || 'CGPlayerWeb',
      album: 'CGPlayerWeb - Música Coral',
      artwork: [
        {
          src: generateSongCover(currentSong.title),
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    });

    // Configurar estado de reproducción
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    console.log('📱 Media Session: Playback state set to:', isPlaying ? 'playing' : 'paused');

    // Configurar handlers de acciones
    navigator.mediaSession.setActionHandler('play', () => {
      console.log('📱 Media Session: Play requested');
      play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('📱 Media Session: Pause requested');
      pause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log('📱 Media Session: Previous track requested');
      
      // Usar la misma lógica manual del BottomPlayer
      const prevIndex = currentIndex - 1;
      let targetIndex;
      
      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          targetIndex = queue.length - 1;
        } else {
          console.log('📱 Media Session: No hay canción anterior disponible');
          return;
        }
      } else {
        targetIndex = prevIndex;
      }
      
      const prevTrack = queue[targetIndex];
      if (prevTrack) {
        console.log('📱 Media Session: Reproduciendo anterior:', prevTrack.title);
        const { playSong } = usePlayerStore.getState();
        const { setCurrentIndex } = usePlaylistStore.getState();
        
        // Actualizar índice primero
        setCurrentIndex(targetIndex);
        
        // Luego reproducir
        const songUrl = buildSongUrl(prevTrack);
        playSong({
          id: prevTrack.id,
          title: prevTrack.title,
          artist: prevTrack.artist || 'Desconocido',
          url: songUrl,
          duration: prevTrack.duration || 0
        });
      }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log('📱 Media Session: Next track requested');
      
      // Usar la misma lógica manual del BottomPlayer
      let nextIndex;
      if (repeatMode === 'one') {
        nextIndex = currentIndex;
      } else if (repeatMode === 'all' && currentIndex === queue.length - 1) {
        nextIndex = 0;
      } else {
        nextIndex = currentIndex + 1;
      }
      
      if (nextIndex >= queue.length && repeatMode === 'off') {
        console.log('📱 Media Session: No hay siguiente canción disponible');
        return;
      }
      
      const nextTrack = queue[nextIndex];
      if (nextTrack) {
        console.log('📱 Media Session: Reproduciendo siguiente:', nextTrack.title);
        const { playSong } = usePlayerStore.getState();
        const { setCurrentIndex } = usePlaylistStore.getState();
        
        // Actualizar índice primero
        setCurrentIndex(nextIndex);
        
        // Luego reproducir
        const songUrl = buildSongUrl(nextTrack);
        playSong({
          id: nextTrack.id,
          title: nextTrack.title,
          artist: nextTrack.artist || 'Desconocido',
          url: songUrl,
          duration: nextTrack.duration || 0
        });
      }
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      console.log('📱 Media Session: Seek to requested:', details.seekTime);
      if (details.seekTime !== undefined && details.seekTime >= 0 && details.seekTime <= duration) {
        const seekTime = details.seekTime;
        
        // Primero actualizar la posición en Media Session inmediatamente
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1.0,
            position: seekTime
          });
        } catch (error) {
          console.warn('📱 Media Session: Error updating position before seek:', error);
        }
        
        // Luego hacer el seek real
        seekTo(seekTime);
        
        // Después de un breve delay, actualizar nuevamente para asegurar sincronización
        setTimeout(() => {
          try {
            navigator.mediaSession.setPositionState({
              duration: duration,
              playbackRate: 1.0,
              position: seekTime
            });
          } catch (error) {
            console.warn('📱 Media Session: Error updating position after seek delay:', error);
          }
        }, 100);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      console.log('📱 Media Session: Seek backward requested');
      const skipTime = details.seekOffset || 10;
      seekTo(Math.max(0, currentTime - skipTime));
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      console.log('📱 Media Session: Seek forward requested');
      const skipTime = details.seekOffset || 10;
      seekTo(Math.min(duration, currentTime + skipTime));
    });

  }, [currentSong, isPlaying, currentTime, duration, currentIndex, queue.length, repeatMode, queue, buildSongUrl, play, pause, seekTo]);

  // Actualizar posición de reproducción - MÁS FRECUENTE Y PRECISO
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong || duration === 0) return;

    let lastUpdateTime = currentTime;
    let isSeekInProgress = false;

    const updatePositionState = (forceUpdate = false) => {
      try {
        // Obtener el tiempo real del elemento de audio
        const audioElement = document.querySelector('audio') as HTMLAudioElement;
        const actualTime = audioElement ? audioElement.currentTime : currentTime;
        
        // Detectar si hay un seek en progreso (cambio brusco de tiempo)
        const timeDiff = Math.abs(actualTime - lastUpdateTime);
        
        if (timeDiff > 2 && !forceUpdate) {
          console.log('📱 Media Session: Detected seek, time difference:', timeDiff);
          isSeekInProgress = true;
          
          // Actualizar inmediatamente con el nuevo tiempo
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1.0,
            position: Math.min(Math.max(0, actualTime), duration)
          });
          
          // Esperar un poco para que el seek se estabilice
          setTimeout(() => {
            isSeekInProgress = false;
          }, 500);
        } else if (!isSeekInProgress || forceUpdate) {
          console.log('📱 Media Session: Updating position state - Current:', actualTime, 'Duration:', duration);
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1.0,
            position: Math.min(Math.max(0, actualTime), duration)
          });
        }

        lastUpdateTime = actualTime;
      } catch (error) {
        console.warn('📱 Media Session: Error setting position state:', error);
      }
    };

    // Actualizar inmediatamente
    updatePositionState(true);

    // Si está reproduciendo y no hay seek en progreso, actualizar cada segundo
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && !isSeekInProgress) {
      interval = setInterval(() => {
        updatePositionState();
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentTime, duration, currentSong, isPlaying]);

  // Función para generar cover de canción (placeholder colorido)
  const generateSongCover = (title: string): string => {
    // Crear un canvas para generar una imagen placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Generar color basado en el título
      const colors = [
        ['#3B82F6', '#1E40AF'], // blue
        ['#10B981', '#047857'], // green
        ['#F59E0B', '#D97706'], // yellow
        ['#EF4444', '#DC2626'], // red
        ['#8B5CF6', '#7C3AED'], // purple
        ['#F97316', '#EA580C'], // orange
        ['#06B6D4', '#0891B2'], // cyan
        ['#84CC16', '#65A30D'], // lime
      ];
      
      const colorIndex = title.length % colors.length;
      const [color1, color2] = colors[colorIndex];
      
      // Crear gradiente
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      
      // Fondo con gradiente
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      
      // Agregar letra inicial
      ctx.fillStyle = 'white';
      ctx.font = 'bold 200px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title.charAt(0).toUpperCase(), 256, 256);
      
      // Agregar nombre de la app en la parte inferior
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('CGPlayerWeb', 256, 450);
    }
    
    return canvas.toDataURL('image/png');
  };
};
