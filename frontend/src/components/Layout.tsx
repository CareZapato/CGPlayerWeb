import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">CGPlayerWeb</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-700 hover:text-gray-900">Inicio</a>
              <a href="/songs" className="text-gray-700 hover:text-gray-900">Canciones</a>
              <a href="/playlists" className="text-gray-700 hover:text-gray-900">Listas</a>
              <a href="/events" className="text-gray-700 hover:text-gray-900">Eventos</a>
              <a href="/profile" className="text-gray-700 hover:text-gray-900">Perfil</a>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
