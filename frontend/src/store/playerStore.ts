import { create } from 'zustand';
import type { Song, Playlist } from '../types';
import { getSongFileUrl, getFileUrl } from '../config/api';

interface PlayerState {
  // Estado del reproductor
  isPlaying: boolean;
  currentSong: Song | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  
  // Lista de reproducción actual
  currentPlaylist: Playlist | null;
  currentIndex: number;
  
  // Audio element
  audioRef: HTMLAudioElement | null;
  
  // Acciones
  setAudioRef: (audio: HTMLAudioElement) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  playSong: (song: { id: string; title: string; artist: string; url: string; duration: number }) => void;
  setCurrentSong: (song: Song, playlist?: Playlist, index?: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (time: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Estado inicial
  isPlaying: false,
  currentSong: null,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  currentPlaylist: null,
  currentIndex: 0,
  audioRef: null,

  // Acciones
  setAudioRef: (audio: HTMLAudioElement) => {
    console.log(`🎵 [PLAYER-STORE] Setting audio reference:`, {
      elementTagName: audio.tagName,
      elementId: audio.id || 'no-id',
      readyState: audio.readyState,
      networkState: audio.networkState
    });
    set({ audioRef: audio });
    console.log(`✅ [PLAYER-STORE] Audio reference set successfully`);
  },

  play: () => {
    const { audioRef } = get();
    if (audioRef) {
      audioRef.play();
      set({ isPlaying: true });
    }
  },

  pause: () => {
    const { audioRef } = get();
    if (audioRef) {
      audioRef.pause();
      set({ isPlaying: false });
    }
  },

  togglePlayPause: () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  },

  playSong: (song: { id: string; title: string; artist: string; url: string; duration: number }) => {
    console.log(`🎵 [PLAYER-STORE] === STARTING SONG PLAYBACK ===`);
    console.log(`🎵 [PLAYER-STORE] Song details:`, {
      id: song.id,
      title: song.title,
      artist: song.artist,
      url: song.url,
      duration: song.duration
    });
    
    const { audioRef } = get();
    console.log(`🎵 [PLAYER-STORE] Audio element:`, {
      exists: !!audioRef,
      currentSrc: audioRef?.src || 'none',
      readyState: audioRef?.readyState,
      networkState: audioRef?.networkState
    });
    
    if (audioRef) {
      console.log(`🎵 [PLAYER-STORE] Setting audio source:`, song.url);
      
      // Pausar el audio actual si está reproduciéndose
      audioRef.pause();
      
      // Configurar la nueva fuente
      audioRef.src = song.url;
      
      console.log(`🎵 [PLAYER-STORE] Loading audio...`);
      audioRef.load();
      
      // Esperar a que el audio esté listo antes de reproducir
      const playWhenReady = () => {
        audioRef.play()
          .then(() => {
            console.log(`✅ [PLAYER-STORE] Audio playback started successfully`);
            set({ isPlaying: true });
          })
          .catch((error) => {
            console.error(`❌ [PLAYER-STORE] Error starting playback:`, {
              error: error.message,
              name: error.name,
              code: error.code || 'no code',
              audioElement: {
                src: audioRef.src,
                readyState: audioRef.readyState,
                networkState: audioRef.networkState,
                error: audioRef.error
              }
            });
          });
      };
      
      // Si el audio ya está listo, reproducir inmediatamente
      if (audioRef.readyState >= 2) {
        playWhenReady();
      } else {
        // Esperar a que el audio esté listo
        const handleCanPlay = () => {
          playWhenReady();
          audioRef.removeEventListener('canplay', handleCanPlay);
        };
        audioRef.addEventListener('canplay', handleCanPlay);
      }
      
    } else {
      console.error(`❌ [PLAYER-STORE] No audio element found!`);
    }
    
    // Convertir al formato Song interno - simplificado para el reproductor
    const songData = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      url: song.url // Mantener la URL para reproducción
    };
    
    set({ 
      currentSong: songData as any, // Cast temporal hasta actualizar tipos
      duration: song.duration,
      currentTime: 0
    });
  },

