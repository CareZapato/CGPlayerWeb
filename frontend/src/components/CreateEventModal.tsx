import React, { useState, useEffect, useCallback } from 'react';
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
  Plus,
  Trash,
  Check,
  Play,
  Pause
} from 'lucide-react';
import { getApiUrl, getSongFileUrl } from '../config/api';
import type { Song } from '../types';

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



interface Playlist {
  id: string;
  name: string;
  description?: string;
  user: {
    firstName: string;
    lastName: string;
  };
  _count: {
    items: number;
  };
}

interface EventSong {
  song: Song;
  id: string;
  order: number;
}

interface PlaylistItem {
  song: Song;
}

interface EventData {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  category?: string;
  eventCity?: string;
  eventAddress?: string;
  isPublic: boolean;
  allowExternalJoin: boolean;
  attendees?: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      assignedRoles: Array<{ role: string }>;
      location?: { name: string };
    };
    addedBy: 'individual' | 'group';
    groupName?: string;
  }>;
  eventSongs?: EventSong[];
}

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: (event: EventData | { data: EventData }) => void;
  editMode?: boolean;
  eventData?: EventData;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ 
  onClose, 
  onEventCreated, 
  editMode = false, 
  eventData = null 
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'attendees' | 'music'>('basic');
  
  // Basic info state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('Evento');
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
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [locationToAdd, setLocationToAdd] = useState<SingerLocation | null>(null);

  // Music state
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songSearchTerm, setSongSearchTerm] = useState('');
  const [playlistSearchTerm, setPlaylistSearchTerm] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [variationsInfo, setVariationsInfo] = useState<Record<string, {total: number, selected: number, isComplete: boolean}>>({});
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [currentPlayingSongId, setCurrentPlayingSongId] = useState<string | null>(null);

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
      if (singerSearchTerm) params.append('query', singerSearchTerm);
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

  // Load songs for music tab
  const loadSongs = async () => {
    setLoadingSongs(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (songSearchTerm) params.append('query', songSearchTerm);

      const response = await fetch(getApiUrl(`/songs?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Songs response:', result); // Debug log
        // Mostrar solo canciones padre (sin voiceType) para selección
        const allSongs = result.songs || result.data || result || [];
        const parentSongs = allSongs.filter((song: Song) => !song.voiceType && !song.parentSongId);
        console.log('Parent songs filtered:', parentSongs); // Debug log
        setSongs(parentSongs);
        
        // If we're in edit mode, also load parent songs for the event variations
        if (editMode && eventData && eventData.eventSongs) {
          await loadParentSongsForEditMode(parentSongs);
        }
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    }
    setLoadingSongs(false);
  };

  // Load parent songs specifically for edit mode
  const loadParentSongsForEditMode = async (currentParentSongs: Song[]) => {
    if (!editMode || !eventData || !eventData.eventSongs) return;

    try {
      const token = localStorage.getItem('token');
      
      // Get unique parent song IDs from event variations
      const eventSongs = eventData.eventSongs.map((es: EventSong) => es.song);
      const parentSongIds = [...new Set(
        eventSongs
          .filter((song: Song) => song.parentSongId)
          .map((song: Song) => song.parentSongId)
      )];

      console.log('🎵 Loading parent songs for IDs:', parentSongIds);

      // Load each parent song that's not already in the list
      const additionalParentSongs: Song[] = [];
      for (const parentId of parentSongIds) {
        // Check if parent song is already loaded
        const alreadyLoaded = currentParentSongs.some(song => song.id === parentId);
        if (!alreadyLoaded) {
          try {
            const response = await fetch(getApiUrl(`/songs/${parentId as string}`), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const result = await response.json();
              const parentSong = result.data || result;
              if (parentSong && !parentSong.voiceType && !parentSong.parentSongId) {
                additionalParentSongs.push(parentSong);
              }
            }
          } catch (error) {
            console.error(`Error loading parent song ${parentId}:`, error);
          }
        }
      }

      console.log('🎵 Additional parent songs loaded:', additionalParentSongs);

      // Update songs list with additional parent songs
      if (additionalParentSongs.length > 0) {
        setSongs(prev => [...prev, ...additionalParentSongs]);
      }
    } catch (error) {
      console.error('Error loading parent songs for edit mode:', error);
    }
  };

  // Load playlists for music tab
  const loadPlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (playlistSearchTerm) params.append('query', playlistSearchTerm);

      const response = await fetch(getApiUrl(`/playlists?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setPlaylists(result.data || []);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
    setLoadingPlaylists(false);
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

  // Show location confirmation modal
  const showLocationConfirmation = (locationId: string) => {
    const locationData = singerLocations.find(loc => loc.id === locationId);
    if (!locationData) return;
    
    setLocationToAdd(locationData);
    setShowLocationConfirm(true);
  };

  // Add entire choir/location group to attendees
  const addLocationGroupToAttendees = () => {
    if (!locationToAdd) return;

    const locationSingers = singers.filter(s => s.location.id === locationToAdd.id);
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
          groupName: locationToAdd.name
        });
      }
    });

    setSelectedAttendees(prev => [...prev, ...newAttendees]);
    setShowLocationConfirm(false);
    setLocationToAdd(null);
  };

  // Add all singers from all locations
  const addAllSingersToEvent = async () => {
    try {
      // Primero obtener todos los cantantes sin filtros
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/events/search/singers?limit=1000'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const allSingers = result.data || [];
        
        const newAttendees: SelectedAttendee[] = [];
        
        allSingers.forEach((singer: Singer) => {
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
              groupName: 'Todos los Coristas'
            });
          }
        });
        
        setSelectedAttendees(prev => [...prev, ...newAttendees]);
      }
    } catch (error) {
      console.error('Error adding all singers:', error);
    }
  };

  // Remove attendee from list
  const removeAttendee = (attendeeId: string) => {
    setSelectedAttendees(prev => prev.filter(attendee => attendee.id !== attendeeId));
  };

  // Clear all attendees
  const clearAllAttendees = () => {
    setSelectedAttendees([]);
  };

  // Add song to event playlist - for parent songs, add all variations
  const addSongToEvent = async (song: Song) => {
    try {
      const token = localStorage.getItem('token');
      
      // If it's a parent song (no voiceType), get all its variations
      if (!song.voiceType && !song.parentSongId) {
        console.log('Adding parent song:', song.title, '- Fetching variations...');
        const response = await fetch(getApiUrl(`/songs/${song.id}/versions`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Raw variations response:', result);
          
          // Manejar diferentes estructuras de respuesta del backend
          let variations = [];
          if (Array.isArray(result)) {
            variations = result;
          } else if (result.versions && Array.isArray(result.versions)) {
            variations = result.versions;
          } else if (result.data && Array.isArray(result.data)) {
            variations = result.data;
          } else if (result.songs && Array.isArray(result.songs)) {
            variations = result.songs;
          } else if (result.variations && Array.isArray(result.variations)) {
            variations = result.variations;
          } else {
            console.warn('Unexpected response structure:', result);
            variations = [];
          }
          
          console.log('Extracted variations array:', variations);
          
          // SOLO agregar variaciones que tienen voiceType (no elementos padre) y que no estén ya seleccionadas
          const validVariations = variations.filter((variation: Song) => {
            const hasVoiceType = variation.voiceType && variation.voiceType !== null;
            const notAlreadySelected = !selectedSongs.some(s => s.id === variation.id);
            const isNotParent = variation.parentSongId !== null; // Las variaciones tienen parentSongId
            console.log(`Variation ${variation.title}: voiceType=${variation.voiceType}, hasVoiceType=${hasVoiceType}, notAlreadySelected=${notAlreadySelected}, isNotParent=${isNotParent}`);
            return hasVoiceType && notAlreadySelected && isNotParent;
          });
          
          console.log('Valid variations to add:', validVariations);
          
          if (validVariations.length > 0) {
            setSelectedSongs(prev => [...prev, ...validVariations]);
            console.log(`Added ${validVariations.length} variations to playlist`);
          } else {
            console.warn('No se encontraron nuevas variaciones para esta canción. Total variations:', variations.length);
          }
        } else {
          console.error('Error fetching variations:', response.status, response.statusText);
        }
      } else if (song.voiceType) {
        // Si es una variación (tiene voiceType), agregarla directamente si no está ya seleccionada
        const isAlreadyAdded = selectedSongs.some(s => s.id === song.id);
        if (!isAlreadyAdded) {
          setSelectedSongs(prev => [...prev, song]);
          console.log('Added individual variation:', song.title, song.voiceType);
        }
      } else {
        console.warn('Song without voiceType and without parentSongId - this should not happen');
      }
    } catch (error) {
      console.error('Error adding song variations:', error);
      // En caso de error, NO agregamos nada si es un elemento padre
      if (song.voiceType) {
        const isAlreadyAdded = selectedSongs.some(s => s.id === song.id);
        if (!isAlreadyAdded) {
          setSelectedSongs(prev => [...prev, song]);
        }
      }
    }
  };

  // Remove song from event playlist
  const removeSongFromEvent = (songId: string) => {
    setSelectedSongs(prev => {
      // Remove the song itself
      const withoutSong = prev.filter(song => song.id !== songId);
      // Also remove any variations of this parent song
      return withoutSong.filter(song => song.parentSongId !== songId);
    });
  };

  // Add all songs from a playlist
  const addPlaylistToEvent = async (playlistId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/playlists/${playlistId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const playlistSongs = result.data.items?.map((item: PlaylistItem) => item.song) || [];
        
        const newSongs = playlistSongs.filter((song: Song) => 
          song.voiceType && !selectedSongs.some(s => s.id === song.id)
        );
        
        setSelectedSongs(prev => [...prev, ...newSongs]);
      }
    } catch (error) {
      console.error('Error loading playlist songs:', error);
    }
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

  useEffect(() => {
    if (activeTab === 'music') {
      console.log('🎵 [TAB CHANGE] Switching to music tab...');
      console.log('🎵 [TAB CHANGE] Edit mode:', editMode);
      console.log('🎵 [TAB CHANGE] Event data:', eventData?.title);
      
      loadSongs();
      loadPlaylists();
      
      // If we're in edit mode and have event data, also ensure songs are set and variations updated
      if (editMode && eventData && eventData.eventSongs) {
        console.log('🎵 [TAB CHANGE] Setting up edit mode songs...');
        const eventSongs = eventData.eventSongs.map((es: EventSong) => es.song);
        console.log('🎵 [TAB CHANGE] Event songs to set:', eventSongs.length);
        
        // Set selected songs after a short delay to ensure songs are loaded
        setTimeout(() => {
          console.log('🎵 [TAB CHANGE] Setting selected songs...');
          setSelectedSongs(eventSongs);
          // Update variations using the special edit mode function
          setTimeout(() => {
            console.log('🎵 [TAB CHANGE] Updating variations...');
            updateVariationsInfoForEditMode();
          }, 100);
        }, 200);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'music') {
      loadSongs();
    }
  }, [songSearchTerm]);

  useEffect(() => {
    if (activeTab === 'music') {
      loadPlaylists();
    }
  }, [playlistSearchTerm]);

  // Update variations info when songs or selectedSongs change
  useEffect(() => {
    console.log('🎵 [UPDATE EFFECT] Variations update effect triggered');
    console.log('🎵 [UPDATE EFFECT] activeTab:', activeTab);
    console.log('🎵 [UPDATE EFFECT] songs.length:', songs.length);
    console.log('🎵 [UPDATE EFFECT] selectedSongs.length:', selectedSongs.length);
    console.log('🎵 [UPDATE EFFECT] editMode:', editMode);
    console.log('🎵 [UPDATE EFFECT] eventData exists:', !!eventData);
    console.log('🎵 [UPDATE EFFECT] eventData.eventSongs exists:', !!(eventData && eventData.eventSongs));
    
    if (activeTab === 'music' && songs.length > 0) {
      // In edit mode, always use the special function if we have selected songs with parentSongId
      const hasVariationsWithParent = selectedSongs.some(song => song.parentSongId);
      console.log('🎵 [UPDATE EFFECT] hasVariationsWithParent:', hasVariationsWithParent);
      
      if (editMode && hasVariationsWithParent) {
        console.log('🎵 [UPDATE EFFECT] Using edit mode variations function');
        // In edit mode with variations, use the special function
        updateVariationsInfoForEditMode();
      } else {
        console.log('🎵 [UPDATE EFFECT] Using normal variations function');
        // In normal mode, use the regular function
        updateVariationsInfo();
      }
    } else {
      console.log('🎵 [UPDATE EFFECT] Conditions not met for updating variations');
    }
  }, [songs, selectedSongs, activeTab, editMode]);

  // Load event data in edit mode
  useEffect(() => {
    console.log('🔄 [EDIT LOAD] Edit mode useEffect triggered');
    console.log('🔄 [EDIT LOAD] editMode:', editMode);
    console.log('🔄 [EDIT LOAD] eventData:', eventData);
    console.log('🔄 [EDIT LOAD] Full eventData structure:', JSON.stringify(eventData, null, 2));
    
    if (editMode && eventData) {
      // Load basic info
      setTitle(eventData.title || '');
      setDescription(eventData.description || '');
      setDate(eventData.date ? eventData.date.split('T')[0] : '');
      setTime(eventData.time || '');
      setEventCity(eventData.eventCity || '');
      setEventAddress(eventData.eventAddress || '');
      setCategory(eventData.category || 'Evento');
      setIsPublic(eventData.isPublic ?? true);
      setAllowExternalJoin(eventData.allowExternalJoin ?? false);
      
      // Set city search term to show current city in the input
      if (eventData.eventCity) {
        setCitySearchTerm(eventData.eventCity);
        setEventCity(eventData.eventCity);
      }
      
      // Load attendees
      if (eventData.attendees) {
        setSelectedAttendees(eventData.attendees.map((attendee) => ({
          id: attendee.user.id,
          firstName: attendee.user.firstName,
          lastName: attendee.user.lastName,
          email: attendee.user.email || '',
          role: attendee.user.assignedRoles?.[0]?.role || 'CANTANTE',
          location: attendee.user.location ? attendee.user.location.name : '',
          addedBy: 'individual' as const
        })));
      }
      
      // Load songs - need to trigger this after music tab is loaded
      console.log('🔄 [EDIT LOAD] Checking eventData.eventSongs...');
      console.log('🔄 [EDIT LOAD] eventData.eventSongs exists:', !!eventData.eventSongs);
      console.log('🔄 [EDIT LOAD] eventData.eventSongs value:', eventData.eventSongs);
      console.log('🔄 [EDIT LOAD] eventData.eventSongs type:', typeof eventData.eventSongs);
      console.log('🔄 [EDIT LOAD] eventData.eventSongs length:', eventData.eventSongs?.length);
      
      if (eventData.eventSongs && Array.isArray(eventData.eventSongs)) {
        console.log('🔄 [EDIT LOAD] EventSongs is array with length:', eventData.eventSongs.length);
        eventData.eventSongs.forEach((es: EventSong, index: number) => {
          console.log(`🔄 [EDIT LOAD] EventSong ${index}:`, es);
          console.log(`🔄 [EDIT LOAD] EventSong ${index} song:`, es.song);
        });
      }
      
      if (eventData.eventSongs) {
        console.log('🔄 [EDIT LOAD] Processing eventSongs...');
        const eventSongs = eventData.eventSongs.map((es: EventSong) => {
          console.log('🔄 [EDIT LOAD] Mapping eventSong:', es);
          console.log('🔄 [EDIT LOAD] Extracted song:', es.song);
          return es.song;
        });
        console.log('🔄 [EDIT LOAD] Final mapped eventSongs:', eventSongs);
        setSelectedSongs(eventSongs);
        
        // If we're already on the music tab, load songs and trigger variations update
        if (activeTab === 'music') {
          // First load all songs, then set selected songs
          loadSongs().then(() => {
            setSelectedSongs(eventSongs);
          });
        }
      }
    }
  }, [editMode, eventData, activeTab]);

  // Additional effect to handle song loading in edit mode
  useEffect(() => {
    if (editMode && eventData && eventData.eventSongs && activeTab === 'music' && songs.length > 0) {
      console.log('🎵 [EDIT MODE] Setting up songs for edit mode...');
      console.log('🎵 [EDIT MODE] Event songs from data:', eventData.eventSongs);
      
      // When songs are loaded and we're in edit mode, set the selected songs and update variations
      const eventSongs = eventData.eventSongs.map((es: EventSong) => es.song);
      console.log('🎵 [EDIT MODE] Mapped event songs:', eventSongs);
      console.log('🎵 [EDIT MODE] Songs with voiceType:', eventSongs.filter((s: Song) => s.voiceType));
      
      setSelectedSongs(eventSongs);
      
      // Log what we just set
      console.log('🎵 [EDIT MODE] Just set selectedSongs to:', eventSongs);
      console.log('🎵 [EDIT MODE] Songs with voiceType count:', eventSongs.filter((s: Song) => s.voiceType).length);
      console.log('🎵 [EDIT MODE] All voiceTypes found:', eventSongs.filter((s: Song) => s.voiceType).map((s: Song) => s.voiceType));
      
      // Use the special edit mode function to update variations
      setTimeout(() => {
        console.log('🎵 [EDIT MODE] About to update variations info...');
        updateVariationsInfoForEditMode();
      }, 200);
    }
  }, [editMode, eventData, activeTab, songs.length]);

  const handleSubmit = async () => {
    if (!title || !date) {
      setError('El título y la fecha son obligatorios');
      return;
    }

    // Validar que se hayan completado todas las fases necesarias
    if (selectedAttendees.length === 0) {
      setError('Debes seleccionar al menos un asistente para el evento');
      return;
    }

    const songsWithVoiceType = selectedSongs.filter(song => song.voiceType);
    if (songsWithVoiceType.length === 0) {
      setError('Debes seleccionar al menos una canción para el evento');
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

      // Add selected songs (only variations with voiceType)
      const songsWithVoiceType = selectedSongs.filter(song => song.voiceType);
      console.log('🎵 Songs with voiceType:', songsWithVoiceType);
      if (songsWithVoiceType.length > 0) {
        const songIds = songsWithVoiceType.map(song => song.id);
        console.log('🎵 Sending songIds:', songIds);
        formData.append('songIds', JSON.stringify(songIds));
      }

      const url = editMode ? `/events/${eventData?.id}` : '/events';
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(getApiUrl(url), {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Mostrar mensaje de éxito
        const action = editMode ? 'actualizado' : 'creado';
        alert(`¡Evento "${title}" ${action} exitosamente! ${songsWithVoiceType.length > 0 ? `Se ${editMode ? 'actualizaron' : 'agregaron'} ${songsWithVoiceType.length} canciones.` : ''}`);
        
        onEventCreated(result);
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Error al ${editMode ? 'actualizar' : 'crear'} el evento`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError('Error de conexión al crear el evento');
    }
    setIsLoading(false);
  };

  // Update variations info for all parent songs
  const updateVariationsInfo = async () => {
    if (songs.length === 0) return;
    
    const info: Record<string, {total: number, selected: number, isComplete: boolean}> = {};
    
    for (const song of songs) {
      if (!song.voiceType && !song.parentSongId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(getApiUrl(`/songs/${song.id}/versions`), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            
            // Manejar diferentes estructuras de respuesta del backend
            let allVariations = [];
            if (Array.isArray(result)) {
              allVariations = result;
            } else if (result.versions && Array.isArray(result.versions)) {
              allVariations = result.versions;
            } else if (result.data && Array.isArray(result.data)) {
              allVariations = result.data;
            } else if (result.songs && Array.isArray(result.songs)) {
              allVariations = result.songs;
            } else {
              allVariations = [];
            }
            
            // Filtrar solo variaciones válidas (con voiceType)
            const validVariations = allVariations.filter((variation: Song) => 
              variation.voiceType && variation.voiceType !== null
            );
            
            // Contar cuántas variaciones están seleccionadas
            const selectedCount = selectedSongs.filter(s => s.parentSongId === song.id).length;
            
            info[song.id] = {
              total: validVariations.length,
              selected: selectedCount,
              isComplete: validVariations.length > 0 && selectedCount === validVariations.length
            };
          }
        } catch (error) {
          console.error('Error getting variations info for song:', song.id, error);
          info[song.id] = { total: 0, selected: 0, isComplete: false };
        }
      }
    }
    
    setVariationsInfo(info);
  };

  // Special function to handle variations in edit mode
  const updateVariationsInfoForEditMode = async () => {
    if (!editMode) {
      console.log('🎵 [VARIATIONS] Not in edit mode, skipping');
      return;
    }
    
    // Use selectedSongs if available, otherwise use eventData
    let songsToProcess = [];
    if (selectedSongs.length > 0) {
      songsToProcess = selectedSongs;
      console.log('🎵 [VARIATIONS] Using selectedSongs:', songsToProcess);
    } else if (eventData && eventData.eventSongs) {
      songsToProcess = eventData.eventSongs.map((es: EventSong) => es.song);
      console.log('🎵 [VARIATIONS] Using eventData songs:', songsToProcess);
    } else {
      console.log('🎵 [VARIATIONS] No songs to process');
      return;
    }
    
    console.log('🎵 [VARIATIONS] Updating variations info for edit mode...');
    console.log('🎵 [VARIATIONS] Processing songs:', songsToProcess);
    
    // Find unique parent song IDs from the selected variations
    const parentSongIds = [...new Set(
      songsToProcess
        .filter((song: Song) => song.parentSongId)
        .map((song: Song) => song.parentSongId)
    )];
    
    console.log('🎵 [VARIATIONS] Parent song IDs found:', parentSongIds);
    
    if (parentSongIds.length === 0) {
      console.log('🎵 [VARIATIONS] No parent song IDs found, no variations to update');
      return;
    }
    
    const info: Record<string, {total: number, selected: number, isComplete: boolean}> = {};
    
    // For each parent song, get all its variations
    for (const parentId of parentSongIds) {
      try {
        console.log(`🎵 [VARIATIONS] Processing parent ${parentId}...`);
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl(`/songs/${parentId as string}/versions`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`🎵 [VARIATIONS] Raw response for ${parentId}:`, result);
          
          // Manejar diferentes estructuras de respuesta del backend
          let allVariations = [];
          if (Array.isArray(result)) {
            allVariations = result;
          } else if (result.versions && Array.isArray(result.versions)) {
            allVariations = result.versions;
          } else if (result.data && Array.isArray(result.data)) {
            allVariations = result.data;
          } else if (result.songs && Array.isArray(result.songs)) {
            allVariations = result.songs;
          } else {
            allVariations = [];
          }
          
          console.log(`🎵 [VARIATIONS] All variations for ${parentId}:`, allVariations);
          
          // Filtrar solo variaciones válidas (con voiceType)
          const validVariations = allVariations.filter((variation: Song) => 
            variation.voiceType && variation.voiceType !== null
          );
          
          console.log(`🎵 [VARIATIONS] Valid variations for ${parentId}:`, validVariations);
          
          // Contar cuántas variaciones están seleccionadas
          const selectedCount = songsToProcess.filter((s: Song) => s.parentSongId === parentId).length;
          
          console.log(`🎵 [VARIATIONS] Parent ${parentId}: ${selectedCount}/${validVariations.length} variations selected`);
          
          info[parentId as string] = {
            total: validVariations.length,
            selected: selectedCount,
            isComplete: validVariations.length > 0 && selectedCount === validVariations.length
          };
        } else {
          console.error(`🎵 [VARIATIONS] Failed to fetch variations for ${parentId}:`, response.status);
        }
      } catch (error) {
        console.error('Error getting variations info for parent song:', parentId, error);
        info[parentId as string] = { total: 0, selected: 0, isComplete: false };
      }
    }
    
    console.log('🎵 [VARIATIONS] Final variations info:', info);
    setVariationsInfo(info);
  };

  // Audio control functions
  const playAudio = (song: Song) => {
    if (!song.filePath) return;
    
    // Stop current audio if playing
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    }
    
    // If clicking the same song, toggle play/pause
    if (currentPlayingSongId === song.id && currentPlayingAudio && !currentPlayingAudio.paused) {
      currentPlayingAudio.pause();
      setCurrentPlayingSongId(null);
      return;
    }
    
    // Create new audio element
    // Parse filePath to extract folder and filename
    // Format: "songs\folderName\fileName.mp3"
    const pathParts = song.filePath.split('\\');
    let audioUrl: string;
    
    if (pathParts.length >= 3 && pathParts[0] === 'songs') {
      // Use the specific song file URL endpoint
      const folderName = pathParts[1];
      const fileName = pathParts[2];
      audioUrl = getSongFileUrl(folderName, fileName);
    } else {
      // Fallback to the original method
      audioUrl = getApiUrl(`/uploads/${song.filePath}`);
    }
    
    const audio = new Audio(audioUrl);
    audio.volume = 0.5; // Set volume to 50%
    
    audio.onended = () => {
      setCurrentPlayingSongId(null);
      setCurrentPlayingAudio(null);
    };
    
    audio.onerror = () => {
      console.error('Error loading audio file:', song.filePath);
      setCurrentPlayingSongId(null);
      setCurrentPlayingAudio(null);
    };
    
    audio.play().then(() => {
      setCurrentPlayingAudio(audio);
      setCurrentPlayingSongId(song.id);
    }).catch(error => {
      console.error('Error playing audio:', error);
    });
  };

  const stopAudio = useCallback(() => {
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
      setCurrentPlayingAudio(null);
      setCurrentPlayingSongId(null);
    }
  }, [currentPlayingAudio]);

  // Stop audio when modal closes or tab changes
  const handleTabChange = (newTab: 'basic' | 'attendees' | 'music') => {
    if (newTab !== 'music') {
      stopAudio();
    }
    setActiveTab(newTab);
  };

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Handle modal close with audio cleanup
  const handleClose = () => {
    stopAudio();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-2">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:w-auto sm:h-auto sm:max-w-[95vw] sm:max-h-[98vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-3 sm:px-6 py-3 sm:py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold">
              {editMode ? 'Editar Programa' : 'Crear Nuevo Programa'}
            </h2>
            <button 
              onClick={handleClose} 
              className="p-1 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-8 px-3 sm:px-6 overflow-x-auto scrollbar-hide">
            {[
              { 
                id: 'basic', 
                label: 'Información Básica',
                shortLabel: 'Info',
                icon: Calendar, 
                hasData: title && date 
              },
              { 
                id: 'attendees', 
                label: 'Asistentes',
                shortLabel: 'Asistentes', 
                icon: Users, 
                hasData: selectedAttendees.length > 0 
              },
              { 
                id: 'music', 
                label: 'Música',
                shortLabel: 'Música',
                icon: Music, 
                hasData: selectedSongs.filter(song => song.voiceType).length > 0 
              },
            ].map(({ id, label, shortLabel, icon: Icon, hasData }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id as 'basic' | 'attendees' | 'music')}
                className={`py-3 sm:py-4 px-2 sm:px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 transition-colors relative flex-shrink-0 ${
                  activeTab === id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
                {hasData && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
                {id === 'attendees' && selectedAttendees.length > 0 && (
                  <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {selectedAttendees.length}
                  </span>
                )}
                {id === 'music' && selectedSongs.filter(song => song.voiceType).length > 0 && (
                  <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {selectedSongs.filter(song => song.voiceType).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Título del Programa *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Ej: Culto de Adoración - Domingo"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  placeholder="Describe el programa..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="Evento">Evento</option>
                  <option value="Ensayo">Ensayo</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Ciudad del Programa
                  </label>
                  <input
                    type="text"
                    value={citySearchTerm}
                    onChange={(e) => {
                      setCitySearchTerm(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Buscar ciudad..."
                  />
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setEventCity(city);
                            setCitySearchTerm(city);
                            setShowCityDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={eventAddress}
                    onChange={(e) => setEventAddress(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Dirección del programa"
                  />
                </div>
              </div>

              {/* Visibility Settings */}
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 flex items-center">
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Configuración de Visibilidad
                </h4>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className={`p-1 sm:p-2 rounded-lg transition-colors ${
                        isPublic 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {isPublic ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </button>
                    <div>
                      <label className="text-sm sm:text-base font-medium text-gray-900">
                        Programa Público
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {isPublic 
                          ? 'Visible para todos los cantantes' 
                          : 'Solo visible para cantantes seleccionados'}
                      </p>
                    </div>
                  </div>

                  {isPublic && (
                    <div className="flex items-center space-x-2 sm:space-x-3 pl-8 sm:pl-11">
                      <button
                        onClick={() => setAllowExternalJoin(!allowExternalJoin)}
                        className={`p-1 sm:p-2 rounded-lg transition-colors ${
                          allowExternalJoin 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <div>
                        <label className="text-sm sm:text-base font-medium text-gray-900">
                          Abierto a Postulaciones
                        </label>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Los cantantes pueden solicitar unirse al evento
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendees' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h4 className="text-base sm:text-lg font-medium text-gray-900">
                  Gestión de Cantantes del Programa
                </h4>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => setShowGroupSelection(!showGroupSelection)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                      showGroupSelection 
                        ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    <span className="hidden sm:inline">
                      {showGroupSelection ? 'Selección Individual' : 'Selección por Ubicación'}
                    </span>
                    <span className="sm:hidden">
                      {showGroupSelection ? 'Individual' : 'Por Ubicación'}
                    </span>
                  </button>
                  <span className="text-xs sm:text-sm text-gray-500 px-2 py-1 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    {selectedAttendees.length} seleccionados
                  </span>
                </div>
              </div>

              {/* Diseño responsive: una columna en móvil, dos en desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-auto lg:h-[600px]">
                {/* Columna izquierda: Filtros y búsqueda */}
                <div className="space-y-3 sm:space-y-4 lg:border-r border-gray-200 lg:pr-6">
                  <div className="sticky top-0 bg-white">
                    <h5 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Filtros de Búsqueda</h5>
                    
                    {/* Search and Filters - Solo mostrar si no está activa la selección por grupo */}
                    {!showGroupSelection && (
                      <div className="space-y-2 sm:space-y-3">
                        {/* Filtros adaptables */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                              <Search className="h-3 w-3 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Buscar nombre..."
                              value={singerSearchTerm}
                              onChange={(e) => setSingerSearchTerm(e.target.value)}
                              className="w-full pl-7 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>

                          <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
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
                            className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="">Todos los roles</option>
                            <option value="cantante">Cantante</option>
                            <option value="director">Director</option>
                          </select>
                        </div>

                        {/* Lista de cantantes encontrados */}
                        <div className="border border-gray-200 rounded-lg">
                          <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                            <h6 className="text-sm sm:text-base font-medium text-gray-900 flex items-center">
                              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Cantantes Encontrados
                              {loadingSingers && (
                                <div className="ml-2 animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                              )}
                            </h6>
                          </div>
                          
                          <div className="max-h-80 overflow-y-auto">
                            {singers.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                <Users className="mx-auto h-6 w-6 text-gray-300 mb-2" />
                                <p className="text-sm">No se encontraron cantantes</p>
                                <p className="text-xs">Intenta ajustar los filtros</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-200">
                                {singers.map(singer => {
                                  const isSelected = selectedAttendees.some(a => a.id === singer.id);
                                  return (
                                    <div
                                      key={singer.id}
                                      className={`p-2 hover:bg-gray-50 transition-colors ${
                                        isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => isSelected ? removeAttendee(singer.id) : addSingerToAttendees(singer)}
                                            className={`p-1 rounded border transition-colors ${
                                              isSelected
                                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                            }`}
                                          >
                                            {isSelected ? <Check className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                          </button>
                                          
                                          <div>
                                            <h6 className="font-medium text-gray-900 text-sm">
                                              {singer.firstName} {singer.lastName}
                                            </h6>
                                            <p className="text-xs text-gray-500">
                                              {singer.email}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="text-right">
                                          <div className="flex flex-wrap gap-1 justify-end mb-1">
                                            {singer.assignedRoles?.map((roleObj, index) => (
                                              <span
                                                key={index}
                                                className="inline-block px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                                              >
                                                {roleObj.role}
                                              </span>
                                            ))}
                                          </div>
                                          <p className="text-xs text-gray-500 flex items-center justify-end">
                                            <MapPin className="h-2 w-2 mr-1" />
                                            {singer.location?.name}
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
                      </div>
                    )}

                    {/* Group Selection Mode */}
                    {showGroupSelection && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h6 className="font-medium text-purple-900 mb-3 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Selección por Ubicación
                        </h6>
                        <div className="space-y-3">
                          {/* Opción especial para todos los coristas */}
                          <button
                            onClick={() => addAllSingersToEvent()}
                            className="w-full text-left p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border border-indigo-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-between shadow-lg"
                          >
                            <div>
                              <div className="font-bold text-white">🎵 Todos los Coristas</div>
                              <div className="text-sm text-indigo-100">Todas las ubicaciones</div>
                              <div className="text-xs text-indigo-200">
                                {singerLocations.reduce((total, loc) => total + loc.singersCount, 0)} cantantes
                              </div>
                            </div>
                            <Plus className="h-5 w-5 text-white" />
                          </button>
                          
                          {/* Ubicaciones individuales */}
                          {singerLocations.map(location => (
                            <button
                              key={location.id}
                              onClick={() => showLocationConfirmation(location.id)}
                              className="w-full text-left p-3 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium text-purple-900">{location.name}</div>
                                <div className="text-sm text-purple-600">{location.city}</div>
                                <div className="text-xs text-purple-500">{location.singersCount} cantantes</div>
                              </div>
                              <Plus className="h-5 w-5 text-green-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna derecha: Lista de cantantes seleccionados */}
                <div className="lg:pl-6 mt-6 lg:mt-0">
                  <div className="h-full flex flex-col">
                    <h5 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Cantantes Seleccionados ({selectedAttendees.length})
                    </h5>

                    {selectedAttendees.length === 0 ? (
                      <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">No hay cantantes seleccionados</p>
                          <p className="text-sm">Selecciona cantantes de la lista de la izquierda</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">
                            Lista de Asistentes al Evento
                          </span>
                          <button
                            onClick={clearAllAttendees}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Limpiar Todo
                          </button>
                        </div>
                        
                        <div className="h-full overflow-y-auto">
                          <div className="divide-y divide-gray-200">
                            {selectedAttendees.map((attendee, index) => (
                              <div
                                key={attendee.id}
                                className="p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <h6 className="font-medium text-gray-900">
                                        {attendee.firstName} {attendee.lastName}
                                      </h6>
                                      <p className="text-sm text-gray-500">
                                        {attendee.email}
                                      </p>
                                      {attendee.addedBy === 'group' && (
                                        <p className="text-xs text-green-600">
                                          Agregado por ubicación: {attendee.groupName}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                      {attendee.role}
                                    </span>
                                    <button
                                      onClick={() => removeAttendee(attendee.id)}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mensaje para selección por grupo */}
                    {showGroupSelection && selectedAttendees.length === 0 && (
                      <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">Selección por Ubicación Activa</p>
                          <p className="text-sm">Usa los botones de la izquierda para seleccionar cantantes por ubicación</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'music' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h4 className="text-base sm:text-lg font-medium text-gray-900">
                  Gestión de Música del Programa
                </h4>
                <span className="text-xs sm:text-sm text-gray-500 px-2 py-1 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  {selectedSongs.filter(song => song.voiceType).length} canciones seleccionadas
                </span>
              </div>

              {/* Diseño responsive: una columna en móvil, dos en desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-auto lg:h-[600px]">
                {/* Columna izquierda: Filtros y búsqueda de música */}
                <div className="space-y-3 sm:space-y-4 lg:border-r border-gray-200 lg:pr-6">
                  <div className="sticky top-0 bg-white">
                    <h5 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Búsqueda de Música</h5>
                    
                    {/* Song Search */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <Search className="h-3 w-3 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar canciones..."
                            value={songSearchTerm}
                            onChange={(e) => setSongSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <Search className="h-3 w-3 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar playlists..."
                            value={playlistSearchTerm}
                            onChange={(e) => setPlaylistSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Songs List */}
                      <div className="border border-gray-200 rounded-lg">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h6 className="font-medium text-gray-900 flex items-center">
                            <Music className="h-4 w-4 mr-2" />
                            Canciones Disponibles
                            {loadingSongs && (
                              <div className="ml-2 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            )}
                          </h6>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                          {songs.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <Music className="mx-auto h-6 w-6 text-gray-300 mb-2" />
                              <p className="text-sm">No se encontraron canciones</p>
                              <p className="text-xs">Intenta ajustar la búsqueda</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {songs.map(song => {
                                const songInfo = variationsInfo[song.id] || { total: 0, selected: 0, isComplete: false };
                                const hasVariations = songInfo.selected > 0;
                                const isCompletelySelected = songInfo.isComplete;
                                
                                return (
                                  <div
                                    key={song.id}
                                    className={`p-2 hover:bg-gray-50 transition-colors ${
                                      isCompletelySelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 
                                      hasVariations ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => {
                                            if (hasVariations) {
                                              // Remove all variations of this parent song
                                              setSelectedSongs(prev => prev.filter(s => s.parentSongId !== song.id));
                                            } else {
                                              addSongToEvent(song);
                                            }
                                          }}
                                          className={`p-1 rounded border transition-colors ${
                                            isCompletelySelected
                                              ? 'bg-indigo-500 border-indigo-500 text-white'
                                              : hasVariations
                                              ? 'bg-yellow-400 border-yellow-400 text-white'
                                              : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                          }`}
                                        >
                                          {isCompletelySelected ? <Check className="h-3 w-3" /> : 
                                           hasVariations ? <span className="text-xs font-bold">!</span> : 
                                           <Plus className="h-3 w-3" />}
                                        </button>

                                        {/* Solo mostrar play si es una variación (tiene voiceType) */}
                                        {song.voiceType && song.filePath && (
                                          <button
                                            onClick={() => playAudio(song)}
                                            className={`p-1 rounded border transition-colors ${
                                              currentPlayingSongId === song.id
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                                            }`}
                                            title={currentPlayingSongId === song.id ? 'Pausar' : 'Reproducir'}
                                          >
                                            {currentPlayingSongId === song.id ? 
                                              <Pause className="h-3 w-3" /> : 
                                              <Play className="h-3 w-3" />
                                            }
                                          </button>
                                        )}
                                        
                                        <div>
                                          <h6 className="font-medium text-gray-900 text-sm">
                                            {song.title}
                                          </h6>
                                          <p className="text-xs text-gray-500">
                                            {song.artist}
                                            {hasVariations && (
                                              <span className={`ml-2 text-xs font-medium ${
                                                isCompletelySelected 
                                                  ? 'text-indigo-600' 
                                                  : 'text-yellow-600'
                                              }`}>
                                                ({songInfo.selected}/{songInfo.total} variaciones)
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="text-right">
                                        {song.voiceType && (
                                          <span className="inline-block px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                            {song.voiceType}
                                          </span>
                                        )}
                                        {songInfo.total > 0 && (
                                          <div className="text-xs text-gray-400 mt-1">
                                            {songInfo.total} voces
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Playlists List */}
                      <div className="border border-gray-200 rounded-lg">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <h6 className="font-medium text-gray-900 text-sm flex items-center">
                            <Users className="h-3 w-3 mr-2" />
                            Playlists Disponibles
                            {loadingPlaylists && (
                              <div className="ml-2 animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            )}
                          </h6>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto">
                          {playlists.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <Users className="mx-auto h-4 w-4 text-gray-300 mb-2" />
                              <p className="text-sm">No se encontraron playlists</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {playlists.map(playlist => (
                                <div
                                  key={playlist.id}
                                  className="p-2 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => addPlaylistToEvent(playlist.id)}
                                        className="p-1 rounded border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                      
                                      <div>
                                        <h6 className="font-medium text-gray-900 text-sm">
                                          {playlist.name}
                                        </h6>
                                        <p className="text-xs text-gray-500">
                                          Por {playlist.user.firstName} {playlist.user.lastName}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <span className="inline-block px-1 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                      {playlist._count.items} canciones
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna derecha: Lista de canciones seleccionadas */}
                <div className="lg:pl-6 mt-6 lg:mt-0">
                  <div className="h-full flex flex-col">
                    <h5 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="text-sm sm:text-base">Canciones Seleccionadas ({selectedSongs.filter(song => song.voiceType).length})</span>
                    </h5>

                    {selectedSongs.filter(song => song.voiceType).length === 0 ? (
                      <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center p-4">
                        <div className="text-center text-gray-500">
                          <Music className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                          <p className="text-base sm:text-lg font-medium">No hay canciones seleccionadas</p>
                          <p className="text-xs sm:text-sm">Selecciona canciones de la lista de arriba</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-green-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-green-200 flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium text-green-900">
                            Lista de Reproducción del Programa
                          </span>
                          <button
                            onClick={() => setSelectedSongs([])}
                            className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium flex items-center"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Limpiar Todo</span>
                            <span className="sm:hidden">Limpiar</span>
                          </button>
                        </div>
                        
                        <div className="h-full overflow-y-auto">
                          <div className="divide-y divide-gray-200">
                            {selectedSongs
                              .filter(song => song.voiceType) // Solo mostrar variaciones con voiceType
                              .map((song, index) => (
                              <div
                                key={song.id}
                                className="p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <h6 className="font-medium text-gray-900">
                                        {song.title}
                                      </h6>
                                      <p className="text-sm text-gray-500">
                                        {song.artist}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    {song.voiceType && (
                                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        {song.voiceType}
                                      </span>
                                    )}
                                    
                                    {song.filePath && (
                                      <button
                                        onClick={() => playAudio(song)}
                                        className={`p-1 rounded border transition-colors ${
                                          currentPlayingSongId === song.id
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                                        }`}
                                        title={currentPlayingSongId === song.id ? 'Pausar' : 'Reproducir'}
                                      >
                                        {currentPlayingSongId === song.id ? 
                                          <Pause className="h-4 w-4" /> : 
                                          <Play className="h-4 w-4" />
                                        }
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => removeSongFromEvent(song.id)}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-2 sm:px-6 py-2 sm:py-4 flex-shrink-0">
          {/* Mobile Layout - Single Row */}
          <div className="sm:hidden">
            <div className="flex space-x-1 mb-2">
              {activeTab !== 'basic' && (
                <button
                  onClick={() => {
                    const tabs = ['basic', 'attendees', 'music'];
                    const currentIndex = tabs.indexOf(activeTab);
                    handleTabChange(tabs[currentIndex - 1] as 'basic' | 'attendees' | 'music');
                  }}
                  className="flex-1 px-2 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Anterior
                </button>
              )}
              {activeTab !== 'music' && (
                <button
                  onClick={() => {
                    const tabs = ['basic', 'attendees', 'music'];
                    const currentIndex = tabs.indexOf(activeTab);
                    handleTabChange(tabs[currentIndex + 1] as 'basic' | 'attendees' | 'music');
                  }}
                  className="flex-1 px-2 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Siguiente →
                </button>
              )}
            </div>
            <div className="flex space-x-1">
              <button
                onClick={handleClose}
                className="flex-1 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !title || 
                  !date || 
                  isLoading || 
                  selectedAttendees.length === 0 || 
                  selectedSongs.filter(song => song.voiceType).length === 0
                }
                className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {editMode ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex sm:justify-between sm:items-center">
            <div className="flex space-x-3">
              {activeTab !== 'basic' && (
                <button
                  onClick={() => {
                    const tabs = ['basic', 'attendees', 'music'];
                    const currentIndex = tabs.indexOf(activeTab);
                    handleTabChange(tabs[currentIndex - 1] as 'basic' | 'attendees' | 'music');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
              )}
              {activeTab !== 'music' && (
                <button
                  onClick={() => {
                    const tabs = ['basic', 'attendees', 'music'];
                    const currentIndex = tabs.indexOf(activeTab);
                    handleTabChange(tabs[currentIndex + 1] as 'basic' | 'attendees' | 'music');
                  }}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Siguiente
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !title || 
                  !date || 
                  isLoading || 
                  selectedAttendees.length === 0 || 
                  selectedSongs.filter(song => song.voiceType).length === 0
                }
                className="px-6 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {editMode ? 'Actualizar Programa' : 'Crear Programa'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Confirmation Modal */}
      {showLocationConfirm && locationToAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirmar Selección de Ubicación
            </h3>
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de que quieres agregar todos los cantantes de{' '}
              <strong>{locationToAdd?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Se agregarán <strong>{locationToAdd?.singersCount}</strong> cantantes de{' '}
              <strong>{locationToAdd?.city}</strong> al evento.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowLocationConfirm(false);
                  setLocationToAdd(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addLocationGroupToAttendees}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEventModal;
