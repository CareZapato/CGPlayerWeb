import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  changes: {
    category: 'added' | 'improved' | 'fixed' | 'removed';
    items: string[];
  }[];
  highlights?: string[];
}

const changelogData: ChangelogEntry[] = [
  {
    version: '0.4.1',
    date: '2025-08-18',
    type: 'minor',
    title: 'Separación Dashboard y Sistema de Directores',
    highlights: [
      'Dashboard diferenciado por roles',
      'Sistema completo de directores implementado',
      'Logo y navegación renovados'
    ],
    changes: [
      {
        category: 'added',
        items: [
          'Nuevo sistema de directores con roles específicos',
          'Dashboard separado para administradores y directores',
          'Página de inicio personalizada por rol de usuario',
          'Logo oficial CGPlayer integrado en navegación',
          'Sección Changelog moderna con versionado',
          'Información de contacto por ubicación (teléfonos)',
          'Vista filtrada de dashboard para directores'
        ]
      },
      {
        category: 'improved',
        items: [
          'Navegación ahora ocupa todo el ancho disponible',
          'Título de la aplicación cambió de "CGPlayerWeb" a "CGPlayer"',
          'Permisos reorganizados para separar Inicio de Dashboard',
          'Interfaz de usuario más intuitiva y personalizada'
        ]
      },
      {
        category: 'fixed',
        items: [
          'Corrección en filtros de ubicación para evitar duplicados',
          'Sincronización de base de datos con nuevos campos',
          'Validación de roles mejorada en frontend'
        ]
      }
    ]
  },
  {
    version: '0.4.0',
    date: '2025-08-17',
    type: 'minor',
    title: 'Mejoras del Reproductor Musical',
    highlights: [
      'Reproductor completamente renovado',
      'Controles de playlist avanzados',
      'Visualización de tiempo mejorada'
    ],
    changes: [
      {
        category: 'added',
        items: [
          'Contador de canciones en cola con badges',
          'Modos de reproducción: shuffle y repeat (off/all/one)',
          'Indicador de tiempo bajo barras de progreso',
          'Controles de volumen personalizados con relleno visual',
          'Ícono de shuffle con flechas cruzadas'
        ]
      },
      {
        category: 'improved',
        items: [
          'Altura del reproductor aumentada para mejor integración',
          'Controles de playlist reorganizados',
          'Experiencia de usuario más fluida'
        ]
      }
    ]
  },
  {
    version: '0.3.5',
    date: '2025-08-15',
    type: 'patch',
    title: 'Correcciones y Optimizaciones',
    changes: [
      {
        category: 'fixed',
        items: [
          'Corrección de errores en carga de canciones',
          'Mejoras en la estabilidad del sistema',
          'Optimización de consultas a base de datos'
        ]
      },
      {
        category: 'improved',
        items: [
          'Rendimiento mejorado en listado de usuarios',
          'Carga más rápida de estadísticas'
        ]
      }
    ]
  }
];

const ChangelogPage: React.FC = () => {
  const [expandedVersions, setExpandedVersions] = useState<string[]>(['0.4.1']);

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => 
      prev.includes(version) 
        ? prev.filter(v => v !== version)
        : [...prev, version]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'added': return '✨';
      case 'improved': return '🚀';
      case 'fixed': return '🔧';
      case 'removed': return '🗑️';
      default: return '📝';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'added': return 'bg-green-100 text-green-800 border-green-200';
      case 'improved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fixed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'removed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVersionBadgeColor = (type: string) => {
    switch (type) {
      case 'major': return 'bg-red-500 text-white';
      case 'minor': return 'bg-blue-500 text-white';
      case 'patch': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Changelog & Información
        </h1>
        <p className="text-xl text-gray-600">
          Historial de versiones y novedades de CGPlayer
        </p>
      </div>

      {/* Información del desarrollador */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Información del Desarrollador
            </h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Desarrollado por:</strong> CareZapato</p>
              <p><strong>Versión actual:</strong> {changelogData[0].version}</p>
              <p><strong>Última actualización:</strong> {new Date(changelogData[0].date).toLocaleDateString('es-ES')}</p>
              <p><strong>Tecnologías:</strong> React, TypeScript, Node.js, PostgreSQL, Prisma</p>
            </div>
          </div>
          <div className="text-6xl">
            👨‍💻
          </div>
        </div>
      </div>

      {/* Versiones */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Historial de Versiones
        </h2>
        
        {changelogData.map((entry, index) => {
          const isExpanded = expandedVersions.includes(entry.version);
          const isLatest = index === 0;
          
          return (
            <div 
              key={entry.version}
              className={`relative bg-white rounded-xl border-2 transition-all duration-300 ${
                isLatest 
                  ? 'border-blue-300 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Indicador de versión más reciente */}
              {isLatest && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  ¡Nuevo!
                </div>
              )}
              
              {/* Header de la versión */}
              <div 
                className={`p-6 cursor-pointer transition-colors ${
                  isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleVersion(entry.version)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getVersionBadgeColor(entry.type)}`}>
                        v{entry.version}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {entry.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {entry.highlights && (
                      <div className="hidden md:flex space-x-2">
                        {entry.highlights.slice(0, 2).map((highlight, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {isExpanded ? (
                      <ChevronUpIcon className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Highlights móvil */}
                {entry.highlights && (
                  <div className="md:hidden mt-3 flex flex-wrap gap-2">
                    {entry.highlights.map((highlight, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Contenido expandido */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-6 space-y-6">
                  {entry.changes.map((changeGroup, idx) => (
                    <div key={idx}>
                      <h4 className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-4 border ${getCategoryColor(changeGroup.category)}`}>
                        <span className="mr-2">{getCategoryIcon(changeGroup.category)}</span>
                        {changeGroup.category.charAt(0).toUpperCase() + changeGroup.category.slice(1)}
                      </h4>
                      
                      <ul className="space-y-2 ml-4">
                        {changeGroup.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start">
                            <span className="text-blue-500 mr-3 mt-1">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          CGPlayer - Sistema de Gestión de Coros
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Desarrollado con ❤️ para la comunidad musical
        </p>
      </div>
    </div>
  );
};

export default ChangelogPage;
