import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { useServerInfo } from '../../hooks/useServerInfo';
import { getSongFileUrl } from '../../config/api';
import './SimplePlayer.css';

const SimplePlayer: React.FC = () => {
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    duration, 
    volume,
    setAudioRef,
    setCurrentTime,
    setDuration,
    play,
    pause,
    setVolume,
    seekTo,
    setCurrentSong
  } = usePlayerStore();
  
  const {
    queue,
    nextSong: getNextSong,
    previousSong: getPreviousSong
  } = usePlaylistStore();

  const { serverInfo } = useServerInfo();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Configurar referencia de audio inmediatamente
  useEffect(() => {
    console.log(`🎵 [SIMPLE-PLAYER] Initializing audio element:`, {
      audioRefExists: !!audioRef.current,
      audioElement: audioRef.current
    });
    
    if (audioRef.current) {
      setAudioRef(audioRef.current);
      setIsInitialized(true);
      console.log(`✅ [SIMPLE-PLAYER] Audio reference set successfully`);
    } else {
      console.error(`❌ [SIMPLE-PLAYER] Audio reference is null!`);
      // Intentar de nuevo en el próximo tick
      setTimeout(() => {
        if (audioRef.current) {
          setAudioRef(audioRef.current);
          setIsInitialized(true);
          console.log(`✅ [SIMPLE-PLAYER] Audio reference set on retry`);
        }
      }, 100);
    }
  }, [setAudioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      console.log(`🎵 [SIMPLE-PLAYER] Audio metadata loaded:`, {
        duration: audio.duration,
        src: audio.src
      });
    };
    
    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      // Intentar reproducir la siguiente canción
      const nextSong = getNextSong();
      if (nextSong) {
        // Usar playSong para una reproducción más robusta
        const { playSong } = usePlayerStore.getState();
        let songUrl: string;
        
        if ((nextSong as any).folderName) {
          songUrl = getSongFileUrl((nextSong as any).folderName, nextSong.fileName);
        } else {
          songUrl = `${serverInfo.audioBaseUrl}-root/${nextSong.fileName}`;
        }
        
        playSong({
          id: nextSong.id,
          title: nextSong.title,
          artist: nextSong.artist || 'Artista desconocido',
          url: songUrl,
          duration: nextSong.duration || 0
        });
      } else {
        pause();
      }
    };
    
    const handleError = () => {
      setIsLoading(false);
      setError('Error al cargar el audio');
      console.error(`❌ [SIMPLE-PLAYER] Audio error:`, {
        error: audio.error,
        currentSrc: audio.src,
        readyState: audio.readyState,
        networkState: audio.networkState,
        currentSong: currentSong
      });
      
      // Intentar recargar con URL alternativa si es un error de formato
      if (audio.error?.code === 4 && currentSong) {
        console.log(`🔄 [SIMPLE-PLAYER] Attempting to reload with corrected URL...`);
        
        // Construir URL alternativa usando función con autenticación
        let correctedUrl = '';
        const song = currentSong as any;
        
        if (song.folderName && song.fileName) {
          correctedUrl = getSongFileUrl(song.folderName, song.fileName);
        } else if (song.fileName) {
          correctedUrl = `${serverInfo.audioBaseUrl}-root/${song.fileName}`;
        } else if (song.url) {
          // Si ya tiene URL, intentar corregirla
          correctedUrl = song.url.replace(/\/+/g, '/').replace('http:/', 'http://');
        }
        
        if (correctedUrl && correctedUrl !== audio.src) {
          console.log(`🔄 [SIMPLE-PLAYER] Trying corrected URL:`, correctedUrl);
          audio.src = correctedUrl;
          audio.load();
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [setCurrentTime, setDuration, pause, getNextSong, setCurrentSong, serverInfo]);

  // Control de reproducción
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((error) => {
          console.error('Error al reproducir:', error);
          pause();
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, pause]);

  // Actualizar volumen del audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Construir URL del audio
  const getAudioUrl = (song: any) => {
    if (!song || !serverInfo) return '';
    
    const { localIP, port } = serverInfo;
    return `http://${localIP}:${port}/api/songs/file/${song.folderName}/${song.fileName}`;
  };

  return (
    <div className={`simple-player ${isInitialized ? 'simple-player--ready' : 'simple-player--pending'}`}>
      {/* Debug info - solo visible en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px',
          fontSize: '12px',
          borderRadius: '3px',
          zIndex: 9999
        }}>
          SimplePlayer: {isInitialized ? '✅ Ready' : '⏳ Initializing'} | 
          Song: {currentSong ? '✅' : '❌'} | 
          Audio: {audioRef.current ? '✅' : '❌'}
        </div>
      )}
      
      {currentSong && (
        <>
          <audio 
            ref={audioRef}
            src={getAudioUrl(currentSong)}
            preload="metadata"
            className="simple-player__audio"
          />
          
          {isLoading && (
            <div className="simple-player__loading">
              Cargando audio...
            </div>
          )}
          
          {error && (
            <div className="simple-player__error">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SimplePlayer;
