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
  MapPin,
  Eye,
  EyeOff,
  Globe,
  UserPlus,
  Trash2,
  Plus
} from 'lucide-react';
import { getApiUrl } from '../config/api';

// Lista de ciudades de Chile
const CHILE_CITIES = [
  'Arica', 'Iquique', 'Antofagasta', 'Calama', 'Copiapó', 'La Serena', 'Coquimbo', 
  'Valparaíso', 'Viña del Mar', 'Santiago', 'Rancagua', 'Talca', 'Concepción', 
  'Talcahuano', 'Chillán', 'Los Ángeles', 'Temuco', 'Valdivia', 'Osorno', 
  'Puerto Montt', 'Castro', 'Coyhaique', 'Puerto Natales', 'Punta Arenas',
  'Puente Alto', 'Maipú', 'La Florida', 'Las Condes', 'Providencia', 'Ñuñoa',
  'San Bernardo', 'Peñalolén', 'La Pintana', 'El Bosque', 'Quilicura',
  'Villa Alemana', 'Quilpué', 'San Antonio', 'Quillota', 'Los Andes',
  'Melipilla', 'Talagante', 'Buin', 'Paine', 'Curacaví',
  'Linares', 'Cauquenes', 'Parral', 'San Javier', 'Constitución',
  'Chiguayante', 'San Pedro de la Paz', 'Hualpén', 'Coronel', 'Lota',
  'Angol', 'Villarrica', 'Pucón', 'Lautaro', 'Nueva Imperial',
  'La Unión', 'Río Bueno', 'Panguipulli', 'Los Lagos', 'Máfil',
  'Puerto Varas', 'Frutillar', 'Llanquihue', 'Ancud', 'Quellón'
];

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

