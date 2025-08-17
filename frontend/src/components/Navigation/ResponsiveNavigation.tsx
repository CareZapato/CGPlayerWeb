import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../utils/permissions';
import './ResponsiveNavigation.css';
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
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const iconMap = {
  Home: HomeIcon,
  Music: MusicalNoteIcon,
  List: QueueListIcon,
  Calendar: CalendarIcon,
  Settings: CogIcon,
  Users: UsersIcon,
  User: UserIcon,
  FolderOpen: FolderOpenIcon,
  ChartBar: ChartBarIcon
};

const ResponsiveNavigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { getMenuItems } = usePermissions();

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

  const renderMenuItem = (item: any, isMobile = false) => {
    const Icon = iconMap[item.icon as keyof typeof iconMap];
    const isActive = location.pathname === item.path;
    const isDropdownOpen = openDropdown === item.key;

    if (item.type === 'dropdown' && item.children?.length > 0) {
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
                  {item.children.map((child: any) => {
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
                  isActive || item.children.some((child: any) => location.pathname === child.path)
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
                    {item.children.map((child: any) => {
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
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">CGPlayerWeb</h1>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {menuItems.map((item) => renderMenuItem(item, false))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Hola, {user?.firstName}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Salir
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
            <h1 className="text-lg font-bold text-gray-900">CGPlayerWeb</h1>
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
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.roles?.map(r => r.role).join(', ').toLowerCase() || 'Sin rol'}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-2 space-y-1">
                {menuItems.map((item) => renderMenuItem(item, true))}
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
