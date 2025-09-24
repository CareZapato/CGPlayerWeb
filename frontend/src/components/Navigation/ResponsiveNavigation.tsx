import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../utils/permissions';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import './ResponsiveNavigation.css';
import LogoCGP from '../../images/LogoCGP.png';
import { 
  HomeIcon,
  MusicalNoteIcon,
  QueueListIcon,
  CalendarIcon,
  CogIcon,
  UsersIcon,
  UserIcon,
  FolderOpenIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

// Tipos para los elementos del menú
interface MenuChild {
  key: string;
  label: string;
  icon: string;
  path: string;
  requiredPermission?: string;
}

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  type: string;
  children?: MenuChild[];
}

const iconMap = {
  Home: HomeIcon,
  Music: MusicalNoteIcon,
  List: QueueListIcon,
  Calendar: CalendarIcon,
  Settings: CogIcon,
  Users: UsersIcon,
  User: UserIcon,
  FolderOpen: FolderOpenIcon,
  ChartBar: ChartBarIcon,
  Database: CircleStackIcon
};

const ResponsiveNavigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { getMenuItems } = usePermissions();

  // Obtener perfil del usuario para la imagen
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/profile/me');
      console.log('🧭 [NAV] Datos de perfil para navegación:', response.data);
      console.log('🖼️ [NAV] URL de imagen en navegación:', response.data.profileImageUrl);
      return response.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  console.log('🧭 [NAV] Componente renderizado, usuario:', user?.firstName, user?.roles);
  const menuItems = getMenuItems(user);
  console.log('🧭 [NAV] Items de menú generados:', menuItems.length, menuItems.map(i => i.label));

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const renderMenuItem = (item: MenuItem, isMobile = false) => {
    const Icon = iconMap[item.icon as keyof typeof iconMap];
    const isActive = location.pathname === item.path;
    const isDropdownOpen = openDropdown === item.key;

    if (item.type === 'dropdown' && item.children && item.children.length > 0) {
      return (
        <div key={item.key} className={isMobile ? 'block' : 'relative group'}>
          {isMobile ? (
            // Mobile dropdown
            <div>
              <button
                onClick={() => toggleDropdown(item.key)}
                className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </div>
                {isDropdownOpen ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
              
              {isDropdownOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children && item.children.map((child: MenuChild) => {
                    const ChildIcon = iconMap[child.icon as keyof typeof iconMap];
                    const isChildActive = location.pathname === child.path;
                    
                    return (
                      <Link
                        key={child.key}
                        to={child.path}
                        onClick={closeMobileMenu}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isChildActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <ChildIcon className="w-4 h-4 mr-2" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Desktop dropdown
            <div className="relative">
              <button
                onClick={() => toggleDropdown(item.key)}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive || (item.children && item.children.some((child: MenuChild) => location.pathname === child.path))
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
                <ChevronDownIcon className="w-3 h-3 ml-1" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    {item.children && item.children.map((child: MenuChild) => {
                      const ChildIcon = iconMap[child.icon as keyof typeof iconMap];
                      const isChildActive = location.pathname === child.path;
                      
                      return (
                        <Link
                          key={child.key}
                          to={child.path}
                          onClick={() => setOpenDropdown(null)}
                          className={`flex items-center px-4 py-2 text-sm transition-colors ${
                            isChildActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                          }`}
                        >
                          <ChildIcon className="w-4 h-4 mr-3" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    } else {
      // Single menu item
      return (
        <Link
          key={item.key}
          to={item.path}
          onClick={isMobile ? closeMobileMenu : undefined}
          className={`${isMobile ? 'flex' : 'inline-flex'} items-center px-3 py-${isMobile ? '3' : '2'} rounded-${isMobile ? 'lg' : 'md'} text-sm font-medium transition-colors ${
            isActive
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <Icon className={`w-${isMobile ? '5' : '4'} h-${isMobile ? '5' : '4'} mr-${isMobile ? '3' : '2'}`} />
          {item.label}
        </Link>
      );
    }
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  return (
    <>
      {/* Desktop Navigation - Mejorado para responsive */}
      <nav className="hidden lg:flex bg-white shadow-sm border-b border-gray-200">
        <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-16">
            {/* Logo y título a la izquierda */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex items-center">
                <img 
                  src={LogoCGP} 
                  alt="CGPlayer Logo" 
                  className="h-8 w-8 mr-3"
                />
                <h1 className="text-xl font-bold text-gray-900 hidden xl:block">CGPlayer</h1>
                <h1 className="text-lg font-bold text-gray-900 xl:hidden">CGP</h1>
              </div>
            </div>

            {/* Menú centrado con scroll horizontal si es necesario */}
            <div className="flex-1 flex items-center justify-center min-w-0 mx-4">
              <div className="flex space-x-2 xl:space-x-6 overflow-x-auto scrollbar-none max-w-full">
                {menuItems.map((item) => renderMenuItem(item, false))}
              </div>
            </div>

            {/* Usuario y logout a la derecha */}
            <div className="flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
              {/* Changelog Icon - Solo en pantallas grandes */}
              <Link
                to="/changelog"
                className="hidden xl:inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                title="Historial de cambios y versiones"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </Link>
              
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-2 xl:px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                title={`Ver perfil de ${user?.firstName} ${user?.lastName}`}
              >
                {profile?.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={`${user?.firstName}`}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      console.error('❌ [NAV] Error cargando imagen:', profile.profileImageUrl);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ${profile?.profileImageUrl ? 'hidden' : ''}`}>
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 hover:text-blue-600 hidden xl:block">
                  {user?.firstName}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-2 xl:px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 xl:mr-2" />
                <span className="hidden xl:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tablet Navigation (md a lg) - Híbrido */}
      <nav className="hidden md:flex lg:hidden bg-white shadow-sm border-b border-gray-200">
        <div className="w-full mx-auto px-2 sm:px-4">
          <div className="flex justify-between h-16">
            {/* Logo compacto */}
            <div className="flex items-center">
              <img 
                src={LogoCGP} 
                alt="CGPlayer Logo" 
                className="h-8 w-8 mr-2"
              />
              <h1 className="text-lg font-bold text-gray-900">CGP</h1>
            </div>

            {/* Menú compacto horizontal con scroll */}
            <div className="flex-1 flex items-center justify-center mx-4">
              <div className="flex space-x-1 overflow-x-auto scrollbar-none max-w-full">
                {menuItems.slice(0, 4).map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  const isActive = location.pathname === item.path;
                  
                  if (item.type === 'dropdown') {
                    return (
                      <div key={item.key} className="relative">
                        <button
                          onClick={() => toggleDropdown(item.key)}
                          className={`inline-flex items-center px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                            isActive || (item.children && item.children.some((child: MenuChild) => location.pathname === child.path))
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                          }`}
                          title={item.label}
                        >
                          <Icon className="w-4 h-4" />
                          <ChevronDownIcon className="w-3 h-3 ml-1" />
                        </button>
                        
                        {openDropdown === item.key && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                            <div className="py-1">
                              {item.children && item.children.map((child: MenuChild) => {
                                const ChildIcon = iconMap[child.icon as keyof typeof iconMap];
                                const isChildActive = location.pathname === child.path;
                                
                                return (
                                  <Link
                                    key={child.key}
                                    to={child.path}
                                    onClick={() => setOpenDropdown(null)}
                                    className={`flex items-center px-3 py-2 text-sm transition-colors ${
                                      isChildActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    <ChildIcon className="w-4 h-4 mr-3" />
                                    {child.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <Link
                        key={item.key}
                        to={item.path}
                        className={`inline-flex items-center px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                        title={item.label}
                      >
                        <Icon className="w-4 h-4" />
                      </Link>
                    );
                  }
                })}
              </div>
            </div>

            {/* Usuario compacto */}
            <div className="flex items-center space-x-2">
              <Link
                to="/profile"
                className="flex items-center space-x-1 px-2 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                {profile?.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={`${user?.firstName}`}
                    className="w-6 h-6 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-blue-600" />
                  </div>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center p-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              <img 
                src={LogoCGP} 
                alt="CGPlayer Logo" 
                className="h-6 w-6 mr-2"
              />
              <h1 className="text-lg font-bold text-gray-900">CGPlayer</h1>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={closeMobileMenu} />
        )}

        {/* Mobile Menu */}
        <div className={`fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Menu Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <Link
              to="/profile"
              onClick={closeMobileMenu}
              className="block p-4 border-b border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {profile?.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={`${user?.firstName}`}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      console.error('❌ [NAV-MOBILE] Error cargando imagen:', profile.profileImageUrl);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ${profile?.profileImageUrl ? 'hidden' : ''}`}>
                  <UserIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.roles?.map(r => r.role).join(', ').toLowerCase() || 'Sin rol'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Ver perfil →</p>
                </div>
              </div>
            </Link>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-2 space-y-1">
                {menuItems.map((item) => renderMenuItem(item, true))}
                
                {/* Changelog móvil con mejor icono */}
                <Link
                  to="/changelog"
                  onClick={closeMobileMenu}
                  className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Historial de Cambios
                </Link>
              </nav>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResponsiveNavigation;
