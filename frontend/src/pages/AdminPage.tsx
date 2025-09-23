import React, { useState } from 'react';
import { Calendar, Users, Music, Settings, BarChart3, Database } from 'lucide-react';
import EventManagement from '../components/Management/EventManagement';
import BackupManagement from '../components/BackupManagement';

const AdminPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'events' | 'users' | 'music' | 'stats' | 'settings' | 'backup'>('events');

  const sections = [
    { id: 'events' as const, label: 'Gestión de Eventos', icon: Calendar, component: EventManagement },
    { id: 'users' as const, label: 'Usuarios', icon: Users, component: null },
    { id: 'music' as const, label: 'Música', icon: Music, component: null },
    { id: 'backup' as const, label: 'Backup', icon: Database, component: BackupManagement },
    { id: 'stats' as const, label: 'Estadísticas', icon: BarChart3, component: null },
    { id: 'settings' as const, label: 'Configuración', icon: Settings, component: null }
  ];

  const activeComponent = sections.find(s => s.id === activeSection)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona todos los aspectos del sistema CGPlayer
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeSection === section.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <section.icon className="h-4 w-4 mr-2" />
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeComponent ? (
            React.createElement(activeComponent)
          ) : (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-100 shadow-lg max-w-md mx-auto">
                <Settings className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sección en Desarrollo
                </h3>
                <p className="text-gray-500">
                  Esta funcionalidad estará disponible próximamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
