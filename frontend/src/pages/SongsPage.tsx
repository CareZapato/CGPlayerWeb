import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useServerInfo } from '../hooks/useServerInfo';
import { getApiUrl } from '../config/api';
import SongUpload from '../components/SongUpload';
import MultiSongUpload from '../components/MultiSongUpload';
import type { Song } from '../types';

interface SongWithVersions extends Song {
  parentSong?: {
    id: string;
    title: string;
  };
  childVersions: Song[];
}

const VOICE_TYPE_LABELS: { [key: string]: string } = {
  SOPRANO: 'Soprano',
  CONTRALTO: 'Contralto',
  TENOR: 'Tenor',
  BARITONO: 'Barítono',
  MESOSOPRANO: 'Mesosoprano',
  BAJO: 'Bajo',
  CORO: 'Coro',
  ORIGINAL: 'Original'
};

const VOICE_TYPE_COLORS: { [key: string]: string } = {
  SOPRANO: 'bg-pink-100 text-pink-800 border-pink-200',
  CONTRALTO: 'bg-purple-100 text-purple-800 border-purple-200',
  TENOR: 'bg-blue-100 text-blue-800 border-blue-200',
  BARITONO: 'bg-green-100 text-green-800 border-green-200',
  MESOSOPRANO: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  BAJO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CORO: 'bg-orange-100 text-orange-800 border-orange-200',
  ORIGINAL: 'bg-gray-100 text-gray-800 border-gray-200'
};

const SongsPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const { playSong, currentSong, isPlaying } = usePlayerStore();
  const { addSingleToQueue, replaceQueueAndPlay, addToQueue } = usePlaylistStore();
  const { serverInfo } = useServerInfo();
  const [songs, setSongs] = useState<SongWithVersions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'multi'>('single');
  const [selectedSong, setSelectedSong] = useState<SongWithVersions | null>(null);
  const [expandedSongs, setExpandedSongs] = useState<Set<string>>(new Set());

  const canUpload = user?.roles?.some(r => ['ADMIN', 'CANTANTE'].includes(r.role)) || false;

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await fetch(getApiUrl('/api/songs?includeVersions=true'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las canciones');
      }

      const data = await response.json();
      
      // Filtrar solo canciones principales (sin parentSongId) ya que includeVersions=true 
      // traerá las versiones como childVersions en cada canción padre
      const mainSongs = (data.songs || []).filter((song: SongWithVersions) => !song.parentSongId);
      setSongs(mainSongs);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    // Solo permitir reproducir versiones individuales (que tengan voiceType)
    if (!song.voiceType) {
      console.log('No se puede reproducir canción contenedora directamente');
      return;
    }

    // Crear el objeto Song completo con las propiedades necesarias
    const songToQueue: Song = {
      ...song,
      filePath: song.filePath || `${song.folderName}/${song.fileName}`,
      fileSize: song.fileSize || 0,
      mimeType: song.mimeType || 'audio/mpeg',
      uploadedBy: song.uploadedBy || song.uploader.firstName + ' ' + song.uploader.lastName,
      isActive: song.isActive || true,
      updatedAt: song.updatedAt || song.createdAt
    };

    // Limpiar la cola y agregar solo esta canción
    addSingleToQueue(songToQueue);
    
    // Construir la URL usando la información del servidor
    let songUrl: string;
    
    if (song.folderName) {
      // Archivo en carpeta específica
      songUrl = `${serverInfo.audioBaseUrl}/${song.folderName}/${song.fileName}`;
    } else {
      // Archivo en carpeta raíz - usar endpoint específico
      songUrl = `${serverInfo.audioBaseUrl}-root/${song.fileName}`;
    }
      
    console.log('🎵 Reproduciendo canción individual:', { 
      song: song.title, 
      url: songUrl,
      voiceType: song.voiceType,
      folderName: song.folderName,
      fileName: song.fileName,
      audioBaseUrl: serverInfo.audioBaseUrl
    });
      
    // Reproducir inmediatamente
    playSong({
      id: song.id,
      title: song.title,
      artist: song.artist || 'Desconocido',
      url: songUrl,
      duration: song.duration || 0
    });
  };

  const handlePlayAllVersions = async (song: SongWithVersions) => {
    console.log('🎵 Playing all versions for:', song.title);
    
    if (song.childVersions.length === 0) {
      // Si no tiene versiones, es una canción individual, reproducirla directamente
      handlePlaySong(song);
      return;
    }

    try {
      // Obtener todas las versiones de la canción desde la API
      const response = await fetch(getApiUrl(`/api/songs/${song.id}/versions`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Error en la respuesta:', response.status, response.statusText);
        // Si falla la API, usar las versiones que ya tenemos
        console.log('Usando versiones locales:', song.childVersions.length);
        playLocalVersions(song);
        return;
      }

      const data = await response.json();
      const versions = data.versions || [];

      if (versions.length === 0) {
        console.log('No hay versiones en la respuesta de la API, usando versiones locales');
        playLocalVersions(song);
        return;
      }

      // Usar las versiones de la API
      playVersionsFromAPI(versions);

    } catch (error: any) {
      console.error('Error al cargar versiones para reproducción:', error);
      // Fallback a versiones locales
      playLocalVersions(song);
    }
  };

  const playLocalVersions = (song: SongWithVersions) => {
    const versions = song.childVersions;
    
    // Convertir versiones al formato correcto para el reproductor
    const songsToQueue: Song[] = versions.map((version: any) => ({
      ...version,
      filePath: version.filePath || `${version.folderName}/${version.fileName}`,
      fileSize: version.fileSize || 0,
      mimeType: version.mimeType || 'audio/mpeg',
      uploadedBy: version.uploadedBy || version.uploader?.firstName + ' ' + version.uploader?.lastName,
      isActive: version.isActive || true,
      updatedAt: version.updatedAt || version.createdAt
    }));

    if (songsToQueue.length === 0) {
      console.log('❌ No hay versiones válidas para reproducir');
      return;
    }

    console.log('🎵 Configurando cola con versiones locales:', { 
      total: songsToQueue.length,
      titles: songsToQueue.map(s => `${s.title} (${VOICE_TYPE_LABELS[s.voiceType!] || s.voiceType})`)
    });

    // Reemplazar la cola y configurar la primera canción
    replaceQueueAndPlay(songsToQueue, 0);
    
    // Inmediatamente reproducir la primera canción
    const firstSong = songsToQueue[0];
    const songUrl = `${serverInfo.audioBaseUrl}/${firstSong.folderName}/${firstSong.fileName}`;
    
    console.log('🎵 ¡INICIANDO REPRODUCCIÓN INMEDIATA!:', { 
      song: firstSong.title,
      voiceType: firstSong.voiceType,
      url: songUrl
    });
    
    // Reproducir SIN delay
    playSong({
      id: firstSong.id,
      title: `${firstSong.title} (${VOICE_TYPE_LABELS[firstSong.voiceType!] || firstSong.voiceType})`,
      artist: firstSong.artist || 'Desconocido',
      url: songUrl,
      duration: firstSong.duration || 0
    });
  };

  const playVersionsFromAPI = (versions: any[]) => {
    // Convertir versiones al formato correcto para el reproductor
    const songsToQueue: Song[] = versions.map((version: any) => ({
      ...version,
      filePath: version.filePath || `${version.folderName}/${version.fileName}`,
      fileSize: version.fileSize || 0,
      mimeType: version.mimeType || 'audio/mpeg',
      uploadedBy: version.uploadedBy || version.uploader?.firstName + ' ' + version.uploader?.lastName,
      isActive: version.isActive || true,
      updatedAt: version.updatedAt || version.createdAt
    }));

    if (songsToQueue.length === 0) {
      console.log('❌ No hay versiones válidas para reproducir desde API');
      return;
    }

    console.log('🎵 Configurando cola con versiones de API:', { 
      total: songsToQueue.length,
      titles: songsToQueue.map(s => `${s.title} (${VOICE_TYPE_LABELS[s.voiceType!] || s.voiceType})`)
    });

    // Reemplazar la cola y configurar la primera canción
    replaceQueueAndPlay(songsToQueue, 0);
    
    // Inmediatamente reproducir la primera canción
    const firstSong = songsToQueue[0];
    const songUrl = `${serverInfo.audioBaseUrl}/${firstSong.folderName}/${firstSong.fileName}`;
    
    console.log('🎵 ¡INICIANDO REPRODUCCIÓN INMEDIATA!:', { 
      song: firstSong.title,
      voiceType: firstSong.voiceType,
      url: songUrl
    });
    
    // Reproducir SIN delay
    playSong({
      id: firstSong.id,
      title: `${firstSong.title} (${VOICE_TYPE_LABELS[firstSong.voiceType!] || firstSong.voiceType})`,
      artist: firstSong.artist || 'Desconocido',
      url: songUrl,
      duration: firstSong.duration || 0
    });
  };

  const addVersionsToQueue = (song: SongWithVersions) => {
    console.log('🔥 AGREGANDO VERSIONES A LA COLA:', song.title);
    console.log('🔥 Versiones disponibles:', song.childVersions.length);
    
    // Si no hay versiones hijas pero la canción tiene voiceType, es una canción individual
    if (song.childVersions.length === 0) {
      if (song.voiceType) {
        console.log('🔥 Agregando canción individual con voiceType:', song.voiceType);
        
        // Crear el objeto Song completo para la canción individual
        const songToAdd: Song = {
          id: song.id,
          title: song.title,
          artist: song.artist || 'Desconocido',
          album: song.album,
          duration: song.duration || 0,
          fileName: song.fileName,
          filePath: song.filePath || `${song.folderName}/${song.fileName}`,
          fileSize: song.fileSize || 0,
          mimeType: song.mimeType || 'audio/mpeg',
          folderName: song.folderName,
          voiceType: song.voiceType,
          parentSongId: song.parentSongId,
          coverColor: song.coverColor,
          uploadedBy: song.uploadedBy || (song.uploader ? `${song.uploader.firstName} ${song.uploader.lastName}` : 'Desconocido'),
          isActive: song.isActive !== undefined ? song.isActive : true,
          createdAt: song.createdAt,
          updatedAt: song.updatedAt || song.createdAt,
          uploader: song.uploader
        };
        
        addToQueue(songToAdd);
        console.log('✅ Canción individual agregada:', songToAdd.title, songToAdd.voiceType);
      } else {
        console.log('❌ No hay versiones ni voiceType para agregar');
      }
      return;
    }
    
    // Agregar todas las versiones hijas
    song.childVersions.forEach(version => {
      console.log('🔥 Agregando versión:', version.voiceType, version.title);
      
      // Crear el objeto Song completo con todas las propiedades necesarias
      const songToAdd: Song = {
        id: version.id,
        title: version.title,
        artist: version.artist || 'Desconocido',
        album: version.album,
        duration: version.duration || 0,
        fileName: version.fileName,
        filePath: version.filePath || `${version.folderName}/${version.fileName}`,
        fileSize: version.fileSize || 0,
        mimeType: version.mimeType || 'audio/mpeg',
        folderName: version.folderName,
        voiceType: version.voiceType,
        parentSongId: version.parentSongId,
        coverColor: version.coverColor,
        uploadedBy: version.uploadedBy || (version.uploader ? `${version.uploader.firstName} ${version.uploader.lastName}` : 'Desconocido'),
        isActive: version.isActive !== undefined ? version.isActive : true,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt || version.createdAt,
        uploader: version.uploader
      };
      
      addToQueue(songToAdd);
      console.log('✅ Versión agregada:', songToAdd.title, songToAdd.voiceType);
    });
    
    console.log('🎉 TODAS LAS VERSIONES AGREGADAS A LA COLA');
  };

  const toggleSongExpansion = (songId: string) => {
    const newExpanded = new Set(expandedSongs);
    if (newExpanded.has(songId)) {
      newExpanded.delete(songId);
    } else {
      newExpanded.add(songId);
    }
    setExpandedSongs(newExpanded);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setSelectedSong(null);
    fetchSongs();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchSongs}
          className="mt-2 btn-primary"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Biblioteca Musical</h1>
        {canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Subir Canción</span>
          </button>
        )}
      </div>

      {/* Modal de subida */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl mx-auto max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Subir Canciones</h2>
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setSelectedSong(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4 sm:mb-6">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
                  <button
                    onClick={() => setUploadMode('single')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      uploadMode === 'single'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Subida Individual
                  </button>
                  <button
                    onClick={() => setUploadMode('multi')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      uploadMode === 'multi'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Subida Múltiple
                  </button>
                </nav>
              </div>

              {/* Content */}
              <div className="overflow-hidden">
                {uploadMode === 'single' ? (
                  <SongUpload
                    parentSong={selectedSong ? { id: selectedSong.id, title: selectedSong.title } : undefined}
                    onUploadSuccess={handleUploadSuccess}
                    onClose={() => {
                      setShowUpload(false);
                      setSelectedSong(null);
                    }}
                  />
                ) : (
                  <MultiSongUpload
                    parentSongId={selectedSong?.id}
                    onUploadComplete={() => {
                      handleUploadSuccess();
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de canciones */}
      {songs.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay canciones</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza subiendo tu primera canción</p>
        </div>
      ) : (
        <div className="space-y-4">
          {songs.map((song) => (
            <div key={song.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Botón de reproducir - siempre visible */}
                  <button
                    onClick={() => handlePlayAllVersions(song)}
                    className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
                      currentSong?.id === song.id && isPlaying
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 hover:bg-primary-100 text-gray-600 hover:text-primary-600'
                    }`}
                    title={song.childVersions.length > 0 ? `Reproducir todas las versiones (${song.childVersions.length})` : 'Reproducir canción'}
                  >
                    {currentSong?.id === song.id && isPlaying ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Información de la canción */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{song.title}</h3>
                    <p className="text-sm text-gray-600 truncate">
                      {song.artist && `${song.artist} • `}
                      Subido el {formatDate(song.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Por {song.uploader.firstName} {song.uploader.lastName}
                    </p>
                  </div>
                </div>

                {/* Versiones disponibles */}
                {song.childVersions.length > 0 && (
                  <div className="flex flex-col sm:items-end space-y-2">
                    <span className="text-sm text-gray-500">
                      {song.childVersions.length} versión{song.childVersions.length !== 1 ? 'es' : ''}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {song.childVersions.map((version) => (
                        <span
                          key={version.id}
                          className={`px-2 py-1 text-xs rounded-full border ${VOICE_TYPE_COLORS[version.voiceType!] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                        >
                          {VOICE_TYPE_LABELS[version.voiceType!] || version.voiceType}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center justify-end space-x-2">
                  {/* Botón Agregar a Cola */}
                  <button
                    onClick={() => addVersionsToQueue(song)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-blue-50 hover:bg-blue-100 rounded-full border border-blue-200"
                    title={song.childVersions.length > 0 ? `Agregar todas las versiones a la cola (${song.childVersions.length})` : 'Agregar canción a la cola'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </button>

                  {canUpload && (
                    <button
                      onClick={() => {
                        setSelectedSong(song);
                        setShowUpload(true);
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors bg-green-50 hover:bg-green-100 rounded-full border border-green-200"
                      title="Agregar versión por voz"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </button>
                  )}

                  {song.childVersions.length > 0 && (
                    <button
                      onClick={() => toggleSongExpansion(song.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${
                          expandedSongs.has(song.id) ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Versiones expandidas */}
              {expandedSongs.has(song.id) && song.childVersions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Versiones por voz:</h4>
                  <div className="space-y-2">
                    {song.childVersions.map((version) => (
                      <div key={version.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg p-3 gap-3">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handlePlaySong(version)}
                            className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
                              currentSong?.id === version.id && isPlaying
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-600 hover:text-primary-600'
                            }`}
                          >
                            {currentSong?.id === version.id && isPlaying ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                          </button>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full border font-medium ${VOICE_TYPE_COLORS[version.voiceType!] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                              {VOICE_TYPE_LABELS[version.voiceType!] || version.voiceType}
                            </span>
                            <p className="text-xs text-gray-500">
                              {formatDate(version.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SongsPage;