  setCurrentSong: (song: Song, playlist?: Playlist, index = 0) => {
    console.log(`🎵 [PLAYER-STORE] Setting current song:`, {
      title: song.title,
      voiceType: (song as any).voiceType,
      filePath: song.filePath,
      folderName: (song as any).folderName,
      fileName: song.fileName
    });
    
    const { audioRef } = get();
    
    if (audioRef) {
      audioRef.pause();
      
      // Construir la URL correcta usando el endpoint de la API
      let songUrl = (song as any).url;
      if (!songUrl) {
        const folderName = (song as any).folderName;
        const fileName = song.fileName;
        
        if (folderName && fileName) {
          // Usar el endpoint de la API para archivos en carpetas (dinámico)
          songUrl = getSongFileUrl(folderName, fileName);
        } else if (fileName) {
          // Archivo en carpeta raíz (si aplica)
          songUrl = getFileUrl(fileName);
        }
      }
      
      console.log(`🔗 [PLAYER-STORE] Song URL:`, songUrl);
      
      if (songUrl) {
        audioRef.src = songUrl;
        audioRef.load();
        
        // Agregar la URL al objeto song para uso posterior
        (song as any).url = songUrl;
        
        audioRef.addEventListener('loadeddata', () => {
          console.log(`✅ [PLAYER-STORE] Audio loaded successfully, duration:`, audioRef.duration);
          // AUTOPLAY: Iniciar reproducción automáticamente cuando los datos estén cargados
          audioRef.play()
            .then(() => {
              console.log(`🎵 [PLAYER-STORE] Autoplay started successfully`);
              set({ isPlaying: true });
            })
            .catch((error) => {
              console.error(`❌ [PLAYER-STORE] Autoplay failed:`, error);
              set({ isPlaying: false });
            });
        }, { once: true });
        
        audioRef.addEventListener('error', (e) => {
          console.error(`❌ [PLAYER-STORE] Audio load error:`, e);
          set({ isPlaying: false });
        }, { once: true });
      }
    }
    
    set({ 
      currentSong: song, 
      currentPlaylist: playlist || null,
      currentIndex: index,
      currentTime: 0,
      isPlaying: false // Se actualizará a true cuando inicie el autoplay
    });
  },

  setCurrentTime: (time: number) => set({ currentTime: time }),

  setDuration: (duration: number) => set({ duration }),

  setVolume: (volume: number) => {
    const { audioRef } = get();
    if (audioRef) {
      audioRef.volume = volume;
    }
    set({ volume, isMuted: volume === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume, audioRef } = get();
    if (audioRef) {
      if (isMuted) {
        audioRef.volume = volume;
        set({ isMuted: false });
      } else {
        audioRef.volume = 0;
        set({ isMuted: true });
      }
    }
  },

  nextSong: () => {
    const { currentPlaylist, currentIndex, setCurrentSong } = get();
    if (currentPlaylist && currentPlaylist.items) {
      const nextIndex = currentIndex + 1;
      if (nextIndex < currentPlaylist.items.length) {
        const nextSong = currentPlaylist.items[nextIndex].song;
        console.log(`🎵 [PLAYER-STORE] Moving to next song:`, nextSong.title);
        setCurrentSong(nextSong, currentPlaylist, nextIndex);
      }
    }
  },

  previousSong: () => {
    const { currentPlaylist, currentIndex, setCurrentSong } = get();
    if (currentPlaylist && currentPlaylist.items) {
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        const prevSong = currentPlaylist.items[prevIndex].song;
        console.log(`🎵 [PLAYER-STORE] Moving to previous song:`, prevSong.title);
        setCurrentSong(prevSong, currentPlaylist, prevIndex);
      }
    }
  },

  seekTo: (time: number) => {
    const { audioRef } = get();
    if (audioRef) {
      audioRef.currentTime = time;
      set({ currentTime: time });
    }
  },
}));
