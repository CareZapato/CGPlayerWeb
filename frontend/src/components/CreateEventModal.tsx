import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  Music,
  CheckCircle,
  AlertCircle,
  Search,
  UserCheck,
  MapPin
} from 'lucide-react';
import { getApiUrl } from '../config/api';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  voice_type: string;
}

interface Singer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assignedRoles: Array<{ role: string }>;
  location: {
    id: string;
    name: string;
    city: string;
  };
  isActive: boolean;
}

interface SingerLocation {
  id: string;
  name: string;
  city: string;
  singersCount: number;
}

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: (event: any) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onEventCreated }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'attendees' | 'music'>('basic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('Culto');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Singer selection state
  const [singers, setSingers] = useState<Singer[]>([]);
  const [singerLocations, setSingerLocations] = useState<SingerLocation[]>([]);
  const [singerSearchTerm, setSingerSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedSingers, setSelectedSingers] = useState<Set<string>>(new Set());
  const [loadingSingers, setLoadingSingers] = useState(false);
  const [showGroupSelection, setShowGroupSelection] = useState(false);

  // Load singers and locations
  const loadSingerLocations = async () => {
    try {
      const response = await fetch(getApiUrl('/api/events/locations/singers'));
      if (response.ok) {
        const data = await response.json();
        setSingerLocations(data);
      }
    } catch (error) {
      console.error('Error loading singer locations:', error);
    }
  };

  const searchSingers = async () => {
    setLoadingSingers(true);
    try {
      const params = new URLSearchParams();
      if (singerSearchTerm) params.append('search', singerSearchTerm);
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (selectedRole) params.append('role', selectedRole);

      const response = await fetch(getApiUrl(`/api/events/search/singers?${params}`));
      if (response.ok) {
        const data = await response.json();
        setSingers(data);
      }
    } catch (error) {
      console.error('Error searching singers:', error);
    }
    setLoadingSingers(false);
  };

  const toggleSingerSelection = (singerId: string) => {
    const newSelected = new Set(selectedSingers);
    if (newSelected.has(singerId)) {
      newSelected.delete(singerId);
    } else {
      newSelected.add(singerId);
    }
    setSelectedSingers(newSelected);
  };

  const selectLocationGroup = (locationId: string) => {
    const locationSingers = singers.filter(s => s.location.id === locationId);
    const newSelected = new Set(selectedSingers);
    locationSingers.forEach(singer => newSelected.add(singer.id));
    setSelectedSingers(newSelected);
  };

  useEffect(() => {
    if (activeTab === 'attendees') {
      loadSingerLocations();
      searchSingers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'attendees') {
      searchSingers();
    }
  }, [singerSearchTerm, selectedLocation, selectedRole]);

  const handleSubmit = async () => {
    if (!title || !date) {
      setError('El título y la fecha son obligatorios');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('category', category);

      const response = await fetch(getApiUrl('/api/events'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newEvent = await response.json();
        onEventCreated(newEvent);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al crear el evento');
      }
    } catch (error) {
      setError('Error de conexión al crear el evento');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Crear Nuevo Evento</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'basic', label: 'Información Básica', icon: Calendar },
              { id: 'attendees', label: 'Asistentes', icon: Users },
              { id: 'music', label: 'Música', icon: Music },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Ej: Culto de Adoración - Domingo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  placeholder="Describe el evento..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="Culto">Culto</option>
                  <option value="Ensayo">Ensayo</option>
                  <option value="Conferencia">Conferencia</option>
                  <option value="Retiro">Retiro</option>
                  <option value="Evangelismo">Evangelismo</option>
                  <option value="Especial">Evento Especial</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'attendees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-medium text-gray-900">
                  Gestión de Cantantes del Evento
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowGroupSelection(!showGroupSelection)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      showGroupSelection 
                        ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {showGroupSelection ? 'Selección Individual' : 'Selección por Ubicación'}
                  </button>
                  <span className="text-sm text-gray-500 px-2 py-1 bg-blue-50 rounded-lg border border-blue-200">
                    {selectedSingers.size} seleccionados
                  </span>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={singerSearchTerm}
                    onChange={(e) => setSingerSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Todas las ubicaciones</option>
                  {singerLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.singersCount})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Todos los roles</option>
                  <option value="soprano">Soprano</option>
                  <option value="contralto">Contralto</option>
                  <option value="tenor">Tenor</option>
                  <option value="bajo">Bajo</option>
                  <option value="director">Director</option>
                </select>
              </div>

              {/* Group Selection Mode */}
              {showGroupSelection && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Selección por Ubicación
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {singerLocations.map(location => (
                      <button
                        key={location.id}
                        onClick={() => selectLocationGroup(location.id)}
                        className="text-left p-3 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        <div className="font-medium text-purple-900">{location.name}</div>
                        <div className="text-sm text-purple-600">{location.city}</div>
                        <div className="text-xs text-purple-500">{location.singersCount} cantantes</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Singers List */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h5 className="font-medium text-gray-900 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Cantantes Disponibles
                    {loadingSingers && (
                      <div className="ml-2 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    )}
                  </h5>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {singers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p>No se encontraron cantantes</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {singers.map(singer => (
                        <div
                          key={singer.id}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            selectedSingers.has(singer.id) ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleSingerSelection(singer.id)}
                                className={`p-1 rounded border-2 transition-colors ${
                                  selectedSingers.has(singer.id)
                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                    : 'border-gray-300 hover:border-indigo-400'
                                }`}
                              >
                                <UserCheck className="h-3 w-3" />
                              </button>
                              
                              <div>
                                <h6 className="font-medium text-gray-900">
                                  {singer.firstName} {singer.lastName}
                                </h6>
                                <p className="text-sm text-gray-500">
                                  {singer.email}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="flex flex-wrap gap-1 justify-end mb-1">
                                {singer.assignedRoles.map((roleObj, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                  >
                                    {roleObj.role}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 flex items-center justify-end">
                                <MapPin className="h-3 w-3 mr-1" />
                                {singer.location.name}, {singer.location.city}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected singers summary */}
              {selectedSingers.size > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Cantantes Seleccionados ({selectedSingers.size})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedSingers).map(singerId => {
                      const singer = singers.find(s => s.id === singerId);
                      return singer ? (
                        <span
                          key={singerId}
                          className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full"
                        >
                          {singer.firstName} {singer.lastName}
                          <button
                            onClick={() => toggleSingerSelection(singerId)}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'music' && (
            <div className="space-y-6">
              <div className="text-center py-8 text-gray-500">
                <Music className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>Gestión de música</p>
                <p className="text-sm">Funcionalidad próximamente</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="flex space-x-3">
            {activeTab !== 'basic' && (
              <button
                onClick={() => {
                  const tabs = ['basic', 'attendees', 'music'];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex - 1] as any);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
            )}
            {activeTab !== 'music' && (
              <button
                onClick={() => {
                  const tabs = ['basic', 'attendees', 'music'];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex + 1] as any);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Siguiente
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title || !date || isLoading}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Crear Evento
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;
