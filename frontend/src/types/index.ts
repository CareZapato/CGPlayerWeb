export type UserRole = 'SINGER' | 'DIRECTOR' | 'ADMIN';

export type VoiceType = 'SOPRANO' | 'CONTRALTO' | 'TENOR' | 'BARITONE' | 'BASS';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  voiceProfiles?: UserVoiceProfile[];
}

export interface UserVoiceProfile {
  id: string;
  userId: string;
  voiceType: VoiceType;
  assignedBy?: string;
  createdAt: string;
  assignedByUser?: {
    firstName: string;
    lastName: string;
  };
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  uploader: {
    firstName: string;
    lastName: string;
  };
  assignments?: SongAssignment[];
  lyrics?: Lyric[];
  _count?: {
    lyrics: number;
    playlistItems: number;
  };
}

export interface SongAssignment {
  id: string;
  songId: string;
  userId: string;
  voiceType: VoiceType;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  song?: {
    title: string;
  };
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  voiceType?: VoiceType;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  items?: PlaylistItem[];
  _count?: {
    items: number;
  };
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  songId: string;
  order: number;
  createdAt: string;
  song: Song;
}

export interface Lyric {
  id: string;
  songId: string;
  content: string;
  timestamp?: number;
  voiceType?: VoiceType;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  song?: {
    title: string;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginCredentials {
  login: string; // email o username
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
  voiceType?: VoiceType;
  isPublic?: boolean;
}

export interface CreateLyricData {
  songId: string;
  content: string;
  timestamp?: number;
  voiceType?: VoiceType;
}

export interface MediaSessionState {
  isPlaying: boolean;
  currentSong?: Song;
  currentTime: number;
  duration: number;
  volume: number;
}
