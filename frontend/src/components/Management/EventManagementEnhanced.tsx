import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import './EventManagementEnhanced.css';

interface Location {
  id: string;
  name: string;
  type: string;
  city: string;
  region: string;
  users: User[];
  _count: {
    users: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  locationId: string;
  location?: { name: string };
  assignedRoles: Array<{ role: string }>;
  voiceProfiles?: Array<{ voiceType: string }>;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  locationId?: string;
  eventCity?: string;
  eventAddress?: string;
  country: string;
  mapLink?: string;
  imageUrl?: string;
  isPublic: boolean;
  allowExternalJoin: boolean;
  location?: Location;
  creator: {
    firstName: string;
    lastName: string;
  };
  attendees: Array<{
    id: string;
    userId: string;
    status: string;
    user: User;
    addedByUser?: { firstName: string; lastName: string };
  }>;
  joinRequests?: Array<{
    id: string;
    userId: string;
    message?: string;
    status: string;
    user: User;
  }>;
  _count: {
    attendees: number;
    joinRequests?: number;
  };
}

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  locationId: string;
  eventCity: string;
  eventAddress: string;
  country: string;
  mapLink: string;
  isPublic: boolean;
  allowExternalJoin: boolean;
  attendeeUserIds: string[];
  choirLocationIds: string[];
}

