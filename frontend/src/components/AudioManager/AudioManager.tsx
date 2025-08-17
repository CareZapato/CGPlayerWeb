import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import './AudioManager.css';

/**
 * AudioManager - Componente para gestionar el elemento audio global
 * Maneja la reproducción de audio en toda la aplicación
 */
const AudioManager: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { 
    currentSong, 
    isPlaying, 
    volume, 
    setAudioRef,
    setCurrentTime,
    setDuration 
  } = usePlayerStore();

  // Configurar la referencia del audio
  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current);
    }
  }, [setAudioRef]);

  // Manejar eventos del audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // Aquí podrías manejar el fin de la canción
      console.log('🎵 [AUDIO-MANAGER] Song ended');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration]);

  // Controlar volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <div className="audio-manager">
      <audio
        ref={audioRef}
        src={currentSong?.url || ''}
        preload="metadata"
        className="audio-manager__element"
      />
    </div>
  );
};

export default AudioManager;
