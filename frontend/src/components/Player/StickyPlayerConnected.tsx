import React from 'react';
import { usePlayerStore } from '../../store/playerStore';
import StickyPlayer from './StickyPlayer';

/**
 * StickyPlayerConnected - Wrapper que conecta StickyPlayer con el store de Zustand
 */
const StickyPlayerConnected: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    currentPlaylist,
    currentIndex,
    togglePlayPause,
    nextSong,
    previousSong,
    setVolume,
    seekTo,
    setCurrentSong
  } = usePlayerStore();

  // Solo mostrar el player si hay una canción cargada
  if (!currentSong) {
    return null;
  }

  // Función para seleccionar una canción de la cola
  const handleSongSelect = (song: any, index: number) => {
    setCurrentSong(song, currentPlaylist || undefined, index);
  };

  return (
    <StickyPlayer
      song={currentSong}
      isPlaying={isPlaying}
      onPlayPause={togglePlayPause}
      onPrevious={previousSong}
      onNext={nextSong}
      volume={volume * 100} // Convertir de 0-1 a 0-100
      onVolumeChange={(vol) => setVolume(vol / 100)} // Convertir de 0-100 a 0-1
      isConnected={true}
      currentTime={currentTime}
      duration={duration}
      onSeek={seekTo}
      selectedVoiceType={currentSong.voiceType}
      showAllVoices={false}
      currentPlaylist={currentPlaylist}
      currentIndex={currentIndex}
      onSongSelect={handleSongSelect}
    />
  );
};

export default StickyPlayerConnected;
