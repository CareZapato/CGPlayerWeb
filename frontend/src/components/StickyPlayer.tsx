import React, { useState, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useServerInfo } from '../hooks/useServerInfo';
import { 
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';

const StickyPlayer: React.FC = () => {
  const {
    isPlaying,
    currentSong,
    currentTime,
    duration,
    volume,
    play,
    pause,
    setVolume,
    seekTo
  } = usePlayerStore();

  const {
    queue,
    currentIndex,
    nextSong,
    previousSong
  } = usePlaylistStore();

  const { serverInfo } = useServerInfo();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isQueueVisible, setIsQueueVisible] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);

  // No mostrar el reproductor si no hay canción actual
  if (!currentSong) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    seekTo(newTime);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const buildSongUrl = (song: any) => {
    if (song.folderName) {
      return `${serverInfo.audioBaseUrl}/${song.folderName}/${song.fileName}`;
    } else {
      return `${serverInfo.audioBaseUrl}-root/${song.fileName}`;
    }
  };

  const handleNext = () => {
    if (queue.length > 1 && currentIndex < queue.length - 1) {
      const nextSongData = nextSong();
      if (nextSongData) {
        // El playlistStore ya actualiza el currentIndex
        // Ahora necesitamos decirle al playerStore que reproduzca la nueva canción
        const { playSong } = usePlayerStore.getState();
        const songUrl = buildSongUrl(nextSongData);
        playSong({
          id: nextSongData.id,
          title: nextSongData.title,
          artist: nextSongData.artist || 'Desconocido',
          url: songUrl,
          duration: nextSongData.duration || 0
        });
      }
    }
  };

  const handlePrevious = () => {
    if (queue.length > 1 && currentIndex > 0) {
      const prevSongData = previousSong();
      if (prevSongData) {
        // El playlistStore ya actualiza el currentIndex
        // Ahora necesitamos decirle al playerStore que reproduzca la nueva canción
        const { playSong } = usePlayerStore.getState();
        const songUrl = buildSongUrl(prevSongData);
        playSong({
          id: prevSongData.id,
          title: prevSongData.title,
          artist: prevSongData.artist || 'Desconocido',
          url: songUrl,
          duration: prevSongData.duration || 0
        });
      }
    }
  };

  const toggleQueue = () => {
    setIsQueueVisible(!isQueueVisible);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Espaciador para evitar que el contenido se oculte detrás del reproductor */}
      <div className="h-16 md:h-20" />
      
      {/* Reproductor Sticky */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 transition-all duration-300 ${
        isExpanded ? 'h-auto' : 'h-16 md:h-20'
      }`}>
        
        {/* Barra de progreso principal */}
        <div 
          ref={progressRef}
          className="w-full h-1 bg-gray-200 cursor-pointer hover:h-2 transition-all duration-200"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Contenido principal del reproductor */}
        <div className="px-3 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between">
            
            {/* Información de la canción */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs md:text-sm font-semibold">
                    {currentSong.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="text-sm md:text-base font-medium text-gray-900 truncate">
                  {currentSong.title}
                </p>
                <p className="text-xs md:text-sm text-gray-500 truncate">
                  {currentSong.artist && (
                    <span className="mr-2">{currentSong.artist}</span>
                  )}
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>
            </div>

            {/* Controles principales */}
            <div className="flex items-center space-x-2 md:space-x-6">
              
              {/* Controles de reproducción - centrados mejor en PC */}
              <div className="flex items-center justify-center space-x-1 md:space-x-3 md:flex-1 md:max-w-xs">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex <= 0 || queue.length <= 1}
                  className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BackwardIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                
                <button
                  onClick={isPlaying ? pause : play}
                  className="p-2 md:p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                >
                  {isPlaying ? (
                    <PauseIcon className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <PlayIcon className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                  )}
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= queue.length - 1 || queue.length <= 1}
                  className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ForwardIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              {/* Controles adicionales (desktop) */}
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  {isMuted || volume === 0 ? (
                    <SpeakerXMarkIcon className="w-4 h-4" />
                  ) : (
                    <SpeakerWaveIcon className="w-4 h-4" />
                  )}
                </button>
                
                {/* Barra de volumen mejorada */}
                <div className="relative w-20 h-4 flex items-center">
                  <div className="w-full h-1 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-150"
                      style={{ width: `${volume * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center space-x-1">
                {queue.length > 1 && (
                  <button
                    onClick={toggleQueue}
                    className={`p-1.5 md:p-2 rounded-full hover:bg-gray-100 ${
                      isQueueVisible ? 'bg-blue-100 text-blue-600' : ''
                    }`}
                  >
                    <QueueListIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                )}
                
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 md:hidden"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronUpIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Panel expandido (móvil) */}
          {isExpanded && (
            <div className="mt-4 md:hidden">
              {/* Controles de volumen en móvil */}
              <div className="flex items-center space-x-3 mb-4">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  {isMuted || volume === 0 ? (
                    <SpeakerXMarkIcon className="w-5 h-5" />
                  ) : (
                    <SpeakerWaveIcon className="w-5 h-5" />
                  )}
                </button>
                
                {/* Barra de volumen mejorada para móvil */}
                <div className="relative flex-1 h-6 flex items-center">
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-150"
                      style={{ width: `${volume * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Información adicional */}
              <div className="text-sm text-gray-600">
                {queue.length > 1 && (
                  <p>En cola: {queue.length - 1} canciones más</p>
                )}
                {queue.length > 1 && (
                  <p>Reproduciendo: {currentIndex + 1} de {queue.length}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StickyPlayer;
