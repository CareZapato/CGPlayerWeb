import React from 'react';
import './AlbumCard.css';

interface AlbumData {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  totalSongs: number;
  totalDuration: number;
  coverColor: string;
  mainSong: any;
  versions: any[];
}

interface AlbumCardProps {
  album: AlbumData;
  onClick: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick }) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group transform transition-all duration-200 hover:scale-105"
    >
      {/* Cover del álbum */}
      <div className={`aspect-square rounded-lg ${album.coverColor} p-4 mb-3 shadow-lg group-hover:shadow-xl transition-shadow duration-200`}>
        <div className="h-full flex flex-col justify-between text-white">
          {/* Título en la parte superior */}
          <div>
            <h3 className="font-bold text-sm sm:text-base lg:text-lg leading-tight line-clamp-2 uppercase tracking-wide">
              {album.title}
            </h3>
          </div>
          
          {/* Logo/Texto en la parte inferior */}
          <div className="text-right">
            <div className="text-xs opacity-80 font-medium">
              {album.genre || 'CHILE GOSPEL'}
            </div>
          </div>
        </div>
      </div>

      {/* Información del álbum */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
          {album.title}
        </h4>
        <p className="text-xs text-gray-600 line-clamp-1">
          {album.artist || '[Unknown Artist]'}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{album.totalSongs} Canciones</span>
          <span>{formatDuration(album.totalDuration)}</span>
        </div>
        {album.genre && (
          <p className="text-xs text-gray-500 line-clamp-1">
            {album.genre}
          </p>
        )}
      </div>
    </div>
  );
};

export default AlbumCard;
