import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import PlaylistPlayer from './PlaylistPlayer';

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
  
  const [showPlaylist, setShowPlaylist] = useState(false);
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
    const handleEnded = () => {
      // Intentar reproducir la siguiente canción
      const nextSong = getNextSong();
      if (nextSong) {
        setCurrentSong(nextSong);
      } else {
        pause();
      }
    };
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
  }, [setCurrentTime, setDuration, pause, getNextSong, setCurrentSong]);

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

  const handleNextSong = () => {
    const nextSong = getNextSong();
    if (nextSong) {
      setCurrentSong(nextSong);
    }
  };

  const handlePreviousSong = () => {
    const prevSong = getPreviousSong();
    if (prevSong) {
      setCurrentSong(prevSong);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} />
      
      {/* Reproductor principal minimalista */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Barra de progreso mejorada */}
            <div className="mb-3">
              <div 
                className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative hover:h-3 transition-all"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {/* Tiempo */}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* Información de la canción */}
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg cursor-pointer"
                  style={{ backgroundColor: (currentSong as any).coverColor || '#3B82F6' }}
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  title="Abrir lista de reproducción"
                >
                  {currentSong.title.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{currentSong.title}</h3>
                  <p className="text-sm text-gray-600 truncate">
                    {(currentSong as any).artist || 'Artista desconocido'}
                    {(currentSong as any).voiceType && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {(currentSong as any).voiceType}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Controles centrales */}
              <div className="flex items-center space-x-3">
                {/* Anterior */}
                <button
                  onClick={handlePreviousSong}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  disabled={queue.length === 0}
                  title="Canción anterior"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button 
                  onClick={togglePlayPause}
                  className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
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

                {/* Siguiente */}
                <button
                  onClick={handleNextSong}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  disabled={queue.length === 0}
                  title="Siguiente canción"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Botón de lista de reproducción */}
                <button
                  onClick={() => setShowPlaylist(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
                  title="Ver lista de reproducción"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  {queue.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {queue.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Control de volumen */}
              <div className="flex items-center space-x-2 ml-4">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.788L4.627 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.627l3.756-3.788a1 1 0 011.617.788zM14.657 5.343a1 1 0 011.414 0 9.97 9.97 0 010 14.314 1 1 0 11-1.414-1.414 7.971 7.971 0 000-11.486 1 1 0 010-1.414zM12.828 7.172a1 1 0 011.414 0 5.983 5.983 0 010 8.656 1 1 0 01-1.414-1.414 3.987 3.987 0 000-5.828 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reproductor con slide-up */}
      <PlaylistPlayer 
        isOpen={showPlaylist} 
        onToggle={() => setShowPlaylist(!showPlaylist)}
      />
    </>
  );
};

export default SimplePlayer;
