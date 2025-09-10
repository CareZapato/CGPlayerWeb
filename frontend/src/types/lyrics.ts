// Tipos para el sistema de letras v0.8.0 - Segunda Iteración
export const LyricsType = {
  TEXT: 'TEXT',
  PDF: 'PDF',
  DOC: 'DOC',
  DOCX: 'DOCX'
} as const;

export type LyricsType = typeof LyricsType[keyof typeof LyricsType];

// Nuevo enum para tipos específicos de archivos de letras
export const LyricsFileType = {
  PDF: 'PDF',
  DOC: 'DOC',
  DOCX: 'DOCX',
  IMAGE_JPG: 'IMAGE_JPG',
  IMAGE_PNG: 'IMAGE_PNG',
  TEXT: 'TEXT'
} as const;

export type LyricsFileType = typeof LyricsFileType[keyof typeof LyricsFileType];

// Tipos de voz (debe coincidir con el backend y types/index.ts)
export type VoiceType = 'SOPRANO' | 'CONTRALTO' | 'TENOR' | 'BARITONO' | 'MESOSOPRANO' | 'BAJO' | 'CORO' | 'ORIGINAL' | 'INSTRUMENTAL';

// Archivo de letras individual
export interface LyricsFile {
  id: string;
  songId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileType: LyricsFileType;
  uploadedBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Línea de letra sincronizada por variante de voz
export interface Lyric {
  id: string;
  songId: string;
  content: string;
  startTime?: number;
  endTime?: number;
  lineNumber: number;
  voiceType?: VoiceType | null; // null = canción principal
  textContent?: string | null; // Para letras completas de texto
  isTextLyrics: boolean; // True si son letras de texto completas
  isSynchronized?: boolean; // True si tiene sincronización temporal real
  createdBy: string;
  isActive: boolean; // Estado general
  isHighlighted: boolean; // True si esta línea debe ser resaltada/cantada por esta voz
  createdAt: string;
  updatedAt: string;
}

// Canción con letras completas
export interface SongWithLyrics {
  id: string;
  title: string;
  artist?: string;
  voiceType?: VoiceType | null;
  parentSongId?: string | null; // ID de la canción padre para variaciones
  hasLyricSync: boolean;
  lyricsFiles: LyricsFile[]; // Archivos compartidos entre variantes
  lyrics: Lyric[]; // Sincronizaciones por variante
  // ... otros campos de la canción
}

// Datos para subir archivos
export interface LyricsUploadResponse {
  success: boolean;
  message: string;
  file?: LyricsFile;
}

// Datos para sincronización
export interface LyricsSyncData {
  content: string;
  startTime?: number;
  endTime?: number;
  lineNumber: number;
  voiceType?: VoiceType | null;
}

// Petición para actualizar letras de texto
export interface TextLyricsUpdateRequest {
  content: string;
  voiceType?: VoiceType | null;
}

// Letras por variante de voz
export interface LyricsByVoice {
  [voiceType: string]: Lyric[]; // 'main' para canción principal, o tipo de voz específico
}

// Estado completo de letras de una canción
export interface SongLyricsState {
  songId: string;
  files: LyricsFile[];
  textLyrics: LyricsByVoice;
  syncedLyrics: LyricsByVoice;
  hasAnyLyrics: boolean;
  hasFiles: boolean;
  hasText: boolean;
  hasSync: boolean;
}