const EventManagementEnhanced: React.FC = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [attendeeTab, setAttendeeTab] = useState('current');
  
  // Formulario de evento
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    locationId: '',
    eventCity: '',
    eventAddress: '',
    country: 'Chile',
    mapLink: '',
    isPublic: false,
    allowExternalJoin: false,
    attendeeUserIds: [],
    choirLocationIds: []
  });

  // Gestión de asistentes
  const [selectedSingers, setSelectedSingers] = useState<string[]>([]);
  const [selectedChoirs, setSelectedChoirs] = useState<string[]>([]);
  const [singerSearchTerm, setSingerSearchTerm] = useState('');

  // Consultas de datos
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'management'],
    queryFn: async () => {
      const response = await fetch('/api/events/management/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      return result.data;
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      return result.data;
    }
  });

  const { data: singersData } = useQuery({
    queryKey: ['singers', 'locations'],
    queryFn: async () => {
      const response = await fetch('/api/events/locations/singers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      return result.data;
    }
  });

  const { data: searchResults } = useQuery({
    queryKey: ['singers', 'search', singerSearchTerm],
    queryFn: async () => {
      if (!singerSearchTerm.trim()) return [];
      const response = await fetch(`/api/events/search/singers?query=${encodeURIComponent(singerSearchTerm)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      return result.data;
    },
    enabled: singerSearchTerm.length > 2
  });

  // Mutaciones
  const createEventMutation = useMutation({
    mutationFn: async (eventData: FormData) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: eventData
      });
      if (!response.ok) throw new Error('Error al crear evento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsCreateModalOpen(false);
      resetForm();
    }
  });

  const addAttendeesMutation = useMutation({
    mutationFn: async ({ eventId, userIds, choirLocationIds }: { 
      eventId: string; 
      userIds: string[]; 
      choirLocationIds: string[] 
    }) => {
      const response = await fetch(`/api/events/${eventId}/attendees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userIds, choirLocationIds })
      });
      if (!response.ok) throw new Error('Error al agregar asistentes');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelectedSingers([]);
      setSelectedChoirs([]);
      setIsAttendeeModalOpen(false);
    }
  });

  const removeAttendeeMutation = useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const response = await fetch(`/api/events/${eventId}/attendees/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al remover asistente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  // Funciones auxiliares
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      locationId: '',
      eventCity: '',
      eventAddress: '',
      country: 'Chile',
      mapLink: '',
      isPublic: false,
      allowExternalJoin: false,
      attendeeUserIds: [],
      choirLocationIds: []
    });
    setSelectedSingers([]);
    setSelectedChoirs([]);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'attendeeUserIds' || key === 'choirLocationIds') {
        formDataToSend.append(key, JSON.stringify(Array.isArray(value) ? value : []));
      } else {
        formDataToSend.append(key, String(value));
      }
    });
    
    // Agregar cantantes seleccionados
    formDataToSend.set('attendeeUserIds', JSON.stringify(selectedSingers));
    formDataToSend.set('choirLocationIds', JSON.stringify(selectedChoirs));

    createEventMutation.mutate(formDataToSend);
  };

  const handleAddAttendees = () => {
    if (!selectedEvent) return;
    
    addAttendeesMutation.mutate({
      eventId: selectedEvent.id,
      userIds: selectedSingers,
      choirLocationIds: selectedChoirs
    });
  };

  const handleRemoveAttendee = (userId: string) => {
    if (!selectedEvent) return;
    
    removeAttendeeMutation.mutate({
      eventId: selectedEvent.id,
      userId
    });
  };

  // Filtros
  const filteredEvents = events?.filter((event: Event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !filterLocation || event.locationId === filterLocation;
    const matchesUpcoming = !showUpcoming || new Date(event.date) >= new Date();
    
    return matchesSearch && matchesLocation && matchesUpcoming;
  }) || [];

  return (
    <div className="event-management">
      {/* Header */}
      <div className="management-header">
        <div className="header-content">
          <h1>Gestión de Eventos Mejorada</h1>
          <p>Gestiona eventos con control de privacidad y selección masiva de cantantes</p>
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          ➕ Crear Evento
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="search-input">
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={filterLocation} 
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option value="">Todas las ubicaciones</option>
            {locations?.map((location: Location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showUpcoming}
              onChange={(e) => setShowUpcoming(e.target.checked)}
            />
            Solo próximos eventos
          </label>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="events-grid">
        {eventsLoading ? (
          <div className="loading">Cargando eventos...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="no-events">No se encontraron eventos</div>
        ) : (
          filteredEvents.map((event: Event) => (
            <EventCard
              key={event.id}
              event={event}
              onManageAttendees={(event) => {
                setSelectedEvent(event);
                setIsAttendeeModalOpen(true);
              }}
              onRemoveAttendee={handleRemoveAttendee}
            />
          ))
        )}
      </div>

      {/* Modal de Crear Evento */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nuevo Evento</h2>
              <button 
                className="modal-close"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="tabs">
                <div className="tab-buttons">
                  <button 
                    className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('basic')}
                  >
                    Información Básica
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'attendees' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attendees')}
                  >
                    Asistentes
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                  >
                    Configuración
                  </button>
                </div>
                
                <form onSubmit={handleCreateEvent}>
                  {activeTab === 'basic' && (
                    <div className="tab-content">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Título *</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setFormData(prev => ({ ...prev, title: e.target.value }))
                            }
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Fecha *</label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setFormData(prev => ({ ...prev, date: e.target.value }))
                            }
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Hora</label>
                          <input
                            type="time"
                            value={formData.time}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setFormData(prev => ({ ...prev, time: e.target.value }))
                            }
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Ubicación</label>
                          <select 
                            value={formData.locationId} 
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                              setFormData(prev => ({ ...prev, locationId: e.target.value }))
                            }
                          >
                            <option value="">Seleccionar ubicación</option>
                            {locations?.map((location: Location) => (
                              <option key={location.id} value={location.id}>
                                {location.name} - {location.city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                          value={formData.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                            setFormData(prev => ({ ...prev, description: e.target.value }))
                          }
                          rows={3}
                        />
                      </div>
                      
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Ciudad del Evento</label>
                          <input
                            type="text"
                            value={formData.eventCity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setFormData(prev => ({ ...prev, eventCity: e.target.value }))
                            }
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Dirección</label>
                          <input
                            type="text"
                            value={formData.eventAddress}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setFormData(prev => ({ ...prev, eventAddress: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Enlace de Google Maps</label>
                        <input
                          type="url"
                          value={formData.mapLink}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setFormData(prev => ({ ...prev, mapLink: e.target.value }))
                          }
                          placeholder="https://maps.google.com/..."
                        />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'attendees' && (
                    <div className="tab-content">
                      <AttendeeSelector
                        singersData={singersData}
                        searchResults={searchResults}
                        selectedSingers={selectedSingers}
                        selectedChoirs={selectedChoirs}
                        singerSearchTerm={singerSearchTerm}
                        onSingersChange={setSelectedSingers}
                        onChoirsChange={setSelectedChoirs}
                        onSearchChange={setSingerSearchTerm}
                      />
                    </div>
                  )}
                  
                  {activeTab === 'settings' && (
                    <div className="tab-content">
                      <div className="settings-section">
                        <div className="setting-item">
                          <div className="setting-info">
                            <label>Evento Público</label>
                            <p>Los eventos públicos son visibles para todos los usuarios</p>
                          </div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={formData.isPublic}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                setFormData(prev => ({ ...prev, isPublic: e.target.checked }))
                              }
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                        
                        <div className="setting-item">
                          <div className="setting-info">
                            <label>Permitir Solicitudes Externas</label>
                            <p>Los cantantes pueden solicitar unirse al evento</p>
                          </div>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={formData.allowExternalJoin}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                setFormData(prev => ({ ...prev, allowExternalJoin: e.target.checked }))
                              }
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={createEventMutation.isPending}
                    >
                      {createEventMutation.isPending ? 'Creando...' : 'Crear Evento'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Asistentes */}
      {isAttendeeModalOpen && selectedEvent && (
        <div className="modal-overlay" onClick={() => setIsAttendeeModalOpen(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gestionar Asistentes - {selectedEvent.title}</h2>
              <button 
                className="modal-close"
                onClick={() => setIsAttendeeModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="tabs">
                <div className="tab-buttons">
                  <button 
                    className={`tab-button ${attendeeTab === 'current' ? 'active' : ''}`}
                    onClick={() => setAttendeeTab('current')}
                  >
                    Asistentes Actuales ({selectedEvent._count.attendees || 0})
                  </button>
                  <button 
                    className={`tab-button ${attendeeTab === 'add' ? 'active' : ''}`}
                    onClick={() => setAttendeeTab('add')}
                  >
                    Agregar Asistentes
                  </button>
                </div>
                
                {attendeeTab === 'current' && (
                  <div className="tab-content">
                    <div className="attendees-list">
                      {selectedEvent.attendees?.map((attendee) => (
                        <div key={attendee.id} className="attendee-item">
                          <div className="attendee-info">
                            <h4>{attendee.user.firstName} {attendee.user.lastName}</h4>
                            <p>
                              {attendee.user.location?.name} • 
                              {attendee.user.assignedRoles?.map(r => r.role).join(', ')}
                            </p>
                          </div>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveAttendee(attendee.userId)}
                          >
                            👤 Remover
                          </button>
                        </div>
                      ))}
                      
                      {(!selectedEvent.attendees || selectedEvent.attendees.length === 0) && (
                        <p className="no-attendees">No hay asistentes registrados</p>
                      )}
                    </div>
                  </div>
                )}
                
                {attendeeTab === 'add' && (
                  <div className="tab-content">
                    <AttendeeSelector
                      singersData={singersData}
                      searchResults={searchResults}
                      selectedSingers={selectedSingers}
                      selectedChoirs={selectedChoirs}
                      singerSearchTerm={singerSearchTerm}
                      onSingersChange={setSelectedSingers}
                      onChoirsChange={setSelectedChoirs}
                      onSearchChange={setSingerSearchTerm}
                    />
                    
                    <div className="modal-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={handleAddAttendees}
                        disabled={selectedSingers.length === 0 && selectedChoirs.length === 0}
                      >
                        Agregar Seleccionados
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para tarjeta de evento
const EventCard: React.FC<{
  event: Event;
  onManageAttendees: (event: Event) => void;
  onRemoveAttendee: (userId: string) => void;
}> = ({ event, onManageAttendees }) => {
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate >= new Date();
  
  return (
    <div className="event-card">
      <div className="event-card-header">
        <div className="event-title-section">
          <h3>{event.title}</h3>
          <div className="event-badges">
            {event.isPublic ? (
              <span className="badge badge-public">🌍 Público</span>
            ) : (
              <span className="badge badge-private">🔒 Privado</span>
            )}
            {event.allowExternalJoin && (
              <span className="badge badge-join">Solicitudes Abiertas</span>
            )}
            {!isUpcoming && (
              <span className="badge badge-finished">Finalizado</span>
            )}
          </div>
        </div>
        
        <div className="event-actions">
          <button className="btn btn-outline btn-sm">👁️</button>
          <button className="btn btn-outline btn-sm">✏️</button>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => onManageAttendees(event)}
          >
            👥
          </button>
        </div>
      </div>
      
      {event.description && (
        <p className="event-description">{event.description}</p>
      )}
      
      <div className="event-details">
        <div className="event-detail">
          <span className="icon">📅</span>
          <span>{eventDate.toLocaleDateString()}</span>
        </div>
        
        {event.time && (
          <div className="event-detail">
            <span className="icon">🕐</span>
            <span>{event.time}</span>
          </div>
        )}
        
        <div className="event-detail">
          <span className="icon">📍</span>
          <span>{event.location?.name || event.eventCity || 'Sin ubicación'}</span>
        </div>
        
        <div className="event-detail">
          <span className="icon">👥</span>
          <span>{event._count.attendees} asistentes</span>
        </div>
      </div>
      
      {event.joinRequests && event.joinRequests.length > 0 && (
        <div className="event-alert">
          {event.joinRequests.length} solicitud(es) de unión pendiente(s)
        </div>
      )}
    </div>
  );
};

// Componente para seleccionar asistentes
const AttendeeSelector: React.FC<{
  singersData: Location[];
  searchResults: User[];
  selectedSingers: string[];
  selectedChoirs: string[];
  singerSearchTerm: string;
  onSingersChange: (singers: string[]) => void;
  onChoirsChange: (choirs: string[]) => void;
  onSearchChange: (term: string) => void;
}> = ({
  singersData,
  searchResults,
  selectedSingers,
  selectedChoirs,
  singerSearchTerm,
  onSingersChange,
  onChoirsChange,
  onSearchChange
}) => {
  const [selectorTab, setSelectorTab] = useState('individual');

  return (
    <div className="attendee-selector">
      <div className="selector-tabs">
        <button 
          className={`tab-button ${selectorTab === 'individual' ? 'active' : ''}`}
          onClick={() => setSelectorTab('individual')}
        >
          Cantantes Individuales
        </button>
        <button 
          className={`tab-button ${selectorTab === 'choir' ? 'active' : ''}`}
          onClick={() => setSelectorTab('choir')}
        >
          Coros Completos
        </button>
      </div>
      
      {selectorTab === 'individual' && (
        <div className="selector-content">
          <div className="form-group">
            <label>Buscar Cantantes</label>
            <input
              type="text"
              placeholder="Nombre, apellido o email..."
              value={singerSearchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            />
          </div>
          
          {singerSearchTerm.length > 2 && (
            <div className="singers-list">
              {searchResults?.map((singer) => (
                <div key={singer.id} className="singer-item">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedSingers.includes(singer.id)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.checked) {
                          onSingersChange([...selectedSingers, singer.id]);
                        } else {
                          onSingersChange(selectedSingers.filter(id => id !== singer.id));
                        }
                      }}
                    />
                    <div className="singer-info">
                      <h4>{singer.firstName} {singer.lastName}</h4>
                      <p>{singer.location?.name} • {singer.assignedRoles?.map(r => r.role).join(', ')}</p>
                    </div>
                  </label>
                </div>
              ))}
              
              {searchResults?.length === 0 && (
                <p className="no-results">No se encontraron cantantes</p>
              )}
            </div>
          )}
          
          {selectedSingers.length > 0 && (
            <div className="selection-summary">
              <p>Cantantes Seleccionados: {selectedSingers.length}</p>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => onSingersChange([])}
              >
                Limpiar Selección
              </button>
            </div>
          )}
        </div>
      )}
      
      {selectorTab === 'choir' && (
        <div className="selector-content">
          <label>Seleccionar Coros Completos por Ubicación</label>
          
          <div className="choirs-list">
            {singersData?.map((location) => (
              <div key={location.id} className="choir-item">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedChoirs.includes(location.id)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.checked) {
                        onChoirsChange([...selectedChoirs, location.id]);
                      } else {
                        onChoirsChange(selectedChoirs.filter(id => id !== location.id));
                      }
                    }}
                  />
                  <div className="choir-info">
                    <div className="choir-header">
                      <h4>{location.name}</h4>
                      <span className="choir-count">{location._count.users} cantantes</span>
                    </div>
                    <p className="choir-location">{location.city}, {location.region}</p>
                    <p className="choir-members">
                      {location.users.slice(0, 3).map(user => 
                        `${user.firstName} ${user.lastName}`
                      ).join(', ')}
                      {location.users.length > 3 && ` y ${location.users.length - 3} más...`}
                    </p>
                  </div>
                </label>
              </div>
            ))}
          </div>
          
          {selectedChoirs.length > 0 && (
            <div className="selection-summary">
              <p>Coros Seleccionados: {selectedChoirs.length}</p>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => onChoirsChange([])}
              >
                Limpiar Selección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventManagementEnhanced;
