import React, { useState } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import type { Song } from '../../types';

interface PlaylistPlayerProps {
  isOpen: boolean;
  onToggle: () => void;
}

const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({ isOpen, onToggle }) => {
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    duration, 
    volume,
    play,
    pause,
    setVolume,
    seekTo,
    setCurrentSong
  } = usePlayerStore();
  
  const {
    queue,
    removeFromQueue,
    clearQueue,
    setCurrentIndex,
    moveInQueue
  } = usePlaylistStore();
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

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

  const handleSongSelect = (song: Song, index: number) => {
    setCurrentIndex(index);
    setCurrentSong(song);
  };

  const handleRemoveFromQueue = (songId: string) => {
    removeFromQueue(songId);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Solo permitir drag desde el icono de arrastrar
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) {
      e.preventDefault();
      return;
    }
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    
    // Agregar clase CSS para el elemento que se está arrastrando
    setTimeout(() => {
      const draggedElement = document.querySelector(`[data-song-index="${index}"]`);
      if (draggedElement) {
        draggedElement.classList.add('dragging');
      }
    }, 0);
  };

  const handleSongClick = (song: Song, index: number, e: React.MouseEvent) => {
    // No hacer nada si se hizo click en el botón de eliminar o en el drag handle
    const target = e.target as HTMLElement;
    if (target.closest('.remove-button') || target.closest('.drag-handle')) {
      return;
    }
    
    // Reproducir la canción
    handleSongSelect(song, index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo limpiar si realmente salimos del elemento
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTargetIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveInQueue(draggedIndex, dropIndex);
      
      // Animación de éxito
      const droppedElement = document.querySelector(`[data-song-index="${dropIndex}"]`);
      if (droppedElement) {
        droppedElement.classList.add('drop-success');
        setTimeout(() => {
          droppedElement.classList.remove('drop-success');
        }, 600);
      }
    }
    
    // Limpiar estados
    setDraggedIndex(null);
    setDropTargetIndex(null);
    
    // Remover clases de arrastre
    document.querySelectorAll('.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Overlay cuando está abierto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={onToggle}
        />
      )}

      {/* Panel deslizante */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ height: '80vh' }}>
        
        {/* Header del panel */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggle}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Lista de Reproducción</h2>
            <span className="text-sm text-gray-500">
              {queue.length} canción{queue.length !== 1 ? 'es' : ''}
            </span>
          </div>
          
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded-md hover:bg-red-50"
            >
              Limpiar Todo
            </button>
          )}
        </div>

        {/* Reproductor compacto */}
        {currentSong && (
          <div className="p-4 border-b border-gray-200 bg-white">
            {/* Barra de progreso */}
            <div 
              className="w-full h-2 bg-gray-200 rounded-full cursor-pointer mb-3 hover:h-3 transition-all"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Información de la canción */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: (currentSong as any).coverColor || '#3B82F6' }}
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

              {/* Controles */}
              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                <button 
                  onClick={togglePlayPause}
                  className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>

                {/* Barra de volumen mejorada */}
                <div className="relative w-16 h-4 flex items-center">
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
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de canciones */}
        <div className="flex-1 overflow-y-auto p-4">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <p className="text-lg font-medium">Lista vacía</p>
              <p className="text-sm text-gray-400">Agrega canciones para empezar a reproducir</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((song, index) => (
                <div
                  key={song.id}
                  data-song-index={index}
                  onClick={(e) => handleSongClick(song, index, e)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ease-in-out cursor-pointer hover:shadow-md transform ${
                    currentSong?.id === song.id 
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${
                    dropTargetIndex === index ? 'border-blue-400 bg-blue-100 scale-105 shadow-lg border-dashed border-2' : ''
                  } ${
                    draggedIndex === index ? 'opacity-30 scale-95 rotate-2 shadow-xl blur-sm' : 'hover:scale-102'
                  }`}
                  style={{
                    transform: draggedIndex === index 
                      ? 'scale(0.95) rotate(2deg)' 
                      : dropTargetIndex === index 
                        ? 'scale(1.02) translateY(-2px)' 
                        : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: dropTargetIndex === index 
                      ? '0 10px 25px rgba(59, 130, 246, 0.3)' 
                      : draggedIndex === index 
                        ? '0 5px 15px rgba(0, 0, 0, 0.3)' 
                        : ''
                  }}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Número de posición */}
                    <div className="w-6 h-6 flex items-center justify-center text-sm text-gray-500 bg-gray-100 rounded">
                      {index + 1}
                    </div>

                    {/* Indicador de reproducción actual */}
                    {currentSong?.id === song.id && (
                      <div className="w-4 h-4 flex items-center justify-center">
                        {isPlaying ? (
                          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                        ) : (
                          <div className="w-3 h-3 bg-gray-400 rounded-full" />
                        )}
                      </div>
                    )}
                    
                    {/* Cover */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: (song as any).coverColor || '#3B82F6' }}
                    >
                      {song.title.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Información */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate text-sm">
                        {song.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {(song as any).artist || 'Artista desconocido'}
                        {(song as any).voiceType && (
                          <span className="ml-2 px-1 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {(song as any).voiceType}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Controles */}
                  <div className="flex items-center space-x-2">
                    {/* Icono de arrastrar - único elemento draggable */}
                    <div 
                      className="drag-handle text-gray-400 cursor-move p-1 hover:text-gray-600 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      title="Arrastrar para reordenar"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </div>
                    
                    {/* Botón de eliminar */}
                    <button
                      className="remove-button p-2 text-gray-600 hover:text-red-600 transition-colors"
                      onClick={() => handleRemoveFromQueue(song.id)}
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlaylistPlayer;
