import { useState, useEffect } from 'react';
import api from '../services/api';
import type { VoiceType } from '../types';

export interface VoiceTypeOption {
  value: VoiceType;
  label: string;
  color: string;
}

const voiceTypeMapping: Record<VoiceType, { label: string; color: string }> = {
  SOPRANO: { label: 'Soprano', color: 'bg-pink-100 text-pink-800' },
  CONTRALTO: { label: 'Contralto', color: 'bg-purple-100 text-purple-800' },
  TENOR: { label: 'Tenor', color: 'bg-blue-100 text-blue-800' },
  BARITONO: { label: 'Barítono', color: 'bg-green-100 text-green-800' },
  MESOSOPRANO: { label: 'Mezzosoprano', color: 'bg-indigo-100 text-indigo-800' },
  BAJO: { label: 'Bajo', color: 'bg-yellow-100 text-yellow-800' },
  CORO: { label: 'Coro', color: 'bg-orange-100 text-orange-800' }
};

export const useVoiceTypes = () => {
  const [voiceTypes, setVoiceTypes] = useState<VoiceTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllVoiceTypes = (): VoiceTypeOption[] => {
    return Object.entries(voiceTypeMapping).map(([value, { label, color }]) => ({
      value: value as VoiceType,
      label,
      color
    }));
  };

  const getUserVoiceTypes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/users/me/voice-profiles');
      const userVoices: VoiceType[] = response.data.voiceProfiles?.map((profile: any) => profile.voiceType) || [];
      
      // Siempre incluir CORO para todos los usuarios
      const userVoiceTypesSet = new Set([...userVoices, 'CORO']);
      
      const availableVoiceTypes = Object.entries(voiceTypeMapping)
        .filter(([value]) => userVoiceTypesSet.has(value as VoiceType))
        .map(([value, { label, color }]) => ({
          value: value as VoiceType,
          label,
          color
        }));
      
      setVoiceTypes(availableVoiceTypes);
      return availableVoiceTypes;
    } catch (err) {
      setError('Error al cargar tipos de voz del usuario');
      console.error('Error fetching user voice types:', err);
      
      // Fallback: devolver solo CORO si hay error
      const fallbackVoices = [{
        value: 'CORO' as VoiceType,
        label: 'Coro',
        color: 'bg-orange-100 text-orange-800'
      }];
      setVoiceTypes(fallbackVoices);
      return fallbackVoices;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserVoiceTypes();
  }, []);

  return {
    voiceTypes,
    loading,
    error,
    getAllVoiceTypes,
    getUserVoiceTypes,
    refresh: getUserVoiceTypes
  };
};
