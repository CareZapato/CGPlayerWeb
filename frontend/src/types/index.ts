export type UserRole = 'ADMIN' | 'CANTANTE' | 'DIRECTOR';

// Tipos de voz para usuarios (sin CORO y ORIGINAL)
export type UserVoiceType = 'SOPRANO' | 'MESOSOPRANO' | 'CONTRALTO' | 'TENOR' | 'BARITONO' | 'BAJO';

// Tipos de voz para canciones (incluye CORO y ORIGINAL como tags)
export type VoiceType = 'SOPRANO' | 'CONTRALTO' | 'TENOR' | 'BARITONO' | 'MESOSOPRANO' | 'BAJO' | 'CORO' | 'ORIGINAL';

export interface UserRole_DB {
  id: string;
  userId: string;
  role: UserRole;
  assignedBy?: string;
  assignedAt: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  locationId?: string;  // ID de la ubicación asignada
  roles?: UserRole_DB[];  // Roles del usuario desde user_roles
  voiceProfiles?: UserVoiceProfile[];  // Voces desde user_voices_profile
}

export interface UserVoiceProfile {
  id: string;
  userId: string;
  voiceType: VoiceType;
  assignedBy?: string;
  assignedAt: string;
  isActive: boolean;
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
  folderName?: string;
  voiceType?: VoiceType;
  parentSongId?: string;
  coverColor?: string;
  uploadedBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  uploader: {
    firstName: string;
    lastName: string;
  };
  parentSong?: {
    id: string;
    title: string;
  };
  childVersions?: Song[];
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

export interface Location {
  id: string;
  name: string;
  city: string;
  color?: string;
  address?: string;
  phone?: string;
  directors?: DirectorInfo[];
}

export interface DirectorInfo {
  id: string;
  name: string;
  voiceProfiles?: {
    voiceType: UserVoiceType;
  }[];
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalSongs: number;
  totalEvents: number;
  usersByLocation: {
    locationId: string;
    locationName: string;
    city: string;
    color: string;
    address?: string;
    phone?: string;
    count: number;
  }[];
  usersByVoiceType: {
    voiceType: string;
    count: number;
  }[];
  usersByRole: {
    role: string;
    count: number;
  }[];
  recentEvents: {
    id: string;
    title: string;
    category: string;
    dateTime: string;
    location: { name: string };
  }[];
  userRole: string[];
  isFiltered: boolean;
  filterLocation?: string;
}
