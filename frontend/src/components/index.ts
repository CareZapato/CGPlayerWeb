// components/index.ts - Barrel export para todos los componentes

// Player components
export { default as StickyPlayer } from './Player/StickyPlayer';
export { default as SimplePlayer } from './Player/SimplePlayer';

// UI components
export { default as SongCard } from './UI/SongCard';
export { default as PlaylistPlayer } from './UI/PlaylistPlayer';

// Layout components
export { default as Layout } from './Layout';

// Modal components
export { default as SongDetailModal } from './Modal/SongDetailModal';

// Upload components
export { default as SongUpload } from './SongUpload/SongUpload';
export { default as MultiSongUpload } from './Upload/MultiSongUpload';

// Navigation components
export { default as ResponsiveNavigation } from './Navigation/ResponsiveNavigation';

// Management components
export { default as EventManagement } from './Management/EventManagement';

// Media components
export { default as AlbumCard } from './AlbumCard/AlbumCard';
export { default as AudioManager } from './AudioManager/AudioManager';
export { default as FloatingPlayer } from './FloatingPlayer/FloatingPlayer';
export { default as BottomPlayer } from './BottomPlayer/BottomPlayer';

// Route guards
export { default as ProtectedRoute } from './ProtectedRoute/ProtectedRoute';
