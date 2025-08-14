import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';

const AudioManager: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    volume,
    setAudioRef,
    setCurrentTime,
    setDuration
  } = usePlayerStore();

  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current);
      
      const audio = audioRef.current;
      
      // Event listeners para actualizar el estado del reproductor
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      
      const handleCanPlay = () => {
        console.log('🎵 [AUDIO-MANAGER] Audio can play');
      };
      
      const handleError = (e: any) => {
        console.error('❌ [AUDIO-MANAGER] Audio error:', e);
      };

      // Agregar event listeners
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      // Cleanup
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [setAudioRef, setCurrentTime, setDuration]);

  // Actualizar volumen cuando cambie
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      style={{ display: 'none' }}
      crossOrigin="anonymous"
    />
  );
};

export default AudioManager;