interface SelectedAttendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  location: string;
  addedBy: 'individual' | 'group';
  groupName?: string;
}

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: (event: any) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onEventCreated }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'attendees' | 'music'>('basic');
  
  // Basic info state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('Culto');
  const [eventCity, setEventCity] = useState('');
  const [eventAddress, setEventAddress] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [allowExternalJoin, setAllowExternalJoin] = useState(false);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attendees state
  const [singers, setSingers] = useState<Singer[]>([]);
  const [singerLocations, setSingerLocations] = useState<SingerLocation[]>([]);
  const [singerSearchTerm, setSingerSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loadingSingers, setLoadingSingers] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<SelectedAttendee[]>([]);

  // Filter cities for dropdown
  const filteredCities = CHILE_CITIES.filter(city =>
    city.toLowerCase().includes(citySearchTerm.toLowerCase())
  ).slice(0, 10);

  // Load singers and locations with authentication
  const loadSingerLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/events/locations/singers'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setSingerLocations(result.data || []);
      }
    } catch (error) {
      console.error('Error loading singer locations:', error);
    }
  };

  const searchSingers = async () => {
    setLoadingSingers(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (singerSearchTerm) params.append('search', singerSearchTerm);
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (selectedRole) params.append('role', selectedRole);

      const response = await fetch(getApiUrl(`/events/search/singers?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setSingers(result.data || []);
      }
    } catch (error) {
      console.error('Error searching singers:', error);
    }
    setLoadingSingers(false);
  };

  // Add individual singer to attendees list
  const addSingerToAttendees = (singer: Singer) => {
    const isAlreadyAdded = selectedAttendees.some(attendee => attendee.id === singer.id);
    if (isAlreadyAdded) return;

    const newAttendee: SelectedAttendee = {
      id: singer.id,
      firstName: singer.firstName,
      lastName: singer.lastName,
      email: singer.email,
      role: singer.assignedRoles[0]?.role || 'CANTANTE',
      location: `${singer.location.name}, ${singer.location.city}`,
      addedBy: 'individual'
    };

    setSelectedAttendees(prev => [...prev, newAttendee]);
  };

  // Add entire choir/location group to attendees
  const addLocationGroupToAttendees = (locationId: string) => {
    const locationData = singerLocations.find(loc => loc.id === locationId);
    if (!locationData) return;

    const locationSingers = singers.filter(s => s.location.id === locationId);
    const newAttendees: SelectedAttendee[] = [];

    locationSingers.forEach(singer => {
      const isAlreadyAdded = selectedAttendees.some(attendee => attendee.id === singer.id);
      if (!isAlreadyAdded) {
        newAttendees.push({
          id: singer.id,
          firstName: singer.firstName,
          lastName: singer.lastName,
          email: singer.email,
          role: singer.assignedRoles[0]?.role || 'CANTANTE',
          location: `${singer.location.name}, ${singer.location.city}`,
          addedBy: 'group',
          groupName: locationData.name
        });
      }
    });

    setSelectedAttendees(prev => [...prev, ...newAttendees]);
  };

  // Remove attendee from list
  const removeAttendee = (attendeeId: string) => {
    setSelectedAttendees(prev => prev.filter(attendee => attendee.id !== attendeeId));
  };

  // Clear all attendees
  const clearAllAttendees = () => {
    setSelectedAttendees([]);
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
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('category', category);
      formData.append('eventCity', eventCity);
      formData.append('eventAddress', eventAddress);
      formData.append('isPublic', String(isPublic));
      formData.append('allowExternalJoin', String(allowExternalJoin));

      // Add selected attendees
      if (selectedAttendees.length > 0) {
        const attendeeIds = selectedAttendees.map(attendee => attendee.id);
        formData.append('attendeeUserIds', JSON.stringify(attendeeIds));
      }

      const response = await fetch(getApiUrl('/events'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onEventCreated(result.data);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
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

        <div className="p-6 overflow-y-auto max-h-[65vh]">
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

              {/* Ubicación del evento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad del Evento
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={citySearchTerm}
                      onChange={(e) => {
                        setCitySearchTerm(e.target.value);
                        setShowCityDropdown(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowCityDropdown(citySearchTerm.length > 0)}
                      onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Buscar ciudad en Chile..."
                    />
                  </div>
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCities.map((city, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCitySearchTerm(city);
                            setEventCity(city);
                            setShowCityDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={eventAddress}
                    onChange={(e) => setEventAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Dirección específica..."
                  />
                </div>
              </div>

              {/* Configuración de visibilidad */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Configuración de Visibilidad</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isPublic ? (
                        <Eye className="h-5 w-5 text-green-600" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-gray-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">Evento Visible</p>
                        <p className="text-xs text-gray-500">
                          {isPublic ? 'El evento será visible para todos' : 'Solo visible para asistentes invitados'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isPublic ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isPublic ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {isPublic && (
                    <div className="flex items-center justify-between pl-8">
                      <div className="flex items-center space-x-3">
                        <UserPlus className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Permitir Postulaciones</p>
                          <p className="text-xs text-gray-500">Los cantantes pueden solicitar unirse</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAllowExternalJoin(!allowExternalJoin)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          allowExternalJoin ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            allowExternalJoin ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">
                  Gestión de Asistentes
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                    {selectedAttendees.length} seleccionados
                  </span>
                  {selectedAttendees.length > 0 && (
                    <button
                      onClick={clearAllAttendees}
                      className="text-sm text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Limpiar todo
                    </button>
                  )}
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
                    placeholder="Buscar por nombre, email..."
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
                  <option value="CANTANTE">Cantante</option>
                  <option value="DIRECTOR">Director</option>
                </select>
              </div>

              {/* Quick Add by Location/Choir */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h5 className="font-medium text-purple-900 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Agregar Coro Completo
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {singerLocations.map(location => (
                    <button
                      key={location.id}
                      onClick={() => addLocationGroupToAttendees(location.id)}
                      className="text-left p-3 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <div className="font-medium text-purple-900">{location.name}</div>
                      <div className="text-sm text-purple-600">{location.city}</div>
                      <div className="text-xs text-purple-500">{location.singersCount} cantantes</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Singers List */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h5 className="font-medium text-gray-900 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Cantantes y Directores Disponibles
                    {loadingSingers && (
                      <div className="ml-2 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    )}
                  </h5>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {singers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p>No se encontraron cantantes</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {singers.map(singer => {
                        const isSelected = selectedAttendees.some(a => a.id === singer.id);
                        return (
                          <div
                            key={singer.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-green-50 border-l-4 border-green-400' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => addSingerToAttendees(singer)}
                                  disabled={isSelected}
                                  className={`p-2 rounded-lg border-2 transition-colors ${
                                    isSelected
                                      ? 'bg-green-500 border-green-500 text-white cursor-not-allowed'
                                      : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                  }`}
                                  title={isSelected ? 'Ya agregado' : 'Agregar asistente'}
                                >
                                  {isSelected ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </button>
                                
                                <div>
                                  <h6 className="font-medium text-gray-900">
                                    {singer.firstName} {singer.lastName}
                                    {isSelected && (
                                      <span className="ml-2 text-xs text-green-600 font-medium">
                                        ✓ Agregado
                                      </span>
                                    )}
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
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Attendees List */}
              {selectedAttendees.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Lista de Asistentes Confirmados ({selectedAttendees.length})
                  </h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedAttendees.map(attendee => (
                      <div
                        key={attendee.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            attendee.addedBy === 'individual' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {attendee.firstName} {attendee.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {attendee.email} • {attendee.role}
                              {attendee.groupName && (
                                <span className="text-purple-600"> • Grupo: {attendee.groupName}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">{attendee.location}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttendee(attendee.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Remover asistente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Individual: {selectedAttendees.filter(a => a.addedBy === 'individual').length}</span>
                      <span>Por grupo: {selectedAttendees.filter(a => a.addedBy === 'group').length}</span>
                      <span className="font-medium">Total: {selectedAttendees.length}</span>
                    </div>
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
