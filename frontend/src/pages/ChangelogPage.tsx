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
    version: '0.10.9',
    date: '2024-12-22',
    type: 'major',
    title: 'Sistema de Distribución de Voces Mejorado - Voice Distribution Mastery',
    highlights: [
      'Sistema completo de voces primarias con distribución específica',
      '100% usuarios con voz primaria + 30% con voz secundaria',
      'Campo isPrimary para identificación de voz principal',
      'Endpoints actualizados con información de voz primaria',
      'Corrección completa de visualización de voces en homepage'
    ],
    changes: [
      {
        category: 'added',
        items: [
          'Sistema de distribución: 100% usuarios con SOPRANO/CONTRALTO/TENOR + 30% con BAJO/BARITONO/MESOSOPRANO',
          'Campo isPrimary en UserVoiceProfile para identificar voz principal',
          'Endpoint de estadísticas de voces para monitoreo de distribución',
          'Ordenamiento automático que prioriza voz primaria en consultas',
          'Dashboard con estadísticas de voces por sede',
          'Gestión completa de perfiles de voz primarias y secundarias',
          'Validación automática de cumplimiento de distribución de voces'
        ]
      },
      {
        category: 'improved',
        items: [
          'Endpoints de login y /me incluyen información isPrimary con ordenamiento',
          'Gestión de usuarios con soporte completo para sistema de voces',
          'Inicialización de base de datos con estrategia db push robusta',
          'Middleware de autenticación con mejor manejo de errores',
          'Type safety con soluciones de type casting para Prisma',
          'Sistema de migración que maneja estados de base de datos correctamente'
        ]
      },
      {
        category: 'fixed',
        items: [
          'Eliminados archivos duplicados admin_new.ts vs admin.ts',
          'Corrección completa de visualización de voz primaria en homepage',
          'Resolución de errores TypeScript relacionados con campo isPrimary',
          'Bugs de inicialización en migración de base de datos',
          'Errores de middleware cuando base de datos no está disponible',
          'Problemas de compilación por archivos admin duplicados'
        ]
      }
    ]
  },
  {
    version: '0.9.0',
    date: '2025-09-05',
    type: 'major',
    title: 'Sistema de Edición Avanzada de Eventos - Event Management Mastery',
    highlights: [
      'Editor de eventos completo con carga automática de datos',
      'Sincronización inteligente de variaciones musicales',
      'Panel de variaciones avanzado en modo edición',
      'Sistema robusto de debugging y logs',
      'Gestión de estado refinada para máxima estabilidad'
    ],
    changes: [
      {
        category: 'added',
        items: [
          'Sistema completo de edición de eventos existentes con preservación de relaciones',
          'Carga automática de datos: eventos se cargan con asistentes y música completa',
          'Función especializada updateVariationsInfoForEditMode() para modo edición',
          'Panel de variaciones inteligente que muestra variaciones en tiempo real',
          'Sistema de logs comprehensivo para debugging y monitoreo',
          'Carga de canciones padre automática para mostrar variaciones',
          'useEffect especializado para manejar carga de datos en edición',
          'API optimizada: GET /events/:id incluye eventSongs completos'
        ]
      },
      {
        category: 'improved',
        items: [
          'Componente CreateEventModal unificado para creación y edición',
          'Gestión de estado centralizada con hooks especializados',
          'Detección automática de variaciones musicales en modo edición',
          'Condiciones inteligentes para usar funciones de edición vs. creación',
          'Sincronización perfecta entre selectedSongs, variationsInfo y datos del evento',
          'Performance mejorado con render optimizado y menos re-renders',
          'TypeScript más estricto para mejor developer experience',
          'Sistema de fallbacks robusto para manejo de errores'
        ]
      },
      {
        category: 'fixed',
        items: [
          'Corregido problema donde eventos no mostraban canciones al editarlos',
          'Solucionado issue donde variaciones no aparecían en panel derecho',
          'Arreglado problema de carga parcial de eventos desde lista de gestión',
          'Eliminados estados contradictorios entre partes del modal',
          'Corregido manejo de datos undefined o null que causaban crashes',
          'Solucionados problemas de validación de tipos y estructuras',
          'Arreglados error boundaries para prevenir propagación de fallos',
          'Corregida sincronización entre modo edición y funciones de variaciones'
        ]
      }
    ]
  },
  {
    version: '0.8.0',
    date: '2025-09-03',
    type: 'major',
    title: 'Sistema de Letras Sincronizadas Avanzado - Nueva Funcionalidad Principal',
    highlights: [
      'Visualizador de letras inteligente con sincronización automática',
      'Sistema dual de colores para participación del coro',
      'Interface minimalista sin distracciones',
      'Efectos visuales elegantes con zoom sutil',
      'Compatibilidad total desktop y móvil'
    ],
    changes: [
      {
        category: 'added',
        items: [
          'Sistema completo de letras sincronizadas con auto-seguimiento en tiempo real',
          'Visualizador inteligente con colores diferenciados (púrpura para coro, gris para referencia)',
          'Interface minimalista: solo texto elegante, sin cuadros o decoraciones',
          'Effectos visuales sutiles: zoom 10% y efecto 3D discreto durante resaltado',
          'Campo isHighlighted en backend para marcado de líneas importantes',
          'API de sincronización extendida con soporte para isHighlighted',
          'Scroll automático con seguimiento suave de línea activa',
          'Sistema de duración inteligente: mínimo 2-5 segundos por línea'
        ]
      },
      {
        category: 'improved',
        items: [
          'Lógica de sincronización refinada con cálculo de duración entre segmentos',
          'Tipografía responsive con tamaños adaptativos (sm/md/lg/xl)',
          'Negrita condicional: solo cuando línea está activa',
          'Performance optimizado con useEffect mejorado y dependencias correctas',
          'Centramiento perfecto del texto con flexbox',
          'Transiciones suaves de 300ms para cambios visuales fluidos'
        ]
      },
      {
        category: 'fixed',
        items: [
          'CRÍTICO: Identificación correcta del componente LyricsViewerInline en DevTools',
          'Duración de resaltado corregida de 1 segundo a duración apropiada',
          'Preservación de colores base durante resaltado temporal',
          'Eliminación de cuadros morados que quitaban elegancia',
          'Remoción de elementos distractivos (badges, tiempos, puntos indicadores)',
          'Aplicación de cambios en archivo correcto (StickyPlayer.tsx)',
          'Visibilidad de todas las letras (highlighted y normales)'
        ]
      },
      {
        category: 'removed',
        items: [
          'Backgrounds y bordes de contenedores de letras',
          'Badges "Participa" y información de tiempo',
          'Puntos indicadores durante resaltado',
          'Efectos 3D excesivos y sombras intrusivas',
          'Elementos visuales que distraían durante presentaciones en vivo'
        ]
      }
    ]
  },
  {
    version: '0.7.0',
    date: '2025-09-01',
    type: 'major',
    title: 'Sistema de Playlists Completo - Nueva Funcionalidad Principal',
    highlights: [
      'Sistema completo de gestión de playlists',
      'Reproductor con auto-play funcional',
      'Interfaz moderna y responsive',
      'Subida de imágenes para playlists',
      'Sincronización en tiempo real'
    ],
    changes: [
      {
        category: 'added',
        items: [
          'Sistema completo de playlists: crear, editar, eliminar con metadatos',
          'Subida de imágenes personalizadas para playlists (.png, .jpg, .jpeg)',
          'Editor avanzado con búsqueda en tiempo real y gestión individual',
          'Sistema de permisos: playlists públicas y privadas por usuario',
          'API completa con CRUD y validaciones robustas',
          'Integración total con sistema de cola de reproducción existente',
          'Dashboard optimizado con estadísticas de playlists',
          'Middleware para servido seguro de imágenes'
        ]
      },
      {
        category: 'fixed',
        items: [
          'CRÍTICO: Playlist auto-play ahora reproduce inmediatamente la primera canción',
          'Corrección de autenticación usando getSongFileUrl() para URLs seguras',
          'Resolución de errores 404 en carga de imágenes de playlists',
          'Configuración correcta de express.static para servido de archivos',
          'Sincronización perfecta con el sistema de colas de reproducción',
          'Compatibilidad HTML5 audio con tokens JWT apropiados'
        ]
      },
      {
        category: 'improved',
        items: [
          'Interfaz con diseño cuadrado y grid responsivo optimizado',
          'Navegación fluida con transiciones automáticas entre canciones',
          'UI compacta con mejor aprovechamiento del espacio',
          'Performance mejorado con consultas optimizadas',
          'Debugging avanzado con logs detallados para troubleshooting',
          'Gestión robusta de archivos con limpieza automática',
          'Experiencia de usuario sin interrupciones desde creación hasta reproducción'
        ]
      }
    ]
  },
  {
    version: '0.6.0',
    date: '2025-08-19',
    type: 'major',
    title: 'Reproductor de Audio con Autenticación - Solución Completa',
    highlights: [
      'Reproductor de audio 100% funcional',
      'Autenticación via tokens en URLs',
      'Solución para HTML5 audio elements',
      'Streaming de audio autenticado',
      'Compatibilidad total con JWT'
    ],
    changes: [
      {
        category: 'fixed',
        items: [
          'SOLUCIÓN COMPLETA: Reproductor de audio ahora reproduce correctamente',
          'Autenticación de archivos de audio via query parameters',
          'HTML5 audio elements compatibles con JWT tokens',
          'Error 401 eliminado en streaming de canciones',
          'Función getSongFileUrl() centralizada para URLs autenticadas'
        ]
      },
      {
        category: 'added',
        items: [
          'Sistema dual de autenticación: headers + query parameters',
          'Middleware auth.ts actualizado para rutas /file/',
          'Soporte completo para streaming de audio autenticado',
          'Validación automática de tokens en URLs de audio',
          'Compatibilidad nativa con HTML5 audio elements'
        ]
      },
      {
        category: 'improved',
        items: [
          'Todos los componentes usan getSongFileUrl() centralizada',
          'URLs de audio construidas automáticamente con tokens',
          'Experiencia de usuario sin interrupciones',
          'Rendimiento optimizado en streaming de audio',
          'Código frontend consistente en manejo de URLs'
        ]
      }
    ]
  },
  {
    version: '0.5.0',
    date: '2025-08-18',
    type: 'major',
    title: 'Arquitectura y Refactorización Major - Localización Chilena',
    highlights: [
      'Sistema de roles jerárquico completo',
      'Localización total a Chile con 6 sedes',
      'Dashboard analytics avanzado e interactivo',
      'Limpieza masiva de código',
      'UI moderna reorganizada'
    ],
    changes: [
      {
        category: 'added',
        items: [
          'Sistema de roles jerárquico: ADMIN, DIRECTOR, CANTANTE con permisos específicos',
          'Filtrado inteligente por sede: directores solo ven su sede asignada',
          'Dashboard específico por rol con vistas personalizadas',
          'Middleware de autorización con protección de rutas por rol y ubicación',
          'JWT con información extendida: incluye rol y locationId para directores',
          'Sistema dual para directores: pueden ser cantantes simultáneamente',
          'Dashboard analytics avanzado con métricas en tiempo real',
          'Gráfico de torta expandido con porcentajes al hacer hover',
          'Cuadros estadísticos coloridos con paleta profesional e iconos',
          'Icono de persona moderno para usuarios activos',
          'Terminología "Sedes" en lugar de "Ubicaciones" para contexto chileno',
          '6 Sedes chilenas principales: Santiago, Valparaíso, Viña del Mar, Valdivia, Antofagasta, Concepción',
          'Distribución específica de 288 cantantes por sedes chilenas',
          'Total de 345 usuarios: 1 admin + 6 directores + 288 cantantes + 50 inactivos',
          'Base de datos con nombres y apellidos chilenos auténticos',
          'Direcciones reales de ciudades chilenas',
          'Teléfonos formato chileno: +56 9 XXXX XXXX para todos los usuarios',
          'Script reset-chilean-db.ts para poblar la base de datos',
          'Sistema de validación de archivos robusto',
          'Limpieza automática de archivos temporales en caso de error'
        ]
      },
      {
        category: 'improved',
        items: [
          'Navegación desktop reorganizada: logo/título izquierda, menú centro, perfil derecha',
          'Icono de changelog mejorado: DocumentText en lugar de QuestionMarkCircle',
          'Paleta de colores aplicada a cuadros estadísticos',
          'Diseño más vibrante eliminando aspecto pálido anterior',
          'API optimizada con consultas paralelas para mejor rendimiento',
          'UI responsive adaptativa para diferentes tipos de datos',
          'Rutas consolidadas: authNew.ts, songsImproved.ts, uploadImproved.ts',
          'Middleware de autenticación optimizado y consolidado',
          'Conexión robusta de base de datos con verificación automática',
          'Prisma optimizado con queries paralelas',
          'Queries de base de datos más eficientes',
          'Manejo robusto de errores en toda la aplicación',
          'Prevención de pérdidas de memoria',
          'Mejor experiencia de desarrollo con hot reload'
        ]
      },
      {
        category: 'fixed',
        items: [
          'Error TypeScript resuelto: eliminadas referencias a módulo inexistente "./scripts/auto-init"',
          'Imports corregidos: añadido import correcto de prisma en index.ts',
          'Limpieza de referencias a archivos eliminados',
          'Compilación limpia: servidor inicia sin errores TypeScript',
          'Validación de sesiones con filtrado correcto por rol y ubicación',
          'Protección de rutas con middleware actualizado para nuevos roles',
          'Sanitización mejorada de datos de entrada',
          'Corrección de todos los errores de tipos TypeScript strict',
          'Arreglo de problemas de módulos ES6 exports/imports',
          'Corrección de paths y resolución de módulos'
        ]
      },
      {
        category: 'removed',
        items: [
          'Scripts de test eliminados: todos los archivos test-*.html y test-*.ts',
          'Versiones antiguas removidas: archivos *_old.ts, *Fixed.ts no utilizados',
          'Seeders duplicados: limpieza de basicSeed, enhancedSeed, newSystemSeed, simpleSeed',
          'Archivos de migración obsoletos: migrate-system.bat/sh eliminados',
          'Backups obsoletos: removido database_backup.sql y scripts de diagnóstico',
          'Carpetas dist de compilación no versionadas',
          'Dependencias no utilizadas actualizadas y limpiadas'
        ]
      }
    ]
  },
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
  const [expandedVersions, setExpandedVersions] = useState<string[]>(['0.10.9']);

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
              <p><strong>Nuevo en v0.10.9:</strong> Sistema completo de distribución de voces con voces primarias, corrección de duplicados admin, y mejoras robustas en autenticación y base de datos</p>
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
