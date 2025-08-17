import React from 'react';
import ResponsiveNavigation from '../Navigation/ResponsiveNavigation';
import AudioManager from '../AudioManager/AudioManager';
import BottomPlayer from '../BottomPlayer/BottomPlayer';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24" style={{ paddingBottom: '100px' }}>
        {children}
      </main>
      
      {/* Audio Manager para manejar la reproducción global */}
      <AudioManager />
      
      {/* Reproductor de barra inferior */}
      <BottomPlayer />
    </div>
  );
};

export default Layout;
