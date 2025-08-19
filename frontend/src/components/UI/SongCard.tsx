import React, { useState, useEffect, useRef } from 'react';
import { usePlaylistStore } from '../../store/playlistStore';
import { usePlayerStore } from '../../store/playerStore';
import { useServerInfo } from '../../hooks/useServerInfo';
import { getSongFileUrl } from '../../config/api';
import api from '../../services/api';
import type { Song } from '../../types';
import './SongCard.css';

interface SongCardProps {
  song: Song;
  color: string;
  onClick: () => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, color, onClick }) => {
  const { addToQueue, replaceQueueAndPlay } = usePlaylistStore();
  const { serverInfo } = useServerInfo();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Obtener duración de la primera variación si es canción contenedora
  const getSongDuration = () => {
    if (song.duration && song.duration > 0) {
      return song.duration;
    }
    // Si es contenedora, intentar obtener duración de la primera variación
    if (song.childVersions && song.childVersions.length > 0) {
      const firstVersion = song.childVersions[0];
      return firstVersion.duration || 0;
    }
    return 0;
  };

  const displayDuration = getSongDuration();

  const handleAddToQueue = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      console.log(`🔥 [SONG-CARD] Agregando versiones a la cola: ${song.title} (ID: ${song.id})`);
      
      // Obtener las variaciones de la canción usando el servicio API
      const response = await api.get(`/songs/${song.id}/versions`);
      const data = response.data;
      const variations = data.versions || [];
      
      console.log(`🔥 [SONG-CARD] Variaciones encontradas para agregar:`, variations.length);
      
      if (variations.length > 0) {
        // Filtrar y convertir variaciones a objetos Song completos
        const playableVariations: Song[] = variations
          .filter((v: any) => v.fileName && v.folderName && v.voiceType)
          .map((v: any) => ({
            id: v.id,
            title: v.title,
            artist: v.artist || song.artist,
            duration: v.duration || 0,
            fileName: v.fileName,
            filePath: v.filePath || `${v.folderName}/${v.fileName}`,
            fileSize: v.fileSize || 0,
            mimeType: v.mimeType || 'audio/mpeg',
            folderName: v.folderName,
            voiceType: v.voiceType,
            parentSongId: v.parentSongId,
            coverColor: v.coverColor || song.coverColor,
            uploadedBy: v.uploadedBy || v.uploader?.firstName + ' ' + v.uploader?.lastName || 'Desconocido',
            isActive: v.isActive !== undefined ? v.isActive : true,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt || v.createdAt,
            uploader: v.uploader || song.uploader
          } as Song));
        
        console.log(`🔥 [SONG-CARD] Variaciones reproducibles para agregar:`, playableVariations.length);
        
        // Agregar todas las variaciones a la cola
        playableVariations.forEach(variation => {
          addToQueue(variation);
          console.log(`✅ [SONG-CARD] Variación agregada a la cola:`, variation.title, variation.voiceType);
        });
        
        console.log(`🎉 [SONG-CARD] Todas las variaciones agregadas a la cola para: ${song.title}`);
      } else {
        // Si no hay variaciones pero la canción tiene voiceType, es una canción individual
        if (song.voiceType) {
          console.log(`🔥 [SONG-CARD] Agregando canción individual:`, song.title, song.voiceType);
          addToQueue(song);
        } else {
          console.warn(`⚠️ [SONG-CARD] No hay variaciones ni voiceType para agregar: ${song.title}`);
        }
      }
    } catch (error) {
      console.error('❌ [SONG-CARD] Error al obtener variaciones para agregar a cola:', error);
      // Fallback: agregar la canción original si tiene voiceType
      if (song.voiceType) {
        console.log(`🔄 [SONG-CARD] Fallback - agregando canción original:`, song.title);
        addToQueue(song);
      }
    }
    
    setShowMenu(false);
  };

  const handlePlaySong = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      console.log(`🎵 [SONG-CARD] Iniciando reproducción de: ${song.title} (ID: ${song.id})`);
      
      // Obtener las variaciones de la canción usando el servicio API
      const response = await api.get(`/songs/${song.id}/versions`);
      const data = response.data;
      const variations = data.versions || [];
      
      console.log(`🎵 [SONG-CARD] Variaciones encontradas:`, variations.length);
      
      if (variations.length > 0) {
        // Filtrar y convertir variaciones a objetos Song completos
        const playableVariations: Song[] = variations
          .filter((v: any) => v.fileName && v.folderName)
          .map((v: any) => ({
            id: v.id,
            title: v.title,
            artist: v.artist || song.artist,
            duration: v.duration || 0,
            fileName: v.fileName,
            filePath: v.filePath || `${v.folderName}/${v.fileName}`,
            fileSize: v.fileSize || 0,
            mimeType: v.mimeType || 'audio/mpeg',
            folderName: v.folderName,
            voiceType: v.voiceType,
            parentSongId: v.parentSongId,
            coverColor: v.coverColor || song.coverColor,
            uploadedBy: v.uploadedBy || v.uploader?.firstName + ' ' + v.uploader?.lastName || 'Desconocido',
            isActive: v.isActive !== undefined ? v.isActive : true,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt || v.createdAt,
            uploader: v.uploader || song.uploader
          } as Song));
        
        console.log(`🎵 [SONG-CARD] Variaciones reproducibles:`, playableVariations.length);
        
        if (playableVariations.length > 0) {
          // Limpiar la cola y agregar todas las variaciones
          replaceQueueAndPlay(playableVariations, 0);
          
          // Reproducir la primera variación usando la API del playerStore
          const firstSong = playableVariations[0];
          
          // Construir URL correcta para archivos de audio con autenticación
          let songUrl: string;
          if (firstSong.folderName) {
            // Archivo en carpeta específica - usar función con autenticación
            songUrl = getSongFileUrl(firstSong.folderName, firstSong.fileName);
          } else {
            // Archivo en carpeta raíz - usar endpoint específico
            songUrl = `${serverInfo.audioBaseUrl}-root/${firstSong.fileName}`;
          }
          
          console.log(`🎵 [SONG-CARD] URL construida:`, songUrl);
          
          const { playSong } = usePlayerStore.getState();
          playSong({
            id: firstSong.id,
            title: firstSong.title,
            artist: firstSong.artist || 'Artista desconocido',
            url: songUrl,
            duration: firstSong.duration || 0
          });
          
          console.log(`🎵 [SONG-CARD] Cola reemplazada y reproduciendo:`, firstSong.title, firstSong.voiceType);
          console.log(`🎵 [SONG-CARD] Total de variaciones en cola:`, playableVariations.length);
        } else {
          console.error('❌ [SONG-CARD] No hay variaciones reproducibles para:', song.title);
        }
      } else {
        console.error('❌ [SONG-CARD] No se encontraron variaciones para:', song.title);
      }
    } catch (error) {
      console.error('❌ [SONG-CARD] Error al obtener variaciones:', error);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div className="cursor-pointer group transform transition-all duration-200 hover:scale-105 relative">
      {/* Cover de la canción */}
      <div 
        onClick={onClick}
        className="aspect-square rounded-lg p-2 sm:p-3 mb-2 shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex items-center justify-center text-white font-bold text-center relative"
        style={{ backgroundColor: color }}
      >
        <div className="w-full">
          <h3 className="text-xs sm:text-sm lg:text-base leading-tight line-clamp-3 uppercase tracking-wide">
            {song.title}
          </h3>
        </div>

        {/* Botón de reproducción central */}
        <button
          onClick={handlePlaySong}
          className="absolute inset-0 w-full h-full bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </button>

        {/* Botón de menú */}
        <button
          onClick={handleMenuClick}
          className="absolute top-1 right-1 sm:top-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-black bg-opacity-30 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-50"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Menú desplegable */}
        {showMenu && (
          <div 
            ref={menuRef}
            className="absolute top-10 right-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[150px]"
          >
            <button
              onClick={handlePlaySong}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Reproducir ahora</span>
            </button>
            <button
              onClick={onClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ver detalles</span>
            </button>
            <button
              onClick={handleAddToQueue}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Agregar a cola</span>
            </button>
          </div>
        )}
      </div>

      {/* Información de la canción */}
      <div className="space-y-0.5 sm:space-y-1" onClick={onClick}>
        <h4 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-1">
          {song.title}
        </h4>
        <p className="text-xs text-gray-600 line-clamp-1 hidden sm:block">
          {song.artist || '[Unknown Artist]'}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="hidden sm:inline">
            {song.childVersions?.length ? `${song.childVersions.length} variaciones` : '1 pista'}
          </span>
          <span className="sm:hidden text-xs">
            {song.childVersions?.length || '1'}
          </span>
          {displayDuration > 0 && (
            <span className="text-xs">{formatDuration(displayDuration)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongCard;
