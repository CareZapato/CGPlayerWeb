import { create } from 'zustand';
import type { Song, Playlist } from '../types';
import { getSongFileUrl, getFileUrl } from '../config/api';

// Tipo extendido para el reproductor que incluye la URL
interface PlayingSong extends Song {
  url: string;
}

interface PlayerState {
  // Estado del reproductor
  isPlaying: boolean;
  currentSong: PlayingSong | null;
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
  closePlayer: () => void;
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
      
      // Limpiar completamente el audio anterior
      audioRef.pause();
      audioRef.currentTime = 0;
      audioRef.src = '';  // Limpiar la fuente anterior
      audioRef.load();    // Aplicar la limpieza
      
      // Configurar la nueva fuente
      audioRef.src = song.url;
      
      console.log(`🎵 [PLAYER-STORE] Loading audio...`);
      audioRef.load();
      
      console.log(`🎵 [PLAYER-STORE] After load() - currentSrc:`, audioRef.src);
      
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
          console.log(`🎵 [PLAYER-STORE] Audio ready for playback`);
          playWhenReady();
          audioRef.removeEventListener('canplay', handleCanPlay);
          audioRef.removeEventListener('error', handleError);
        };
        
        const handleError = (error: Event) => {
          console.error(`❌ [PLAYER-STORE] Audio load error:`, {
            error: error,
            audioError: audioRef.error,
            src: audioRef.src,
            networkState: audioRef.networkState
          });
          audioRef.removeEventListener('canplay', handleCanPlay);
          audioRef.removeEventListener('error', handleError);
        };
        
        audioRef.addEventListener('canplay', handleCanPlay);
        audioRef.addEventListener('error', handleError);
        
        // Timeout para detectar si nunca carga
        setTimeout(() => {
          if (audioRef.readyState < 2) {
            console.error(`⏰ [PLAYER-STORE] Audio load timeout - readyState: ${audioRef.readyState}`);
          }
        }, 5000);
      }
      
    } else {
      console.error(`❌ [PLAYER-STORE] No audio element found!`);
    }
    
    // Crear el objeto PlayingSong con las propiedades necesarias
    const playingSong: PlayingSong = {
      id: song.id,
      title: song.title,
      artist: song.artist || 'Desconocido',
      album: undefined,
      duration: song.duration || 0,
      fileName: `${song.title}.mp3`, // Nombre temporal
      filePath: song.url,
      fileSize: 0,
      mimeType: 'audio/mpeg',
      folderName: undefined,
      voiceType: undefined,
      parentSongId: undefined,
      coverColor: undefined,
      uploadedBy: 'Sistema',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploader: {
        firstName: 'Sistema',
        lastName: 'Reproductor'
      },
      url: song.url // URL para reproducción
    };
    
    set({ 
      currentSong: playingSong,
      duration: song.duration,
      currentTime: 0
    });
  },

  setCurrentSong: (song: Song, playlist?: Playlist, index = 0) => {
    console.log(`🎵 [PLAYER-STORE] Setting current song:`, {
      songId: song.id,
      title: song.title,
      voiceType: (song as any).voiceType,
      folderName: (song as any).folderName,
      fileName: song.fileName,
      hasUrl: !!(song as any).url,
      playlistName: playlist?.name || 'Sin playlist'
    });
    
    const { audioRef } = get();
    
    if (audioRef) {
      // Pausar y resetear audio actual
      audioRef.pause();
      audioRef.currentTime = 0;
      
      // Construir la URL correcta del archivo de audio
      let songUrl = (song as any).url;
      
      if (!songUrl) {
        const folderName = (song as any).folderName;
        const fileName = song.fileName;
        
        if (folderName && fileName) {
          // Para canciones con carpeta y archivo específicos (usar URL autenticada)
          console.log(`🎵 [PLAYER-STORE] Generating authenticated URL for:`, { folderName, fileName });
          songUrl = getSongFileUrl(folderName, fileName);
        } else if (fileName) {
          // Para archivos en carpeta raíz o con filePath directo
          console.log(`🎵 [PLAYER-STORE] Generating basic URL for:`, fileName);
          songUrl = getFileUrl(fileName);
        } else if (song.filePath) {
          // Usar filePath como alternativa
          console.log(`🎵 [PLAYER-STORE] Using filePath:`, song.filePath);
          songUrl = getFileUrl(song.filePath);
        }
      }
      
      console.log(`🔗 [PLAYER-STORE] Final song URL:`, songUrl);
      
      if (songUrl) {
        // Configurar nueva fuente de audio
        audioRef.src = songUrl;
        audioRef.load();
        
        // Crear el objeto PlayingSong completo
        const playingSong: PlayingSong = {
          id: song.id,
          title: song.title,
          artist: song.artist || 'Desconocido',
          album: song.album,
          duration: song.duration || 0,
          fileName: song.fileName || `${song.title}.mp3`,
          filePath: song.filePath || songUrl,
          fileSize: song.fileSize || 0,
          mimeType: song.mimeType || 'audio/mpeg',
          folderName: (song as any).folderName,
          voiceType: (song as any).voiceType,
          uploadedBy: song.uploadedBy || 'system',
          isActive: song.isActive ?? true,
          createdAt: song.createdAt || new Date().toISOString(),
          updatedAt: song.updatedAt || new Date().toISOString(),
          uploader: song.uploader || { firstName: 'Sistema', lastName: 'CGPlayer' },
          url: songUrl // URL final para reproducción
        };
        
        // Configurar eventos de audio para autoplay
        audioRef.addEventListener('loadeddata', () => {
          console.log(`✅ [PLAYER-STORE] Audio loaded successfully, duration:`, audioRef.duration);
          // AUTOPLAY: Iniciar reproducción automáticamente
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
          console.error(`❌ [PLAYER-STORE] Audio load error for URL:`, songUrl);
          console.error(`❌ [PLAYER-STORE] Error details:`, e);
          set({ isPlaying: false });
        }, { once: true });
        
        // Actualizar estado del store
        set({ 
          currentSong: playingSong, 
          currentPlaylist: playlist || null,
          currentIndex: index,
          currentTime: 0,
          isPlaying: false // Se actualizará a true cuando inicie el autoplay
        });
        
        console.log(`✅ [PLAYER-STORE] Song configured successfully:`, {
          title: playingSong.title,
          url: songUrl,
          playlistIndex: index
        });
      } else {
        console.error(`❌ [PLAYER-STORE] No URL could be generated for song:`, {
          songId: song.id,
          title: song.title,
          hasfolderName: !!(song as any).folderName,
          hasFileName: !!song.fileName,
          hasFilePath: !!song.filePath
        });
      }
    } else {
      console.error(`❌ [PLAYER-STORE] No audio element found when setting current song`);
    }
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
      console.log(`🎵 [PLAYER-STORE] Seeking to time:`, time);
      audioRef.currentTime = time;
      
      // Actualizar el estado inmediatamente para feedback visual
      set({ currentTime: time });
      
      // Escuchar el evento 'seeked' para confirmar que el seek se completó
      const handleSeeked = () => {
        console.log(`✅ [PLAYER-STORE] Seek completed, actual time:`, audioRef.currentTime);
        set({ currentTime: audioRef.currentTime });
        audioRef.removeEventListener('seeked', handleSeeked);
      };
      
      audioRef.addEventListener('seeked', handleSeeked, { once: true });
    }
  },

  closePlayer: () => {
    console.log(`🎵 [PLAYER-STORE] Closing player completely`);
    const { audioRef } = get();
    
    if (audioRef) {
      // Pausar y limpiar el audio
      audioRef.pause();
      audioRef.currentTime = 0;
      audioRef.src = '';
      audioRef.load();
    }
    
    // Resetear todo el estado del reproductor
    set({
      isPlaying: false,
      currentSong: null,
      currentTime: 0,
      duration: 0,
      currentPlaylist: null,
      currentIndex: 0
    });
    
    console.log(`✅ [PLAYER-STORE] Player closed successfully`);
  },
}));
