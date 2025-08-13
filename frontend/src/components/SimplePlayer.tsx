import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';

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
    seekTo
  } = usePlayerStore();
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    console.log(`🎵 [SIMPLE-PLAYER] Setting up audio reference:`, {
      audioRefExists: !!audioRef.current,
      audioElement: audioRef.current
    });
    
    if (audioRef.current) {
      setAudioRef(audioRef.current);
      console.log(`✅ [SIMPLE-PLAYER] Audio reference set successfully`);
    } else {
      console.error(`❌ [SIMPLE-PLAYER] Audio reference is null!`);
    }
  }, [setAudioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      console.log(`🎵 [SIMPLE-PLAYER] Audio metadata loaded:`, {
        duration: audio.duration,
        src: audio.src
      });
    };
    const handleEnded = () => pause();
    const handleError = () => {
      console.error(`❌ [SIMPLE-PLAYER] Audio error:`, audio.error);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [setCurrentTime, setDuration, pause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(newTime);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} />
      
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Barra de progreso */}
            <div 
              className="w-full h-1 bg-gray-200 rounded-full cursor-pointer mb-3"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Información de la canción */}
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  🎵
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{currentSong.title}</h3>
                  <p className="text-sm text-gray-600 truncate">
                    {(currentSong as any).artist || 'Artista desconocido'}
                  </p>
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                <button 
                  onClick={togglePlayPause}
                  className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimplePlayer;
